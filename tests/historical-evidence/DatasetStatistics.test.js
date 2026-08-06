/**
 * DatasetStatistics tests (Fase 2.3.3).
 *
 * Pure aggregation: binary outcomes, raw-score range, effective
 * probability (calibrated when present), strategy/target counts,
 * spin/prediction counts, and the empty-dataset contract.
 */

import { describe, it, expect } from 'vitest';
import { createDatasetStatistics } from '../../src/historical-evidence/index.js';

const observation = (overrides = {}) => ({
  schemaVersion: '1',
  observationId: 'obs-1',
  predictionId: 'p-1',
  outcomeId: 'o-1',
  spinId: 'spin-1',
  target: { type: 'NUMBER', value: '17' },
  rawConsensusScore: 0.72,
  calibration: { probability: 0.7, strategyName: 'isotonic', modelId: 'm1' },
  observedOutcome: 1,
  predictionCreatedAt: '2026-01-01T00:00:00.000Z',
  outcomeRecordedAt: '2026-01-01T00:00:05.000Z',
  observationCreatedAt: '2026-01-01T00:00:05.000Z',
  metadata: null,
  ...overrides,
});

describe('createDatasetStatistics', () => {
  it('aggregates outcomes, positive rate and raw-score range/mean', () => {
    const stats = createDatasetStatistics([
      observation({ observedOutcome: 1, rawConsensusScore: 0.5 }),
      observation({ observedOutcome: 0, rawConsensusScore: 0.9 }),
      observation({ observedOutcome: 1, rawConsensusScore: 0.1 }),
    ]);
    expect(stats.observationCount).toBe(3);
    expect(stats.positiveOutcomeCount).toBe(2);
    expect(stats.negativeOutcomeCount).toBe(1);
    expect(stats.positiveRate).toBeCloseTo(2 / 3, 10);
    expect(stats.rawScore).toEqual({ min: 0.1, max: 0.9, mean: 0.5 });
  });

  it('uses calibrated probability for effectiveProbability when present', () => {
    const stats = createDatasetStatistics([
      observation({ observedOutcome: 1, rawConsensusScore: 0.8, calibration: { probability: 0.6, strategyName: 'isotonic' } }),
    ]);
    expect(stats.effectiveProbability.mean).toBeCloseTo(0.6, 10);
    expect(stats.effectiveProbability.min).toBeCloseTo(0.6, 10);
    expect(stats.effectiveProbability.max).toBeCloseTo(0.6, 10);
  });

  it('falls back to rawConsensusScore when calibration is absent', () => {
    const stats = createDatasetStatistics([
      observation({ observedOutcome: 0, rawConsensusScore: 0.44, calibration: null }),
    ]);
    expect(stats.effectiveProbability.mean).toBeCloseTo(0.44, 10);
    expect(stats.calibratedCount).toBe(0);
    expect(stats.uncalibratedCount).toBe(1);
  });

  it('counts calibrated/uncalibrated rows', () => {
    const stats = createDatasetStatistics([
      observation({ observedOutcome: 1, calibration: { probability: 0.6, strategyName: 'isotonic' } }),
      observation({ observedOutcome: 0, calibration: null }),
      observation({ observedOutcome: 1, calibration: { probability: 0.4, strategyName: 'platt' } }),
    ]);
    expect(stats.calibratedCount).toBe(2);
    expect(stats.uncalibratedCount).toBe(1);
  });

  it('counts target types and calibration strategies', () => {
    const stats = createDatasetStatistics([
      observation({ observedOutcome: 1, calibration: { probability: 0.6, strategyName: 'isotonic' } }),
      observation({ observedOutcome: 0, calibration: { probability: 0.4, strategyName: 'platt' } }),
      observation({ observedOutcome: 1, calibration: null }),
    ]);
    expect(stats.targetTypeCounts).toEqual({ NUMBER: 3 });
    expect(stats.calibrationStrategyCounts).toEqual({ isotonic: 1, platt: 1 });
  });

  it('counts unique spins; predictionCount equals observationCount (1 row per prediction)', () => {
    const stats = createDatasetStatistics([
      observation({ spinId: 'spin-1' }),
      observation({ spinId: 'spin-1' }),
      observation({ spinId: 'spin-2' }),
    ]);
    expect(stats.spinCount).toBe(2);
    expect(stats.predictionCount).toBe(3);
  });

  it('returns the empty-dataset contract (no division by zero)', () => {
    const stats = createDatasetStatistics([]);
    expect(stats).toEqual({
      schemaVersion: '1',
      observationCount: 0,
      positiveOutcomeCount: 0,
      negativeOutcomeCount: 0,
      positiveRate: 0,
      rawScore: { min: null, max: null, mean: null },
      effectiveProbability: { min: null, max: null, mean: null },
      calibratedCount: 0,
      uncalibratedCount: 0,
      targetTypeCounts: {},
      calibrationStrategyCounts: {},
      spinCount: 0,
      predictionCount: 0,
    });
    expect(Object.isFrozen(stats)).toBe(true);
    expect(Object.isFrozen(stats.rawScore)).toBe(true);
  });
});
