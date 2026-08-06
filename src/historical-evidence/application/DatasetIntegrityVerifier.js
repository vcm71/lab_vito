import { canonicalHashSync } from '../../calibration/CanonicalHash.js';
import { validateChronology } from '../domain/chronology.js';
import {
  CALIBRATION_OBSERVATION_SCHEMA_VERSION,
  DATASET_MANIFEST_SCHEMA_VERSION,
  DATASET_STATISTICS_SCHEMA_VERSION,
  HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
  canonicalSortObservations,
  createDatasetStatistics,
  deriveDatasetPeriod,
  deepFreeze,
  isDatasetIdentity,
} from '../domain/index.js';
import {
  projectDatasetSnapshotDescriptor,
  projectScientificDataset,
  serializeDatasetIdentity,
  serializeDatasetSnapshotDescriptor,
} from './CanonicalDatasetSerializer.js';
import { createDatasetIntegrityReport } from '../domain/DatasetIntegrityReport.js';
import { DATASET_INTEGRITY_STATUS } from '../domain/DatasetIntegrityStatus.js';
import {
  InvalidIntegrityVerificationInputError,
  InvalidIntegrityVerificationOptionsError,
  UnsupportedIntegrityCheckError,
} from '../domain/errors.js';
import { INTEGRITY_VERIFICATION_MODE, normalizeIntegrityVerificationMode } from './IntegrityVerificationMode.js';

const CHECK_IDS = deepFreeze({
  CONTENT_HASH: 'CONTENT_HASH',
  MANIFEST_HASH: 'MANIFEST_HASH',
  DATASET_SCHEMA: 'DATASET_SCHEMA',
  OBSERVATION_SCHEMA: 'OBSERVATION_SCHEMA',
  CANONICAL_ORDER: 'CANONICAL_ORDER',
  DUPLICATES: 'DUPLICATES',
  CHRONOLOGY: 'CHRONOLOGY',
  STATISTICS: 'STATISTICS',
  SCIENTIFIC_STRUCTURE: 'SCIENTIFIC_STRUCTURE',
  DATASET_IDENTITY: 'DATASET_IDENTITY',
  SNAPSHOT_DESCRIPTOR: 'SNAPSHOT_DESCRIPTOR',
  IMMUTABILITY: 'IMMUTABILITY',
});

const SCIENTIFIC_CHECKS = Object.freeze([
  CHECK_IDS.CONTENT_HASH,
  CHECK_IDS.DATASET_SCHEMA,
  CHECK_IDS.OBSERVATION_SCHEMA,
  CHECK_IDS.CANONICAL_ORDER,
  CHECK_IDS.DUPLICATES,
  CHECK_IDS.CHRONOLOGY,
  CHECK_IDS.STATISTICS,
  CHECK_IDS.SCIENTIFIC_STRUCTURE,
]);

const OPERATIONAL_CHECKS = Object.freeze([
  CHECK_IDS.MANIFEST_HASH,
  CHECK_IDS.DATASET_IDENTITY,
  CHECK_IDS.SNAPSHOT_DESCRIPTOR,
]);

const FULL_CHECKS = Object.freeze([...SCIENTIFIC_CHECKS, ...OPERATIONAL_CHECKS, CHECK_IDS.IMMUTABILITY]);

function cloneCheckValue(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function makeCheck({ checkId, category, status, severity, message, path, expected = null, actual = null }) {
  return deepFreeze({
    checkId,
    category,
    status,
    severity,
    message,
    path,
    expected: cloneCheckValue(expected),
    actual: cloneCheckValue(actual),
  });
}

function passCheck(checkId, category, message, path, expected, actual) {
  return makeCheck({ checkId, category, status: 'PASS', severity: 'error', message, path, expected, actual });
}

function failCheck(checkId, category, message, path, expected, actual) {
  return makeCheck({ checkId, category, status: 'FAIL', severity: 'error', message, path, expected, actual });
}

function skipCheck(checkId, category, message, path) {
  return makeCheck({ checkId, category, status: 'SKIPPED', severity: 'info', message, path });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertVerificationInput(input) {
  if (!isPlainObject(input)) {
    throw new InvalidIntegrityVerificationInputError('input must be a plain object');
  }
  if (!isPlainObject(input.dataset)) {
    throw new InvalidIntegrityVerificationInputError('input.dataset must be a plain object');
  }
  if (!Array.isArray(input.dataset.observations)) {
    throw new InvalidIntegrityVerificationInputError('input.dataset.observations must be an array');
  }
}

function normalizeRequestedChecks(requestedChecks, availableChecks) {
  if (requestedChecks === undefined || requestedChecks === null) return [...availableChecks];
  if (!Array.isArray(requestedChecks) || requestedChecks.length === 0) {
    throw new InvalidIntegrityVerificationOptionsError('checks must be a non-empty array of check ids');
  }
  const normalized = [];
  for (const checkId of requestedChecks) {
    if (typeof checkId !== 'string' || checkId.length === 0) {
      throw new InvalidIntegrityVerificationOptionsError('checks must contain non-empty string ids');
    }
    if (!availableChecks.includes(checkId)) {
      throw new UnsupportedIntegrityCheckError(checkId, `unsupported check ${JSON.stringify(checkId)}`);
    }
    if (!normalized.includes(checkId)) {
      normalized.push(checkId);
    }
  }
  return normalized;
}

function summarizeChecks(checks) {
  const summary = {
    totalChecks: checks.length,
    executedChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    skippedChecks: 0,
  };
  for (const check of checks) {
    if (check.status === 'SKIPPED') {
      summary.skippedChecks += 1;
      continue;
    }
    summary.executedChecks += 1;
    if (check.status === 'PASS') summary.passedChecks += 1;
    if (check.status === 'FAIL') summary.failedChecks += 1;
  }
  summary.warningChecks = checks.filter((check) => check.status === 'SKIPPED').length;
  return deepFreeze(summary);
}

function sameHash(a, b) {
  return String(a) === String(b);
}

function computeDuplicatesCheck(dataset) {
  const byId = new Map();
  const byPrediction = new Set();
  const byLogical = new Set();

  for (const obs of dataset.observations) {
    const existing = byId.get(obs.observationId);
    if (existing !== undefined) {
      const currentHash = canonicalHashSync({ ...obs });
      const previousHash = canonicalHashSync({ ...existing });
      const duplicateType = currentHash === previousHash ? 'IDENTITY_DUPLICATE' : 'IDENTITY_CONFLICT';
      return failCheck(
        CHECK_IDS.DUPLICATES,
        'scientific',
        duplicateType === 'IDENTITY_DUPLICATE'
          ? `duplicate observationId ${JSON.stringify(obs.observationId)} with identical content`
          : `duplicate observationId ${JSON.stringify(obs.observationId)} with different content`,
        'observations',
        duplicateType,
        { observationId: obs.observationId },
      );
    }
    if (byPrediction.has(obs.predictionId)) {
      return failCheck(
        CHECK_IDS.DUPLICATES,
        'scientific',
        `prediction ${JSON.stringify(obs.predictionId)} appears more than once`,
        'observations',
        'unique predictionId',
        { predictionId: obs.predictionId },
      );
    }
    const logical = JSON.stringify([obs.predictionId, obs.outcomeId]);
    if (byLogical.has(logical)) {
      return failCheck(
        CHECK_IDS.DUPLICATES,
        'scientific',
        `prediction/outcome pair ${logical} appears more than once`,
        'observations',
        'unique [predictionId,outcomeId] pair',
        { predictionId: obs.predictionId, outcomeId: obs.outcomeId },
      );
    }
    byId.set(obs.observationId, obs);
    byPrediction.add(obs.predictionId);
    byLogical.add(logical);
  }

  return passCheck(CHECK_IDS.DUPLICATES, 'scientific', 'observation identity, prediction and logical pairs are unique', 'observations');
}

function computeChronologyCheck(dataset) {
  try {
    for (const obs of dataset.observations) {
      validateChronology({
        spinId: obs.spinId,
        predictionCreatedAt: obs.predictionCreatedAt,
        outcomeRecordedAt: obs.outcomeRecordedAt,
      });
    }
  } catch (error) {
    return failCheck(
      CHECK_IDS.CHRONOLOGY,
      'scientific',
      error instanceof Error ? error.message : 'chronology validation failed',
      'observations',
      'predictionCreatedAt <= outcomeRecordedAt for every observation',
      error instanceof Error ? error.message : String(error),
    );
  }

  const expectedPeriod = deriveDatasetPeriod(dataset.observations);
  const actualPeriod = dataset.period;
  if (canonicalHashSync(expectedPeriod) !== canonicalHashSync(actualPeriod)) {
    return failCheck(
      CHECK_IDS.CHRONOLOGY,
      'scientific',
      'dataset.period does not match the period derived from observations',
      'period',
      expectedPeriod,
      actualPeriod,
    );
  }

  return passCheck(CHECK_IDS.CHRONOLOGY, 'scientific', 'chronology and covered period match the observations', 'period', expectedPeriod, actualPeriod);
}

function computeScientificStructureCheck(dataset) {
  const requiredKeys = ['schemaVersion', 'observationSchemaVersion', 'period', 'observations'];
  const projection = projectScientificDataset(dataset);
  const projectionKeys = Object.keys(projection);
  const matches =
    requiredKeys.every((key) => key in dataset) &&
    Array.isArray(dataset.observations) &&
    requiredKeys.every((key) => projectionKeys.includes(key)) &&
    projectionKeys.length === requiredKeys.length;
  if (!matches) {
    return failCheck(
      CHECK_IDS.SCIENTIFIC_STRUCTURE,
      'scientific',
      'dataset does not expose the expected scientific projection shape',
      'dataset',
      requiredKeys,
      projectionKeys,
    );
  }
  return passCheck(
    CHECK_IDS.SCIENTIFIC_STRUCTURE,
    'scientific',
    'scientific projection exposes the expected schemaVersion/observationSchemaVersion/period/observations shape',
    'dataset',
    requiredKeys,
    projectionKeys,
  );
}

function computeDatasetSchemaCheck(dataset) {
  if (dataset.schemaVersion !== HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION) {
    return failCheck(
      CHECK_IDS.DATASET_SCHEMA,
      'scientific',
      `unexpected dataset schemaVersion ${JSON.stringify(dataset.schemaVersion)}`,
      'schemaVersion',
      HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
      dataset.schemaVersion,
    );
  }
  if (dataset.manifest?.schemaVersion !== DATASET_MANIFEST_SCHEMA_VERSION) {
    return failCheck(
      CHECK_IDS.DATASET_SCHEMA,
      'scientific',
      `unexpected manifest schemaVersion ${JSON.stringify(dataset.manifest?.schemaVersion)}`,
      'manifest.schemaVersion',
      DATASET_MANIFEST_SCHEMA_VERSION,
      dataset.manifest?.schemaVersion,
    );
  }
  if (dataset.statistics?.schemaVersion !== DATASET_STATISTICS_SCHEMA_VERSION) {
    return failCheck(
      CHECK_IDS.DATASET_SCHEMA,
      'scientific',
      `unexpected statistics schemaVersion ${JSON.stringify(dataset.statistics?.schemaVersion)}`,
      'statistics.schemaVersion',
      DATASET_STATISTICS_SCHEMA_VERSION,
      dataset.statistics?.schemaVersion,
    );
  }
  return passCheck(
    CHECK_IDS.DATASET_SCHEMA,
    'scientific',
    'dataset, manifest and statistics schema versions match the historical contract',
    'schemaVersion',
    HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
    dataset.schemaVersion,
  );
}

function computeObservationSchemaCheck(dataset) {
  const mismatched = dataset.observations.find((obs) => obs.schemaVersion !== CALIBRATION_OBSERVATION_SCHEMA_VERSION);
  if (mismatched) {
    return failCheck(
      CHECK_IDS.OBSERVATION_SCHEMA,
      'scientific',
      `observation ${JSON.stringify(mismatched.observationId)} has unexpected schemaVersion ${JSON.stringify(mismatched.schemaVersion)}`,
      'observations[*].schemaVersion',
      CALIBRATION_OBSERVATION_SCHEMA_VERSION,
      mismatched.schemaVersion,
    );
  }
  return passCheck(
    CHECK_IDS.OBSERVATION_SCHEMA,
    'scientific',
    'all observations share the expected observation schema version',
    'observations[*].schemaVersion',
    CALIBRATION_OBSERVATION_SCHEMA_VERSION,
    CALIBRATION_OBSERVATION_SCHEMA_VERSION,
  );
}

function computeCanonicalOrderCheck(dataset) {
  const expected = canonicalSortObservations(dataset.observations).map((obs) => obs.observationId);
  const actual = dataset.observations.map((obs) => obs.observationId);
  if (expected.length !== actual.length || expected.some((id, index) => id !== actual[index])) {
    return failCheck(
      CHECK_IDS.CANONICAL_ORDER,
      'scientific',
      'observations are not in canonical sort order',
      'observations',
      expected,
      actual,
    );
  }
  return passCheck(CHECK_IDS.CANONICAL_ORDER, 'scientific', 'observations are in canonical order', 'observations', expected, actual);
}

function computeContentHashCheck(dataset) {
  const actual = dataset.contentHash;
  const expected = canonicalHashSync(projectScientificDataset(dataset));
  if (!sameHash(expected, actual)) {
    return failCheck(
      CHECK_IDS.CONTENT_HASH,
      'scientific',
      'contentHash does not match the canonical scientific projection',
      'contentHash',
      expected,
      actual,
    );
  }
  return passCheck(CHECK_IDS.CONTENT_HASH, 'scientific', 'contentHash matches the canonical scientific projection', 'contentHash', expected, actual);
}

function computeManifestHashCheck(dataset) {
  const actual = dataset.manifestHash;
  const expected = canonicalHashSync(dataset.manifest);
  if (!sameHash(expected, actual)) {
    return failCheck(
      CHECK_IDS.MANIFEST_HASH,
      'operational',
      'manifestHash does not match the canonical manifest projection',
      'manifestHash',
      expected,
      actual,
    );
  }
  return passCheck(CHECK_IDS.MANIFEST_HASH, 'operational', 'manifestHash matches the canonical manifest projection', 'manifestHash', expected, actual);
}

function computeStatisticsCheck(dataset) {
  const expected = createDatasetStatistics(dataset.observations);
  const actual = dataset.statistics;
  if (canonicalHashSync(expected) !== canonicalHashSync(actual)) {
    return failCheck(
      CHECK_IDS.STATISTICS,
      'scientific',
      'statistics do not match the observations',
      'statistics',
      expected,
      actual,
    );
  }
  return passCheck(CHECK_IDS.STATISTICS, 'scientific', 'statistics match the observations', 'statistics', expected, actual);
}

function computeIdentityCheck(dataset, identity) {
  if (identity === null || identity === undefined) {
    return skipCheck(CHECK_IDS.DATASET_IDENTITY, 'operational', 'identity not provided', 'identity');
  }
  if (!isDatasetIdentity(identity)) {
    return failCheck(
      CHECK_IDS.DATASET_IDENTITY,
      'operational',
      'identity is not a valid DatasetIdentity object',
      'identity',
      'valid DatasetIdentity',
      identity,
    );
  }
  const expected = {
    datasetId: dataset.datasetId,
    schemaVersion: dataset.schemaVersion,
    observationSchemaVersion: dataset.observationSchemaVersion,
    contentHash: dataset.contentHash,
    manifestHash: dataset.manifestHash,
  };
  const actual = {
    datasetId: identity.datasetId,
    schemaVersion: identity.schemaVersion,
    observationSchemaVersion: identity.observationSchemaVersion,
    contentHash: identity.contentHash,
    manifestHash: identity.manifestHash,
  };
  const identityFingerprint = serializeDatasetIdentity(identity);
  if (canonicalHashSync(expected) !== canonicalHashSync(actual)) {
    return failCheck(
      CHECK_IDS.DATASET_IDENTITY,
      'operational',
      'dataset identity is not coherent with the dataset hashes',
      'identity',
      expected,
      actual,
    );
  }
  return passCheck(
    CHECK_IDS.DATASET_IDENTITY,
    'operational',
    'dataset identity is coherent with the dataset hashes',
    'identity',
    { expected, identityFingerprint },
    actual,
  );
}

function computeSnapshotDescriptorCheck(dataset, identity, descriptor) {
  if (descriptor === null || descriptor === undefined) {
    return skipCheck(CHECK_IDS.SNAPSHOT_DESCRIPTOR, 'operational', 'descriptor not provided', 'descriptor');
  }
  try {
    projectDatasetSnapshotDescriptor(descriptor);
    serializeDatasetSnapshotDescriptor(descriptor);
  } catch (error) {
    return failCheck(
      CHECK_IDS.SNAPSHOT_DESCRIPTOR,
      'operational',
      error instanceof Error ? error.message : 'descriptor serialization failed',
      'descriptor',
      'valid DatasetSnapshotDescriptor',
      error instanceof Error ? error.message : String(error),
    );
  }

  const expectedIdentity = identity ?? descriptor.identity;
  if (expectedIdentity === null || expectedIdentity === undefined || !isDatasetIdentity(expectedIdentity)) {
    return failCheck(
      CHECK_IDS.SNAPSHOT_DESCRIPTOR,
      'operational',
      'cannot verify descriptor without a valid identity',
      'descriptor.identity',
      'valid DatasetIdentity',
      descriptor.identity,
    );
  }

  const expected = {
    identity: {
      datasetId: dataset.datasetId,
      schemaVersion: dataset.schemaVersion,
      observationSchemaVersion: dataset.observationSchemaVersion,
      contentHash: dataset.contentHash,
      manifestHash: dataset.manifestHash,
    },
    createdAt: descriptor.createdAt,
    period: dataset.period,
    manifest: dataset.manifest,
    statistics: dataset.statistics,
  };
  const actual = {
    identity: {
      datasetId: descriptor.identity.datasetId,
      schemaVersion: descriptor.identity.schemaVersion,
      observationSchemaVersion: descriptor.identity.observationSchemaVersion,
      contentHash: descriptor.identity.contentHash,
      manifestHash: descriptor.identity.manifestHash,
    },
    createdAt: descriptor.createdAt,
    period: descriptor.period,
    manifest: descriptor.manifest,
    statistics: descriptor.statistics,
  };

  const sharedMatch =
    canonicalHashSync(expected.identity) === canonicalHashSync(actual.identity) &&
    canonicalHashSync(expected.period) === canonicalHashSync(actual.period) &&
    canonicalHashSync(expected.manifest) === canonicalHashSync(actual.manifest) &&
    canonicalHashSync(expected.statistics) === canonicalHashSync(actual.statistics);

  if (!sharedMatch) {
    return failCheck(
      CHECK_IDS.SNAPSHOT_DESCRIPTOR,
      'operational',
      'snapshot descriptor is not coherent with the dataset snapshot',
      'descriptor',
      expected,
      actual,
    );
  }

  return passCheck(
    CHECK_IDS.SNAPSHOT_DESCRIPTOR,
    'operational',
    'snapshot descriptor is coherent with the dataset snapshot',
    'descriptor',
    expected,
    actual,
  );
}

function computeImmutabilityCheck(dataset, identity, descriptor) {
  const targets = [dataset, dataset.manifest, dataset.statistics, dataset.period, dataset.observations];
  if (identity !== null && identity !== undefined) {
    targets.push(identity, identity.datasetVersion);
  }
  if (descriptor !== null && descriptor !== undefined) {
    targets.push(
      descriptor,
      descriptor.identity,
      descriptor.period,
      descriptor.manifest,
      descriptor.statistics,
      descriptor.policies,
      descriptor.filters,
      descriptor.provenance,
      descriptor.lineage,
      descriptor.metadata,
    );
  }
  const mutable = targets.find((value) => value !== null && value !== undefined && !Object.isFrozen(value));
  if (mutable !== undefined) {
    return failCheck(
      CHECK_IDS.IMMUTABILITY,
      'operational',
      'one or more verified objects are not deeply frozen',
      'immutability',
      'all observed objects frozen',
      mutable,
    );
  }
  return passCheck(CHECK_IDS.IMMUTABILITY, 'operational', 'all observed objects are frozen', 'immutability', true, true);
}

export class DatasetIntegrityVerifier {
  verify(input, options = {}) {
    assertVerificationInput(input);

    const mode = normalizeIntegrityVerificationMode(options.mode ?? INTEGRITY_VERIFICATION_MODE.FULL);
    const availableChecks =
      mode === INTEGRITY_VERIFICATION_MODE.SCIENTIFIC
        ? SCIENTIFIC_CHECKS
        : mode === INTEGRITY_VERIFICATION_MODE.OPERATIONAL
          ? OPERATIONAL_CHECKS
          : FULL_CHECKS;

    const requestedChecks = normalizeRequestedChecks(options.checks, availableChecks);
    const dataset = input.dataset;
    const identity = input.identity ?? null;
    const descriptor = input.descriptor ?? null;

    const checkSet = new Set(requestedChecks);
    const checks = [];

    if (checkSet.has(CHECK_IDS.CONTENT_HASH)) checks.push(computeContentHashCheck(dataset));
    if (checkSet.has(CHECK_IDS.MANIFEST_HASH)) checks.push(computeManifestHashCheck(dataset));
    if (checkSet.has(CHECK_IDS.DATASET_SCHEMA)) checks.push(computeDatasetSchemaCheck(dataset));
    if (checkSet.has(CHECK_IDS.OBSERVATION_SCHEMA)) checks.push(computeObservationSchemaCheck(dataset));
    if (checkSet.has(CHECK_IDS.CANONICAL_ORDER)) checks.push(computeCanonicalOrderCheck(dataset));
    if (checkSet.has(CHECK_IDS.DUPLICATES)) checks.push(computeDuplicatesCheck(dataset));
    if (checkSet.has(CHECK_IDS.CHRONOLOGY)) checks.push(computeChronologyCheck(dataset));
    if (checkSet.has(CHECK_IDS.STATISTICS)) checks.push(computeStatisticsCheck(dataset));
    if (checkSet.has(CHECK_IDS.SCIENTIFIC_STRUCTURE)) checks.push(computeScientificStructureCheck(dataset));
    if (checkSet.has(CHECK_IDS.DATASET_IDENTITY)) checks.push(computeIdentityCheck(dataset, identity));
    if (checkSet.has(CHECK_IDS.SNAPSHOT_DESCRIPTOR)) checks.push(computeSnapshotDescriptorCheck(dataset, identity, descriptor));
    if (checkSet.has(CHECK_IDS.IMMUTABILITY)) checks.push(computeImmutabilityCheck(dataset, identity, descriptor));

    const summary = summarizeChecks(checks);
    const hasFailures = checks.some((check) => check.status === 'FAIL');
    const hasSkipped = checks.some((check) => check.status === 'SKIPPED');
    const status = hasFailures
      ? DATASET_INTEGRITY_STATUS.INVALID
      : hasSkipped
        ? DATASET_INTEGRITY_STATUS.INCOMPLETE
        : DATASET_INTEGRITY_STATUS.VALID;

    return createDatasetIntegrityReport({
      mode,
      status,
      checks,
      summary,
      datasetId: dataset.datasetId ?? null,
      identity,
      descriptor,
      generatedAt: new Date().toISOString(),
    });
  }
}

export { CHECK_IDS as DATASET_INTEGRITY_CHECK_IDS };
