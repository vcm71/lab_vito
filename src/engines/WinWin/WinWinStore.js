/**
 * WinWinStore — almacén de estado del motor WinWin.
 * Implementación mínima. El estado real se mantiene en el tracker y historicalMaxes.
 */
export class WinWinStore {
  constructor() {
    this._state = {
      lastCalculation: null,
      activeThreshold: 20
    };
  }

  getState() {
    return { ...this._state };
  }

  setState(patch) {
    Object.assign(this._state, patch);
  }

  reset() {
    this._state = { lastCalculation: null, activeThreshold: 20 };
  }
}
