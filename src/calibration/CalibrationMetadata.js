/**
 * CalibrationMetadata — builder for calibration-related metadata attached to
 * every calibrated entry and the top-level output.
 *
 * Pure-functional helpers: no instance state, no mutation.
 */

/**
 * Build per-entry calibration metadata.
 *
 * @param {Object} strategyMeta — output of strategy.getMeta()
 * @returns {{name:string,strategyVersion:string,trainingDataset:string|null,trainedAt:string|null,modelVersion:string|null,calibrationVersion:string}}
 */
export function buildPerEntryMeta(strategyMeta) {
  return {
    name: strategyMeta.name,
    strategyVersion: strategyMeta.strategyVersion,
    trainingDataset: strategyMeta.trainingDataset ?? null,
    trainedAt: strategyMeta.trainedAt ?? null,
    modelVersion: strategyMeta.modelVersion ?? null,
    calibrationVersion: strategyMeta.calibrationVersion ?? '1.0.0',
  };
}

/**
 * Build top-level calibration metadata for the output envelope.
 *
 * @param {Object} strategyMeta
 * @param {{processedNumbers:number,validNumbers:number,invalidNumbers:number}} counts
 * @returns {{calibration:{strategy:string,strategyVersion:string,trainingDataset:string|null,trainedAt:string|null,modelVersion:string|null,calibrationVersion:string,processedNumbers:number,validNumbers:number,invalidNumbers:number}}}
 */
export function buildGlobalMeta(strategyMeta, counts) {
  return {
    calibration: {
      strategy: strategyMeta.name,
      strategyVersion: strategyMeta.strategyVersion,
      trainingDataset: strategyMeta.trainingDataset ?? null,
      trainedAt: strategyMeta.trainedAt ?? null,
      modelVersion: strategyMeta.modelVersion ?? null,
      calibrationVersion: strategyMeta.calibrationVersion ?? '1.0.0',
      processedNumbers: counts.processedNumbers ?? 0,
      validNumbers: counts.validNumbers ?? 0,
      invalidNumbers: counts.invalidNumbers ?? 0,
    },
  };
}
