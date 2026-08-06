/**
 * SessionManager — gestión del ciclo de vida de una sesión.
 * Único responsable del estado de sesión.
 * Opera sobre TrackerState.session como fuente única de verdad.
 *
 * Fase4.2 — migración completa de responsabilidad de sesiones.
 */
import { TrackerState } from './TrackerState.js';

export class SessionManager {
  /**
   * @param {TrackerState} state
   */
  constructor(state) {
    /** @type {TrackerState} */
    this._state = state;
  }

  /**
   * Iniciar una nueva sesión.
   * Marca la sesión como activa y registra la fecha de inicio.
   * Si ya hay una sesión activa, la reinicia.
   */
  start() {
    this._state.session.active = true;
    this._state.session.startedAt = new Date().toISOString();
    this._state.session.endedAt = null;
    this._state.session.spinCount = 0;
  }

  /**
   * Reiniciar la sesión actual.
   * Resetea todo el estado de sesión a valores por defecto.
   */
  reset() {
    this._state.session.active = false;
    this._state.session.startedAt = null;
    this._state.session.endedAt = null;
    this._state.session.spinCount = 0;
  }

  /**
   * Detener la sesión activa.
   * Marca como inactiva y registra el momento de cierre.
   */
  stop() {
    this._state.session.active = false;
    this._state.session.endedAt = new Date().toISOString();
  }

  /**
   * Verificar si hay una sesión activa.
   * @returns {boolean}
   */
  isActive() {
    return this._state.session.active === true;
  }

  /**
   * Obtener el objeto de sesión actual.
   * @returns {{active: boolean, startedAt: string|null, endedAt: string|null, spinCount: number}}
   */
  getSession() {
    return this._state.session;
  }

  /**
   * Incrementar el contador de giros de la sesión actual.
   */
  incrementSpinCount() {
    this._state.session.spinCount += 1;
  }

  /**
   * Obtener la cantidad de giros de la sesión actual.
   * @returns {number}
   */
  getSpinCount() {
    return this._state.session.spinCount;
  }

  /**
   * Obtener el timestamp de inicio de la sesión.
   * @returns {string|null}
   */
  getStartedAt() {
    return this._state.session.startedAt;
  }

  /**
   * Preparado para emisión de eventos en fases futuras.
   * @param {import('../core/EventBus.js').EventBus} eventBus
   */
  setEventBus(eventBus) {
    // Fase futura: session:started, session:reset, session:ended
  }
}
