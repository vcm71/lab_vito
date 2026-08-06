/**
 * DAStore — almacén de estado del motor DA.
 * Implementación mínima. El estado real se mantiene en el tracker.
 */
export class DAStore {
  constructor() {
    this._state = {
      lastCalculation: null,
      activeGroups: []
    };
  }

  getState() {
    return { ...this._state };
  }

  setState(patch) {
    Object.assign(this._state, patch);
  }

  reset() {
    this._state = { lastCalculation: null, activeGroups: [] };
  }
}
