/**
 * Perform a deep clone of a consensus signal structure.
 *
 * The implementation uses structuredClone when available and falls back to a
 * safe recursive copy for plain objects and arrays.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function fallbackClone(value) {
  if (Array.isArray(value)) {
    return value.map(item => fallbackClone(item));
  }

  if (value && typeof value === 'object') {
    const clone = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      clone[key] = fallbackClone(nestedValue);
    }
    return clone;
  }

  return value;
}

export function cloneConsensusSignal(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return fallbackClone(value);
}
