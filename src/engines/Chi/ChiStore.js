export class ChiStore {
  constructor() {
    this._state = { lastAnalysis: null, activeFilters: [] };
  }
  getState() { return { ...this._state }; }
  setState(patch) { Object.assign(this._state, patch); }
  reset() { this._state = { lastAnalysis: null, activeFilters: [] }; }
}
