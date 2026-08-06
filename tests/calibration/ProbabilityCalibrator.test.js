/**
 * Fase 2.2 Part I — ProbabilityCalibrator tests.
 *
 * Covers:
 *   1. IdentityCalibration behaviour
 *   2. Deep Clone — immutability of input
 *   3. Determinism — same input → same output
 *   4. Strategy Registry — register / unregister / get / list / default
 *   5. Versioning — CalibrationVersion
 *   6. Contracts — Input/Output validation
 *   7. Serialization — JSON-safe, no NaN/Infinity/Map/Set
 *   8. Error handling — strict/tolerant mode
 *   9. Strategy interface — all strategies expose same contract
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  ProbabilityCalibrator,
  IdentityCalibration,
  CalibrationStrategyRegistry,
  CalibrationVersion,
  validateCalibrationInput,
} from '../../src/calibration/index.js';
import { CalibrationStrategy } from '../../src/calibration/strategies/CalibrationStrategy.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function entry(overrides = {}) {
  return {
    number: '17',
    rawConsensusScore: 0.72,
    valid: true,
    invalidReason: null,
    engineScores: {},
    engineContributions: {},
    agreement: { score: 0.85, calculable: true, reason: null, dispersion: 0.1, engineCount: 3 },
    conflicts: [],
    confidence: { score: 0.7, level: 'MEDIUM', components: { coverage: 1, participation: 1, agreement: 0.85, conflictPenalty: 1 } },
    coverage: { configuredEngines: 3, participatingEngines: 3, configuredWeight: 3, availableWeight: 3, coverageRatio: 1 },
    explanation: { summaryCode: 'HIGH_CONSENSUS', dominantEngine: null, dominantSignals: [], positiveFactors: [], limitingFactors: [], warningCodes: [] },
    ...overrides,
  };
}

function makeInput(numbers = {}) {
  const nums = {};
  for (const [num, overrides] of Object.entries(numbers)) {
    nums[num] = entry({ number: num, ...overrides });
  }
  return {
    numbers: nums,
    metadata: {
      consensus: {
        appliedAt: '2026-07-30T12:00:00.000Z',
        schemaVersion: '1.0.0',
        mode: 'tolerant',
        aggregationStrategy: 'HIERARCHICAL_WEIGHTED_MEAN',
        missingPolicy: 'SKIP_SIGNAL',
        processedNumbers: Object.keys(nums).length,
        validNumbers: Object.keys(nums).length,
        invalidNumbers: 0,
        configurationVersion: 'consensus-default-v1',
        configurationSummary: {},
        warnings: [],
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. IdentityCalibration
// ═══════════════════════════════════════════════════════════════════════════════

describe('IdentityCalibration', () => {
  let strategy;

  beforeEach(() => {
    strategy = new IdentityCalibration();
  });

  it('passes rawConsensusScore through unchanged', () => {
    const result = strategy.calibrate(0.72);
    expect(result.calibratedProbability).toBe(0.72);
    expect(result.metadata.appliedStrategy).toBe('IdentityCalibration');
  });

  it('returns null for null input', () => {
    const result = strategy.calibrate(null);
    expect(result.calibratedProbability).toBeNull();
  });

  it('returns null for undefined input', () => {
    const result = strategy.calibrate(undefined);
    expect(result.calibratedProbability).toBeNull();
  });

  it('returns null for NaN input', () => {
    const result = strategy.calibrate(NaN);
    expect(result.calibratedProbability).toBeNull();
  });

  it('returns null for Infinity input', () => {
    const result = strategy.calibrate(Infinity);
    expect(result.calibratedProbability).toBeNull();
  });

  it('preserves 0 and 1 boundaries', () => {
    expect(strategy.calibrate(0).calibratedProbability).toBe(0);
    expect(strategy.calibrate(1).calibratedProbability).toBe(1);
  });

  it('attaches metadata to result', () => {
    const result = strategy.calibrate(0.5, { someContext: true });
    expect(result.metadata).toBeDefined();
    expect(result.metadata.appliedStrategy).toBe('IdentityCalibration');
    expect(result.metadata.description).toBeTruthy();
  });

  it('has correct strategy version', () => {
    expect(strategy.strategyVersion).toBe('1.0.0');
    expect(strategy.name).toBe('IdentityCalibration');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Deep Clone — Immutability
// ═══════════════════════════════════════════════════════════════════════════════

describe('Deep Clone / Immutability', () => {
  it('does not mutate the input object', () => {
    const input = makeInput({ '1': {}, '2': { rawConsensusScore: 0.5 } });
    const snapshot = JSON.stringify(input);
    const calibrator = new ProbabilityCalibrator();
    calibrator.calibrate(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('returns a structurally distinct object', () => {
    const input = makeInput({ '5': { rawConsensusScore: 0.8 } });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    expect(output).not.toBe(input);
    expect(output.numbers).not.toBe(input.numbers);
    expect(output.numbers['5']).not.toBe(input.numbers['5']);
  });

  it('modifying output does not affect input', () => {
    const input = makeInput({ '10': { rawConsensusScore: 0.3 } });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    output.numbers['10'].calibratedProbability = 999;
    expect(input.numbers['10'].rawConsensusScore).toBe(0.3);
    expect(input.numbers['10']).not.toHaveProperty('calibratedProbability');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Determinism
// ═══════════════════════════════════════════════════════════════════════════════

describe('Determinism', () => {
  it('same input produces identical output', () => {
    const input = makeInput({ '1': { rawConsensusScore: 0.5 }, '2': { rawConsensusScore: 0.8 } });
    const calibrator = new ProbabilityCalibrator();
    const a = calibrator.calibrate(input);
    const b = calibrator.calibrate(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('different inputs produce different output', () => {
    const a = makeInput({ '1': { rawConsensusScore: 0.1 } });
    const b = makeInput({ '1': { rawConsensusScore: 0.9 } });
    const calibrator = new ProbabilityCalibrator();
    const outA = calibrator.calibrate(a);
    const outB = calibrator.calibrate(b);
    expect(outA.numbers['1'].calibratedProbability).toBe(0.1);
    expect(outB.numbers['1'].calibratedProbability).toBe(0.9);
  });

  it('two calibrator instances with same config produce same output', () => {
    const input = makeInput({ '0': { rawConsensusScore: 0.4 } });
    const c1 = new ProbabilityCalibrator();
    const c2 = new ProbabilityCalibrator();
    expect(JSON.stringify(c1.calibrate(input))).toBe(JSON.stringify(c2.calibrate(input)));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Strategy Registry
// ═══════════════════════════════════════════════════════════════════════════════

describe('CalibrationStrategyRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new CalibrationStrategyRegistry();
  });

  it('starts with IdentityCalibration pre-registered', () => {
    expect(registry.size).toBe(1);
    expect(registry.list()).toContain('IdentityCalibration');
  });

  it('get returns IdentityCalibration', () => {
    const s = registry.get('IdentityCalibration');
    expect(s).toBeDefined();
    expect(s.name).toBe('IdentityCalibration');
  });

  it('default() returns IdentityCalibration', () => {
    expect(registry.default().name).toBe('IdentityCalibration');
  });

  it('register adds a new strategy', () => {
    const mock = new IdentityCalibration();
    Object.defineProperty(mock, 'name', { value: 'MockCalibration', writable: false });
    registry.register(mock);
    expect(registry.size).toBe(2);
    expect(registry.get('MockCalibration')).toBe(mock);
  });

  it('register overwrites existing by name', () => {
    const v2 = new IdentityCalibration();
    Object.defineProperty(v2, 'name', { value: 'IdentityCalibration', writable: false });
    registry.register(v2);
    expect(registry.size).toBe(1);
  });

  it('register rejects non-strategy objects', () => {
    expect(() => registry.register(null)).toThrow(TypeError);
    expect(() => registry.register({})).toThrow(TypeError);
    expect(() => registry.register({ name: '' })).toThrow(TypeError);
  });

  it('unregister removes a custom strategy', () => {
    const mock = new IdentityCalibration();
    Object.defineProperty(mock, 'name', { value: 'TempStrat', writable: false });
    registry.register(mock);
    expect(registry.unregister('TempStrat')).toBe(true);
    expect(registry.get('TempStrat')).toBeUndefined();
  });

  it('unregister on non-existent returns false', () => {
    expect(registry.unregister('nonexistent')).toBe(false);
  });

  it('cannot unregister IdentityCalibration', () => {
    expect(() => registry.unregister('IdentityCalibration')).toThrow(Error);
  });

  it('list returns all names', () => {
    const mock = new IdentityCalibration();
    Object.defineProperty(mock, 'name', { value: 'B', writable: false });
    registry.register(mock);
    expect(registry.list()).toEqual(expect.arrayContaining(['IdentityCalibration', 'B']));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Versioning — CalibrationVersion
// ═══════════════════════════════════════════════════════════════════════════════

describe('CalibrationVersion', () => {
  it('creates a version with major.minor.patch', () => {
    const v = new CalibrationVersion(1, 0, 0);
    expect(v.major).toBe(1);
    expect(v.minor).toBe(0);
    expect(v.patch).toBe(0);
    expect(v.label).toBeNull();
  });

  it('creates a version with label', () => {
    const v = new CalibrationVersion(2, 1, 3, 'alpha');
    expect(v.label).toBe('alpha');
    expect(v.toString()).toBe('2.1.3-alpha');
  });

  it('toString() formats correctly', () => {
    expect(new CalibrationVersion(1, 0, 0).toString()).toBe('1.0.0');
    expect(new CalibrationVersion(1, 1, 0, 'rc1').toString()).toBe('1.1.0-rc1');
  });

  it('parse() parses from string', () => {
    const v = CalibrationVersion.parse('2.1.3');
    expect(v.major).toBe(2);
    expect(v.minor).toBe(1);
    expect(v.patch).toBe(3);
    expect(v.label).toBeNull();
  });

  it('parse() handles labels', () => {
    const v = CalibrationVersion.parse('3.0.0-beta');
    expect(v.label).toBe('beta');
  });

  it('parse() rejects invalid strings', () => {
    expect(() => CalibrationVersion.parse('')).toThrow();
    expect(() => CalibrationVersion.parse('not-semver')).toThrow();
    expect(() => CalibrationVersion.parse('1.0')).toThrow();
  });

  it('equals() compares versions correctly', () => {
    const a = new CalibrationVersion(1, 0, 0);
    const b = new CalibrationVersion(1, 0, 0);
    const c = new CalibrationVersion(1, 0, 1);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(null)).toBe(false);
  });

  it('isCompatible() checks major version match', () => {
    const v1 = CalibrationVersion.parse('1.0.0');
    const v2 = CalibrationVersion.parse('1.5.3');
    const v3 = CalibrationVersion.parse('2.0.0');
    expect(CalibrationVersion.isCompatible(v1, v2)).toBe(true);
    expect(CalibrationVersion.isCompatible(v1, v3)).toBe(false);
  });

  it('constructor rejects negative versions', () => {
    expect(() => new CalibrationVersion(-1, 0, 0)).toThrow(TypeError);
  });

  it('constructor rejects non-integer versions', () => {
    expect(() => new CalibrationVersion(1.5, 0, 0)).toThrow(TypeError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Contracts — Input/Output validation
// ═══════════════════════════════════════════════════════════════════════════════

describe('CalibrationInputValidator (contracts)', () => {
  it('validates a proper ConsensusEngine output', () => {
    const input = makeInput({ '1': {} });
    const result = validateCalibrationInput(input, 'tolerant');
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('rejects null input', () => {
    const result = validateCalibrationInput(null, 'tolerant');
    expect(result.valid).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = validateCalibrationInput('string', 'tolerant');
    expect(result.valid).toBe(false);
  });

  it('rejects input without .numbers', () => {
    const result = validateCalibrationInput({ metadata: {} }, 'tolerant');
    expect(result.valid).toBe(false);
  });

  it('rejects input without .metadata.consensus', () => {
    const result = validateCalibrationInput({ numbers: {}, metadata: {} }, 'tolerant');
    expect(result.valid).toBe(false);
  });

  it('rejects entry missing required fields', () => {
    const input = makeInput({ '1': {} });
    delete input.numbers['1'].rawConsensusScore;
    delete input.numbers['1'].coverage;
    const result = validateCalibrationInput(input, 'tolerant');
    expect(result.valid).toBe(false);
  });

  it('rejects entry with wrong rawConsensusScore type', () => {
    const input = makeInput({ '1': { rawConsensusScore: 'high' } });
    const result = validateCalibrationInput(input, 'tolerant');
    expect(result.valid).toBe(false);
  });

  it('accepts null rawConsensusScore', () => {
    const input = makeInput({ '1': { rawConsensusScore: null } });
    const result = validateCalibrationInput(input, 'tolerant');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid entry (not an object)', () => {
    const input = { numbers: { '1': 'not-an-object' }, metadata: { consensus: {} } };
    const result = validateCalibrationInput(input, 'tolerant');
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Serialization
// ═══════════════════════════════════════════════════════════════════════════════

describe('Serialization', () => {
  it('output is JSON-serializable', () => {
    const input = makeInput({ '17': { rawConsensusScore: 0.72 }, '25': { rawConsensusScore: 0.15 } });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json);
    expect(parsed.numbers['17'].calibratedProbability).toBe(0.72);
    expect(parsed.numbers['25'].calibratedProbability).toBe(0.15);
  });

  it('output contains no NaN values', () => {
    const input = makeInput({ '00': { rawConsensusScore: null, valid: false, invalidReason: 'INSUFFICIENT_EVIDENCE' } });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    const json = JSON.stringify(output);
    expect(json).not.toContain('NaN');
    expect(json).not.toContain('Infinity');
  });

  it('output contains no Map/Set/function references', () => {
    const input = makeInput({ '1': {} });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    const json = JSON.stringify(output);
    // If Map/Set/function leaked through, they'd serialize as {} or be lost
    const parsed = JSON.parse(json);
    expect(parsed.numbers['1'].calibration.name).toBe('IdentityCalibration');
  });

  it('handles all roulette numbers (0, 00, 1-36)', () => {
    const nums = {};
    for (const n of ['0', '00', '1', '17', '36']) {
      nums[n] = { rawConsensusScore: 0.5 };
    }
    const input = makeInput(nums);
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    const json = JSON.stringify(output);
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed.numbers)).toHaveLength(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Error handling — strict vs tolerant
// ═══════════════════════════════════════════════════════════════════════════════

describe('Error handling (strict vs tolerant)', () => {
  it('tolerant mode returns output even with invalid entries', () => {
    const input = makeInput({
      '1': { rawConsensusScore: 0.5 },
    });
    // Make entry invalid
    input.numbers['1'].rawConsensusScore = 'bad';
    const calibrator = new ProbabilityCalibrator({ mode: 'tolerant' });
    // Input validation catches it but tolerant mode doesn't throw
    const output = calibrator.calibrate(input);
    expect(output).toBeDefined();
  });

  it('strict mode rejects unknown mode', () => {
    expect(() => new ProbabilityCalibrator({ mode: 'strict' })).not.toThrow();
    expect(() => new ProbabilityCalibrator({ mode: 'invalid' })).toThrow(Error);
  });

  it('strategy not found throws in calibrate', () => {
    const input = makeInput({ '1': {} });
    const calibrator = new ProbabilityCalibrator();
    expect(() => calibrator.calibrate(input, 'NonExistentStrategy')).toThrow(Error);
  });

  it('null strategy name falls back to default', () => {
    const input = makeInput({ '1': {} });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input, null);
    expect(output.numbers['1'].calibration.name).toBe('IdentityCalibration');
  });

  it('no failures are silent', () => {
    const calibrator = new ProbabilityCalibrator();
    // When strategy is missing, an error is thrown (not swallowed)
    const input = makeInput({ '1': {} });
    expect(() => calibrator.calibrate(input, 'Ghost')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Strategy interface — all strategies share same contract
// ═══════════════════════════════════════════════════════════════════════════════

describe('Strategy interface contract', () => {
  it('IdentityCalibration extends CalibrationStrategy', () => {
    const s = new IdentityCalibration();
    expect(s).toBeInstanceOf(CalibrationStrategy);
  });

  it('CalibrationStrategy base throws on calibrate()', () => {
    const base = new CalibrationStrategy('Base', '1.0.0');
    expect(() => base.calibrate(0.5)).toThrow();
  });

  it('getMeta() returns correct fields', () => {
    const s = new IdentityCalibration();
    const meta = s.getMeta();
    expect(meta).toHaveProperty('name', 'IdentityCalibration');
    expect(meta).toHaveProperty('strategyVersion', '1.0.0');
    expect(meta).toHaveProperty('trainingDataset');
    expect(meta).toHaveProperty('trainedAt');
    expect(meta).toHaveProperty('modelVersion');
    expect(meta).toHaveProperty('calibrationVersion');
  });

  it('getMeta() accepts overrides', () => {
    const s = new IdentityCalibration();
    const meta = s.getMeta({
      trainingDataset: 'hist-2026-Q3',
      trainedAt: '2026-07-30T12:00:00Z',
    });
    expect(meta.trainingDataset).toBe('hist-2026-Q3');
    expect(meta.trainedAt).toBe('2026-07-30T12:00:00Z');
  });

  it('custom strategies can extend CalibrationStrategy', () => {
    class TestStrat extends CalibrationStrategy {
      constructor() { super('TestStrat', '0.1.0'); }
      calibrate(score) {
        return { calibratedProbability: Math.min(1, (score || 0) * 1.1), metadata: {} };
      }
    }
    const s = new TestStrat();
    expect(s.name).toBe('TestStrat');
    expect(s.calibrate(0.5).calibratedProbability).toBe(0.55);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. End-to-end: ProbabilityCalibrator full pipeline
// ═══════════════════════════════════════════════════════════════════════════════

describe('ProbabilityCalibrator (full pipeline)', () => {
  it('calibrates all numbers in input', () => {
    const input = makeInput({
      '1': { rawConsensusScore: 0.8 },
      '2': { rawConsensusScore: 0.3 },
      '3': { rawConsensusScore: 0.95 },
    });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    expect(Object.keys(output.numbers)).toHaveLength(3);
    expect(output.numbers['1'].calibratedProbability).toBe(0.8);
    expect(output.numbers['2'].calibratedProbability).toBe(0.3);
  });

  it('preserves all input fields in output', () => {
    const input = makeInput({ '7': { rawConsensusScore: 0.6 } });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    const out = output.numbers['7'];
    expect(out).toHaveProperty('number', '7');
    expect(out).toHaveProperty('rawConsensusScore', 0.6);
    expect(out).toHaveProperty('calibratedProbability', 0.6);
    expect(out).toHaveProperty('engineScores');
    expect(out).toHaveProperty('engineContributions');
    expect(out).toHaveProperty('agreement');
    expect(out).toHaveProperty('conflicts');
    expect(out).toHaveProperty('confidence');
    expect(out).toHaveProperty('coverage');
    expect(out).toHaveProperty('explanation');
    expect(out).toHaveProperty('calibration');
  });

  it('output metadata includes calibration section', () => {
    const input = makeInput({ '1': {} });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    expect(output.metadata.calibration).toBeDefined();
    expect(output.metadata.calibration.strategy).toBe('IdentityCalibration');
    expect(output.metadata.calibration.strategyVersion).toBe('1.0.0');
    expect(output.metadata.calibration.processedNumbers).toBe(1);
  });

  it('output metadata preserves consensus section', () => {
    const input = makeInput({ '1': {} });
    const calibrator = new ProbabilityCalibrator();
    const output = calibrator.calibrate(input);
    expect(output.metadata.consensus).toBeDefined();
    expect(output.metadata.consensus.schemaVersion).toBe('1.0.0');
  });

  it('configurable strategy via registry', () => {
    const registry = new CalibrationStrategyRegistry();
    const calibrator = new ProbabilityCalibrator({ registry });
    const input = makeInput({ '1': {} });
    const output = calibrator.calibrate(input, 'IdentityCalibration');
    expect(output.numbers['1'].calibration.name).toBe('IdentityCalibration');
  });
});
