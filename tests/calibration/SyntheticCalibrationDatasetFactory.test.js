/**
 * Tests: SyntheticCalibrationDatasetFactory.
 */
import { describe, it, expect } from 'vitest';
import { SyntheticCalibrationDatasetFactory } from '../../src/calibration/SyntheticCalibrationDatasetFactory.js';

describe('SyntheticCalibrationDatasetFactory', () => {
  let factory;

  beforeAll(() => {
    factory = new SyntheticCalibrationDatasetFactory({ seed: 42 });
  });

  it('generates wellCalibrated dataset', () => {
    const ds = factory.generate('wellCalibrated', 100);
    expect(ds.recordCount).toBe(100);
    expect(ds.metadata.synthetic).toBe(true);
    expect(ds.metadata.type).toBe('wellCalibrated');
    for (const r of ds.records) {
      expect(r.rawConsensusScore).toBeGreaterThanOrEqual(0);
      expect(r.rawConsensusScore).toBeLessThanOrEqual(1);
      expect([0, 1]).toContain(r.observedOutcome ? 1 : 0);
    }
  });

  it('generates overconfident dataset', () => {
    const ds = factory.generate('overconfident', 200);
    expect(ds.recordCount).toBe(200);
    const scores = ds.records.map(r => r.rawConsensusScore);
    const extreme = scores.filter(s => s <= 0.1 || s >= 0.9);
    // overconfident should have extremes
    expect(extreme.length).toBeGreaterThan(50);
  });

  it('generates underconfident dataset', () => {
    const ds = factory.generate('underconfident', 200);
    const scores = ds.records.map(r => r.rawConsensusScore);
    // Most scores should be in [0.3, 0.7]
    const inRange = scores.filter(s => s >= 0.3 && s <= 0.7);
    expect(inRange.length).toBeGreaterThan(150);
  });

  it('generates skewed dataset', () => {
    const ds = factory.generate('skewed', 200);
    expect(ds.recordCount).toBe(200);
    const scores = ds.records.map(r => r.rawConsensusScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Beta(2,5) has mean ~ 0.286
    expect(mean).toBeLessThan(0.5);
  });

  it('generatesAll returns 5 datasets', () => {
    const datasets = factory.generateAll(100);
    expect(Object.keys(datasets).length).toBe(5);
    expect(datasets.wellCalibrated).toBeDefined();
    expect(datasets.overconfident).toBeDefined();
    expect(datasets.underconfident).toBeDefined();
    expect(datasets.skewed).toBeDefined();
    expect(datasets.uniform).toBeDefined();
  });

  it('generateTrainTest returns separated sets', () => {
    const { train, test } = factory.generateTrainTest(500, 100);
    expect(Object.keys(train).length).toBe(5);
    expect(Object.keys(test).length).toBe(5);
    expect(train.wellCalibrated.recordCount).toBe(500);
    expect(test.wellCalibrated.recordCount).toBe(100);
    // Different seeds => different records
    expect(train.wellCalibrated.records[0].rawConsensusScore).not.toBe(test.wellCalibrated.records[0].rawConsensusScore);
  });

  it('is reproducible with same seed', () => {
    const a = new SyntheticCalibrationDatasetFactory({ seed: 42 });
    const b = new SyntheticCalibrationDatasetFactory({ seed: 42 });
    const dsA = a.generate('wellCalibrated', 50, 99);
    const dsB = b.generate('wellCalibrated', 50, 99);
    for (let i = 0; i < 50; i++) {
      expect(dsA.records[i].rawConsensusScore).toBe(dsB.records[i].rawConsensusScore);
    }
  });
});
