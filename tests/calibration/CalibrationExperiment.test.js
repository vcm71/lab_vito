/**
 * Tests: CalibrationExperiment + CalibrationBenchmark.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { CalibrationExperiment } from '../../src/calibration/CalibrationExperiment.js';
import { CalibrationBenchmark } from '../../src/calibration/CalibrationBenchmark.js';
import { SyntheticCalibrationDatasetFactory } from '../../src/calibration/SyntheticCalibrationDatasetFactory.js';
import { CalibrationStrategyRegistry } from '../../src/calibration/CalibrationStrategyRegistry.js';
import { IdentityCalibration } from '../../src/calibration/strategies/IdentityCalibration.js';
import { PlattScaling } from '../../src/calibration/strategies/PlattScaling.js';
import { MetricRegistry as _MetricRegistry } from '../../src/calibration/MetricRegistry.js';

let datasetFactory, registry;

beforeAll(() => {
  datasetFactory = new SyntheticCalibrationDatasetFactory({ seed: 42 });
  registry = new CalibrationStrategyRegistry();
  registry.register(new PlattScaling());
});

describe('CalibrationExperiment', () => {
  it('runs identity strategy on synthetic dataset', async () => {
    const exp = new CalibrationExperiment({ seed: 42 });
    const trainDs = datasetFactory.generate('wellCalibrated', 200, 42);
    const testDs = datasetFactory.generate('wellCalibrated', 200, 99999); // different seed

    const result = await exp.run({
      strategy: new IdentityCalibration(),
      trainingSet: trainDs,
      testSet: testDs,
    });

    expect(result.status).toBe('completed');
    expect(result.strategyName).toBe('IdentityCalibration');
    expect(result.metrics.test).toBeDefined();
    expect(result.metrics.test.brierScore).toBeGreaterThanOrEqual(0);
    expect(result.errors).toHaveLength(0);
  });

  it('runs platt strategy and produces metrics', async () => {
    const exp = new CalibrationExperiment({ seed: 42 });
    const trainDs = datasetFactory.generate('wellCalibrated', 300, 42);
    const testDs = datasetFactory.generate('wellCalibrated', 100, 99999);

    const result = await exp.run({
      strategy: new PlattScaling(),
      trainingSet: trainDs,
      testSet: testDs,
    });

    expect(result.status).toBe('completed');
    expect(result.metrics.test).toBeDefined();
    expect(result.metrics.test.brierScore).toBeGreaterThanOrEqual(0);
    expect(result.metrics.test.ece).toBeGreaterThanOrEqual(0);
  });

  it('detects leakage on overlapping sets', async () => {
    const exp = new CalibrationExperiment({ seed: 42 });
    const ds = datasetFactory.generate('wellCalibrated', 100, 42);

    const result = await exp.run({
      strategy: new IdentityCalibration(),
      trainingSet: ds,
      testSet: ds, // identical — intentional leakage test
    });

    expect(result.leakage).toBeDefined();
    expect(result.leakage.leaked).toBe(true);
  });

  it('produces reproducible results', async () => {
    const trainDs = datasetFactory.generate('wellCalibrated', 200, 42);
    const testDs = datasetFactory.generate('wellCalibrated', 100, 99999);

    const expA = new CalibrationExperiment({ seed: 42 });
    const resultA = await expA.run({ strategy: new IdentityCalibration(), trainingSet: trainDs, testSet: testDs });

    const expB = new CalibrationExperiment({ seed: 42 });
    const resultB = await expB.run({ strategy: new IdentityCalibration(), trainingSet: trainDs, testSet: testDs });

    expect(resultA.metrics.test.brierScore).toBe(resultB.metrics.test.brierScore);
    expect(resultA.metrics.test.ece).toBe(resultB.metrics.test.ece);
  });
});

describe('CalibrationBenchmark', () => {
  it('runs benchmark with identity and platt', async () => {
    const benchmark = new CalibrationBenchmark({
      seed: 42,
      registry,
      datasetFactory,
      trainSize: 200,
      testSize: 50,
    });

    const report = await benchmark.run();
    expect(report.results).toBeDefined();
    expect(report.config.strategies).toContain('IdentityCalibration');
    expect(report.config.strategies).toContain('PlattScaling');
    expect(report.config.datasetTypes.length).toBe(5);
  });
});
