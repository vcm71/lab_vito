import { describe, expect, it } from 'vitest';
import { CONSENSUS_SCHEMA_VERSION, createConsensusSignal } from '../../src/consensus/index.js';

describe('createConsensusSignal', () => {
  it('creates the base structure for 00 with independent containers', () => {
    const signalA = createConsensusSignal('00');
    const signalB = createConsensusSignal('00');

    expect(signalA.schemaVersion).toBe(CONSENSUS_SCHEMA_VERSION);
    expect(signalA.number).toBe('00');
    expect(signalA.sourceEngines).toEqual([]);
    expect(signalA.rawSignals).toEqual({ delay: null, winWin: null, pci: null });
    expect(signalA.evidence).toMatchObject({
      occurrences: 0,
      sampleSize: 0,
      activeSets: [],
      windowSize: 0,
      historyLength: 0,
      supportCount: 0,
      signalQuality: 'INSUFFICIENT',
    });
    expect(signalA.metadata.valid).toBe(false);
    expect(signalA.metadata.warnings).toEqual([]);
    expect(signalA.metadata.missingSignals).toEqual(['delay', 'winWin', 'pci']);
    expect(signalA.metadata.provenance).toEqual([]);
    expect(Number.isNaN(Date.parse(signalA.metadata.generatedAt))).toBe(false);

    signalA.sourceEngines.push('Lab_Con');
    signalA.rawSignals.delay = {
      actualDelay: 3,
      maxDelay: 9,
      delayRatio: 0.33,
      delayScore: 0.44,
      probabilityDelay: 0.12,
      pressure: 0.76,
      activeSets: ['Rojo'],
    };
    signalA.metadata.warnings.push({
      code: 'TEST_WARNING',
      message: 'ok',
      severity: 'INFO',
      source: 'Consensus',
    });

    expect(signalB.sourceEngines).toEqual([]);
    expect(signalB.rawSignals.delay).toBeNull();
    expect(signalB.metadata.warnings).toEqual([]);
  });

  it('applies valid overrides and recalculates missingSignals', () => {
    const signal = createConsensusSignal(7, {
      sourceEngines: ['Lab_Con', 'AtRep'],
      rawSignals: {
        delay: {
          actualDelay: 4,
          maxDelay: 10,
          delayRatio: 0.4,
          delayScore: 0.6,
          probabilityDelay: 0.2,
          pressure: 0.7,
          activeSets: ['Rojo'],
        },
        pci: {
          occurrences: 2,
          meanDist: null,
          expectedDist: null,
          pciIndividual: null,
          pciCombined: null,
          pciBySet: [],
        },
      },
      evidence: {
        occurrences: 2,
        sampleSize: 12,
        activeSets: ['Rojo'],
        windowSize: 20,
        historyLength: 12,
        supportCount: 1,
        signalQuality: 'LOW',
      },
      metadata: {
        provenance: [
          {
            engine: 'Lab_Con',
            file: 'labEngine.js',
            method: 'resolverScoresIndividuales',
            version: null,
          },
        ],
      },
    });

    expect(signal.number).toBe('7');
    expect(signal.sourceEngines).toEqual(['Lab_Con', 'AtRep']);
    expect(signal.rawSignals.delay).toMatchObject({ actualDelay: 4, maxDelay: 10 });
    expect(signal.rawSignals.pci).toMatchObject({ occurrences: 2, pciBySet: [] });
    expect(signal.evidence.signalQuality).toBe('LOW');
    expect(signal.metadata.missingSignals).toEqual(['winWin']);
    expect(signal.metadata.valid).toBe(false);
    expect(signal.metadata.provenance).toHaveLength(1);
  });

  it('supports the freeze option', () => {
    const signal = createConsensusSignal('1', { freeze: true });
    expect(Object.isFrozen(signal)).toBe(true);
    expect(Object.isFrozen(signal.rawSignals)).toBe(true);
    expect(Object.isFrozen(signal.metadata)).toBe(true);
  });

  it('rejects unknown overrides', () => {
    expect(() => createConsensusSignal('1', { totallyUnknown: true })).toThrow();
    expect(() => createConsensusSignal('1', { rawSignals: { bogus: true } })).toThrow();
  });
});
