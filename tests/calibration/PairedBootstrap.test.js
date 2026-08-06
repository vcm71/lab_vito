import { describe, it, expect } from 'vitest';
import { pairedBootstrap } from '../../src/calibration/PairedBootstrap.js';

describe('PairedBootstrap', () => {
  it('detects candidate better than baseline (clear signal)', () => {
    const n = 100;
    const outcomes = Array.from({ length: n }, (_, i) => i % 2); // balanced
    // Baseline: systematically wrong predictions (bad)
    const predsA = outcomes.map(o => (o === 1 ? 0.15 : 0.85));
    // Candidate: near-perfect predictions
    const predsB = outcomes.map(o => (o === 1 ? 0.9 : 0.1));

    const result = pairedBootstrap({
      predictionsA: predsA,
      predictionsB: predsB,
      outcomes,
      nReplicates: 500,
      seed: 42,
    });

    expect(result.verdict).toBe('CANDIDATE_BETTER');
    expect(result.winRate.overall).toBeGreaterThan(0.9);
  });

  it('detects baseline better (reverse signal)', () => {
    const n = 100;
    const outcomes = Array.from({ length: n }, (_, i) => i % 2);
    // Baseline: good predictions
    const predsA = outcomes.map(o => (o === 1 ? 0.9 : 0.1));
    // Candidate: systematically wrong predictions
    const predsB = outcomes.map(o => (o === 1 ? 0.1 : 0.9));

    const result = pairedBootstrap({
      predictionsA: predsA,
      predictionsB: predsB,
      outcomes,
      nReplicates: 500,
      seed: 42,
    });

    expect(result.verdict).toBe('BASELINE_BETTER');
    expect(result.winRate.overall).toBeLessThan(0.1);
  });

  it('returns INCONCLUSIVE when tied', () => {
    const n = 100;
    const outcomes = Array.from({ length: n }, (_, i) => i % 2);
    // Identical predictions on both sides — no signal
    const preds = outcomes.map(o => (o === 1 ? 0.55 : 0.45));

    const result = pairedBootstrap({
      predictionsA: preds.slice(),
      predictionsB: preds.slice(),
      outcomes,
      nReplicates: 500,
      seed: 42,
    });

    // With identical predictions, neither side wins → INCONCLUSIVE
    expect(result.verdict).toBe('INCONCLUSIVE');
    expect(result.winRate.overall).toBe(0);
  });

  it('handles small sample size gracefully', () => {
    const result = pairedBootstrap({
      predictionsA: [0.7],
      predictionsB: [0.8],
      outcomes: [1],
    });

    expect(result.verdict).toBe('INCONCLUSIVE');
    expect(result.n).toBe(1);
    expect(result.summary).toBe('INSUFFICIENT_OBSERVATIONS');
  });

  it('produces valid confidence intervals', () => {
    const n = 100;
    const outcomes = Array.from({ length: n }, (_, i) => i % 2);
    const predsA = outcomes.map(o => (o === 1 ? 0.2 : 0.8));
    const predsB = outcomes.map(o => (o === 1 ? 0.85 : 0.15));

    const result = pairedBootstrap({
      predictionsA: predsA,
      predictionsB: predsB,
      outcomes,
      nReplicates: 500,
      seed: 42,
    });

    expect(result.ci.brier.lo).toBeLessThanOrEqual(result.ci.brier.hi);
    expect(result.ci.logLoss.lo).toBeLessThanOrEqual(result.ci.logLoss.hi);
    expect(result.ci.ece.lo).toBeLessThanOrEqual(result.ci.ece.hi);
  });

  it('clustered bootstrap with groupIds', () => {
    const n = 100;
    const groupIds = Array.from({ length: n }, (_, i) => Math.floor(i / 10)); // 10 groups of 10
    const outcomes = Array.from({ length: n }, (_, i) => i % 2);
    const predsA = outcomes.map(o => (o === 1 ? 0.1 : 0.9));
    const predsB = outcomes.map(o => (o === 1 ? 0.85 : 0.15));

    const result = pairedBootstrap({
      predictionsA: predsA,
      predictionsB: predsB,
      outcomes,
      nReplicates: 500,
      seed: 42,
      groupIds,
    });

    expect(result.verdict).toBe('CANDIDATE_BETTER');
  });
});
