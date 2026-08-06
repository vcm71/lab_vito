/**
 * RecordOutcomeUseCase — captures the physical spin result.
 *
 * Creates a SpinOutcomeRecord and persists it via EvidenceRepository.
 * The repository enforces temporal anti-leakage against existing predictions.
 */

import { createSpinOutcomeRecord } from '../domain/OutcomeRecord.js';

export class RecordOutcomeUseCase {
  /** @param {EvidenceRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * @param {Object} contract
   * @param {string} contract.outcomeId
   * @param {string} contract.spinId
   * @param {string} contract.winningNumber — "0"|"00"|"1"…"36"
   * @param {string} contract.recordedAt — ISO 8601
   * @param {object} [contract.metadata]
   */
  execute(contract) {
    const record = createSpinOutcomeRecord({
      outcomeId: contract.outcomeId,
      spinId: contract.spinId,
      winningNumber: contract.winningNumber,
      recordedAt: contract.recordedAt,
      metadata: contract.metadata,
    });

    this.repository.saveOutcome(record);
    return record;
  }
}
