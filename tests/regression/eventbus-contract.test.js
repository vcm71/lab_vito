/**
 * Regression Safety Suite — EventBus contract freeze.
 *
 * Caracteriza el contrato vigente del EventBus y su integración con el
 * Domain Tracker sin anticipar la arquitectura de eventos de fases futuras.
 */
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus.js';
import { RouletteTracker } from '../../src/tracker/RouletteTracker.js';
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';
import { SessionManager } from '../../src/tracker/SessionManager.js';
import { HistoryManager } from '../../src/tracker/HistoryManager.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';

function makeTracker() {
  const state = new TrackerState();
  const spinManager = new SpinManager(state);
  const sessionManager = new SessionManager(state);
  const historyManager = new HistoryManager(state);
  const settingsManager = new SettingsManager(state);
  return new RouletteTracker(state, spinManager, sessionManager, historyManager, settingsManager);
}

describe('EventBus contract', () => {
  it('on() + emit() entregan payload a los listeners', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('update', listener);
    bus.emit('update', { source: 'tracker', count: 3 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ source: 'tracker', count: 3 });
  });

  it('múltiples listeners reciben el mismo evento', () => {
    const bus = new EventBus();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    bus.on('update', listenerA);
    bus.on('update', listenerB);
    bus.emit('update', 'payload');

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerA.mock.calls[0][0].detail).toBe('payload');
    expect(listenerB.mock.calls[0][0].detail).toBe('payload');
  });

  it('once() solo dispara una vez', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.once('update', listener);
    bus.emit('update', 1);
    bus.emit('update', 2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toBe(1);
  });

  it('off() elimina un listener registrado', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('update', listener);
    bus.off('update', listener);
    bus.emit('update', { ok: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it('removeAll() limpia todos los listeners', () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on('update', listener);
    bus.removeAll();
    bus.emit('update', { ok: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it('setEventBus() y getEventBus() preservan la misma referencia', () => {
    const tracker = makeTracker();
    const bus = new EventBus();

    expect(tracker.getEventBus()).toBeNull();
    tracker.setEventBus(bus);

    expect(tracker.getEventBus()).toBe(bus);
  });

  it('el tracker aún no emite eventos automáticamente desde mutaciones del dominio', () => {
    const tracker = makeTracker();
    const bus = new EventBus();
    const emitSpy = vi.spyOn(bus, 'emit');

    tracker.setEventBus(bus);
    tracker.addSpin(7);
    tracker.clearSession();

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
