/**
 * HistoricalCalibrationDataset — immutable scientific snapshot of
 * calibration observations.
 *
 * The dataset is the unit of scientific analysis: a deep-frozen,
 * deterministically ordered collection with provenance (manifest),
 * descriptive statistics, and canonical integrity hashes
 * (contentHash/manifestHash, SHA-256 over canonical serialisation).
 *
 * Design decisions (Fase 2.3.3):
 * - `contentHash` covers the SCIENTIFIC content only: schema versions,
 *   covered period, and the observations themselves. datasetId, createdAt,
 *   manifest and statistics are operational and excluded — identical
 *   scientific content yields the same hash even with a different
 *   datasetId/createdAt.
 * - `manifestHash` covers the whole manifest (provenance).
 * - Timestamps are ISO 8601 UTC strings, caller-injected. No global clock
 *   inside the domain.
 * - The dataset is assembled by the application layer (DatasetBuilder);
 *   the domain only defines the contract and pure helpers.
 *
 * @typedef {Object} HistoricalCalibrationDataset
 * @property {string} datasetId — caller-provided or injected, never random
 * @property {string} schemaVersion — stable dataset contract version
 * @property {string} observationSchemaVersion — schema of each row
 * @property {string} createdAt — ISO 8601 UTC, operational (not hashed)
 * @property {object} period — covered ranges derived from the content
 * @property {DatasetManifest} manifest — assembly provenance
 * @property {DatasetStatistics} statistics — descriptive statistics
 * @property {string} contentHash — 64 hex chars (sha256 canonical)
 * @property {string} manifestHash — 64 hex chars (sha256 canonical)
 * @property {readonly CalibrationObservation[]} observations — canonical order
 */

import { deepFreeze } from './immutable.js';
import { CALIBRATION_OBSERVATION_SCHEMA_VERSION } from './CalibrationObservation.js';
import {
  InvalidDatasetIdError,
  InvalidDatasetTimestampError,
  InvalidDatasetObservationError,
} from './errors.js';
import { isIsoTimestamp } from './DatasetAssemblyOptions.js';

/** @type {string} — stable contract version for historical calibration datasets */
export const HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION = '1';

const HEX64 = /^[0-9a-f]{64}$/;

export { HEX64 };

/**
 * Compare two ISO 8601 UTC strings lexicographically. Safe because the
 * contract enforces fixed-width ISO fields (see isIsoTimestamp).
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a < b, positive if a > b, 0 if equal
 */
export function compareIso(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Canonical sort of observations: predictionCreatedAt asc → spinId asc →
 * predictionId asc → outcomeId asc → observationId asc. Stable for equal
 * keys (identical rows are indistinguishable). Pure — input is not mutated.
 *
 * @param {Array<object>} observations
 * @returns {CalibrationObservation[]} new sorted array
 */
export function canonicalSortObservations(observations) {
  return [...observations].sort((a, b) => {
    const byCreatedAt = compareIso(a.predictionCreatedAt, b.predictionCreatedAt);
    if (byCreatedAt !== 0) return byCreatedAt;
    if (a.spinId < b.spinId) return -1;
    if (a.spinId > b.spinId) return 1;
    if (a.predictionId < b.predictionId) return -1;
    if (a.predictionId > b.predictionId) return 1;
    if (a.outcomeId < b.outcomeId) return -1;
    if (a.outcomeId > b.outcomeId) return 1;
    if (a.observationId < b.observationId) return -1;
    if (a.observationId > b.observationId) return 1;
    return 0;
  });
}

/**
 * Derive the covered period from observations. All windows are
 * [min, max] inclusive. Empty list → all null.
 *
 * @param {Array<object>} observations
 * @returns {{
 *   predictionCreatedFrom: string|null,
 *   predictionCreatedTo: string|null,
 *   outcomeRecordedFrom: string|null,
 *   outcomeRecordedTo: string|null,
 * }}
 */
export function deriveDatasetPeriod(observations) {
  if (observations.length === 0) {
    return {
      predictionCreatedFrom: null,
      predictionCreatedTo: null,
      outcomeRecordedFrom: null,
      outcomeRecordedTo: null,
    };
  }
  let predictionFrom = observations[0].predictionCreatedAt;
  let predictionTo = predictionFrom;
  let outcomeFrom = observations[0].outcomeRecordedAt;
  let outcomeTo = outcomeFrom;
  for (const obs of observations) {
    if (obs.predictionCreatedAt < predictionFrom) predictionFrom = obs.predictionCreatedAt;
    if (obs.predictionCreatedAt > predictionTo) predictionTo = obs.predictionCreatedAt;
    if (obs.outcomeRecordedAt < outcomeFrom) outcomeFrom = obs.outcomeRecordedAt;
    if (obs.outcomeRecordedAt > outcomeTo) outcomeTo = obs.outcomeRecordedAt;
  }
  return {
    predictionCreatedFrom: predictionFrom,
    predictionCreatedTo: predictionTo,
    outcomeRecordedFrom: outcomeFrom,
    outcomeRecordedTo: outcomeTo,
  };
}

/**
 * Create a deep-frozen HistoricalCalibrationDataset.
 *
 * @param {Object} contract
 * @param {string} contract.datasetId — non-empty string, caller-provided or injected
 * @param {string} [contract.schemaVersion='1']
 * @param {string} contract.observationSchemaVersion — CALIBRATION_OBSERVATION_SCHEMA_VERSION
 * @param {string} contract.createdAt — ISO 8601 UTC
 * @param {object} contract.period — from deriveDatasetPeriod
 * @param {DatasetManifest} contract.manifest
 * @param {DatasetStatistics} contract.statistics
 * @param {string} contract.contentHash — 64 hex chars
 * @param {string} contract.manifestHash — 64 hex chars
 * @param {CalibrationObservation[]} contract.observations — already canonical order
 * @returns {HistoricalCalibrationDataset}
 */
export function createHistoricalCalibrationDataset({
  datasetId,
  schemaVersion = HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
  observationSchemaVersion,
  createdAt,
  period,
  manifest,
  statistics,
  contentHash,
  manifestHash,
  observations,
}) {
  if (schemaVersion !== HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION) {
    throw new TypeError(
      `unsupported dataset schemaVersion "${schemaVersion}" (expected "${HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION}").`,
    );
  }
  if (!datasetId || typeof datasetId !== 'string') {
    throw new InvalidDatasetIdError(datasetId);
  }
  if (!createdAt || !isIsoTimestamp(createdAt)) {
    throw new InvalidDatasetTimestampError('createdAt', createdAt);
  }
  if (observationSchemaVersion !== CALIBRATION_OBSERVATION_SCHEMA_VERSION) {
    throw new InvalidDatasetObservationError(
      `unsupported observation schemaVersion "${observationSchemaVersion}".`,
    );
  }
  if (typeof contentHash !== 'string' || !HEX64.test(contentHash)) {
    throw new TypeError('contentHash must be a 64-char lowercase hex sha256 string.');
  }
  if (typeof manifestHash !== 'string' || !HEX64.test(manifestHash)) {
    throw new TypeError('manifestHash must be a 64-char lowercase hex sha256 string.');
  }
  if (typeof period !== 'object' || period === null) {
    throw new TypeError('period must be the object returned by deriveDatasetPeriod().');
  }
  if (typeof manifest !== 'object' || manifest === null) {
    throw new TypeError('manifest must be a DatasetManifest object.');
  }
  if (typeof statistics !== 'object' || statistics === null) {
    throw new TypeError('statistics must be a DatasetStatistics object.');
  }
  if (!Array.isArray(observations)) {
    throw new InvalidDatasetObservationError('observations must be an array of CalibrationObservation.');
  }
  for (const obs of observations) {
    if (typeof obs !== 'object' || obs === null || !Object.isFrozen(obs)) {
      throw new InvalidDatasetObservationError(
        'every observation must be a deep-frozen CalibrationObservation (immutability invariant).',
      );
    }
  }

  return deepFreeze({
    schemaVersion,
    datasetId,
    observationSchemaVersion,
    createdAt,
    period: deepFreeze({ ...period }),
    manifest,
    statistics,
    contentHash,
    manifestHash,
    observations: deepFreeze([...observations]),
  });
}

/**
 * True when two datasets carry identical scientific content (same schema
 * versions, same covered period, same observations). Uses contentHash —
 * operational fields (datasetId, createdAt, manifest, statistics) never
 * affect the comparison.
 *
 * @param {HistoricalCalibrationDataset} a
 * @param {HistoricalCalibrationDataset} b
 * @returns {boolean}
 */
export function isSameDatasetContent(a, b) {
  if (
    a === null || typeof a !== 'object' ||
    b === null || typeof b !== 'object' ||
    typeof a.contentHash !== 'string' ||
    typeof b.contentHash !== 'string'
  ) {
    return false;
  }
  return a.contentHash === b.contentHash;
}
