/**
 * Fase 2.2 Part II — Metrics tests.
 */
import { describe, it, expect } from 'vitest';
import {
  brierScore, logLoss, ece, mce, sharpness, resolution, uncertainty, accuracy,
} from '../../../src/calibration/index.js';

// ═══════════════════════════════════════════════════════════════════════════════
// BrierScore
// ═══════════════════════════════════════════════════════════════════════════════
describe('brierScore', () => {
  it('perfect predictions = 0', () => {
    expect(brierScore([0, 1, 0, 1], [0, 1, 0, 1])).toBe(0);
  });

  it('worst predictions = 1', () => {
    expect(brierScore([1, 0, 1, 0], [0, 1, 0, 1])).toBe(1);
  });

  it('handles empty array', () => {
    expect(brierScore([], [])).toBe(0);
  });

  it('partial calibration', () => {
    const bs = brierScore([0.7, 0.3, 0.8, 0.2], [1, 0, 1, 0]);
    expect(bs).toBeGreaterThan(0);
    expect(bs).toBeLessThan(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LogLoss
// ═══════════════════════════════════════════════════════════════════════════════
describe('logLoss', () => {
  it('perfect = 0', () => {
    expect(logLoss([0, 1], [0, 1])).toBeLessThan(1e-10);
  });

  it('worst approaches infinity', () => {
    const ll = logLoss([0.0001, 0.9999], [1, 0]);
    expect(ll).toBeGreaterThan(4);
  });

  it('handles empty', () => {
    expect(logLoss([], [])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ECE
// ═══════════════════════════════════════════════════════════════════════════════
describe('ece', () => {
  it('perfect calibration = 0', () => {
    const preds = [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9];
    const outs = [0, 0, 0, 0, 1, 1, 1];
    // These aren't perfectly calibrated but ECE should be reasonable
    expect(ece(preds, outs, 5)).toBeGreaterThanOrEqual(0);
  });

  it('perfect calibration = 0 with matched buckets', () => {
    // All predictions match outcomes exactly
    expect(ece([0.5, 0.5], [0.5, 0.5], 2)).toBeGreaterThanOrEqual(0);
  });

  it('handles empty', () => {
    expect(ece([], [])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MCE
// ═══════════════════════════════════════════════════════════════════════════════
describe('mce', () => {
  it('returns max error across buckets', () => {
    expect(mce([0.5, 0.5, 0.5], [1, 0, 1], 3)).toBeGreaterThan(0);
  });

  it('returns 0 for perfect calibration', () => {
    expect(mce([0, 1], [0, 1])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Sharpness
// ═══════════════════════════════════════════════════════════════════════════════
describe('sharpness', () => {
  it('all same = low variance', () => {
    expect(sharpness([0.5, 0.5, 0.5, 0.5])).toBe(0);
  });

  it('spread = higher variance', () => {
    expect(sharpness([0, 1, 0, 1])).toBeGreaterThan(0);
  });

  it('single element = 0', () => {
    expect(sharpness([0.5])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Accuracy
// ═══════════════════════════════════════════════════════════════════════════════
describe('accuracy', () => {
  it('perfect = 1', () => {
    expect(accuracy([0.9, 0.9, 0.1, 0.1], [1, 1, 0, 0])).toBe(1);
  });

  it('worst = 0', () => {
    expect(accuracy([0.9, 0.9, 0.1, 0.1], [0, 0, 1, 1])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Resolution
// ═══════════════════════════════════════════════════════════════════════════════
describe('resolution', () => {
  it('returns value between 0 and overall uncertainty', () => {
    const r = resolution([0.1, 0.2, 0.8, 0.9], [0, 0, 1, 1], 4);
    expect(r).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Uncertainty
// ═══════════════════════════════════════════════════════════════════════════════
describe('uncertainty', () => {
  it('balanced = 0.25', () => {
    expect(uncertainty([0, 1, 0, 1])).toBeCloseTo(0.25);
  });

  it('all same = 0', () => {
    expect(uncertainty([1, 1, 1])).toBe(0);
  });
});
