/**
 * SettingsManager — configuración del dominio Roulette Tracker.
 * Único responsable de la persistencia y mutación de TrackerState.settings.
 *
 * Usa rouletteSettingsStore para persistencia IndexedDB
 * (manteniendo compatibilidad total con el formato existente).
 *
 * Fase4.3 — implementación completa.
 */
import { rouletteSettingsStore, createDefaultRouletteSettings } from '../../rouletteSettingsStore.js';

export class SettingsManager {
  /**
   * @param {import('./TrackerState.js').TrackerState} state
   */
  constructor(state) {
    /** @type {import('./TrackerState.js').TrackerState} */
    this._state = state;
  }

  /**
   * Cargar configuración desde IndexedDB.
   * Si no existe, inicia con valores por defecto.
   * @returns {Promise<object>}
   */
  async load() {
    const { settings } = await rouletteSettingsStore.load();
    this._state.settings = settings;
    return settings;
  }

  /**
   * Recargar configuración desde IndexedDB (refrescar).
   * @returns {Promise<object>}
   */
  async refresh() {
    const { settings } = await rouletteSettingsStore.refresh();
    this._state.settings = settings;
    return settings;
  }

  /**
   * Persistir la configuración actual en IndexedDB.
   * @returns {Promise<void>}
   */
  async save() {
    const snapshot = JSON.parse(JSON.stringify(this._state.settings));
    await rouletteSettingsStore.setSettings(snapshot);
  }

  /**
   * Obtener la configuración actual.
   * @returns {object}
   */
  get() {
    return this._state.settings;
  }

  /**
   * Establecer un valor individual y persistir.
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    this._state.settings[key] = value;
    await this.save();
  }

  /**
   * Actualizar parcialmente la configuración y persistir.
   * @param {object} partial
   * @returns {Promise<void>}
   */
  async update(partial) {
    Object.assign(this._state.settings, partial);
    await this.save();
  }

  /**
   * Fusionar objeto profundamente con la configuración actual.
   * Útil para mergear módulos anidados como moduleThresholds.
   * @param {object} obj
   * @returns {Promise<void>}
   */
  async merge(obj) {
    const merged = JSON.parse(JSON.stringify(this._state.settings));
    Object.assign(merged, obj);
    this._state.settings = merged;
    await this.save();
  }

  /**
   * Restablecer a valores por defecto y persistir.
   * @returns {Promise<void>}
   */
  async reset() {
    this._state.settings = createDefaultRouletteSettings();
    await this.save();
  }

  /**
   * Obtener la configuración por defecto (sin modificar la actual).
   * @returns {object}
   */
  getDefault() {
    return createDefaultRouletteSettings();
  }
}
