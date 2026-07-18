const DB_NAME = 'orion_winwin_maxes';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'historical-maxes';

const DEFAULT_STATE = {
  externals: {},
  dozens: {},
  seisenas: {},
  series: {},
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    externals: { ...(source.externals || {}) },
    dozens: { ...(source.dozens || {}) },
    seisenas: { ...(source.seisenas || {}) },
    series: { ...(source.series || {}) },
  };
}

export class WinWinHistoricalMaxesStore {
  constructor() {
    this._dbPromise = null;
    this._cache = null;
  }

  getSnapshot() {
    if (this._cache) return clone(this._cache);
    return clone(DEFAULT_STATE);
  }

  async load() {
    if (this._cache) return { maxes: clone(this._cache), source: 'cache' };

    const indexed = await this._readIndexedDb();
    const next = normalizeState(indexed || DEFAULT_STATE);

    this._cache = next;
    return { maxes: clone(next), source: indexed ? 'indexed' : 'empty' };
  }

  async setMaxes(maxes) {
    const next = normalizeState(maxes);
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

  async _write(maxes) {
    const db = await this._openDb();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(clone(maxes), RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }

}

export const winwinHistoricalMaxesStore = new WinWinHistoricalMaxesStore();
