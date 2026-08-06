export class KellyStore {
  constructor() {
    this._state = { lastAnalysis: null, activeRecommendations: [] };
  }
  getState() { return { ...this._state }; }
  setState(patch) { Object.assign(this._state, patch); }
  reset() { this._state = { lastAnalysis: null, activeRecommendations: [] }; }
}
