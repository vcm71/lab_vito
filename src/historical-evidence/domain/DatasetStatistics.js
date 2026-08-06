/**
 * DatasetStatistics — immutable descriptive statistics of a historical
 * calibration dataset.
 *
 * Pure aggregation over observations: no randomness, no global clock, no
 * training, no advanced metrics (calibration curves, correlation indexes,
 * etc. are out of scope for this phase). Values are exact — no rounding.
 *
 * Empty dataset (allowEmpty): all min/max/mean values are null and
 * rates are 0.
 */

import { deepFreeze } from './immutable.js';
import { getEffectiveProbability } from './CalibrationObservation.js';

/** @type {string} — stable contract version of the statistics shape */
export const DATASET_STATISTICS_SCHEMA_VERSION = '1';

/**
 * Sum a list of finite numbers without rounding.
 * @param {number[]} values
 * @returns {number}
 */
function sum(values) {
  return values.reduce((acc, v) => acc + v, 0);
}

/**
 * Min/max/mean of a numeric list. Empty list → all null.
 * @param {number[]} values
 * @returns {{ min: number|null, max: number|null, mean: number|null }}
 */
function minMaxMean(values) {
  if (values.length === 0) return { min: null, max: null, mean: null };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: sum(values) / values.length,
  };
}

/**
 * Compute deep-frozen DatasetStatistics for a list of observations.
 *
 * @param {Array<object>} observations — CalibrationObservation list
 * @returns {DatasetStatistics}
 */
export function createDatasetStatistics(observations) {
  const count = observations.length;

  let positive = 0;
  let calibrated = 0;
  let uncalibrated = 0;
  const rawScores = [];
  const effectiveProbabilities = [];
  const spinIds = new Set();
  const targetTypeCounts = new Map();
  const strategyCounts = new Map();

  for (const obs of observations) {
    if (obs.observedOutcome === 1) positive += 1;
    if (obs.calibration) {
      calibrated += 1;
      const strategy = obs.calibration.strategyName;
      strategyCounts.set(strategy, (strategyCounts.get(strategy) || 0) + 1);
    } else {
      uncalibrated += 1;
    }
    rawScores.push(obs.rawConsensusScore);
    effectiveProbabilities.push(getEffectiveProbability(obs));
    spinIds.add(obs.spinId);
    const type = obs.target && obs.target.type ? obs.target.type : '<unknown>';
    targetTypeCounts.set(type, (targetTypeCounts.get(type) || 0) + 1);
  }

  const targetTypeCountsObject = {};
  for (const [type, n] of [...targetTypeCounts.entries()].sort()) {
    targetTypeCountsObject[type] = n;
  }
  const calibrationStrategyCounts = {};
  for (const [strategy, n] of [...strategyCounts.entries()].sort()) {
    calibrationStrategyCounts[strategy] = n;
  }

  return deepFreeze({
    schemaVersion: DATASET_STATISTICS_SCHEMA_VERSION,
    observationCount: count,
    spinCount: spinIds.size,
    predictionCount: count, // invariant: one observation per prediction
    positiveOutcomeCount: positive,
    negativeOutcomeCount: count - positive,
    positiveRate: count > 0 ? positive / count : 0,
    calibratedCount: calibrated,
    uncalibratedCount: uncalibrated,
    rawScore: minMaxMean(rawScores),
    effectiveProbability: minMaxMean(effectiveProbabilities),
    targetTypeCounts: deepFreeze(targetTypeCountsObject),
    calibrationStrategyCounts: deepFreeze(calibrationStrategyCounts),
  });
}
