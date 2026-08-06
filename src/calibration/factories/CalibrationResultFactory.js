/**
 * CalibrationResultFactory — builds output objects conforming to the
 * CalibrationOutput contract.
 *
 * All factory methods return new objects (no mutation of inputs).
 * Deep cloning is handled by ProbabilityCalibrator via structuralClone.
 */

import { buildPerEntryMeta, buildGlobalMeta } from '../CalibrationMetadata.js';

export class CalibrationResultFactory {
  /**
   * @param {import('./CalibrationStrategyRegistry.js').CalibrationStrategyRegistry} registry
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Build a single calibrated entry from an input entry + strategy result.
   *
   * @param {Object} inputEntry — per-number entry from ConsensusEngine
   * @param {Object} strategyResult — {calibratedProbability, metadata}
   * @param {Object} strategyMeta — output of strategy.getMeta()
   * @returns {Object} CalibratedEntry
   */
  buildEntry(inputEntry, strategyResult, strategyMeta) {
    const calibrationMeta = buildPerEntryMeta(strategyMeta);

    return {
      number: inputEntry.number,
      rawConsensusScore: inputEntry.rawConsensusScore,
      calibratedProbability: strategyResult.calibratedProbability,
      valid: inputEntry.valid,
      invalidReason: inputEntry.invalidReason,
      engineScores: inputEntry.engineScores,
      engineContributions: inputEntry.engineContributions,
      agreement: inputEntry.agreement,
      conflicts: inputEntry.conflicts,
      confidence: inputEntry.confidence,
      coverage: inputEntry.coverage,
      explanation: inputEntry.explanation,
      calibration: calibrationMeta,
    };
  }

  /**
   * Build the top-level output envelope.
   *
   * @param {Object} calibratedNumbers — { [num]: CalibratedEntry }
   * @param {Object} originalMetadata — input.metadata from ConsensusEngine
   * @param {Object} strategyMeta
   * @returns {Object} CalibrationOutput
   */
  buildOutput(calibratedNumbers, originalMetadata, strategyMeta) {
    const entryCount = Object.keys(calibratedNumbers).length;
    let validCount = 0;
    let invalidCount = 0;

    for (const entry of Object.values(calibratedNumbers)) {
      if (entry.valid) validCount++;
      else invalidCount++;
    }

    return {
      numbers: calibratedNumbers,
      metadata: {
        consensus: originalMetadata.consensus,
        ...buildGlobalMeta(strategyMeta, {
          processedNumbers: entryCount,
          validNumbers: validCount,
          invalidNumbers: invalidCount,
        }),
      },
    };
  }
}
