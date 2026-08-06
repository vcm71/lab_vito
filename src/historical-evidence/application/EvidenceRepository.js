/**
 * EvidenceRepository — abstract port for persisting prediction-outcome evidence.
 *
 * Contract invariants (enforced by implementations):
 * 1. No duplicate predictions (by predictionId).
 * 2. No duplicate outcomes for the same spinId (idempotent if identical).
 * 3. No contradictory outcomes (different winningNumber for same spinId).
 * 4. No temporal leakage (prediction.createdAt <= outcome.recordedAt).
 * 5. Deep-immutable returns (no external mutation of stored data).
 * 6. Deterministic ordering (createdAt desc, predictionId as tiebreaker).
 *
 * This is the "port" in ports-and-adapters.
 */

export class EvidenceRepository {
  /** @param {PredictionRecord} record @throws {DuplicatePredictionError} */
  savePrediction(_record) { throw new Error('Not implemented — abstract port.'); }

  /** @param {SpinOutcomeRecord} record @throws {DuplicateOutcomeError|ContradictoryOutcomeError|TemporalEvidenceLeakageError} */
  saveOutcome(_record) { throw new Error('Not implemented — abstract port.'); }

  /** @param {string} spinId @returns {SpinOutcomeRecord|null} */
  getOutcomeBySpinId(_spinId) { throw new Error('Not implemented — abstract port.'); }

  /** @param {string} spinId @returns {PredictionRecord[]} */
  getPredictionsBySpinId(_spinId) { throw new Error('Not implemented — abstract port.'); }

  /** @returns {void} */
  clear() { throw new Error('Not implemented — abstract port.'); }
}
