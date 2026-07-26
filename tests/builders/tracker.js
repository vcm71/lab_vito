import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';
import { DelayManager } from '../../src/tracker/DelayManager.js';

export function createSpin(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    number: overrides.number ?? '0',
    timestamp: overrides.timestamp ?? '2026-01-01T00:00:00.000Z',
    casino: overrides.casino ?? 'Orion Casino',
    dealer: overrides.dealer ?? 'Dealer One',
    table: overrides.table ?? 'A1',
  };
}

export function createSession(overrides = {}) {
  return {
    active: overrides.active ?? false,
    startedAt: overrides.startedAt ?? null,
    endedAt: overrides.endedAt ?? null,
    spinCount: overrides.spinCount ?? 0,
  };
}

export function createHistory(entries = []) {
  return entries.map((entry) => ({ ...entry }));
}

export function createAnalytics(overrides = {}) {
  return {
    getStats: overrides.getStats ?? (() => ({})),
    getAdvancedStats: overrides.getAdvancedStats ?? (() => ({})),
    getProbabilities: overrides.getProbabilities ?? (() => ([])),
    ...overrides,
  };
}

export function createTracker({ spins = [], session = createSession(), history = [], settings = {} } = {}) {
  const state = new TrackerState();
  state.spins = spins.map((spin) => ({ ...spin }));
  state.session = { ...session };
  state.history = createHistory(history);
  state.settings = { ...settings };

  const spinManager = new SpinManager(state);
  const delayManager = new DelayManager(() => spinManager.getSpins());

  return {
    state,
    spinManager,
    delayManager,
  };
}
