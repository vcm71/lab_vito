import { describe, expect, it } from 'vitest';
import { LabCon1Engine } from '../../labCon1Engine.js';
import { LabCon1Adapter } from '../../src/consensus/adapters/index.js';
import { validateConsensusSignal } from '../../src/consensus/index.js';

function createTracker(spins) {
  return {
    getSpins: () => spins.map(spin => ({ ...spin })),
  };
}

describe('LabCon1Adapter', () => {
  it('builds one consensus signal per American roulette number and keeps 0/00', () => {
    const tracker = createTracker([
      { number: '0' },
      { number: '5' },
      { number: '00' },
      { number: '12' },
      { number: '26' },
      { number: '7' },
      { number: '0' },
    ]);
    const engine = new LabCon1Engine(tracker);
    const adapter = new LabCon1Adapter(engine, {
      activeSets: ['Series S0', 'Rojo', '1a Docena', 'Columna 1'],
    });

    const signals = adapter.adapt();

    expect(signals).toHaveLength(38);
    expect(new Set(signals.map(signal => signal.number))).toHaveLength(38);

    const zero = signals.find(signal => signal.number === '0');
    const doubleZero = signals.find(signal => signal.number === '00');
    const scoreMap = engine.resolverScoresIndividuales(['Series S0', 'Rojo', '1a Docena', 'Columna 1']);

    expect(zero).toBeDefined();
    expect(doubleZero).toBeDefined();
    expect(zero.rawSignals.delay).toBeNull();
    expect(zero.rawSignals.pci).toBeNull();
    expect(zero.rawSignals.winWin).toMatchObject({
      threshold: 0,
      streakLength: expect.any(Number),
      winWinScore: scoreMap['0'],
    });
    expect(doubleZero.rawSignals.winWin).toMatchObject({
      threshold: 0,
      winWinScore: scoreMap['00'],
    });
    expect(zero.metadata.provenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ engine: 'Lab_Con1', file: 'labCon1Engine.js', method: 'getSetDetails' }),
        expect.objectContaining({ engine: 'Lab_Con1', file: 'labCon1Engine.js', method: 'resolverScoresIndividuales' }),
      ]),
    );
    expect(signals.every(signal => validateConsensusSignal(signal).valid)).toBe(true);
  });

  it('flags invalid active sets and keeps returned signals isolated', () => {
    const tracker = createTracker([
      { number: '1' },
      { number: '2' },
      { number: '3' },
      { number: '0' },
    ]);
    const engine = new LabCon1Engine(tracker);
    const adapter = new LabCon1Adapter(engine);
    const activeSets = ['Series S0', 'Bogus', 'Rojo'];
    const originalActiveSets = [...activeSets];

    const signals = adapter.adapt(activeSets);
    const first = signals[0];
    const second = signals[1];

    expect(activeSets).toEqual(originalActiveSets);
    expect(first.metadata.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'LABCON1_INVALID_ACTIVE_SET' }),
        expect.objectContaining({ code: 'LABCON1_THRESHOLD_UNAVAILABLE' }),
        expect.objectContaining({ code: 'DELAY_ABSENT' }),
        expect.objectContaining({ code: 'PCI_ABSENT' }),
      ]),
    );

    first.sourceEngines.push('MUTATED');
    first.metadata.warnings.push({ code: 'LOCAL_ONLY', message: 'x', severity: 'INFO', source: 'Test' });

    expect(second.sourceEngines).not.toContain('MUTATED');
    expect(second.metadata.warnings).not.toEqual(expect.arrayContaining([expect.objectContaining({ code: 'LOCAL_ONLY' })]));
  });
});
