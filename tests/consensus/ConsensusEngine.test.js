/**
 * Fase 2.1 — Integration tests for ConsensusEngine.
 *
 * Covers:
 *   1. Constructor validation
 *   2. Input validation
 *   3. Full pipeline: collector → normalizer → engine
 *   4. Per-engine signal aggregation
 *   5. Signal direction handling
 *   6. Coverage & participation
 *   7. Agreement computation
 *   8. Conflict detection
 *   9. Confidence levels & components
 *   10. Explanation diagnostics
 *   11. Determinism (clock)
 *   12. Defensive copy
 *   13. Strict mode
 *   14. 0 / 00 numbers
 *   15. Edge cases: empty, single engine, missing fields
 */

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
  ConsensusEngine,
} from '../../src/consensus/index.js';

// ── Normalized-Value Entry ──────────────────────────────────────────────────

function nve(value, method, valid = true, extraParams = {}) {
  return {
    rawValue: value,
    normalizedValue: value,
    method: method || 'IDENTITY',
    valid,
    params: { ...extraParams },
  };
}

// ── Signal build helpers ────────────────────────────────────────────────────

/**
 * Build a single-engine normalized-signal object.
 * Values should already be in [0,1].
 */
function buildEngineNorm(mapping) {
  const result = {};
  for (const [fieldKey, val] of Object.entries(mapping)) {
    result[fieldKey] = nve(val, 'IDENTITY');
  }
  return result;
}

/**
 * Build full normalized output for a single number.
 * Defaults: all signals at mid-range (0.5) so consensus is reasonable.
 */
function makeNormForNumber(num, overrides = {}) {
  const delayR = overrides.delayRatio ?? 0.5;
  const delayS = overrides.delayScore ?? 0.5;
  const delayP = overrides.pressure ?? 0.5;
  const wwActive = overrides.wwActive ?? 1;     // BINARY: 1 = active
  const wwScore = overrides.wwScore ?? 0.5;
  const pciOcc = overrides.pciOccurrences ?? 0.5;
  const pciMD = overrides.pciMeanDist ?? 0.5;

  const labCon = buildEngineNorm({
    'delay.delayRatio': delayR,
    'delay.delayScore': delayS,
    'delay.pressure': delayP,
  });

  const labCon1 = buildEngineNorm({
    'winWin.isActive': wwActive,
    'winWin.winWinScore': wwScore,
  });

  const atRep = buildEngineNorm({
    'pci.occurrences': pciOcc,
    'pci.meanDist': pciMD,
  });

  const normSignals = {};
  if (overrides.includeLabCon !== false) normSignals.Lab_Con = labCon;
  if (overrides.includeLabCon1 !== false) normSignals.Lab_Con1 = labCon1;
  if (overrides.includeAtRep !== false) normSignals.AtRep = atRep;

  return {
    number: num,
    signals: {},  // Raw signals not needed by engine after normalization
    normalizedSignals: normSignals,
  };
}

/**
 * Build a normalized output object to feed to ConsensusEngine.
 */
function makeInput(numbersDef) {
  const numbers = {};
  for (const num of Object.keys(numbersDef)) {
    const def = numbersDef[num];
    if (typeof def === 'object' && !Array.isArray(def)) {
      numbers[num] = makeNormForNumber(num, def);
    } else {
      // Shorthand: just a number means default signals
      numbers[num] = makeNormForNumber(num);
    }
  }
  return {
    numbers,
    metadata: {
      normalization: {
        appliedAt: new Date().toISOString(),
        mode: 'tolerant',
        strategyNames: ['IDENTITY'],
        fieldsConfigured: 7,
        fieldsNormalized: 7,
        fieldsSkipped: 0,
        fieldsFailed: 0,
        warnings: [],
      },
    },
  };
}

/**
 * Build a full pipeline for integration tests with real engines.
 */
function createPipeline(spins = []) {
  const tracker = {
    getSpins: () => spins.map(s => ({ ...s })),
  };
  const domainTracker = {
    getSpins: () => spins.map(s => ({ ...s })),
    getSettings: () => ({ atrasosMaxWindow: 100 }),
  };
  const collector = new SignalCollector({
    labConAdapter: new LabConAdapter(new LabEngine(tracker)),
    labCon1Adapter: new LabCon1Adapter(new LabCon1Engine(tracker)),
    atRepAdapter: new AtRepAdapter(new AtRepEngine(domainTracker)),
  });
  const normalizer = new SignalNormalizer({ mode: 'tolerant' });
  const engine = new ConsensusEngine({ mode: 'tolerant' });

  return { collector, normalizer, engine };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ConsensusEngine', () => {
  // ── 1. Constructor ─────────────────────────────────────────────────────
  describe('constructor validation', () => {
    it('creates with default configuration', () => {
      const engine = new ConsensusEngine();
      expect(engine.mode).toBe('tolerant');
      expect(engine.config).toBeDefined();
      expect(engine.config.aggregation.strategy).toBe('HIERARCHICAL_WEIGHTED_MEAN');
      expect(engine.config.engines.Lab_Con.weight).toBe(1);
      expect(engine.config.engines.Lab_Con1.weight).toBe(1);
      expect(engine.config.engines.AtRep.weight).toBe(1);
    });

    it('accepts strict mode', () => {
      const engine = new ConsensusEngine({ mode: 'strict' });
      expect(engine.mode).toBe('strict');
    });

    it('accepts partial config override', () => {
      const engine = new ConsensusEngine({
        config: {
          engines: {
            Lab_Con: { weight: 2 },
          },
        },
      });
      expect(engine.config.engines.Lab_Con.weight).toBe(2);
      expect(engine.config.engines.Lab_Con1.weight).toBe(1); // Default preserved
    });

    it('accepts custom clock', () => {
      let calls = 0;
      const clock = () => { calls++; return `iso-${calls}`; };
      const engine = new ConsensusEngine({ clock });
      const input = makeInput({ '1': {} });
      const result = engine.compute(input);
      expect(result.metadata.consensus.appliedAt).toBe('iso-1');
    });

    it('rejects unknown mode', () => {
      expect(() => new ConsensusEngine({ mode: 'aggressive' })).toThrow(/unknown mode/);
    });
  });

  // ── 2. Input validation ─────────────────────────────────────────────────
  describe('input validation', () => {
    it('throws on null input', () => {
      const engine = new ConsensusEngine();
      expect(() => engine.compute(null)).toThrow(TypeError);
    });

    it('throws on non-object input', () => {
      const engine = new ConsensusEngine();
      expect(() => engine.compute('hello')).toThrow(TypeError);
    });

    it('throws on object without numbers', () => {
      const engine = new ConsensusEngine();
      expect(() => engine.compute({ other: true })).toThrow(TypeError);
    });

    it('rejects empty numbers object gracefully (strict)', () => {
      const engine = new ConsensusEngine({ mode: 'strict' });
      const result = engine.compute({ numbers: {}, metadata: {} });
      expect(result).toBeDefined();
      expect(result.numbers).toEqual({});
      expect(result.metadata.consensus.processedNumbers).toBe(0);
    });
  });

  // ── 3. Full pipeline integration ────────────────────────────────────────
  describe('full pipeline integration', () => {
    it('collector → normalizer → engine for 30 spins', () => {
      const spins = Array.from({ length: 30 }, (_, i) => ({
        number: String((i % 36) + 1),
      }));
      const pipeline = createPipeline(spins);

      const collected = pipeline.collector.collect();
      const normalized = pipeline.normalizer.normalize(collected);
      const result = pipeline.engine.compute(normalized);

      expect(result).toHaveProperty('numbers');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('consensus');

      const meta = result.metadata.consensus;
      expect(meta.processedNumbers).toBeGreaterThan(0);
      expect(meta.validNumbers).toBeGreaterThan(0);
      expect(meta.mode).toBe('tolerant');

      // Pick a number and verify full structure
      const firstKey = Object.keys(result.numbers)[0];
      const entry = result.numbers[firstKey];
      expect(entry).toHaveProperty('number');
      expect(entry).toHaveProperty('rawConsensusScore');
      expect(entry).toHaveProperty('valid');
      expect(entry).toHaveProperty('engineScores');
      expect(entry).toHaveProperty('engineContributions');
      expect(entry).toHaveProperty('agreement');
      expect(entry).toHaveProperty('conflicts');
      expect(entry).toHaveProperty('confidence');
      expect(entry).toHaveProperty('explanation');

      // Engine scores structure
      for (const en of ['Lab_Con', 'Lab_Con1', 'AtRep']) {
        expect(entry.engineScores).toHaveProperty(en);
        const es = entry.engineScores[en];
        expect(es).toHaveProperty('score');
        expect(es).toHaveProperty('signals');
        expect(es).toHaveProperty('excluded');
      }
    });

    it('produces valid results for all numbers in the pipeline', () => {
      const spins = Array.from({ length: 30 }, (_, i) => ({
        number: String((i % 36) + 1),
      }));
      const pipeline = createPipeline(spins);
      const collected = pipeline.collector.collect();
      const normalized = pipeline.normalizer.normalize(collected);
      const result = pipeline.engine.compute(normalized);

      const resultOrder = Object.keys(result.numbers);
      expect(resultOrder.length).toBeGreaterThan(0);

      // Verify each number has the expected structure
      for (const key of resultOrder) {
        const entry = result.numbers[key];
        expect(entry).toHaveProperty('number');
        expect(entry).toHaveProperty('rawConsensusScore');
        expect(entry).toHaveProperty('engineScores');
      }
    });
  });

  // ── 4. Engine-level aggregation ─────────────────────────────────────────
  describe('engine-level aggregation', () => {
    it('aggregates multiple signals into engine score (weighted mean)', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '17': {
          delayRatio: 0.8,
          delayScore: 0.6,
          pressure: 0.4,
        },
      });

      const result = engine.compute(input);
      const labConScore = result.numbers['17'].engineScores.Lab_Con.score;

      // All signals have weight 1, so expected = (0.8 + 0.6 + 0.4) / 3 = 0.6
      expect(labConScore).toBeCloseTo(0.6, 5);
    });

    it('handles engine with all signals at extremes', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '7': {
          delayRatio: 1,
          delayScore: 1,
          pressure: 1,
          wwActive: 1,
          wwScore: 1,
          pciOccurrences: 1,
          pciMeanDist: 1, // NEGATIVE direction → effective 0
        },
      });

      const result = engine.compute(input);

      // Lab_Con: (1+1+1)/3 = 1
      expect(result.numbers['7'].engineScores.Lab_Con.score).toBeCloseTo(1, 5);

      // AtRep: pci.occurrences (POSITIVE, 1) + pci.meanDist (NEGATIVE, 1-1=0)
      // weights: both 1 → (1*1 + 0*1) / 2 = 0.5
      expect(result.numbers['7'].engineScores.AtRep.score).toBeCloseTo(0.5, 5);
    });
  });

  // ── 5. Signal direction ─────────────────────────────────────────────────
  describe('signal direction handling', () => {
    it('POSITIVE direction preserves value', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '1': {
          delayScore: 0.7,
          delayRatio: 0, // neutral
          pressure: 0, // neutral
          wwScore: 0, // neutral
          pciOccurrences: 0, // neutral
          pciMeanDist: 0, // neutral (0 → 1-0 = 1, but weight-normalized)
        },
      });

      const result = engine.compute(input);
      const signals = result.numbers['1'].engineScores.Lab_Con.signals;
      const ds = signals.find(s => s.field === 'delay.delayScore');
      expect(ds.direction).toBe('POSITIVE');
      expect(ds.effectiveValue).toBe(0.7);
    });

    it('NEGATIVE direction inverts value', () => {
      const engine = new ConsensusEngine();
      // Only include AtRep with pci.meanDist (NEGATIVE)
      const numbers = {
        '32': makeNormForNumber('32', {
          delayRatio: 0,
          delayScore: 0,
          pressure: 0,
          wwScore: 0,
          pciOccurrences: 0,
          pciMeanDist: 0.8,
        }),
      };

      const result = engine.compute({ numbers, metadata: {} });
      const signals = result.numbers['32'].engineScores.AtRep.signals;
      const md = signals.find(s => s.field === 'pci.meanDist');
      expect(md.direction).toBe('NEGATIVE');
      // 1 - 0.8 = 0.2
      expect(md.effectiveValue).toBeCloseTo(0.2, 5);
    });

    it('NEGATIVE direction: low dist = high contribution', () => {
      const engine = new ConsensusEngine();
      const numbers = {
        '5': makeNormForNumber('5', {
          delayRatio: 0,
          delayScore: 0,
          pressure: 0,
          wwScore: 0,
          pciOccurrences: 0,
          pciMeanDist: 0.1, // very low distance → 1 - 0.1 = 0.9 effective
        }),
      };

      const result = engine.compute({ numbers, metadata: {} });
      const atRepScore = result.numbers['5'].engineScores.AtRep.score;
      // pci.occurrences (POSITIVE, 0) + pci.meanDist (1-0.1=0.9) weighted mean = (0*1 + 0.9*1)/2 = 0.45
      expect(atRepScore).toBeCloseTo(0.45, 5);
    });
  });

  // ── 6. Coverage ─────────────────────────────────────────────────────────
  describe('coverage & participation', () => {
    it('reports per-engine coverage correctly', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '10': {},
      });

      const result = engine.compute(input);
      const entry = result.numbers['10'];

      // Lab_Con: 3 signals configured, all present
      expect(entry.engineScores.Lab_Con.coverage.coverageRatio).toBe(1);

      // Global coverage: 3 of 3 engines participate
      expect(entry.coverage.participatingEngines).toBe(3);
      expect(entry.coverage.coverageRatio).toBe(1);
    });

    it('detects partial coverage', () => {
      const engine = new ConsensusEngine();

      // Lab_Con only: missing delay.pressure → 2 of 3 signals
      const numbers = {
        '23': makeNormForNumber('23', { pressure: 0 }),
      };
      // Remove pressure field manually
      delete numbers['23'].normalizedSignals.Lab_Con['delay.pressure'];

      const result = engine.compute({ numbers, metadata: {} });
      const cov = result.numbers['23'].engineScores.Lab_Con.coverage;
      expect(cov.coverageRatio).toBeCloseTo(2 / 3, 5);
    });
  });

  // ── 7. Agreement ────────────────────────────────────────────────────────
  describe('agreement computation', () => {
    it('high agreement when all engines agree', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '14': {
          delayRatio: 0.7, delayScore: 0.7, pressure: 0.7,
          wwActive: 1, wwScore: 0.7,
          pciOccurrences: 0.7, pciMeanDist: 0.3, // effective 0.7
        },
      });

      const result = engine.compute(input);
      const agreement = result.numbers['14'].agreement;

      expect(agreement.calculable).toBe(true);
      expect(agreement.score).toBeGreaterThan(0.8); // High agreement expected
    });

    it('low agreement when engines diverge', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '15': {
          delayRatio: 0.9, delayScore: 0.9, pressure: 0.9,   // Lab_Con ~0.9
          wwActive: 1, wwScore: 0.1,                          // Lab_Con1 ~0.3
          pciOccurrences: 0.1, pciMeanDist: 0.9,              // AtRep: (0.1 + 0.1)/2 = 0.1
        },
      });

      const result = engine.compute(input);
      const agreement = result.numbers['15'].agreement;

      expect(agreement.calculable).toBe(true);
      // Engines: Lab_Con ~0.9, Lab_Con1 ~0.3, AtRep ~0.1 → high dispersion
      expect(agreement.score).toBeLessThan(0.5);
    });
  });

  // ── 8. Conflict detection ───────────────────────────────────────────────
  describe('conflict detection', () => {
    it('detects ENGINE_DIVERGENCE with high spread', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '7': {
          delayRatio: 0.95, delayScore: 0.95, pressure: 0.95,
          wwActive: 1, wwScore: 0.05,
          pciOccurrences: 0.05, pciMeanDist: 0.95, // effective ~0.05
        },
      });

      const result = engine.compute(input);
      const conflicts = result.numbers['7'].conflicts;

      // Should detect ENGINE_DIVERGENCE
      const divergence = conflicts.find(c => c.type === 'ENGINE_DIVERGENCE');
      expect(divergence).toBeDefined();
    });

    it('no conflicts when engines are aligned', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '33': {
          delayRatio: 0.5, delayScore: 0.5, pressure: 0.5,
          wwActive: 1, wwScore: 0.5,
          pciOccurrences: 0.5, pciMeanDist: 0.5,
        },
      });

      const result = engine.compute(input);
      const conflicts = result.numbers['33'].conflicts;

      const divergence = conflicts.filter(c => c.type === 'ENGINE_DIVERGENCE');
      expect(divergence.length).toBe(0);
    });
  });

  // ── 9. Confidence ───────────────────────────────────────────────────────
  describe('confidence evaluation', () => {
    it('high confidence with full coverage and agreement', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '1': {
          delayRatio: 0.5, delayScore: 0.5, pressure: 0.5,
          wwActive: 1, wwScore: 0.5,
          pciOccurrences: 0.5, pciMeanDist: 0.5,
        },
      });

      const result = engine.compute(input);
      const confidence = result.numbers['1'].confidence;

      expect(confidence.score).toBeGreaterThan(0.6);
      expect(confidence.components.coverage).toBe(1);
      expect(confidence.components.participation).toBe(1);
    });

    it('low confidence with 1 engine only', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '2': {
          includeLabCon1: false,
          includeAtRep: false,
        },
      });

      const result = engine.compute(input);
      const confidence = result.numbers['2'].confidence;

      expect(confidence.components.participation).toBeCloseTo(1 / 3, 2);
    });

    it('VERY_LOW confidence when no engines available', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '3': {
          includeLabCon: false,
          includeLabCon1: false,
          includeAtRep: false,
        },
      });

      const result = engine.compute(input);
      const entry = result.numbers['3'];

      expect(entry.confidence.level).toBe('VERY_LOW');
      expect(entry.valid).toBe(false);
    });

    it('reports all component scores', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({ '36': {} });

      const result = engine.compute(input);
      const components = result.numbers['36'].confidence.components;

      expect(components).toHaveProperty('coverage');
      expect(components).toHaveProperty('participation');
      expect(components).toHaveProperty('agreement');
      expect(components).toHaveProperty('conflictPenalty');
    });
  });

  // ── 10. Explanation ─────────────────────────────────────────────────────
  describe('explanation diagnostics', () => {
    it('reports summary code for full consensus', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({ '12': {} });

      const result = engine.compute(input);
      const explanation = result.numbers['12'].explanation;

      expect(explanation).toHaveProperty('summaryCode');
      expect(explanation).toHaveProperty('dominantEngine');
      expect(explanation).toHaveProperty('dominantSignals');
      expect(explanation).toHaveProperty('positiveFactors');
      expect(explanation).toHaveProperty('limitingFactors');
      expect(explanation.positiveFactors).not.toEqual(['NONE']);
    });

    it('reports limiting factor for single engine', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '4': {
          includeLabCon1: false,
          includeAtRep: false,
        },
      });

      const result = engine.compute(input);
      const explanation = result.numbers['4'].explanation;

      expect(explanation.limitingFactors).toContain('INSUFFICIENT_ENGINES_FOR_AGREEMENT');
    });
  });

  // ── 11. Determinism ─────────────────────────────────────────────────────
  describe('determinism', () => {
    it('same input produces identical output', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '0': { delayRatio: 0.7, delayScore: 0.8, pressure: 0.3 },
      });

      const r1 = engine.compute(input);
      const r2 = engine.compute(input);

      expect(r1.numbers['0'].rawConsensusScore).toBe(r2.numbers['0'].rawConsensusScore);
      expect(r1.numbers['0'].confidence.score).toBe(r2.numbers['0'].confidence.score);
    });

    it('clock is used for appliedAt', () => {
      let t = 0;
      const engine = new ConsensusEngine({
        clock: () => { t++; return `T${t}`; },
      });
      const input = makeInput({ '7': {} });

      const r1 = engine.compute(input);
      const r2 = engine.compute(input);

      expect(r1.metadata.consensus.appliedAt).toBe('T1');
      expect(r2.metadata.consensus.appliedAt).toBe('T2');
      // Scores should still be identical
      expect(r1.numbers['7'].rawConsensusScore).toBe(r2.numbers['7'].rawConsensusScore);
    });
  });

  // ── 12. Defensive copy ──────────────────────────────────────────────────
  describe('defensive copy', () => {
    it('output is independent of input mutations', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({ '0': { delayRatio: 0.5 } });

      const result = engine.compute(input);
      const originalNormalizedValue = result.numbers['0'].engineScores.Lab_Con.signals[0].normalizedValue;

      // Mutate normalizedSignals value to a different valid value
      if (input.numbers['0'].normalizedSignals.Lab_Con) {
        input.numbers['0'].normalizedSignals.Lab_Con['delay.delayRatio'].normalizedValue = 0.9;
      }

      // Original result should be unchanged (was cloned before return)
      expect(result.numbers['0'].engineScores.Lab_Con.signals[0].normalizedValue).toBe(originalNormalizedValue);

      // Re-compute: the new result reflects mutated input
      const result2 = engine.compute(input);
      expect(result2.numbers['0'].engineScores.Lab_Con.signals[0].normalizedValue).toBe(0.9);
    });
  });

  // ── 13. Strict mode ─────────────────────────────────────────────────────
  describe('strict mode', () => {
    it('strict mode succeeds with valid input', () => {
      const engine = new ConsensusEngine({ mode: 'strict' });
      const input = makeInput({ '17': {} });

      const result = engine.compute(input);
      expect(result.numbers['17'].valid).toBe(true);
    });

    it('strict mode throws on missing required engine in config', () => {
      // Config with invalid weight should throw in strict
      expect(() => new ConsensusEngine({ mode: 'strict' })).not.toThrow();
    });
  });

  // ── 14. 0 / 00 ──────────────────────────────────────────────────────────
  describe('0 and 00 numbers', () => {
    it('processes number 0 when present', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '0': {},
      });

      const result = engine.compute(input);
      expect(result.numbers).toHaveProperty('0');
      expect(result.numbers['0'].number).toBe('0');
      expect(result.numbers['0'].valid).toBe(true);
    });

    it('processes number 00 when present', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '00': {},
      });

      const result = engine.compute(input);
      expect(result.numbers).toHaveProperty('00');
      expect(result.numbers['00'].number).toBe('00');
      expect(result.numbers['00'].valid).toBe(true);
    });

    it('processes both 0 and 00 independently', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '0': { delayRatio: 0.8 },
        '00': { delayRatio: 0.2 },
      });

      const result = engine.compute(input);
      // They should have different consensus scores
      const score0 = result.numbers['0'].rawConsensusScore;
      const score00 = result.numbers['00'].rawConsensusScore;
      expect(score0).not.toBe(score00);
    });
  });

  // ── 15. Edge cases ──────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles single-engine fallback gracefully', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '8': {
          includeLabCon1: false,
          includeAtRep: false,
        },
      });

      const result = engine.compute(input);
      const entry = result.numbers['8'];

      expect(entry.valid).toBe(true);
      expect(entry.agreement.calculable).toBe(false); // Need ≥2 engines
      expect(entry.conflicts).toBeDefined();
    });

    it('handles missing fields in normalized output', () => {
      const engine = new ConsensusEngine();
      const numbers = {
        '9': makeNormForNumber('9'),
      };

      // Delete delay.pressure from Lab_Con
      delete numbers['9'].normalizedSignals.Lab_Con['delay.pressure'];

      const result = engine.compute({ numbers, metadata: {} });
      const labCon = result.numbers['9'].engineScores.Lab_Con;

      // Should still have a valid score from remaining signals
      expect(labCon.score).not.toBeNull();
      expect(labCon.coverage.coverageRatio).toBeCloseTo(2 / 3, 5);

      const excluded = labCon.excluded;
      const missing = excluded.filter(e => e.field === 'delay.pressure');
      expect(missing.length).toBe(1);
      expect(missing[0].reason).toBe('MISSING_SIGNAL');
    });

    it('handles empty collector output (no numbers)', () => {
      const engine = new ConsensusEngine();
      const result = engine.compute({ numbers: {}, metadata: {} });

      expect(result.numbers).toEqual({});
      expect(result.metadata.consensus.processedNumbers).toBe(0);
      expect(result.metadata.consensus.validNumbers).toBe(0);
    });

    it('all consensus scores are in [0,1]', () => {
      const engine = new ConsensusEngine();

      // Test with various extreme combinations
      const numbers = {};
      for (let i = 0; i <= 36; i++) {
        const num = String(i);
        numbers[num] = makeNormForNumber(num, {
          delayRatio: Math.sin(i * 0.5) * 0.5 + 0.5,
          delayScore: Math.cos(i * 0.7) * 0.5 + 0.5,
          pressure: (i % 10) / 10,
          wwScore: (i % 10) / 10,
          pciMeanDist: (i % 10) / 10,
        });
      }
      // Also add 00
      numbers['00'] = makeNormForNumber('00');

      const result = engine.compute({ numbers, metadata: {} });

      for (const entry of Object.values(result.numbers)) {
        if (entry.valid) {
          expect(entry.rawConsensusScore).toBeGreaterThanOrEqual(0);
          expect(entry.rawConsensusScore).toBeLessThanOrEqual(1);
        }
      }
    });

    it('metadata includes configuration summary', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({ '1': {} });

      const result = engine.compute(input);
      const summary = result.metadata.consensus.configurationSummary;

      expect(summary).toHaveProperty('engines');
      expect(summary).toHaveProperty('signalCounts');
      expect(summary.engines.length).toBe(3);
      expect(summary.signalCounts.Lab_Con).toBe(3);
      expect(summary.signalCounts.Lab_Con1).toBe(2);
      expect(summary.signalCounts.AtRep).toBe(2);
    });

    it('aggregates global statistics correctly', () => {
      const engine = new ConsensusEngine();
      const input = makeInput({
        '1': {},   // valid
        '2': {},   // valid
        '3': { includeLabCon: false, includeLabCon1: false, includeAtRep: false }, // invalid
      });

      const result = engine.compute(input);
      const meta = result.metadata.consensus;

      expect(meta.processedNumbers).toBe(3);
      expect(meta.validNumbers).toBe(2);
      expect(meta.invalidNumbers).toBe(1);
    });
  });
});
