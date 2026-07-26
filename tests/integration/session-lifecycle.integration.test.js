/**
 * Tests de integración: Ciclo de vida completo de sesión.
 * Verifica el flujo completo desde inicio → giros → detener → grabar → historial → nueva sesión.
 *
 * Principio: RouletteTracker real con todos los managers reales.
 * Mock solo localStorage para persistencia.
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

describe('Integration: Session Lifecycle', () => {
  let tracker;

  function createTracker() {
    const s = new TrackerState();
    const sm = new SpinManager(s);
    const ss = new SessionManager(s);
    const hm = new HistoryManager(s);
    const stm = new SettingsManager(s);
    s.settings = createDefaultRouletteSettings();
    const t = new RouletteTracker(s, sm, ss, hm, stm);
    const dm = new DelayManager(() => t.getSpins());
    t.setDelayManager(dm);
    return t;
  }

  beforeEach(() => {
    mockLocalStorage();
    tracker = createTracker();
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  it('should start session with correct initial state', () => {
    tracker.startSession();

    expect(tracker.isSessionActive()).toBe(true);
    expect(tracker.getSessionSpinCount()).toBe(0);
    expect(tracker.getSpins()).toHaveLength(0);

    const session = tracker.getSession();
    expect(session.active).toBe(true);
    expect(session.startedAt).toBeTruthy();
    expect(session.endedAt).toBeNull();
    expect(session.spinCount).toBe(0);
  });

  it('should add spins and track spin count during active session', () => {
    tracker.startSession();
    tracker.addSpin('17');
    tracker.addSpin('5');

    expect(tracker.getSessionSpinCount()).toBe(2);
    expect(tracker.count()).toBe(2);
    expect(tracker.getLastNumber()).toBe('5');
  });

  it('should stop session without clearing spins', () => {
    tracker.startSession();
    tracker.addSpin('17');
    tracker.addSpin('5');

    tracker.stopSession();

    expect(tracker.isSessionActive()).toBe(false);
    expect(tracker.getSpins()).toHaveLength(2); // spins preserved
    expect(tracker.getSession().endedAt).toBeTruthy();
  });

  it('should record session to history and start fresh session', async () => {
    // Session 1
    tracker.startSession();
    tracker.addSpin('17');
    tracker.addSpin('5');
    tracker.addSpin('32');
    await tracker.recordAndClearSession();

    expect(tracker.getHistoryCount()).toBe(1);
    expect(tracker.isEmpty()).toBe(true);
    expect(tracker.isSessionActive()).toBe(false);

    // Session 2 — fresh state
    tracker.startSession();
    tracker.addSpin('0');
    expect(tracker.getSessionSpinCount()).toBe(1);
    expect(tracker.count()).toBe(1);
    expect(tracker.getHistoryCount()).toBe(1); // session 1 still in history

    await tracker.recordAndClearSession();
    expect(tracker.getHistoryCount()).toBe(2);
    expect(tracker.getHistory()[0].spins.map(s => s.number)).toEqual(['17', '5', '32']);
    expect(tracker.getHistory()[1].spins.map(s => s.number)).toEqual(['0']);
  });

  it('should support reset session mid-way', () => {
    tracker.startSession();
    tracker.addSpin('17');
    tracker.addSpin('5');

    tracker.resetSession();

    expect(tracker.isSessionActive()).toBe(false);
    expect(tracker.getSpins()).toHaveLength(2); // reset only resets session, not spins

    // Start again — spins still there
    tracker.startSession();
    expect(tracker.getSpins()).toHaveLength(2);
    expect(tracker.isSessionActive()).toBe(true);
    expect(tracker.getSessionSpinCount()).toBe(0);
  });

  it('should clear session with clearSession (spins + session + persist)', async () => {
    tracker.startSession();
    tracker.addSpin('17');
    tracker.addSpin('5');

    expect(tracker.getSessionSpinCount()).toBe(2);

    // clearSession cleans everything
    await tracker.clearSession();

    expect(tracker.isEmpty()).toBe(true);
    expect(tracker.isSessionActive()).toBe(false);
    expect(tracker.getSessionSpinCount()).toBe(0);
  });

  it('should invalidate delays on clearSession', () => {
    tracker.startSession();
    tracker.addSpin('1');
    tracker.addSpin('5');

    // Both spins are in dozen 1, so the delay since last hit of d1 is 0
    expect(tracker.getDozenDelay(1)).toBe(0);

    tracker.clearSession();

    expect(tracker.getDozenDelay(1)).toBe(0);
    expect(tracker.getNumberDelay('5')).toBe(0);
  });
});
