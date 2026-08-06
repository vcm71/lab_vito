/**
 * DatasetVersionPolicy — directional compatibility between dataset versions.
 *
 * The policy is a READ-ONLY classifier: it never migrates data, never
 * reinterprets observations, never mutates anything. It answers one question:
 * can a consumer running under version `current` consume an artifact
 * produced under version `other`?
 *
 * Directional semantics (not symmetric):
 * - IDENTICAL            — current == other.
 * - BACKWARD_COMPATIBLE  — same major, current > other: the NEWER consumer
 *                          can read data written by an OLDER producer.
 * - FORWARD_COMPATIBLE   — same major, current < other: the OLDER consumer
 *                          can read data written by a NEWER producer
 *                          (declared forward compatibility).
 * - INCOMPATIBLE         — major versions differ. By default the project
 *                          treats a major bump as a breaking contract; no
 *                          implicit migration is ever performed.
 *
 * Structural contract versions (schemaVersion, observationSchemaVersion)
 * are NOT part of this policy: they keep requiring exact equality
 * (unsupportedSchemaPolicy = REJECT_DATASET in DatasetAssemblyOptions).
 * This policy governs the dataset artifact version only.
 */

import { InvalidDatasetVersionError, IncompatibleDatasetVersionError } from './errors.js';
import { isDatasetVersion, compareDatasetVersions } from './DatasetVersion.js';

/** @type {Readonly<{ IDENTICAL: string, BACKWARD_COMPATIBLE: string, FORWARD_COMPATIBLE: string, INCOMPATIBLE: string }>} */
export const VERSION_COMPATIBILITY = Object.freeze({
  IDENTICAL: 'IDENTICAL',
  BACKWARD_COMPATIBLE: 'BACKWARD_COMPATIBLE',
  FORWARD_COMPATIBLE: 'FORWARD_COMPATIBLE',
  INCOMPATIBLE: 'INCOMPATIBLE',
});

/**
 * Classify the compatibility of `other` (artifact) with respect to
 * `current` (consumer).
 *
 * @param {*} current — consumer version (DatasetVersion object)
 * @param {*} other — artifact version (DatasetVersion object)
 * @returns {string} one of VERSION_COMPATIBILITY values
 * @throws {InvalidDatasetVersionError} if either input is not a valid DatasetVersion
 */
export function getDatasetVersionCompatibility(current, other) {
  if (!isDatasetVersion(current)) {
    throw new InvalidDatasetVersionError('current must be a valid DatasetVersion object');
  }
  if (!isDatasetVersion(other)) {
    throw new InvalidDatasetVersionError('other must be a valid DatasetVersion object');
  }
  if (current.major !== other.major) return VERSION_COMPATIBILITY.INCOMPATIBLE;
  const order = compareDatasetVersions(current, other);
  if (order === 0) return VERSION_COMPATIBILITY.IDENTICAL;
  return order > 0
    ? VERSION_COMPATIBILITY.BACKWARD_COMPATIBLE
    : VERSION_COMPATIBILITY.FORWARD_COMPATIBLE;
}

/**
 * Guard: throws IncompatibleDatasetVersionError when the verdict is
 * INCOMPATIBLE, otherwise returns the verdict. Consumers that must refuse
 * incompatible artifacts use this as their gate.
 *
 * @param {*} current — consumer version (DatasetVersion object)
 * @param {*} other — artifact version (DatasetVersion object)
 * @returns {string} one of VERSION_COMPATIBILITY values (never INCOMPATIBLE)
 * @throws {InvalidDatasetVersionError} on invalid inputs
 * @throws {IncompatibleDatasetVersionError} when major versions differ
 */
export function assertDatasetVersionCompatible(current, other) {
  const verdict = getDatasetVersionCompatibility(current, other);
  if (verdict === VERSION_COMPATIBILITY.INCOMPATIBLE) {
    throw new IncompatibleDatasetVersionError(
      `${current.major}.${current.minor}.${current.patch}`,
      `${other.major}.${other.minor}.${other.patch}`,
    );
  }
  return verdict;
}
