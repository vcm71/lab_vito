import { describe, expect, it } from 'vitest';
import { SpinManager } from '../../../src/tracker/SpinManager.js';
import { TrackerState } from '../../../src/tracker/TrackerState.js';
import { createSession, createSpin } from '../../builders/index.js';
import { expectSpinHistory, expectTrackerState } from '../../helpers/index.js';

describe('SpinManager', () => {
  it('rejects invalid spin numbers and accepts valid spins', () => {
    const state = new TrackerState();
    const manager = new SpinManager(state);

    expect(manager.addSpin('37')).toBeNull();
    expect(manager.addSpin(undefined)).toBeNull();

    const spin = manager.addSpin('00', { casino: 'Orion', dealer: 'Ada', table: 'T-1' });
    expect(spin).toMatchObject({
      id: 1,
      number: '00',
      casino: 'Orion',
      dealer: 'Ada',
      table: 'T-1',
    });
    expect(spin.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(manager.count()).toBe(1);
    expect(manager.isEmpty()).toBe(false);
  });

  it('deletes spins and reindexes remaining ids', () => {
    const state = new TrackerState();
    state.spins = [
      createSpin({ id: 1, number: '1' }),
      createSpin({ id: 2, number: '2' }),
      createSpin({ id: 3, number: '3' }),
    ];
    const manager = new SpinManager(state);

    expect(manager.deleteSpin(2)).toBe(true);
    expect(manager.getSpins()).toHaveLength(2);
    expectSpinHistory(manager.getSpins(), ['1', '3']);
    expect(manager.deleteSpin(99)).toBe(false);
  });

  it('updates spins only with valid roulette numbers', () => {
    const state = new TrackerState();
    state.spins = [createSpin({ id: 1, number: '4' })];
    const manager = new SpinManager(state);

    expect(manager.updateSpin(1, '00')).toBe(true);
    expect(manager.getSpins()[0].number).toBe('00');
    expect(manager.updateSpin(1, 'foo')).toBe(false);
    expect(manager.updateSpin(9, '1')).toBe(false);
  });

  it('normalizes legacy number input the same way as the production path', () => {
    expect(SpinManager.normalizeNumber(' 90 ')).toBe('00');
    expect(SpinManager.normalizeNumber('12.5')).toBe('12');
    expect(SpinManager.normalizeNumber('13,5')).toBe('13');
    expect(SpinManager.normalizeNumber(7)).toBe('7');
  });

  it('supports clearing and inspecting spin history', () => {
    const state = new TrackerState();
    state.session = createSession({ active: true, spinCount: 3 });
    state.spins = [createSpin({ id: 1, number: '37' })];
    const manager = new SpinManager(state);

    expect(manager.getLastNumber()).toBe('37');
    expect(manager.getLastSpin()).toMatchObject({ number: '37' });
    expect(manager.getHistory()).toHaveLength(1);

    manager.clearSpins();
    expectTrackerState(state, { spins: [] });
    expect(manager.getLastSpin()).toBeUndefined();
    expect(manager.isEmpty()).toBe(true);
  });
});
