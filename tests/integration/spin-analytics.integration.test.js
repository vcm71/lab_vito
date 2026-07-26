/**
 * Tests de integración: SpinManager + RouletteAnalytics.
 * Verifica que los giros agregados al SpinManager produzcan
 * estadísticas correctas en RouletteAnalytics.
 *
 * Principio: clases reales, sin mocks.
 * Números rojos en esta ruleta americana: 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { RouletteAnalytics } from '../../src/analytics/RouletteAnalytics.js';
import { createDefaultRouletteSettings } from '../../rouletteSettingsStore.js';

describe('Integration: Spin + Analytics', () => {
  let spins;
  let settings;

  beforeEach(() => {
    spins = [];
    settings = createDefaultRouletteSettings();
  });

  function addSpin(num) {
    spins.push({ id: spins.length + 1, number: String(num) });
  }

  function makeAnalytics() {
    return new RouletteAnalytics(spins, settings);
  }

  it('should compute stats after adding spins', () => {
    // 17=black, 5=red, 32=RED, 14=red, 9=red → red=4/5(80%), black=1/5(20%)
    addSpin('17');
    addSpin('5');
    addSpin('32');
    addSpin('14');
    addSpin('9');

    const analytics = makeAnalytics();
    const stats = analytics.getStats();

    expect(stats.total).toBe(5);
    expect(stats.colorsPct).toBeDefined();
    expect(stats.colorsPct.red).toBeCloseTo(80, 1);
    expect(stats.colorsPct.black).toBeCloseTo(20, 1);
    expect(stats.colorsPct.green).toBe(0);

    // Dozens: 5(d1),9(d1)→d1=2; 14(d2),17(d2)→d2=2; 32(d3)→d3=1
    expect(stats.dozensPct.d1).toBeCloseTo(40, 1);
    expect(stats.dozensPct.d2).toBeCloseTo(40, 1);
    expect(stats.dozensPct.d3).toBeCloseTo(20, 1);

    // Columns: 17(c2),5(c2),32(c2),14(c2),9(c3) → c2=4, c3=1
    expect(stats.columnsPct.c2).toBeCloseTo(80, 1);
  });

  it('should reflect spin mutations in analytics after refresh', () => {
    addSpin('17');
    addSpin('5');

    let analytics = makeAnalytics();
    expect(analytics.getStats().total).toBe(2);

    addSpin('32');
    analytics.refresh(spins, settings);
    expect(analytics.getStats().total).toBe(3);
  });

  it('should run runsTest on real data', () => {
    // Need at least 20 non-zero spins for runsTest
    // Alternating colors: 17(black), 5(red), 17(black), 14(red), ...
    const pattern = ['17', '5', '17', '14', '17', '9', '17', '14', '17', '5', '17', '14', '17', '9', '17', '14', '17', '5', '17', '14'];
    pattern.forEach(n => addSpin(n));

    const analytics = makeAnalytics();
    const runs = analytics.runsTest('color');

    expect(runs).toBeDefined();
    expect(runs.z).toBeDefined();
    expect(typeof runs.z).toBe('number');
    expect(runs.runs).toBeGreaterThan(0);
    expect(runs.interpretation).toBeDefined();
  });

  it('should compute advanced stats (chiSquare, hotZone, meanDelays)', () => {
    // 38 spins for valid chi diagnosis
    for (let i = 0; i < 38; i++) {
      const balanced = ['17', '5', '32', '14', '9', '22', '28', '3', '15', '20',
        '10', '30', '7', '25', '12', '35', '18', '2', '34', '8',
        '21', '1', '27', '11', '19', '31', '4', '24', '6', '36',
        '13', '16', '29', '23', '33', '26', '0', '00'];
      addSpin(balanced[i % balanced.length]);
    }

    const analytics = makeAnalytics();
    const advanced = analytics.getAdvancedStats();

    expect(advanced).toBeDefined();
    expect(advanced.chiSquare).toBeDefined();
    expect(typeof advanced.chiSquare).toBe('string'); // .toFixed(2)
    expect(advanced.chiDiagnosis).toBeDefined();
    expect(advanced.hotZone).toBeDefined();
    expect(advanced.hotZone.center).toBeDefined();
    expect(advanced.hotZone.members).toBeInstanceOf(Array);
    expect(advanced.meanDelays).toBeDefined();
    expect(advanced.meanDelays.red).toBeDefined();
  });

  it('should compute window stats correctly', () => {
    // 50 spins
    for (let i = 0; i < 50; i++) {
      addSpin(String(Math.floor(Math.random() * 38)));
    }

    const analytics = makeAnalytics();
    const wStats = analytics.getWindowStats(20);

    expect(wStats).toBeDefined();
    expect(wStats.windowSize).toBe(20);
    expect(wStats.actual).toBe(20); // 20 most recent of 50
    expect(wStats.chiSquare).toBeDefined();
    expect(wStats.hotZone).toBeDefined();
    expect(wStats.chiDiagnosis).toBeDefined();
    expect(wStats.top5).toBeInstanceOf(Array);
    expect(wStats.top5.length).toBe(5);
  });
});
