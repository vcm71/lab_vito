/**
 * Mapper tests — ConsensusToPredictionMapper (Fase 2.3.2).
 *
 * Covers:
 * - Full mapping of a calibrated consensus output → PredictionRecord
 * - createdAt resolution (explicit wins, falls back to appliedAt)
 * - Calibration mapping (probability, strategyName, modelId ← modelVersion)
 * - Missing/ambiguous targets, invalid entries, missing context
 * - Side-effect freedom (never mutates the input, never persists)
 */

import { describe, it, expect } from 'vitest';
import {
  ConsensusToPredictionMapper,
  createNumberTarget,
  InvalidConsensusOutputError,
  InvalidPredictionTargetError,
} from '../../src/historical-evidence/index.js';

const entry = (overrides = {}) => ({
  number: '17',
  rawConsensusScore: 0.72,
  calibratedProbability: 0.68,
  valid: true,
  invalidReason: null,
  calibration: {
    name: 'identity',
    strategyVersion: '1.0.0',
    trainingDataset: 'ds-v1',
    trainedAt: '2026-01-01T00:00:00.000Z',
    modelVersion: '1.2.3',
    calibrationVersion: '1.0.0',
  },
  ...overrides,
});

const consensusOutput = (overrides = {}) => ({
  numbers: { '17': entry() },
  metadata: {
    consensus: { appliedAt: '2026-01-01T00:00:01.000Z', schemaVersion: '2', mode: 'win-win' },
    calibration: { strategyName: 'identity' },
  },
  ...overrides,
});

const BASE = { consensusOutput: consensusOutput(), predictionId: 'p-001', spinId: 'spin-1', number: '17' };

describe('ConsensusToPredictionMapper', () => {
  const mapper = new ConsensusToPredictionMapper();

  it('maps a calibrated entry into a complete PredictionRecord', () => {
    const record = mapper.map(BASE);

    expect(record.predictionId).toBe('p-001');
    expect(record.spinId).toBe('spin-1');
    expect(record.target).toEqual({ type: 'NUMBER', value: '17' });
    expect(record.rawConsensusScore).toBe(0.72);
    expect(record.calibration).toEqual({
      probability: 0.68,
      strategyName: 'identity',
      modelId: '1.2.3',
      modelHash: undefined,
    });
    expect(record.createdAt).toBe('2026-01-01T00:00:01.000Z');
    expect(Object.isFrozen(record)).toBe(true);
  });

  it('lets an explicit createdAt win over metadata.consensus.appliedAt', () => {
    const record = mapper.map({ ...BASE, createdAt: '2026-01-01T00:00:09.000Z' });
    expect(record.createdAt).toBe('2026-01-01T00:00:09.000Z');
  });

  it('maps a non-calibrated output (calibration = null)', () => {
    const record = mapper.map({
      ...BASE,
      consensusOutput: consensusOutput({ numbers: { '17': entry({ calibratedProbability: null, calibration: null }) } }),
    });
    expect(record.calibration).toBeNull();
    expect(record.rawConsensusScore).toBe(0.72);
  });

  it('supports an explicit target object (wins over ambiguity)', () => {
    // number '5' would not resolve; the explicit target '17' must win.
    const record = mapper.map({ ...BASE, number: '5', target: createNumberTarget('17') });
    expect(record.target.value).toBe('17');
  });

  it('supports the `number` shortcut when target is omitted', () => {
    const record = mapper.map({ ...BASE, number: '17', target: undefined });
    expect(record.target.value).toBe('17');
  });

  it('rejects an entry absent from the output (NUMBER_NOT_IN_OUTPUT)', () => {
    try {
      mapper.map({ ...BASE, number: '5' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConsensusOutputError);
      expect(err.code).toBe('NUMBER_NOT_IN_OUTPUT');
    }
  });

  it('rejects invalid entries (INVALID_ENTRY)', () => {
    try {
      mapper.map({
        ...BASE,
        consensusOutput: consensusOutput({ numbers: { '17': entry({ valid: false, invalidReason: 'below threshold' }) } }),
      });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConsensusOutputError);
      expect(err.code).toBe('INVALID_ENTRY');
    }
  });

  it('rejects a missing target/number (InvalidPredictionTargetError)', () => {
    expect(() => mapper.map({ ...BASE, number: undefined, target: undefined })).toThrow(InvalidPredictionTargetError);
  });

  it('rejects a non-NUMBER explicit target (TARGET_REQUIRED)', () => {
    try {
      mapper.map({ ...BASE, target: { type: 'COLOR', value: 'red' } });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConsensusOutputError);
      expect(err.code).toBe('TARGET_REQUIRED');
    }
  });

  it('rejects a malformed consensus output', () => {
    for (const bad of [null, undefined, 'output', [], { numbers: null }, { numbers: [] }]) {
      expect(() => mapper.map({ ...BASE, consensusOutput: bad })).toThrow(InvalidConsensusOutputError);
    }
  });

  it('requires predictionId (PREDICTION_ID_REQUIRED)', () => {
    try {
      mapper.map({ ...BASE, predictionId: undefined });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConsensusOutputError);
      expect(err.code).toBe('PREDICTION_ID_REQUIRED');
    }
  });

  it('requires spinId (SPIN_REQUIRED)', () => {
    try {
      mapper.map({ ...BASE, spinId: undefined });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConsensusOutputError);
      expect(err.code).toBe('SPIN_REQUIRED');
    }
  });

  it('requires a timestamp when no createdAt and no appliedAt (TIMESTAMP_REQUIRED)', () => {
    try {
      mapper.map({
        ...BASE,
        createdAt: undefined,
        consensusOutput: consensusOutput({ metadata: { consensus: {} } }),
      });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidConsensusOutputError);
      expect(err.code).toBe('TIMESTAMP_REQUIRED');
    }
  });

  it('never mutates the consensus output (no side effects)', () => {
    const output = consensusOutput();
    const before = JSON.stringify(output);
    mapper.map({ ...BASE, consensusOutput: output, metadata: { source: 'test' } });
    expect(JSON.stringify(output)).toBe(before);
  });
});
