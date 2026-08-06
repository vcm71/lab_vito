import { describe, it, expect } from 'vitest';
import {
  canonicalHash,
  canonicalHashSync,
  canonicalSerialize,
  InvalidCanonicalNumberError,
  UnsupportedCanonicalTypeError,
  CircularCanonicalReferenceError,
} from '../../src/calibration/CanonicalHash.js';

describe('CanonicalHash', () => {
  describe('canonicalSerialize', () => {
    it('produces deterministic output for objects', () => {
      const a = canonicalSerialize({ b: 2, a: 1 });
      const b = canonicalSerialize({ a: 1, b: 2 });
      expect(a).toBe(b);
      expect(a).toBe('{"a":1,"b":2}');
    });

    it('handles nested objects and arrays', () => {
      const result = canonicalSerialize({ arr: [3, 1, 2], nested: { z: 9, a: 1 } });
      expect(result).toBe('{"arr":[3,1,2],"nested":{"a":1,"z":9}}');
    });

    it('handles null, booleans, strings', () => {
      expect(canonicalSerialize(null)).toBe('null');
      expect(canonicalSerialize(true)).toBe('true');
    });

    it('rejects NaN and Infinity explicitly', () => {
      expect(() => canonicalSerialize(NaN)).toThrow(InvalidCanonicalNumberError);
      expect(() => canonicalSerialize(Infinity)).toThrow(InvalidCanonicalNumberError);
      expect(() => canonicalSerialize(-Infinity)).toThrow(InvalidCanonicalNumberError);
    });

    it('rejects unsupported values and circular references', () => {
      expect(() => canonicalSerialize(undefined)).toThrow(UnsupportedCanonicalTypeError);
      expect(() => canonicalSerialize(() => {})).toThrow(UnsupportedCanonicalTypeError);
      expect(() => canonicalSerialize(Symbol('x'))).toThrow(UnsupportedCanonicalTypeError);
      const cyclic = { a: 1 };
      cyclic.self = cyclic;
      expect(() => canonicalSerialize(cyclic)).toThrow(CircularCanonicalReferenceError);
    });
  });

  describe('canonicalHashSync', () => {
    it('produces consistent hashes for identical objects', () => {
      const h1 = canonicalHashSync({ a: 1, b: 2 });
      const h2 = canonicalHashSync({ b: 2, a: 1 });
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('produces different hashes for different objects', () => {
      const h1 = canonicalHashSync({ a: 1 });
      const h2 = canonicalHashSync({ a: 2 });
      expect(h1).not.toBe(h2);
    });
  });

  describe('canonicalHash (async)', () => {
    it('produces consistent hashes', async () => {
      const h1 = await canonicalHash({ a: 1, b: 2 });
      const h2 = await canonicalHash({ b: 2, a: 1 });
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
