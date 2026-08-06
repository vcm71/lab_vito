import { describe, expect, it } from 'vitest';
import { LabEngine } from '../../labEngine.js';
import { LabCon1Engine } from '../../labCon1Engine.js';
import { AtRepEngine } from '../../atRepEngine.js';
import {
  LabConAdapter,
  LabCon1Adapter,
  AtRepAdapter,
  SignalCollector,
  CONSENSUS_SOURCE_ENGINES,
  WARNING_SEVERITY,
  AMERICAN_ROULETTE_NUMBERS,
  CONSENSUS_SCHEMA_VERSION,
} from '../../src/consensus/index.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createTracker(spins = []) {
  return {
    getSpins: () => spins.map(spin => ({ ...spin })),
  };
}

function makeValidSignal(number, sourceEngine) {
  // Build a minimal but structurally valid signal (mirrors ConsensusSignal shape)
  return {
    schemaVersion: CONSENSUS_SCHEMA_VERSION,
    number: String(number),
    sourceEngines: [sourceEngine],
    rawSignals: {
      delay: null,
      winWin: null,
      pci: null,
    },
    evidence: {
      occurrences: 5,
      sampleSize: 20,
      activeSets: [],
      windowSize: 50,
      historyLength: 100,
      supportCount: 0,
      signalQuality: 'INSUFFICIENT',
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      valid: true,
      warnings: [],
      missingSignals: [],
      provenance: [{ engine: sourceEngine, file: 'mock.js', method: 'mock', version: null }],
    },
  };
}

function buildMockAdapter(adaptFn) {
  return { adapt: adaptFn };
}

// ── Happy-path setup ───────────────────────────────────────────────────────

function createRealAdapters(spins = []) {
  const tracker = createTracker(spins);
  const labEngine = new LabEngine(tracker);
  const labCon1Engine = new LabCon1Engine(tracker);

  // AtRepEngine needs a domainTracker with getSpins + getSettings
  const domainTracker = {
    getSpins: () => spins.map(s => ({ ...s })),
    getSettings: () => ({ atrasosMaxWindow: 100 }),
  };
  const atRepEngine = new AtRepEngine(domainTracker);

  return {
    labConAdapter: new LabConAdapter(labEngine),
    labCon1Adapter: new LabCon1Adapter(labCon1Engine),
    atRepAdapter: new AtRepAdapter(atRepEngine),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SignalCollector', () => {
  // 1. Constructor
  describe('constructor validation', () => {
    it('throws when adapters is not a plain object', () => {
      expect(() => new SignalCollector(null)).toThrow(TypeError);
      expect(() => new SignalCollector('bad')).toThrow(TypeError);
      expect(() => new SignalCollector([])).toThrow(TypeError);
    });

    it('throws when an adapter does not expose adapt()', () => {
      expect(() => new SignalCollector({
        labConAdapter: { nope: () => {} },
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      })).toThrow(/labConAdapter/);
    });

    it('throws when an adapter is missing', () => {
      expect(() => new SignalCollector({
        labConAdapter: buildMockAdapter(() => []),
        labCon1Adapter: buildMockAdapter(() => []),
      })).toThrow(/atRepAdapter/);
    });

    it('constructs successfully with valid adapters', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => []),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });
      expect(collector).toBeInstanceOf(SignalCollector);
    });
  });

  // 2. Collect options
  describe('collect() option validation', () => {
    const adapters = {
      labConAdapter: buildMockAdapter(() => []),
      labCon1Adapter: buildMockAdapter(() => []),
      atRepAdapter: buildMockAdapter(() => []),
    };

    it('throws when options is not a plain object', () => {
      const collector = new SignalCollector(adapters);
      expect(() => collector.collect('bad')).toThrow(TypeError);
    });

    it('throws on invalid mode string', () => {
      const collector = new SignalCollector(adapters);
      expect(() => collector.collect({ mode: 'invalid' })).toThrow(RangeError);
    });

    it('accepts explicit "tolerant" mode', () => {
      const collector = new SignalCollector(adapters);
      expect(() => collector.collect({ mode: 'tolerant' })).not.toThrow();
    });

    it('accepts explicit "strict" mode', () => {
      const collector = new SignalCollector(adapters);
      expect(() => collector.collect({ mode: 'STRICT' })).not.toThrow();
    });

    it('uses tolerant mode by default', () => {
      const collector = new SignalCollector(adapters);
      const result = collector.collect();
      expect(result.metadata.enginesCompleted).toEqual([
        CONSENSUS_SOURCE_ENGINES.LAB_CON,
        CONSENSUS_SOURCE_ENGINES.LAB_CON_1,
        CONSENSUS_SOURCE_ENGINES.AT_REP,
      ]);
    });
  });

  // 3. Basic collection (happy path)
  describe('basic collection', () => {
    it('collects signals for all 38 American numbers from all 3 engines', () => {
      const spins = [
        { number: '0' }, { number: '5' }, { number: '00' },
        { number: '12' }, { number: '26' }, { number: '7' }, { number: '0' },
      ];
      const adapters = createRealAdapters(spins);
      const collector = new SignalCollector(adapters);
      const result = collector.collect();

      expect(result).toHaveProperty('numbers');
      expect(result).toHaveProperty('metadata');
      expect(Object.keys(result.numbers)).toHaveLength(38);

      // All canonical numbers present
      for (const num of AMERICAN_ROULETTE_NUMBERS) {
        expect(result.numbers).toHaveProperty(num);
        const entry = result.numbers[num];
        expect(entry.number).toBe(num);
        expect(entry.signals).toHaveProperty(CONSENSUS_SOURCE_ENGINES.LAB_CON);
        expect(entry.signals).toHaveProperty(CONSENSUS_SOURCE_ENGINES.LAB_CON_1);
        expect(entry.signals).toHaveProperty(CONSENSUS_SOURCE_ENGINES.AT_REP);
      }
    });

    it('returns correct metadata shape', () => {
      const adapters = createRealAdapters([{ number: '5' }, { number: '12' }]);
      const collector = new SignalCollector(adapters);
      const result = collector.collect();

      const meta = result.metadata;
      expect(meta).toMatchObject({
        enginesRequested: [
          CONSENSUS_SOURCE_ENGINES.LAB_CON,
          CONSENSUS_SOURCE_ENGINES.LAB_CON_1,
          CONSENSUS_SOURCE_ENGINES.AT_REP,
        ],
        enginesCompleted: [
          CONSENSUS_SOURCE_ENGINES.LAB_CON,
          CONSENSUS_SOURCE_ENGINES.LAB_CON_1,
          CONSENSUS_SOURCE_ENGINES.AT_REP,
        ],
        enginesFailed: [],
        totalNumbers: 38,
        totalSignals: expect.any(Number),
        completeNumbers: expect.any(Number),
        incompleteNumbers: expect.any(Number),
        warnings: expect.any(Array),
        provenance: {
          collector: 'SignalCollector',
          adapters: ['LabConAdapter', 'LabCon1Adapter', 'AtRepAdapter'],
        },
      });
      expect(meta.collectedAt).toEqual(expect.any(String));
      expect(() => new Date(meta.collectedAt)).not.toThrow();
    });

    it('preserves signals with null rawSignals for unused signal types', () => {
      // LabCon only produces delay, others are null — verify nulls are preserved
      const adapters = createRealAdapters([{ number: '7' }]);
      const collector = new SignalCollector(adapters);
      const result = collector.collect();
      const labConSignal = result.numbers['7'].signals[CONSENSUS_SOURCE_ENGINES.LAB_CON];

      // Lab_Con: delay should be object, winWin and pci should be null
      expect(labConSignal.rawSignals.delay).not.toBeNull();
      expect(labConSignal.rawSignals.winWin).toBeNull();
      expect(labConSignal.rawSignals.pci).toBeNull();

      // AtRep: pci should be object, delay and winWin should be null
      const atRepSignal = result.numbers['7'].signals[CONSENSUS_SOURCE_ENGINES.AT_REP];
      expect(atRepSignal.rawSignals.delay).toBeNull();
      expect(atRepSignal.rawSignals.winWin).toBeNull();
      expect(atRepSignal.rawSignals.pci).not.toBeNull();

      // Lab_Con1: winWin should be object, delay and pci should be null
      const labCon1Signal = result.numbers['7'].signals[CONSENSUS_SOURCE_ENGINES.LAB_CON_1];
      expect(labCon1Signal.rawSignals.delay).toBeNull();
      expect(labCon1Signal.rawSignals.winWin).not.toBeNull();
      expect(labCon1Signal.rawSignals.pci).toBeNull();
    });
  });

  // 4. Engine failure handling
  describe('engine failure', () => {
    it('throws in strict mode when an adapter throws', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => { throw new Error('Boom!'); }),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      expect(() => collector.collect({ mode: 'strict' })).toThrow(/strict mode/);
    });

    it('continues in tolerant mode and records failure metadata', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => { throw new Error('LabCon exploded'); }),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect({ mode: 'tolerant' });

      expect(result.metadata.enginesFailed).toContain(CONSENSUS_SOURCE_ENGINES.LAB_CON);
      expect(result.metadata.enginesCompleted).not.toContain(CONSENSUS_SOURCE_ENGINES.LAB_CON);
      expect(result.metadata.enginesCompleted).toContain(CONSENSUS_SOURCE_ENGINES.LAB_CON_1);
      expect(result.metadata.enginesCompleted).toContain(CONSENSUS_SOURCE_ENGINES.AT_REP);

      // Engine that failed should have null signals for all numbers
      for (const [, entry] of Object.entries(result.numbers)) {
        expect(entry.signals[CONSENSUS_SOURCE_ENGINES.LAB_CON]).toBeNull();
      }

      // Warning for failed engine
      const failureWarning = result.metadata.warnings.find(
        w => w.code === 'SIGNAL_COLLECTOR_ENGINE_FAILED' && w.engine === CONSENSUS_SOURCE_ENGINES.LAB_CON,
      );
      expect(failureWarning).toBeDefined();
    });
  });

  // 5. Clock injection
  describe('clock', () => {
    it('uses custom clock for deterministic collectedAt', () => {
      const fixedIso = '2026-01-01T00:00:00.000Z';
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => []),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect({ clock: () => fixedIso });
      expect(result.metadata.collectedAt).toBe(fixedIso);
    });
  });

  // 6. Immutability
  describe('immutability', () => {
    it('deep clones signals so mutation does not propagate', () => {
      const originalSignals = AMERICAN_ROULETTE_NUMBERS.map(num =>
        makeValidSignal(num, CONSENSUS_SOURCE_ENGINES.LAB_CON),
      );

      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [...originalSignals]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();

      // Mutate the original
      originalSignals[0].sourceEngines.push('MUTATED');
      originalSignals[0].number = '999';

      const firstEntry = result.numbers[AMERICAN_ROULETTE_NUMBERS[0]];
      const returnedSignal = firstEntry.signals[CONSENSUS_SOURCE_ENGINES.LAB_CON];

      // Returned signal must be untouched
      if (returnedSignal) {
        expect(returnedSignal.number).toBe(AMERICAN_ROULETTE_NUMBERS[0]);
        expect(returnedSignal.sourceEngines).not.toContain('MUTATED');
      }
    });

    it('deep clones metadata.warnings', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => []),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });
      const result = collector.collect();
      result.metadata.warnings.push({ code: 'INJECTED' });
      const result2 = collector.collect();
      expect(result2.metadata.warnings).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'INJECTED' })]),
      );
    });
  });

  // 7. Validation: invalid signals
  describe('signal validation', () => {
    it('warns when an adapter returns a non-object signal', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => ['not an object', makeValidSignal('0', CONSENSUS_SOURCE_ENGINES.LAB_CON)]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      const warn = result.metadata.warnings.find(
        w => w.code === 'SIGNAL_COLLECTOR_INVALID_SIGNAL' && w.engine === CONSENSUS_SOURCE_ENGINES.LAB_CON,
      );
      expect(warn).toBeDefined();
    });

    it('warns when an adapter returns a structurally invalid signal', () => {
      const invalidSignal = {
        schemaVersion: CONSENSUS_SCHEMA_VERSION,
        number: '5',
        // Missing sourceEngines, rawSignals, evidence, metadata
      };
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [invalidSignal]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      const warn = result.metadata.warnings.find(
        w => w.code === 'SIGNAL_COLLECTOR_INVALID_SIGNAL' && w.number === '5',
      );
      expect(warn).toBeDefined();
    });
  });

  // 8. Validation: duplicate numbers
  describe('duplicate handling', () => {
    it('warns when an adapter returns duplicate signals for the same number', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [
          makeValidSignal('0', CONSENSUS_SOURCE_ENGINES.LAB_CON),
          makeValidSignal('0', CONSENSUS_SOURCE_ENGINES.LAB_CON),
        ]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      const dupeWarnings = result.metadata.warnings.filter(
        w => w.code === 'SIGNAL_COLLECTOR_DUPLICATE_NUMBER',
      );

      // In tolerant mode, at least one duplicate warning
      expect(dupeWarnings.length).toBeGreaterThanOrEqual(1);
      const dupForZero = dupeWarnings.find(w => w.number === '0');
      expect(dupForZero).toBeDefined();
      expect(dupForZero.engine).toBe(CONSENSUS_SOURCE_ENGINES.LAB_CON);
    });
  });

  // 9. Validation: unknown numbers
  describe('unknown number', () => {
    it('flags signals with numbers outside the universe as INVALID_SIGNAL (Schema catches first, UNKNOWN_NUMBER is defensive)', () => {
      // Note: The ConsensusSignal schema rejects numbers outside the roulette domain
      // via normalizeRouletteNumber. Therefore '999' gets caught as INVALID_SIGNAL.
      // The UNKNOWN_NUMBER code path exists defensively for future schema versions
      // that may allow non-standard numbers.
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [makeValidSignal('999', CONSENSUS_SOURCE_ENGINES.LAB_CON)]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      // extractNumber returns null for '999' (not in regex), so the warning has number: null
      const invalidWarn = result.metadata.warnings.find(
        w => w.code === 'SIGNAL_COLLECTOR_INVALID_SIGNAL'
          && w.engine === CONSENSUS_SOURCE_ENGINES.LAB_CON
          && w.message.includes('failed structural validation'),
      );
      expect(invalidWarn).toBeDefined();
    });
  });

  // 10. Validation: missing numbers
  describe('missing number', () => {
    it('warns when an adapter does not return signals for every number', () => {
      // Only return signal for '5', missing others
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [makeValidSignal('5', CONSENSUS_SOURCE_ENGINES.LAB_CON)]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      const missingWarnings = result.metadata.warnings.filter(
        w => w.code === 'SIGNAL_COLLECTOR_MISSING_NUMBER' && w.engine === CONSENSUS_SOURCE_ENGINES.LAB_CON,
      );
      expect(missingWarnings.length).toBe(37); // 37 missing, 1 present
    });
  });

  // 11. Validation: source mismatch
  describe('source mismatch', () => {
    it('warns when signal sourceEngines does not match the expected adapter engine', () => {
      const signal = makeValidSignal('7', CONSENSUS_SOURCE_ENGINES.AT_REP); // Wrong engine!
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [signal]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect({ mode: 'tolerant' });
      const warn = result.metadata.warnings.find(
        w => w.code === 'SIGNAL_COLLECTOR_SOURCE_MISMATCH' && w.number === '7',
      );
      expect(warn).toBeDefined();
      expect(warn.engine).toBe(CONSENSUS_SOURCE_ENGINES.LAB_CON);
    });

    it('throws on source mismatch in strict mode', () => {
      const signal = makeValidSignal('7', CONSENSUS_SOURCE_ENGINES.AT_REP);
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => [signal]),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      expect(() => collector.collect({ mode: 'strict' })).toThrow(/source mismatch/);
    });
  });

  // 12. Validation: empty array from adapter
  describe('empty array', () => {
    it('warns when an adapter returns an empty array', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => []),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      const emptyWarnings = result.metadata.warnings.filter(
        w => w.code === 'SIGNAL_COLLECTOR_INVALID_COLLECTION',
      );
      // All three adapters returned empty arrays → at least one warning
      expect(emptyWarnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 13. Metadata: completeNumbers and incompleteNumbers
  describe('completeNumbers / incompleteNumbers', () => {
    it('counts complete and incomplete numbers correctly', () => {
      // Only Lab_Con returns full signals for all 38, others return empty
      const fullSignals = AMERICAN_ROULETTE_NUMBERS.map(num =>
        makeValidSignal(num, CONSENSUS_SOURCE_ENGINES.LAB_CON),
      );

      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => fullSignals),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();

      // 1 engine with full coverage, 2 with none
      // In this case, there should be NO completeNumber because all 3 engines must contribute
      // but Lab_Con1 and AtRep are empty, so numbers with missing signals should be incomplete.
      // Actually wait: LabCon1Adapter and AtRepAdapter returned empty arrays
      // → those engines' signals will ALL be null → 0 completeNumbers
      expect(result.metadata.completeNumbers).toBe(0);
      expect(result.metadata.incompleteNumbers).toBe(38);
      expect(result.metadata.totalSignals).toBe(38); // Only Lab_Con contributed
    });

    it('counts completeNumbers when all 3 engines contribute', () => {
      const labConSignals = AMERICAN_ROULETTE_NUMBERS.map(num =>
        makeValidSignal(num, CONSENSUS_SOURCE_ENGINES.LAB_CON),
      );
      const labCon1Signals = AMERICAN_ROULETTE_NUMBERS.map(num =>
        makeValidSignal(num, CONSENSUS_SOURCE_ENGINES.LAB_CON_1),
      );
      const atRepSignals = AMERICAN_ROULETTE_NUMBERS.map(num =>
        makeValidSignal(num, CONSENSUS_SOURCE_ENGINES.AT_REP),
      );

      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => labConSignals),
        labCon1Adapter: buildMockAdapter(() => labCon1Signals),
        atRepAdapter: buildMockAdapter(() => atRepSignals),
      });

      const result = collector.collect();
      expect(result.metadata.completeNumbers).toBe(38);
      expect(result.metadata.incompleteNumbers).toBe(0);
      expect(result.metadata.totalSignals).toBe(114); // 38 * 3
    });
  });

  // 14. Warning structure contract
  describe('warning structure contract', () => {
    it('every warning has code, message, severity, source, engine, number', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => []),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect();
      expect(result.metadata.warnings.length).toBeGreaterThan(0);

      for (const warning of result.metadata.warnings) {
        expect(warning).toMatchObject({
          code: expect.any(String),
          message: expect.any(String),
          severity: expect.any(String),
          source: 'SignalCollector',
        });
        expect(warning).toHaveProperty('engine');
        expect(warning).toHaveProperty('number');
        expect(Object.values(WARNING_SEVERITY)).toContain(warning.severity);
      }
    });
  });

  // 15. Multiple failures
  describe('multiple adapter failures', () => {
    it('handles 2 out of 3 adapters failing', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => { throw new Error('Fail1'); }),
        labCon1Adapter: buildMockAdapter(() => { throw new Error('Fail2'); }),
        atRepAdapter: buildMockAdapter(() => AMERICAN_ROULETTE_NUMBERS.map(
          num => makeValidSignal(num, CONSENSUS_SOURCE_ENGINES.AT_REP),
        )),
      });

      const result = collector.collect({ mode: 'tolerant' });

      expect(result.metadata.enginesFailed).toHaveLength(2);
      expect(result.metadata.enginesCompleted).toHaveLength(1);
      expect(result.metadata.completeNumbers).toBe(0);
      expect(result.metadata.totalSignals).toBe(38);
    });
  });

  // 16. Non-array result from adapter
  describe('non-array adapter result', () => {
    it('handles adapter returning a non-array gracefully', () => {
      const collector = new SignalCollector({
        labConAdapter: buildMockAdapter(() => ({ invalid: true })),
        labCon1Adapter: buildMockAdapter(() => []),
        atRepAdapter: buildMockAdapter(() => []),
      });

      const result = collector.collect({ mode: 'tolerant' });

      // Lab_Con should be moved to failed
      expect(result.metadata.enginesFailed).toContain(CONSENSUS_SOURCE_ENGINES.LAB_CON);
      const warn = result.metadata.warnings.find(
        w => w.code === 'SIGNAL_COLLECTOR_INVALID_COLLECTION' && w.engine === CONSENSUS_SOURCE_ENGINES.LAB_CON,
      );
      expect(warn).toBeDefined();
    });
  });
});
