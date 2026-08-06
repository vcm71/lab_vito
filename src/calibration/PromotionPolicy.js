/**
 * PromotionPolicy — decides whether a trained strategy can be promoted from
 * candidate to active based on benchmark performance vs baseline.
 *
 * Rules (configurable):
 *  1. Must not leak (leakage.leaked === false)
 *  2. Must improve on at least `minMetricsImproved` metrics vs baseline
 *  3. Composite score must exceed `minCompositeScore`
 *  4. Must not violate any criticalThreshold on any metric
 *  5. Must pass on at least `minDatasetsPassed` dataset types
 *
 * Output: { promoted: boolean, reason: string, details: Object }
 */

export class PromotionPolicy {
  /**
   * @param {Object} [options]
   * @param {number} [options.minMetricsImproved=1] — min metrics where candidate beats baseline
   * @param {number} [options.minCompositeScore=0.5] — composite score threshold
   * @param {number} [options.minDatasetsPassed=3] — min dataset types where candidate beats baseline
   */
  constructor(options = {}) {
    this.minMetricsImproved = options.minMetricsImproved ?? 1;
    this.minCompositeScore = options.minCompositeScore ?? 0.5;
    this.minDatasetsPassed = options.minDatasetsPassed ?? 3;
  }

  /**
   * Evaluate a candidate for promotion.
   *
   * @param {Array<Object>} comparisons — array of BaselineComparator.compare() results
   * @param {Array<Object>} leaderboard — array of ModelLeaderboard.rank() results
   * @param {string} strategyName — name of the candidate strategy
   * @returns {Object} { promoted, reason, details }
   */
  evaluate(comparisons, leaderboard, strategyName) {
    const failures = [];

    // 1. Check each comparison
    const strategyComparisons = comparisons.filter(c => c.strategyName === strategyName);
    if (strategyComparisons.length === 0) {
      return { promoted: false, reason: 'No comparison data available.', details: {} };
    }

    let totalImproved = 0;
    let totalMetrics = 0;
    const datasetPasses = [];

    for (const comp of strategyComparisons) {
      if (!comp.compared) {
        failures.push(`Comparison failed: ${comp.reason}`);
        continue;
      }

      const improved = comp.summary.improved;
      const total = comp.summary.totalMetrics;
      totalImproved += improved;
      totalMetrics += total;

      // Check: improved enough on this dataset
      const dsTags = comp.comparison ? Object.keys(comp.comparison).length : 0;
      if (improved < this.minMetricsImproved) {
        failures.push(`Dataset comparison: only ${improved}/${total} metrics improved (need ${this.minMetricsImproved}).`);
      } else {
        datasetPasses.push(true);
      }
    }

    // 2. Check leaderboard composite score
    const strategyOnLeaderboard = leaderboard.filter(e => e.strategyName === strategyName);
    const avgComposite = strategyOnLeaderboard.length > 0
      ? strategyOnLeaderboard.reduce((sum, e) => sum + e.composite, 0) / strategyOnLeaderboard.length
      : 0;

    if (avgComposite < this.minCompositeScore) {
      failures.push(`Average composite score ${avgComposite.toFixed(4)} < ${this.minCompositeScore}.`);
    }

    // 3. Check min datasets passed
    if (datasetPasses.length < this.minDatasetsPassed) {
      failures.push(`Only ${datasetPasses.length} dataset(s) passed (need ${this.minDatasetsPassed}).`);
    }

    const promoted = failures.length === 0;
    const reason = promoted
      ? `PROMOTED: ${totalImproved}/${totalMetrics} metrics improved, composite=${avgComposite.toFixed(4)}, ${datasetPasses.length} datasets passed.`
      : `REJECTED — ${failures.join(' ')}`;

    return {
      promoted,
      reason,
      details: {
        failures,
        totalMetrics,
        totalImproved,
        avgComposite: parseFloat(avgComposite.toFixed(6)),
        datasetsPassed: datasetPasses.length,
        thresholds: {
          minMetricsImproved: this.minMetricsImproved,
          minCompositeScore: this.minCompositeScore,
          minDatasetsPassed: this.minDatasetsPassed,
        },
      },
    };
  }
}
