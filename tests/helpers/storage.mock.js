/**
 * Mock de localStorage para entorno node (vitest environment: node).
 * Útil para pruebas de integración que involucran HistoryManager.
 */
export function mockLocalStorage() {
  const store = new Map();

  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => [...store.keys()][index] ?? null,
  };
}

export function restoreLocalStorage() {
  delete globalThis.localStorage;
}
