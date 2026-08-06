/**
 * Deep freeze utility — safe, recursive immutability.
 *
 * Handles plain objects and arrays recursively. Rejects non-JSON-safe
 * types (functions, symbols, BigInt, Map, Set, Date, class instances,
 * cyclical refs, dangerous prototype keys).
 *
 * Rules:
 * - Plain objects / arrays → deep-frozen recursively
 * - null / string / number / boolean → pass-through
 * - Everything else → rejected
 * - Cyclical references → rejected (Set-based cycle detection)
 * - `__proto__`, `constructor`, `prototype` keys → rejected
 */

/* ── Sentinel for optional per-call cycle detection ──────────────────── */

const SEEN = Symbol('DEEP_FREEZE_SEEN');

/**
 * Deep-freeze a value. Idempotent on already-frozen values.
 *
 * @param {*} value — value to freeze (must be JSON-safe)
 * @param {Set<object>} [seen] — internal cycle tracker
 * @returns {*} the same value, deep-frozen
 * @throws {TypeError} on non-safe types, cyclical refs, or dangerous keys
 */
export function deepFreeze(value, seen = new Set()) {
  // Reject unsafe scalar types before the early return
  if (typeof value === 'function') {
    throw new TypeError('Functions are not allowed in evidence metadata.');
  }
  if (typeof value === 'bigint') {
    throw new TypeError('BigInt is not allowed in evidence metadata.');
  }
  if (typeof value === 'symbol') {
    throw new TypeError('Symbols are not allowed in evidence metadata.');
  }

  // Primitive pass-through
  if (value === null || typeof value !== 'object') return value;

  // Already frozen this object in this call stack → cycle
  if (seen.has(value)) {
    throw new TypeError('Cannot deep-freeze — cyclical reference detected.');
  }

  // Reject non-safe types before freezing
  if (Array.isArray(value)) {
    validatePlain(value, seen);
    seen.add(value);
    for (const item of value) deepFreeze(item, seen);
    return Object.freeze(value);
  }

  // Reject Map, Set, Date, and class instances BEFORE the prototype check
  // so error messages are specific
  if (value instanceof Map || value instanceof Set || value instanceof Date) {
    throw new TypeError('Map, Set, and Date are not allowed in evidence metadata.');
  }

  // Must be a plain object (prototype === Object.prototype, or null)
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError('Only plain objects are allowed in evidence records.');
  }

  // Reject symbol keys (not enumerable via Object.keys)
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new TypeError('Symbols are not allowed in evidence metadata.');
  }

  validatePlain(value, seen);
  seen.add(value);

  for (const key of Object.keys(value)) {
    validateSafeKey(key);
    deepFreeze(value[key], seen);
  }

  return Object.freeze(value);
}

/* ── Internal validators ─────────────────────────────────────────────── */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function validateSafeKey(key) {
  if (DANGEROUS_KEYS.has(key)) {
    throw new TypeError(`Dangerous key "${key}" rejected in evidence metadata.`);
  }
}

const SAFE_TYPES = new Set(['string', 'number', 'boolean', 'object', 'undefined']);

function validatePlain(value, seen) {
  // defer — the actual type check is done at the deepFreeze entry
  // but here we reject symbols, functions, BigInt, Map, Set, Date
  // which are caught by the top-level typeof + proto checks
  if (typeof value === 'function') {
    throw new TypeError('Functions are not allowed in evidence metadata.');
  }
  if (typeof value === 'bigint') {
    throw new TypeError('BigInt is not allowed in evidence metadata.');
  }
  if (typeof value === 'symbol') {
    throw new TypeError('Symbols are not allowed in evidence metadata.');
  }
  if (value instanceof Map || value instanceof Set || value instanceof Date) {
    throw new TypeError('Map, Set, and Date are not allowed in evidence metadata.');
  }
}
