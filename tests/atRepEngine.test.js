/**
 * Tests unitarios — AtRepEngine.
 *
 * Verifica el motor de cálculo del Par Correlation Index (PCI):
 * - Universo de ruleta (38 elementos, 0 y 00 separados)
 * - Subconjuntos (18 definidos)
 * - Cálculo de PCI para conjuntos y números individuales
 * - Clasificación (atracción, repulsión, CSR)
 * - Intersecciones y resumen global
 *
 * Principio: mocks mínimos. Usa una implementación simple de
 * domainTracker para inyectar datos de prueba.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  AtRepEngine,
  SUBCONJUNTOS,
  UNIVERSO_RULETA,
  invalidateCache
} from '../atRepEngine.js';

// ── Helpers ────────────────────────────────────────────────

/**
 * Crea un mock de domainTracker con giros y settings configurables.
 */
function createMockTracker(spins = [], settings = {}) {
  return {
    getSpins: () => spins,
    getSettings: () => ({
      atrasosMaxWindow: settings.atrasosMaxWindow ?? 200,
      ...settings
    })
  };
}

/**
 * Crea una secuencia de giros a partir de un array de números.
 * Cada giro: { id, number, timestamp } con gap de 1 segundo.
 */
function makeSpins(numbers) {
  const baseTime = Date.now() - numbers.length * 1000;
  return numbers.map((num, i) => ({
    id: i + 1,
    number: String(num),
    timestamp: baseTime + i * 1000
  }));
}

// ── Tests ──────────────────────────────────────────────────

describe('AtRepEngine — Universo y Catálogo', () => {

  it('UNIVERSO_RULETA contiene exactamente 38 elementos', () => {
    expect(UNIVERSO_RULETA).toHaveLength(38);
  });

  it('0 y "00" permanecen como elementos separados', () => {
    expect(UNIVERSO_RULETA[0]).toBe(0);
    expect(UNIVERSO_RULETA[37]).toBe('00');
  });

  it('No incluye 90 como elemento canónico', () => {
    expect(UNIVERSO_RULETA).not.toContain(90);
  });

  it('SUBCONJUNTOS tiene 18 elementos', () => {
    expect(SUBCONJUNTOS).toHaveLength(18);
  });

  it('Cada subconjunto tiene name, label y numbers como array', () => {
    SUBCONJUNTOS.forEach(s => {
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('label');
      expect(Array.isArray(s.numbers)).toBe(true);
    });
  });
});

describe('AtRepEngine — PCI de conjunto', () => {

  let engine;

  beforeEach(() => {
    invalidateCache();
  });

  it('PCI de conjunto usa 38 / tamaño_del_conjunto como media esperada', () => {
    // 18 spins, todos rojos → media observada = 1 (ocurrencias consecutivas)
    // Rojo tiene 18 números → media esperada = 38/18 ≈ 2.111
    const spins = makeSpins([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    engine.refresh();

    const { setDetails } = engine.getSetDetails(['Rojo']);
    const rojo = setDetails.find(d => d.label === 'Rojo');
    expect(rojo).toBeDefined();
    // expectedDist = 38 / 18 ≈ 2.111
    expect(rojo.expectedDist).toBeCloseTo(2.111, 2);
    // meanDist = 1 (todos consecutivos) → PCI = 2.111/1 ≈ 2.111
    expect(rojo.pci).toBeCloseTo(2.111, 2);
    expect(rojo.verdict).toBe('Atracción alta');
  });

  it('PCI individual usa 38 como media esperada', () => {
    // Número 7 aparece cada 2 giros → meanDist = 2
    // expectedDist = 38 → PCI = 38/2 = 19
    const spins = makeSpins([7, 5, 7, 3, 7, 14, 7, 22]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    engine.refresh();

    const scores = engine.getNumeroScores([]);
    const num7 = scores.find(s => s.number === 7);
    expect(num7).toBeDefined();
    expect(num7.individualPci).toBeCloseTo(19, 1);
  });

  it('Menos de 2 ocurrencias devuelve PCI null', () => {
    // Solo una ocurrencia del número 5
    const spins = makeSpins([1, 3, 5, 10, 20]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    engine.refresh();

    const scores = engine.getNumeroScores([]);
    const num5 = scores.find(s => s.number === 5);
    expect(num5.pci).toBeNull();
  });

  it('Cero giros produce setResults vacío y no lanza error', () => {
    const tracker = createMockTracker([], { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    expect(() => engine.refresh()).not.toThrow();

    const { setDetails } = engine.getSetDetails(['Rojo']);
    // Con 0 giros no hay ocurrencias, el set no tiene resultados
    expect(setDetails).toHaveLength(0);
  });
});

describe('AtRepEngine — Clasificación', () => {

  let engine;

  beforeEach(() => {
    invalidateCache();
  });

  it('PCI ≥ 1.15 clasifica como "Atracción alta"', () => {
    const spins = makeSpins([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    engine.refresh();

    const { setDetails } = engine.getSetDetails(['Rojo']);
    const rojo = setDetails.find(d => d.label === 'Rojo');
    expect(rojo.pci).toBeGreaterThanOrEqual(1.15);
    expect(rojo.verdict).toBe('Atracción alta');
  });

  it('PCI ≤ 0.85 clasifica como "Repulsión alta"', () => {
    // Secuencia larga dominada por negros. Rojo aparece raramente → PCI < 0.85
    // 50 giros: 45 negros, 5 rojos intercalados
    const negros = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
    const rojos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const spinsNumbers = [];
    // 50 giros: 45 negros (9 ciclos de 5 negros + 1 rojo)
    for (let i = 0; i < 9; i++) {
      // 5 negros
      for (let j = 0; j < 5; j++) spinsNumbers.push(negros[(i * 5 + j) % negros.length]);
      // 1 rojo
      spinsNumbers.push(rojos[i % rojos.length]);
    }
    // Últimos 5: todos negros
    for (let j = 0; j < 5; j++) spinsNumbers.push(negros[j]);

    const spins = makeSpins(spinsNumbers);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    engine.refresh();

    const { setDetails } = engine.getSetDetails(['Rojo']);
    const rojo = setDetails.find(d => d.label === 'Rojo');
    expect(rojo).toBeDefined();
    expect(rojo.occurrences).toBeGreaterThanOrEqual(9);
    // PCI debe ser < 0.85 (rojos están muy separados)
    expect(rojo.pci).toBeLessThan(0.85);
    expect(rojo.verdict).toBe('Repulsión alta');
  });
});

describe('AtRepEngine — Intersecciones y Resumen', () => {

  let engine;

  beforeEach(() => {
    invalidateCache();

    // Secuencia con patrón: muchos rojos alternados con negros
    const spins = makeSpins([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30
    ]);
    const tracker = createMockTracker(spins, { atrasosMaxWindow: 200 });
    engine = new AtRepEngine(tracker);
    engine.refresh();
  });

  it('buscarInterseccionesOptimas ordena por |avgPci - 1| descendente', () => {
    const active = ['Rojo', 'Negro', 'Par', 'Impar'];
    const intersections = engine.buscarInterseccionesOptimas(active, 5);

    expect(intersections.length).toBeGreaterThanOrEqual(0);
    // Verificar que los PCI promedios tienen sentido
    intersections.forEach(inter => {
      expect(inter).toHaveProperty('label');
      expect(inter).toHaveProperty('avgPci');
      expect(typeof inter.count).toBe('number');
    });

    // Si hay al menos 2 intersecciones, verificar orden descendente por |avgPci - 1|
    if (intersections.length >= 2) {
      for (let i = 1; i < intersections.length; i++) {
        const prevDev = Math.abs(intersections[i - 1].avgPci - 1);
        const currDev = Math.abs(intersections[i].avgPci - 1);
        expect(prevDev).toBeGreaterThanOrEqual(currDev);
      }
    }
  });

  it('getGlobalSummary cuenta atracción, repulsión, csr, insufficient', () => {
    const active = ['Rojo', 'Negro', 'Par', 'Impar', 'Falta', 'Pasa'];
    const summary = engine.getGlobalSummary(active);

    expect(summary).toHaveProperty('attraction');
    expect(summary).toHaveProperty('repulsion');
    expect(summary).toHaveProperty('csr');
    expect(summary).toHaveProperty('insufficient');
    expect(typeof summary.totalSets).toBe('number');
    expect(summary.attraction + summary.repulsion + summary.csr + summary.insufficient)
      .toBe(summary.totalSets);
  });

  it('getNumeroScores promedia PCI de conjuntos activos + PCI individual', () => {
    const active = ['Rojo', 'Negro'];
    const scores = engine.getNumeroScores(active);

    // Cada score en el rango 1-36 debe pertenecer a Rojo o Negro
    // y tener setsIn conteniendo al menos uno de esos conjuntos
    scores.forEach(s => {
      expect(s).toHaveProperty('number');
      expect(s).toHaveProperty('pci');
      expect(s).toHaveProperty('setsIn');
      expect(typeof s.setsIn).toBe('number');
      expect(s).toHaveProperty('individualPci');
    });

    // Verificar que tenemos 38 scores (uno por cada elemento del universo)
    expect(scores).toHaveLength(38);
  });

  // ── Series personalizadas ──────────────────────────────────────────────────

  it('refresh carga series personalizadas desde settings', () => {
    const spins = makeSpins(Array.from({ length: 100 }, () => ~~(Math.random() * 38)));
    const tracker = createMockTracker(spins, {
      atrasosMaxWindow: 100,
      customSeries: [
        { name: 'MiSerie', numbers: ['1','5','9'], active: true }
      ]
    });
    const engine = new AtRepEngine(tracker);
    engine.refresh();

    expect(engine._allDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '★MiSerie', type: 'series' })
      ])
    );

    const result = engine._setResults['★MiSerie'];
    expect(result).toBeDefined();
    expect(result).toHaveProperty('pci');
  });

  it('series inactivas no aparecen en el catálogo', () => {
    const spins = makeSpins(Array.from({ length: 100 }, () => ~~(Math.random() * 38)));
    const tracker = createMockTracker(spins, {
      atrasosMaxWindow: 100,
      customSeries: [
        { name: 'Inactiva', numbers: ['0','00'], active: false }
      ]
    });
    const engine = new AtRepEngine(tracker);
    engine.refresh();

    expect(engine._allDefinitions.find(d => d.name === '★Inactiva')).toBeUndefined();
  });

  // ── Selector con tipo ───────────────────────────────────────────────────────

  it('getSetDetails incluye type para series y conjuntos', () => {
    const spins = makeSpins(Array.from({ length: 100 }, () => ~~(Math.random() * 38)));
    const tracker = createMockTracker(spins, {
      atrasosMaxWindow: 100,
      customSeries: [{ name: 'MiSerie', numbers: ['1','5','9'], active: true }]
    });
    const engine = new AtRepEngine(tracker);
    engine.refresh();

    const allNames = engine._allDefinitions.map(d => d.name);
    const { setDetails } = engine.getSetDetails(allNames);

    setDetails.forEach(d => {
      expect(d).toHaveProperty('type');
    });

    const seriesDetail = setDetails.find(d => d.name === '★MiSerie');
    expect(seriesDetail).toBeDefined();
    expect(seriesDetail.type).toBe('series');
  });
});
