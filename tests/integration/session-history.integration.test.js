/**
 * Tests de integración: SessionManager + HistoryManager.
 * Verifica el flujo completo de sesión → historial → persistencia.
 *
 * Principio: managers reales, solo mock localStorage para persistencia.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SessionManager } from '../../src/tracker/SessionManager.js';
import { HistoryManager } from '../../src/tracker/HistoryManager.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';
import { RouletteTracker } from '../../src/tracker/RouletteTracker.js';
import { mockLocalStorage, restoreLocalStorage } from '../helpers/storage.mock.js';
import { createDefaultRouletteSettings } from '../../rouletteSettingsStore.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';

describe('Integration: Session + History', () => {
  let state;
  let tracker;
  let historyManager;

  beforeEach(() => {
    mockLocalStorage();

    state = new TrackerState();
    const spinManager = new SpinManager(state);
    const sessionManager = new SessionManager(state);
    historyManager = new HistoryManager(state);
    const settingsManager = new SettingsManager(state);

    state.settings = createDefaultRouletteSettings();

    tracker = new RouletteTracker(state, spinManager, sessionManager, historyManager, settingsManager);
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  it('should record a session and add it to history', async () => {
    tracker.startSession();
    tracker.addSpin('17');
    tracker.addSpin('5');
    tracker.addSpin('32');

    expect(tracker.getSessionSpinCount()).toBe(3);
    expect(tracker.isSessionActive()).toBe(true);

    const result = await tracker.recordAndClearSession();

    expect(result.saved).toBe(true);
    expect(result.spinCount).toBe(3);
    expect(tracker.getSpins()).toHaveLength(0);
    expect(tracker.isSessionActive()).toBe(false);
    expect(tracker.getHistory()).toHaveLength(1);

    const record = tracker.getLastSession();
    expect(record.spinCount).toBe(3);
    expect(record.spins).toHaveLength(3);
    expect(record.spins[0].number).toBe('17');
    expect(record.active).toBe(false);
    expect(record.startedAt).toBeTruthy();
    expect(record.endedAt).toBeTruthy();
  });

  it('should accumulate multiple sessions in history', async () => {
    // Session 1
    tracker.startSession();
    tracker.addSpin('0');
    tracker.addSpin('00');
    await tracker.recordAndClearSession();

    // Session 2
    tracker.startSession();
    tracker.addSpin('1');
    tracker.addSpin('2');
    tracker.addSpin('3');
    await tracker.recordAndClearSession();

    // Session 3
    tracker.startSession();
    tracker.addSpin('17');
    await tracker.recordAndClearSession();

    expect(tracker.getHistoryCount()).toBe(3);
    expect(tracker.getHistory()).toHaveLength(3);

    const last = tracker.getLastSession();
    expect(last.spinCount).toBe(1);
    expect(last.spins[0].number).toBe('17');
  });

  it('should persist history to localStorage across tracker instances', async () => {
    // Write session to history
    tracker.startSession();
    tracker.addSpin('7');
    tracker.addSpin('14');
    await tracker.recordAndClearSession();

    // Verify history is in localStorage
    const raw = localStorage.getItem('orion_roulette_history');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].spinCount).toBe(2);

    // Simulate new tracker instance loading from persistence
    const state2 = new TrackerState();
    state2.settings = createDefaultRouletteSettings();
    const history2 = new HistoryManager(state2);
    await history2.load();

    expect(state2.history).toHaveLength(1);
    expect(state2.history[0].spinCount).toBe(2);
    expect(state2.history[0].spins[0].number).toBe('7');
  });

  it('should record empty session without saving to history', async () => {
    tracker.startSession();

    // Record without any spins
    const result = await tracker.recordAndClearSession();

    expect(result.saved).toBe(false);
    expect(result.spinCount).toBe(0);
    expect(tracker.getHistory()).toHaveLength(0);
  });

  it('should clear history and persist empty state', async () => {
    // Add sessions
    tracker.startSession();
    tracker.addSpin('17');
    await tracker.recordAndClearSession();

    tracker.startSession();
    tracker.addSpin('5');
    await tracker.recordAndClearSession();

    expect(tracker.getHistoryCount()).toBe(2);

    // Clear history
    await tracker.clearHistory();
    expect(tracker.getHistory()).toHaveLength(0);

    // Verify localStorage updated
    const raw = localStorage.getItem('orion_roulette_history');
    expect(JSON.parse(raw)).toHaveLength(0);
  });
});
