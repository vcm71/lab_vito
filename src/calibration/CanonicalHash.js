/**
 * CanonicalHash — SHA-256 canonical hashing for calibration integrity.
 *
 * Replaces the legacy djb2 hash in CalibrationModel (non-collision-resistant).
 * Uses Node.js crypto (calibration runs in Node, not browser).
 *
 * API:
 *   - canonicalHash(obj) → Promise<string>   64 hex chars (sha256)
 *   - canonicalHashSync(obj) → string         synchronous, Node.js only
 *   - canonicalSerialize(obj) → string        deterministic JSON (sorted keys)
 */

import { createHash } from 'node:crypto';

class CanonicalHashError extends TypeError {
  constructor(code, message) {
    super(message);
    this.name = 'CanonicalHashError';
    this.code = code;
  }
}

export class UnsupportedCanonicalTypeError extends CanonicalHashError {
  constructor(path, value) {
    super(
      'UNSUPPORTED_CANONICAL_TYPE',
      `${path}: unsupported canonical value type ${typeof value} (${String(value)}).`,
    );
    this.name = 'UnsupportedCanonicalTypeError';
    this.path = path;
    this.value = value;
  }
}

export class InvalidCanonicalNumberError extends CanonicalHashError {
  constructor(path, value) {
    super(
      'INVALID_CANONICAL_NUMBER',
      `${path}: expected a finite JSON number, received ${String(value)}.`,
    );
    this.name = 'InvalidCanonicalNumberError';
    this.path = path;
    this.value = value;
  }
}

export class CircularCanonicalReferenceError extends CanonicalHashError {
  constructor(path) {
    super('CIRCULAR_CANONICAL_REFERENCE', `${path}: circular reference detected.`);
    this.name = 'CircularCanonicalReferenceError';
    this.path = path;
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function serializePrimitive(value, path) {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) {
        throw new InvalidCanonicalNumberError(path, value);
      }
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'bigint':
    case 'undefined':
    case 'function':
    case 'symbol':
      throw new UnsupportedCanonicalTypeError(path, value);
    default:
      throw new UnsupportedCanonicalTypeError(path, value);
  }
}

function serialize(value, path, seen) {
  if (value === null) return 'null';

  const type = typeof value;
  if (type !== 'object') {
    return serializePrimitive(value, path);
  }

  if (seen.has(value)) {
    throw new CircularCanonicalReferenceError(path);
  }

  if (Array.isArray(value)) {
    seen.add(value);
    try {
      const parts = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index)) {
          throw new UnsupportedCanonicalTypeError(`${path}[${index}]`, undefined);
        }
        parts.push(serialize(value[index], `${path}[${index}]`, seen));
      }
      return `[${parts.join(',')}]`;
    } finally {
      seen.delete(value);
    }
  }

  if (!isPlainObject(value)) {
    throw new UnsupportedCanonicalTypeError(path, value);
  }

  seen.add(value);
  try {
    const keys = Object.keys(value).sort();
    const pairs = [];
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        continue;
      }
      const child = value[key];
      if (child === undefined) {
        throw new UnsupportedCanonicalTypeError(childPath, child);
      }
      pairs.push(`${JSON.stringify(key)}:${serialize(child, childPath, seen)}`);
    }
    return `{${pairs.join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

export function canonicalSerialize(obj) {
  return serialize(obj, '$', new WeakSet());
}

export function canonicalHashSync(obj) {
  const serialized = canonicalSerialize(obj);
  return createHash('sha256').update(serialized, 'utf8').digest('hex');
}

export async function canonicalHash(obj) {
  return canonicalHashSync(obj);
}
