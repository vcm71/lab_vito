/**
 * CalibrationBenchmark — runs all registered strategies against multiple
 * synthetic datasets and produces a summary table.
 *
 * Workflow:
 *  1. For each dataset type, train/test each strategy
 *  2. Collect results into a benchmark report
 *  3. Rank strategies per metric
 *
 * Immutable output: CalibrationBenchmarkReport
 */

import { CalibrationExperiment } from './CalibrationExperiment.js';
import { SyntheticCalibrationDatasetFactory } from './SyntheticCalibrationDatasetFactory.js';
import { MetricRegistry } from './MetricRegistry.js';
import { CalibrationStrategyRegistry } from './CalibrationStrategyRegistry.js';
import { CalibrationLeakageDetector } from './CalibrationLeakageDetector.js';

export class CalibrationBenchmark {
  /**
   * @param {Object} options
   * @param {CalibrationStrategyRegistry} [options.registry]
   * @param {SyntheticCalibrationDatasetFactory} [options.datasetFactory]
   * @param {MetricRegistry} [options.metricRegistry]
   * @param {number} [options.seed=42]
   * @param {number} [options.trainSize=800]
   * @param {number} [options.testSize=200]
   */
  constructor(options = {}) {
    this.registry = options.registry ?? new CalibrationStrategyRegistry();
    this.datasetFactory = options.datasetFactory ?? new SyntheticCalibrationDatasetFactory({ seed: options.seed ?? 42 });
    this.metricRegistry = options.metricRegistry ?? new MetricRegistry();
    this.seed = options.seed ?? 42;
    this.trainSize = options.trainSize ?? 800;
    this.testSize = options.testSize ?? 200;
    this.leakage = new CalibrationLeakageDetector();
  }

  /**
   * Run the benchmark.
   * @returns {Promise<Object>} CalibrationBenchmarkReport
   */
  async run() {
    const startTime = Date.now();
    const { train, test } = this.datasetFactory.generateTrainTest(this.trainSize, this.testSize);
    const datasetTypes = Object.keys(train);
    const strategyNames = this.registry.list();
    const experiment = new CalibrationExperiment({
      seed: this.seed,
      leakageDetector: this.leakage,
      metricRegistry: this.metricRegistry,
    });

    const results = [];

    for (const strategyName of strategyNames) {
      const strategy = this.registry.get(strategyName);

      for (const dsType of datasetTypes) {
        const trainingSet = train[dsType];
        const testSet = test[dsType];

        try {
          const result = await experiment.run({
            strategy,
            trainingSet,
            testSet,
            tags: { datasetType: dsType, experiment: 'benchmark' },
          });
          results.push(result);
        } catch (e) {
          results.push({
            experimentId: `exp_${strategyName}_${dsType}_fail`,
            strategyName,
            status: 'error',
            datasetType: dsType,
            duration: 0,
            errors: [{ phase: 'benchmark', message: e.message }],
          });
        }
      }
    }

    const duration = Date.now() - startTime;

    return Object.freeze({
      benchmarkId: `benchmark_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      duration,
      seed: this.seed,
      config: {
        strategies: strategyNames,
        datasetTypes,
        trainSize: this.trainSize,
        testSize: this.testSize,
        metrics: this.metricRegistry.listIds(),
      },
      results,
      createdAt: new Date().toISOString(),
    });
  }
}
