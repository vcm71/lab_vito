import { describe, it, expect } from 'vitest';
import { groupedTemporalSplit } from '../../src/calibration/GroupedTemporalSplit.js';
import { CalibrationDataset } from '../../src/calibration/CalibrationDataset.js';

describe('GroupedTemporalSplit', () => {
  it('splits dataset by groups with deterministic assignment', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      rawConsensusScore: i / 100,
      observedOutcome: i % 2,
      timestamp: Date.now() + i * 1000,
      groupId: `g${Math.floor(i / 10)}`, // 10 groups of 10
    }));
    const dataset = new CalibrationDataset({ records, datasetVersion: 'v1', id: 'test' });

    const result = groupedTemporalSplit({
      dataset,
      groupField: 'groupId',
      seed: 123,
    });

    expect(result.summary.status).toBe('OK');
    expect(result.groups.train.length).toBeGreaterThan(0);
    expect(result.groups.test.length).toBeGreaterThan(0);
    // No group should appear in both train and test
    const trainSet = new Set(result.groups.train);
    const testSet = new Set(result.groups.test);
    for (const g of trainSet) {
      expect(testSet.has(g)).toBe(false);
    }
  });

  it('produces balanced split ratios', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      rawConsensusScore: i / 100,
      observedOutcome: i % 2,
      timestamp: Date.now() + i * 1000,
      groupId: `g${Math.floor(i / 5)}`, // 20 groups
    }));
    const dataset = new CalibrationDataset({ records, datasetVersion: 'v1' });

    const result = groupedTemporalSplit({
      dataset,
      groupField: 'groupId',
      ratios: { train: 0.70, validation: 0.10, test: 0.20 },
      seed: 99,
    });

    expect(result.summary.status).toBe('OK');
    const totalGroups = result.summary.totalGroups;
    expect(result.groups.train.length).toBe(Math.round(totalGroups * 0.70));
    expect(result.groups.validation.length).toBe(Math.round(totalGroups * 0.10));
    expect(result.groups.test.length).toBe(Math.round(totalGroups * 0.20));
  });

  it('returns INSUFFICIENT_GROUPS when fewer than minGroups', () => {
    const records = Array.from({ length: 4 }, (_, i) => ({
      rawConsensusScore: 0.5,
      observedOutcome: 0,
      groupId: `g${i}`,
    }));
    const dataset = new CalibrationDataset({ records, datasetVersion: 'v1' });

    const result = groupedTemporalSplit({
      dataset,
      groupField: 'groupId',
      minGroups: 5,
    });

    expect(result.summary.status).toBe('INSUFFICIENT_GROUPS');
    expect(result.trainingSet).toBeNull();
  });

  it('rejects ratios not summing to 1.0', () => {
    const records = Array.from({ length: 30 }, (_, i) => ({
      rawConsensusScore: 0.5,
      observedOutcome: 0,
      groupId: `g${i}`,
    }));
    const dataset = new CalibrationDataset({ records, datasetVersion: 'v1' });

    expect(() => groupedTemporalSplit({
      dataset,
      groupField: 'groupId',
      ratios: { train: 0.5, test: 0.3 },
    })).toThrow('ratios must sum to 1.0');
  });
});
