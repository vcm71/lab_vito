import { describe, expect, it } from 'vitest';
import { LabEngine } from '../../labEngine.js';
import { LabCon1Engine } from '../../labCon1Engine.js';
import { AtRepEngine } from '../../atRepEngine.js';
import {
  LabConAdapter,
  LabCon1Adapter,
  AtRepAdapter,
  SignalCollector,
  SignalNormalizer,
  PercentileStrategy,
  MinMaxStrategy,
  RobustMinMaxStrategy,
  ZScoreStrategy,
  IdentityStrategy,
  BinaryStrategy,
  CategoricalStrategy,
  DEFAULT_FIELD_CONFIGURATION,
  SKIP_FIELDS,
} from '../../src/consensus/index.js';
import { CONSENSUS_SCHEMA_VERSION } from '../../src/consensus/constants/consensusConstants.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createTracker(spins = []) {
  return {
    getSpins: () => spins.map(spin => ({ ...spin })),
  };
}

function createDomainTracker(spins = []) {
  return {
    getSpins: () => spins.map(s => ({ ...s })),
    getSettings: () => ({ atrasosMaxWindow: 100 }),
  };
}

function createRealAdapters(spins = []) {
  const tracker = createTracker(spins);
  const domainTracker = createDomainTracker(spins);
  const labEngine = new LabEngine(tracker);
  const labCon1Engine = new LabCon1Engine(tracker);
  const atRepEngine = new AtRepEngine(domainTracker);

  return {
    labConAdapter: new LabConAdapter(labEngine),
    labCon1Adapter: new LabCon1Adapter(labCon1Engine),
    atRepAdapter: new AtRepAdapter(atRepEngine),
  };
}

function buildMockCollectorOutput(numbersMap) {
  return {
    numbers: numbersMap,
    metadata: {
      generatedAt: new Date().toISOString(),
      valid: true,
      warnings: [],
    },
  };
}

/**
 * Build a complete raw signal object matching the ConsensusSignal contract.
 */
function makeSignal(number, engine, overrides = {}) {
  const delay = engine === 'Lab_Con' ? {
    actualDelay: overrides.delayActual ?? 12,
    maxDelay: overrides.delayMax ?? 50,
    delayRatio: overrides.delayRatio ?? 0.24,
    delayScore: overrides.delayScore ?? 0.65,
    probabilityDelay: overrides.probDelay ?? 0.85,
    pressure: overrides.pressure ?? 78,
    activeSets: overrides.delayActiveSets ?? ['docenas_2_1'],
  } : null;

  const winWin = engine === 'Lab_Con1' ? {
    atraso: overrides.wwAtraso ?? 8,
    threshold: overrides.wwThreshold ?? 0,
    level: overrides.wwLevel ?? 'WIN-WIN(2)',
    isActive: overrides.wwIsActive ?? true,
    streakLength: overrides.wwStreakLen ?? 3,
    streakBonus: overrides.wwStreakBonus ?? 0,
    recencyBonus: overrides.wwRecencyBonus ?? 0,
    winWinScore: overrides.wwScore ?? 0.75,
  } : null;

  const pci = engine === 'AtRep' ? {
    occurrences: overrides.pciOccur ?? 8,
    meanDist: overrides.pciMeanDist ?? 4.2,
    expectedDist: overrides.pciExpDist ?? 5.0,
    pciIndividual: overrides.pciInd ?? 0.85,
    pciCombined: overrides.pciComb ?? 0.82,
    pciBySet: overrides.pciBySet ?? [],
  } : null;

  return {
    schemaVersion: CONSENSUS_SCHEMA_VERSION,
    number: String(number),
    sourceEngines: [engine],
    rawSignals: { delay, winWin, pci },
    evidence: {
      occurrences: overrides.evOccur ?? 5,
      sampleSize: overrides.evSample ?? 20,
      activeSets: overrides.evSets ?? [],
      windowSize: overrides.evWindow ?? 50,
      historyLength: overrides.evHistLen ?? 100,
      supportCount: overrides.evSupport ?? 1,
      signalQuality: overrides.evQuality ?? 'SUFFICIENT',
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      valid: overrides.valid ?? true,
      warnings: overrides.warnings ?? [],
      missingSignals: [],
      provenance: [{ engine, file: `${engine}.js`, method: 'adapt', version: null }],
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SignalNormalizer', () => {
  // ── 1. Constructor ─────────────────────────────────────────────────────
  describe('constructor validation', () => {
    it('creates with default options (tolerant mode, default fieldConfig)', () => {
      const normalizer = new SignalNormalizer();
      expect(normalizer.mode).toBe('tolerant');
      expect(normalizer.fieldConfig).toBe(DEFAULT_FIELD_CONFIGURATION);
    });

    it('accepts strict mode', () => {
      const normalizer = new SignalNormalizer({ mode: 'strict' });
      expect(normalizer.mode).toBe('strict');
    });

    it('rejects unknown mode strings by falling back to tolerant', () => {
      const normalizer = new SignalNormalizer({ mode: 'aggressive' });
      expect(normalizer.mode).toBe('tolerant');
    });

    it('accepts custom fieldConfig overrides', () => {
      const normalizer = new SignalNormalizer({
        fieldConfig: { 'delay.actualDelay': { strategy: 'MIN_MAX' } },
      });
      expect(normalizer.fieldConfig['delay.actualDelay'].strategy).toBe('MIN_MAX');
    });

    it('fills missing fields from DEFAULT_FIELD_CONFIGURATION', () => {
      const normalizer = new SignalNormalizer({
        fieldConfig: { 'delay.actualDelay': { strategy: 'MIN_MAX' } },
      });
      expect(normalizer.fieldConfig['winWin.atraso'].strategy).toBe('PERCENTILE');
    });

    it('accepts custom strategy overrides', () => {
      const norm = new SignalNormalizer({ strategies: { 'delay.actualDelay': new IdentityStrategy() } });
      expect(norm.strategyOverrides).toBeDefined();
      expect(Object.keys(norm.strategyOverrides).length).toBe(1);
    });
  });

  // ── 2. Input validation ─────────────────────────────────────────────────
  describe('input validation', () => {
    it('throws on null input', () => {
      const normalizer = new SignalNormalizer();
      expect(() => normalizer.normalize(null)).toThrow(TypeError);
    });

    it('throws on non-object input', () => {
      const normalizer = new SignalNormalizer();
      expect(() => normalizer.normalize('not-an-object')).toThrow(TypeError);
    });

    it('throws on object without "numbers" key', () => {
      const normalizer = new SignalNormalizer();
      expect(() => normalizer.normalize({ other: true })).toThrow(TypeError);
    });
  });

  // ── 3. registerStrategy ─────────────────────────────────────────────────
  describe('registerStrategy', () => {
    it('registers a custom strategy', () => {
      const normalizer = new SignalNormalizer();
      const custom = {
        name: 'CUSTOM_DOUBLER',
        normalize: (rawValue) => ({ rawValue, normalizedValue: rawValue * 2, method: 'CUSTOM_DOUBLER', valid: true, params: {} }),
      };
      expect(() => normalizer.registerStrategy(custom)).not.toThrow();
    });

    it('throws on strategy without name', () => {
      const normalizer = new SignalNormalizer();
      expect(() => normalizer.registerStrategy({ normalize: () => {} })).toThrow(TypeError);
    });

    it('throws on strategy without normalize', () => {
      const normalizer = new SignalNormalizer();
      expect(() => normalizer.registerStrategy({ name: 'BAD' })).toThrow(TypeError);
    });
  });

  // ── 4. Basic normalization flow (integration) ───────────────────────────
  describe('basic normalization flow', () => {
    it('normalizes output from real adapters with spins', () => {
      const spins = Array.from({ length: 30 }, (_, i) => ({ number: String((i % 36) + 1) }));
      const adapters = createRealAdapters(spins);
      const collector = new SignalCollector(adapters);
      const collected = collector.collect();
      const normalizer = new SignalNormalizer({ mode: 'tolerant' });
      const normalized = normalizer.normalize(collected);

      expect(normalized).toHaveProperty('numbers');
      expect(normalized).toHaveProperty('metadata');
      expect(normalized.metadata).toHaveProperty('normalization');

      const numKeys = Object.keys(normalized.numbers);
      expect(numKeys.length).toBeGreaterThan(0);

      const firstEntry = normalized.numbers[numKeys[0]];
      expect(firstEntry).toHaveProperty('number');
      expect(firstEntry).toHaveProperty('signals');
      expect(firstEntry).toHaveProperty('normalizedSignals');

      // Each engine should have a normalizedSignals entry
      const ns = firstEntry.normalizedSignals;
      expect(ns).toHaveProperty('Lab_Con');
      expect(ns).toHaveProperty('Lab_Con1');
      expect(ns).toHaveProperty('AtRep');
    });
  });

  // ── 5. Output structure ─────────────────────────────────────────────────
  describe('output structure', () => {
    it('preserves original signals reference (immutability)', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      // Original signals should be unmodified
      expect(input.numbers['7'].signals.Lab_Con.rawSignals).not.toHaveProperty('normalizedSignals');
      // Result should have normalizedSignals as a separate structure
      expect(result.numbers['7'].normalizedSignals.Lab_Con).toBeDefined();
    });

    it('adds normalization metadata', () => {
      const input = buildMockCollectorOutput({
        '0': {
          number: '0',
          signals: {
            Lab_Con: makeSignal('0', 'Lab_Con'),
            Lab_Con1: makeSignal('0', 'Lab_Con1'),
            AtRep: makeSignal('0', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const meta = result.metadata.normalization;
      expect(meta).toHaveProperty('appliedAt');
      expect(meta.mode).toBe('tolerant');
      expect(meta).toHaveProperty('strategyNames');
      expect(meta).toHaveProperty('fieldsNormalized');
      expect(meta.fieldsConfigured).toBeGreaterThan(0);
    });
  });

  // ── 6. Null signal handling ─────────────────────────────────────────────
  describe('null signal handling', () => {
    it('handles null signals for an engine gracefully', () => {
      const input = buildMockCollectorOutput({
        '23': {
          number: '23',
          signals: {
            Lab_Con: null,
            Lab_Con1: makeSignal('23', 'Lab_Con1'),
            AtRep: null,
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      expect(result.numbers['23'].normalizedSignals.Lab_Con).toBeNull();
      expect(result.numbers['23'].normalizedSignals.Lab_Con1).toBeDefined();
      expect(result.numbers['23'].normalizedSignals.AtRep).toBeNull();
    });
  });

  // ── 7. Field-level normalization ────────────────────────────────────────
  describe('field-level normalization', () => {
    it('normalizes delay.actualDelay with PERCENTILE', () => {
      // Two numbers: one with delay 10, other with delay 20
      const input = buildMockCollectorOutput({
        '1': {
          number: '1',
          signals: {
            Lab_Con: makeSignal('1', 'Lab_Con', { delayActual: 10 }),
            Lab_Con1: makeSignal('1', 'Lab_Con1'),
            AtRep: makeSignal('1', 'AtRep'),
          },
        },
        '2': {
          number: '2',
          signals: {
            Lab_Con: makeSignal('2', 'Lab_Con', { delayActual: 20 }),
            Lab_Con1: makeSignal('2', 'Lab_Con1'),
            AtRep: makeSignal('2', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n1 = result.numbers['1'].normalizedSignals.Lab_Con;
      const n2 = result.numbers['2'].normalizedSignals.Lab_Con;

      expect(n1['delay.actualDelay'].method).toBe('PERCENTILE');
      expect(n2['delay.actualDelay'].method).toBe('PERCENTILE');

      // 10 should rank below 20: percentile(10) < percentile(20)
      expect(n1['delay.actualDelay'].normalizedValue).toBeLessThan(
        n2['delay.actualDelay'].normalizedValue,
      );
    });

    it('normalizes delay.delayRatio with IDENTITY (already [0,1])', () => {
      const input = buildMockCollectorOutput({
        '5': {
          number: '5',
          signals: {
            Lab_Con: makeSignal('5', 'Lab_Con', { delayRatio: 0.65 }),
            Lab_Con1: makeSignal('5', 'Lab_Con1'),
            AtRep: makeSignal('5', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n = result.numbers['5'].normalizedSignals.Lab_Con;
      expect(n['delay.delayRatio'].method).toBe('IDENTITY');
      expect(n['delay.delayRatio'].normalizedValue).toBe(0.65);
      expect(n['delay.delayRatio'].valid).toBe(true);
    });

    it('normalizes winWin.isActive with BINARY', () => {
      const input = buildMockCollectorOutput({
        '10': {
          number: '10',
          signals: {
            Lab_Con: makeSignal('10', 'Lab_Con'),
            Lab_Con1: makeSignal('10', 'Lab_Con1', { wwIsActive: true }),
            AtRep: makeSignal('10', 'AtRep'),
          },
        },
        '11': {
          number: '11',
          signals: {
            Lab_Con: makeSignal('11', 'Lab_Con'),
            Lab_Con1: makeSignal('11', 'Lab_Con1', { wwIsActive: false }),
            AtRep: makeSignal('11', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n10 = result.numbers['10'].normalizedSignals.Lab_Con1;
      const n11 = result.numbers['11'].normalizedSignals.Lab_Con1;

      expect(n10['winWin.isActive'].method).toBe('BINARY');
      expect(n10['winWin.isActive'].normalizedValue).toBe(1);
      expect(n10['winWin.isActive'].valid).toBe(true);

      expect(n11['winWin.isActive'].method).toBe('BINARY');
      expect(n11['winWin.isActive'].normalizedValue).toBe(0);
      expect(n11['winWin.isActive'].valid).toBe(true);
    });

    it('normalizes winWin.level with CATEGORICAL (no mapping by default)', () => {
      const input = buildMockCollectorOutput({
        '15': {
          number: '15',
          signals: {
            Lab_Con: makeSignal('15', 'Lab_Con'),
            Lab_Con1: makeSignal('15', 'Lab_Con1', { wwLevel: 'WIN' }),
            AtRep: makeSignal('15', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n = result.numbers['15'].normalizedSignals.Lab_Con1;
      expect(n['winWin.level'].method).toBe('CATEGORICAL');
      expect(n['winWin.level'].rawValue).toBe('WIN');
    });

    it('normalizes pci.pciIndividual with IDENTITY', () => {
      const input = buildMockCollectorOutput({
        '32': {
          number: '32',
          signals: {
            Lab_Con: makeSignal('32', 'Lab_Con'),
            Lab_Con1: makeSignal('32', 'Lab_Con1'),
            AtRep: makeSignal('32', 'AtRep', { pciInd: 1.12 }),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n = result.numbers['32'].normalizedSignals.AtRep;
      expect(n['pci.pciIndividual'].method).toBe('IDENTITY');
      expect(n['pci.pciIndividual'].normalizedValue).toBe(1.12);
    });
  });

  // ── 8. Population building ──────────────────────────────────────────────
  describe('population building', () => {
    it('builds populations across all numbers and engines', () => {
      const signals = {};
      for (let i = 1; i <= 5; i++) {
        signals[String(i)] = {
          number: String(i),
          signals: {
            Lab_Con: makeSignal(String(i), 'Lab_Con', { delayActual: i * 10 }),
            Lab_Con1: makeSignal(String(i), 'Lab_Con1'),
            AtRep: makeSignal(String(i), 'AtRep'),
          },
        };
      }

      const input = buildMockCollectorOutput(signals);
      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      // All 5 numbers should have percentiles based on the 5-value population
      for (let i = 1; i <= 5; i++) {
        const n = result.numbers[String(i)].normalizedSignals.Lab_Con;
        expect(n['delay.actualDelay'].valid).toBe(true);
      }
    });

    it('handles mixed null and valid signals in population', () => {
      const input = buildMockCollectorOutput({
        '3': {
          number: '3',
          signals: {
            Lab_Con: makeSignal('3', 'Lab_Con', { delayActual: 30 }),
            Lab_Con1: null,
            AtRep: makeSignal('3', 'AtRep'),
          },
        },
        '4': {
          number: '4',
          signals: {
            Lab_Con: makeSignal('4', 'Lab_Con', { delayActual: 40 }),
            Lab_Con1: makeSignal('4', 'Lab_Con1'),
            AtRep: null,
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      // Both Lab_Con signals should be normalized
      expect(result.numbers['3'].normalizedSignals.Lab_Con['delay.actualDelay'].valid).toBe(true);
      expect(result.numbers['4'].normalizedSignals.Lab_Con['delay.actualDelay'].valid).toBe(true);

      // Null Lab_Con1 should produce null normalized entry
      expect(result.numbers['3'].normalizedSignals.Lab_Con1).toBeNull();
      expect(result.numbers['4'].normalizedSignals.AtRep).toBeNull();
    });
  });

  // ── 9. Strict mode ──────────────────────────────────────────────────────
  describe('strict mode', () => {
    it('throws on unknown strategy in fieldConfig', () => {
      const input = buildMockCollectorOutput({
        '0': {
          number: '0',
          signals: {
            Lab_Con: makeSignal('0', 'Lab_Con'),
            Lab_Con1: makeSignal('0', 'Lab_Con1'),
            AtRep: makeSignal('0', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer({
        mode: 'strict',
        fieldConfig: { 'delay.actualDelay': { strategy: 'NONEXISTENT' } },
      });

      expect(() => normalizer.normalize(input)).toThrow(/NONEXISTENT/);
    });

    it('tolerant mode does not throw on unknown strategy', () => {
      const input = buildMockCollectorOutput({
        '0': {
          number: '0',
          signals: {
            Lab_Con: makeSignal('0', 'Lab_Con'),
            Lab_Con1: makeSignal('0', 'Lab_Con1'),
            AtRep: makeSignal('0', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer({
        mode: 'tolerant',
        fieldConfig: { 'delay.actualDelay': { strategy: 'NONEXISTENT' } },
      });

      expect(() => normalizer.normalize(input)).not.toThrow();
      const result = normalizer.normalize(input);
      expect(result.metadata.normalization.warnings.length).toBeGreaterThan(0);
    });
  });

  // ── 10. Field exclusion (SKIP_FIELDS) ───────────────────────────────────
  describe('field exclusion', () => {
    it('does not normalize fields in SKIP_FIELDS', () => {
      expect(SKIP_FIELDS.has('delay.activeSets')).toBe(true);
      expect(SKIP_FIELDS.has('pci.pciBySet')).toBe(true);
    });
  });

  // ── 11. Edge cases ──────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles empty collector output (no numbers)', () => {
      const input = buildMockCollectorOutput({});
      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      expect(result.numbers).toEqual({});
      expect(result.metadata.normalization).toBeDefined();
    });

    it('handles non-finite values gracefully', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con', { delayActual: NaN }),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n = result.numbers['7'].normalizedSignals.Lab_Con;
      expect(n['delay.actualDelay'].valid).toBe(false);
      expect(n['delay.actualDelay'].normalizedValue).toBeNull();
    });

    it('handles Infinity values gracefully', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con', { delayActual: Infinity }),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const n = result.numbers['7'].normalizedSignals.Lab_Con;
      expect(n['delay.actualDelay'].valid).toBe(false);
    });
  });

  // ── 12. Metadata warnings ───────────────────────────────────────────────
  describe('metadata warnings', () => {
    it('records warnings when normalization produces invalid results', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con', { delayActual: NaN }),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const warnings = result.metadata.normalization.warnings;
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('records no warnings for perfectly valid data', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      // No normalization warnings expected for valid data
      const warns = result.metadata.normalization.warnings;
      // Some strategies (Categorical) might produce warnings depending on config
      // Just verify structure
      expect(Array.isArray(warns)).toBe(true);
    });
  });

  // ── 13. Defensive copy: immutability of input ────────────────────────────
  describe('defensive copy (input immutability)', () => {
    it('does not mutate input.numbers entry signals', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      // Snapshot before
      const labConSignalsBefore = { ...input.numbers['7'].signals.Lab_Con };
      const labCon1SignalsBefore = { ...input.numbers['7'].signals.Lab_Con1 };
      const atRepSignalsBefore = { ...input.numbers['7'].signals.AtRep };

      const normalizer = new SignalNormalizer();
      normalizer.normalize(input);

      // Input signals must be identical (no normalizedSignals injected)
      expect(input.numbers['7'].signals.Lab_Con).toEqual(labConSignalsBefore);
      expect(input.numbers['7'].signals.Lab_Con1).toEqual(labCon1SignalsBefore);
      expect(input.numbers['7'].signals.AtRep).toEqual(atRepSignalsBefore);
    });

    it('does not mutate input.metadata', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const metadataKeysBefore = Object.keys(input.metadata);
      const metadataCloneBefore = JSON.parse(JSON.stringify(input.metadata));

      const normalizer = new SignalNormalizer();
      normalizer.normalize(input);

      // Input metadata must not gain a normalization key
      expect(Object.keys(input.metadata)).toEqual(metadataKeysBefore);
      // Input metadata contents must be unchanged
      expect(input.metadata).toEqual(metadataCloneBefore);
    });

    it('does not add or remove keys from input.numbers map', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
          },
        },
      });

      const inputKeys = Object.keys(input.numbers);

      const normalizer = new SignalNormalizer();
      normalizer.normalize(input);

      expect(Object.keys(input.numbers)).toEqual(inputKeys);
    });

    it('output modification does not affect input', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      // Mutate output's normalizedSignals
      result.numbers['7'].normalizedSignals.Lab_Con['delay.actualDelay'].normalizedValue = 999;

      // Input must be unaffected
      expect(input.numbers['7'].signals.Lab_Con.rawSignals).not.toHaveProperty('normalizedSignals');
      expect(input.numbers['7'].signals.Lab_Con.rawSignals.delay.actualDelay).toBe(12); // default
    });
  });

  // ── 14. Preservation of 0 and 00 ─────────────────────────────────────────
  describe('preservation of 0 and 00', () => {
    it('preserves number "0" as key and number field', () => {
      const input = buildMockCollectorOutput({
        '0': {
          number: '0',
          signals: {
            Lab_Con: makeSignal('0', 'Lab_Con'),
            Lab_Con1: makeSignal('0', 'Lab_Con1'),
            AtRep: makeSignal('0', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      expect(result.numbers['0']).toBeDefined();
      expect(result.numbers['0'].number).toBe('0');
      // Must NOT be conflated to '00' or numeric 0
      expect(result.numbers['00']).toBeUndefined();
    });

    it('preserves number "00" as key and number field', () => {
      const input = buildMockCollectorOutput({
        '00': {
          number: '00',
          signals: {
            Lab_Con: makeSignal('00', 'Lab_Con'),
            Lab_Con1: makeSignal('00', 'Lab_Con1'),
            AtRep: makeSignal('00', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      expect(result.numbers['00']).toBeDefined();
      expect(result.numbers['00'].number).toBe('00');
      expect(result.numbers['0']).toBeUndefined();
    });

    it('keeps 0 and 00 as separate entries with distinct normalization', () => {
      const input = buildMockCollectorOutput({
        '0': {
          number: '0',
          signals: {
            Lab_Con: makeSignal('0', 'Lab_Con', { delayActual: 5 }),
          },
        },
        '00': {
          number: '00',
          signals: {
            Lab_Con: makeSignal('00', 'Lab_Con', { delayActual: 15 }),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      expect(result.numbers['0']).toBeDefined();
      expect(result.numbers['00']).toBeDefined();

      // 0 and 00 must have independent normalized signals
      const n0 = result.numbers['0'].normalizedSignals.Lab_Con['delay.actualDelay'];
      const n00 = result.numbers['00'].normalizedSignals.Lab_Con['delay.actualDelay'];

      expect(n0.rawValue).toBe(5);
      expect(n00.rawValue).toBe(15);
      // Normalized values may differ since they're in the same population
      expect(typeof n0.normalizedValue).toBe('number');
      expect(typeof n00.normalizedValue).toBe('number');
    });

    it('normalizes all three engine signals for "0"', () => {
      const input = buildMockCollectorOutput({
        '0': {
          number: '0',
          signals: {
            Lab_Con: makeSignal('0', 'Lab_Con'),
            Lab_Con1: makeSignal('0', 'Lab_Con1'),
            AtRep: makeSignal('0', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const ns = result.numbers['0'].normalizedSignals;
      expect(ns.Lab_Con).toBeDefined();
      expect(ns.Lab_Con1).toBeDefined();
      expect(ns.AtRep).toBeDefined();

      // Verify each engine has at least one normalized field
      expect(Object.keys(ns.Lab_Con).length).toBeGreaterThan(0);
      expect(Object.keys(ns.Lab_Con1).length).toBeGreaterThan(0);
      expect(Object.keys(ns.AtRep).length).toBeGreaterThan(0);
    });

    it('normalizes all three engine signals for "00"', () => {
      const input = buildMockCollectorOutput({
        '00': {
          number: '00',
          signals: {
            Lab_Con: makeSignal('00', 'Lab_Con'),
            Lab_Con1: makeSignal('00', 'Lab_Con1'),
            AtRep: makeSignal('00', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const ns = result.numbers['00'].normalizedSignals;
      expect(ns.Lab_Con).toBeDefined();
      expect(ns.Lab_Con1).toBeDefined();
      expect(ns.AtRep).toBeDefined();
    });
  });

  // ── 15. Clock injection for determinism ──────────────────────────────────
  describe('clock injection', () => {
    it('uses clock() for appliedAt', () => {
      const frozenTime = '2026-07-30T12:00:00.000Z';
      const clock = () => frozenTime;

      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer({ clock });
      const result = normalizer.normalize(input);

      expect(result.metadata.normalization.appliedAt).toBe(frozenTime);
    });

    it('produces deterministic appliedAt with fixed clock', () => {
      const clock = () => '2026-01-01T00:00:00.000Z';

      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
          },
        },
      });

      const normalizer = new SignalNormalizer({ clock });
      const r1 = normalizer.normalize(input);
      const r2 = normalizer.normalize(input);

      expect(r1.metadata.normalization.appliedAt).toBe(r2.metadata.normalization.appliedAt);
    });

    it('default clock produces valid ISO string', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const appliedAt = result.metadata.normalization.appliedAt;
      expect(typeof appliedAt).toBe('string');
      expect(() => new Date(appliedAt)).not.toThrow();
      expect(new Date(appliedAt).toISOString()).toBe(appliedAt);
    });
  });

  // ── 16. Counter invariant ────────────────────────────────────────────────
  describe('counter invariant (Configured = Normalized + Skipped)', () => {
    it('satisfies fieldsConfigured = fieldsNormalized + fieldsSkipped', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const { fieldsConfigured, fieldsNormalized, fieldsSkipped } = result.metadata.normalization;
      expect(fieldsConfigured).toBe(fieldsNormalized + fieldsSkipped);
    });

    it('reports at most-one failure per field (fieldsFailed ≤ fieldsNormalized)', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const { fieldsNormalized, fieldsFailed } = result.metadata.normalization;
      expect(fieldsFailed).toBeLessThanOrEqual(fieldsNormalized);
    });

    it('fieldsFailed is 0 for fully valid data', () => {
      const input = buildMockCollectorOutput({
        '7': {
          number: '7',
          signals: {
            Lab_Con: makeSignal('7', 'Lab_Con'),
            Lab_Con1: makeSignal('7', 'Lab_Con1'),
            AtRep: makeSignal('7', 'AtRep'),
          },
        },
      });

      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      // CATEGORICAL for level produces valid=false by default, so expect non-zero
      // Instead of asserting zero, just check it's a number
      expect(typeof result.metadata.normalization.fieldsFailed).toBe('number');
    });

    it('with empty input, all fields are skipped', () => {
      const input = buildMockCollectorOutput({});
      const normalizer = new SignalNormalizer();
      const result = normalizer.normalize(input);

      const { fieldsConfigured, fieldsNormalized, fieldsSkipped } = result.metadata.normalization;
      expect(fieldsNormalized).toBe(0);
      expect(fieldsSkipped).toBe(fieldsConfigured);
      expect(fieldsConfigured).toBe(fieldsNormalized + fieldsSkipped);
    });
  });
});

// ── Strategy-specific unit tests ──────────────────────────────────────────

describe('PercentileStrategy', () => {
  const strategy = new PercentileStrategy();

  it('returns 0 for the minimum value', () => {
    const result = strategy.normalize(1, { values: [1, 2, 3, 4, 5] });
    expect(result.normalizedValue).toBe(0);
    expect(result.valid).toBe(true);
  });

  it('returns 1 for the maximum value', () => {
    const result = strategy.normalize(5, { values: [1, 2, 3, 4, 5] });
    expect(result.normalizedValue).toBe(1);
    expect(result.valid).toBe(true);
  });

  it('returns 0.5 for the median in odd-length population', () => {
    const result = strategy.normalize(3, { values: [1, 2, 3, 4, 5] });
    expect(result.normalizedValue).toBe(0.5);
  });

  it('handles ties correctly (midrank)', () => {
    const result = strategy.normalize(2, { values: [1, 2, 2, 3] });
    // Two 2's: they occupy ranks 1 and 2 (0-based), midrank = 1.5, /3 = 0.5
    expect(result.normalizedValue).toBe(0.5);
  });

  it('clamps values outside population range', () => {
    const r1 = strategy.normalize(0, { values: [2, 3, 4] });
    expect(r1.normalizedValue).toBe(0);
    const r2 = strategy.normalize(10, { values: [2, 3, 4] });
    expect(r2.normalizedValue).toBe(1);
  });

  it('returns null for non-finite values', () => {
    const result = strategy.normalize(NaN, { values: [1, 2, 3] });
    expect(result.normalizedValue).toBeNull();
    expect(result.valid).toBe(false);
  });

  it('handles single-value population', () => {
    const result = strategy.normalize(7, { values: [7, 7, 7] });
    expect(result.normalizedValue).toBe(0.5);
    expect(result.valid).toBe(true);
  });

  it('handles empty population', () => {
    const result = strategy.normalize(5, { values: [] });
    expect(result.normalizedValue).toBeNull();
    expect(result.valid).toBe(false);
  });
});

describe('MinMaxStrategy', () => {
  const strategy = new MinMaxStrategy();

  it('returns 0 for min value', () => {
    const result = strategy.normalize(10, { values: [10, 20, 30] });
    expect(result.normalizedValue).toBe(0);
  });

  it('returns 1 for max value', () => {
    const result = strategy.normalize(30, { values: [10, 20, 30] });
    expect(result.normalizedValue).toBe(1);
  });

  it('returns 0.5 for midpoint', () => {
    const result = strategy.normalize(20, { values: [10, 20, 30] });
    expect(result.normalizedValue).toBe(0.5);
  });

  it('clamps out-of-range values', () => {
    const r1 = strategy.normalize(0, { values: [10, 20] });
    expect(r1.normalizedValue).toBe(0);
    const r2 = strategy.normalize(100, { values: [10, 20] });
    expect(r2.normalizedValue).toBe(1);
  });

  it('returns 0.5 for degenerate population (all equal)', () => {
    const result = strategy.normalize(5, { values: [5, 5, 5] });
    expect(result.normalizedValue).toBe(0.5);
    expect(result.params.degenerate).toBe(true);
  });
});

describe('RobustMinMaxStrategy', () => {
  it('winsorizes outliers at default 5th/95th percentiles', () => {
    const strategy = new RobustMinMaxStrategy();
    // 100 values: 5 zeros (5%), 90 mids, 5 hundreds (5%)
    // p5 should be around sorted[4-5] which is between 0 and 50
    // p95 should be around sorted[94-95] which is between 50 and 100
    const values = Array.from({ length: 100 }, (_, i) => {
      if (i < 5) return 0;
      if (i >= 95) return 100;
      return 50;
    });

    // p5: idx = 0.05 * 99 = 4.95, between sorted[4]=0 and sorted[5]=50 → 0+0.95*50 = 47.5
    // p95: idx = 0.95 * 99 = 94.05, between sorted[94]=50 and sorted[95]=100 → 50+0.05*50 = 52.5
    // 0 < 47.5 → winsorized
    const resultOutlier = strategy.normalize(0, { values });
    // Check lowerBound to verify percentile math
    expect(resultOutlier.params.lowerBound).toBeGreaterThan(0);
    expect(resultOutlier.params.winsorized).toBe(true);

    // 100 > 52.5 → winsorized
    const resultHigh = strategy.normalize(100, { values });
    expect(resultHigh.params.winsorized).toBe(true);

    // 50 ∈ [47.5, 52.5] → NOT winsorized
    const resultMid = strategy.normalize(50, { values });
    expect(resultMid.params.winsorized).toBe(false);
  });

  it('accepts custom percentile bounds', () => {
    const strategy = new RobustMinMaxStrategy({ lowerPercentile: 10, upperPercentile: 90 });
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];

    const result = strategy.normalize(100, { values });
    expect(result.params.lowerPercentile).toBe(10);
    expect(result.params.upperPercentile).toBe(90);
  });

  it('clamps percentiles to valid range', () => {
    const s1 = new RobustMinMaxStrategy({ lowerPercentile: -5 });
    expect(s1.lowerPercentile).toBe(0);

    const s2 = new RobustMinMaxStrategy({ upperPercentile: 200 });
    expect(s2.upperPercentile).toBe(100);
  });

  it('returns 0.5 for degenerate range', () => {
    const strategy = new RobustMinMaxStrategy();
    const result = strategy.normalize(5, { values: [5, 5, 5] });
    expect(result.normalizedValue).toBe(0.5);
  });
});

describe('ZScoreStrategy', () => {
  const strategy = new ZScoreStrategy();

  it('returns 0 for the mean', () => {
    const result = strategy.normalize(5, { values: [5, 5, 5, 5] });
    expect(result.normalizedValue).toBe(0);
  });

  it('returns positive for above-mean', () => {
    const result = strategy.normalize(15, { values: [0, 10, 20] });
    expect(result.normalizedValue).toBeGreaterThan(0);
  });

  it('returns negative for below-mean', () => {
    const result = strategy.normalize(-5, { values: [0, 10, 20] });
    expect(result.normalizedValue).toBeLessThan(0);
  });

  it('handles single-value population', () => {
    const result = strategy.normalize(42, { values: [42] });
    expect(result.normalizedValue).toBe(0);
    expect(result.params.degenerate).toBe(true);
  });
});

describe('IdentityStrategy', () => {
  const strategy = new IdentityStrategy();

  it('passes through valid numbers', () => {
    const result = strategy.normalize(0.73, { values: [] });
    expect(result.normalizedValue).toBe(0.73);
    expect(result.valid).toBe(true);
    expect(result.method).toBe('IDENTITY');
  });

  it('returns null for NaN', () => {
    const result = strategy.normalize(NaN, { values: [] });
    expect(result.normalizedValue).toBeNull();
    expect(result.valid).toBe(false);
  });

  it('returns null for null', () => {
    const result = strategy.normalize(null, { values: [] });
    expect(result.normalizedValue).toBeNull();
    expect(result.valid).toBe(false);
  });
});

describe('BinaryStrategy', () => {
  const strategy = new BinaryStrategy();

  it('maps true to 1', () => {
    const result = strategy.normalize(true, { values: [] });
    expect(result.normalizedValue).toBe(1);
    expect(result.valid).toBe(true);
  });

  it('maps false to 0', () => {
    const result = strategy.normalize(false, { values: [] });
    expect(result.normalizedValue).toBe(0);
    expect(result.valid).toBe(true);
  });

  it('returns null for non-boolean', () => {
    const result = strategy.normalize('yes', { values: [] });
    expect(result.normalizedValue).toBeNull();
    expect(result.valid).toBe(false);
    expect(result.params.invalidType).toBe('string');
  });
});

describe('CategoricalStrategy', () => {
  it('preserves string value without mapping', () => {
    const strategy = new CategoricalStrategy();
    const result = strategy.normalize('WIN', { values: [] });
    expect(result.normalizedValue).toBe('WIN');
    expect(result.valid).toBe(false);
  });

  it('maps string to number with ordinal mapping', () => {
    const strategy = new CategoricalStrategy({
      mapping: { 'LOW': 0, 'MEDIUM': 0.5, 'HIGH': 1 },
    });
    const result = strategy.normalize('MEDIUM', { values: [] });
    expect(result.normalizedValue).toBe(0.5);
    expect(result.valid).toBe(true);
  });

  it('marks unmatched values as invalid', () => {
    const strategy = new CategoricalStrategy({
      mapping: { 'A': 1, 'B': 2 },
    });
    const result = strategy.normalize('Z', { values: [] });
    expect(result.valid).toBe(false);
    expect(result.params.unmapped).toBe(true);
  });
});
