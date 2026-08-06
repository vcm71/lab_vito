/**
 * DatasetVersion tests (Fase 2.3.4.1).
 *
 * Covers: valid creation, 0.0.0, negative/float/string/NaN/Infinity/null/
 * undefined/missing fields, equality, inequality, comparison, parse
 * (valid and invalid), serialisation, canonical representation, deep
 * immutability, determinism and the frozen API namespace.
 */

import { describe, it, expect } from 'vitest';
import {
  createDatasetVersion,
  parseDatasetVersion,
  datasetVersionToString,
  datasetVersionToJSON,
  datasetVersionsEqual,
  compareDatasetVersions,
  isDatasetVersion,
  DatasetVersion,
  InvalidDatasetVersionError,
  deepFreeze,
} from '../../src/historical-evidence/index.js';

describe('DatasetVersion — creation', () => {
  it('creates a valid version and exposes the canonical components', () => {
    const v = createDatasetVersion(1, 2, 3);
    expect(v).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(v.major).toBe(1);
    expect(v.minor).toBe(2);
    expect(v.patch).toBe(3);
  });

  it('accepts 0.0.0 as a valid version', () => {
    const v = createDatasetVersion(0, 0, 0);
    expect(v).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it('rejects negative components', () => {
    expect(() => createDatasetVersion(-1, 0, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, -1, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, 0, -1)).toThrow(InvalidDatasetVersionError);
  });

  it('rejects decimals', () => {
    expect(() => createDatasetVersion(1.5, 0, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, 0.5, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, 0, 0.5)).toThrow(InvalidDatasetVersionError);
  });

  it('rejects numeric strings without coercion', () => {
    expect(() => createDatasetVersion('1', 0, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, '0', 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, 0, '0')).toThrow(InvalidDatasetVersionError);
  });

  it('rejects NaN and Infinity', () => {
    expect(() => createDatasetVersion(NaN, 0, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, Infinity, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, 0, -Infinity)).toThrow(InvalidDatasetVersionError);
  });

  it('rejects null, undefined and missing fields', () => {
    expect(() => createDatasetVersion(null, 0, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(undefined, 0, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion(1, 0)).toThrow(InvalidDatasetVersionError);
    expect(() => createDatasetVersion()).toThrow(InvalidDatasetVersionError);
  });

  it('returns a deeply frozen object (no mutation possible)', () => {
    const v = createDatasetVersion(1, 2, 3);
    expect(Object.isFrozen(v)).toBe(true);
    expect(() => {
      'use strict';
      v.major = 9;
    }).toThrow(TypeError);
    expect(deepFreeze(v)).toBe(v);
    expect(v).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('is deterministic: same inputs produce identical objects', () => {
    const a = createDatasetVersion(2, 1, 0);
    const b = createDatasetVersion(2, 1, 0);
    expect(a).toEqual(b);
    expect(Object.isFrozen(a) && Object.isFrozen(b)).toBe(true);
  });
});

describe('DatasetVersion — equality and inequality', () => {
  it('reports equality for identical components', () => {
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), createDatasetVersion(1, 0, 0))).toBe(true);
  });

  it('reports inequality when any component differs', () => {
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), createDatasetVersion(2, 0, 0))).toBe(false);
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), createDatasetVersion(1, 1, 0))).toBe(false);
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), createDatasetVersion(1, 0, 1))).toBe(false);
  });

  it('never equals non-version inputs', () => {
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), null)).toBe(false);
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), '1.0.0')).toBe(false);
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), { major: 1, minor: 0 })).toBe(false);
    expect(datasetVersionsEqual(createDatasetVersion(1, 0, 0), { major: '1', minor: 0, patch: 0 })).toBe(false);
    expect(datasetVersionsEqual(null, null)).toBe(false);
  });

  it('is symmetric and reflexive', () => {
    const v = createDatasetVersion(3, 4, 5);
    expect(datasetVersionsEqual(v, v)).toBe(true);
    expect(datasetVersionsEqual(v, createDatasetVersion(3, 4, 5))).toBe(true);
    expect(datasetVersionsEqual(createDatasetVersion(3, 4, 5), v)).toBe(true);
  });
});

describe('DatasetVersion — comparison', () => {
  it('returns -1/0/1 in semver-like order (major > minor > patch)', () => {
    expect(compareDatasetVersions(createDatasetVersion(1, 0, 0), createDatasetVersion(1, 0, 1))).toBe(-1);
    expect(compareDatasetVersions(createDatasetVersion(1, 0, 1), createDatasetVersion(1, 1, 0))).toBe(-1);
    expect(compareDatasetVersions(createDatasetVersion(1, 9, 9), createDatasetVersion(2, 0, 0))).toBe(-1);
    expect(compareDatasetVersions(createDatasetVersion(1, 0, 1), createDatasetVersion(1, 0, 0))).toBe(1);
    expect(compareDatasetVersions(createDatasetVersion(1, 1, 0), createDatasetVersion(1, 0, 9))).toBe(1);
    expect(compareDatasetVersions(createDatasetVersion(2, 0, 0), createDatasetVersion(1, 99, 99))).toBe(1);
    expect(compareDatasetVersions(createDatasetVersion(1, 2, 3), createDatasetVersion(1, 2, 3))).toBe(0);
  });

  it('throws typed errors on invalid inputs', () => {
    expect(() => compareDatasetVersions(null, createDatasetVersion(1, 0, 0))).toThrow(InvalidDatasetVersionError);
    expect(() => compareDatasetVersions(createDatasetVersion(1, 0, 0), undefined)).toThrow(InvalidDatasetVersionError);
  });
});

describe('DatasetVersion — parse', () => {
  it('parses the canonical form', () => {
    expect(parseDatasetVersion('1.0.0')).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(parseDatasetVersion('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseDatasetVersion('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 });
  });

  it('rejects leading zeros', () => {
    expect(() => parseDatasetVersion('01.2.3')).toThrow(InvalidDatasetVersionError);
    expect(() => parseDatasetVersion('1.02.3')).toThrow(InvalidDatasetVersionError);
    expect(() => parseDatasetVersion('1.2.03')).toThrow(InvalidDatasetVersionError);
  });

  it('rejects malformed texts', () => {
    const bad = [
      '1.2',
      '1.2.3.4',
      'v1.2.3',
      '1.2.x',
      '1.-2.3',
      '1..3',
      '',
      '1.2.3 ',
      ' 1.2.3',
      '1,2,3',
    ];
    for (const text of bad) {
      expect(() => parseDatasetVersion(text)).toThrow(InvalidDatasetVersionError);
    }
  });

  it('rejects non-string inputs', () => {
    expect(() => parseDatasetVersion(1)).toThrow(InvalidDatasetVersionError);
    expect(() => parseDatasetVersion(null)).toThrow(InvalidDatasetVersionError);
    expect(() => parseDatasetVersion(undefined)).toThrow(InvalidDatasetVersionError);
    expect(() => parseDatasetVersion({})).toThrow(InvalidDatasetVersionError);
  });

  it('round-trips toString → parse → toString', () => {
    const v = createDatasetVersion(2, 3, 4);
    const parsed = parseDatasetVersion(datasetVersionToString(v));
    expect(datasetVersionsEqual(v, parsed)).toBe(true);
    expect(datasetVersionToString(parsed)).toBe('2.3.4');
  });
});

describe('DatasetVersion — serialisation and canonical representation', () => {
  it('toString renders major.minor.patch without decoration', () => {
    expect(datasetVersionToString(createDatasetVersion(1, 2, 3))).toBe('1.2.3');
    expect(datasetVersionToString(createDatasetVersion(0, 0, 0))).toBe('0.0.0');
  });

  it('toJSON renders the canonical string (deterministic)', () => {
    expect(datasetVersionToJSON(createDatasetVersion(1, 0, 0))).toBe('1.0.0');
    expect(JSON.parse(JSON.stringify(createDatasetVersion(1, 0, 0)))).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it('toString/toJSON throw typed errors on invalid input', () => {
    expect(() => datasetVersionToString(null)).toThrow(InvalidDatasetVersionError);
    expect(() => datasetVersionToJSON('1.0.0')).toThrow(InvalidDatasetVersionError);
  });
});

describe('DatasetVersion — isDatasetVersion guard', () => {
  it('accepts only valid version objects', () => {
    expect(isDatasetVersion(createDatasetVersion(1, 0, 0))).toBe(true);
    expect(isDatasetVersion({ major: 1, minor: 0, patch: 0 })).toBe(true);
    expect(isDatasetVersion({ major: 1, minor: 0 })).toBe(false);
    expect(isDatasetVersion({ major: -1, minor: 0, patch: 0 })).toBe(false);
    expect(isDatasetVersion('1.0.0')).toBe(false);
    expect(isDatasetVersion(null)).toBe(false);
    expect(isDatasetVersion(undefined)).toBe(false);
    expect(isDatasetVersion([])).toBe(false);
  });
});

describe('DatasetVersion — frozen API namespace', () => {
  it('exposes create/parse/equals/compare/toString/toJSON', () => {
    expect(Object.isFrozen(DatasetVersion)).toBe(true);
    expect(DatasetVersion.create(1, 2, 3)).toEqual(createDatasetVersion(1, 2, 3));
    expect(DatasetVersion.parse('1.2.3')).toEqual(parseDatasetVersion('1.2.3'));
    expect(DatasetVersion.equals(createDatasetVersion(1, 0, 0), createDatasetVersion(1, 0, 0))).toBe(true);
    expect(DatasetVersion.compare(createDatasetVersion(1, 0, 0), createDatasetVersion(2, 0, 0))).toBe(-1);
    expect(DatasetVersion.toString(createDatasetVersion(1, 0, 0))).toBe('1.0.0');
    expect(DatasetVersion.toJSON(createDatasetVersion(1, 0, 0))).toBe('1.0.0');
  });
});
