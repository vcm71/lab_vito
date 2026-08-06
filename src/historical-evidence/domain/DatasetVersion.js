/**
 * DatasetVersion — immutable scientific version of a historical calibration
 * dataset artifact (major.minor.patch).
 *
 * Design decisions (Fase 2.3.4.1):
 * - Functional value object: `createDatasetVersion` returns a deep-frozen
 *   plain object `{ major, minor, patch }`. Plain objects are required
 *   because `deepFreeze` rejects class instances (immutable.js).
 * - Components are non-negative SAFE integers (`Number.isSafeInteger`):
 *   NaN, Infinity, decimals, numeric strings, null/undefined and missing
 *   fields are rejected with a typed error (no silent coercion).
 * - Canonical textual form is `${major}.${minor}.${patch}` — no leading
 *   zeros, no 'v' prefix, no suffixes. `parseDatasetVersion` rejects any
 *   text that is not exactly that form (e.g. '1.2', '01.2.3', '1.2.3.4',
 *   'v1.2.3', '1.2.x', '').
 * - The frozen `DatasetVersion` namespace exposes the API surface requested
 *   for this phase (create/parse/equals/compare/toString/toJSON) while the
 *   underlying implementation stays functional, consistent with the rest of
 *   the domain.
 *
 * @typedef {Readonly<{ major: number, minor: number, patch: number }>} DatasetVersion
 */

import { deepFreeze } from './immutable.js';
import { InvalidDatasetVersionError } from './errors.js';

/**
 * Exact canonical form: three dot-separated non-negative integer segments
 * without leading zeros.
 * @type {RegExp}
 */
const CANONICAL_VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Check whether a value is a valid DatasetVersion object.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isDatasetVersion(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const { major, minor, patch } = value;
  return (
    typeof major === 'number' &&
    Number.isSafeInteger(major) &&
    major >= 0 &&
    typeof minor === 'number' &&
    Number.isSafeInteger(minor) &&
    minor >= 0 &&
    typeof patch === 'number' &&
    Number.isSafeInteger(patch) &&
    patch >= 0
  );
}

/**
 * Validate a single version component.
 *
 * @param {*} value
 * @param {string} field
 * @returns {number}
 */
function assertComponent(value, field) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new InvalidDatasetVersionError(
      `${field} must be a non-negative safe integer (received ${JSON.stringify(value)})`,
      value,
    );
  }
  return value;
}

/**
 * Create a deep-frozen DatasetVersion.
 *
 * @param {number} major
 * @param {number} minor
 * @param {number} patch
 * @returns {DatasetVersion}
 */
export function createDatasetVersion(major, minor, patch) {
  return deepFreeze({
    major: assertComponent(major, 'major'),
    minor: assertComponent(minor, 'minor'),
    patch: assertComponent(patch, 'patch'),
  });
}

/**
 * Parse the canonical textual form 'major.minor.patch' into a frozen
 * DatasetVersion. Leading zeros, negative numbers, extra segments and any
 * non-numeric input are rejected.
 *
 * @param {*} text
 * @returns {DatasetVersion}
 * @throws {InvalidDatasetVersionError}
 */
export function parseDatasetVersion(text) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new InvalidDatasetVersionError(
      'text must be a non-empty string in canonical form "major.minor.patch"',
      text,
    );
  }
  const match = CANONICAL_VERSION_PATTERN.exec(text);
  if (!match) {
    throw new InvalidDatasetVersionError(
      'text must match canonical form "major.minor.patch" without leading zeros',
      text,
    );
  }
  return createDatasetVersion(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
}

/**
 * Canonical textual representation: 'major.minor.patch'.
 *
 * @param {DatasetVersion} version
 * @returns {string}
 */
export function datasetVersionToString(version) {
  if (!isDatasetVersion(version)) {
    throw new InvalidDatasetVersionError('expected a valid DatasetVersion object');
  }
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Deterministic JSON representation: the canonical 'major.minor.patch' string.
 *
 * @param {DatasetVersion} version
 * @returns {string}
 */
export function datasetVersionToJSON(version) {
  return datasetVersionToString(version);
}

/**
 * Component-wise equality.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function datasetVersionsEqual(a, b) {
  if (!isDatasetVersion(a) || !isDatasetVersion(b)) return false;
  return (
    a.major === b.major &&
    a.minor === b.minor &&
    a.patch === b.patch
  );
}

/**
 * Component-wise comparison: -1 if a < b, 0 if equal, 1 if a > b.
 * Major dominates, then minor, then patch (semver-like ordering).
 *
 * @param {DatasetVersion} a
 * @param {DatasetVersion} b
 * @returns {-1|0|1}
 * @throws {InvalidDatasetVersionError} on invalid inputs
 */
export function compareDatasetVersions(a, b) {
  if (!isDatasetVersion(a)) {
    throw new InvalidDatasetVersionError('expected a valid DatasetVersion object (first argument)');
  }
  if (!isDatasetVersion(b)) {
    throw new InvalidDatasetVersionError('expected a valid DatasetVersion object (second argument)');
  }
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

/**
 * Frozen API namespace (prompt surface): DatasetVersion.create(...),
 * DatasetVersion.parse(...), DatasetVersion.equals(...),
 * DatasetVersion.compare(...), DatasetVersion.toString(),
 * DatasetVersion.toJSON(). Shallow Object.freeze only — the values are
 * functions, which deepFreeze would reject.
 *
 * @type {Readonly<{
 *   create: typeof createDatasetVersion,
 *   parse: typeof parseDatasetVersion,
 *   equals: typeof datasetVersionsEqual,
 *   compare: typeof compareDatasetVersions,
 *   toString: typeof datasetVersionToString,
 *   toJSON: typeof datasetVersionToJSON,
 * }>}
 */
export const DatasetVersion = Object.freeze({
  create: createDatasetVersion,
  parse: parseDatasetVersion,
  equals: datasetVersionsEqual,
  compare: compareDatasetVersions,
  toString: datasetVersionToString,
  toJSON: datasetVersionToJSON,
});
