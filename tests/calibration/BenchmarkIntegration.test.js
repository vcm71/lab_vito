/**
 * Tests: BaselineComparator + ModelLeaderboard + PromotionPolicy.
 */
import { describe, it, expect } from 'vitest';
import { BaselineComparator } from '../../src/calibration/BaselineComparator.js';
import { ModelLeaderboard } from '../../src/calibration/ModelLeaderboard.js';
import { PromotionPolicy } from '../../src/calibration/PromotionPolicy.js';
import { MetricRegistry } from '../../src/calibration/MetricRegistry.js';

function makeResult(strategyName, metrics) {
  return {
    strategyName,
    status: 'completed',
    metrics: { test: { ...metrics } },
    tags: { datasetType: 'wellCalibrated' },
    leakage: { leaked: false, summary: 'No leakage', findings: [] },
    errors: [],
    duration: 100,
  };
}

describe('BaselineComparator', () => {
  let comparator;

  beforeAll(() => {
    comparator = new BaselineComparator({ metricRegistry: new MetricRegistry() });
  });

  it('compares candidate vs baseline', () => {
    const baseline = makeResult('IdentityCalibration', { brierScore: 0.2, ece: 0.1 });
    const candidate = makeResult('PlattScaling', { brierScore: 0.15, ece: 0.08 });
    const result = comparator.compare(baseline, candidate);
    expect(result.compared).toBe(true);
    expect(result.summary.improved).toBe(2);
    expect(result.summary.score).toBe(1);
  });

  it('detects regressions', () => {
    const baseline = makeResult('IdentityCalibration', { brierScore: 0.1, ece: 0.05 });
    const candidate = makeResult('BadStrategy', { brierScore: 0.3, ece: 0.2 });
    const result = comparator.compare(baseline, candidate);
    expect(result.summary.improved).toBe(0);
  });

  it('returns compared=false if missing data', () => {
    const result = comparator.compare(null, null);
    expect(result.compared).toBe(false);
  });
});

describe('ModelLeaderboard', () => {
  let leaderboard;

  beforeAll(() => {
    leaderboard = new ModelLeaderboard({ metricRegistry: new MetricRegistry() });
  });

  it('ranks multiple strategies', () => {
    const results = [
      makeResult('IdentityCalibration', { brierScore: 0.2, ece: 0.1, accuracy: 0.7 }),
      makeResult('PlattScaling', { brierScore: 0.15, ece: 0.08, accuracy: 0.75 }),
    ];
    const ranked = leaderboard.rank(results);
    expect(ranked.length).toBe(2);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    // Platt should be first (better calibration)
    expect(ranked[0].strategyName).toBe('PlattScaling');
  });

  it('handles single entry', () => {
    const results = [makeResult('Only', { brierScore: 0.1 })];
    const ranked = leaderboard.rank(results);
    expect(ranked[0].composite).toBe(1);
  });

  it('returns empty for no completed results', () => {
    const results = [{ status: 'failed', strategyName: 'Bad' }];
    const ranked = leaderboard.rank(results);
    expect(ranked).toHaveLength(0);
  });
});

describe('PromotionPolicy', () => {
  let comparator, leaderboard, policy;

  beforeAll(() => {
    comparator = new BaselineComparator();
    leaderboard = new ModelLeaderboard();
    policy = new PromotionPolicy({ minMetricsImproved: 1, minCompositeScore: 0.4, minDatasetsPassed: 1 });
  });

  it('promotes a strategy that beats baseline', () => {
    const baseline = makeResult('IdentityCalibration', { brierScore: 0.2, ece: 0.1, accuracy: 0.65 });
    const candidate = makeResult('PlattScaling', { brierScore: 0.12, ece: 0.06, accuracy: 0.75 });
    const comparisons = [comparator.compare(baseline, candidate)];
    const leaders = leaderboard.rank([baseline, candidate]);

    const result = policy.evaluate(comparisons, leaders, 'PlattScaling');
    expect(result.promoted).toBe(true);
    expect(result.reason).toContain('PROMOTED');
  });

  it('rejects a strategy that regresses', () => {
    const baseline = makeResult('IdentityCalibration', { brierScore: 0.1, ece: 0.05 });
    const candidate = makeResult('BadStrategy', { brierScore: 0.3, ece: 0.2 });
    const comparisons = [comparator.compare(baseline, candidate)];
    const leaders = leaderboard.rank([baseline, candidate]);

    const result = policy.evaluate(comparisons, leaders, 'BadStrategy');
    expect(result.promoted).toBe(false);
    expect(result.reason).toContain('REJECTED');
  });

  it('rejects when no comparison data', () => {
    const result = policy.evaluate([], [], 'UnknownStrategy');
    expect(result.promoted).toBe(false);
  });
});
