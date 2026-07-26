import { expect } from 'vitest';

export function expectTrackerState(state, expected = {}) {
  if (expected.session) {
    expect(state.session).toMatchObject(expected.session);
  }
  if (expected.spins) {
    expect(state.spins).toMatchObject(expected.spins);
  }
  if (expected.history) {
    expect(state.history).toMatchObject(expected.history);
  }
  if (expected.settings) {
    expect(state.settings).toMatchObject(expected.settings);
  }
}

export function expectAnalytics(analytics) {
  expect(analytics).toHaveProperty('getStats');
  expect(analytics).toHaveProperty('getAdvancedStats');
  expect(analytics).toHaveProperty('getProbabilities');
}

export function expectDelay(manager, expected = {}) {
  if (expected.number !== undefined) {
    expect(manager.getNumberDelay(expected.number)).toBe(expected.current ?? 0);
  }
  if (expected.dozen !== undefined) {
    expect(manager.getDozenDelay(expected.dozen)).toBe(expected.dozenCurrent ?? 0);
  }
  if (expected.column !== undefined) {
    expect(manager.getColumnDelay(expected.column)).toBe(expected.columnCurrent ?? 0);
  }
}

export function expectSpinHistory(spins, numbers) {
  expect(spins.map((spin) => spin.number)).toEqual(numbers);
  expect(spins.map((spin) => spin.id)).toEqual(numbers.map((_, index) => index + 1));
}

export function expectSession(session, expected = {}) {
  expect(session).toMatchObject(expected);
}
