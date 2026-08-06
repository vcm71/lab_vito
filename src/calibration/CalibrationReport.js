/**
 * CalibrationReport — aggregates model + dataset + metrics + diagram.
 * Pure data object. No UI.
 */

import { brierScore } from './metrics/BrierScore.js';
import { logLoss } from './metrics/LogLoss.js';
import { ece } from './metrics/ECE.js';
import { mce } from './metrics/MCE.js';
import { sharpness } from './metrics/Sharpness.js';
import { accuracy } from './metrics/Accuracy.js';
import { buildReliabilityDiagram } from './ReliabilityDiagram.js';

export function buildCalibrationReport(options = {}) {
  const { model, dataset, predictions, outcomes, warnings = [], limitations = [] } = options;

  const report = {
    model: model ? model.toJSON() : null,
    dataset: dataset ? { id: dataset.id, datasetVersion: dataset.datasetVersion, recordCount: dataset.recordCount } : null,
    metrics: null,
    diagram: null,
    warnings: [...warnings],
    limitations: [...limitations],
    generatedAt: new Date().toISOString(),
  };

  if (predictions && outcomes && predictions.length > 0) {
    report.metrics = {
      brierScore: parseFloat(brierScore(predictions, outcomes).toFixed(6)),
      logLoss: parseFloat(logLoss(predictions, outcomes).toFixed(6)),
      ece: parseFloat(ece(predictions, outcomes).toFixed(6)),
      mce: parseFloat(mce(predictions, outcomes).toFixed(6)),
      sharpness: parseFloat(sharpness(predictions).toFixed(6)),
      accuracy: parseFloat(accuracy(predictions, outcomes).toFixed(6)),
      samples: predictions.length,
    };
    report.diagram = buildReliabilityDiagram(predictions, outcomes);
  }

  return report;
}
