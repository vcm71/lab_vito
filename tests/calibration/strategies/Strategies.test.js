/**
 * Fase 2.2 Part II — Strategy tests (Histogram, Isotonic, Platt, Beta + Registry).
 */
import { describe, it, expect } from 'vitest';
import {
  CalibrationDataset,
  CalibrationStrategyRegistry,
} from '../../../src/calibration/index.js';
import { IdentityCalibration } from '../../../src/calibration/strategies/IdentityCalibration.js';
import { HistogramCalibration } from '../../../src/calibration/strategies/HistogramCalibration.js';
import { IsotonicCalibration } from '../../../src/calibration/strategies/IsotonicCalibration.js';
import { PlattScaling } from '../../../src/calibration/strategies/PlattScaling.js';
import { BetaCalibration } from '../../../src/calibration/strategies/BetaCalibration.js';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildRecords(n, seed = 42) {
  const rng = mulberry32(seed);
  const records = [];
  for (let i = 0; i < n; i++) {
    const score = rng();
    const outcome = rng() < score ? 1 : 0;
    records.push({ rawConsensusScore: parseFloat(score.toFixed(4)), observedOutcome: outcome, timestamp: new Date().toISOString() });
  }
  return records;
}

function buildDs(id, n, seed) {
  return new CalibrationDataset({ id, datasetVersion: '1.0.0', records: buildRecords(n, seed) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// IdentityCalibration
// ═══════════════════════════════════════════════════════════════════════════════
describe('IdentityCalibration', () => {
  it('passes through score', () => {
    const s = new IdentityCalibration();
    expect(s.calibrate(0.5).calibratedProbability).toBe(0.5);
  });

  it('fits and returns empty params', () => {
    const s = new IdentityCalibration();
    const ds = buildDs('ds1', 10, 42);
    expect(s.fit(ds)).toEqual({});
  });

  it('serializes and deserializes', () => {
    const s = new IdentityCalibration();
    const data = s.serialize();
    expect(data.name).toBe('IdentityCalibration');
    const restored = IdentityCalibration.deserialize(data);
    expect(restored).toBeInstanceOf(IdentityCalibration);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HistogramCalibration
// ═══════════════════════════════════════════════════════════════════════════════
describe('HistogramCalibration', () => {
  it('fits and produces buckets', () => {
    const s = new HistogramCalibration({ nBuckets: 5 });
    const ds = buildDs('ds1', 100, 42);
    s.fit(ds);
    expect(s.buckets.length).toBe(5);
    // Each bucket has the right shape
    for (const b of s.buckets) {
      expect(b).toHaveProperty('lo');
      expect(b).toHaveProperty('hi');
      expect(b).toHaveProperty('count');
      expect(b).toHaveProperty('observedFreq');
    }
  });

  it('calibrate returns probability in [0,1]', () => {
    const s = new HistogramCalibration({ nBuckets: 5 });
    s.fit(buildDs('ds1', 50, 42));
    for (let i = 0; i < 20; i++) {
      const score = i / 20;
      const result = s.calibrate(score);
      if (result.calibratedProbability !== null) {
        expect(result.calibratedProbability).toBeGreaterThanOrEqual(0);
        expect(result.calibratedProbability).toBeLessThanOrEqual(1);
      }
    }
  });

  it('untrained strategy passes through', () => {
    const s = new HistogramCalibration();
    const result = s.calibrate(0.5);
    expect(result.calibratedProbability).toBe(0.5);
  });

  it('serialize/deserialize round-trip', () => {
    const s = new HistogramCalibration({ nBuckets: 5 });
    s.fit(buildDs('ds1', 50, 77));
    const data = s.serialize();
    const restored = HistogramCalibration.deserialize(data);
    expect(restored.buckets).toEqual(s.buckets);
    expect(restored.calibrate(0.3).calibratedProbability).toBe(s.calibrate(0.3).calibratedProbability);
  });

  it('validateModel rejects missing table', () => {
    const s = new HistogramCalibration();
    const result = s.validateModel({ parameters: {}, strategy: 'HistogramCalibration' });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IsotonicCalibration
// ═══════════════════════════════════════════════════════════════════════════════
describe('IsotonicCalibration', () => {
  it('fits and produces monotonic points', () => {
    const s = new IsotonicCalibration();
    s.fit(buildDs('ds1', 100, 42));
    expect(s.points.length).toBeGreaterThan(0);
    // Verify monotonicity
    for (let i = 1; i < s.points.length; i++) {
      expect(s.points[i].prob).toBeGreaterThanOrEqual(s.points[i - 1].prob - 1e-10);
      expect(s.points[i].score).toBeGreaterThanOrEqual(s.points[i - 1].score - 1e-10);
    }
  });

  it('calibrate returns probability in [0,1]', () => {
    const s = new IsotonicCalibration();
    s.fit(buildDs('ds1', 100, 42));
    for (let i = 0; i < 20; i++) {
      const score = i / 20;
      const result = s.calibrate(score);
      if (result.calibratedProbability !== null) {
        expect(result.calibratedProbability).toBeGreaterThanOrEqual(0);
        expect(result.calibratedProbability).toBeLessThanOrEqual(1);
      }
    }
  });

  it('serialize/deserialize round-trip', () => {
    const s = new IsotonicCalibration();
    s.fit(buildDs('ds1', 30, 99));
    const data = s.serialize();
    const restored = IsotonicCalibration.deserialize(data);
    expect(restored.points).toEqual(s.points);
  });

  it('validateModel rejects missing points', () => {
    const s = new IsotonicCalibration();
    const result = s.validateModel({ parameters: {}, strategy: 'IsotonicCalibration' });
    expect(result.valid).toBe(false);
  });

  it('validateModel rejects non-monotonic points', () => {
    const s = new IsotonicCalibration();
    const result = s.validateModel({
      parameters: { points: [{ score: 0.2, prob: 0.8 }, { score: 0.5, prob: 0.3 }] },
      strategy: 'IsotonicCalibration',
    });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PlattScaling
// ═══════════════════════════════════════════════════════════════════════════════
describe('PlattScaling', () => {
  it('fits and produces A,B parameters', () => {
    const s = new PlattScaling();
    const params = s.fit(buildDs('ds1', 100, 42));
    expect(params).toHaveProperty('A');
    expect(params).toHaveProperty('B');
    expect(typeof params.A).toBe('number');
  });

  it('calibrate returns probability in [0,1]', () => {
    const s = new PlattScaling();
    s.fit(buildDs('ds1', 100, 42));
    const result = s.calibrate(0.5);
    expect(result.calibratedProbability).toBeGreaterThanOrEqual(0);
    expect(result.calibratedProbability).toBeLessThanOrEqual(1);
  });

  it('serialize/deserialize round-trip', () => {
    const s = new PlattScaling();
    s.fit(buildDs('ds1', 50, 77));
    const data = s.serialize();
    const restored = PlattScaling.deserialize(data);
    expect(restored.A).toBe(s.A);
    expect(restored.B).toBe(s.B);
    expect(restored.trained).toBe(true);
    expect(restored.calibrate(0.5).calibratedProbability).toBe(s.calibrate(0.5).calibratedProbability);
  });

  it('validateModel rejects missing A/B', () => {
    const s = new PlattScaling();
    const result = s.validateModel({ parameters: {}, strategy: 'PlattScaling' });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BetaCalibration
// ═══════════════════════════════════════════════════════════════════════════════
describe('BetaCalibration', () => {
  it('fits and produces alpha/beta parameters', () => {
    const s = new BetaCalibration();
    const params = s.fit(buildDs('ds1', 100, 42));
    expect(params).toHaveProperty('alphaPos');
    expect(params).toHaveProperty('betaPos');
    expect(params.alphaPos).toBeGreaterThan(0);
  });

  it('calibrate returns probability in [0,1]', () => {
    const s = new BetaCalibration();
    s.fit(buildDs('ds1', 100, 42));
    const result = s.calibrate(0.5);
    expect(result.calibratedProbability).toBeGreaterThanOrEqual(0);
    expect(result.calibratedProbability).toBeLessThanOrEqual(1);
  });

  it('serialize/deserialize round-trip', () => {
    const s = new BetaCalibration();
    s.fit(buildDs('ds1', 50, 77));
    const data = s.serialize();
    const restored = BetaCalibration.deserialize(data);
    expect(restored.alphaPos).toBe(s.alphaPos);
    expect(restored.betaPos).toBe(s.betaPos);
    expect(restored.calibrate(0.3).calibratedProbability).toBe(s.calibrate(0.3).calibratedProbability);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════════════════
describe('CalibrationStrategyRegistry', () => {
  it('starts with IdentityCalibration as default', () => {
    const reg = new CalibrationStrategyRegistry();
    const def = reg.default();
    expect(def).toBeInstanceOf(IdentityCalibration);
  });

  it('registers and retrieves strategies', () => {
    const reg = new CalibrationStrategyRegistry();
    const hist = new HistogramCalibration();
    reg.register(hist);
    expect(reg.get('HistogramCalibration')).toBe(hist);
  });

  it('lists all registered strategies', () => {
    const reg = new CalibrationStrategyRegistry();
    const names = reg.list();
    expect(names).toContain('IdentityCalibration');
  });

  it('cannot unregister IdentityCalibration', () => {
    const reg = new CalibrationStrategyRegistry();
    expect(() => reg.unregister('IdentityCalibration')).toThrow();
  });

  it('can unregister a custom strategy', () => {
    const reg = new CalibrationStrategyRegistry();
    reg.register(new IsotonicCalibration());
    expect(reg.unregister('IsotonicCalibration')).toBe(true);
    expect(reg.get('IsotonicCalibration')).toBeUndefined();
  });
});
