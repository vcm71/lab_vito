/**
 * atRepEngine.js — Atracción / Repulsión (AtRep)
 *
 * Basado en core/AtRep.md (Atracción y Repulsión en Procesos Puntuales Espaciales).
 *
 * La métrica central es el Par Correlation Index (PCI):
 *   PCI(set) = media_esperada / media_observada
 *
 * donde:
 *   - media_observada = distancia promedio entre ocurrencias consecutivas
 *     de cualquier miembro del conjunto en la ventana activa.
 *   - media_esperada = 38 / |set|  (bajo hipótesis de independencia, CSR)
 *
 * Interpretación:
 *   PCI > 1  → atracción (las ocurrencias aparecen más juntas de lo esperado)
 *   PCI < 1  → repulsión (las ocurrencias aparecen más separadas de lo esperado)
 *   PCI ≈ 1  → compatible con CSR / independencia
 *
 * ADVERTENCIA: En eventos independientes como la ruleta, el PCI describe
 * patrones PASADOS. NO es predictivo. Ver core/AtRep.md.
 */

// ─── CATÁLOGO DE SUBCONJUNTOS (idéntico a labCon1Engine.js) ────────────────
export const SUBCONJUNTOS = [
  { name: 'Rojo',     label: 'Rojo',     numbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36] },
  { name: 'Negro',    label: 'Negro',    numbers: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35] },
  { name: 'Par',      label: 'Par',      numbers: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36] },
  { name: 'Impar',    label: 'Impar',    numbers: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35] },
  { name: 'Falta',    label: 'Falta',    numbers: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { name: 'Pasa',     label: 'Pasa',     numbers: [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36] },
  { name: 'Docena1',  label: '1ª Docena',numbers: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { name: 'Docena2',  label: '2ª Docena',numbers: [13,14,15,16,17,18,19,20,21,22,23,24] },
  { name: 'Docena3',  label: '3ª Docena',numbers: [25,26,27,28,29,30,31,32,33,34,35,36] },
  { name: 'Columna1', label: 'Columna 1',numbers: [1,4,7,10,13,16,19,22,25,28,31,34] },
  { name: 'Columna2', label: 'Columna 2',numbers: [2,5,8,11,14,17,20,23,26,29,32,35] },
  { name: 'Columna3', label: 'Columna 3',numbers: [3,6,9,12,15,18,21,24,27,30,33,36] },
  { name: 'Sixena1',  label: 'S1 (1-6)',  numbers: [1,2,3,4,5,6] },
  { name: 'Sixena2',  label: 'S2 (7-12)', numbers: [7,8,9,10,11,12] },
  { name: 'Sixena3',  label: 'S3 (13-18)',numbers: [13,14,15,16,17,18] },
  { name: 'Sixena4',  label: 'S4 (19-24)',numbers: [19,20,21,22,23,24] },
  { name: 'Sixena5',  label: 'S5 (25-30)',numbers: [25,26,27,28,29,30] },
  { name: 'Sixena6',  label: 'S6 (31-36)',numbers: [31,32,33,34,35,36] },
];

export const UNIVERSO_RULETA = Array.from({ length: 38 }, (_, i) => {
  if (i === 0) return 0;
  if (i === 37) return '00';
  return i;
});

// ─── CUSTOM SERIES ─────────────────────────────────────────────────────────
export function loadCustomSeries(domainTracker) {
  const raw = (domainTracker.getSettings && domainTracker.getSettings().customSeries) || [];
  return raw
    .filter(s => s.active !== false)
    .map(s => ({
      name: `★${s.name}`,
      label: s.name,
      type: 'series',
      numbers: s.numbers.map(n => {
        const v = parseInt(n, 10);
        return n === '00' ? '00' : (isNaN(v) ? n : v);
      })
    }));
}

/**
 * Normaliza `numbers` de un set/definición a array de strings para comparación.
 */
function toStrSet(numbers) {
  return new Set(numbers.map(n => String(n)));
}

// Cache para resultados de conjuntos (se invalida al cambiar ventana)
let _cache = {};

export function invalidateCache() {
  _cache = {};
}

/**
 * @param {import('./src/tracker/RouletteTracker.js').RouletteTracker} domainTracker
 */
export class AtRepEngine {
  constructor(domainTracker) {
    this.domainTracker = domainTracker;
    this._spins = [];
    this._windowSize = 100;
    this._setResults = {};  // { setName: { occurrences, meanDist, expectedDist, pci, count } }
    this._numberResults = {}; // { numberStr: { occurrences, meanDist, expectedDist, pci } }
    this._globalTotal = 0;
    this._totalSampleSize = 0;
    this._insufficientCount = new Set(); // sets with < 2 occurrences
    this._allDefinitions = []; // SUBCONJUNTOS + series + sectores (tras refresh)
  }

  /**
   * Refresca los cálculos desde los giros actuales.
   */
  refresh() {
    const settings = this.domainTracker.getSettings();
    this._windowSize = settings.atrasosMaxWindow ?? 100;

    const allSpins = this.domainTracker.getSpins() || [];
    this._totalSampleSize = allSpins.length;
    this._spins = allSpins.slice(-this._windowSize);
    this._globalTotal = this._spins.length;

    // Reset
    this._setResults = {};
    this._numberResults = {};
    this._insufficientCount = new Set();

    // Construir catálogo unificado: conjuntos + series
    const series = loadCustomSeries(this.domainTracker);
    this._allDefinitions = [...SUBCONJUNTOS, ...series];

    if (this._globalTotal < 2) return;

    // Calcular PCI para cada definición del catálogo unificado
    this._allDefinitions.forEach(def => {
      this._calcSetPCI(def);
    });

    // Calcular para cada número individual
    UNIVERSO_RULETA.forEach(num => {
      this._calcNumberPCI(num);
    });
  }

  /**
   * Calcula PCI para un conjunto de números.
   * Ahora normaliza a string para compatibilidad con números como '00'.
   */
  _calcSetPCI(set) {
    const strSet = toStrSet(set.numbers);
    const positions = [];
    this._spins.forEach((spin, idx) => {
      if (strSet.has(String(spin.number))) {
        positions.push(idx);
      }
    });

    const count = positions.length;
    if (count < 2) {
      this._setResults[set.name] = {
        occurrences: count,
        meanDist: null,
        expectedDist: null,
        pci: null,
        count,
        verdict: count === 0 ? 'Sin datos' : 'Insuficiente'
      };
      this._insufficientCount.add(set.name);
      return;
    }

    // Calcular distancias inter-ocurrencia
    const distances = [];
    for (let i = 1; i < positions.length; i++) {
      distances.push(positions[i] - positions[i - 1]);
    }

    const meanDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const expectedDist = 38 / set.numbers.length;

    this._setResults[set.name] = {
      occurrences: count,
      meanDist: Math.round(meanDist * 100) / 100,
      expectedDist: Math.round(expectedDist * 100) / 100,
      pci: Math.round((expectedDist / meanDist) * 1000) / 1000,
      count,
      verdict: this._classify(expectedDist / meanDist)
    };
  }

  /**
   * Calcula PCI para un número individual.
   */
  _calcNumberPCI(num) {
    const key = String(num);
    const positions = [];
    this._spins.forEach((spin, idx) => {
      if (String(spin.number) === key) {
        positions.push(idx);
      }
    });

    const count = positions.length;
    if (count < 2) {
      this._numberResults[key] = {
        occurrences: count,
        meanDist: null,
        expectedDist: null,
        pci: null,
        verdict: count === 0 ? 'Sin datos' : 'Insuficiente'
      };
      return;
    }

    const distances = [];
    for (let i = 1; i < positions.length; i++) {
      distances.push(positions[i] - positions[i - 1]);
    }

    const meanDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const expectedDist = 38; // 38 números en ruleta americana

    this._numberResults[key] = {
      occurrences: count,
      meanDist: Math.round(meanDist * 100) / 100,
      expectedDist: Math.round(expectedDist * 100) / 100,
      pci: Math.round((expectedDist / meanDist) * 1000) / 1000,
      verdict: this._classify(expectedDist / meanDist)
    };
  }

  /**
   * Clasifica un ratio de atracción/repulsión.
   */
  _classify(ratio) {
    if (ratio >= 1.15) return 'Atracción alta';
    if (ratio >= 1.05) return 'Atracción leve';
    if (ratio <= 0.85) return 'Repulsión alta';
    if (ratio <= 0.95) return 'Repulsión leve';
    return 'CSR (independencia)';
  }

  /**
   * Busca una definición en el catálogo unificado por nombre.
   */
  _findDef(name) {
    return this._allDefinitions.find(d => d.name === name);
  }

  /**
   * Devuelve detalles de conjuntos activos, con scores por número miembro.
   * Soporta SUBCONJUNTOS, series, y sectores.
   */
  getSetDetails(activeSetNames) {
    if (!activeSetNames || activeSetNames.length === 0) {
      return { setDetails: [], globalTotal: this._globalTotal };
    }

    const setDetails = activeSetNames.map(name => {
      const def = this._findDef(name);
      const result = this._setResults[name];
      if (!result) return null;

      return {
        name,
        label: def ? def.label : name,
        type: def ? (def.type || 'conjunto') : 'conjunto',
        ...result,
        numberScores: def ? def.numbers.map(n => ({
          number: n,
          ...(this._numberResults[String(n)] || { occurrences: 0, pci: null, verdict: 'Sin datos' })
        })) : []
      };
    }).filter(Boolean);

    return { setDetails, globalTotal: this._globalTotal };
  }

  /**
   * Devuelve scores agregados por número basados en los conjuntos activos.
   * Soporta SUBCONJUNTOS, series, y sectores.
   */
  getNumeroScores(activeSetNames) {
    if (!activeSetNames || activeSetNames.length === 0) {
      return UNIVERSO_RULETA.map(n => ({
        number: n,
        pci: (this._numberResults[String(n)] || {}).pci ?? null,
        verdict: (this._numberResults[String(n)] || {}).verdict ?? 'Sin datos',
        setsIn: 0,
        individualPci: (this._numberResults[String(n)] || {}).pci ?? null
      }));
    }

    const activeDefs = this._allDefinitions.filter(d => activeSetNames.includes(d.name));
    const strSet = new Set(activeDefs.flatMap(d => d.numbers.map(n => String(n))));

    return UNIVERSO_RULETA.map(n => {
      const key = String(n);

      if (!activeSetNames || activeSetNames.length === 0) {
        const nr = this._numberResults[key];
        return {
          number: n,
          pci: nr ? nr.pci : null,
          verdict: nr ? nr.verdict : 'Sin datos',
          setsIn: 0,
          individualPci: nr ? nr.pci : null,
          groupPci: nr ? nr.pci : null
        };
      }

      const activeDefs = this._allDefinitions.filter(d => activeSetNames.includes(d.name));
      const strSet = new Set(activeDefs.flatMap(d => d.numbers.map(n => String(n))));

      const containingSets = activeDefs.filter(d => strSet.has(key));
      const setsIn = containingSets.length;
      const nr = this._numberResults[key];

      if (setsIn === 0) {
        return {
          number: n,
          pci: nr ? nr.pci : null,
          verdict: nr ? nr.verdict : 'Sin datos',
          setsIn: 0,
          individualPci: nr ? nr.pci : null,
          groupPci: nr ? nr.pci : null
        };
      }

      // PCI de conjuntos que contienen este número
      const groupPciValues = [];
      containingSets.forEach(s => {
        const sr = this._setResults[s.name];
        if (sr && sr.pci !== null) groupPciValues.push(sr.pci);
      });

      // Promediar PCI de los conjuntos que contienen este número + individual
      const pcValues = [...groupPciValues];
      if (nr && nr.pci !== null) pcValues.push(nr.pci);

      if (pcValues.length === 0) {
        return {
          number: n,
          pci: null,
          verdict: 'Insuficiente',
          setsIn,
          individualPci: nr ? nr.pci : null,
          groupPci: null
        };
      }

      const avgPci = pcValues.reduce((a, b) => a + b, 0) / pcValues.length;
      const combinedPci = Math.round(avgPci * 1000) / 1000;

      return {
        number: n,
        pci: combinedPci,
        verdict: this._classify(avgPci),
        setsIn,
        individualPci: nr ? nr.pci : null,
        groupPci: combinedPci
      };
    });
  }

  /**
   * Busca intersecciones óptimas: subconjuntos de números que maximizan
   * el promedio de atracción combinada.
   */
  buscarInterseccionesOptimas(activeSetNames, topK = 5) {
    if (!activeSetNames || activeSetNames.length === 0) return [];

    const numberScores = this.getNumeroScores(activeSetNames);
    const candidates = [];

    // Generar intersecciones: pares de definiciones activas
    const activeDefs = this._allDefinitions.filter(d => activeSetNames.includes(d.name));

    for (let i = 0; i < activeDefs.length; i++) {
      for (let j = i + 1; j < activeDefs.length; j++) {
        const aSet = toStrSet(activeDefs[i].numbers);
        const bSet = toStrSet(activeDefs[j].numbers);
        const intersection = [...aSet].filter(n => bSet.has(n));
        if (intersection.length === 0) continue;

        const avgPci = intersection.reduce((sum, nStr) => {
          const score = numberScores.find(s => String(s.number) === nStr);
          return sum + (score && score.pci !== null ? score.pci : 1);
        }, 0) / intersection.length;

        candidates.push({
          label: `${activeDefs[i].label} ∩ ${activeDefs[j].label}`,
          numbers: intersection.map(n => isNaN(n) ? n : Number(n)),
          count: intersection.length,
          avgPci: Math.round(avgPci * 1000) / 1000,
          verdict: this._classify(avgPci)
        });
      }
    }

    // Ordenar por |PCI - 1| (mayor desviación = más interesante)
    candidates.sort((a, b) => Math.abs(b.avgPci - 1) - Math.abs(a.avgPci - 1));
    return candidates.slice(0, topK);
  }

  /**
   * Devuelve resumen global: cuántos sets en atracción, repulsión, CSR.
   */
  getGlobalSummary(activeSetNames) {
    if (!activeSetNames || activeSetNames.length === 0) {
      return { totalSets: 0, attraction: 0, repulsion: 0, csr: 0, insufficient: 0 };
    }

    let attraction = 0, repulsion = 0, csr = 0, insufficient = 0;

    activeSetNames.forEach(name => {
      const r = this._setResults[name];
      if (!r || r.pci === null) {
        insufficient++;
        return;
      }
      if (r.pci > 1.05) attraction++;
      else if (r.pci < 0.95) repulsion++;
      else csr++;
    });

    return {
      totalSets: activeSetNames.length,
      attraction,
      repulsion,
      csr,
      insufficient
    };
  }
}
