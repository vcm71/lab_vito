/**
 * LabCon1 — Motor analítico basado en datos Win-Win (ES6 Module)
 * Reemplaza el cálculo de atrasos por métricas Win-Win para ponderar conjuntos.
 */
import { rouletteSettingsStore } from './rouletteSettingsStore.js';

export const UNIVERSO_RULETA = new Set([
    "0", "00", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36"
]);

export const SUBCONJUNTOS = {
    "Rojo": new Set(["1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"]),
    "Negro": new Set(["2", "4", "6", "8", "10", "11", "13", "15", "17", "20", "22", "24", "26", "28", "29", "31", "33", "35"]),
    "Par": new Set(["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36"]),
    "Impar": new Set(["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "29", "31", "33", "35"]),
    "1a Docena": new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]),
    "2a Docena": new Set(["13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]),
    "3a Docena": new Set(["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]),
    "Columna 1": new Set(["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"]),
    "Columna 2": new Set(["2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"]),
    "Columna 3": new Set(["3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"]),
    "S1 (1-6)": new Set(["1", "2", "3", "4", "5", "6"]),
    "S2 (7-12)": new Set(["7", "8", "9", "10", "11", "12"]),
    "S3 (13-18)": new Set(["13", "14", "15", "16", "17", "18"]),
    "S4 (19-24)": new Set(["19", "20", "21", "22", "23", "24"]),
    "S5 (25-30)": new Set(["25", "26", "27", "28", "29", "30"]),
    "S6 (31-36)": new Set(["31", "32", "33", "34", "35", "36"]),
    "Series S1": new Set(["1", "27", "2", "26", "7"]),
    "Series S11": new Set(["12", "19", "11", "17", "34"]),
    "Series S14": new Set(["15", "24", "16", "14", "28"]),
    "Series S5": new Set(["32", "5", "31", "33", "23"]),
    "Series S0": new Set(["00", "10", "0", "30", "20"]),
    "Series S3": new Set(["3", "4", "6", "8", "9", "13", "18"]),
    "Series S21": new Set(["21", "22", "25", "29", "35", "36"])
};

// Map each set name to its Win-Win group key for per-group thresholds
const SET_TO_WW_GROUP = {
  "Rojo": "winwinEvenMoney",
  "Negro": "winwinEvenMoney",
  "Par": "winwinEvenMoney",
  "Impar": "winwinEvenMoney",
  "1a Docena": "winwinDozensColumns",
  "2a Docena": "winwinDozensColumns",
  "3a Docena": "winwinDozensColumns",
  "Columna 1": "winwinDozensColumns",
  "Columna 2": "winwinDozensColumns",
  "Columna 3": "winwinDozensColumns",
  "S1 (1-6)": "winwinSectors",
  "S2 (7-12)": "winwinSectors",
  "S3 (13-18)": "winwinSectors",
  "S4 (19-24)": "winwinSectors",
  "S5 (25-30)": "winwinSectors",
  "S6 (31-36)": "winwinSectors",
  "Series S1": "winwinSectors",
  "Series S11": "winwinSectors",
  "Series S14": "winwinSectors",
  "Series S5": "winwinSectors",
  "Series S0": "winwinSectors",
  "Series S3": "winwinSectors",
  "Series S21": "winwinSectors"
};

// ─── Utilidades Win-Win ──────────────────────────────────────────────────────────

function calcularDistancias(history, nums) {
  const targetSet = new Set(nums.map(n => n.toString()));
  const idxs = [];
  history.forEach((g, i) => {
    if (targetSet.has(g.toString())) idxs.push(i);
  });
  const res = [];
  for (let i = 1; i < idxs.length; i++) res.push(idxs[i] - idxs[i - 1]);
  return res;
}

function calcularAtraso(history, nums) {
  const targetSet = new Set(nums.map(n => n.toString()));
  const idx = history.map(g => targetSet.has(g.toString())).lastIndexOf(true);
  return idx === -1 ? history.length : history.length - 1 - idx;
}

function getWinWinLevel(dists, threshold = 5) {
  for (let n = Math.min(dists.length, 10); n >= 2; n--) {
    if (dists.slice(-n).every(d => d <= threshold)) {
      return n >= 3 ? `WIN-WIN(${n - 2})` : `WIN`;
    }
  }
  return null;
}

// ─── Engine ─────────────────────────────────────────────────────────────────────

export class LabCon1Engine {
  constructor(trackerInstance) {
    this.tracker = trackerInstance;
  }

  /**
   * Extrae el historial de números como array plano desde el tracker,
   * limitado a los últimos N giros según "Últimos N números (global)" en Ajustes
   */
  _getNumberHistory() {
    const spins = (this.tracker && typeof this.tracker.getSpins === 'function')
      ? this.tracker.getSpins() : [];
    const numbers = spins.map(s => String(s.number));
    // Aplicar ventana "Últimos N números (global)" desde ajustes
    const settings = rouletteSettingsStore.getSnapshot();
    const maxWindow = settings?.atrasosMaxWindow ?? 100;
    return numbers.length > 0 ? numbers.slice(-maxWindow) : [];
  }

  /**
   * Obtiene el threshold Win-Win para un conjunto dado
   */
  _getThreshold(setName) {
    const groupKey = SET_TO_WW_GROUP[setName] || 'winwinEvenMoney';
    const settings = rouletteSettingsStore.getSnapshot();
    const thresholds = settings.moduleThresholds || {};
    const group = thresholds[groupKey] || {};
    return group.distanceMax ?? 5;
  }

  /**
   * Analiza las métricas Win-Win para un conjunto
   */
  _getSetWinWinStats(setName) {
    const targetSet = SUBCONJUNTOS[setName];
    if (!targetSet) return { dists: [], atraso: 0, level: null, isActive: false };

    const history = this._getNumberHistory();
    if (history.length === 0) return { dists: [], atraso: 0, level: null, isActive: false };

    const nums = Array.from(targetSet);
    const threshold = this._getThreshold(setName);
    const dists = calcularDistancias(history, nums);
    const atraso = calcularAtraso(history, nums);
    const level = getWinWinLevel(dists, threshold);
    const isActive = level !== null && atraso <= threshold;

    return { dists, atraso, level, isActive, threshold };
  }

  /**
   * Calcula la ponderación basada en Win-Win:
   * - Conjuntos activos (racha corta de aciertos) obtienen peso alto
   * - Mayor nivel WIN-WIN(N) → más peso
   * - Sin racha activa → peso bajo con decaimiento
   */
  calcularPesoWinWin(setName) {
    const stats = this._getSetWinWinStats(setName);
    const { dists, atraso, level, isActive, threshold } = stats;

    if (!isActive || !level) {
      // Decaimiento suave cuando no hay racha activa
      const maxRatio = threshold * 3;
      return Math.max(0, 1 - atraso / maxRatio) * 0.25;
    }

    // Extraer longitud de racha desde el nivel
    let streakLength = 1; // "WIN" = 1
    if (level.startsWith('WIN-WIN(')) {
      const match = level.match(/WIN-WIN\((\d+)\)/);
      if (match) streakLength = parseInt(match[1], 10);
    }

    // Peso base por racha activa
    const baseWeight = 0.4;
    // Bonificación por longitud de racha (más racha = más peso)
    const streakBonus = Math.min(streakLength / 8, 0.4);
    // Bonificación por actualidad (menos atraso = más reciente)
    const recencyBonus = Math.max(0, 1 - atraso / (threshold || 5)) * 0.2;

    return Math.min(baseWeight + streakBonus + recencyBonus, 1.0);
  }

  /**
   * Retorna detalles de todos los conjuntos activos ordenados por peso
   */
  getSetDetails(activeSets) {
    return activeSets
      .filter(setName => SUBCONJUNTOS[setName])
      .map(setName => {
        const stats = this._getSetWinWinStats(setName);
        const weight = this.calcularPesoWinWin(setName);
        const size = SUBCONJUNTOS[setName].size;
        const hitProbability = size / UNIVERSO_RULETA.size;

        return {
          name: setName,
          actualDelay: stats.atraso,
          level: stats.level,
          isActive: stats.isActive,
          distsCount: stats.dists.length,
          weight,
          size,
          hitProbability,
          pressure: stats.isActive ? weight / Math.min(stats.atraso + 1, 1) : 0
        };
      })
      .sort((a, b) => b.weight - a.weight || b.isActive - a.isActive);
  }

  /**
   * Resuelve el score ponderado para cada número individual del universo
   * Score(n) = Σ I(n ∈ Sj) · w_ww(Sj)
   */
  resolverScoresIndividuales(activeSets) {
    const scores = {};
    UNIVERSO_RULETA.forEach(num => scores[num] = 0.0);

    activeSets.forEach(setName => {
      if (SUBCONJUNTOS[setName]) {
        const weight = this.calcularPesoWinWin(setName);
        SUBCONJUNTOS[setName].forEach(num => {
          scores[num] += weight;
        });
      }
    });

    return scores;
  }

  /**
   * Encuentra las intersecciones binarias óptimas basándose en la eficiencia:
   * Eficiencia = (w(A) + w(B)) / |A ∩ B|
   */
  buscarInterseccionesOptimas(activeSets, topK = 5) {
    const listadoPonderado = activeSets.map(name => ({
      name,
      weight: this.calcularPesoWinWin(name),
      elements: SUBCONJUNTOS[name]
    })).filter(set => set.weight > 0.1);

    const resultados = [];

    for (let i = 0; i < listadoPonderado.length; i++) {
      for (let j = i + 1; j < listadoPonderado.length; j++) {
        const A = listadoPonderado[i];
        const B = listadoPonderado[j];

        const interseccion = new Set([...A.elements].filter(x => B.elements.has(x)));

        if (interseccion.size > 0) {
          const pesoCombinado = A.weight + B.weight;
          const eficiencia = pesoCombinado / interseccion.size;

          resultados.push({
            combinacion: `${A.name} ∩ ${B.name}`,
            numeros: Array.from(interseccion).sort((x, y) => parseInt(x) - parseInt(y)),
            tamano_cobertura: interseccion.size,
            peso_retraso: pesoCombinado,
            eficiencia_ratio: eficiencia
          });
        }
      }
    }

    return resultados
      .sort((a, b) => b.eficiencia_ratio - a.eficiencia_ratio)
      .slice(0, topK);
  }
}
