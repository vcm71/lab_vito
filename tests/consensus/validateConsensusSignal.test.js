import { describe, expect, it } from 'vitest';
import { createConsensusSignal, validateConsensusSignal } from '../../src/consensus/index.js';

function makeValidPciSignal() {
  return {
    occurrences: 2,
    meanDist: null,
    expectedDist: null,
    pciIndividual: null,
    pciCombined: null,
    pciBySet: [],
  };
}

describe('validateConsensusSignal', () => {
  it('accepts the base contract and emits evidence warnings', () => {
    const signal = createConsensusSignal('00');
    const result = validateConsensusSignal(signal);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'DELAY_ABSENT' }),
        expect.objectContaining({ code: 'WINWIN_ABSENT' }),
        expect.objectContaining({ code: 'PCI_ABSENT' }),
        expect.objectContaining({ code: 'SUPPORT_COUNT_ZERO' }),
        expect.objectContaining({ code: 'HISTORY_LENGTH_ZERO' }),
      ]),
    );
  });

  it('accepts partial evidence blocks with null PCI fields', () => {
    const signal = createConsensusSignal('12', {
      rawSignals: {
        pci: makeValidPciSignal(),
      },
      evidence: {
        occurrences: 2,
        sampleSize: 9,
        activeSets: ['Rojo'],
        windowSize: 18,
        historyLength: 9,
        supportCount: 1,
        signalQuality: 'MEDIUM',
      },
    });

    const result = validateConsensusSignal(signal);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'PCI_INSUFFICIENT_SAMPLE' }),
      ]),
    );
  });

  it.each([
    ['schemaVersion incorrecto', signal => { signal.schemaVersion = '2.0.0'; }],
    ['número inválido', signal => { signal.number = '37'; }],
    ['motor desconocido', signal => { signal.sourceEngines = ['Lab_Con', 'Bogus']; }],
    ['valor negativo', signal => { signal.evidence.supportCount = -1; }],
    ['NaN', signal => { signal.evidence.supportCount = Number.NaN; }],
    ['Infinity', signal => { signal.evidence.windowSize = Number.POSITIVE_INFINITY; }],
    ['propiedad desconocida', signal => { signal.extra = true; }],
  ])('rejects %s', (_, mutate) => {
    const signal = createConsensusSignal('00');
    mutate(signal);
    const result = validateConsensusSignal(signal);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates provenance and structured warnings', () => {
    const signal = createConsensusSignal('5', {
      rawSignals: {
        pci: makeValidPciSignal(),
      },
      metadata: {
        warnings: [
          {
            code: 'CUSTOM',
            message: 'Custom warning',
            severity: 'WARNING',
            source: 'Consensus',
          },
        ],
        provenance: [
          {
            engine: 'AtRep',
            file: 'atRepEngine.js',
            method: 'getNumeroScores',
            version: null,
          },
        ],
      },
    });

    const result = validateConsensusSignal(signal);
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CUSTOM' }),
      ]),
    );
  });
});
