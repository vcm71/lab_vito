/**
 * RouletteTracker — orquestador del dominio Roulette Tracker.
 * Coordina los managers y expone la API pública del dominio.
 *
 * Recibe:
 * - TrackerState (estado)
 * - SpinManager (giros)
 * - SessionManager (sesiones)
 * - HistoryManager (persistencia)
 * - SettingsManager (configuración)
 *
 * NO implementa lógica de negocio. Solo estructura y coordinación.
 * Fase4.2 — session migrado de null a objeto estructurado.
 *
 * Fase5.2.1 — validación, persistencia e hidratación de spins.
 *   initialize() ahora carga spins desde rouletteSpinsStore (GAP-07).
 *   saveSpins() y loadSpins() disponibles (GAP-04).
 * Fase5.2.2 — deleteSpin/updateSpin (GAP-02), metadatos en addSpin (GAP-06).
 */
import { rouletteSpinsStore } from '../../rouletteSpinsStore.js';
import { DelayManager } from './DelayManager.js';

export class RouletteTracker {
  /**
   * @param {import('./TrackerState.js').TrackerState} state
   * @param {import('./SpinManager.js').SpinManager} spinManager
   * @param {import('./SessionManager.js').SessionManager} sessionManager
   * @param {import('./HistoryManager.js').HistoryManager} historyManager
   * @param {import('./SettingsManager.js').SettingsManager} settingsManager
   * @param {DelayManager} [delayManager] Manager opcional de atrasos (inyectado externamente)
   */
  constructor(state, spinManager, sessionManager, historyManager, settingsManager, delayManager) {
    /** @type {import('./TrackerState.js').TrackerState} */
    this.state = state;

    /** @type {import('./SpinManager.js').SpinManager} */
    this.spinManager = spinManager;

    /** @type {import('./SessionManager.js').SessionManager} */
    this.sessionManager = sessionManager;

    /** @type {import('./HistoryManager.js').HistoryManager} */
    this.historyManager = historyManager;

    /** @type {import('./SettingsManager.js').SettingsManager} */
    this.settingsManager = settingsManager;

    /** @type {import('../core/EventBus.js').EventBus|null} */
    this._eventBus = null;

    /** @type {DelayManager|null} Manager de atrasos (opcional, inyectado externamente) */
    this._delayManager = delayManager || null;
  }

  /**
   * Vincular el tracker a un EventBus.
   * Preparado para emisión de eventos en fases futuras.
   * @param {import('../core/EventBus.js').EventBus} eventBus
   */
  setEventBus(eventBus) {
    this._eventBus = eventBus;
  }

  /**
   * Vincular DelayManager externo (para caché de atrasos).
   * @param {DelayManager} delayManager
   */
  setDelayManager(delayManager) {
    this._delayManager = delayManager;
  }

  /**
   * Vincular RouletteAnalytics para delegar getStats/getAdvancedStats.
   * @param {import('../analytics/RouletteAnalytics.js').RouletteAnalytics} analytics
   */
  setAnalytics(analytics) {
    this._analytics = analytics;
  }

  /**
   * Obtener el EventBus vinculado.
   * @returns {import('../core/EventBus.js').EventBus|null}
   */
  getEventBus() {
    return this._eventBus;
  }

  /**
   * Getter de compatibilidad: delegar a getSettings().
   * Permite mantener la sintaxis `this.tracker.settings.xxx` sin refactorizar consumidores.
   * @returns {object}
   */
  get settings() {
    return this.getSettings();
  }

  /**
   * Getter de compatibilidad: frecuencia { número → count }.
   * Equivalente a TrackerCompat._freq usado por orionRenderer.
   * @returns {object}
   */
  get _freq() {
    const freq = {};
    const spins = this.getSpins();
    ROULETTE_NUMBERS.forEach(n => { freq[n] = 0; });
    spins.forEach(s => { freq[s.number]++; });
    return freq;
  }

  /**
   * Inicializar el dominio: cargar configuración, historial y giros.
   * @returns {Promise<void>}
   */
  async initialize() {
    const settings = await this.settingsManager.load();
    const history = await this.historyManager.load();
    const spins = await rouletteSpinsStore.load();
    this.state.settings = settings;
    this.state.history = history;
    this.state.spins = spins;
  }

  /**
   * Agregar un giro (delega a SpinManager con metadatos de settings).
   * @param {string|number} number
   * @returns {object|null}
   */
  addSpin(number) {
    const settings = this.getSettings();
    const result = this.spinManager.addSpin(number, {
      casino: settings.casinoName,
      dealer: settings.crupierName,
      table: settings.tableName
    });
    if (result) this.incrementSessionSpinCount();
    return result;
  }

  /**
   * Eliminar el último giro.
   * @returns {object|undefined}
   */
  removeLastSpin() {
    return this.spinManager.removeLastSpin();
  }

  /**
   * Eliminar un giro por su ID (delega a SpinManager).
   * @param {number} spinId
   * @returns {boolean}
   */
  deleteSpin(spinId) {
    return this.spinManager.deleteSpin(spinId);
  }

  /**
   * Actualizar el número de un giro (delega a SpinManager).
   * @param {number} spinId
   * @param {string|number} newNumber
   * @returns {boolean}
   */
  updateSpin(spinId, newNumber) {
    return this.spinManager.updateSpin(spinId, newNumber);
  }

  /**
   * Limpiar todos los giros.
   */
  clearSpins() {
    this.spinManager.clearSpins();
  }

  /**
   * Obtener todos los giros.
   * @returns {Array}
   */
  getSpins() {
    return this.spinManager.getSpins();
  }

  /**
   * Obtener el historial de sesiones completadas.
   * @returns {Array}
   */
  getHistory() {
    return this.state.history;
  }

  /**
   * Obtener el último giro.
   * @returns {object|undefined}
   */
  getLastSpin() {
    return this.spinManager.getLastSpin();
  }

  /**
   * Obtener el número del último giro.
   * @returns {string|undefined}
   */
  getLastNumber() {
    return this.spinManager.getLastNumber();
  }

  /**
   * Cantidad total de giros.
   * @returns {number}
   */
  count() {
    return this.spinManager.count();
  }

  /**
   * Verificar si no hay giros.
   * @returns {boolean}
   */
  isEmpty() {
    return this.spinManager.isEmpty();
  }

  // ── Spin Persistence API (Fase5.2.1) ─────────────────────

  /**
   * Persistir todos los giros actuales en IndexedDB.
   * Reutiliza rouletteSpinsStore (misma infraestructura que el Legacy).
   * @returns {Promise<void>}
   */
  async saveSpins() {
    await rouletteSpinsStore.setSpins(this.getSpins());
  }

  /**
   * Recargar giros desde IndexedDB y restaurarlos en el estado.
   * @returns {Promise<Array>}
   */
  async loadSpins() {
    const spins = await rouletteSpinsStore.load();
    this.state.spins = spins;
    return spins;
  }

  // ── History API (Fase4.4) ────────────────────────────────

  /**
   * Agregar una sesión completada al historial y persistir.
   * @param {object} sessionRecord
   * @returns {Promise<void>}
   */
  async addSessionToHistory(sessionRecord) {
    this.historyManager.addSession(sessionRecord);
    await this.historyManager.save();
  }

  /**
   * Vaciar todo el historial de sesiones completadas y persistir.
   * @returns {Promise<void>}
   */
  async clearHistory() {
    this.historyManager.clear();
    await this.historyManager.save();
  }

  /**
   * Persistir el historial actual.
   * @returns {Promise<void>}
   */
  async saveHistory() {
    await this.historyManager.save();
  }

  /**
   * Recargar el historial desde localStorage.
   * @returns {Promise<Array>}
   */
  async loadHistory() {
    return this.historyManager.load();
  }

  /**
   * Obtener la última sesión completada.
   * @returns {object|null}
   */
  getLastSession() {
    return this.historyManager.getLastSession();
  }

  /**
   * Cantidad de sesiones completadas.
   * @returns {number}
   */
  getHistoryCount() {
    return this.historyManager.count();
  }

  // ── Session API (Fase4.2) ─────────────────────────────────

  /**
   * Iniciar una nueva sesión.
   */
  startSession() {
    this.sessionManager.start();
  }

  /**
   * Reiniciar la sesión actual.
   */
  resetSession() {
    this.sessionManager.reset();
  }

  /**
   * Detener la sesión activa.
   */
  stopSession() {
    this.sessionManager.stop();
  }

  /**
   * Verificar si hay una sesión activa.
   * @returns {boolean}
   */
  isSessionActive() {
    return this.sessionManager.isActive();
  }

  /**
   * Obtener el objeto de sesión actual.
   * @returns {{active: boolean, startedAt: string|null, endedAt: string|null, spinCount: number}}
   */
  getSession() {
    return this.sessionManager.getSession();
  }

  /**
   * Incrementar el contador de giros de la sesión activa.
   */
  incrementSessionSpinCount() {
    this.sessionManager.incrementSpinCount();
  }

  /**
   * Obtener la cantidad de giros de la sesión actual.
   * @returns {number}
   */
  getSessionSpinCount() {
    return this.sessionManager.getSpinCount();
  }

  /**
   * Obtener el timestamp de inicio de la sesión.
   * @returns {string|null}
   */
  getSessionStartedAt() {
    return this.sessionManager.getStartedAt();
  }

  // ── Settings API (Fase4.3) ────────────────────────────────

  /**
   * Obtener la configuración completa del tracker.
   * @returns {object}
   */
  getSettings() {
    return this.settingsManager.get();
  }

  /**
   * Actualizar parcialmente la configuración y persistir.
   * @param {object} partial
   * @returns {Promise<void>}
   */
  async updateSettings(partial) {
    await this.settingsManager.update(partial);
  }

  /**
   * Establecer un valor individual y persistir.
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  async setSetting(key, value) {
    await this.settingsManager.set(key, value);
  }

  /**
   * Cargar configuración desde IndexedDB.
   * @returns {Promise<object>}
   */
  async loadSettings() {
    return this.settingsManager.load();
  }

  /**
   * Recargar configuración desde IndexedDB (refrescar).
   * @returns {Promise<object>}
   */
  async refreshSettings() {
    return this.settingsManager.refresh();
  }

  /**
   * Persistir la configuración actual.
   * @returns {Promise<void>}
   */
  async saveSettings() {
    await this.settingsManager.save();
  }

  /**
   * Restablecer configuración a valores por defecto.
   * @returns {Promise<void>}
   */
  async resetSettings() {
    await this.settingsManager.reset();
  }

  /**
   * Obtener la configuración por defecto.
   * @returns {object}
   */
  getDefaultSettings() {
    return this.settingsManager.getDefault();
  }

  // ── CustomSeries API (Fase4.5) ────────────────────────────

  /**
   * Obtener todas las series personalizadas.
   * @returns {Array<{name: string, numbers: string[], active: boolean}>}
   */
  getSeries() {
    const settings = this.getSettings();
    return settings.customSeries || [];
  }

  /**
   * Agregar o actualizar una serie personalizada.
   * Si oldName se provee, se busca por ese nombre (rename); si no, por name.
   * @param {string} name - Nombre nuevo/final de la serie
   * @param {string[]} numbers - Array de strings con los números
   * @param {string} [oldName] - Nombre anterior (para renombrar)
   * @returns {{added: boolean, updated: boolean, collisionName: string|null}}
   *   - collisionName: nombre existente que colisiona (si oldName no coincide)
   */
  addOrUpdateSeries(name, numbers, oldName) {
    const currentList = [...(this.getSettings().customSeries || [])];
    const searchName = oldName || name;
    let targetIdx = -1;

    // Buscar colisión: si oldName se provee, excluimos ese índice de la colisión
    if (oldName) {
      targetIdx = currentList.findIndex(s => s.name.toLowerCase() === oldName.toLowerCase());
      const collisionIdx = currentList.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
      if (collisionIdx > -1 && collisionIdx !== targetIdx) {
        return { added: false, updated: false, collisionName: currentList[collisionIdx].name };
      }
    } else {
      targetIdx = currentList.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
      if (targetIdx > -1) {
        return { added: false, updated: false, collisionName: currentList[targetIdx].name };
      }
    }

    if (targetIdx > -1) {
      // Actualizar existente
      currentList[targetIdx].numbers = numbers;
      currentList[targetIdx].name = name;
      this.settingsManager.update({ customSeries: currentList });
      return { added: false, updated: true, collisionName: null };
    } else {
      // Agregar nueva
      currentList.push({ name, numbers, active: true });
      this.settingsManager.update({ customSeries: currentList });
      return { added: true, updated: false, collisionName: null };
    }
  }

  /**
   * Alternar el estado activo/inactivo de una serie.
   * @param {string} name
   * @returns {boolean} El nuevo estado (true = activa)
   */
  toggleSeries(name) {
    const currentList = [...(this.getSettings().customSeries || [])];
    const idx = currentList.findIndex(s => s.name === name);
    if (idx === -1) return false;
    const newState = currentList[idx].active !== false ? false : true;
    currentList[idx].active = newState;
    this.settingsManager.update({ customSeries: currentList });
    return newState;
  }

  /**
   * Eliminar una serie personalizada por nombre.
   * @param {string} name
   * @returns {boolean} true si se eliminó, false si no se encontró
   */
  deleteSeries(name) {
    const currentList = [...(this.getSettings().customSeries || [])];
    const idx = currentList.findIndex(s => s.name === name);
    if (idx === -1) return false;
    currentList.splice(idx, 1);
    this.settingsManager.update({ customSeries: currentList });
    return true;
  }

  // ── Session Recording API (Fase4.5) ───────────────────────

  /**
   * Guardar la sesión actual en el historial y reiniciarla.
   * @returns {Promise<{saved: boolean, spinCount: number}>}
   */
  async recordAndClearSession() {
    const spins = this.getSpins();
    const session = this.getSession();
    const hasSpins = spins.length > 0;

    if (hasSpins) {
      const sessionRecord = {
        active: false,
        startedAt: session.startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        spinCount: spins.length,
        spins: JSON.parse(JSON.stringify(spins))
      };
      await this.addSessionToHistory(sessionRecord);
    }
    this.resetSession();
    this.clearSpins();
    return { saved: hasSpins, spinCount: spins.length };
  }

  // ── HitMap API (Fase4.5) ──────────────────────────────────

  /**
   * Construir mapa de calor (frecuencia de cada número).
   * @returns {Object<string, number>} Mapa { '0': count, '00': count, ... }
   */
  getHitMap() {
    const spins = this.getSpins();
    const hitMap = {};
    spins.forEach(s => {
      const num = (s && typeof s === 'object') ? String(s.number) : String(s);
      if (num !== 'undefined') hitMap[num] = (hitMap[num] || 0) + 1;
    });
    return hitMap;
  }

  /**
   * Obtener columna del historial en orden descendente de frecuencia.
   * @returns {Array<{num: string, hits: number}>}
   */
  getHitRanking() {
    const hitMap = this.getHitMap();
    return Object.entries(hitMap)
      .map(([num, hits]) => ({ num, hits }))
      .sort((a, b) => b.hits - a.hits);
  }

  // ─── Stats — delega a RouletteAnalytics ─────────────────────────────────────

  /**
   * Obtener estadísticas básicas de la sesión actual.
   * Delega a RouletteAnalytics (fuente única de verdad).
   * @returns {Object} Stats con total, colorsPct, parityPct, highLowPct, dozensPct, columnsPct
   */
  getStats() {
    return this._analytics?.getStats() ?? { total: this.getSpins().length };
  }

  /**
   * Obtener estadísticas avanzadas (chi-cuadrado, hot zone, medias de atraso).
   * Delega a RouletteAnalytics (fuente única de verdad).
   * @returns {Object} { chiSquare, chiDiagnosis, hotZone, meanDelays }
   */
  getAdvancedStats() {
    return this._analytics?.getAdvancedStats() ?? {};
  }

  // ─── Atrasos (Delay) — delega a DelayManager si fue inyectado ─────────

  /**
   * Obtener atraso de una docena.
   * @param {number} dozen
   * @returns {number|null}
   */
  getDozenDelay(dozen) {
    return this._delayManager?.getDozenDelay(dozen) ?? null;
  }

  /**
   * Obtener atraso máximo histórico de una docena.
   * @param {number} dozen
   * @returns {number|null}
   */
  getDozenMaxDelay(dozen) {
    return this._delayManager?.getDozenMaxDelay(dozen) ?? null;
  }

  /**
   * Obtener atraso de una columna.
   * @param {number} column
   * @returns {number|null}
   */
  getColumnDelay(column) {
    return this._delayManager?.getColumnDelay(column) ?? null;
  }

  /**
   * Obtener atraso máximo histórico de una columna.
   * @param {number} column
   * @returns {number|null}
   */
  getColumnMaxDelay(column) {
    return this._delayManager?.getColumnMaxDelay(column) ?? null;
  }

  /**
   * Obtener atraso de un número.
   * @param {string} numStr
   * @returns {number|null}
   */
  getNumberDelay(numStr) {
    return this._delayManager?.getNumberDelay(numStr) ?? null;
  }

  /**
   * Obtener atraso máximo histórico de un número.
   * @param {string} numStr
   * @returns {number|null}
   */
  getNumberMaxDelay(numStr) {
    return this._delayManager?.getNumberMaxDelay(numStr) ?? null;
  }

  /**
   * Invalidar caché de atrasos (llamado tras mutaciones de spins).
   */
  invalidateDelays() {
    this._delayManager?.invalidateCache();
  }

  /**
   * Limpiar sesión actual (borra giros, resetea sesión y persiste).
   * Equivalente a clearSession() del antiguo TrackerCompat.
   */
  clearSession() {
    this.clearSpins();
    this.resetSession();
    this.saveSpins();
    this.invalidateDelays();
  }
}
