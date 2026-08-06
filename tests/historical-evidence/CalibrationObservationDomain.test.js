/**
 * Domain tests — calibration observations (Fase 2.3.2).
 *
 * Covers:
 * - PredictionTargetEvaluator: NUMBER strict evaluation (0 vs 00), errors
 * - CalibrationObservation: contract, deep immutability, schemaVersion,
 *   getEffectiveProbability
 * - ObservationIdentity: id policy, sequential generator
 */

import { describe, it, expect } from 'vitest';
import {
  createCalibrationObservation,
  evaluatePredictionTarget,
  SUPPORTED_PREDICTION_TARGETS,
  CALIBRATION_OBSERVATION_SCHEMA_VERSION,
  getEffectiveProbability,
  isValidObservationId,
  assertValidObservationId,
  createSequentialObservationId,
  createNumberTarget,
  UnsupportedPredictionTargetError,
  InvalidPredictionTargetError,
  InvalidWinningNumberError,
  InvalidObservationIdError,
  InvalidCalibrationObservationError,
  InvalidConsensusScoreError,
} from '../../src/historical-evidence/index.js';

const T = (n) => createNumberTarget(n);

const OBSERVATION = {
  observationId: 'obs-spin-1-1',
  predictionId: 'p-001',
  outcomeId: 'o-001',
  spinId: 'spin-1',
  target: T('17'),
  rawConsensusScore: 0.72,
  calibration: null,
  observedOutcome: 1,
  predictionCreatedAt: '2026-01-01T00:00:00.000Z',
  outcomeRecordedAt: '2026-01-01T00:00:05.000Z',
  observationCreatedAt: '2026-01-01T00:00:05.000Z',
};

// ── PredictionTargetEvaluator ────────────────────────────────────────────

describe('PredictionTargetEvaluator', () => {
  it('evaluates NUMBER targets as strict string equality (hit = 1)', () => {
    expect(evaluatePredictionTarget(T('0'), '0')).toBe(1);
    expect(evaluatePredictionTarget(T('00'), '00')).toBe(1);
    expect(evaluatePredictionTarget(T('1'), '1')).toBe(1);
    expect(evaluatePredictionTarget(T('36'), '36')).toBe(1);
    expect(evaluatePredictionTarget(T('23'), '23')).toBe(1);
  });

  it('keeps 0 and 00 distinct (strict string equality, miss = 0)', () => {
    expect(evaluatePredictionTarget(T('0'), '00')).toBe(0);
    expect(evaluatePredictionTarget(T('00'), '0')).toBe(0);
    expect(evaluatePredictionTarget(T('23'), '5')).toBe(0);
    expect(evaluatePredictionTarget(T('5'), '23')).toBe(0);
  });

  it('rejects unsupported target types with UnsupportedPredictionTargetError', () => {
    try {
      evaluatePredictionTarget({ type: 'COLOR', value: 'red' }, '17');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedPredictionTargetError);
      expect(err.code).toBe('UNSUPPORTED_PREDICTION_TARGET');
      expect(err.supportedTargets).toEqual(['NUMBER']);
    }
  });

  it('rejects malformed targets with InvalidPredictionTargetError', () => {
    for (const bad of [null, undefined, '17', {}, { type: 'NUMBER' }, { type: 'NUMBER', value: '99' }]) {
      expect(() => evaluatePredictionTarget(bad, '17')).toThrow(InvalidPredictionTargetError);
    }
  });

  it('rejects invalid winning numbers with InvalidWinningNumberError', () => {
    for (const bad of [null, undefined, '99', '', 17, '0.5']) {
      expect(() => evaluatePredictionTarget(T('17'), bad)).toThrow(InvalidWinningNumberError);
    }
  });

  it('exposes the frozen supported-target list', () => {
    expect(Object.isFrozen(SUPPORTED_PREDICTION_TARGETS)).toBe(true);
    expect(SUPPORTED_PREDICTION_TARGETS).toEqual(['NUMBER']);
  });
});

// ── CalibrationObservation ───────────────────────────────────────────────

describe('CalibrationObservation', () => {
  it('creates a complete observation with all contract fields', () => {
    const obs = createCalibrationObservation(OBSERVATION);
    expect(obs.schemaVersion).toBe('1');
    expect(obs.observationId).toBe('obs-spin-1-1');
    expect(obs.predictionId).toBe('p-001');
    expect(obs.outcomeId).toBe('o-001');
    expect(obs.spinId).toBe('spin-1');
    expect(obs.target).toEqual({ type: 'NUMBER', value: '17' });
    expect(obs.rawConsensusScore).toBe(0.72);
    expect(obs.calibration).toBeNull();
    expect(obs.observedOutcome).toBe(1);
    expect(obs.predictionCreatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(obs.outcomeRecordedAt).toBe('2026-01-01T00:00:05.000Z');
    expect(obs.observationCreatedAt).toBe('2026-01-01T00:00:05.000Z');
    expect(obs.metadata).toBeNull();
  });

  it('supports calibrated observations', () => {
    const obs = createCalibrationObservation({
      ...OBSERVATION,
      calibration: {
        probability: 0.68,
        strategyName: 'identity',
        modelId: '1.2.3',
      },
    });
    expect(obs.calibration).toEqual({ probability: 0.68, strategyName: 'identity', modelId: '1.2.3', modelHash: undefined });
  });

  it('is deeply immutable (target, calibration and metadata frozen)', () => {
    const obs = createCalibrationObservation({
      ...OBSERVATION,
      calibration: { probability: 0.68, strategyName: 'identity' },
      metadata: { source: 'test' },
    });
    expect(Object.isFrozen(obs)).toBe(true);
    expect(Object.isFrozen(obs.target)).toBe(true);
    expect(Object.isFrozen(obs.calibration)).toBe(true);
    expect(Object.isFrozen(obs.metadata)).toBe(true);
  });

  it('exposes a stable schema version', () => {
    expect(CALIBRATION_OBSERVATION_SCHEMA_VERSION).toBe('1');
    expect(createCalibrationObservation(OBSERVATION).schemaVersion).toBe(CALIBRATION_OBSERVATION_SCHEMA_VERSION);
  });

  it('rejects unsupported schema versions', () => {
    expect(() => createCalibrationObservation({ ...OBSERVATION, schemaVersion: '2' })).toThrow(
      InvalidCalibrationObservationError,
    );
  });

  it('rejects observedOutcome outside {0, 1}', () => {
    for (const bad of [2, -1, '1', null, undefined, 0.5]) {
      expect(() => createCalibrationObservation({ ...OBSERVATION, observedOutcome: bad })).toThrow(
        InvalidCalibrationObservationError,
      );
    }
  });

  it('rejects invalid rawConsensusScore with InvalidConsensusScoreError', () => {
    for (const bad of [1.5, -0.1, NaN, Infinity, '0.5', null]) {
      expect(() => createCalibrationObservation({ ...OBSERVATION, rawConsensusScore: bad })).toThrow(
        InvalidConsensusScoreError,
      );
    }
  });

  it('normalises metadata to null when omitted', () => {
    const obs = createCalibrationObservation({ ...OBSERVATION, metadata: undefined });
    expect(obs.metadata).toBeNull();
  });

  it('getEffectiveProbability prefers calibration.probability, falls back to rawConsensusScore', () => {
    const calibrated = createCalibrationObservation({
      ...OBSERVATION,
      calibration: { probability: 0.68, strategyName: 'identity' },
    });
    const rawOnly = createCalibrationObservation(OBSERVATION);
    expect(getEffectiveProbability(calibrated)).toBe(0.68);
    expect(getEffectiveProbability(rawOnly)).toBe(0.72);
  });
});

// ── ObservationIdentity ──────────────────────────────────────────────────

describe('ObservationIdentity', () => {
  it('accepts safe observation ids', () => {
    for (const id of ['obs-1', 'obs.spin_1-2', 'OBS123', 'obs-s1-01']) {
      expect(isValidObservationId(id)).toBe(true);
      expect(assertValidObservationId(id)).toBe(id);
    }
  });

  it('rejects unsafe observation ids', () => {
    for (const bad of ['', ' obs', 'obs id', 'obs:1', 'obs::x', 'obs/1', null, undefined, 42, 'áé']) {
      expect(isValidObservationId(bad)).toBe(false);
      expect(() => assertValidObservationId(bad)).toThrow(InvalidObservationIdError);
    }
  });

  it('generates deterministic sequential ids (1-based)', () => {
    expect(createSequentialObservationId('spin-1', 0)).toBe('obs-spin-1-1');
    expect(createSequentialObservationId('spin-1', 1)).toBe('obs-spin-1-2');
    expect(createSequentialObservationId('spin-1', 2)).toBe('obs-spin-1-3');
  });
});
