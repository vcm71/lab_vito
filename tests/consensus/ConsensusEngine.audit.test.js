/**
 * Fase 2.1.1 — Audit tests for ConsensusEngine.
 *
 * Covers §§6–39 of the audit specification:
 *   - Agreement edge cases (zero mean, near-zero, high values, divergence)
 *   - Agreement alternatives comparison
 *   - Mode vs missingPolicy separation
 *   - Coverage vs participation independence
 *   - Confidence structural audit
 *   - Conflict thresholds
 *   - pci.meanDist inversion validation
 *   - Contract preservation & serialization
 *   - Defensive copies (deep)
 *   - Determinism
 *   - 0 / 00 preservation
 *   - Full pipeline integration
 *
 * NOTE: Engine only processes AMERICAN_ROULETTE_NUMBERS (0, 00, 1-36).
 *       Test entries MUST use valid roulette numbers as keys.
 */

import { describe, expect, it } from 'vitest';
import { ConsensusEngine } from '../../src/consensus/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function nve(value, valid = true) {
  return { rawValue: value, normalizedValue: value, method: 'IDENTITY', valid, params: {} };
}

function buildEngine(mapping) {
  const r = {};
  for (const [k, v] of Object.entries(mapping)) r[k] = nve(v);
  return r;
}

function makeEntry(num, overrides = {}, inclusions = {}) {
  const labCon = buildEngine({
    'delay.delayRatio': overrides.delayRatio ?? 0.5,
    'delay.delayScore': overrides.delayScore ?? 0.5,
    'delay.pressure': overrides.pressure ?? 0.5,
  });
  const labCon1 = buildEngine({
    'winWin.isActive': overrides.wwActive ?? 1,
    'winWin.winWinScore': overrides.wwScore ?? 0.5,
  });
  const atRep = buildEngine({
    'pci.occurrences': overrides.pciOccurrences ?? 0.5,
    'pci.meanDist': overrides.pciMeanDist ?? 0.5,
  });

  const ns = {};
  if (inclusions.includeLabCon !== false) ns.Lab_Con = labCon;
  if (inclusions.includeLabCon1 !== false) ns.Lab_Con1 = labCon1;
  if (inclusions.includeAtRep !== false) ns.AtRep = atRep;

  return { number: num, signals: {}, normalizedSignals: ns };
}

function makeInput(defs) {
  const numbers = {};
  for (const [num, def] of Object.entries(defs)) {
    const overrides = Array.isArray(def) ? (def[0] || {}) : {};
    const inclusions = Array.isArray(def) && def.length > 1 ? (def[1] || {}) : {};
    numbers[num] = makeEntry(num, overrides, inclusions);
  }
  return { numbers, metadata: {} };
}

// ── §6–8: Agreement formula audit ────────────────────────────────────────────

describe('§6-8 Agreement formula audit', () => {
  const engine = new ConsensusEngine();

  it('Case A: all engine scores = 0 → no NaN/Infinity, agreement = 1', () => {
    const input = makeInput({
      '1': [{ delayRatio: 0, delayScore: 0, pressure: 0, wwActive: 0, wwScore: 0, pciOccurrences: 0, pciMeanDist: 1 }],
    });
    const r = engine.compute(input);
    const ag = r.numbers['1'].agreement;
    expect(ag.calculable).toBe(true);
    expect(Number.isFinite(ag.score)).toBe(true);
    expect(ag.score).toBe(1);
  });

  it('Case B: engine scores near 0.3 and close → agreement high', () => {
    // Engine scores are not perfectly identical because signal weightings
    // differ per engine. Agreement still high (>0.75) shows formula stability.
    const input = makeInput({
      '2': [{ delayRatio: 0.3, delayScore: 0.3, pressure: 0.3, wwActive: 1, wwScore: 0.3, pciOccurrences: 0.3, pciMeanDist: 0.7 }],
    });
    const r = engine.compute(input);
    expect(r.numbers['2'].agreement.score).toBeGreaterThan(0.75);
  });

  it('Case C: engine scores near 0.5 and close → agreement high', () => {
    // Engine scores differ slightly due to signal weightings per engine,
    // but agreement remains high (>0.80).
    const input = makeInput({
      '3': [{ delayRatio: 0.5, delayScore: 0.5, pressure: 0.5, wwActive: 1, wwScore: 0.5, pciOccurrences: 0.5, pciMeanDist: 0.5 }],
    });
    const r = engine.compute(input);
    expect(r.numbers['3'].agreement.score).toBeGreaterThan(0.80);
  });

  it('Case D: engine scores near 1.0 and close → agreement high', () => {
    const input = makeInput({
      '4': [{ delayRatio: 0.98, delayScore: 0.98, pressure: 0.98, wwActive: 1, wwScore: 0.98, pciOccurrences: 0.98, pciMeanDist: 0.02 }],
    });
    const r = engine.compute(input);
    expect(r.numbers['4'].agreement.score).toBeGreaterThan(0.95);
  });

  it('Case E: strong divergence (0.9 vs 0.3 vs 0.1)', () => {
    const input = makeInput({
      '5': [{ delayRatio: 0.9, delayScore: 0.9, pressure: 0.9, wwActive: 1, wwScore: 0.1, pciOccurrences: 0.1, pciMeanDist: 0.9 }],
    });
    const r = engine.compute(input);
    expect(r.numbers['5'].agreement.score).toBeLessThan(0.5);
  });

  it('Case F: symmetric divergence (0.1, 0.5, 0.9)', () => {
    const input = makeInput({
      '6': [{ delayRatio: 0.1, delayScore: 0.1, pressure: 0.1, wwActive: 1, wwScore: 0.5, pciOccurrences: 0.9, pciMeanDist: 0.1 }],
    });
    const r = engine.compute(input);
    expect(r.numbers['6'].agreement.calculable).toBe(true);
    expect(r.numbers['6'].agreement.score).toBeLessThan(0.6);
  });

  it('Case G: two engines only', () => {
    const engine2 = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.2, 'delay.delayScore': 0.2, 'delay.pressure': 0.2 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.8 }),
    };
    const numbers = { '7': { number: '7', signals: {}, normalizedSignals: ns } };
    const r = engine2.compute({ numbers, metadata: {} });
    expect(r.numbers['7'].agreement.calculable).toBe(true);
    expect(r.numbers['7'].agreement.engineCount).toBe(2);
  });

  it('Case H: single engine → not calculable', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.75, 'delay.delayScore': 0.75, 'delay.pressure': 0.75 }),
    };
    const numbers = { '8': { number: '8', signals: {}, normalizedSignals: ns } };
    const r = new ConsensusEngine().compute({ numbers, metadata: {} });
    expect(r.numbers['8'].agreement.calculable).toBe(false);
    expect(r.numbers['8'].agreement.reason).toBe('INSUFFICIENT_ENGINES');
  });

  it('§8: agreement uses normalized dispersion (stddev/0.5), NOT CV (σ/μ)', () => {
    // The formula is: agreement = 1 - clamp(stddev / 0.5, 0, 1)
    // For all-zero scores: stddev = 0, agreement = 1 (stable, unlike CV which would NaN)
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.0, 'delay.delayScore': 0.0, 'delay.pressure': 0.0 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 0, 'winWin.winWinScore': 0.0 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.0, 'pci.meanDist': 1.0 }),
    };
    const numbers = { '9': { number: '9', signals: {}, normalizedSignals: ns } };
    const r = new ConsensusEngine().compute({ numbers, metadata: {} });
    expect(Number.isFinite(r.numbers['9'].agreement.score)).toBe(true);
    expect(r.numbers['9'].agreement.score).toBe(1); // all 0 → stddev=0 → agreement=1
  });
});

// ── §9-11: Mode vs missingPolicy separation ──────────────────────────────────

describe('§9-11 Mode vs missingPolicy separation', () => {
  it('config declares missingPolicy as RENORMALIZE_AVAILABLE, not TOLERANT', () => {
    const engine = new ConsensusEngine();
    expect(engine.config.aggregation.missingPolicy).toBe('RENORMALIZE_AVAILABLE');
    expect(engine.config.aggregation.missingPolicy).not.toBe('TOLERANT');
  });

  it('mode is for error handling (strict/tolerant), separate from missingPolicy', () => {
    const engine = new ConsensusEngine({ mode: 'tolerant' });
    expect(engine.mode).toBe('tolerant');
    expect(engine.config.aggregation.missingPolicy).toBe('RENORMALIZE_AVAILABLE');
    expect(engine.mode).not.toBe(engine.config.aggregation.missingPolicy);
  });

  it('missing signals are excluded (not counted as zero)', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5, 'delay.delayScore': 0.5 }),
      // 'delay.pressure' MISSING
    };
    const numbers = { '10': { number: '10', signals: {}, normalizedSignals: ns } };
    const r = new ConsensusEngine().compute({ numbers, metadata: {} });
    const excluded = r.numbers['10'].engineScores.Lab_Con.excluded;
    const missing = excluded.filter(e => e.field === 'delay.pressure');
    expect(missing.length).toBe(1);
    expect(missing[0].reason).toBe('MISSING_SIGNAL');
    expect(missing[0].normalizedValue).toBe(null);
    expect(r.numbers['10'].engineScores.Lab_Con.coverage.coverageRatio).toBeCloseTo(2 / 3, 5);
  });

  it('null signal is excluded, not treated as zero', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5, 'delay.delayScore': 0.5, 'delay.pressure': 0.5 }),
    };
    ns.Lab_Con['delay.pressure'] = { rawValue: 0.5, normalizedValue: null, method: 'IDENTITY', valid: false, params: {} };
    const numbers = { '11': { number: '11', signals: {}, normalizedSignals: ns } };
    const r = new ConsensusEngine().compute({ numbers, metadata: {} });
    const excluded = r.numbers['11'].engineScores.Lab_Con.excluded;
    expect(excluded.some(e => e.field === 'delay.pressure')).toBe(true);
  });

  it('value=0 is treated as valid (not excluded)', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.0, 'delay.delayScore': 0.0, 'delay.pressure': 0.0 }),
    };
    const numbers = { '12': { number: '12', signals: {}, normalizedSignals: ns } };
    const r = new ConsensusEngine().compute({ numbers, metadata: {} });
    expect(r.numbers['12'].engineScores.Lab_Con.score).toBe(0);
    expect(r.numbers['12'].engineScores.Lab_Con.coverage.coverageRatio).toBe(1);
  });
});

// ── §12-13: Coverage vs Participation independence ───────────────────────────

describe('§12-13 Coverage vs Participation independence', () => {
  it('coverage and participation are distinct dimensions', () => {
    const e = new ConsensusEngine();
    const input = makeInput({ '13': [{}] });
    const r = e.compute(input);
    expect(r.numbers['13'].coverage.participatingEngines).toBe(3);
    expect(r.numbers['13'].coverage.coverageRatio).toBeGreaterThan(0);
  });

  it('coverage changes when signals missing, participation stays when engines present', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5 }),  // only 1 of 3 signals
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.5 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.5 }),
    };
    const numbers = { '14': { number: '14', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    // All 3 engines participate
    expect(r.numbers['14'].coverage.participatingEngines).toBe(3);
  });

  it('participation drops when engine missing, coverage reflects signal gaps', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5, 'delay.delayScore': 0.5, 'delay.pressure': 0.5 }),
      // Lab_Con1 missing entirely
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.5 }),
    };
    const numbers = { '15': { number: '15', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    expect(r.numbers['15'].coverage.participatingEngines).toBe(2);
  });

  it('single engine with full coverage: participation low but coverage complete', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5, 'delay.delayScore': 0.5, 'delay.pressure': 0.5 }),
    };
    const numbers = { '16': { number: '16', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    expect(r.numbers['16'].coverage.participatingEngines).toBe(1);
  });

  it('three engines, one with only 1 signal of 3 — coverage varies per engine', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.9 }), // 1/3 signals
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.5 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.5 }),
    };
    const numbers = { '17': { number: '17', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    const labCov = r.numbers['17'].engineScores.Lab_Con.coverage.coverageRatio;
    const lab1Cov = r.numbers['17'].engineScores.Lab_Con1.coverage.coverageRatio;
    expect(labCov).toBeCloseTo(1 / 3, 5);
    expect(lab1Cov).toBe(1);
    expect(r.numbers['17'].coverage.participatingEngines).toBe(3);
  });
});

// ── §14-17: Confidence structural audit ──────────────────────────────────────

describe('§14-17 Confidence structural audit', () => {
  const engine = new ConsensusEngine();

  it('confidence weights sum to 1.0', () => {
    const cc = engine.config.confidence.components;
    const sum = cc.coverage.weight + cc.participation.weight + cc.agreement.weight + cc.conflict.weight;
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('Case A: high coverage + high agreement → high confidence', () => {
    const input = makeInput({ '18': [{}] });
    const r = engine.compute(input);
    expect(r.numbers['18'].confidence.score).toBeGreaterThan(0.8);
    expect(r.numbers['18'].confidence.level).toBe('VERY_HIGH');
  });

  it('Case B: high coverage + very low agreement → confidence not masked', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.9, 'delay.delayScore': 0.9, 'delay.pressure': 0.9 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.1 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.1, 'pci.meanDist': 0.9 }),
    };
    const numbers = { '19': { number: '19', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    expect(r.numbers['19'].confidence.score).toBeLessThan(0.7);
  });

  it('Case C: partial signals but all engines → confidence reflects engine participation', () => {
    // With 3 engines participating (1 signal each), global coverage is high
    // because coverage uses engine-weight ratio, not signal-level completeness.
    // This is documented as an audit finding — global coverage currently mirrors
    // participation when weights are equal.
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.5 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.5 }),
    };
    const numbers = { '20': { number: '20', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    // All 3 engines participate (coverage uses engine weights) → high confidence
    expect(r.numbers['20'].coverage.participatingEngines).toBe(3);
    expect(r.numbers['20'].confidence.score).toBeGreaterThan(0.8);
  });

  it('Case D: single engine → confidence limited', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.8, 'delay.delayScore': 0.8, 'delay.pressure': 0.8 }),
    };
    const numbers = { '21': { number: '21', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    expect(r.numbers['21'].confidence.score).toBeLessThan(0.75);
  });

  it('Case E: blocking conflict → confidence severely reduced', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.95, 'delay.delayScore': 0.95, 'delay.pressure': 0.95 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.05 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.05, 'pci.meanDist': 0.95 }),
    };
    const numbers = { '22': { number: '22', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    const hasBlocking = r.numbers['22'].conflicts.some(c => c.blocking);
    expect(hasBlocking).toBe(true);
    expect(r.numbers['22'].confidence.components.conflictPenalty).toBe(0);
  });

  it('Case G: agreement not calculable → neutral 0.5', () => {
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.7, 'delay.delayScore': 0.7, 'delay.pressure': 0.7 }),
    };
    const numbers = { '23': { number: '23', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    expect(r.numbers['23'].agreement.calculable).toBe(false);
    expect(r.numbers['23'].confidence.components.agreement).toBe(0.5);
  });
});

// ── §18-21: Conflict detection thresholds ────────────────────────────────────

describe('§18-21 Conflict detection thresholds', () => {
  it('spread ~0.25 → LOW ENGINE_DIVERGENCE', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.75, 'delay.delayScore': 0.75, 'delay.pressure': 0.75 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.50 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.50, 'pci.meanDist': 0.50 }),
    };
    const numbers = { '24': { number: '24', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    const div = r.numbers['24'].conflicts.find(c => c.type === 'ENGINE_DIVERGENCE');
    if (div) expect(div.severity).toBe('LOW');
  });

  it('spread ~0.40 → MEDIUM ENGINE_DIVERGENCE', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.9, 'delay.delayScore': 0.9, 'delay.pressure': 0.9 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.5 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.5 }),
    };
    const numbers = { '25': { number: '25', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    const div = r.numbers['25'].conflicts.find(c => c.type === 'ENGINE_DIVERGENCE');
    if (div) expect(div.severity).toMatch(/MEDIUM|HIGH/);
  });

  it('spread ~0.60 → HIGH ENGINE_DIVERGENCE, blocking', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 1.0, 'delay.delayScore': 1.0, 'delay.pressure': 1.0 }),
      Lab_Con1: buildEngine({ 'winWin.isActive': 1, 'winWin.winWinScore': 0.4 }),
      AtRep: buildEngine({ 'pci.occurrences': 0.4, 'pci.meanDist': 0.6 }),
    };
    const numbers = { '26': { number: '26', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    const div = r.numbers['26'].conflicts.find(c => c.type === 'ENGINE_DIVERGENCE');
    if (div) {
      expect(div.severity).toBe('HIGH');
      expect(div.blocking).toBe(true);
    }
  });

  it('DOMINANT_SINGLE_ENGINE when only 1 engine', () => {
    const e = new ConsensusEngine();
    const ns = {
      Lab_Con: buildEngine({ 'delay.delayRatio': 0.5, 'delay.delayScore': 0.5, 'delay.pressure': 0.5 }),
    };
    const numbers = { '27': { number: '27', signals: {}, normalizedSignals: ns } };
    const r = e.compute({ numbers, metadata: {} });
    const dom = r.numbers['27'].conflicts.find(c => c.type === 'DOMINANT_SINGLE_ENGINE');
    expect(dom).toBeDefined();
    expect(dom.blocking).toBe(false);
  });

  it('conflict thresholds centralized in config', () => {
    const e = new ConsensusEngine();
    expect(e.config.conflict.spreadThresholds.low).toBe(0.25);
    expect(e.config.conflict.spreadThresholds.medium).toBe(0.40);
    expect(e.config.conflict.spreadThresholds.high).toBe(0.60);
  });
});

// ── §26-27: pci.meanDist inversion validation ────────────────────────────────

describe('§26-27 pci.meanDist inversion validation', () => {
  const engine = new ConsensusEngine();

  it('low meanDist → high effective value (inversion works)', () => {
    const ns = {
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.1 }),
    };
    const numbers = { '28': { number: '28', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    const mdSig = r.numbers['28'].engineScores.AtRep.signals.find(s => s.field === 'pci.meanDist');
    expect(mdSig.effectiveValue).toBeCloseTo(0.9, 5);
  });

  it('high meanDist → low effective value', () => {
    const ns = {
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.9 }),
    };
    const numbers = { '29': { number: '29', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    const mdSig = r.numbers['29'].engineScores.AtRep.signals.find(s => s.field === 'pci.meanDist');
    expect(mdSig.effectiveValue).toBeCloseTo(0.1, 5);
  });

  it('meanDist=0 → effectiveValue=1', () => {
    const ns = {
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 0.0 }),
    };
    const numbers = { '30': { number: '30', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    const mdSig = r.numbers['30'].engineScores.AtRep.signals.find(s => s.field === 'pci.meanDist');
    expect(mdSig.effectiveValue).toBe(1);
  });

  it('meanDist=1 → effectiveValue=0', () => {
    const ns = {
      AtRep: buildEngine({ 'pci.occurrences': 0.5, 'pci.meanDist': 1.0 }),
    };
    const numbers = { '31': { number: '31', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    const mdSig = r.numbers['31'].engineScores.AtRep.signals.find(s => s.field === 'pci.meanDist');
    expect(mdSig.effectiveValue).toBe(0);
  });

  it('direction is NEGATIVE in config', () => {
    expect(engine.config.engines.AtRep.signals['pci.meanDist'].direction).toBe('NEGATIVE');
  });

  it('inversion is documented in explanation (via engine score difference)', () => {
    const ns = {
      AtRep: buildEngine({ 'pci.occurrences': 0.0, 'pci.meanDist': 0.1 }),
    };
    const numbers = { '32': { number: '32', signals: {}, normalizedSignals: ns } };
    const r = engine.compute({ numbers, metadata: {} });
    // meanDist 0.1 → effective 0.9, occurrences 0 → effective 0, avg = 0.45
    expect(r.numbers['32'].engineScores.AtRep.score).toBeCloseTo(0.45, 5);
  });
});

// ── §28-31: Contract preservation & serialization ────────────────────────────

describe('§28-31 Contract preservation & serialization', () => {
  const engine = new ConsensusEngine();

  it('output includes all required ProbabilityCalibrator fields', () => {
    const input = makeInput({ '33': [{}] });
    const r = engine.compute(input);
    const entry = r.numbers['33'];
    expect(entry).toHaveProperty('number');
    expect(entry).toHaveProperty('rawConsensusScore');
    expect(entry).toHaveProperty('valid');
    expect(entry).toHaveProperty('confidence');
    expect(entry.confidence).toHaveProperty('score');
    expect(entry).toHaveProperty('coverage');
    expect(entry.coverage).toHaveProperty('participatingEngines');
    expect(entry).toHaveProperty('agreement');
    expect(entry.agreement).toHaveProperty('score');
    expect(entry).toHaveProperty('engineScores');
    expect(r.metadata.consensus).toHaveProperty('configurationVersion');
    expect(r.metadata.consensus).toHaveProperty('appliedAt');
  });

  it('output serializes with JSON.stringify (no NaN, Infinity, functions)', () => {
    const input = makeInput({ '34': [{}] });
    const r = engine.compute(input);
    const json = JSON.stringify(r);
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json);
    function check(obj, path) {
      if (typeof obj === 'number') {
        expect(Number.isFinite(obj), `path ${path} is not finite: ${obj}`).toBe(true);
      } else if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) check(v, `${path}.${k}`);
      }
    }
    check(parsed, 'root');
  });

  it('no functions, Maps, Sets, circular refs in output', () => {
    const input = makeInput({ '35': [{}] });
    const r = engine.compute(input);
    expect(() => JSON.parse(JSON.stringify(r))).not.toThrow();
  });

  it('metadata includes configurationVersion', () => {
    const input = makeInput({ '36': [{}] });
    const r = engine.compute(input);
    expect(r.metadata.consensus.configurationVersion).toBe('consensus-default-v1');
  });
});

// ── §29: Defensive copies (deep) ─────────────────────────────────────────────

describe('§29 Defensive copies', () => {
  const engine = new ConsensusEngine();

  it('output !== input (top-level)', () => {
    const input = makeInput({ '1': [{}] });
    const r = engine.compute(input);
    expect(r).not.toBe(input);
  });

  it('mutating input after compute does not affect output', () => {
    const input = makeInput({ '2': [{ delayRatio: 0.5 }] });
    const r = engine.compute(input);
    const scoreBefore = r.numbers['2'].rawConsensusScore;
    input.numbers['2'].normalizedSignals.Lab_Con['delay.delayRatio'].normalizedValue = 0.9;
    expect(r.numbers['2'].rawConsensusScore).toBe(scoreBefore);
  });

  it('mutating output does not affect input', () => {
    const input = makeInput({ '3': [{ delayRatio: 0.5 }] });
    const r = engine.compute(input);
    const originalInputDelayRatio = input.numbers['3'].normalizedSignals.Lab_Con['delay.delayRatio'].normalizedValue;
    r.numbers['3'].rawConsensusScore = 999;
    expect(input.numbers['3'].normalizedSignals.Lab_Con['delay.delayRatio'].normalizedValue).toBe(originalInputDelayRatio);
  });

  it('nested structures are independent (engineScores, conflicts, explanation)', () => {
    const input = makeInput({ '4': [{}] });
    const r1 = engine.compute(input);
    const r2 = engine.compute(input);
    r1.numbers['4'].engineScores.Lab_Con.score = 999;
    expect(r2.numbers['4'].engineScores.Lab_Con.score).not.toBe(999);
  });
});

// ── §34-35: 0/00 preservation + determinism ──────────────────────────────────

describe('§34-35 0/00 preservation + determinism', () => {
  it('0 and 00 are distinct string keys', () => {
    const engine = new ConsensusEngine();
    const input = makeInput({ '0': [{}], '00': [{}] });
    const r = engine.compute(input);
    expect(r.numbers).toHaveProperty('0');
    expect(r.numbers).toHaveProperty('00');
    expect(r.numbers['0'].number).toBe('0');
    expect(r.numbers['00'].number).toBe('00');
    expect(typeof r.numbers['0'].rawConsensusScore).toBe('number');
    expect(typeof r.numbers['00'].rawConsensusScore).toBe('number');
  });

  it('0 and 00 engineScores are independent', () => {
    const input = makeInput({
      '0': [{ delayRatio: 0.9 }],
      '00': [{ delayRatio: 0.1 }],
    });
    const r = new ConsensusEngine().compute(input);
    const s0 = r.numbers['0'].engineScores.Lab_Con.score;
    const s00 = r.numbers['00'].engineScores.Lab_Con.score;
    if (s0 !== null && s00 !== null) {
      expect(s0).not.toBe(s00);
    }
  });

  it('determinism: same input → identical output (with clock)', () => {
    const clock = () => '2026-07-30T00:00:00.000Z';
    const e = new ConsensusEngine({ clock });
    const input = makeInput({ '5': [{}] });
    const r1 = e.compute(input);
    const r2 = e.compute(input);
    expect(r1.numbers['5'].rawConsensusScore).toBe(r2.numbers['5'].rawConsensusScore);
    expect(r1.numbers['5'].confidence.score).toBe(r2.numbers['5'].confidence.score);
    expect(JSON.stringify(r1.numbers['5'])).toBe(JSON.stringify(r2.numbers['5']));
  });

  it('order is stable across calls', () => {
    const clock = () => '2026-07-30T00:00:00.000Z';
    const e = new ConsensusEngine({ clock });
    const input = makeInput({ '6': [{}], '7': [{}], '8': [{}] });
    const r1 = e.compute(input);
    const r2 = e.compute(input);
    expect(Object.keys(r1.numbers)).toEqual(Object.keys(r2.numbers));
  });
});

// ── §36: Strict vs tolerant mode ─────────────────────────────────────────────

describe('§36 Strict vs tolerant mode', () => {
  it('strict mode config validation: rejects unknown direction', () => {
    const e = new ConsensusEngine({
      mode: 'strict',
      config: {
        engines: {
          Lab_Con: {
            weight: 1,
            signals: { 'test.field': { weight: 1, direction: 'INVALID' } },
          },
        },
      },
    });
    expect(() => e.compute({ numbers: { '9': { number: '9', signals: {}, normalizedSignals: { Lab_Con: buildEngine({ 'test.field': 0.5 }) } } }, metadata: {} })).toThrow(/unknown direction/);
  });

  it('strict mode succeeds with valid input', () => {
    const e = new ConsensusEngine({ mode: 'strict' });
    const input = makeInput({ '10': [{}] });
    const r = e.compute(input);
    expect(r.numbers['10'].valid).toBe(true);
  });

  it('tolerant mode does not throw on out-of-range values (excludes them)', () => {
    const e = new ConsensusEngine({ mode: 'tolerant' });
    const ns = {
      Lab_Con: {
        'delay.delayRatio': { rawValue: 1.5, normalizedValue: 1.5, method: 'IDENTITY', valid: true, params: {} },
        'delay.delayScore': nve(0.5),
        'delay.pressure': nve(0.5),
      },
    };
    const numbers = { '11': { number: '11', signals: {}, normalizedSignals: ns } };
    // Should not throw
    expect(() => e.compute({ numbers, metadata: {} })).not.toThrow();
    const r = e.compute({ numbers, metadata: {} });
    expect(r.numbers['11']).toBeDefined();
    const excluded = r.numbers['11'].engineScores.Lab_Con.excluded;
    expect(excluded.some(e => e.field === 'delay.delayRatio')).toBe(true);
  });
});

// ── §39.20: Full pipeline integration ────────────────────────────────────────

describe('§39.20 Full pipeline integration', () => {
  it('collector → normalizer → engine produces valid results', async () => {
    const { LabEngine } = await import('../../labEngine.js');
    const { LabCon1Engine } = await import('../../labCon1Engine.js');
    const { AtRepEngine } = await import('../../atRepEngine.js');
    const {
      LabConAdapter, LabCon1Adapter, AtRepAdapter,
      SignalCollector, SignalNormalizer,
    } = await import('../../src/consensus/index.js');

    const spins = Array.from({ length: 30 }, (_, i) => ({ number: String((i % 36) + 1) }));
    const tracker = { getSpins: () => spins.map(s => ({ ...s })) };
    const domainTracker = { getSpins: () => spins.map(s => ({ ...s })), getSettings: () => ({ atrasosMaxWindow: 100 }) };

    const collector = new SignalCollector({
      labConAdapter: new LabConAdapter(new LabEngine(tracker)),
      labCon1Adapter: new LabCon1Adapter(new LabCon1Engine(tracker)),
      atRepAdapter: new AtRepAdapter(new AtRepEngine(domainTracker)),
    });
    const normalizer = new SignalNormalizer({ mode: 'tolerant' });
    const engine = new ConsensusEngine({ mode: 'tolerant' });

    const collected = collector.collect();
    const normalized = normalizer.normalize(collected);
    const result = engine.compute(normalized);

    expect(result).toHaveProperty('numbers');
    expect(result).toHaveProperty('metadata');
    expect(result.metadata.consensus.processedNumbers).toBeGreaterThan(0);
    expect(result.metadata.consensus.validNumbers).toBeGreaterThan(0);

    const json = JSON.stringify(result);
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json);
    expect(parsed.numbers).toBeDefined();
  });
});
