/**
 * ModelLeaderboard — ranks trained strategies across all datasets and metrics.
 *
 * For each (strategy, datasetType) pair, computes a composite score:
 *   composite = Σ w_i * normalized_score_i
 *
 * Where normalized_score for minimizers = 1 - (metric - min) / (max - min)
 *   and for maximizers = (metric - min) / (max - min)
 *
 * Higher composite = better overall performance.
 */

import { MetricRegistry } from './MetricRegistry.js';

export class ModelLeaderboard {
  /**
   * @param {Object} [options]
   * @param {MetricRegistry} [options.metricRegistry]
   * @param {Object<string, number>} [options.weights] — metric weights for composite score
   */
  constructor(options = {}) {
    this.metrics = options.metricRegistry ?? new MetricRegistry();
    this.weights = options.weights ?? {};
  }

  /**
   * Rank benchmark results.
   * @param {Array<Object>} benchmarkResults — array of CalibrationBenchmarkResult
   * @returns {Array<Object>} ranked entries
   */
  rank(benchmarkResults) {
    if (!benchmarkResults || benchmarkResults.length === 0) return [];

    // Collect all metrics per (strategy, datasetType)
    const entries = [];
    const metricValues = {}; // { metricId: [values across all entries] }

    for (const r of benchmarkResults) {
      if (r.status !== 'completed' || !r.metrics?.test) continue;

      const entry = {
        strategyName: r.strategyName,
        datasetType: r.tags?.datasetType ?? 'unknown',
        metrics: { ...r.metrics.test },
        duration: r.duration,
      };
      entries.push(entry);

      for (const [metricId, value] of Object.entries(r.metrics.test)) {
        if (!metricValues[metricId]) metricValues[metricId] = [];
        metricValues[metricId].push(value);
      }
    }

    if (entries.length === 0) return [];

    // Normalize each metric to [0, 1] where 1 = best
    const normalized = entries.map(entry => {
      const normMetrics = {};
      let composite = 0;
      let weightSum = 0;

      for (const [metricId, value] of Object.entries(entry.metrics)) {
        const descriptor = this.metrics.get(metricId);
        if (!descriptor) continue;

        const values = metricValues[metricId];
        if (!values || values.length < 2) {
          normMetrics[metricId] = 1; // only one value = best by default
        } else {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min;

          if (range < 1e-10) {
            normMetrics[metricId] = 1;
          } else if (descriptor.minimizer) {
            normMetrics[metricId] = 1 - (value - min) / range;
          } else {
            normMetrics[metricId] = (value - min) / range;
          }
        }

        const weight = this.weights[metricId] ?? 1;
        composite += weight * normMetrics[metricId];
        weightSum += weight;
      }

      return {
        ...entry,
        normalizedMetrics: normMetrics,
        composite: weightSum > 0 ? parseFloat((composite / weightSum).toFixed(6)) : 0,
      };
    });

    // Sort by composite descending
    normalized.sort((a, b) => b.composite - a.composite);

    return normalized.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));
  }
}
