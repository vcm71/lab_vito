import { describe, expect, it, vi } from 'vitest';
import { DelayManager } from '../../../src/tracker/DelayManager.js';
import { createTracker } from '../../builders/index.js';
import { expectDelay as assertDelay } from '../../helpers/index.js';
import { customSeries, emptySession, singleSpin } from '../../fixtures/index.js';

describe('DelayManager', () => {
  it('returns zero delays for an empty session', () => {
    const manager = new DelayManager(() => emptySession);

    expect(manager.getNumberDelay('1')).toBe(0);
    expect(manager.getNumberMaxDelay('1')).toBe(0);
    expect(manager.getDozenDelay(1)).toBe(0);
    expect(manager.getDozenMaxDelay(1)).toBe(0);
    expect(manager.getColumnDelay(1)).toBe(0);
    expect(manager.getColumnMaxDelay(1)).toBe(0);
  });

  it('calculates number, dozen and column delays from the live spin source', () => {
    const tracker = createTracker({ spins: customSeries });
    const manager = tracker.delayManager;

    assertDelay(manager, { number: '1', current: 8 });
    expect(manager.getNumberMaxDelay('1')).toBeGreaterThanOrEqual(8);
    expect(manager.getDozenDelay(1)).toBe(2);
    expect(manager.getDozenMaxDelay(1)).toBeGreaterThanOrEqual(2);
    expect(manager.getColumnDelay(1)).toBe(6);
    expect(manager.getColumnMaxDelay(1)).toBeGreaterThanOrEqual(6);
  });

  it('invalidates cache when the source changes', () => {
    const spins = [...singleSpin];
    const manager = new DelayManager(() => spins);

    expect(manager.getNumberDelay('17')).toBe(0);

    spins.push({ id: 2, number: '1', timestamp: '2026-01-01T00:00:01.000Z' });
    manager.invalidateCache();

    expect(manager.getNumberDelay('17')).toBe(1);
  });

  it('keeps the recomputation lazy after the first access', () => {
    const recompute = vi.fn(() => singleSpin);
    const manager = new DelayManager(recompute);

    expect(manager.getNumberDelay('17')).toBe(0);
    expect(manager.getNumberDelay('17')).toBe(0);
    expect(recompute).toHaveBeenCalledTimes(1);
  });
});
