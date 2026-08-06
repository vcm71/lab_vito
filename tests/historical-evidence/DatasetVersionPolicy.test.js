/**
 * DatasetVersionPolicy tests (Fase 2.3.4.1).
 *
 * Covers: identical versions, backward compatibility (newer consumer,
 * older artifact), forward compatibility (older consumer, newer artifact),
 * incompatibility (major bump), directional non-symmetry, typed errors on
 * invalid inputs and the guard assertDatasetVersionCompatible.
 */

import { describe, it, expect } from 'vitest';
import {
  createDatasetVersion,
  getDatasetVersionCompatibility,
  assertDatasetVersionCompatible,
  VERSION_COMPATIBILITY,
  InvalidDatasetVersionError,
  IncompatibleDatasetVersionError,
} from '../../src/historical-evidence/index.js';

const v = (major, minor, patch) => createDatasetVersion(major, minor, patch);

describe('DatasetVersionPolicy — classification', () => {
  it('reports IDENTICAL for the same version', () => {
    expect(getDatasetVersionCompatibility(v(1, 2, 3), v(1, 2, 3))).toBe(VERSION_COMPATIBILITY.IDENTICAL);
    expect(getDatasetVersionCompatibility(v(1, 0, 0), v(1, 0, 0))).toBe(VERSION_COMPATIBILITY.IDENTICAL);
  });

  it('reports BACKWARD_COMPATIBLE when the newer consumer reads an older artifact (same major)', () => {
    expect(getDatasetVersionCompatibility(v(1, 2, 0), v(1, 0, 0))).toBe(VERSION_COMPATIBILITY.BACKWARD_COMPATIBLE);
    expect(getDatasetVersionCompatibility(v(1, 0, 1), v(1, 0, 0))).toBe(VERSION_COMPATIBILITY.BACKWARD_COMPATIBLE);
  });

  it('reports FORWARD_COMPATIBLE when the older consumer reads a newer artifact (same major)', () => {
    expect(getDatasetVersionCompatibility(v(1, 0, 0), v(1, 2, 0))).toBe(VERSION_COMPATIBILITY.FORWARD_COMPATIBLE);
    expect(getDatasetVersionCompatibility(v(1, 0, 0), v(1, 0, 1))).toBe(VERSION_COMPATIBILITY.FORWARD_COMPATIBLE);
  });

  it('reports INCOMPATIBLE when major versions differ', () => {
    expect(getDatasetVersionCompatibility(v(2, 0, 0), v(1, 0, 0))).toBe(VERSION_COMPATIBILITY.INCOMPATIBLE);
    expect(getDatasetVersionCompatibility(v(1, 0, 0), v(2, 0, 0))).toBe(VERSION_COMPATIBILITY.INCOMPATIBLE);
  });

  it('is directional (not symmetric) for minor/patch bumps', () => {
    const current = v(1, 5, 0);
    const other = v(1, 3, 0);
    expect(getDatasetVersionCompatibility(current, other)).toBe(VERSION_COMPATIBILITY.BACKWARD_COMPATIBLE);
    expect(getDatasetVersionCompatibility(other, current)).toBe(VERSION_COMPATIBILITY.FORWARD_COMPATIBLE);
  });

  it('is symmetric only for IDENTICAL and INCOMPATIBLE', () => {
    expect(getDatasetVersionCompatibility(v(1, 0, 0), v(1, 0, 0))).toBe(
      getDatasetVersionCompatibility(v(1, 0, 0), v(1, 0, 0)),
    );
    expect(getDatasetVersionCompatibility(v(3, 0, 0), v(2, 9, 9))).toBe(VERSION_COMPATIBILITY.INCOMPATIBLE);
    expect(getDatasetVersionCompatibility(v(2, 9, 9), v(3, 0, 0))).toBe(VERSION_COMPATIBILITY.INCOMPATIBLE);
  });

  it('never performs migration or reinterpretation — pure classification', () => {
    const current = v(1, 1, 0);
    const other = v(1, 0, 0);
    const before = JSON.stringify(current);
    const verdict = getDatasetVersionCompatibility(current, other);
    expect(verdict).toBe(VERSION_COMPATIBILITY.BACKWARD_COMPATIBLE);
    expect(JSON.stringify(current)).toBe(before);
    expect(JSON.stringify(other)).toBe('{"major":1,"minor":0,"patch":0}');
  });
});

describe('DatasetVersionPolicy — invalid inputs', () => {
  it('throws InvalidDatasetVersionError when either input is invalid', () => {
    expect(() => getDatasetVersionCompatibility(null, v(1, 0, 0))).toThrow(InvalidDatasetVersionError);
    expect(() => getDatasetVersionCompatibility(v(1, 0, 0), undefined)).toThrow(InvalidDatasetVersionError);
    expect(() => getDatasetVersionCompatibility('1.0.0', v(1, 0, 0))).toThrow(InvalidDatasetVersionError);
    expect(() => getDatasetVersionCompatibility(v(1, 0, 0), { major: 1, minor: 0 })).toThrow(InvalidDatasetVersionError);
    expect(() => getDatasetVersionCompatibility({}, {})).toThrow(InvalidDatasetVersionError);
  });
});

describe('DatasetVersionPolicy — assertDatasetVersionCompatible guard', () => {
  it('returns the verdict when compatible', () => {
    expect(assertDatasetVersionCompatible(v(1, 1, 0), v(1, 0, 0))).toBe(VERSION_COMPATIBILITY.BACKWARD_COMPATIBLE);
    expect(assertDatasetVersionCompatible(v(1, 0, 0), v(1, 1, 0))).toBe(VERSION_COMPATIBILITY.FORWARD_COMPATIBLE);
    expect(assertDatasetVersionCompatible(v(1, 0, 0), v(1, 0, 0))).toBe(VERSION_COMPATIBILITY.IDENTICAL);
  });

  it('throws IncompatibleDatasetVersionError with typed context on major mismatch', () => {
    let error;
    try {
      assertDatasetVersionCompatible(v(2, 0, 0), v(1, 0, 0));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(IncompatibleDatasetVersionError);
    expect(error.code).toBe('INCOMPATIBLE_DATASET_VERSION');
    expect(error.current).toBe('2.0.0');
    expect(error.other).toBe('1.0.0');
  });

  it('throws InvalidDatasetVersionError on invalid inputs', () => {
    expect(() => assertDatasetVersionCompatible(null, v(1, 0, 0))).toThrow(InvalidDatasetVersionError);
  });
});
