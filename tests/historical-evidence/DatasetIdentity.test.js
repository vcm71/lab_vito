/**
 * DatasetIdentity tests (Fase 2.3.4.1).
 *
 * Covers: creation with required fields, hash-format validation (64-char
 * lowercase hex SHA-256, never recomputed), missing/blank field rejection,
 * deep immutability, scientific equivalence (contentHash only), operational
 * equivalence (datasetId + manifestHash), full equality, serialisation
 * without mutable references, determinism and the frozen API namespace.
 */

import { describe, it, expect } from 'vitest';
import {
  createDatasetIdentity,
  createDatasetVersion,
  isDatasetIdentity,
  isDatasetIdentityScientificallyEquivalent,
  isDatasetIdentityOperationallyEquivalent,
  datasetIdentitiesEqual,
  datasetIdentityToJSON,
  DatasetIdentity,
  InvalidDatasetIdentityError,
  deepFreeze,
} from '../../src/historical-evidence/index.js';

const HASH = 'a'.repeat(64);

const identity = (overrides = {}) =>
  createDatasetIdentity({
    datasetId: 'ds-001',
    datasetVersion: createDatasetVersion(1, 0, 0),
    schemaVersion: '1',
    observationSchemaVersion: '1',
    contentHash: HASH,
    manifestHash: 'b'.repeat(64),
    ...overrides,
  });

describe('DatasetIdentity — creation', () => {
  it('creates a valid identity with all fields', () => {
    const id = identity();
    expect(id.datasetId).toBe('ds-001');
    expect(id.datasetVersion).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(id.schemaVersion).toBe('1');
    expect(id.observationSchemaVersion).toBe('1');
    expect(id.contentHash).toBe(HASH);
    expect(id.manifestHash).toBe('b'.repeat(64));
  });

  it('accepts datasetVersion 0.0.0', () => {
    const id = identity({ datasetVersion: createDatasetVersion(0, 0, 0) });
    expect(id.datasetVersion).toEqual({ major: 0, minor: 0, patch: 0 });
  });

  it('rejects a missing or blank datasetId', () => {
    expect(() => identity({ datasetId: undefined })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ datasetId: '' })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ datasetId: '   ' })).toThrow(InvalidDatasetIdentityError);
  });

  it('rejects an invalid datasetVersion', () => {
    expect(() => identity({ datasetVersion: null })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ datasetVersion: '1.0.0' })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ datasetVersion: { major: 1, minor: 0 } })).toThrow(InvalidDatasetIdentityError);
  });

  it('rejects a missing or blank schemaVersion / observationSchemaVersion', () => {
    expect(() => identity({ schemaVersion: undefined })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ schemaVersion: '' })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ observationSchemaVersion: undefined })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ observationSchemaVersion: '' })).toThrow(InvalidDatasetIdentityError);
  });

  it('validates hash format (64-char lowercase hex) without recomputing', () => {
    expect(() => identity({ contentHash: undefined })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ manifestHash: undefined })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ contentHash: 'abc' })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ contentHash: 'A'.repeat(64) })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ manifestHash: 'g'.repeat(64) })).toThrow(InvalidDatasetIdentityError);
    expect(() => identity({ contentHash: '' })).toThrow(InvalidDatasetIdentityError);
  });

  it('is deeply frozen', () => {
    const id = identity();
    expect(Object.isFrozen(id)).toBe(true);
    expect(Object.isFrozen(id.datasetVersion)).toBe(true);
    expect(() => {
      'use strict';
      id.datasetId = 'other';
    }).toThrow(TypeError);
    expect(deepFreeze(id)).toBe(id);
  });

  it('is deterministic', () => {
    expect(identity()).toEqual(identity());
  });
});

describe('DatasetIdentity — scientific equivalence', () => {
  it('is equivalent when contentHash matches, regardless of operational fields', () => {
    const a = identity({ datasetId: 'ds-001', manifestHash: 'b'.repeat(64) });
    const b = identity({ datasetId: 'ds-999', manifestHash: 'c'.repeat(64) });
    expect(isDatasetIdentityScientificallyEquivalent(a, b)).toBe(true);
  });

  it('is not equivalent when contentHash differs', () => {
    const a = identity({ contentHash: HASH });
    const b = identity({ contentHash: 'd'.repeat(64) });
    expect(isDatasetIdentityScientificallyEquivalent(a, b)).toBe(false);
  });

  it('returns false (not throws) for invalid identity inputs', () => {
    expect(isDatasetIdentityScientificallyEquivalent(identity(), null)).toBe(false);
    expect(isDatasetIdentityScientificallyEquivalent(null, identity())).toBe(false);
    expect(isDatasetIdentityScientificallyEquivalent(null, null)).toBe(false);
  });
});

describe('DatasetIdentity — operational equivalence', () => {
  it('is equivalent when datasetId and manifestHash match', () => {
    const a = identity({ datasetId: 'ds-001', manifestHash: 'b'.repeat(64) });
    const b = identity({ datasetId: 'ds-001', manifestHash: 'b'.repeat(64), contentHash: 'd'.repeat(64) });
    expect(isDatasetIdentityOperationallyEquivalent(a, b)).toBe(true);
  });

  it('is not equivalent when datasetId or manifestHash differ', () => {
    const a = identity({ datasetId: 'ds-001' });
    expect(isDatasetIdentityOperationallyEquivalent(a, identity({ datasetId: 'ds-002' }))).toBe(false);
    expect(
      isDatasetIdentityOperationallyEquivalent(a, identity({ manifestHash: 'c'.repeat(64) })),
    ).toBe(false);
  });

  it('returns false for invalid identity inputs', () => {
    expect(isDatasetIdentityOperationallyEquivalent(identity(), 'x')).toBe(false);
    expect(isDatasetIdentityOperationallyEquivalent(undefined, identity())).toBe(false);
  });
});

describe('DatasetIdentity — full equality', () => {
  it('is equal only when every component matches', () => {
    expect(datasetIdentitiesEqual(identity(), identity())).toBe(true);
    expect(datasetIdentitiesEqual(identity(), identity({ datasetId: 'ds-002' }))).toBe(false);
    expect(datasetIdentitiesEqual(identity(), identity({ contentHash: 'd'.repeat(64) }))).toBe(false);
    expect(
      datasetIdentitiesEqual(identity(), identity({ datasetVersion: createDatasetVersion(1, 1, 0) })),
    ).toBe(false);
  });
});

describe('DatasetIdentity — serialisation', () => {
  it('toJSON renders the datasetVersion as a canonical string', () => {
    const id = identity();
    const json = datasetIdentityToJSON(id);
    expect(json.datasetVersion).toBe('1.0.0');
    expect(json.datasetId).toBe('ds-001');
    expect(json.contentHash).toBe(HASH);
  });

  it('toJSON returns a fresh deep-frozen object without mutable references', () => {
    const id = identity();
    const json = datasetIdentityToJSON(id);
    expect(json).not.toBe(id);
    expect(Object.isFrozen(json)).toBe(true);
    expect(typeof json.datasetVersion).toBe('string');
    expect(() => {
      'use strict';
      json.datasetVersion = '9.9.9';
    }).toThrow(TypeError);
    expect(id.datasetVersion).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it('toJSON is deterministic and JSON-serialisable', () => {
    const a = datasetIdentityToJSON(identity());
    const b = datasetIdentityToJSON(identity());
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it('throws typed error on invalid input', () => {
    expect(() => datasetIdentityToJSON(null)).toThrow(InvalidDatasetIdentityError);
    expect(() => datasetIdentityToJSON({ datasetId: 'x' })).toThrow(InvalidDatasetIdentityError);
  });
});

describe('DatasetIdentity — isDatasetIdentity guard and frozen namespace', () => {
  it('accepts only valid identities', () => {
    const valid = identity();
    expect(isDatasetIdentity(valid)).toBe(true);
    expect(isDatasetIdentity(null)).toBe(false);
    expect(isDatasetIdentity({})).toBe(false);
    expect(isDatasetIdentity({ ...valid, contentHash: 'x' })).toBe(false);
    expect(isDatasetIdentity({ ...valid, datasetVersion: null })).toBe(false);
    expect(isDatasetIdentity({ ...valid, datasetId: '' })).toBe(false);
  });

  it('exposes create/isScientificallyEquivalentTo/isOperationallyEquivalentTo/equals/toJSON', () => {
    expect(Object.isFrozen(DatasetIdentity)).toBe(true);
    const a = DatasetIdentity.create({
      datasetId: 'ds-001',
      datasetVersion: createDatasetVersion(1, 0, 0),
      schemaVersion: '1',
      observationSchemaVersion: '1',
      contentHash: HASH,
      manifestHash: 'b'.repeat(64),
    });
    const b = DatasetIdentity.create({
      datasetId: 'ds-999',
      datasetVersion: createDatasetVersion(1, 0, 0),
      schemaVersion: '1',
      observationSchemaVersion: '1',
      contentHash: HASH,
      manifestHash: 'c'.repeat(64),
    });
    expect(DatasetIdentity.isScientificallyEquivalentTo(a, b)).toBe(true);
    expect(DatasetIdentity.isOperationallyEquivalentTo(a, b)).toBe(false);
    expect(DatasetIdentity.equals(a, a)).toBe(true);
    expect(DatasetIdentity.toJSON(a).datasetVersion).toBe('1.0.0');
  });
});
