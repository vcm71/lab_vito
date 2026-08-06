/**
 * Builder + use case tests — calibration observations (Fase 2.3.2).
 *
 * Covers:
 * - ObservationBuilder: cross-record validation (spin match, chronology),
 *   observedOutcome derivation (never external), calibration inheritance
 * - BuildObservationsBySpinUseCase: per-spin materialisation, deterministic
 *   order, PENDING_OUTCOME semantics, SpinNotFoundError, all-or-nothing
 *   atomicity, idempotence, build-only mode (no side effects)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryEvidenceRepository,
  InMemoryCalibrationObservationRepository,
  ObservationBuilder,
  BuildObservationsBySpinUseCase,
  createPredictionRecord,
  createSpinOutcomeRecord,
  createNumberTarget,
  EvidenceSpinMismatchError,
  TemporalEvidenceLeakageError,
  InvalidCalibrationObservationError,
  InvalidObservationIdError,
  SpinNotFoundError,
  DuplicateCalibrationObservationError,
} from '../../src/historical-evidence/index.js';

const T = (n) => createNumberTarget(n);

const prediction = (overrides = {}) =>
  createPredictionRecord({
    predictionId: 'p-001',
    spinId: 'spin-1',
    target: T('17'),
    rawConsensusScore: 0.72,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

const outcome = (overrides = {}) =>
  createSpinOutcomeRecord({
    outcomeId: 'o-001',
    spinId: 'spin-1',
    winningNumber: '17',
    recordedAt: '2026-01-01T00:00:05.000Z',
    ...overrides,
  });

describe('ObservationBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new ObservationBuilder();
  });

  it('builds a complete observation deriving observedOutcome = 1 on hit', () => {
    const obs = builder.buildObservation({
      observationId: 'obs-spin-1-1',
      prediction: prediction(),
      outcome: outcome(),
      createdAt: '2026-01-01T00:00:05.000Z',
    });
    expect(obs.observedOutcome).toBe(1);
    expect(obs.predictionId).toBe('p-001');
    expect(obs.outcomeId).toBe('o-001');
    expect(obs.spinId).toBe('spin-1');
    expect(obs.observationCreatedAt).toBe('2026-01-01T00:00:05.000Z');
    expect(obs.calibration).toBeNull();
    expect(Object.isFrozen(obs)).toBe(true);
  });

  it('derives observedOutcome = 0 on miss (strict — 0 vs 00)', () => {
    const miss = builder.buildObservation({
      observationId: 'obs-spin-1-2',
      prediction: prediction({ predictionId: 'p-002', target: T('0') }),
      outcome: outcome({ winningNumber: '00' }),
      createdAt: '2026-01-01T00:00:05.000Z',
    });
    expect(miss.observedOutcome).toBe(0);
  });

  it('inherits calibration metadata from the prediction', () => {
    const obs = builder.buildObservation({
      observationId: 'obs-spin-1-3',
      prediction: prediction({
        predictionId: 'p-003',
        calibration: { probability: 0.68, strategyName: 'identity', modelId: '1.2.3' },
      }),
      outcome: outcome(),
      createdAt: '2026-01-01T00:00:05.000Z',
    });
    expect(obs.calibration).toEqual({ probability: 0.68, strategyName: 'identity', modelId: '1.2.3', modelHash: undefined });
  });

  it('rejects prediction/outcome from different spins', () => {
    expect(() =>
      builder.buildObservation({
        observationId: 'obs-spin-1-4',
        prediction: prediction({ spinId: 'spin-1' }),
        outcome: outcome({ spinId: 'spin-2' }),
        createdAt: '2026-01-01T00:00:05.000Z',
      }),
    ).toThrow(EvidenceSpinMismatchError);
  });

  it('rejects chronologically leaked predictions (after the outcome)', () => {
    expect(() =>
      builder.buildObservation({
        observationId: 'obs-spin-1-5',
        prediction: prediction({ createdAt: '2026-01-01T00:00:06.000Z' }),
        outcome: outcome({ recordedAt: '2026-01-01T00:00:05.000Z' }),
        createdAt: '2026-01-01T00:00:05.000Z',
      }),
    ).toThrow(TemporalEvidenceLeakageError);
  });

  it('rejects externally supplied observedOutcome (derived, never trusted)', () => {
    expect(() =>
      builder.buildObservation({
        observationId: 'obs-spin-1-6',
        prediction: prediction(),
        outcome: outcome(),
        createdAt: '2026-01-01T00:00:05.000Z',
        observedOutcome: 0,
      }),
    ).toThrow(InvalidCalibrationObservationError);
  });

  it('rejects unsafe observation ids', () => {
    expect(() =>
      builder.buildObservation({
        observationId: 'bad id',
        prediction: prediction(),
        outcome: outcome(),
        createdAt: '2026-01-01T00:00:05.000Z',
      }),
    ).toThrow(InvalidObservationIdError);
  });

  it('requires an explicit createdAt (no implicit timestamps)', () => {
    expect(() =>
      builder.buildObservation({ observationId: 'obs-x-1', prediction: prediction(), outcome: outcome() }),
    ).toThrow(TypeError);
  });
});

describe('BuildObservationsBySpinUseCase', () => {
  let evidenceRepo, observationRepo, builder, useCase;

  beforeEach(() => {
    evidenceRepo = new InMemoryEvidenceRepository();
    observationRepo = new InMemoryCalibrationObservationRepository();
    builder = new ObservationBuilder();
    useCase = new BuildObservationsBySpinUseCase({
      evidenceRepository: evidenceRepo,
      observationBuilder: builder,
      observationRepository: observationRepo,
    });
  });

  it('materialises one observation per prediction (COMPLETED)', () => {
    evidenceRepo.savePrediction(prediction());
    evidenceRepo.saveOutcome(outcome());

    const result = useCase.execute({ spinId: 'spin-1' });

    expect(result.evidenceStatus).toBe('COMPLETED');
    expect(result.observationCount).toBe(1);
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].observationId).toBe('obs-spin-1-1');
    expect(result.observations[0].observedOutcome).toBe(1);
    expect(observationRepo.count()).toBe(1);
    expect(observationRepo.findById('obs-spin-1-1')).not.toBeNull();
  });

  it('orders observations deterministically (createdAt asc, predictionId asc) and persists all', () => {
    evidenceRepo.savePrediction(prediction({ predictionId: 'p-b', createdAt: '2026-01-01T00:00:02.000Z', target: T('5') }));
    evidenceRepo.savePrediction(prediction({ predictionId: 'p-a', createdAt: '2026-01-01T00:00:01.000Z', target: T('1') }));
    evidenceRepo.savePrediction(prediction({ predictionId: 'p-c', createdAt: '2026-01-01T00:00:02.000Z', target: T('7') }));
    evidenceRepo.saveOutcome(outcome({ winningNumber: '17' }));

    const result = useCase.execute({ spinId: 'spin-1' });

    expect(result.observations.map((o) => o.predictionId)).toEqual(['p-a', 'p-b', 'p-c']);
    expect(result.observations.map((o) => o.observationId)).toEqual(['obs-spin-1-1', 'obs-spin-1-2', 'obs-spin-1-3']);
    expect(observationRepo.count()).toBe(3);
    expect(observationRepo.findBySpinId('spin-1').map((o) => o.predictionId)).toEqual(['p-a', 'p-b', 'p-c']);
  });

  it('never interprets a missing outcome as observedOutcome = 0 (PENDING_OUTCOME)', () => {
    evidenceRepo.savePrediction(prediction());

    const result = useCase.execute({ spinId: 'spin-1' });

    expect(result.evidenceStatus).toBe('PENDING_OUTCOME');
    expect(result.observationCount).toBe(0);
    expect(result.observations).toEqual([]);
    expect(observationRepo.count()).toBe(0);
  });

  it('returns zero observations when the spin has an outcome but no predictions (COMPLETED)', () => {
    evidenceRepo.saveOutcome(outcome());

    const result = useCase.execute({ spinId: 'spin-1' });

    expect(result.evidenceStatus).toBe('COMPLETED');
    expect(result.observationCount).toBe(0);
    expect(observationRepo.count()).toBe(0);
  });

  it('throws SpinNotFoundError when no evidence exists for the spin', () => {
    expect(() => useCase.execute({ spinId: 'spin-unknown' })).toThrow(SpinNotFoundError);
  });

  it('is all-or-nothing: a duplicate preflight failure persists nothing', () => {
    // Pre-existing observation for prediction p-001 (different outcome).
    const pre = builder.buildObservation({
      observationId: 'obs-other-1',
      prediction: prediction({ spinId: 'spin-9' }),
      outcome: outcome({ spinId: 'spin-9', outcomeId: 'o-999' }),
      createdAt: '2026-01-01T00:00:05.000Z',
    });
    observationRepo.save(pre);

    // Two predictions for spin-1; the second (p-001) collides with `pre`.
    evidenceRepo.savePrediction(prediction({ predictionId: 'p-aaa', target: T('1') }));
    evidenceRepo.savePrediction(prediction({ predictionId: 'p-001', target: T('17') }));
    evidenceRepo.saveOutcome(outcome());

    expect(() => useCase.execute({ spinId: 'spin-1' })).toThrow(DuplicateCalibrationObservationError);
    // Nothing from spin-1 was persisted (only the pre-existing observation).
    expect(observationRepo.count()).toBe(1);
    expect(observationRepo.findBySpinId('spin-1')).toEqual([]);
  });

  it('is idempotent: re-execution saves identical observations as a no-op', () => {
    evidenceRepo.savePrediction(prediction());
    evidenceRepo.saveOutcome(outcome());

    useCase.execute({ spinId: 'spin-1' });
    const second = useCase.execute({ spinId: 'spin-1' });

    expect(second.observationCount).toBe(1);
    expect(observationRepo.count()).toBe(1);
  });

  it('supports build-only mode (no repository → no side effects)', () => {
    const buildOnly = new BuildObservationsBySpinUseCase({
      evidenceRepository: evidenceRepo,
      observationBuilder: builder,
      // observationRepository omitted
    });
    evidenceRepo.savePrediction(prediction());
    evidenceRepo.saveOutcome(outcome());

    const result = buildOnly.execute({ spinId: 'spin-1' });

    expect(result.observationCount).toBe(1);
    expect(result.observations[0].observedOutcome).toBe(1);
  });

  it('supports a custom observationId generator', () => {
    const custom = new BuildObservationsBySpinUseCase({
      evidenceRepository: evidenceRepo,
      observationBuilder: builder,
      observationRepository: observationRepo,
      observationIdGenerator: (spinId, index) => `obs-${spinId}-x-${index}`,
    });
    evidenceRepo.savePrediction(prediction());
    evidenceRepo.saveOutcome(outcome());

    const result = custom.execute({ spinId: 'spin-1' });

    expect(result.observations[0].observationId).toBe('obs-spin-1-x-0');
  });
});
