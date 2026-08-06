export class OrionStore {
  constructor() {
    this._state = { lastAnalysis: null, regime: 'R1', bankroll: 200, opportunities: [] };
  }
  getState() { return { ...this._state }; }
  setState(patch) { Object.assign(this._state, patch); }
  reset() { this._state = { lastAnalysis: null, regime: 'R1', bankroll: 200, opportunities: [] }; }
}
