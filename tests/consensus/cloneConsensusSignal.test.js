import { describe, expect, it } from 'vitest';
import { cloneConsensusSignal, createConsensusSignal } from '../../src/consensus/index.js';

describe('cloneConsensusSignal', () => {
  it('creates a deep copy without shared arrays or objects', () => {
    const original = createConsensusSignal('00', {
      sourceEngines: ['Lab_Con'],
      rawSignals: {
        delay: {
          actualDelay: 4,
          maxDelay: 10,
          delayRatio: 0.4,
          delayScore: 0.5,
          probabilityDelay: 0.1,
          pressure: 0.6,
          activeSets: ['Rojo'],
        },
      },
      metadata: {
        warnings: [
          {
            code: 'CUSTOM_WARNING',
            message: 'Custom warning',
            severity: 'WARNING',
            source: 'Consensus',
          },
        ],
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

    const clone = cloneConsensusSignal(original);

    expect(clone).not.toBe(original);
    expect(clone).toEqual(original);
    expect(clone.rawSignals).not.toBe(original.rawSignals);
    expect(clone.rawSignals.delay).not.toBe(original.rawSignals.delay);
    expect(clone.rawSignals.delay.activeSets).not.toBe(original.rawSignals.delay.activeSets);
    expect(clone.metadata).not.toBe(original.metadata);
    expect(clone.metadata.warnings).not.toBe(original.metadata.warnings);
    expect(clone.metadata.provenance).not.toBe(original.metadata.provenance);

    clone.rawSignals.delay.activeSets.push('Negro');
    clone.metadata.warnings[0].code = 'MUTATED';

    expect(original.rawSignals.delay.activeSets).toEqual(['Rojo']);
    expect(original.metadata.warnings[0].code).toBe('CUSTOM_WARNING');
  });

  it('preserves 00, nulls, warnings and provenance when cloning', () => {
    const original = createConsensusSignal('00');
    original.metadata.warnings.push({
      code: 'EMPTY_HISTORY',
      message: 'historyLength = 0.',
      severity: 'WARNING',
      source: 'Consensus',
    });
    original.metadata.provenance.push({
      engine: 'AtRep',
      file: 'atRepEngine.js',
      method: 'getNumeroScores',
      version: null,
    });

    const clone = cloneConsensusSignal(original);
    expect(clone.number).toBe('00');
    expect(clone.rawSignals.delay).toBeNull();
    expect(clone.metadata.warnings).toHaveLength(1);
    expect(clone.metadata.provenance).toHaveLength(1);
    expect(clone.metadata.warnings[0]).toMatchObject({ code: 'EMPTY_HISTORY' });
    expect(clone.metadata.provenance[0]).toMatchObject({ engine: 'AtRep' });
  });
});
