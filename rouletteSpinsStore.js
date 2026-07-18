const DB_NAME = 'orion_roulette_spins';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'spins';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSpinEntry(item, index) {
  if (!item) return null;

  if (Array.isArray(item)) {
    return {
      id: index + 1,
      number: String(item[0] ?? ''),
      timestamp: new Date(item[1] ?? Date.now()).toISOString(),
      dealer: item[2] || '',
      casino: item[3] || '',
      table: item[4] || '',
    };
  }

  if (typeof item === 'object') {
    return {
      id: index + 1,
      number: String(item.number ?? ''),
      timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
      dealer: item.dealer || '',
      casino: item.casino || '',
      table: item.table || '',
    };
  }

  return null;
}

function normalizeSpinList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeSpinEntry(item, index))
    .filter(Boolean)
    .filter((spin) => spin.number !== '');
}

export class RouletteSpinsStore {
  constructor() {
    this._dbPromise = null;
    this._cache = null;
  }

  getSnapshot() {
    if (this._cache) return clone(this._cache);
    return [];
  }

  async load() {
    if (this._cache) return clone(this._cache);

    const indexed = await this._readIndexedDb();
    const next = normalizeSpinList(indexed || []);

    this._cache = next;
    return clone(next);
  }

  async setSpins(spins) {
    const next = normalizeSpinList(spins);
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

      request.onsuccess = () => {
        const result = request.result;
        resolve(normalizeSpinList(result?.spins || result || []));
      };
      request.onerror = () => resolve(null);
    });
  }

  async _write(spins) {
    const db = await this._openDb();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ spins: clone(spins) }, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }

}

export const rouletteSpinsStore = new RouletteSpinsStore();
