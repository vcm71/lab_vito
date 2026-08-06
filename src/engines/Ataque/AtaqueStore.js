export class AtaqueStore {
  constructor() { this._state = {}; }
  getState() { return { ...this._state }; }
  setState(patch) { Object.assign(this._state, patch); }
  reset() { this._state = {}; }
}
