/**
 * CalibrationExperiment — encapsulates a single reproducible experiment run:
 *   1. Train on training set
 *   2. Validate on validation set (if provided)
 *   3. Test on test set
 *   4. Compute metrics
 *   5. Check leakage
 *
 * Produces a CalibrationBenchmarkResult.
 * Every run is REPRODUCIBLE given the same strategy, datasets, and seed.
 */

import { CalibrationTrainer } from './CalibrationTrainer.js';
import { CalibrationModelFactory } from './CalibrationModelFactory.js';
import { CalibrationLeakageDetector } from './CalibrationLeakageDetector.js';
import { MetricRegistry } from './MetricRegistry.js';
import { createSeededRandom } from './SeededRandom.js';

export class CalibrationExperiment {
  /**
   * @param {Object} options
   * @param {Object} [options.leakageDetector] — CalibrationLeakageDetector instance
   * @param {Object} [options.metricRegistry] — MetricRegistry instance
   * @param {number} [options.seed=42]
   * @param {'mulberry32'|'xoshiro128**'} [options.algorithm='xoshiro128**']
   */
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.leakage = options.leakageDetector ?? new CalibrationLeakageDetector();
    this.metrics = options.metricRegistry ?? new MetricRegistry();
    this.rng = createSeededRandom(options.algorithm ?? 'xoshiro128**', this.seed);
  }

  /**
   * Run a single experiment.
   *
   * @param {Object} params
   * @param {import('./strategies/CalibrationStrategy.js').CalibrationStrategy} params.strategy
   * @param {import('./CalibrationDataset.js').CalibrationDataset} params.trainingSet
   * @param {import('./CalibrationDataset.js').CalibrationDataset} [params.validationSet]
   * @param {import('./CalibrationDataset.js').CalibrationDataset} params.testSet
   * @param {Object} [params.tags]
   * @returns {Promise<Object>} CalibrationBenchmarkResult
   */
  async run(params) {
    const { strategy, trainingSet, validationSet, testSet, tags = {} } = params;
    const startTime = Date.now();
    const errors = [];
    let model = null;
    let trainMetrics = null;
    let valMetrics = null;
    let testMetrics = null;
    let leakageReport = null;

    try {
      // 1. Leakage check
      leakageReport = this.leakage.check(trainingSet, validationSet, testSet);

      if (leakageReport.leaked) {
        errors.push({ phase: 'leakage', message: leakageReport.summary });
      }

      // 2. Train
      const trainer = new CalibrationTrainer({ seed: this.seed });

      try {
        model = trainer.fit(strategy, trainingSet);
      } catch (e) {
        errors.push({ phase: 'train', message: e.message });
        return this._buildResult(strategy.name, startTime, null, null, null, null, leakageReport, errors, tags);
      }

      if (!model) {
        errors.push({ phase: 'serialize', message: 'trainer.fit() returned null.' });
      }

      // 3. Compute training metrics (strategy is now fitted)
      trainMetrics = this._computeMetrics(trainingSet, strategy);

      // 4. Compute validation metrics
      if (validationSet) {
        valMetrics = this._computeMetrics(validationSet, strategy);
      }

      // 5. Compute test metrics
      testMetrics = this._computeMetrics(testSet, strategy);

    } catch (e) {
      errors.push({ phase: 'experiment', message: e.message });
    }

    return this._buildResult(strategy.name, startTime, model, trainMetrics, valMetrics, testMetrics, leakageReport, errors, tags);
  }

  _computeMetrics(dataset, strategy) {
    const predictions = dataset.records.map(r =>
      strategy.calibrate(r.rawConsensusScore, {}).calibratedProbability
    );
    const outcomes = dataset.records.map(r => r.observedOutcome ? 1 : 0);
    return this.metrics.computeAll(predictions, outcomes);
  }

  _buildResult(strategyName, startTime, model, train, val, test, leakage, errors, tags) {
    const duration = Date.now() - startTime;
    const status = errors.length === 0 ? 'completed' : (leakage && leakage.leaked ? 'failed_leakage' : 'completed_with_errors');

    return Object.freeze({
      experimentId: `exp_${strategyName}_${startTime}`,
      strategyName,
      status,
      duration,
      model,
      metrics: {
        training: train,
        validation: val,
        test,
      },
      leakage: leakage ? {
        leaked: leakage.leaked,
        summary: leakage.summary,
        findings: [...leakage.findings],
      } : null,
      errors: [...errors],
      tags: { ...tags },
      seed: this.seed,
      createdAt: new Date().toISOString(),
    });
  }
}
