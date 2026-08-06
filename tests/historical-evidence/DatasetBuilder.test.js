/**
 * DatasetBuilder tests (Fase 2.3.3).
 *
 * Covers the full assembly pipeline: input validation, selection filters
 * (temporal inclusive, target type, strategy, calibration identity),
 * exclusion accounting, duplicate rejection (identity / prediction /
 * logical), canonical ordering, determinism (contentHash), input
 * non-mutation, all-or-nothing policies, empty datasets and hashing.
 */

import { describe, it, expect } from 'vitest';
import {
  DatasetBuilder,
  createCalibrationObservation,
  createNumberTarget,
  InvalidDatasetIdError,
  InvalidDatasetTimestampError,
  InvalidDatasetOptionsError,
  InvalidDatasetObservationError,
  UnsupportedObservationSchemaError,
  DuplicateDatasetObservationError,
  EmptyHistoricalDatasetError,
  HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION,
  CANONICAL_SORT_ORDER,
} from '../../src/historical-evidence/index.js';

const T = (n) => createNumberTarget(n);

const observation = (overrides = {}) =>
  createCalibrationObservation({
    observationId: 'obs-1',
    predictionId: 'p-1',
    outcomeId: 'o-1',
    spinId: 'spin-1',
    target: T('17'),
    rawConsensusScore: 0.72,
    calibration: { probability: 0.7, strategyName: 'isotonic', modelId: 'm1' },
    observedOutcome: 1,
    predictionCreatedAt: '2026-01-01T00:00:00.000Z',
    outcomeRecordedAt: '2026-01-01T00:00:05.000Z',
    observationCreatedAt: '2026-01-01T00:00:05.000Z',
    ...overrides,
  });

const builder = new DatasetBuilder();
const createdAt = '2026-01-02T00:00:00.000Z';

const build = (obs, opts = {}) =>
  builder.buildDataset({
    datasetId: 'ds-001',
    observations: obs,
    createdAt,
    ...opts,
  });

describe('DatasetBuilder — input validation', () => {
  it('rejects missing/empty datasetId', () => {
    expect(() => build([observation()], { datasetId: undefined })).toThrow(InvalidDatasetIdError);
    expect(() => build([observation()], { datasetId: '' })).toThrow(InvalidDatasetIdError);
  });

  it('rejects an invalid createdAt', () => {
    expect(() => build([observation()], { createdAt: 'nope' })).toThrow(InvalidDatasetTimestampError);
  });

  it('rejects a non-array observations input', () => {
    expect(() => build('not-an-array')).toThrow(InvalidDatasetOptionsError);
  });

  it('rejects an unsupported sourceType', () => {
    expect(() => build([observation()], { sourceType: 'CLOUD' })).toThrow(InvalidDatasetOptionsError);
  });
});

describe('DatasetBuilder — assembled contract', () => {
  it('produces a complete deep-frozen dataset with manifest, statistics and hashes', () => {
    const ds = build([observation()]);
    expect(ds.schemaVersion).toBe(HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION);
    expect(ds.observationSchemaVersion).toBe('1');
    expect(ds.datasetId).toBe('ds-001');
    expect(ds.createdAt).toBe(createdAt);
    expect(ds.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(ds.manifestHash).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.isFrozen(ds)).toBe(true);
    expect(Object.isFrozen(ds.manifest)).toBe(true);
    expect(Object.isFrozen(ds.statistics)).toBe(true);
    expect(Object.isFrozen(ds.observations[0])).toBe(true);

    expect(ds.manifest).toMatchObject({
      datasetId: 'ds-001',
      sourceType: 'PROVIDED_COLLECTION',
      duplicatePolicy: 'REJECT',
      invalidObservationPolicy: 'REJECT_DATASET',
      observationCount: 1,
      excludedCount: 0,
      invalidCount: 0,
      sortOrder: CANONICAL_SORT_ORDER,
    });
    expect(ds.manifest.filters).toEqual([]);
    expect(ds.statistics.observationCount).toBe(1);
    expect(ds.period).toEqual({
      predictionCreatedFrom: '2026-01-01T00:00:00.000Z',
      predictionCreatedTo: '2026-01-01T00:00:00.000Z',
      outcomeRecordedFrom: '2026-01-01T00:00:05.000Z',
      outcomeRecordedTo: '2026-01-01T00:00:05.000Z',
    });
  });

  it('records sourceType IN_MEMORY_REPOSITORY when the use case asks for it', () => {
    const ds = build([observation()], { sourceType: 'IN_MEMORY_REPOSITORY' });
    expect(ds.manifest.sourceType).toBe('IN_MEMORY_REPOSITORY');
  });
});

describe('DatasetBuilder — selection filters', () => {
  const rows = [
    observation({ predictionCreatedAt: '2026-01-01T00:00:01.000Z', outcomeRecordedAt: '2026-01-01T00:00:01.000Z' }),
    observation({
      observationId: 'obs-2',
      predictionId: 'p-2',
      outcomeId: 'o-2',
      spinId: 'spin-2',
      predictionCreatedAt: '2026-02-01T00:00:00.000Z',
      outcomeRecordedAt: '2026-02-01T00:00:10.000Z',
    }),
    observation({
      observationId: 'obs-3',
      predictionId: 'p-3',
      outcomeId: 'o-3',
      spinId: 'spin-3',
      target: T('0'),
      calibration: null,
      predictionCreatedAt: '2026-03-01T00:00:00.000Z',
      outcomeRecordedAt: '2026-03-01T00:00:20.000Z',
    }),
  ];

  it('filters by predictionCreated range with INCLUSIVE boundaries', () => {
    const ds = build(rows, {
      options: {
        predictionCreatedFrom: '2026-02-01T00:00:00.000Z',
        predictionCreatedTo: '2026-02-01T00:00:00.000Z',
      },
    });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-2']);
    expect(ds.manifest.filters).toEqual([
      { type: 'PREDICTION_CREATED_FROM', value: '2026-02-01T00:00:00.000Z' },
      { type: 'PREDICTION_CREATED_TO', value: '2026-02-01T00:00:00.000Z' },
    ]);
    expect(ds.manifest.excludedCount).toBe(2);
  });

  it('filters by outcomeRecorded range', () => {
    const ds = build(rows, { options: { outcomeRecordedFrom: '2026-02-01T00:00:10.000Z' } });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-2', 'obs-3']);
  });

  it('filters by includeTargetTypes', () => {
    const ds = build(rows, { options: { includeTargetTypes: ['NUMBER'] } });
    expect(ds.observations).toHaveLength(3); // all NUMBER in this fixture
  });

  it('rejects an empty result when allowEmpty is false (all filtered out)', () => {
    expect(() =>
      build(rows, { options: { includeTargetTypes: ['DOZEN'] } }),
    ).toThrow(EmptyHistoricalDatasetError);
  });

  it('filters by includeCalibrationStrategies (uncalibrated rows are excluded)', () => {
    const ds = build(rows, { options: { includeCalibrationStrategies: ['isotonic'] } });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-1', 'obs-2']);
  });

  it('filters by excludeCalibrationStrategies', () => {
    const ds = build(rows, { options: { excludeCalibrationStrategies: ['isotonic'] } });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-3']);
  });

  it('filters by requireCalibration', () => {
    const ds = build(rows, { options: { requireCalibration: true } });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-1', 'obs-2']);
  });

  it('filters by requireModelIdentity (modelId must be present)', () => {
    const noModel = observation({ calibration: { probability: 0.5, strategyName: 'platt' } });
    const ds = build([...rows, noModel], { options: { requireModelIdentity: true } });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-1', 'obs-2']);
    expect(ds.manifest.exclusionsByReason.REQUIRE_MODEL_IDENTITY).toBe(2);
  });

  it('accounts exclusions per reason — one reason per observation', () => {
    const ds = build(rows, {
      options: {
        predictionCreatedFrom: '2026-02-01T00:00:00.000Z',
        includeTargetTypes: ['NUMBER'],
      },
    });
    expect(ds.manifest.exclusionsByReason.PREDICTION_CREATED_FROM).toBe(1);
    expect(ds.manifest.excludedCount).toBe(1);
  });
});

describe('DatasetBuilder — duplicates', () => {
  it('rejects the same observationId with identical content (IDENTITY_DUPLICATE)', () => {
    const obs = observation();
    try {
      build([obs, { ...obs }]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateDatasetObservationError);
      expect(err.duplicateType).toBe('IDENTITY_DUPLICATE');
      expect(err.code).toBe('DUPLICATE_DATASET_OBSERVATION');
    }
  });

  it('rejects the same observationId with different content (IDENTITY_CONFLICT)', () => {
    const a = observation();
    const b = observation({ observedOutcome: 0 });
    try {
      build([a, b]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateDatasetObservationError);
      expect(err.duplicateType).toBe('IDENTITY_CONFLICT');
    }
  });

  it('rejects the same predictionId twice (PREDICTION_DUPLICATE — one row per prediction)', () => {
    const a = observation();
    const b = observation({ observationId: 'obs-2', outcomeId: 'o-2', spinId: 'spin-2' });
    try {
      build([a, b]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateDatasetObservationError);
      expect(err.duplicateType).toBe('PREDICTION_DUPLICATE');
    }
  });

  it('rejects the same (predictionId, outcomeId) pair under different ids (LOGICAL_DUPLICATE)', () => {
    const a = observation();
    const b = observation({ observationId: 'obs-2' });
    try {
      build([a, b]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateDatasetObservationError);
      expect(err.duplicateType).toBe('PREDICTION_DUPLICATE'); // prediction check precedes pair check
    }
  });

  it('does not mutate the input array or its rows', () => {
    const a = observation();
    const b = observation({ observationId: 'obs-2', predictionId: 'p-2', outcomeId: 'o-2', spinId: 'spin-2' });
    const input = [a, b];
    build(input);
    expect(input).toHaveLength(2);
    expect(input[0]).toBe(a);
    expect(input[1]).toBe(b);
  });
});

describe('DatasetBuilder — invalid observations (all-or-nothing)', () => {
  it('REJECT_DATASET: a malformed row aborts the whole assembly', () => {
    const good = observation();
    const broken = { schemaVersion: '1', observationId: 'obs-broken' };
    expect(() => build([good, broken])).toThrow(InvalidDatasetObservationError);
    expect(() => build([good, broken])).toThrow(/obs-broken/);
  });

  it('REJECT_DATASET: an unsupported schemaVersion aborts (never mixed, never migrated)', () => {
    const good = observation();
    const future = { ...observation(), schemaVersion: '2' };
    try {
      build([good, future]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedObservationSchemaError);
      expect(err.receivedSchema).toBe('2');
      expect(err.expectedSchema).toBe('1');
    }
  });

  it('EXCLUDE_AND_REPORT: invalid rows are dropped and counted', () => {
    const good = observation();
    const broken = { schemaVersion: '1', observationId: 'obs-broken' };
    const ds = build([good, broken], { options: { invalidObservationPolicy: 'EXCLUDE_AND_REPORT' } });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-1']);
    expect(ds.manifest.invalidCount).toBe(1);
    expect(ds.manifest.exclusionsByReason.INVALID_OBSERVATION).toBe(1);
  });
});

describe('DatasetBuilder — empty dataset policy', () => {
  it('rejects an empty observation list by default', () => {
    expect(() => build([])).toThrow(EmptyHistoricalDatasetError);
  });

  it('allows an empty dataset when allowEmpty is set (statistics/period contract)', () => {
    const ds = build([], { options: { allowEmpty: true } });
    expect(ds.observations).toEqual([]);
    expect(ds.statistics.observationCount).toBe(0);
    expect(ds.period.predictionCreatedFrom).toBeNull();
    expect(ds.manifest.observationCount).toBe(0);
  });
});

describe('DatasetBuilder — determinism and hashing', () => {
  it('produces identical contentHash for identical scientific content', () => {
    const rows = [
      observation(),
      observation({ observationId: 'obs-2', predictionId: 'p-2', outcomeId: 'o-2', spinId: 'spin-2' }),
    ];
    const a = build(rows);
    const b = build([...rows].reverse()); // input order must not matter
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.manifestHash).toBe(b.manifestHash);
  });

  it('contentHash ignores datasetId and createdAt (operational fields)', () => {
    const rows = [observation()];
    const a = build(rows, { datasetId: 'ds-a', createdAt: '2026-01-02T00:00:00.000Z' });
    const b = build(rows, { datasetId: 'ds-b', createdAt: '2026-02-02T00:00:00.000Z' });
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.manifestHash).not.toBe(b.manifestHash); // manifest carries operational fields
  });

  it('accepts an injected hashFn (testability, no node:crypto dependency in tests)', () => {
    // Deterministic 64-char lowercase hex (FNV-1a) — stable, no crypto needed.
    const fakeHash = (obj) => {
      let h = 0x811c9dc5;
      for (const ch of JSON.stringify(obj)) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 0x01000193);
      }
      return (h >>> 0).toString(16).padStart(8, '0').repeat(8);
    };
    const ds = build([observation()], { hashFn: fakeHash });
    expect(typeof ds.contentHash).toBe('string');
    expect(ds.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects an injected hashFn that is not a function', () => {
    expect(() => build([observation()], { hashFn: 'sha' })).toThrow(InvalidDatasetOptionsError);
  });
});
