/**
 * BaselineComparator — compares every trained strategy against the
 * IdentityCalibration baseline on the SAME test dataset.
 *
 * For each metric, computes:
 *  - delta: strategy_metric - baseline_metric
 *  - improvement: true if delta is in the right direction (lower for minimizers,
 *    higher for maximizers)
 *  - relativeImprovement: (baseline - strategy) / baseline for minimizers,
 *    (strategy - baseline) / baseline for maximizers
 */

import { MetricRegistry } from './MetricRegistry.js';

export class BaselineComparator {
  /**
   * @param {Object} [options]
   * @param {MetricRegistry} [options.metricRegistry]
   */
  constructor(options = {}) {
    this.metrics = options.metricRegistry ?? new MetricRegistry();
  }

  /**
   * @param {Object} baselineResult — experiment result for IdentityCalibration
   * @param {Object} candidateResult — experiment result for the strategy
   * @returns {Object}
   */
  compare(baselineResult, candidateResult) {
    if (!baselineResult || !candidateResult) {
      return { compared: false, reason: 'Missing baseline or candidate result.' };
    }

    const baselineMetrics = baselineResult.metrics?.test;
    const candidateMetrics = candidateResult.metrics?.test;

    if (!baselineMetrics || !candidateMetrics) {
      return { compared: false, reason: 'Missing test metrics.' };
    }

    const comparison = {};
    let totalImprovement = 0;
    let metricCount = 0;

    for (const [metricId, candidateValue] of Object.entries(candidateMetrics)) {
      const baselineValue = baselineMetrics[metricId];
      if (baselineValue === undefined) continue;

      const descriptor = this.metrics.get(metricId);
      if (!descriptor) continue;

      const delta = candidateValue - baselineValue;
      const improvement = descriptor.minimizer ? (delta < 0) : (delta > 0);

      let relativeImprovement = 0;
      if (Math.abs(baselineValue) > 1e-10) {
        relativeImprovement = descriptor.minimizer
          ? (baselineValue - candidateValue) / baselineValue
          : (candidateValue - baselineValue) / baselineValue;
      }

      comparison[metricId] = {
        baseline: baselineValue,
        candidate: candidateValue,
        delta: parseFloat(delta.toFixed(8)),
        improvement,
        relativeImprovement: parseFloat(relativeImprovement.toFixed(6)),
      };

      totalImprovement += improvement ? 1 : (delta === 0 ? 0.5 : 0);
      metricCount++;
    }

    const score = metricCount > 0 ? totalImprovement / metricCount : 0;

    return {
      compared: true,
      strategyName: candidateResult.strategyName,
      baselineName: baselineResult.strategyName,
      comparison,
      summary: {
        totalMetrics: metricCount,
        improved: Object.values(comparison).filter(c => c.improvement).length,
        unchanged: Object.values(comparison).filter(c => c.delta === 0).length,
        score: parseFloat(score.toFixed(4)),
      },
    };
  }
}
