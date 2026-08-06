/**
 * CalibrationRepository — interface for storing/retrieving models.
 * IN-MEMORY ONLY. No persistence (future phase).
 */

export class CalibrationRepository {
  constructor() { this._store = new Map(); this._byHash = new Map(); }

  save(model) {
    if (!model || !model.hash) throw new TypeError('CalibrationRepository: model must have a hash.');
    this._store.set(model.id, model);
    this._byHash.set(model.hash, model);
  }

  getById(id) { return this._store.get(id) ?? null; }
  getByHash(hash) { return this._byHash.get(hash) ?? null; }
  list() { return [...this._store.values()]; }
  size() { return this._store.size; }

  remove(id) {
    const model = this._store.get(id);
    if (!model) return false;
    this._byHash.delete(model.hash);
    this._store.delete(id);
    return true;
  }

  clear() { this._store.clear(); this._byHash.clear(); }
}
