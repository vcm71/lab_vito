/**
 * DatasetIdentity — immutable scientific identity of a historical
 * calibration dataset snapshot.
 *
 * The identity is the minimal, auditable set of attributes that answers
 * "WHICH dataset is this?" independently of WHERE it lives:
 *
 * - `datasetId`          — operational name/id of the dataset
 * - `datasetVersion`     — artifact version (major.minor.patch, Fase 2.3.4.1)
 * - `schemaVersion`      — dataset structural contract (exact-match string)
 * - `observationSchemaVersion` — observation structural contract (exact-match string)
 * - `contentHash`        — SHA-256 of the scientific CONTENT (stable across
 *                          datasetId/createdAt changes) — already computed by
 *                          HistoricalCalibrationDataset, never recomputed here
 * - `manifestHash`       — SHA-256 of the full operational manifest (changes
 *                          with datasetId/createdAt/options) — same policy
 *
 * Two equivalence notions (evaluated against the existing codebase):
 * - SCIENTIFIC equivalence: same contentHash → the scientific content
 *   (observations, scores, targets, periods) is identical, even if the
 *   dataset was re-assembled under another id or at another time.
 * - OPERATIONAL equivalence: same datasetId AND same manifestHash → the same
 *   operational assembly (same id, same provenance), regardless of minor
 *   content variation.
 * - Full equality (equals): every component equal, including datasetVersion.
 *
 * Hashes are NEVER recomputed here — they are carried over from the dataset.
 * `createdAt` is intentionally NOT part of the identity (two assemblies of
 * the same content at different times are the same dataset scientifically).
 */

import { deepFreeze } from './immutable.js';
import { InvalidDatasetIdentityError } from './errors.js';
import { HEX64 } from './HistoricalCalibrationDataset.js';
import { isDatasetVersion, datasetVersionToString } from './DatasetVersion.js';

/**
 * Validate a single required string field.
 * @param {*} value
 * @param {string} field
 * @returns {string}
 */
function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidDatasetIdentityError(
      `${field} must be a non-empty string (received ${JSON.stringify(value)})`,
    );
  }
  return value;
}

/**
 * Check whether a value is a well-formed DatasetIdentity object.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isDatasetIdentity(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const { datasetId, datasetVersion, schemaVersion, observationSchemaVersion, contentHash, manifestHash } = value;
  return (
    typeof datasetId === 'string' &&
    datasetId.length > 0 &&
    isDatasetVersion(datasetVersion) &&
    typeof schemaVersion === 'string' &&
    schemaVersion.length > 0 &&
    typeof observationSchemaVersion === 'string' &&
    observationSchemaVersion.length > 0 &&
    typeof contentHash === 'string' &&
    HEX64.test(contentHash) &&
    typeof manifestHash === 'string' &&
    HEX64.test(manifestHash)
  );
}

/**
 * Create a deep-frozen DatasetIdentity.
 *
 * @param {Object} contract
 * @param {string} contract.datasetId — non-empty operational id
 * @param {DatasetVersion} contract.datasetVersion — artifact version object
 * @param {string} contract.schemaVersion — dataset structural contract
 * @param {string} contract.observationSchemaVersion — observation structural contract
 * @param {string} contract.contentHash — 64-char lowercase hex sha256 (carried, never computed)
 * @param {string} contract.manifestHash — 64-char lowercase hex sha256 (carried, never computed)
 * @returns {DatasetIdentity}
 * @throws {InvalidDatasetIdentityError} on any invalid component (all-or-nothing)
 */
export function createDatasetIdentity({
  datasetId,
  datasetVersion,
  schemaVersion,
  observationSchemaVersion,
  contentHash,
  manifestHash,
}) {
  const identity = {
    datasetId: assertNonEmptyString(datasetId, 'datasetId'),
    datasetVersion,
    schemaVersion: assertNonEmptyString(schemaVersion, 'schemaVersion'),
    observationSchemaVersion: assertNonEmptyString(observationSchemaVersion, 'observationSchemaVersion'),
    contentHash: assertNonEmptyString(contentHash, 'contentHash'),
    manifestHash: assertNonEmptyString(manifestHash, 'manifestHash'),
  };
  if (!isDatasetVersion(identity.datasetVersion)) {
    throw new InvalidDatasetIdentityError(
      `datasetVersion must be a valid DatasetVersion object (received ${JSON.stringify(datasetVersion)})`,
    );
  }
  if (!HEX64.test(identity.contentHash)) {
    throw new InvalidDatasetIdentityError('contentHash must be a 64-char lowercase hex sha256 string');
  }
  if (!HEX64.test(identity.manifestHash)) {
    throw new InvalidDatasetIdentityError('manifestHash must be a 64-char lowercase hex sha256 string');
  }
  return deepFreeze(identity);
}

/**
 * SCIENTIFIC equivalence: identical scientific content (same contentHash),
 * regardless of datasetId/createdAt/operational provenance. Invalid inputs
 * are never equivalent (false), matching isSameDatasetContent's lenient
 * contract.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function isDatasetIdentityScientificallyEquivalent(a, b) {
  if (!isDatasetIdentity(a) || !isDatasetIdentity(b)) return false;
  return a.contentHash === b.contentHash;
}

/**
 * OPERATIONAL equivalence: same operational assembly (same datasetId and
 * same manifestHash). Invalid inputs are never equivalent (false).
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function isDatasetIdentityOperationallyEquivalent(a, b) {
  if (!isDatasetIdentity(a) || !isDatasetIdentity(b)) return false;
  return a.datasetId === b.datasetId && a.manifestHash === b.manifestHash;
}

/**
 * Full component-wise equality, including datasetVersion. Invalid inputs
 * are never equal (false).
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function datasetIdentitiesEqual(a, b) {
  if (!isDatasetIdentity(a) || !isDatasetIdentity(b)) return false;
  return (
    a.datasetId === b.datasetId &&
    isDatasetVersion(a.datasetVersion) &&
    datasetVersionToString(a.datasetVersion) === datasetVersionToString(b.datasetVersion) &&
    a.schemaVersion === b.schemaVersion &&
    a.observationSchemaVersion === b.observationSchemaVersion &&
    a.contentHash === b.contentHash &&
    a.manifestHash === b.manifestHash
  );
}

/**
 * Deterministic JSON-safe representation: same shape with `datasetVersion`
 * rendered as its canonical 'major.minor.patch' string. Returns a fresh
 * deep-frozen object (no mutable aliasing with the identity).
 *
 * @param {DatasetIdentity} identity
 * @returns {Readonly<{ datasetId: string, datasetVersion: string, schemaVersion: string, observationSchemaVersion: string, contentHash: string, manifestHash: string }>}
 */
export function datasetIdentityToJSON(identity) {
  if (!isDatasetIdentity(identity)) {
    throw new InvalidDatasetIdentityError('expected a valid DatasetIdentity object');
  }
  return deepFreeze({
    datasetId: identity.datasetId,
    datasetVersion: datasetVersionToString(identity.datasetVersion),
    schemaVersion: identity.schemaVersion,
    observationSchemaVersion: identity.observationSchemaVersion,
    contentHash: identity.contentHash,
    manifestHash: identity.manifestHash,
  });
}

/**
 * Frozen API namespace (prompt surface): DatasetIdentity.create(...),
 * DatasetIdentity.isScientificallyEquivalentTo(...),
 * DatasetIdentity.isOperationallyEquivalentTo(...),
 * DatasetIdentity.equals(...), DatasetIdentity.toJSON(). Shallow
 * Object.freeze only — the values are functions.
 *
 * @type {Readonly<{
 *   create: typeof createDatasetIdentity,
 *   isScientificallyEquivalentTo: typeof isDatasetIdentityScientificallyEquivalent,
 *   isOperationallyEquivalentTo: typeof isDatasetIdentityOperationallyEquivalent,
 *   equals: typeof datasetIdentitiesEqual,
 *   toJSON: typeof datasetIdentityToJSON,
 * }>}
 */
export const DatasetIdentity = Object.freeze({
  create: createDatasetIdentity,
  isScientificallyEquivalentTo: isDatasetIdentityScientificallyEquivalent,
  isOperationallyEquivalentTo: isDatasetIdentityOperationallyEquivalent,
  equals: datasetIdentitiesEqual,
  toJSON: datasetIdentityToJSON,
});
