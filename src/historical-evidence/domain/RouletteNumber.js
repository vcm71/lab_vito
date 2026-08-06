/**
 * RouletteNumber — canonical validation for American roulette numbers.
 *
 * ONLY "0", "00", and "1"…"36" are valid. No coercions, no normalisation.
 * Reuses `AMERICAN_ROULETTE_NUMBERS` from consensus constants as the
 * single source of truth — no duplicated arrays.
 */

import { AMERICAN_ROULETTE_NUMBERS } from '../../consensus/constants/consensusConstants.js';

/* ── O(1) lookup set ─────────────────────────────────────────────────── */

const AMERICAN_ROULETTE_NUMBER_SET = new Set(AMERICAN_ROULETTE_NUMBERS);

/* ── Validator ───────────────────────────────────────────────────────── */

/**
 * Returns `true` iff `value` is exactly one of "0", "00", "1"…"36".
 * Rejects numbers, whitespace, and all non-string types.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isValidAmericanRouletteNumber(value) {
  return typeof value === 'string' && AMERICAN_ROULETTE_NUMBER_SET.has(value);
}
