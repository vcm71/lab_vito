/**
 * CalibrationTrainer — responsible ONLY for training calibration models.
 *
 * NEVER performs inference. Training and inference are strictly separated:
 *   Trainer.fit(dataset, strategy) → CalibrationModel
 *   ProbabilityCalibrator.calibrate(input) → calibratedOutput
 */

import { CalibrationModel } from './CalibrationModel.js';
import { CalibrationModelFactory } from './CalibrationModelFactory.js';

export class CalibrationTrainer {
  constructor(options = {}) {
    this.mode = options.mode ?? 'tolerant';
    this.modelFactory = options.modelFactory ?? new CalibrationModelFactory();
  }

  /**
   * Train a strategy on a dataset → produce a CalibrationModel.
   *
   * @param {import('./strategies/CalibrationStrategy.js').CalibrationStrategy} strategy
   * @param {import('./CalibrationDataset.js').CalibrationDataset} dataset
   * @param {import('./CalibrationContext.js').CalibrationContext} [context]
   * @returns {CalibrationModel}
   */
  fit(strategy, dataset, context = null) {
    if (!strategy || typeof strategy.fit !== 'function') {
      throw new TypeError('CalibrationTrainer.fit: strategy must implement fit(dataset, context).');
    }
    if (!dataset || !dataset.records) {
      throw new TypeError('CalibrationTrainer.fit: dataset must be a CalibrationDataset.');
    }

    // 1. Train the strategy
    const params = strategy.fit(dataset, context);

    // 2. Evaluate metrics on the training set
    const metrics = {};
    const scores = dataset.records.map(r => r.rawConsensusScore);
    const outcomes = dataset.records.map(r => r.observedOutcome ? 1 : 0);

    // Compute predictions from the strategy
    const predictions = scores.map(s => strategy.calibrate(s).calibratedProbability ?? 0);

    // Compute standard metrics
    metrics.brierScore = computeBrierScore(predictions, outcomes);
    metrics.logLoss = computeLogLoss(predictions, outcomes);
    metrics.ece = computeECE(predictions, outcomes, 10);
    metrics.accuracy = computeAccuracy(predictions, outcomes);
    metrics.trainingSamples = dataset.records.length;

    // 3. Build the model
    const hash = CalibrationModel.computeHash(
      params,
      dataset.datasetVersion,
      strategy.name,
      strategy.strategyVersion,
    );

    return this.modelFactory.build({
      strategy: strategy.name,
      strategyVersion: strategy.strategyVersion,
      datasetVersion: dataset.datasetVersion,
      parameters: params,
      metrics,
      hash,
      trainingSamples: dataset.records.length,
    });
  }
}

// ── Inline metric helpers (avoid circular imports with metrics/) ─────────────

function computeBrierScore(predictions, outcomes) {
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    sum += (predictions[i] - outcomes[i]) ** 2;
  }
  return predictions.length > 0 ? sum / predictions.length : 0;
}

function computeLogLoss(predictions, outcomes, eps = 1e-15) {
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    const p = Math.max(eps, Math.min(1 - eps, predictions[i]));
    sum += outcomes[i] * Math.log(p) + (1 - outcomes[i]) * Math.log(1 - p);
  }
  return predictions.length > 0 ? -sum / predictions.length : 0;
}

function computeECE(predictions, outcomes, nBuckets = 10) {
  const bucketSize = 1 / nBuckets;
  let ece = 0;
  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize;
    const hi = (b + 1) * bucketSize;
    const idx = [];
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] >= lo && predictions[i] < hi) idx.push(i);
    }
    if (idx.length === 0) continue;
    const meanPred = idx.reduce((s, i) => s + predictions[i], 0) / idx.length;
    const meanObs = idx.reduce((s, i) => s + outcomes[i], 0) / idx.length;
    ece += (idx.length / predictions.length) * Math.abs(meanPred - meanObs);
  }
  return ece;
}

function computeAccuracy(predictions, outcomes, threshold = 0.5) {
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    const predClass = predictions[i] >= threshold ? 1 : 0;
    if (predClass === outcomes[i]) correct++;
  }
  return predictions.length > 0 ? correct / predictions.length : 0;
}
