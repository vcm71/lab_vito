/**
 * Tests: SeededRandom — deterministic PRNG.
 */
import { describe, it, expect } from 'vitest';
import { createSeededRandom, mulberry32, xoshiro128ss } from '../../src/calibration/SeededRandom.js';

describe('SeededRandom', () => {
  describe('createSeededRandom', () => {
    it('creates xoshiro128** by default', () => {
      const rng = createSeededRandom();
      expect(rng).toHaveProperty('next');
      expect(rng).toHaveProperty('shuffle');
      expect(rng.next()).toBeGreaterThanOrEqual(0);
      expect(rng.next()).toBeLessThan(1);
    });

    it('creates mulberry32 when specified', () => {
      const rng = createSeededRandom('mulberry32', 99);
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });

    it('throws on unknown algorithm', () => {
      expect(() => createSeededRandom('unknown')).toThrow('unknown algorithm');
    });
  });

  describe('determinism', () => {
    it('xoshiro128** — same seed => same sequence', () => {
      const a = createSeededRandom('xoshiro128**', 42);
      const b = createSeededRandom('xoshiro128**', 42);
      for (let i = 0; i < 10; i++) {
        expect(a.next()).toBe(b.next());
      }
    });

    it('mulberry32 — same seed => same sequence', () => {
      const a = createSeededRandom('mulberry32', 42);
      const b = createSeededRandom('mulberry32', 42);
      for (let i = 0; i < 10; i++) {
        expect(a.next()).toBe(b.next());
      }
    });

    it('different seeds => different sequences', () => {
      const a = createSeededRandom('mulberry32', 42);
      const b = createSeededRandom('mulberry32', 99);
      const seqA = Array.from({ length: 5 }, () => a.next());
      const seqB = Array.from({ length: 5 }, () => b.next());
      expect(seqA).not.toEqual(seqB);
    });
  });

  describe('nextInt', () => {
    it('returns values within [min, max]', () => {
      const rng = createSeededRandom('mulberry32', 1);
      for (let i = 0; i < 100; i++) {
        const v = rng.nextInt(5, 10);
        expect(v).toBeGreaterThanOrEqual(5);
        expect(v).toBeLessThanOrEqual(10);
        expect(Number.isInteger(v)).toBe(true);
      }
    });
  });

  describe('shuffle', () => {
    it('returns all elements (Fisher-Yates)', () => {
      const rng = createSeededRandom('mulberry32', 42);
      const arr = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...arr]);
      expect(shuffled.sort((a, b) => a - b)).toEqual(arr);
    });

    it('is deterministic with same seed', () => {
      const a = createSeededRandom('mulberry32', 42);
      const b = createSeededRandom('mulberry32', 42);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(a.shuffle([...arr])).toEqual(b.shuffle([...arr]));
    });
  });

  describe('getState / setState', () => {
    it('allows serialization and restoration of mulberry32', () => {
      const rng = createSeededRandom('mulberry32', 42);
      for (let i = 0; i < 5; i++) rng.next();
      const state = rng.getState();
      const seq1 = [];
      for (let i = 0; i < 5; i++) seq1.push(rng.next());

      // Restore
      rng.setState(state);
      const seq2 = [];
      for (let i = 0; i < 5; i++) seq2.push(rng.next());
      expect(seq1).toEqual(seq2);
    });
  });

  describe('standalone mulberry32', () => {
    it('creates standalone engine', () => {
      const rng = mulberry32(42);
      expect(rng.next()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('standalone xoshiro128**', () => {
    it('creates standalone engine', () => {
      const rng = xoshiro128ss(42);
      expect(rng.next()).toBeGreaterThanOrEqual(0);
    });
  });
});
