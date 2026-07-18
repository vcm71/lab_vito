const DB_NAME = 'orion_kelly_settings';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'kelly';

const DEFAULT_STATE = {
  bankroll: 100,
  fraction: 0.25,
  stopLossPct: 0.20,
  takeProfitPct: 0.30,
  minConfidence: 0.30,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    bankroll: source.bankroll ?? DEFAULT_STATE.bankroll,
    fraction: source.fraction ?? DEFAULT_STATE.fraction,
    stopLossPct: source.stopLossPct ?? DEFAULT_STATE.stopLossPct,
    takeProfitPct: source.takeProfitPct ?? DEFAULT_STATE.takeProfitPct,
    minConfidence: source.minConfidence ?? DEFAULT_STATE.minConfidence,
  };
}

export class KellySettingsStore {
  constructor() {
    this._dbPromise = null;
    this._cache = null;
  }

  getSnapshot() {
    if (this._cache) return clone(this._cache);
    return clone(DEFAULT_STATE);
  }

  async load() {
    if (this._cache) return { settings: clone(this._cache), source: 'cache' };

    const indexed = await this._readIndexedDb();
    const next = normalizeState(indexed || DEFAULT_STATE);

    this._cache = next;
    return { settings: clone(next), source: indexed ? 'indexed' : 'empty' };
  }

  async setSettings(settings) {
    const next = normalizeState(settings);
    this._cache = next;
    await this._write(next);
    return clone(next);
  }

  _openDb() {
    if (this._dbPromise) return this._dbPromise;
    if (typeof indexedDB === 'undefined') {
      this._dbPromise = Promise.resolve(null);
      return this._dbPromise;
    }

    this._dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(() => null);

    return this._dbPromise;
  }

  async _readIndexedDb() {
    const db = await this._openDb();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(RECORD_KEY);

      request.onsuccess = () => resolve(normalizeState(request.result || null));
      request.onerror = () => resolve(null);
    });
  }

  async _write(settings) {
    const db = await this._openDb();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(clone(settings), RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }

}

export const kellySettingsStore = new KellySettingsStore();
