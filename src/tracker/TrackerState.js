/**
 * TrackerState — estado único del dominio Roulette Tracker.
 * Contiene únicamente la estructura de datos.
 * Sin lógica de negocio.
 *
 * Fase4.2 — session migrado de null a objeto estructurado.
 */
export class TrackerState {
  constructor() {
    /** @type {{active: boolean, startedAt: string|null, endedAt: string|null, spinCount: number}} */
    this.session = {
      active: false,
      startedAt: null,
      endedAt: null,
      spinCount: 0
    };
    /** @type {Array} */
    this.spins = [];
    /** @type {Array} */
    this.history = [];
    /** @type {object} */
    this.settings = {};
  }
}
