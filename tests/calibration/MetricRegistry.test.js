/**
 * Tests: MetricDescriptor + MetricRegistry.
 */
import { describe, it, expect } from 'vitest';
import { defineMetric } from '../../src/calibration/MetricDescriptor.js';
import { MetricRegistry } from '../../src/calibration/MetricRegistry.js';

describe('MetricDescriptor', () => {
  describe('defineMetric', () => {
    it('creates a frozen descriptor', () => {
      const m = defineMetric({
        id: 'test_metric',
        name: 'Test Metric',
        minimizer: true,
        referenceRange: [0, 1],
        compute: (_p, _o) => 0.5,
      });
      expect(m.id).toBe('test_metric');
      expect(m.minimizer).toBe(true);
    });

    it('throws if missing required fields', () => {
      expect(() => defineMetric({ name: 'Bad' })) .toThrow('id');
      expect(() => defineMetric({ id: 'x', name: 'x', minimizer: true })) .toThrow('referenceRange');
    });

    it('throws if compute is not a function', () => {
      expect(() => defineMetric({
        id: 'x', name: 'x', minimizer: true,
        referenceRange: [0, 1], compute: 'notfn',
      })) .toThrow('function');
    });
  });
});

describe('MetricRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new MetricRegistry();
  });

  it('pre-registers 8 standard metrics', () => {
    expect(registry.size).toBeGreaterThanOrEqual(8);
  });

  it('brierScore is a minimizer', () => {
    const m = registry.get('brierScore');
    expect(m.minimizer).toBe(true);
    expect(m.compute([0.7, 0.3], [1, 0])).toBeGreaterThanOrEqual(0);
  });

  it('accuracy is NOT a minimizer', () => {
    const m = registry.get('accuracy');
    expect(m.minimizer).toBe(false);
  });

  it('ece returns value in [0, 1]', () => {
    const m = registry.get('ece');
    const v = m.compute([0.8, 0.5, 0.2], [1, 0, 0]);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('list returns all descriptors', () => {
    const all = registry.list();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(registry.size);
  });

  it('listIds returns string array', () => {
    const ids = registry.listIds();
    expect(ids).toContain('brierScore');
    expect(ids).toContain('ece');
  });

  it('computeAll returns all metrics', () => {
    const preds = [0.7, 0.3, 0.9];
    const outcomes = [1, 0, 1];
    const results = registry.computeAll(preds, outcomes);
    expect(results).toHaveProperty('brierScore');
    expect(results).toHaveProperty('logLoss');
    expect(results).toHaveProperty('ece');
    expect(results).toHaveProperty('mce');
    expect(results).toHaveProperty('sharpness');
    expect(results).toHaveProperty('resolution');
    expect(results).toHaveProperty('uncertainty');
    expect(results).toHaveProperty('accuracy');
  });

  it('register adds a new metric', () => {
    registry.register({
      id: '_custom_metric',
      name: 'Custom',
      minimizer: false,
      referenceRange: [0, 10],
      compute: () => 7,
    });
    expect(registry.get('_custom_metric').compute()).toBe(7);
  });

  it('get returns undefined for unknown metric', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});
