/**
 * DatasetBuilder — pure orchestration service that assembles a
 * HistoricalCalibrationDataset from raw observations.
 *
 * Pipeline (strict order, all-or-nothing):
 *   1. Input validation: datasetId, createdAt, options, sourceType.
 *   2. Defensive copy of the observation list (input never mutated).
 *   3. Observation shape validation (minimal contract defence).
 *   4. Schema version check (never mixed, never migrated).
 *   5. Selection filters (temporal → target type → strategy → calibration
 *      identity); every exclusion is counted by reason — never silent.
 *   6. Duplicate detection (identity, prediction, logical pair).
 *   7. Canonical sort (predictionCreatedAt → spinId → predictionId →
 *      outcomeId → observationId).
 *   8. Statistics + covered period (pure derivations).
 *   9. Manifest (provenance) + canonical hashes.
 *  10. Deep-frozen snapshot.
 *
 * No IO, no global clock (createdAt is caller-injected), no randomness,
 * no persistence. `hashFn` defaults to the stable CanonicalHash
 * (SHA-256, canonical serialisation — src/calibration, Fase P2.2) and can
 * be injected for testability.
 *
 * Exclusion policy:
 * - `invalidObservationPolicy: 'REJECT_DATASET'` (default) — any invalid
 *   observation aborts the whole assembly.
 * - `EXCLUDE_AND_REPORT` — invalid rows are dropped and counted under
 *   'INVALID_OBSERVATION' in the manifest.
 * - Filter exclusions are always counted, one reason per observation
 *   (the first filter that excluded it, in application order).
 */

import {
  createDatasetAssemblyOptions,
  createDatasetStatistics,
  createDatasetManifest,
  createHistoricalCalibrationDataset,
  canonicalSortObservations,
  deriveDatasetPeriod,
  CANONICAL_SORT_ORDER,
  DATASET_BUILDER_VERSION,
  CALIBRATION_OBSERVATION_SCHEMA_VERSION,
  HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
  isIsoTimestamp,
  InvalidDatasetIdError,
  InvalidDatasetTimestampError,
  InvalidDatasetOptionsError,
  InvalidDatasetObservationError,
  UnsupportedObservationSchemaError,
  DuplicateDatasetObservationError,
  EmptyHistoricalDatasetError,
} from '../domain/index.js';
import { canonicalHashSync } from '../../calibration/CanonicalHash.js';
import { projectScientificDataset, projectObservation } from './CanonicalDatasetSerializer.js';

const SUPPORTED_SOURCE_TYPES = Object.freeze(['IN_MEMORY_REPOSITORY', 'PROVIDED_COLLECTION']);

/**
 * Minimal contract defence: an observation must look like a valid
 * CalibrationObservation. The factory already guarantees this for
 * layer-created records; this protects PROVIDED_COLLECTION inputs.
 *
 * @param {*} obs
 * @returns {boolean}
 */
function hasValidShape(obs) {
  if (typeof obs !== 'object' || obs === null) return false;
  if (typeof obs.observationId !== 'string' || obs.observationId.length === 0) return false;
  if (typeof obs.predictionId !== 'string' || obs.predictionId.length === 0) return false;
  if (typeof obs.outcomeId !== 'string' || obs.outcomeId.length === 0) return false;
  if (typeof obs.spinId !== 'string' || obs.spinId.length === 0) return false;
  if (typeof obs.target !== 'object' || obs.target === null) return false;
  if (typeof obs.target.type !== 'string' || obs.target.type.length === 0) return false;
  if (
    typeof obs.rawConsensusScore !== 'number' ||
    !Number.isFinite(obs.rawConsensusScore) ||
    obs.rawConsensusScore < 0 ||
    obs.rawConsensusScore > 1
  ) {
    return false;
  }
  if (obs.observedOutcome !== 0 && obs.observedOutcome !== 1) return false;
  if (typeof obs.predictionCreatedAt !== 'string' || !isIsoTimestamp(obs.predictionCreatedAt)) {
    return false;
  }
  if (typeof obs.outcomeRecordedAt !== 'string' || !isIsoTimestamp(obs.outcomeRecordedAt)) {
    return false;
  }
  return true;
}

/**
 * Build the normalised filter descriptors for the manifest (only active
 * filters, in fixed application order).
 *
 * @param {DatasetAssemblyOptions} options
 * @returns {object[]}
 */
function buildFilterDescriptors(options) {
  const filters = [];
  if (options.predictionCreatedFrom !== null) {
    filters.push({ type: 'PREDICTION_CREATED_FROM', value: options.predictionCreatedFrom });
  }
  if (options.predictionCreatedTo !== null) {
    filters.push({ type: 'PREDICTION_CREATED_TO', value: options.predictionCreatedTo });
  }
  if (options.outcomeRecordedFrom !== null) {
    filters.push({ type: 'OUTCOME_RECORDED_FROM', value: options.outcomeRecordedFrom });
  }
  if (options.outcomeRecordedTo !== null) {
    filters.push({ type: 'OUTCOME_RECORDED_TO', value: options.outcomeRecordedTo });
  }
  if (options.includeTargetTypes !== null) {
    filters.push({ type: 'INCLUDE_TARGET_TYPES', values: [...options.includeTargetTypes] });
  }
  if (options.includeCalibrationStrategies !== null) {
    filters.push({
      type: 'INCLUDE_CALIBRATION_STRATEGIES',
      values: [...options.includeCalibrationStrategies],
    });
  }
  if (options.excludeCalibrationStrategies !== null) {
    filters.push({
      type: 'EXCLUDE_CALIBRATION_STRATEGIES',
      values: [...options.excludeCalibrationStrategies],
    });
  }
  if (options.requireCalibration) {
    filters.push({ type: 'REQUIRE_CALIBRATION' });
  }
  if (options.requireModelIdentity) {
    filters.push({ type: 'REQUIRE_MODEL_IDENTITY' });
  }
  return filters;
}

/**
 * Selection pass. Applies filters in a fixed order and counts the FIRST
 * reason that excluded each observation (reasons are disjoint per row).
 *
 * @param {CalibrationObservation[]} observations — valid, schema-checked
 * @param {DatasetAssemblyOptions} options
 * @param {object} exclusionsByReason — mutated: { REASON: count }
 * @returns {CalibrationObservation[]} selected observations
 */
function applyFilters(observations, options, exclusionsByReason) {
  // Only ACTIVE filters are evaluated (null = no filter). Predicates are
  // applied in fixed order and the FIRST reason that excluded a row is
  // counted — reasons are disjoint per row.
  const activeFilters = [];
  if (options.predictionCreatedFrom !== null) {
    activeFilters.push(['PREDICTION_CREATED_FROM', (o) => o.predictionCreatedAt >= options.predictionCreatedFrom]);
  }
  if (options.predictionCreatedTo !== null) {
    activeFilters.push(['PREDICTION_CREATED_TO', (o) => o.predictionCreatedAt <= options.predictionCreatedTo]);
  }
  if (options.outcomeRecordedFrom !== null) {
    activeFilters.push(['OUTCOME_RECORDED_FROM', (o) => o.outcomeRecordedAt >= options.outcomeRecordedFrom]);
  }
  if (options.outcomeRecordedTo !== null) {
    activeFilters.push(['OUTCOME_RECORDED_TO', (o) => o.outcomeRecordedAt <= options.outcomeRecordedTo]);
  }
  if (options.includeTargetTypes !== null) {
    activeFilters.push(['INCLUDE_TARGET_TYPES', (o) => options.includeTargetTypes.includes(o.target.type)]);
  }
  if (options.includeCalibrationStrategies !== null) {
    activeFilters.push([
      'INCLUDE_CALIBRATION_STRATEGIES',
      (o) => o.calibration !== null && options.includeCalibrationStrategies.includes(o.calibration.strategyName),
    ]);
  }
  if (options.excludeCalibrationStrategies !== null) {
    activeFilters.push([
      'EXCLUDE_CALIBRATION_STRATEGIES',
      (o) => !(o.calibration !== null && options.excludeCalibrationStrategies.includes(o.calibration.strategyName)),
    ]);
  }
  if (options.requireCalibration) {
    activeFilters.push(['REQUIRE_CALIBRATION', (o) => o.calibration !== null]);
  }
  if (options.requireModelIdentity) {
    activeFilters.push([
      'REQUIRE_MODEL_IDENTITY',
      (o) => o.calibration !== null && typeof o.calibration.modelId === 'string',
    ]);
  }

  const selected = [];
  for (const obs of observations) {
    let excluded = false;
    for (const [reason, passes] of activeFilters) {
      if (!passes(obs)) {
        exclusionsByReason[reason] = (exclusionsByReason[reason] || 0) + 1;
        excluded = true;
        break;
      }
    }
    if (!excluded) selected.push(obs);
  }
  return selected;
}

/**
 * Duplicate pass. Deterministic error precedence per row: identity first
 * (same observationId), then prediction uniqueness, then logical pair.
 *
 * @param {CalibrationObservation[]} observations — post-filter
 * @param {Function} hashFn
 */
function assertNoDuplicates(observations, hashFn) {
  const byId = new Map();
  const byPrediction = new Set();
  const byLogical = new Set();

  for (const obs of observations) {
    const existing = byId.get(obs.observationId);
    if (existing !== undefined) {
      const type = hashFn(projectObservation(existing)) === hashFn(projectObservation(obs)) ? 'IDENTITY_DUPLICATE' : 'IDENTITY_CONFLICT';
      throw new DuplicateDatasetObservationError(
        type,
        `observationId "${obs.observationId}" appears more than once` +
          (type === 'IDENTITY_DUPLICATE' ? ' with identical content' : ' with different content'),
      );
    }
    if (byPrediction.has(obs.predictionId)) {
      throw new DuplicateDatasetObservationError(
        'PREDICTION_DUPLICATE',
        `prediction "${obs.predictionId}" appears more than once (one observation per prediction)`,
      );
    }
    const logical = JSON.stringify([obs.predictionId, obs.outcomeId]);
    if (byLogical.has(logical)) {
      throw new DuplicateDatasetObservationError(
        'LOGICAL_DUPLICATE',
        `prediction "${obs.predictionId}" + outcome "${obs.outcomeId}" pair appears more than once`,
      );
    }
    byId.set(obs.observationId, obs);
    byPrediction.add(obs.predictionId);
    byLogical.add(logical);
  }
}

/**
 * Assemble a HistoricalCalibrationDataset.
 *
 * @param {Object} input
 * @param {string} input.datasetId — required, caller-provided (never random internally)
 * @param {CalibrationObservation[]} input.observations — raw rows (not mutated)
 * @param {string} input.createdAt — ISO 8601 UTC, caller-injected
 * @param {object|null} [input.options] — raw or normalised DatasetAssemblyOptions
 * @param {object|null} [input.metadata] — manifest metadata bag
 * @param {'IN_MEMORY_REPOSITORY'|'PROVIDED_COLLECTION'} [input.sourceType='PROVIDED_COLLECTION']
 * @param {Function} [input.hashFn=canonicalHashSync] — deterministic JSON-safe hash
 * @returns {HistoricalCalibrationDataset}
 */
export class DatasetBuilder {
  buildDataset({
    datasetId,
    observations,
    createdAt,
    options = null,
    metadata = null,
    sourceType = 'PROVIDED_COLLECTION',
    hashFn = canonicalHashSync,
  }) {
    // ── 1. Input validation ────────────────────────────────────────────
    if (!datasetId || typeof datasetId !== 'string') {
      throw new InvalidDatasetIdError(datasetId);
    }
    if (!createdAt || !isIsoTimestamp(createdAt)) {
      throw new InvalidDatasetTimestampError('createdAt', createdAt);
    }
    if (!SUPPORTED_SOURCE_TYPES.includes(sourceType)) {
      throw new InvalidDatasetOptionsError(
        `sourceType must be one of: ${SUPPORTED_SOURCE_TYPES.join(', ')} (received ${JSON.stringify(sourceType)}).`,
      );
    }
    if (!Array.isArray(observations)) {
      throw new InvalidDatasetOptionsError('observations must be an array.');
    }
    if (typeof hashFn !== 'function') {
      throw new InvalidDatasetOptionsError('hashFn must be a function.');
    }
    const opts = createDatasetAssemblyOptions(options);

    // ── 2. Defensive copy (input never mutated) ────────────────────────
    const rows = [...observations];

    // ── 3+4. Shape + schema validation ─────────────────────────────────
    const validRows = [];
    const exclusionsByReason = {};
    let invalidCount = 0;

    for (const obs of rows) {
      const schemaVersion = obs && typeof obs === 'object' ? obs.schemaVersion : undefined;
      if (schemaVersion !== CALIBRATION_OBSERVATION_SCHEMA_VERSION) {
        if (opts.invalidObservationPolicy === 'REJECT_DATASET') {
          throw new UnsupportedObservationSchemaError(
            schemaVersion === undefined ? '<missing>' : String(schemaVersion),
            CALIBRATION_OBSERVATION_SCHEMA_VERSION,
            obs && typeof obs === 'object' ? obs.observationId : undefined,
          );
        }
        exclusionsByReason.INVALID_OBSERVATION = (exclusionsByReason.INVALID_OBSERVATION || 0) + 1;
        invalidCount += 1;
        continue;
      }
      if (!hasValidShape(obs)) {
        if (opts.invalidObservationPolicy === 'REJECT_DATASET') {
          throw new InvalidDatasetObservationError(
            'missing or malformed contract fields',
            obs && typeof obs === 'object' ? obs.observationId : undefined,
          );
        }
        exclusionsByReason.INVALID_OBSERVATION = (exclusionsByReason.INVALID_OBSERVATION || 0) + 1;
        invalidCount += 1;
        continue;
      }
      validRows.push(obs);
    }

    // ── 5. Selection filters ───────────────────────────────────────────
    const selected = applyFilters(validRows, opts, exclusionsByReason);

    if (selected.length === 0 && !opts.allowEmpty) {
      if (rows.length === 0) {
        throw new EmptyHistoricalDatasetError('no observations were provided');
      }
      if (validRows.length === 0) {
        throw new EmptyHistoricalDatasetError('all observations were invalid');
      }
      throw new EmptyHistoricalDatasetError('all observations were excluded by the selection filters');
    }

    // ── 6. Duplicate detection ─────────────────────────────────────────
    assertNoDuplicates(selected, hashFn);

    // ── 7. Canonical order ─────────────────────────────────────────────
    const ordered = canonicalSortObservations(selected);

    // ── 8. Statistics + period ─────────────────────────────────────────
    const statistics = createDatasetStatistics(ordered);
    const period = deriveDatasetPeriod(ordered);

    // ── 9. Manifest + hashes ───────────────────────────────────────────
    const filters = buildFilterDescriptors(opts);
    const manifest = createDatasetManifest({
      datasetId,
      createdAt,
      sourceType,
      options: opts,
      filters,
      sortOrder: CANONICAL_SORT_ORDER,
      duplicatePolicy: opts.duplicatePolicy,
      invalidObservationPolicy: opts.invalidObservationPolicy,
      observationCount: ordered.length,
      excludedCount: Object.values(exclusionsByReason).reduce((acc, n) => acc + n, 0),
      exclusionsByReason,
      invalidCount,
      builderVersion: DATASET_BUILDER_VERSION,
      metadata,
    });

    const contentHash = hashFn(projectScientificDataset({
      schemaVersion: HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
      observationSchemaVersion: CALIBRATION_OBSERVATION_SCHEMA_VERSION,
      period,
      observations: ordered,
    }));
    const manifestHash = hashFn(manifest);

    // ── 10. Snapshot ───────────────────────────────────────────────────
    return createHistoricalCalibrationDataset({
      datasetId,
      observationSchemaVersion: CALIBRATION_OBSERVATION_SCHEMA_VERSION,
      createdAt,
      period,
      manifest,
      statistics,
      contentHash,
      manifestHash,
      observations: ordered,
    });
  }
}
