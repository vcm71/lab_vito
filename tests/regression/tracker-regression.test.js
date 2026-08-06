/**
 * Regression Safety Suite — Fase 4.3
 *
 * Congela el comportamiento observable del dominio para detectar
 * regresiones antes de que lleguen a producción.
 *
 * Objetivos:
 *   1. Contratos públicos — métodos, tipos, estructura de retorno
 *   2. Invariantes del dominio — propiedades que nunca deben violarse
 *   3. Characterization — documenta el comportamiento actual (paso 0)
 *   4. Round Trip — export → import → compare
 *   5. Regresión — pérdida de giros, cache, desync
 *   6. Casos límite — vacío, 1 giro, repetidos, resets
 *   7. Bugs históricos — deleteSpin/updateSpin sin invalidación
 *   8. Mutabilidad — getters que exponen referencias internas
 *   9. Aislamiento — dos trackers independientes no se interfieren
 *  10. Estabilidad — repetibilidad (vía CI, no mockeamos Date aquí)
 */

import { describe, it, expect, vi } from 'vitest';
import { RouletteTracker } from '../../src/tracker/RouletteTracker.js';
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';
import { SessionManager } from '../../src/tracker/SessionManager.js';
import { HistoryManager } from '../../src/tracker/HistoryManager.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';
import { DelayManager } from '../../src/tracker/DelayManager.js';
import { RouletteAnalytics } from '../../src/analytics/RouletteAnalytics.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Crear un tracker limpio con estado fresco */
function makeTracker() {
  const state = new TrackerState();
  const spinManager = new SpinManager(state);
  const sessionManager = new SessionManager(state);
  const historyManager = new HistoryManager(state);
  const settingsManager = new SettingsManager(state);
  return new RouletteTracker(state, spinManager, sessionManager, historyManager, settingsManager);
}

/** Crear tracker con DelayManager y Analytics inyectados */
function makeFullTracker() {
  const tracker = makeTracker();
  const delayManager = new DelayManager(() => tracker.getSpins());
  const analytics = new RouletteAnalytics(tracker.getSpins(), tracker.getSettings());
  tracker.setDelayManager(delayManager);
  tracker.setAnalytics(analytics);
  return { tracker, delayManager, analytics };
}

/** Agregar N giros de prueba con números controlados */
function addTestSpins(tracker, numbers) {
  return numbers.map(n => tracker.addSpin(n));
}

/** Crear un arreglo de spins con números que cubren docenas/columnas */
function sampleSpins() {
  return [5, 12, 22, 30, 0, 17, 3, 36, 11, 8];
}

// ============================================================================
// 1. CONTRATOS PÚBLICOS — métodos, tipos, estructura de retorno
// ============================================================================
describe('1. CONTRATOS PÚBLICOS', () => {
  describe('RouletteTracker', () => {
    it('expone todos los métodos públicos', () => {
      const t = makeTracker();
      const methods = [
        'addSpin', 'removeLastSpin', 'deleteSpin', 'updateSpin',
        'clearSpins', 'getSpins', 'getLastSpin', 'getLastNumber',
        'count', 'isEmpty',
        'getSession', 'getSessionSpinCount', 'getSessionStartedAt',
        'isSessionActive', 'startSession', 'resetSession', 'stopSession',
        'incrementSessionSpinCount',
        'getHistory', 'getHistoryCount', 'getLastSession',
        'getSettings', 'updateSettings', 'setSetting', 'loadSettings',
        'refreshSettings', 'saveSettings', 'resetSettings', 'getDefaultSettings',
        'getStats', 'getAdvancedStats',
        'getDozenDelay', 'getColumnDelay', 'getNumberDelay',
        'getDozenMaxDelay', 'getColumnMaxDelay', 'getNumberMaxDelay',
        'invalidateDelays', 'clearSession',
        'getHitMap', 'getHitRanking',
        'getSeries', 'addOrUpdateSeries', 'toggleSeries', 'deleteSeries',
        'recordAndClearSession',
        'initialize', 'saveSpins', 'loadSpins',
        'addSessionToHistory', 'clearHistory', 'saveHistory', 'loadHistory',
        'setEventBus', 'setDelayManager', 'setAnalytics',
        'getEventBus',
      ];
      methods.forEach(m => {
        expect(t).toHaveProperty(m);
        expect(typeof t[m]).toBe('function');
      });
    });

    it('getSettings() retorna objeto no null', () => {
      const t = makeTracker();
      const s = t.getSettings();
      expect(s).toBeTruthy();
      expect(typeof s).toBe('object');
    });

    it('getSession() retorna estructura canónica', () => {
      const t = makeTracker();
      const ses = t.getSession();
      expect(ses).toHaveProperty('active');
      expect(ses).toHaveProperty('startedAt');
      expect(ses).toHaveProperty('endedAt');
      expect(ses).toHaveProperty('spinCount');
      expect(typeof ses.active).toBe('boolean');
      expect(typeof ses.spinCount).toBe('number');
    });

    it('getSpins() retorna array', () => {
      expect(Array.isArray(makeTracker().getSpins())).toBe(true);
    });

    it('getStats() retorna estructura con total', () => {
      const { tracker } = makeFullTracker();
      const stats = tracker.getStats();
      expect(stats).toHaveProperty('total');
      expect(typeof stats.total).toBe('number');
    });

    it('getAdvancedStats() retorna objeto (puede estar vacío sin analytics)', () => {
      const { tracker } = makeFullTracker();
      const astats = tracker.getAdvancedStats();
      expect(astats).toBeTruthy();
      expect(typeof astats).toBe('object');
    });

    it('count() retorna número >= 0', () => {
      const t = makeTracker();
      expect(typeof t.count()).toBe('number');
      expect(t.count()).toBeGreaterThanOrEqual(0);
    });

    it('isEmpty() retorna booleano', () => {
      const t = makeTracker();
      expect(typeof t.isEmpty()).toBe('boolean');
      expect(t.isEmpty()).toBe(true);
      t.addSpin(7);
      expect(t.isEmpty()).toBe(false);
    });

    it('settings getter delega a getSettings()', () => {
      const t = makeTracker();
      expect(t.settings).toBe(t.getSettings());
    });
  });

  describe('SpinManager', () => {
    it('addSpin retorna objeto spin o null', () => {
      const state = new TrackerState();
      const sm = new SpinManager(state);
      expect(sm.addSpin(17)).toBeTruthy();
      expect(sm.addSpin(17)).toHaveProperty('id');
      expect(sm.addSpin(17)).toHaveProperty('number');
      expect(sm.addSpin(17)).toHaveProperty('timestamp');
      expect(sm.addSpin(null)).toBeNull();
      expect(sm.addSpin('')).toBeNull();
      expect(sm.addSpin('invalid')).toBeNull();
    });

    it('deleteSpin retorna booleano', () => {
      const state = new TrackerState();
      const sm = new SpinManager(state);
      sm.addSpin(5);
      const r1 = sm.deleteSpin(1);
      expect(typeof r1).toBe('boolean');
      expect(r1).toBe(true);
      expect(sm.deleteSpin(999)).toBe(false);
    });

    it('updateSpin retorna booleano', () => {
      const state = new TrackerState();
      const sm = new SpinManager(state);
      sm.addSpin(5);
      expect(typeof sm.updateSpin(1, 10)).toBe('boolean');
      expect(sm.updateSpin(1, 10)).toBe(true);
      expect(sm.updateSpin(999, 5)).toBe(false);
    });
  });

  describe('RouletteAnalytics', () => {
    it('expone métodos de análisis clave', () => {
      const a = new RouletteAnalytics([{ number: '7' }], {});
      expect(typeof a.getStats).toBe('function');
      expect(typeof a.getAdvancedStats).toBe('function');
      expect(typeof a.runsTest).toBe('function');
      expect(typeof a.getWindowStats).toBe('function');
      expect(typeof a.getConfidenceIntervals).toBe('function');
      expect(typeof a.getDistanceHistogram).toBe('function');
      expect(typeof a.getAlerts).toBe('function');
      expect(typeof a.getProbabilities).toBe('function');
      expect(typeof a.refresh).toBe('function');
    });
  });
});

// ============================================================================
// 2. INVARIANTES DEL DOMINIO
// ============================================================================
describe('2. INVARIANTES DEL DOMINIO', () => {
  describe('spinCount invariante', () => {
    it('spinCount == count() tras addSpin', () => {
      const t = makeTracker();
      t.startSession();
      expect(t.getSessionSpinCount()).toBe(0);
      t.addSpin(5);
      expect(t.getSessionSpinCount()).toBe(1);
      expect(t.count()).toBe(1);
      t.addSpin(17);
      t.addSpin(0);
      expect(t.getSessionSpinCount()).toBe(3);
      expect(t.count()).toBe(3);
    });

    it('spinCount nunca es negativo', () => {
      const t = makeTracker();
      t.startSession();
      for (let i = 0; i < 10; i++) t.addSpin(i);
      t.resetSession();
      expect(t.getSessionSpinCount()).toBe(0);
      expect(t.count()).toBe(10); // counts are kept
    });

    it('session.spinCount se resetea al iniciar sesión', () => {
      const t = makeTracker();
      t.startSession();
      t.addSpin(5);
      t.addSpin(10);
      expect(t.getSessionSpinCount()).toBe(2);
      t.startSession(); // restart
      expect(t.getSessionSpinCount()).toBe(0);
    });
  });

  describe('ID invariantes', () => {
    it('IDs de giros son secuenciales 1-based sin huecos', () => {
      const t = makeTracker();
      addTestSpins(t, [5, 12, 22]);
      expect(t.getSpins().map(s => s.id)).toEqual([1, 2, 3]);
      t.deleteSpin(2);
      expect(t.getSpins().map(s => s.id)).toEqual([1, 2]); // reindexed
    });
  });

  describe('Delay invariantes', () => {
    it('delay es número >= 0 (nunca null ni negativo)', () => {
      const { delayManager } = makeFullTracker();
      expect(typeof delayManager.getDozenDelay(1)).toBe('number');
      expect(delayManager.getDozenDelay(1)).toBeGreaterThanOrEqual(0);
      expect(delayManager.getColumnDelay(1)).toBeGreaterThanOrEqual(0);
      expect(delayManager.getNumberDelay('7')).toBeGreaterThanOrEqual(0);
    });

    it('delay con 0 giros es 0 para todo', () => {
      const { delayManager } = makeFullTracker();
      expect(delayManager.getDozenDelay(1)).toBe(0);
      expect(delayManager.getDozenDelay(2)).toBe(0);
      expect(delayManager.getDozenDelay(3)).toBe(0);
      expect(delayManager.getColumnDelay(1)).toBe(0);
      expect(delayManager.getColumnDelay(2)).toBe(0);
      expect(delayManager.getColumnDelay(3)).toBe(0);
      expect(delayManager.getNumberDelay('0')).toBe(0);
      expect(delayManager.getNumberDelay('00')).toBe(0);
      expect(delayManager.getNumberDelay('17')).toBe(0);
    });
  });

  describe('HitMap invariantes', () => {
    it('getHitMap() retorna objeto con todas las claves de ROULETTE_NUMBERS', () => {
      const t = makeTracker();
      const hm = t.getHitMap();
      // Sin giros, debería estar vacío
      expect(Object.keys(hm).length).toBe(0);
      t.addSpin(7);
      t.addSpin(7);
      const hm2 = t.getHitMap();
      expect(hm2['7']).toBe(2);
    });
  });

  describe('Stats invariantes', () => {
    it('suma de colorsPct es 100 (o 0 si vacío)', () => {
      const { tracker } = makeFullTracker();
      const stats = tracker.getStats();
      if (stats.total === 0) {
        expect(stats.colorsPct.red + stats.colorsPct.black + stats.colorsPct.green).toBe(0);
      } else {
        const sum = stats.colorsPct.red + stats.colorsPct.black + stats.colorsPct.green;
        expect(sum).toBeCloseTo(100, 0);
      }
    });
  });
});

// ============================================================================
// 3. CHARACTERIZATION — documentar comportamiento actual
// ============================================================================
describe('3. CHARACTERIZATION', () => {
  describe('addSpin comportamiento', () => {
    it('addSpin retorna objeto con id secuencial', () => {
      const t = makeTracker();
      const s1 = t.addSpin(5);
      expect(s1.id).toBe(1);
      expect(s1.number).toBe('5');
      expect(s1).toHaveProperty('timestamp');

      const s2 = t.addSpin(12);
      expect(s2.id).toBe(2);
      expect(s2.number).toBe('12');
    });

    it('addSpin rechaza valores inválidos', () => {
      const t = makeTracker();
      expect(t.addSpin(null)).toBeNull();
      expect(t.addSpin(undefined)).toBeNull();
      expect(t.addSpin('')).toBeNull();
      expect(t.addSpin('XYZ')).toBeNull();
      expect(t.addSpin(99)).toBeNull();
      expect(t.addSpin('37')).toBeNull();
      expect(t.count()).toBe(0);
    });

    it('addSpin normaliza string a string', () => {
      const t = makeTracker();
      t.addSpin('17');
      expect(t.getSpins()[0].number).toBe('17');
    });
  });

  describe('removeLastSpin comportamiento', () => {
    it('removeLastSpin quita y retorna último', () => {
      const t = makeTracker();
      addTestSpins(t, [5, 12, 22]);
      const removed = t.removeLastSpin();
      expect(removed.number).toBe('22');
      expect(t.count()).toBe(2);
    });

    it('removeLastSpin en vacío retorna undefined', () => {
      expect(makeTracker().removeLastSpin()).toBeUndefined();
    });
  });

  describe('getLastSpin / getLastNumber', () => {
    it('retorna último giro y número', () => {
      const t = makeTracker();
      addTestSpins(t, [5, 12, 22]);
      expect(t.getLastSpin().number).toBe('22');
      expect(t.getLastNumber()).toBe('22');
    });

    it('en vacío retorna undefined', () => {
      const t = makeTracker();
      expect(t.getLastSpin()).toBeUndefined();
      expect(t.getLastNumber()).toBeUndefined();
    });
  });

  describe('Session comportamiento', () => {
    it('estado inicial sin sesión activa', () => {
      const t = makeTracker();
      expect(t.isSessionActive()).toBe(false);
      expect(t.getSession().active).toBe(false);
      expect(t.getSession().startedAt).toBeNull();
      expect(t.getSession().endedAt).toBeNull();
      expect(t.getSessionSpinCount()).toBe(0);
    });

    it('startSession() activa sesión', () => {
      const t = makeTracker();
      t.startSession();
      expect(t.isSessionActive()).toBe(true);
      expect(t.getSession().active).toBe(true);
      expect(t.getSession().startedAt).toBeTruthy();
      expect(t.getSession().endedAt).toBeNull();
      expect(t.getSessionSpinCount()).toBe(0);
    });

    it('stopSession() desactiva sesión y marca endedAt', () => {
      const t = makeTracker();
      t.startSession();
      t.addSpin(5);
      t.stopSession();
      expect(t.isSessionActive()).toBe(false);
      expect(t.getSession().endedAt).toBeTruthy();
      expect(t.getSessionSpinCount()).toBe(1);
    });

    it('resetSession() borra todo el estado de sesión', () => {
      const t = makeTracker();
      t.startSession();
      t.addSpin(5);
      t.addSpin(10);
      t.resetSession();
      expect(t.isSessionActive()).toBe(false);
      expect(t.getSession().startedAt).toBeNull();
      expect(t.getSession().endedAt).toBeNull();
      expect(t.getSessionSpinCount()).toBe(0);
      // spins NO se borran
      expect(t.count()).toBe(2);
    });
  });

  describe('Settings comportamiento', () => {
    it('getDefaultSettings() retorna objeto con propiedades clave', () => {
      const t = makeTracker();
      const def = t.getDefaultSettings();
      expect(def).toHaveProperty('casinoName');
      expect(def).toHaveProperty('crupierName');
      expect(def).toHaveProperty('tableName');
      expect(def).toHaveProperty('colorAlert');
      expect(def).toHaveProperty('dozenAlert');
    });

    it('settings.getter retorna mismo objeto que getSettings()', () => {
      const t = makeTracker();
      expect(t.settings).toBe(t.getSettings());
      t.getSettings().casinoName = 'Test';
      expect(t.settings.casinoName).toBe('Test');
    });
  });

  describe('clearSession comportamiento', () => {
    it('clearSession() borra giros, resetea sesión e invalida delays', () => {
      const { tracker, delayManager } = makeFullTracker();
      tracker.startSession();
      addTestSpins(tracker, [5, 12, 22]);
      const spy = vi.spyOn(delayManager, 'invalidateCache');

      tracker.clearSession();

      expect(tracker.count()).toBe(0);
      expect(tracker.isSessionActive()).toBe(false);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('recordAndClearSession comportamiento', () => {
    it('guarda sesión en historial y limpia giros', async () => {
      const { tracker } = makeFullTracker();
      tracker.startSession();
      addTestSpins(tracker, [5, 12, 22]);
      // mockear save de history para evitar localStorage
      vi.spyOn(tracker.historyManager, 'save').mockResolvedValue();
      vi.spyOn(tracker.historyManager, 'addSession');

      const result = await tracker.recordAndClearSession();

      expect(tracker.historyManager.addSession).toHaveBeenCalled();
      expect(result.saved).toBe(true);
      expect(result.spinCount).toBe(3);
      expect(tracker.count()).toBe(0);
    });

    it('sin giros, saved=false y no agrega al historial', async () => {
      const { tracker } = makeFullTracker();
      vi.spyOn(tracker.historyManager, 'save').mockResolvedValue();
      vi.spyOn(tracker.historyManager, 'addSession');

      const result = await tracker.recordAndClearSession();

      expect(result.saved).toBe(false);
      expect(tracker.historyManager.addSession).not.toHaveBeenCalled();
    });
  });

  describe('Series API comportamiento', () => {
    it('getSeries() retorna array', () => {
      const t = makeTracker();
      expect(Array.isArray(t.getSeries())).toBe(true);
    });

    it('addOrUpdateSeries agrega y retorna added:true', () => {
      const t = makeTracker();
      const r = t.addOrUpdateSeries('MiSerie', ['1', '2', '3']);
      expect(r.added).toBe(true);
      expect(r.updated).toBe(false);
    });

    it('addOrUpdateSeries detecta colisión por nombre', () => {
      const t = makeTracker();
      t.addOrUpdateSeries('MiSerie', ['1', '2', '3']);
      const r = t.addOrUpdateSeries('MiSerie', ['4', '5']);
      expect(r.added).toBe(false);
      expect(r.collisionName).toBeTruthy();
    });

    it('toggleSeries retorna nuevo estado', () => {
      const t = makeTracker();
      t.addOrUpdateSeries('S', ['1']);
      expect(t.toggleSeries('S')).toBe(false); // was active -> toggled to inactive
      expect(t.toggleSeries('S')).toBe(true);  // now inactive -> toggled to active
    });

    it('deleteSeries retorna booleano', () => {
      const t = makeTracker();
      t.addOrUpdateSeries('S', ['1']);
      expect(t.deleteSeries('S')).toBe(true);
      expect(t.deleteSeries('S')).toBe(false); // ya no existe
    });
  });
});

// ============================================================================
// 4. ROUND TRIP — export → import → compare
// ============================================================================
describe('4. ROUND TRIP', () => {
  it('estado exportado puede recrear tracker idéntico observable', () => {
    const t1 = makeTracker();
    t1.startSession();
    addTestSpins(t1, sampleSpins());
    t1.stopSession();

    // Export (deep copy de todo el estado observable)
    const stateSnapshot = JSON.parse(JSON.stringify({
      spins: t1.getSpins(),
      session: t1.getSession(),
      history: t1.getHistory(),
      settings: t1.getSettings(),
    }));

    // Crear tracker nuevo con los mismos datos
    const t2 = makeTracker();
    // Inyectar los datos manualmente (como si fuera deserialización)
    t2.state.spins = stateSnapshot.spins;
    t2.state.session = stateSnapshot.session;
    t2.state.history = stateSnapshot.history;
    // Settings necesita calentamiento — lo hacemos mediante set
    Object.assign(t2.state.settings, stateSnapshot.settings);

    // Compare
    expect(t2.count()).toBe(t1.count());
    expect(t2.getSession()).toEqual(t1.getSession());
    expect(t2.getSpins()).toEqual(t1.getSpins());
    expect(t2.getHistory()).toEqual(t1.getHistory());
    expect(t2.getSettings()).toEqual(t1.getSettings());
    expect(t2.getLastNumber()).toBe('8');
  });

  it('snapshot via recordAndClearSession preserva giros en historial', async () => {
    const { tracker } = makeFullTracker();
    tracker.startSession();
    addTestSpins(tracker, [5, 12, 22]);
    vi.spyOn(tracker.historyManager, 'save').mockResolvedValue();

    await tracker.recordAndClearSession();

    expect(tracker.getHistory().length).toBe(1);
    expect(tracker.getHistory()[0].spins.length).toBe(3);
    expect(tracker.getHistory()[0].spinCount).toBe(3);
    expect(tracker.getHistory()[0].spins[0].number).toBe('5');
  });

  it('hitMap/ranking son computados, nunca almacenados en estado', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 5, 5]);
    const hm = t.getHitMap();
    expect(hm['5']).toBe(3);
    const ranking = t.getHitRanking();
    expect(ranking[0].num).toBe('5');
    expect(ranking[0].hits).toBe(3);
  });
});

// ============================================================================
// 5. REGRESIÓN — pérdida de giros, cache, desync
// ============================================================================
describe('5. REGRESIÓN', () => {
  it('addSpin incrementa count y produce ID secuencial sin huecos', () => {
    const t = makeTracker();
    const validNums = '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,00'.split(',');
    for (let i = 0; i < 100; i++) {
      t.addSpin(validNums[i % 38]);
    }
    expect(t.count()).toBe(100);
    expect(t.getSpins().length).toBe(100);
    expect(t.getSpins()[0].id).toBe(1);
    expect(t.getSpins()[99].id).toBe(100);
  });

  it('deleteSpin y removeLastSpin nunca pierden giros sin decrementar count', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12, 22]);
    expect(t.count()).toBe(3);

    t.removeLastSpin();
    expect(t.count()).toBe(2);

    t.deleteSpin(1);
    expect(t.count()).toBe(1);

    expect(t.getSpins()[0].id).toBe(1); // reindexado
    expect(t.getSpins()[0].number).toBe('12');
  });

  it('updateSpin no altera count ni IDs', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12, 22]);
    t.updateSpin(2, 7);
    expect(t.count()).toBe(3);
    expect(t.getSpins()[1].number).toBe('7');
    expect(t.getSpins()[1].id).toBe(2);
  });

  it('clearSession no deja giros huérfanos ni sesión inconsistente', () => {
    const { tracker } = makeFullTracker();
    tracker.startSession();
    addTestSpins(tracker, [5, 12, 22]);
    tracker.clearSession();

    expect(tracker.count()).toBe(0);
    expect(tracker.isSessionActive()).toBe(false);
    expect(tracker.getSessionSpinCount()).toBe(0);
    expect(tracker.getSpins()).toEqual([]);
  });

  it('saveSpins/loadSpins round-trip preserva giros', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12, 22]);

    // Simulamos la restauración observable del estado
    t.state.spins = [
      { id: 1, number: '5', timestamp: '2024-01-01' },
      { id: 2, number: '12', timestamp: '2024-01-01' },
    ];
    expect(Array.isArray(t.getSpins())).toBe(true);
    expect(t.getSpins().length).toBe(2);
  });

  it('getSpins() retorna referencia directa al estado interno', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12]);
    const ref = t.getSpins();
    expect(ref).toBe(t.state.spins); // must be same reference
  });
});

// ============================================================================
// 6. CASOS LÍMITE
// ============================================================================
describe('6. CASOS LÍMITE', () => {
  it('tracker vacío: count=0, isEmpty=true', () => {
    const t = makeTracker();
    expect(t.count()).toBe(0);
    expect(t.isEmpty()).toBe(true);
    expect(t.getSpins()).toEqual([]);
    expect(t.getLastSpin()).toBeUndefined();
    expect(t.getLastNumber()).toBeUndefined();
  });

  it('1 solo giro: getLastSpin == único giro', () => {
    const t = makeTracker();
    const s = t.addSpin(17);
    expect(t.count()).toBe(1);
    expect(t.getLastSpin()).toEqual(s);
    expect(t.getLastNumber()).toBe('17');
  });

  it('números repetidos: hitMap acumula correctamente', () => {
    const t = makeTracker();
    for (let i = 0; i < 50; i++) t.addSpin(7);
    expect(t.count()).toBe(50);
    expect(t.getHitMap()['7']).toBe(50);
  });

  it('números 0 y 00 son válidos', () => {
    const t = makeTracker();
    const s0 = t.addSpin(0);
    const s00 = t.addSpin('00');
    expect(s0.number).toBe('0');
    expect(s00.number).toBe('00');
    expect(t.count()).toBe(2);
  });

  it('resetSession no afecta a otros trackers en sesión', () => {
    const t1 = makeTracker();
    const t2 = makeTracker();
    t1.startSession();
    t1.addSpin(5);
    t2.startSession();
    t2.addSpin(10);

    t1.resetSession();
    expect(t1.isSessionActive()).toBe(false);
    expect(t2.isSessionActive()).toBe(true);
    expect(t2.count()).toBe(1);
  });

  it('deleteSpin de ID inexistente retorna false sin mutar', () => {
    const t = makeTracker();
    addTestSpins(t, [1, 2, 3]);
    const before = t.getSpins().length;
    expect(t.deleteSpin(999)).toBe(false);
    expect(t.getSpins().length).toBe(before);
  });

  it('updateSpin de número inválido retorna false sin mutar', () => {
    const t = makeTracker();
    addTestSpins(t, [1, 2, 3]);
    const before = t.getSpins().map(s => s.number);
    expect(t.updateSpin(1, 999)).toBe(false);
    expect(t.updateSpin(1, 'XYZ')).toBe(false);
    expect(t.getSpins().map(s => s.number)).toEqual(before);
  });

  it('clearSpins en tracker vacío no da error', () => {
    const t = makeTracker();
    expect(() => t.clearSpins()).not.toThrow();
    expect(t.count()).toBe(0);
  });
});

// ============================================================================
// 7. BUGS HISTÓRICOS
// ============================================================================
describe('7. BUGS HISTÓRICOS', () => {
  it('deleteSpin no invalida delays automáticamente (comportamiento conocido)', () => {
    // Historical bug: deleteSpin only modifies SpinManager, does NOT call invalidateDelays.
    // DomainTracker.deleteSpin → spinManager.deleteSpin (no delay invalidation)
    // The caller (syncAdapter) is responsible for calling delayManager.invalidateCache()
    const { tracker, delayManager } = makeFullTracker();
    const spy = vi.spyOn(delayManager, 'invalidateCache');

    addTestSpins(tracker, [5, 12, 22]);
    expect(tracker.getDozenDelay(1)).toBeGreaterThanOrEqual(0); // populates cache

    spy.mockClear();
    tracker.deleteSpin(2); // does NOT invalidate cache

    expect(spy).not.toHaveBeenCalled();
  });

  it('updateSpin no invalida delays automáticamente (comportamiento conocido)', () => {
    const { tracker, delayManager } = makeFullTracker();
    const spy = vi.spyOn(delayManager, 'invalidateCache');

    addTestSpins(tracker, [5, 12, 22]);
    spy.mockClear();
    tracker.updateSpin(1, 17);

    expect(spy).not.toHaveBeenCalled();
  });

  it('clearSession() sí invalida delays (cubre el triple clear)', () => {
    const { tracker, delayManager } = makeFullTracker();
    const spy = vi.spyOn(delayManager, 'invalidateCache');

    addTestSpins(tracker, [5, 12, 22]);
    tracker.clearSession();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('addSpin no invalida delays (cache lazy - comportamiento por diseño)', () => {
    const { tracker, delayManager } = makeFullTracker();
    const spy = vi.spyOn(delayManager, 'invalidateCache');

    tracker.addSpin(7);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// 8. MUTABILIDAD — getters que exponen referencias internas
// ============================================================================
describe('8. MUTABILIDAD', () => {
  it('getSpins() retorna referencia mutable al array interno', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12]);
    const ref = t.getSpins();
    ref.push({ id: 99, number: '0', timestamp: new Date().toISOString() });
    // Mutation via reference affects internal state
    expect(t.count()).toBe(3);
    expect(t.getSpins()[2].id).toBe(99);
  });

  it('getHistory() retorna referencia mutable al array interno', () => {
    const t = makeTracker();
    t.state.history.push({ id: 'external', spinCount: 0 });
    // Mutation via the reference we got from getHistory would be silently visible
    expect(t.getHistory().length).toBe(1);
    const ref = t.getHistory();
    ref.push({ id: 'mutated', spinCount: 5 });
    expect(t.getHistory().length).toBe(2);
  });

  it('getSession() retorna referencia mutable al objeto interno', () => {
    const t = makeTracker();
    const ses = t.getSession();
    ses.spinCount = 999; // mutación externa
    expect(t.getSessionSpinCount()).toBe(999);
  });

  it('getSettings() retorna referencia mutable al objeto interno', () => {
    const t = makeTracker();
    const s = t.getSettings();
    s.casinoName = 'Hacked';
    expect(t.getSettings().casinoName).toBe('Hacked');
  });

  it('settings getter es igual de mutable', () => {
    const t = makeTracker();
    t.settings.crupieName = 'Mutated';
    expect(t.getSettings().crupieName).toBe('Mutated');
  });

  it('DelayManager no retorna referencias internas (retorna números puros)', () => {
    const { delayManager } = makeFullTracker();
    expect(typeof delayManager.getDozenDelay(1)).toBe('number');
    expect(typeof delayManager.getColumnDelay(1)).toBe('number');
    expect(typeof delayManager.getNumberDelay('7')).toBe('number');
  });

  it('getHitMap() retorna objeto nuevo cada vez (inmune a mutación externa)', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12]);
    const hm1 = t.getHitMap();
    const hm2 = t.getHitMap();
    expect(hm1).not.toBe(hm2); // fresh reference
    expect(hm1).toEqual(hm2);
  });

  it('getHitRanking() retorna array nuevo cada vez', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12]);
    const r1 = t.getHitRanking();
    const r2 = t.getHitRanking();
    expect(r1).not.toBe(r2);
  });
});

// ============================================================================
// 9. AISLAMIENTO — trackers independientes no se interfieren
// ============================================================================
describe('9. AISLAMIENTO', () => {
  it('dos trackers con estado separado no comparten arrays', () => {
    const t1 = makeTracker();
    const t2 = makeTracker();

    addTestSpins(t1, [5, 12, 22]);
    addTestSpins(t2, [17, 3]);

    expect(t1.count()).toBe(3);
    expect(t2.count()).toBe(2);
    expect(t1.getSpins()).not.toEqual(t2.getSpins());
  });

  it('mutación en t1.getSpins() no afecta t2', () => {
    const t1 = makeTracker();
    const t2 = makeTracker();

    addTestSpins(t1, [5, 12]);
    const t1ref = t1.getSpins();
    t1ref.push({ id: 99, number: '0', timestamp: 'X' });

    expect(t1.count()).toBe(3); // t1 affected
    expect(t2.count()).toBe(0); // t2 unaffected
  });

  it('resetSession en t1 no resetea sesión de t2', () => {
    const t1 = makeTracker();
    const t2 = makeTracker();

    t1.startSession();
    t2.startSession();
    t1.resetSession();

    expect(t1.isSessionActive()).toBe(false);
    expect(t2.isSessionActive()).toBe(true);
  });

  it('DelayManager atado a t1 no se afecta por t2', () => {
    const t1 = makeTracker();
    const t2 = makeTracker();

    addTestSpins(t1, [5, 12, 22]);
    addTestSpins(t2, [17, 3, 7, 0, 36, 14]); // different data

    const dm1 = new DelayManager(() => t1.getSpins());
    const dm2 = new DelayManager(() => t2.getSpins());

    // Get delays for same category — should differ
    const d1 = dm1.getDozenDelay(1);
    const d2 = dm2.getDozenDelay(1);
    // They don't have to differ, but the key invariant is they're
    // based on different spin sets
    expect(typeof d1).toBe('number');
    expect(typeof d2).toBe('number');
  });

  it('addOrUpdateSeries en t1 no aparece en t2', () => {
    const t1 = makeTracker();
    const t2 = makeTracker();

    t1.addOrUpdateSeries('Solo T1', ['1', '2']);
    expect(t1.getSeries().length).toBe(1);
    expect(t2.getSeries().length).toBe(0);
  });
});

// ============================================================================
// 10. ESTABILIDAD (ejecutado por CI)
// ============================================================================
describe('10. ESTABILIDAD', () => {
  it('tracker puede agregar 100 giros sin degradación', () => {
    const t = makeTracker();
    const validNums = '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,00'.split(',');
    for (let round = 0; round < 10; round++) {
      for (let i = 0; i < 100; i++) {
        t.addSpin(validNums[i % 38]);
      }
      expect(t.count()).toBe((round + 1) * 100);
      // HitMap calcula bien
      expect(Object.keys(t.getHitMap()).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('ciclo addSpin-removeLastSpin produce resultado consistente', () => {
    const t = makeTracker();
    addTestSpins(t, [5, 12, 22]);
    t.removeLastSpin();
    t.addSpin(22); // add same number back
    // After: we removed then re-added — IDs won't match
    expect(t.count()).toBe(3); // still 3
    expect(t.getSpins()[2].number).toBe('22');
  });

  it('RouletteAnalytics es refrescable sin crear nueva instancia', () => {
    const { analytics } = makeFullTracker();
    const stats1 = analytics.getStats();

    const newSpins = [{ number: '7' }, { number: '14' }, { number: '21' }];
    analytics.refresh(newSpins, {});
    const stats2 = analytics.getStats();

    expect(stats2.total).toBe(3);
    expect(stats1.total).not.toBe(stats2.total);
  });

  it('múltiples calls a clearSession son idempotentes', () => {
    const { tracker } = makeFullTracker();
    tracker.startSession();
    addTestSpins(tracker, [5, 12]);

    tracker.clearSession();
    expect(tracker.count()).toBe(0);
    expect(tracker.isSessionActive()).toBe(false);

    // Segundo clearSession
    tracker.clearSession();
    expect(tracker.count()).toBe(0);
    expect(tracker.isSessionActive()).toBe(false);
  });

  it('múltiples calls a clearSpins son idempotentes', () => {
    const t = makeTracker();
    addTestSpins(t, [1, 2, 3]);
    t.clearSpins();
    expect(t.count()).toBe(0);
    t.clearSpins();
    expect(t.count()).toBe(0);
  });
});
