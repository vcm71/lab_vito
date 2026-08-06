/**
 * Domain tests — hardened contracts (Fase 2.3.1.1).
 *
 * Covers:
 * - RouletteNumber: canonical validation
 * - PredictionTarget: NUMBER type, extensible, error on invalid
 * - PredictionRecord: mandatory rawConsensusScore, nested calibration, target
 * - SpinOutcomeRecord: winningNumber, no observedOutcome
 * - EvidenceStatus: PENDING_OUTCOME / COMPLETED / EMPTY, deprecated aliases
 * - deepFreeze: nested immutability, rejection of unsafe types
 * - chronology: temporal anti-leakage
 * - errors: new error classes
 * - metadata: normaliseMetadata
 */

import { describe, it, expect } from 'vitest';
import {
  createPredictionRecord,
  createSpinOutcomeRecord,
  createOutcomeRecord,
  EvidenceStatus,
  determineStatus,
  isValidAmericanRouletteNumber,
  createNumberTarget,
  deepFreeze,
  normaliseMetadata,
  validateChronology,
  InvalidConsensusScoreError,
  InvalidWinningNumberError,
  InvalidPredictionTargetError,
  TemporalEvidenceLeakageError,
} from '../../src/historical-evidence/index.js';

// ═══════════════════════════════════════════════════════════════════════
// RouletteNumber
// ═══════════════════════════════════════════════════════════════════════

describe('RouletteNumber', () => {
  it('accepts valid strings "0"–"36" and "00"', () => {
    expect(isValidAmericanRouletteNumber('0')).toBe(true);
    expect(isValidAmericanRouletteNumber('00')).toBe(true);
    expect(isValidAmericanRouletteNumber('1')).toBe(true);
    expect(isValidAmericanRouletteNumber('17')).toBe(true);
    expect(isValidAmericanRouletteNumber('36')).toBe(true);
  });

  it('rejects numbers (no coercion)', () => {
    expect(isValidAmericanRouletteNumber(0)).toBe(false);
    expect(isValidAmericanRouletteNumber(17)).toBe(false);
    expect(isValidAmericanRouletteNumber(36)).toBe(false);
  });

  it('rejects invalid strings', () => {
    expect(isValidAmericanRouletteNumber('37')).toBe(false);
    expect(isValidAmericanRouletteNumber('-1')).toBe(false);
    expect(isValidAmericanRouletteNumber('01')).toBe(false);
    expect(isValidAmericanRouletteNumber('')).toBe(false);
    expect(isValidAmericanRouletteNumber('red')).toBe(false);
  });

  it('rejects null, undefined, objects', () => {
    expect(isValidAmericanRouletteNumber(null)).toBe(false);
    expect(isValidAmericanRouletteNumber(undefined)).toBe(false);
    expect(isValidAmericanRouletteNumber({})).toBe(false);
    expect(isValidAmericanRouletteNumber([])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PredictionTarget
// ═══════════════════════════════════════════════════════════════════════

describe('PredictionTarget', () => {
  it('creates NUMBER target for valid numbers', () => {
    const t = createNumberTarget('17');
    expect(t.type).toBe('NUMBER');
    expect(t.value).toBe('17');
  });

  it('supports "0" and "00"', () => {
    expect(createNumberTarget('0').value).toBe('0');
    expect(createNumberTarget('00').value).toBe('00');
  });

  it('throws InvalidPredictionTargetError for invalid number', () => {
    expect(() => createNumberTarget('37')).toThrow(InvalidPredictionTargetError);
    expect(() => createNumberTarget('')).toThrow(InvalidPredictionTargetError);
    expect(() => createNumberTarget(null)).toThrow(InvalidPredictionTargetError);
    expect(() => createNumberTarget(17)).toThrow(InvalidPredictionTargetError);
  });

  it('targets are deeply frozen', () => {
    const t = createNumberTarget('23');
    expect(Object.isFrozen(t)).toBe(true);
    expect(() => { t.value = '3'; }).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PredictionRecord (hardened)
// ═══════════════════════════════════════════════════════════════════════

describe('PredictionRecord (hardened)', () => {
  const base = {
    predictionId: 'p-001',
    spinId: 'spin-001',
    target: createNumberTarget('17'),
    rawConsensusScore: 0.72,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('creates a valid record with required fields', () => {
    const r = createPredictionRecord(base);
    expect(r.predictionId).toBe('p-001');
    expect(r.spinId).toBe('spin-001');
    expect(r.target.type).toBe('NUMBER');
    expect(r.target.value).toBe('17');
    expect(r.rawConsensusScore).toBe(0.72);
    expect(r.calibration).toBeNull();
    expect(r.metadata).toBeNull();
    expect(r.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('accepts nested calibration object', () => {
    const r = createPredictionRecord({
      ...base,
      calibration: { probability: 0.68, strategyName: 'Platt', modelId: 'm1', modelHash: 'abc123' },
    });
    expect(r.calibration).not.toBeNull();
    expect(r.calibration.probability).toBe(0.68);
    expect(r.calibration.strategyName).toBe('Platt');
    expect(r.calibration.modelId).toBe('m1');
    expect(r.calibration.modelHash).toBe('abc123');
  });

  it('rejects rawConsensusScore as optional/null — must be mandatory', () => {
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: null }))
      .toThrow(InvalidConsensusScoreError);
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: undefined }))
      .toThrow(InvalidConsensusScoreError);
  });

  it('rejects rawConsensusScore out of [0,1]', () => {
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: 1.1 }))
      .toThrow(InvalidConsensusScoreError);
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: -0.1 }))
      .toThrow(InvalidConsensusScoreError);
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: NaN }))
      .toThrow(InvalidConsensusScoreError);
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: Infinity }))
      .toThrow(InvalidConsensusScoreError);
  });

  it('accepts boundary scores 0 and 1', () => {
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: 0 })).not.toThrow();
    expect(() => createPredictionRecord({ ...base, rawConsensusScore: 1 })).not.toThrow();
  });

  it('accepts metadata as a safe plain object', () => {
    const r = createPredictionRecord({ ...base, metadata: { source: 'test', version: 2 } });
    expect(r.metadata).toEqual({ source: 'test', version: 2 });
  });

  it('rejects Metadata with unsafe keys', () => {
    expect(() => createPredictionRecord({ ...base, metadata: { __proto__: {} } }))
      .toThrow();
  });

  it('record is deeply frozen', () => {
    const r = createPredictionRecord({
      ...base,
      calibration: { probability: 0.5, strategyName: 'Identity' },
      metadata: { tag: 'x' },
    });
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.target)).toBe(true);
    expect(Object.isFrozen(r.calibration)).toBe(true);
    expect(Object.isFrozen(r.metadata)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SpinOutcomeRecord (hardened)
// ═══════════════════════════════════════════════════════════════════════

describe('SpinOutcomeRecord (hardened)', () => {
  const base = {
    outcomeId: 'o-001',
    spinId: 'spin-001',
    winningNumber: '17',
    recordedAt: '2026-01-01T00:00:01.000Z',
  };

  it('creates a valid record', () => {
    const r = createSpinOutcomeRecord(base);
    expect(r.outcomeId).toBe('o-001');
    expect(r.spinId).toBe('spin-001');
    expect(r.winningNumber).toBe('17');
    expect(r.recordedAt).toBe('2026-01-01T00:00:01.000Z');
    expect(r.metadata).toBeNull();
  });

  it('accepts "0" and "00" as winning numbers', () => {
    expect(createSpinOutcomeRecord({ ...base, winningNumber: '0' }).winningNumber).toBe('0');
    expect(createSpinOutcomeRecord({ ...base, winningNumber: '00' }).winningNumber).toBe('00');
  });

  it('rejects invalid winning numbers', () => {
    expect(() => createSpinOutcomeRecord({ ...base, winningNumber: '37' }))
      .toThrow(InvalidWinningNumberError);
    expect(() => createSpinOutcomeRecord({ ...base, winningNumber: 17 }))
      .toThrow(InvalidWinningNumberError);
    expect(() => createSpinOutcomeRecord({ ...base, winningNumber: '' }))
      .toThrow(InvalidWinningNumberError);
  });

  it('is deeply frozen with metadata', () => {
    const r = createSpinOutcomeRecord({ ...base, metadata: { wheel: 'A' } });
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.metadata)).toBe(true);
  });

  describe('backward compat createOutcomeRecord', () => {
    it('maps number → winningNumber', () => {
      const r = createOutcomeRecord({
        outcomeId: 'o-dep',
        spinId: 'spin-001',
        number: '5',
        observedOutcome: 1,
        recordedAt: '2026-01-01T00:00:01.000Z',
      });
      expect(r.winningNumber).toBe('5');
      // observedOutcome is DISCARDED
      expect(r.observedOutcome).toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EvidenceStatus
// ═══════════════════════════════════════════════════════════════════════

describe('EvidenceStatus', () => {
  it('active states: PENDING_OUTCOME, COMPLETED, EMPTY', () => {
    expect(EvidenceStatus.PENDING_OUTCOME).toBe('PENDING_OUTCOME');
    expect(EvidenceStatus.COMPLETED).toBe('COMPLETED');
    expect(EvidenceStatus.EMPTY).toBe('EMPTY');
    expect(Object.isFrozen(EvidenceStatus)).toBe(true);
  });

  it('deprecated PENDING maps to PENDING_OUTCOME', () => {
    expect(EvidenceStatus.PENDING).toBe('PENDING_OUTCOME');
  });

  it('deprecated RESOLVED maps to COMPLETED', () => {
    expect(EvidenceStatus.RESOLVED).toBe('COMPLETED');
  });

  it('deprecated CONFLICT remains as string (never returned)', () => {
    expect(EvidenceStatus.CONFLICT).toBe('CONFLICT');
  });

  describe('determineStatus', () => {
    it('returns EMPTY when no predictions and no outcome', () => {
      const s = determineStatus([], null);
      expect(s).toBe(EvidenceStatus.EMPTY);
    });

    it('returns PENDING_OUTCOME when predictions exist but no outcome', () => {
      const s = determineStatus([{ id: 'p1' }], null);
      expect(s).toBe(EvidenceStatus.PENDING_OUTCOME);
    });

    it('returns COMPLETED when outcome exists', () => {
      const s = determineStatus([{ id: 'p1' }], { outcomeId: 'o1' });
      expect(s).toBe(EvidenceStatus.COMPLETED);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// deepFreeze
// ═══════════════════════════════════════════════════════════════════════

describe('deepFreeze', () => {
  it('freezes nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const frozen = deepFreeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.a.b)).toBe(true);
  });

  it('freezes arrays recursively', () => {
    const arr = [{ x: 1 }, { y: 2 }];
    const frozen = deepFreeze(arr);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen[0])).toBe(true);
    expect(Object.isFrozen(frozen[1])).toBe(true);
  });

  it('passes through primitives untouched', () => {
    expect(deepFreeze(null)).toBe(null);
    expect(deepFreeze(42)).toBe(42);
    expect(deepFreeze('hello')).toBe('hello');
    expect(deepFreeze(true)).toBe(true);
  });

  it('rejects functions', () => {
    expect(() => deepFreeze({ fn: () => {} })).toThrow('Functions are not allowed');
  });

  it('rejects symbols', () => {
    expect(() => deepFreeze({ [Symbol('x')]: 1 })).toThrow('Symbols');
  });

  it('rejects Map, Set, Date', () => {
    expect(() => deepFreeze(new Map())).toThrow('Map, Set, and Date');
    expect(() => deepFreeze(new Set())).toThrow('Map, Set, and Date');
    expect(() => deepFreeze(new Date())).toThrow('Map, Set, and Date');
  });

  it('rejects cyclical references', () => {
    const obj = { a: 1 };
    obj.self = obj;
    expect(() => deepFreeze(obj)).toThrow('cyclical reference');
  });

  it('rejects __proto__ key (shadowed prototype)', () => {
    // `{ __proto__: {} }` sets the prototype — detected as non-plain object
    expect(() => deepFreeze({ __proto__: {} })).toThrow('Only plain objects');
  });

  it('is idempotent on already frozen values', () => {
    const obj = Object.freeze({ x: Object.freeze({ y: 1 }) });
    expect(() => deepFreeze(obj)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// metadata normalisation
// ═══════════════════════════════════════════════════════════════════════

describe('normaliseMetadata', () => {
  it('returns null for undefined or null', () => {
    expect(normaliseMetadata(undefined)).toBeNull();
    expect(normaliseMetadata(null)).toBeNull();
  });

  it('deep-freezes a plain object', () => {
    const m = normaliseMetadata({ key: 'val', nested: { x: 1 } });
    expect(Object.isFrozen(m)).toBe(true);
    expect(Object.isFrozen(m.nested)).toBe(true);
  });

  it('rejects arrays as top-level metadata', () => {
    expect(() => normaliseMetadata([1, 2])).toThrow('plain object');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Temporal anti-leakage
// ═══════════════════════════════════════════════════════════════════════

describe('validateChronology', () => {
  it('passes when prediction <= outcome', () => {
    expect(() => validateChronology({
      spinId: 's1',
      predictionCreatedAt: '2026-01-01T00:00:00.000Z',
      outcomeRecordedAt: '2026-01-01T00:00:01.000Z',
    })).not.toThrow();
  });

  it('passes when prediction equals outcome (same ms)', () => {
    expect(() => validateChronology({
      spinId: 's1',
      predictionCreatedAt: '2026-01-01T00:00:00.000Z',
      outcomeRecordedAt: '2026-01-01T00:00:00.000Z',
    })).not.toThrow();
  });

  it('throws TemporalEvidenceLeakageError when prediction > outcome', () => {
    expect(() => validateChronology({
      spinId: 's1',
      predictionCreatedAt: '2026-01-01T00:00:02.000Z',
      outcomeRecordedAt: '2026-01-01T00:00:01.000Z',
    })).toThrow(TemporalEvidenceLeakageError);
  });

  it('throws on unparseable timestamps', () => {
    expect(() => validateChronology({
      spinId: 's1',
      predictionCreatedAt: 'garbage',
      outcomeRecordedAt: '2026-01-01T00:00:01.000Z',
    })).toThrow(TemporalEvidenceLeakageError);
  });
});
