/**
 * HistoryManager — administración del historial de sesiones completadas.
 *
 * Responsabilidades:
 * - Persistir/recuperar el array de sesiones finalizadas en localStorage
 * - Agregar, eliminar y consultar sesiones completadas en TrackerState.history
 *
 * Fase4.4 — implementación completa.
 */

const STORAGE_KEY = 'orion_roulette_history';

export class HistoryManager {
  /**
   * @param {import('./TrackerState.js').TrackerState} state
   */
  constructor(state) {
    /** @type {import('./TrackerState.js').TrackerState} */
    this._state = state;
  }

  /**
   * Cargar el historial desde localStorage.
   * @returns {Array}
   */
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._state.history = raw ? JSON.parse(raw) : [];
    } catch {
      this._state.history = [];
    }
    return this._state.history;
  }

  /**
   * Persistir el historial actual en localStorage.
   */
  async save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state.history));
    } catch (e) {
      console.warn('[HistoryManager] No se pudo persistir el historial:', e);
    }
  }

  /**
   * Agregar un registro de sesión completada al historial.
   * No persiste automáticamente — llamar a save() después.
   * @param {object} sessionRecord
   */
  addSession(sessionRecord) {
    this._state.history.push(sessionRecord);
  }

  /**
   * Eliminar una sesión del historial por índice.
   * @param {number} index
   */
  removeSession(index) {
    if (index >= 0 && index < this._state.history.length) {
      this._state.history.splice(index, 1);
    }
  }

  /**
   * Vaciar todo el historial.
   */
  clear() {
    this._state.history = [];
  }

  /**
   * Obtener el array completo del historial (referencia directa).
   * @returns {Array}
   */
  getHistory() {
    return this._state.history;
  }

  /**
   * Obtener la última sesión completada.
   * @returns {object|null}
   */
  getLastSession() {
    if (this._state.history.length === 0) return null;
    return this._state.history[this._state.history.length - 1];
  }

  /**
   * Cantidad de sesiones completadas en el historial.
   * @returns {number}
   */
  count() {
    return this._state.history.length;
  }
}
