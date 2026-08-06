/**
 * SeededRandom — deterministic PRNG for reproducibility across benchmarks.
 *
 * Two algorithms:
 *   Mulberry32 — fast, 32-bit state, good for shuffles
 *   Xoshiro128** — 128-bit state, better statistical properties for experiments
 *
 * Every component uses the SAME SeededRandom instance per experiment run.
 * Never use Math.random() in benchmarks.
 */

/**
 * Mulberry32 — fast 32-bit PRNG.
 * Returns floats in [0, 1).
 */
export function mulberry32(seed) {
  let state = seed | 0;
  return {
    next() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Uniform integer in [min, max] (inclusive) */
    nextInt(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Fisher-Yates shuffle in-place */
    shuffle(arr) {
      const a = arr;
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    getState() { return state; },
    setState(s) { state = s | 0; },
  };
}

/**
 * Xoshiro128** — 128-bit state PRNG.
 * Returns floats in [0, 1).
 *
 * @param {number} seed — converts to 4 x 32-bit states
 */
export function xoshiro128ss(seed) {
  let s0 = splitmix32(seed | 0);
  let s1 = splitmix32(seed + 0x9e3779b9);
  let s2 = splitmix32(seed - 0x9e3779b9);
  let s3 = splitmix32(seed ^ 0x9e3779b9);

  return {
    next() {
      const result = (Math.imul(s1 * 5, s1 * 5) >>> 0) * 2.3283064365386963e-10;
      const t = s1 << 9;
      s2 ^= s0;
      s3 ^= s1;
      s1 ^= s2;
      s0 ^= s3;
      s2 ^= t;
      s3 = (s3 << 11) | (s3 >>> 21);
      return result;
    },
    nextInt(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    shuffle(arr) {
      const a = arr;
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    getState() { return { s0, s1, s2, s3 }; },
    setState(state) { s0 = state.s0; s1 = state.s1; s2 = state.s2; s3 = state.s3; },
  };
}

function splitmix32(h) {
  h = (h + 0x9e3779b9) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Factory: creates the SeededRandom engine chosen by `algorithm`.
 * @param {'mulberry32'|'xoshiro128**'} algorithm
 * @param {number} seed
 * @returns {{next:Function, nextInt:Function, shuffle:Function, getState:Function, setState:Function}}
 */
export function createSeededRandom(algorithm = 'xoshiro128**', seed = 42) {
  if (algorithm === 'mulberry32') return mulberry32(seed);
  if (algorithm === 'xoshiro128**') return xoshiro128ss(seed);
  throw new Error(`SeededRandom: unknown algorithm "${algorithm}".`);
}
