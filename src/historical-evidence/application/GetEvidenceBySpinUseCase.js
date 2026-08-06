/**
 * GetEvidenceBySpinUseCase — retrieves all evidence for a given spin.
 *
 * Returns predictions, the physical outcome (if any), and a computed status.
 */

import { determineStatus } from '../domain/EvidenceStatus.js';
import { SpinNotFoundError } from '../domain/errors.js';

/**
 * @typedef {Object} EvidenceBySpinResult
 * @property {string} spinId
 * @property {PredictionRecord[]} predictions
 * @property {SpinOutcomeRecord|null} outcome
 * @property {string} status — PENDING_OUTCOME | COMPLETED | EMPTY
 */

export class GetEvidenceBySpinUseCase {
  /** @param {EvidenceRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * @param {string} spinId
   * @returns {EvidenceBySpinResult}
   * @throws {SpinNotFoundError} if no evidence exists for this spin
   */
  execute(spinId) {
    const predictions = this.repository.getPredictionsBySpinId(spinId);
    const outcome = this.repository.getOutcomeBySpinId(spinId);
    const status = determineStatus(predictions, outcome);

    if (status === 'EMPTY') {
      throw new SpinNotFoundError(spinId);
    }

    return { spinId, predictions, outcome, status };
  }
}
