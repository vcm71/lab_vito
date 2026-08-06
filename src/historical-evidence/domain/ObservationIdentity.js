/**
 * ObservationIdentity — identity policy for calibration observations.
 *
 * Rules (Fase 2.3.2):
 * - observationId must be caller-provided or produced by an injected
 *   generator. It is NEVER derived from Math.random(), timestamps, array
 *   positions, or implicit domain-side generation.
 * - Accepted characters: [A-Za-z0-9._-], first char alphanumeric. No
 *   spaces, no colons — keeps IDs safe as keys and in filenames.
 * - Logical uniqueness: the (predictionId, outcomeId) pair identifies an
 *   observation. Duplicate detection is based on this pair (see
 *   InMemoryCalibrationObservationRepository), not on observationId alone.
 * - The default sequential generator is deterministic: for the same spin
 *   and the same deterministic prediction order, the same observationIds
 *   are produced.
 */

import { InvalidObservationIdError } from './errors.js';

/** @type {RegExp} — safe, stable, ASCII id pattern */
export const OBSERVATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * @param {*} value
 * @returns {boolean} true iff value is a non-empty string matching the id pattern
 */
export function isValidObservationId(value) {
  return typeof value === 'string' && OBSERVATION_ID_PATTERN.test(value);
}

/**
 * @param {*} value
 * @returns {string} the validated id
 * @throws {InvalidObservationIdError}
 */
export function assertValidObservationId(value) {
  if (!isValidObservationId(value)) {
    throw new InvalidObservationIdError(value);
  }
  return value;
}

/**
 * Deterministic sequential id for batch construction:
 * `obs-<spinId>-<n>` where n is 1-based position in the deterministic
 * batch order. Only suitable when spinId itself is id-safe; the builder
 * validates the final id and rejects unsafe results.
 *
 * @param {string} spinId
 * @param {number} index — 0-based position in the batch order
 * @returns {string}
 */
export function createSequentialObservationId(spinId, index) {
  return `obs-${spinId}-${index + 1}`;
}
