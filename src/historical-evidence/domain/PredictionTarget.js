/**
 * PredictionTarget — extensible, discriminated target of a prediction.
 *
 * Currently only `NUMBER` is fully implemented and validated.
 * The contract is designed to accept future types (COLOR, PARITY, etc.)
 * without breaking existing evidence.
 *
 * Immutability: all targets are deep-frozen on creation.
 */

import { isValidAmericanRouletteNumber } from './RouletteNumber.js';
import { deepFreeze } from './immutable.js';
import { InvalidPredictionTargetError } from './errors.js';

/** @type {ReadonlySet<string>} */
export const VALID_TARGET_TYPES = new Set(['NUMBER']);

/**
 * Create a NUMBER target.
 *
 * @param {string} value — must be a valid American roulette number string
 * @returns {PredictionTarget} frozen target with type 'NUMBER'
 * @throws {InvalidPredictionTargetError}
 */
export function createNumberTarget(value) {
  if (typeof value !== 'string' || !isValidAmericanRouletteNumber(value)) {
    throw new InvalidPredictionTargetError('NUMBER', value);
  }
  return deepFreeze({ type: 'NUMBER', value });
}
