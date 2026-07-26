/**
 * Tests de integración: RouletteTracker + DelayManager.
 * Verifica que los giros agregados a través del RouletteTracker
 * actualicen correctamente la caché de atrasos en DelayManager.
 *
 * Principio: clases reales. Solo mock localStorage para HistoryManager.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';
import { SessionManager } from '../../src/tracker/SessionManager.js';
import { HistoryManager } from '../../src/tracker/HistoryManager.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';
import { DelayManager } from '../../src/tracker/DelayManager.js';
import { RouletteTracker } from '../../src/tracker/RouletteTracker.js';
import { mockLocalStorage, restoreLocalStorage } from '../helpers/storage.mock.js';
import { createDefaultRouletteSettings } from '../../rouletteSettingsStore.js';

describe('Integration: Tracker + DelayManager', () => {
  let state;
  let tracker;
  let delayManager;

  beforeEach(() => {
    mockLocalStorage();

    state = new TrackerState();
    const spinManager = new SpinManager(state);
    const sessionManager = new SessionManager(state);
    const historyManager = new HistoryManager(state);
    const settingsManager = new SettingsManager(state);

    state.settings = createDefaultRouletteSettings();

    tracker = new RouletteTracker(state, spinManager, sessionManager, historyManager, settingsManager);

    delayManager = new DelayManager(() => tracker.getSpins());
    tracker.setDelayManager(delayManager);
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  it('should return zero delays before any spins', () => {
    expect(tracker.getDozenDelay(1)).toBe(0);
    expect(tracker.getColumnDelay(1)).toBe(0);
    expect(tracker.getNumberDelay('17')).toBe(0);
  });

  it('should calculate dozen delays from added spins', () => {
    // 1st dozen: 1-12. Add spins hitting 1st dozen.
    tracker.addSpin('1');   // 1st dozen
    tracker.addSpin('5');   // 1st dozen
    tracker.addSpin('17');  // 2nd dozen — delay for 1st dozen starts here
    tracker.addSpin('32');  // 3rd dozen — delay = 2 for 1st
    tracker.addSpin('14');  // 2nd dozen — delay = 3 for 1st

    // Delay for 1st dozen = spins since last hit on 1st dozen
    // '5' was the last hit, then: '17', '32', '14' = 3 spins
    expect(tracker.getDozenDelay(1)).toBe(3);
    // Todo el historial en 1a docena: 1,5 — luego atraso de 17,32,14 = 3
  });

  it('should calculate column delays from added spins', () => {
    // Column 1: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
    tracker.addSpin('1');    // col 1
    tracker.addSpin('17');   // col 2
    tracker.addSpin('5');    // col 2
    tracker.addSpin('32');   // col 2
    tracker.addSpin('14');   // col 2

    // Last col 1 hit at '1', then 4 spins without col 1
    expect(tracker.getColumnDelay(1)).toBe(4);
  });

  it('should track number delays', () => {
    tracker.addSpin('17');
    tracker.addSpin('5');
    tracker.addSpin('17');
    tracker.addSpin('32');
    tracker.addSpin('14');

    // '17' last appeared at index 2 (third spin), delay = 2 (32, 14 since last 17)
    expect(tracker.getNumberDelay('17')).toBe(2);
    // '5' last appeared at index 1, delay = 3 (17, 32, 14 since last 5)
    expect(tracker.getNumberDelay('5')).toBe(3);
    // '0' never appeared
    expect(tracker.getNumberDelay('0')).toBe(5); // 5 spins total, never hit
  });

  it('should invalidate delays after spin mutations', () => {
    const spin1 = tracker.addSpin('1');  // d1, id = 1
    tracker.addSpin('5');   // d1, id = 2
    tracker.addSpin('17');  // d2
    tracker.addSpin('32');  // d3

    // After 1, 5 (both d1), then 2 non-d1 spins → delay = 2
    expect(tracker.getDozenDelay(1)).toBe(2);

    // Add another non-d1 spin — cache isn't auto-invalidated by addSpin
    tracker.addSpin('14');  // d2, not d1
    // Delay stays at 2 (stale cache) until explicitly invalidated
    expect(tracker.getDozenDelay(1)).toBe(2);

    // Delete spin that IS in d1 — must invalidate and recalc
    // After deleting '1' (d1), remaining: 5(d1), 17(d2), 32(d3), 14(d2)
    // Last d1 is '5' at index 0, then 3 non-d1 spins → delay = 3
    tracker.deleteSpin(spin1.id);
    tracker.invalidateDelays();
    expect(tracker.getDozenDelay(1)).toBe(3);

    // Also verify column delay works after invalidation
    // '1' (col 1) was deleted. '5' (col 2) is now the first spin.
    tracker.invalidateDelays();
    expect(tracker.getColumnDelay(1)).toBe(4); // No col 1 hit in remaining spins
  });

  it('should clear delays with clearSession', () => {
    tracker.addSpin('1');
    tracker.addSpin('5');

    expect(tracker.getNumberDelay('3')).toBe(2);

    // clearSession clears spins AND invalidates delays
    tracker.clearSession();

    expect(tracker.isEmpty()).toBe(true);
    expect(tracker.getNumberDelay('3')).toBe(0);
    expect(tracker.getDozenDelay(1)).toBe(0);
  });
});
