/**
 * Temporal anti-leakage guard.
 *
 * Enforces chronological integrity for evidence records:
 *   prediction.createdAt <= outcome.recordedAt
 *
 * Timestamps are ISO 8601 UTC strings. Comparison uses `new Date()`,
 * which handles timezone-equivalent strings (e.g. "Z" vs "+00:00").
 *
 * Equality is allowed: same-millisecond events are legitimate in
 * an asynchronous capture pipeline.
 */

import { TemporalEvidenceLeakageError } from './errors.js';

/**
 * Validate that a prediction was not recorded after its outcome.
 *
 * @param {Object} params
 * @param {string} params.spinId
 * @param {string} params.predictionCreatedAt — ISO 8601
 * @param {string} params.outcomeRecordedAt — ISO 8601
 * @throws {TemporalEvidenceLeakageError} if prediction.createdAt > outcome.recordedAt
 */
export function validateChronology({ spinId, predictionCreatedAt, outcomeRecordedAt }) {
  const predMs = Date.parse(predictionCreatedAt);
  const outMs = Date.parse(outcomeRecordedAt);

  if (Number.isNaN(predMs) || Number.isNaN(outMs)) {
    throw new TemporalEvidenceLeakageError(
      spinId,
      `INVALID_TS:${predictionCreatedAt}`,
      `INVALID_TS:${outcomeRecordedAt}`,
    );
  }

  if (predMs > outMs) {
    throw new TemporalEvidenceLeakageError(spinId, predictionCreatedAt, outcomeRecordedAt);
  }
}
