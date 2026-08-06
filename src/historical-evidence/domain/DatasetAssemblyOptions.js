/**
 * DatasetAssemblyOptions — immutable, validated options for assembling a
 * historical calibration dataset.
 *
 * Every option is explicit. `null` means "no filter applied" (except
 * booleans, which default to false). Arrays are normalised to sorted,
 * de-duplicated, deep-frozen lists so that the manifest is reproducible
 * regardless of the caller's ordering.
 *
 * Policies (Fase 2.3.3):
 * - Temporal windows are INCLUSIVE on both ends (from <= x <= to).
 *   The same policy applies to prediction and outcome windows.
 * - `duplicatePolicy` is 'REJECT' only: a scientific dataset never
 *   silently merges rows (idempotency is the repository's concern).
 * - `unsupportedSchemaPolicy` is 'REJECT_DATASET' only: schemas are never
 *   mixed or migrated silently.
 * - `invalidObservationPolicy` defaults to 'REJECT_DATASET' (all-or-
 *   nothing). 'EXCLUDE_AND_REPORT' drops invalid rows but records every
 *   exclusion in the manifest — never silent.
 * - `allowEmpty` permits an empty dataset (statistics/period are nulled),
 *   default false: an empty scientific dataset is rejected.
 */

import { deepFreeze } from './immutable.js';
import { InvalidDatasetOptionsError } from './errors.js';

/** @type {string} — stable builder version, part of the manifest */
export const DATASET_BUILDER_VERSION = '1';

/** @type {string} — stable contract version of the options shape */
export const DATASET_ASSEMBLY_OPTIONS_SCHEMA_VERSION = '1';

const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** @type {readonly string[]} — canonical sort keys, first to last */
export const CANONICAL_SORT_ORDER = Object.freeze([
  'predictionCreatedAt',
  'spinId',
  'predictionId',
  'outcomeId',
  'observationId',
]);

const SUPPORTED_POLICIES = Object.freeze({
  duplicatePolicy: Object.freeze(['REJECT']),
  unsupportedSchemaPolicy: Object.freeze(['REJECT_DATASET']),
  invalidObservationPolicy: Object.freeze(['REJECT_DATASET', 'EXCLUDE_AND_REPORT']),
});

/** @type {DatasetAssemblyOptions} — defaults when no options are provided */
export const DEFAULT_DATASET_ASSEMBLY_OPTIONS = deepFreeze({
  schemaVersion: DATASET_ASSEMBLY_OPTIONS_SCHEMA_VERSION,
  includeCalibrationStrategies: null,
  excludeCalibrationStrategies: null,
  includeTargetTypes: null,
  predictionCreatedFrom: null,
  predictionCreatedTo: null,
  outcomeRecordedFrom: null,
  outcomeRecordedTo: null,
  requireCalibration: false,
  requireModelIdentity: false,
  duplicatePolicy: 'REJECT',
  unsupportedSchemaPolicy: 'REJECT_DATASET',
  invalidObservationPolicy: 'REJECT_DATASET',
  allowEmpty: false,
});

/**
 * Check whether a value looks like an ISO 8601 timestamp (UTC or with
 * explicit offset). Lexicographic string comparison is then safe for
 * ordering because the pattern forces fixed-width fields.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isIsoTimestamp(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (!ISO_TIMESTAMP_PATTERN.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

/**
 * Normalise a string array option: null/undefined → null, otherwise a
 * sorted, de-duplicated, deep-frozen array of non-empty strings.
 *
 * @param {*} value
 * @param {string} field
 * @returns {readonly string[]|null}
 */
function normaliseStringList(value, field) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) {
    throw new InvalidDatasetOptionsError(`${field} must be an array of strings or null.`);
  }
  const cleaned = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) {
      throw new InvalidDatasetOptionsError(`${field} must contain only non-empty strings.`);
    }
    cleaned.push(item);
  }
  const unique = [...new Set(cleaned)].sort();
  return deepFreeze(unique);
}

/**
 * Create deep-frozen, normalised DatasetAssemblyOptions.
 *
 * @param {Object} [options]
 * @param {string[]|null} [options.includeCalibrationStrategies]
 * @param {string[]|null} [options.excludeCalibrationStrategies]
 * @param {string[]|null} [options.includeTargetTypes]
 * @param {string|null} [options.predictionCreatedFrom] — ISO 8601, inclusive
 * @param {string|null} [options.predictionCreatedTo] — ISO 8601, inclusive
 * @param {string|null} [options.outcomeRecordedFrom] — ISO 8601, inclusive
 * @param {string|null} [options.outcomeRecordedTo] — ISO 8601, inclusive
 * @param {boolean} [options.requireCalibration=false]
 * @param {boolean} [options.requireModelIdentity=false]
 * @param {'REJECT'} [options.duplicatePolicy='REJECT']
 * @param {'REJECT_DATASET'} [options.unsupportedSchemaPolicy='REJECT_DATASET']
 * @param {'REJECT_DATASET'|'EXCLUDE_AND_REPORT'} [options.invalidObservationPolicy='REJECT_DATASET']
 * @param {boolean} [options.allowEmpty=false]
 * @returns {DatasetAssemblyOptions}
 */
export function createDatasetAssemblyOptions(options) {
  if (options === undefined || options === null) return DEFAULT_DATASET_ASSEMBLY_OPTIONS;
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new InvalidDatasetOptionsError('options must be a plain object or null.');
  }

  const schemaVersion =
    options.schemaVersion !== undefined
      ? options.schemaVersion
      : DATASET_ASSEMBLY_OPTIONS_SCHEMA_VERSION;
  if (schemaVersion !== DATASET_ASSEMBLY_OPTIONS_SCHEMA_VERSION) {
    throw new InvalidDatasetOptionsError(
      `unsupported schemaVersion "${schemaVersion}" (expected "${DATASET_ASSEMBLY_OPTIONS_SCHEMA_VERSION}").`,
    );
  }

  const stringFields = [
    'predictionCreatedFrom',
    'predictionCreatedTo',
    'outcomeRecordedFrom',
    'outcomeRecordedTo',
  ];
  const timestamps = {};
  for (const field of stringFields) {
    const value = options[field];
    if (value === undefined || value === null) {
      timestamps[field] = null;
      continue;
    }
    if (!isIsoTimestamp(value)) {
      throw new InvalidDatasetOptionsError(
        `${field} must be a valid ISO 8601 timestamp (received ${JSON.stringify(value)}).`,
      );
    }
    timestamps[field] = value;
  }

  // Temporal window sanity: from <= to on each axis.
  if (
    timestamps.predictionCreatedFrom !== null &&
    timestamps.predictionCreatedTo !== null &&
    timestamps.predictionCreatedFrom > timestamps.predictionCreatedTo
  ) {
    throw new InvalidDatasetOptionsError(
      'predictionCreatedFrom must not be later than predictionCreatedTo.',
    );
  }
  if (
    timestamps.outcomeRecordedFrom !== null &&
    timestamps.outcomeRecordedTo !== null &&
    timestamps.outcomeRecordedFrom > timestamps.outcomeRecordedTo
  ) {
    throw new InvalidDatasetOptionsError(
      'outcomeRecordedFrom must not be later than outcomeRecordedTo.',
    );
  }

  const booleans = {};
  for (const field of ['requireCalibration', 'requireModelIdentity', 'allowEmpty']) {
    const value = options[field];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new InvalidDatasetOptionsError(`${field} must be a boolean.`);
    }
    booleans[field] = value === undefined ? false : value;
  }

  const policies = {};
  for (const [field, supported] of Object.entries(SUPPORTED_POLICIES)) {
    const value = options[field] !== undefined ? options[field] : supported[0];
    if (!supported.includes(value)) {
      throw new InvalidDatasetOptionsError(
        `${field} must be one of: ${supported.join(', ')} (received ${JSON.stringify(value)}).`,
      );
    }
    policies[field] = value;
  }

  return deepFreeze({
    schemaVersion,
    includeCalibrationStrategies: normaliseStringList(
      options.includeCalibrationStrategies,
      'includeCalibrationStrategies',
    ),
    excludeCalibrationStrategies: normaliseStringList(
      options.excludeCalibrationStrategies,
      'excludeCalibrationStrategies',
    ),
    includeTargetTypes: normaliseStringList(options.includeTargetTypes, 'includeTargetTypes'),
    ...timestamps,
    ...booleans,
    ...policies,
  });
}
