/**
 * HistoricalCalibrationDataset tests (Fase 2.3.3).
 *
 * Covers the dataset contract: schema versioning, required inputs,
 * canonical ordering, covered period derivation, deep immutability and
 * scientific-content identity (isSameDatasetContent).
 */

import { describe, it, expect } from 'vitest';
import {
  createHistoricalCalibrationDataset,
  createNumberTarget,
  canonicalSortObservations,
  deriveDatasetPeriod,
  isSameDatasetContent,
  InvalidDatasetIdError,
  InvalidDatasetTimestampError,
  InvalidDatasetObservationError,
} from '../../src/historical-evidence/index.js';

const T = (n) => createNumberTarget(n);

/** Freeze a fixture observation (2 levels: target, calibration). */
const freeze = (obs) => {
  Object.freeze(obs.target);
  if (obs.calibration) Object.freeze(obs.calibration);
  return Object.freeze(obs);
};

const observation = (overrides = {}) =>
  freeze({
    schemaVersion: '1',
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
    metadata: null,
    ...overrides,
  });

const dataset = (overrides = {}) =>
  createHistoricalCalibrationDataset({
    datasetId: 'ds-001',
    observationSchemaVersion: '1',
    createdAt: '2026-01-02T00:00:00.000Z',
    period: {
      predictionCreatedFrom: '2026-01-01T00:00:00.000Z',
      predictionCreatedTo: '2026-01-01T00:00:00.000Z',
      outcomeRecordedFrom: '2026-01-01T00:00:05.000Z',
      outcomeRecordedTo: '2026-01-01T00:00:05.000Z',
    },
    manifest: { datasetId: 'ds-001' },
    statistics: { observationCount: 1 },
    contentHash: 'a'.repeat(64),
    manifestHash: 'b'.repeat(64),
    observations: [observation()],
    ...overrides,
  });

describe('createHistoricalCalibrationDataset', () => {
  it('builds a deep-frozen dataset with stable schema version', () => {
    const ds = dataset();
    expect(ds.schemaVersion).toBe('1');
    expect(ds.observationSchemaVersion).toBe('1');
    expect(Object.isFrozen(ds)).toBe(true);
    expect(Object.isFrozen(ds.period)).toBe(true);
    expect(Object.isFrozen(ds.manifest)).toBe(true);
    expect(Object.isFrozen(ds.statistics)).toBe(true);
    expect(Object.isFrozen(ds.observations)).toBe(true);
    expect(Object.isFrozen(ds.observations[0])).toBe(true);
  });

  it('rejects a missing or empty datasetId', () => {
    expect(() => dataset({ datasetId: undefined })).toThrow(InvalidDatasetIdError);
    expect(() => dataset({ datasetId: '' })).toThrow(InvalidDatasetIdError);
    expect(() => dataset({ datasetId: 42 })).toThrow(InvalidDatasetIdError);
  });

  it('rejects an invalid createdAt timestamp', () => {
    expect(() => dataset({ createdAt: 'no' })).toThrow(InvalidDatasetTimestampError);
  });

  it('rejects non-array observations and non-object manifest/statistics/period', () => {
    expect(() => dataset({ observations: 'nope' })).toThrow(InvalidDatasetObservationError);
    expect(() => dataset({ manifest: null })).toThrow(TypeError);
    expect(() => dataset({ statistics: null })).toThrow(TypeError);
    expect(() => dataset({ period: null })).toThrow(TypeError);
  });

  it('rejects observations that are not deep-frozen objects', () => {
    const raw = observation();
    const mutable = { ...raw, target: { ...raw.target } };
    expect(() => dataset({ observations: [mutable] })).toThrow(InvalidDatasetObservationError);
  });
});

describe('canonicalSortObservations', () => {
  it('sorts by predictionCreatedAt, then spinId, predictionId, outcomeId, observationId', () => {
    const rows = [
      observation({
        observationId: 'obs-z',
        predictionId: 'p-z',
        outcomeId: 'o-z',
        spinId: 'spin-z',
        predictionCreatedAt: '2026-01-01T00:00:01.000Z',
      }),
      observation({
        observationId: 'obs-a',
        predictionId: 'p-a',
        outcomeId: 'o-a',
        spinId: 'spin-a',
        predictionCreatedAt: '2026-01-01T00:00:01.000Z',
      }),
      observation({
        observationId: 'obs-m',
        predictionId: 'p-m',
        outcomeId: 'o-m',
        spinId: 'spin-a',
        predictionCreatedAt: '2026-01-01T00:00:02.000Z',
      }),
      observation({
        observationId: 'obs-b',
        predictionId: 'p-b',
        outcomeId: 'o-b',
        spinId: 'spin-a',
        predictionCreatedAt: '2026-01-01T00:00:01.000Z',
      }),
    ];
    const sorted = canonicalSortObservations(rows);
    expect(sorted.map((o) => o.observationId)).toEqual(['obs-a', 'obs-b', 'obs-z', 'obs-m']);
  });

  it('breaks same-timestamp ties with predictionId and observationId deterministically', () => {
    const rows = [
      observation({ observationId: 'obs-2', predictionId: 'p-2' }),
      observation({ observationId: 'obs-1', predictionId: 'p-1' }),
    ];
    expect(canonicalSortObservations(rows).map((o) => o.observationId)).toEqual(['obs-1', 'obs-2']);
  });

  it('does not mutate the input array', () => {
    const rows = [observation({ observationId: 'obs-2' }), observation({ observationId: 'obs-1' })];
    const before = rows.map((o) => o.observationId);
    canonicalSortObservations(rows);
    expect(rows.map((o) => o.observationId)).toEqual(before);
  });
});

describe('deriveDatasetPeriod', () => {
  it('derives min/max of both axes from content', () => {
    const period = deriveDatasetPeriod([
      observation({
        predictionCreatedAt: '2026-01-01T00:00:01.000Z',
        outcomeRecordedAt: '2026-01-01T00:00:02.000Z',
      }),
      observation({
        predictionCreatedAt: '2026-01-01T00:00:03.000Z',
        outcomeRecordedAt: '2026-01-01T00:00:04.000Z',
      }),
    ]);
    expect(period).toEqual({
      predictionCreatedFrom: '2026-01-01T00:00:01.000Z',
      predictionCreatedTo: '2026-01-01T00:00:03.000Z',
      outcomeRecordedFrom: '2026-01-01T00:00:02.000Z',
      outcomeRecordedTo: '2026-01-01T00:00:04.000Z',
    });
  });

  it('returns nulls for an empty observation list', () => {
    expect(deriveDatasetPeriod([])).toEqual({
      predictionCreatedFrom: null,
      predictionCreatedTo: null,
      outcomeRecordedFrom: null,
      outcomeRecordedTo: null,
    });
  });
});

describe('isSameDatasetContent', () => {
  it('compares scientific content via contentHash (ignores datasetId/createdAt)', () => {
    const a = dataset({ datasetId: 'ds-a', contentHash: 'c'.repeat(64) });
    const b = dataset({ datasetId: 'ds-b', createdAt: '2026-02-01T00:00:00.000Z', contentHash: 'c'.repeat(64) });
    expect(isSameDatasetContent(a, b)).toBe(true);

    const c = dataset({ contentHash: 'f'.repeat(64) });
    expect(isSameDatasetContent(a, c)).toBe(false);
  });

  it('returns false for non-dataset inputs', () => {
    expect(isSameDatasetContent(null, dataset())).toBe(false);
    expect(isSameDatasetContent(dataset(), { contentHash: 'c'.repeat(64) })).toBe(false);
  });
});
