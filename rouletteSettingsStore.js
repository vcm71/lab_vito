const DB_NAME = 'orion_roulette_settings';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'settings';

export function createDefaultRouletteSettings() {
  return {
    colorAlert: 5,
    parityAlert: 5,
    highLowAlert: 5,
    dozenAlert: 7,
    columnAlert: 7,
    seriesAlert: 10,
    seisenaAlert: 7,
    seisenaCritical: 10,
    atrasosLimit: 5,
    atrasosCritical: 9,
    atrasosMaxWindow: 100,
    ataqueOrange: -2,
    ataqueRed: 0,
    confidenceColors: 95,
    confidenceParity: 95,
    confidenceRange: 95,
    confidenceColumns: 95,
    rangeExt: 100,
    rangeDoc: 100,
    rangeCHI: 100,
    rangeChi: 100,
    rangeLey: 37,
    rangeWW: 200,
    rangeAtr: 500,
    rangeSeis: 100,
    weaknessDistCount: 3,
    customSeries: [
      { name: 'S_1', numbers: ['1', '2', '7', '26', '27'], active: true },
      { name: 'S_12', numbers: ['11', '12', '17', '19', '34'], active: true },
      { name: 'S_15', numbers: ['14', '15', '16', '24', '28'], active: true },
      { name: 'S_32', numbers: ['5', '23', '31', '32', '33'], active: true },
      { name: 'S_61', numbers: ['21', '22', '25', '29', '35', '36'], active: true },
      { name: 'S_70', numbers: ['3', '4', '6', '8', '9', '13', '18'], active: true },
      { name: 'S_72', numbers: ['5', '23', '25', '31', '32', '33', '34'], active: true },
      { name: 'S_73', numbers: ['11', '12', '14', '15', '16', '17', '19'], active: true },
      { name: 'S_90', numbers: ['0', '10', '20', '30'], active: true },
      { name: 'S_91', numbers: ['3', '4', '6', '8', '9', '13', '18', '21', '22', '25', '29', '35', '36'], active: true },
    ],
    sheetUrl: '',
    sheetName: '',
    sheetColumn: '',
    casinoName: '',
    crupierName: '',
    tableName: '',
    visualMode: 'analisis',
    showZeroes: true,
    showClear: true,
    showDozenDelays: true,
    showColumnDelays: true,
    showHighlights: true,
    showColZero: true,
    showColColor: true,
    showColParity: true,
    showColRange: true,
    showColDozens: true,
    showColColumns: true,
    sesgo97SectorSize: 5,
    sesgo97TopSectorSize: 5,
    sesgo97TopRanking: 10,
    sesgo97StartRow: 1,
    sesgo97EndRow: 0,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSettings(input) {
  const defaults = createDefaultRouletteSettings();
  const source = input && typeof input === 'object' ? input : {};
  const next = { ...defaults, ...source };

  const chiRange = source.rangeCHI ?? source.rangeChi ?? defaults.rangeCHI;
  next.rangeCHI = chiRange;
  next.rangeChi = chiRange;

  if (!Array.isArray(next.customSeries) || next.customSeries.length === 0) {
    next.customSeries = defaults.customSeries;
  }

  return next;
}

export class RouletteSettingsStore {
  constructor() {
    this._dbPromise = null;
    this._cache = null;
  }

  getSnapshot() {
    if (this._cache) return clone(this._cache);
    return createDefaultRouletteSettings();
  }

  async load() {
    if (this._cache) return { settings: clone(this._cache), source: 'cache' };

    const indexed = await this._readIndexedDb();
    const next = normalizeSettings(indexed || {});

    this._cache = next;
    return { settings: clone(next), source: indexed ? 'indexed' : 'empty' };
  }

  async refresh() {
    const indexed = await this._readIndexedDb();
    const next = normalizeSettings(indexed || {});

    this._cache = next;
    return { settings: clone(next), source: indexed ? 'indexed' : 'empty' };
  }

  async setSettings(settings) {
    const next = normalizeSettings(settings);
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

      request.onsuccess = () => resolve(normalizeSettings(request.result || null));
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

export const rouletteSettingsStore = new RouletteSettingsStore();
