/**
 * EvidenceStatus — lifecycle of a prediction-outcome pair.
 *
 * ── Active states ──
 * PENDING_OUTCOME   Prediction(s) recorded, no physical outcome yet.
 * COMPLETED         At least one prediction + physical outcome resolved.
 * EMPTY             No evidence exists for this spin (returned by query).
 *
 * ── Deprecated ──
 * PENDING           @deprecated use PENDING_OUTCOME instead.
 * RESOLVED          @deprecated use COMPLETED instead.
 * CONFLICT          @deprecated — contradictions are rejected at the door;
 *                   the repository never returns this as a state.
 *
 * Only PENDING_OUTCOME, COMPLETED, and EMPTY are returned by query use cases.
 */
export const EvidenceStatus = Object.freeze({
  PENDING_OUTCOME: 'PENDING_OUTCOME',
  COMPLETED: 'COMPLETED',
  EMPTY: 'EMPTY',
  /** @deprecated Use PENDING_OUTCOME instead. */
  PENDING: 'PENDING_OUTCOME',
  /** @deprecated Use COMPLETED instead. */
  RESOLVED: 'COMPLETED',
  /** @deprecated Contradictions are rejected — never returned as state. */
  CONFLICT: 'CONFLICT',
});

/**
 * Determine evidence state from stored data.
 * Package-private; used by GetEvidenceBySpinUseCase.
 *
 * @param {Array} predictions
 * @param {object|null} outcome
 * @returns {string} one of PENDING_OUTCOME | COMPLETED
 * @internal
 */
export function determineStatus(predictions, outcome) {
  if (predictions.length === 0 && outcome === null) return EvidenceStatus.EMPTY;
  if (outcome !== null) return EvidenceStatus.COMPLETED;
  return EvidenceStatus.PENDING_OUTCOME;
}
