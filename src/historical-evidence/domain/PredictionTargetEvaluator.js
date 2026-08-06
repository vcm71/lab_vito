/**
 * PredictionTargetEvaluator — pure, deterministic evaluation of a
 * PredictionTarget against the physical outcome (winningNumber).
 *
 * Derives the binary `observedOutcome` used by CalibrationObservation:
 *   1  → the target was satisfied by the physical outcome
 *   0  → the target was not satisfied
 *
 * Design decisions (Fase 2.3.2):
 * - STRICT string comparison for NUMBER targets: "0" and "00" are distinct
 *   numbers and never match each other.
 * - Only `NUMBER` is supported today; unknown types are rejected with
 *   UnsupportedPredictionTargetError so future types cannot silently
 *   produce incorrect observations.
 * - The evaluator never mutates its inputs and has no state.
 */

import { isValidAmericanRouletteNumber } from './RouletteNumber.js';
import {
  InvalidPredictionTargetError,
  InvalidWinningNumberError,
  UnsupportedPredictionTargetError,
} from './errors.js';

/** @type {ReadonlyArray<string>} — frozen, supported target types */
export const SUPPORTED_PREDICTION_TARGETS = Object.freeze(['NUMBER']);

/**
 * Evaluate a prediction target against the landed number.
 *
 * @param {object} target — PredictionTarget, e.g. { type: 'NUMBER', value: '23' }
 * @param {string} winningNumber — validated American roulette number
 * @returns {0|1}
 * @throws {InvalidPredictionTargetError} malformed target or invalid NUMBER value
 * @throws {UnsupportedPredictionTargetError} target type not yet supported
 * @throws {InvalidWinningNumberError} winningNumber is not a valid roulette number
 */
export function evaluatePredictionTarget(target, winningNumber) {
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    throw new InvalidPredictionTargetError('<missing>', target);
  }

  const type = target.type;
  if (typeof type !== 'string' || type.length === 0) {
    throw new InvalidPredictionTargetError('<missing>', target);
  }

  if (type !== 'NUMBER') {
    throw new UnsupportedPredictionTargetError(type, SUPPORTED_PREDICTION_TARGETS);
  }

  if (typeof target.value !== 'string' || !isValidAmericanRouletteNumber(target.value)) {
    throw new InvalidPredictionTargetError('NUMBER', target.value);
  }

  if (!isValidAmericanRouletteNumber(winningNumber)) {
    throw new InvalidWinningNumberError(winningNumber);
  }

  return target.value === winningNumber ? 1 : 0;
}
