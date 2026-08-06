/**
 * Sesgo97Store — almacén de estado del motor Sesgo97.
 * Implementación mínima. El estado real se mantiene en el tracker.
 */
export class Sesgo97Store {
  constructor() {
    this._state = {
      lastCalculation: null,
      lastDualSesgo: null,
      lastAudit: null
    };
  }

  getState() {
    return { ...this._state };
  }

  setState(patch) {
    Object.assign(this._state, patch);
  }

  reset() {
    this._state = { lastCalculation: null, lastDualSesgo: null, lastAudit: null };
  }
}
