/**
 * RecordPredictionUseCase — captures a calibrated prediction before the spin lands.
 *
 * Creates a PredictionRecord and persists it via EvidenceRepository.
 */

import { createPredictionRecord } from '../domain/PredictionRecord.js';
import { createNumberTarget } from '../domain/PredictionTarget.js';

export class RecordPredictionUseCase {
  /** @param {EvidenceRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * @param {Object} contract
   * @param {string} contract.predictionId
   * @param {string} contract.spinId
   * @param {object} contract.target — PredictionTarget; or `{ number }` shortcut
   * @param {number} contract.rawConsensusScore — [0, 1]
   * @param {{ probability: number, strategyName: string, modelId?: string, modelHash?: string }|null} [contract.calibration]
   * @param {string} contract.createdAt — ISO 8601
   * @param {object} [contract.metadata]
   */
  execute(contract) {
    // Backward compat shortcut: accept { number } and convert to NUMBER target
    const target = contract.target ? contract.target : createNumberTarget(contract.number);

    const record = createPredictionRecord({
      predictionId: contract.predictionId,
      spinId: contract.spinId,
      target,
      rawConsensusScore: contract.rawConsensusScore,
      calibration: contract.calibration ?? null,
      createdAt: contract.createdAt,
      metadata: contract.metadata,
    });

    this.repository.savePrediction(record);
    return record;
  }
}
