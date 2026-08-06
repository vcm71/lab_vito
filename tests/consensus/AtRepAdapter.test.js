import { describe, it, expect, beforeEach } from 'vitest';
import { AtRepEngine, invalidateCache } from '../../atRepEngine.js';
import { AtRepAdapter } from '../../src/consensus/index.js';

function createMockTracker(spins = [], settings = {}) {
  return {
    getSpins: () => spins,
    getSettings: () => ({
      atrasosMaxWindow: settings.atrasosMaxWindow ?? 200,
      ...settings,
    }),
  };
}

function makeSpins(numbers) {
  const baseTime = Date.now() - numbers.length * 1000;
  return numbers.map((number, index) => ({
    id: index + 1,
    number: String(number),
    timestamp: baseTime + index * 1000,
  }));
}

describe('AtRepAdapter', () => {
  beforeEach(() => {
    invalidateCache();
  });

  it('traduce AtRep a ConsensusSignal y preserva 0/00 separados', () => {
    const spins = makeSpins([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36, 0, '00', 1, 2]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    const engine = new AtRepEngine(tracker);
    const adapter = new AtRepAdapter(engine, { activeSets: ['Rojo', 'Bogus'] });

    const signals = adapter.adapt();

    expect(signals).toHaveLength(38);

    const num1 = signals.find(signal => String(signal.number) === '1');
    const num0 = signals.find(signal => String(signal.number) === '0');
    const num00 = signals.find(signal => String(signal.number) === '00');

    expect(num1).toBeDefined();
    expect(num0).toBeDefined();
    expect(num00).toBeDefined();

    expect(num1.sourceEngines).toEqual(['AtRep']);
    expect(num1.rawSignals.delay).toBeNull();
    expect(num1.rawSignals.winWin).toBeNull();
    expect(num1.rawSignals.pci).toMatchObject({
      occurrences: 2,
      meanDist: 20,
      expectedDist: 38,
      pciIndividual: 1.9,
    });
    expect(num1.rawSignals.pci.pciCombined).not.toBeNull();
    expect(num1.rawSignals.pci.pciBySet).toEqual([
      expect.objectContaining({ set: 'Rojo' }),
    ]);
    expect(num1.evidence.activeSets).toEqual(['Rojo']);
    expect(num1.evidence.supportCount).toBe(1);
    expect(num1.metadata.valid).toBe(true);
    expect(num1.metadata.warnings.map(warning => warning.code)).toEqual(expect.arrayContaining([
      'ATREP_DELAY_UNAVAILABLE',
      'ATREP_WINWIN_UNAVAILABLE',
    ]));

    expect(num0.rawSignals.pci).toMatchObject({
      occurrences: 1,
      meanDist: null,
      expectedDist: null,
      pciIndividual: null,
      pciCombined: null,
    });
    expect(num0.evidence.supportCount).toBe(0);
    expect(num0.metadata.warnings.map(warning => warning.code)).toEqual(expect.arrayContaining([
      'ATREP_NO_MATCHING_SETS',
      'ATREP_MISSING_INDIVIDUAL_PCI',
      'ATREP_MISSING_MEAN_DISTANCE',
      'ATREP_MISSING_EXPECTED_DISTANCE',
      'ATREP_MISSING_COMBINED_PCI',
    ]));

    expect(num00.rawSignals.pci).toMatchObject({
      occurrences: 1,
      meanDist: null,
      expectedDist: null,
      pciIndividual: null,
      pciCombined: null,
    });
    expect(num00.evidence.supportCount).toBe(0);
    expect(num00.metadata.warnings.map(warning => warning.code)).toEqual(expect.arrayContaining([
      'ATREP_NO_MATCHING_SETS',
    ]));
  });

  it('expone aliases de conveniencia y filtra conjuntos inválidos', () => {
    const tracker = createMockTracker(makeSpins([1, 3, 5, 7, 9, 12, 14, 16]), { atrasosMaxWindow: 200 });
    const engine = new AtRepEngine(tracker);
    const adapter = new AtRepAdapter(engine, { activeSets: ['Rojo', 'NoExiste'] });

    const viaBuild = adapter.build();
    const viaAlias = adapter.getConsensusSignals();
    const viaOtherAlias = adapter.toConsensusSignals();

    expect(viaBuild).toHaveLength(38);
    expect(viaAlias).toHaveLength(38);
    expect(viaOtherAlias).toHaveLength(38);

    const num1 = viaBuild.find(signal => String(signal.number) === '1');
    expect(num1.evidence.activeSets).toEqual(['Rojo']);
    expect(num1.metadata.warnings.map(warning => warning.code)).toEqual(expect.arrayContaining([
      'ATREP_INVALID_ACTIVE_SET',
    ]));
  });
});
