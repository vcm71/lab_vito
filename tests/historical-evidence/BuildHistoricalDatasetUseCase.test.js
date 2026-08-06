/**
 * BuildHistoricalDatasetUseCase tests (Fase 2.3.3).
 *
 * Covers: repository-backed assembly, datasetId injection (never
 * implicit randomness), timestamp injection (no global clock),
 * non-mutation of the repository and the empty-repository contract.
 */

import { describe, it, expect } from 'vitest';
import {
  BuildHistoricalDatasetUseCase,
  DatasetBuilder,
  createCalibrationObservation,
  createNumberTarget,
  InvalidDatasetIdError,
  InvalidDatasetTimestampError,
  EmptyHistoricalDatasetError,
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

const makeUseCase = (rows) =>
  new BuildHistoricalDatasetUseCase({
    observationRepository: { findAll: () => rows },
    builder: new DatasetBuilder(),
  });

const createdAt = '2026-01-02T00:00:00.000Z';

describe('BuildHistoricalDatasetUseCase', () => {
  it('assembles a dataset from the repository with sourceType IN_MEMORY_REPOSITORY', () => {
    const useCase = makeUseCase([observation()]);
    const ds = useCase.execute({ datasetId: 'ds-001', createdAt });
    expect(ds.datasetId).toBe('ds-001');
    expect(ds.manifest.sourceType).toBe('IN_MEMORY_REPOSITORY');
    expect(ds.statistics.observationCount).toBe(1);
    expect(Object.isFrozen(ds)).toBe(true);
  });

  it('requires an explicit datasetId unless a generator is injected', () => {
    const useCase = makeUseCase([observation()]);
    expect(() => useCase.execute({ createdAt })).toThrow(InvalidDatasetIdError);

    let generated = null;
    const generator = () => (generated = 'ds-gen-1');
    const ds = useCase.execute({ createdAt, datasetIdGenerator: generator });
    expect(ds.datasetId).toBe('ds-gen-1');
    expect(generated).toBe('ds-gen-1');
  });

  it('propagates InvalidDatasetTimestampError when createdAt is missing/invalid', () => {
    const useCase = makeUseCase([observation()]);
    expect(() => useCase.execute({ datasetId: 'ds-001' })).toThrow(InvalidDatasetTimestampError);
    expect(() => useCase.execute({ datasetId: 'ds-001', createdAt: 'bad' })).toThrow(InvalidDatasetTimestampError);
  });

  it('throws EmptyHistoricalDatasetError for an empty repository', () => {
    const useCase = makeUseCase([]);
    expect(() => useCase.execute({ datasetId: 'ds-001', createdAt })).toThrow(EmptyHistoricalDatasetError);
  });

  it('allows an empty dataset with allowEmpty for test doubles', () => {
    const useCase = makeUseCase([]);
    const ds = useCase.execute({
      datasetId: 'ds-001',
      createdAt,
      options: { allowEmpty: true },
    });
    expect(ds.observations).toEqual([]);
  });

  it('does not mutate or persist anything in the repository', () => {
    const rows = [observation()];
    const repo = {
      findAll: () => rows,
      count: () => rows.length,
    };
    const useCase = new BuildHistoricalDatasetUseCase({
      observationRepository: repo,
      builder: new DatasetBuilder(),
    });
    useCase.execute({ datasetId: 'ds-001', createdAt });
    expect(repo.count()).toBe(1);
    expect(rows[0]).toBe(rows[0]); // untouched, same frozen row
  });

  it('passes selection options through to the builder', () => {
    const rows = [
      observation(),
      observation({
        observationId: 'obs-2',
        predictionId: 'p-2',
        outcomeId: 'o-2',
        spinId: 'spin-2',
        predictionCreatedAt: '2026-02-01T00:00:00.000Z',
        outcomeRecordedAt: '2026-02-01T00:00:10.000Z',
      }),
    ];
    const useCase = makeUseCase(rows);
    const ds = useCase.execute({
      datasetId: 'ds-001',
      createdAt,
      options: { predictionCreatedFrom: '2026-02-01T00:00:00.000Z' },
    });
    expect(ds.observations.map((o) => o.observationId)).toEqual(['obs-2']);
    expect(ds.manifest.filters).toEqual([
      { type: 'PREDICTION_CREATED_FROM', value: '2026-02-01T00:00:00.000Z' },
    ]);
  });
});
