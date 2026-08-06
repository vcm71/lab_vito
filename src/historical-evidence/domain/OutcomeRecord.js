/**
 * SpinOutcomeRecord — immutable record of a confirmed spin result.
 *
 * Captures the PHYSICAL outcome only: which number the ball landed on.
 * Derived outcomes (hit/miss for a given target) belong to
 * CalibrationObservation (future phase), not to this record.
 *
 * Design decisions (Fase 2.3.1.1):
 * - Renamed from OutcomeRecord → SpinOutcomeRecord
 * - `winningNumber` replaces `number` (semantic clarity)
 * - `observedOutcome` REMOVED — it depends on the target being evaluated
 * - Backward compat: `createOutcomeRecord` deprecated wrapper available
 *
 * Immutability: all fields are read-only, deep-frozen.
 *
 * @typedef {Object} SpinOutcomeRecord
 * @property {string} outcomeId — globally unique
 * @property {string} spinId — links outcome to predictions
 * @property {string} winningNumber — the landed number (validated)
 * @property {string} recordedAt — ISO 8601 UTC
 * @property {object|null} metadata — opaque JSON-safe frozen metadata bag
 */

import { deepFreeze } from './immutable.js';
import { normaliseMetadata } from './metadata.js';
import { InvalidWinningNumberError } from './errors.js';
import { isValidAmericanRouletteNumber } from './RouletteNumber.js';

export function createSpinOutcomeRecord({
  outcomeId,
  spinId,
  winningNumber,
  recordedAt,
  metadata,
}) {
  // ── Required fields ──────────────────────────────────────────────────
  if (!outcomeId || typeof outcomeId !== 'string') {
    throw new TypeError('outcomeId must be a non-empty string.');
  }
  if (!spinId || typeof spinId !== 'string') {
    throw new TypeError('spinId must be a non-empty string.');
  }
  if (!recordedAt || typeof recordedAt !== 'string') {
    throw new TypeError('recordedAt must be a non-empty ISO string.');
  }

  // ── Winning number validation ────────────────────────────────────────
  if (!isValidAmericanRouletteNumber(winningNumber)) {
    throw new InvalidWinningNumberError(winningNumber);
  }

  // ── Metadata ─────────────────────────────────────────────────────────
  const safeMeta = normaliseMetadata(metadata);

  return deepFreeze({
    outcomeId,
    spinId,
    winningNumber,
    recordedAt,
    metadata: safeMeta,
  });
}

/* ── Backward compatibility wrapper (deprecated) ─────────────────────── */

/**
 * @deprecated Use `createSpinOutcomeRecord` instead.
 * Provided for backward compatibility with Fase 2.3.1 tests.
 * `observedOutcome` is accepted but DISCARDED — it belongs to
 * CalibrationObservation, not to the physical spin outcome.
 */
export function createOutcomeRecord({
  outcomeId,
  spinId,
  number,
  observedOutcome: _observedOutcome,
  recordedAt,
  metadata,
}) {
  return createSpinOutcomeRecord({
    outcomeId,
    spinId,
    winningNumber: number,
    recordedAt,
    metadata,
  });
}
