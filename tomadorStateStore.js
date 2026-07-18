const DB_NAME = 'orion_tomador_state';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'tomador';

const DEFAULT_STATE = {
  activeTab: 'tab-tomador',
  mode: 'grid',
  session: {
    casinoName: '',
    crupierName: '',
    tableName: '',
  },
  keypadPanel: null,
  historyPanel: null,
  sessionPanel: null,
  seriesPanel: null,
  panoScale: 42,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeState(base, patch) {
  const next = clone(base);

  if (patch.mode === 'grid' || patch.mode === 'wheel') {
    next.mode = patch.mode;
  }

  if (typeof patch.activeTab === 'string' && patch.activeTab) {
    next.activeTab = patch.activeTab;
  }

  if (patch.session) {
    next.session = {
      ...next.session,
      ...patch.session,
    };
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'historyPanel')) {
    next.historyPanel = patch.historyPanel ? { ...patch.historyPanel } : null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'sessionPanel')) {
    next.sessionPanel = patch.sessionPanel ? { ...patch.sessionPanel } : null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'seriesPanel')) {
    next.seriesPanel = patch.seriesPanel ? { ...patch.seriesPanel } : null;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'keypadPanel')) {
    next.keypadPanel = patch.keypadPanel ? { ...patch.keypadPanel } : null;
  }

  if (typeof patch.panoScale === 'number' && patch.panoScale >= 25 && patch.panoScale <= 80) {
    next.panoScale = patch.panoScale;
  }

  return next;
}

export class TomadorStateStore {
  constructor() {
    this._dbPromise = null;
    this._cache = null;
  }

  getSnapshot() {
    if (this._cache) return clone(this._cache);
    return clone(DEFAULT_STATE);
  }

  async load() {
    if (this._cache) return clone(this._cache);

    const indexed = await this._readIndexedDb();
    const next = mergeState(DEFAULT_STATE, indexed || {});

    this._cache = next;
    return clone(next);
  }

  async update(patch) {
    const current = await this.load();
    const next = mergeState(current, patch);
    this._cache = next;
    await this._write(next);
    return clone(next);
  }

  async setMode(mode) {
    return this.update({ mode });
  }

  async setActiveTab(activeTab) {
    return this.update({ activeTab });
  }

  async setSession(session) {
    return this.update({ session });
  }

  async setHistoryPanel(historyPanel) {
    return this.update({ historyPanel });
  }

  async setSessionPanel(sessionPanel) {
    return this.update({ sessionPanel });
  }

  async setSeriesPanel(seriesPanel) {
    return this.update({ seriesPanel });
  }

  async setKeypadPanel(keypadPanel) {
    return this.update({ keypadPanel });
  }

  async setPanoScale(panoScale) {
    return this.update({ panoScale });
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

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async _write(state) {
    const db = await this._openDb();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  }

}

export const tomadorStateStore = new TomadorStateStore();
