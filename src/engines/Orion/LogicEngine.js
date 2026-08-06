import { AMERICAN_WHEEL_ORDER, getWheelDistance } from '../../utils/numberMeta.js';
import { BaseEngine } from '../../core/BaseEngine.js';

// CONSTANTES ESTATICAS
const RED_NUMS = ["1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"];
const ALL_NUMS = [
  "00", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18",
  "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"
];

/**
 * UTILS: ESTADÍSTICA AVANZADA (ORION v5 - Fusión Sesgo 97)
 */
class QuantUtils {
  // Decay temporal: w_t = exp(-λ(T - t))
  static exponentialDecay(total, index, lambda = 0.02) {
    return Math.exp(-lambda * (total - index));
  }

  // Intervalo de Wilson (Lower Bound para confianza rigurosa)
  static wilsonLowerBound(p, n, z = 1.96) {
    if (n === 0) return 0;
    const denominator = 1 + (z * z) / n;
    const center = p + (z * z) / (2 * n);
    const spread = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
    return (center - spread) / denominator;
  }

  // Sequential Probability Ratio Test (LR)
  static calculateSPRT(hits, total, p0, p1) {
    if (total === 0) return 1;
    // Log-Likelihood Ratio
    const l1 = hits * Math.log(p1) + (total - hits) * Math.log(1 - p1);
    const l0 = hits * Math.log(p0) + (total - hits) * Math.log(1 - p0);
    return Math.exp(l1 - l0);
  }

  // Entropía de Shannon para detección de caos
  static calculateEntropy(freqs) {
    const total = Object.values(freqs).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    let entropy = 0;
    for (const f of Object.values(freqs)) {
      if (f > 0) {
        const p = f / total;
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }
}

/**
 * ORION – Multi-Agent Edge Detection Engine (v5)
 * Integrado con Auditoría Física Espacial
 */
export class LogicEngine extends BaseEngine {
  constructor(tracker, winwinEngine) {
    super('Orion');
    this.tracker = tracker;
    this.winwin = winwinEngine;
    this.regime = 'R1'; // Default: Random
    this.bankroll = 200;
    this.history = []; // Para tracking de bankroll

    this.config = {
      lambda: 0.01,       // Memoria para elevar confianza de Wilson
      minSpins: 50
    };

    // Parámetros dinámicos
    this.params = {
      weightHistory: 0.30,   // Z-Score Frecuencia
      weightDelay: 0.25,     // Rareza por Ausencia
      weightMath: 0.20,      // Chi-Cuadrado
      thresholdRisk: 2.4,    // Umbral Logarítmico
      edgeThreshold: 0.50,
      stabilityThreshold: 0.40
    };
  }

  /**
   * DETECCIÓN DE RÉGIMEN (R1-R4) - Mejorado con Auditoría Chi-Cuadrado
   */
  detectRegime() {
    const spins = this.tracker.getSpins();
    if (spins.length < 20) return 'R1';

    const sampleFreqs = {};
    AMERICAN_WHEEL_ORDER.forEach(n => sampleFreqs[n] = 0);
    spins.forEach(s => {
      if (sampleFreqs[s.number] !== undefined) sampleFreqs[s.number]++;
    });

    const totalSpins = spins.length;

    // 1. Auditoría Chi-Cuadrado (Sesgo 97)
    const expected = totalSpins / 38;
    let chiTotal = 0;
    AMERICAN_WHEEL_ORDER.forEach(num => {
      const obs = sampleFreqs[num] || 0;
      const d = obs - expected;
      chiTotal += (d * d) / expected;
    });

    // Si el valor Chi-Cuadrado supera el umbral crítico (50.999), 
    // el sesgo estructural es matemático y definitivo.
    const chiCritico = 50.999;
    if (chiTotal > chiCritico) return 'R4';

    // 2. Entropía y Varianza (Filtro Secundario)
    const entropy = QuantUtils.calculateEntropy(sampleFreqs);
    const maxEntropy = Math.log2(38);
    const relativeEntropy = entropy / maxEntropy;

    // Autocorrelación (Dealer Index)
    const distances = [];
    for (let i = 1; i < spins.length; i++) {
      distances.push(getWheelDistance(spins[i].number, spins[i - 1].number));
    }
    const avgDist = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0;
    const variance = distances.length > 0 ? distances.reduce((a, b) => a + Math.pow(b - avgDist, 2), 0) / distances.length : 0;

    // Lógica de Clasificación
    if (relativeEntropy < 0.97 && variance < 30) return 'R4'; // Mixed: Detección de sesgo estructural
    if (variance < 25) return 'R2'; // Cluster
    if (relativeEntropy < 0.95) return 'R3'; // Persistence
    return 'R1'; // Random
  }

  /**
   * TRIANGULACIÓN v5 - Dinámica Espacial
   */
  triangulate() {
    if (!this.tracker) return [];
    const spins = this.tracker.getSpins();
    const total = spins.length;
    if (total < 10) return [];

    this.regime = this.detectRegime();
    const opportunities = [];

    // 1. EVALUAR SERIES DEL USUARIO
    const customSeries = this.tracker.getSettings().customSeries || [];
    customSeries.forEach(s => {
      if (s.active !== false) {
        const opp = this._evaluateProcess(s.name, s.numbers, total);
        if (opp) opportunities.push(opp);
      }
    });

    // 2. ESCÁNER FÍSICO DINÁMICO (Sectores de 5, 7 y 9 números)
    const sectorSizes = [5, 7, 9];
    const NUM_POSICIONES = AMERICAN_WHEEL_ORDER.length;
    const sampleFreqs = {};
    AMERICAN_WHEEL_ORDER.forEach(n => sampleFreqs[n] = 0);
    spins.forEach(s => {
      if (sampleFreqs[s.number] !== undefined) sampleFreqs[s.number]++;
    });

    sectorSizes.forEach(size => {
      let maxFreq = -1, bestOffset = -1;
      for (let offset = 0; offset < NUM_POSICIONES; offset++) {
        let currentFreq = 0;
        for (let i = 0; i < size; i++) {
          const num = AMERICAN_WHEEL_ORDER[(offset + i) % NUM_POSICIONES];
          currentFreq += (sampleFreqs[num] || 0);
        }
        if (currentFreq > maxFreq) {
          maxFreq = currentFreq;
          bestOffset = offset;
        }
      }

      const nums = [];
      for (let i = 0; i < size; i++) {
        nums.push(AMERICAN_WHEEL_ORDER[(bestOffset + i) % NUM_POSICIONES]);
      }
      const anchor = AMERICAN_WHEEL_ORDER[bestOffset];
      const name = `Sector_${size}_(${anchor})`;
      const opp = this._evaluateProcess(name, nums, total);
      if (opp) opportunities.push(opp);
    });

    // 3. Evaluar Familias Estándar
    const families = [
      { name: 'Rojo', nums: RED_NUMS },
      { name: 'Negro', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && !RED_NUMS.includes(n)) },
      { name: 'Docena_1', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && parseInt(n) >= 1 && parseInt(n) <= 12) },
      { name: 'Docena_2', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && parseInt(n) >= 13 && parseInt(n) <= 24) },
      { name: 'Docena_3', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && parseInt(n) >= 25 && parseInt(n) <= 36) },
      { name: 'Col_1', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && parseInt(n) % 3 === 1) },
      { name: 'Col_2', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && parseInt(n) % 3 === 2) },
      { name: 'Col_3', nums: ALL_NUMS.filter(n => n !== '0' && n !== '00' && parseInt(n) % 3 === 0) }
    ];

    families.forEach(f => {
      const opp = this._evaluateProcess(f.name, f.nums, total);
      if (opp) opportunities.push(opp);
    });

    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * MATRIZ DE RIESGO
   */
  generateRiskMatrix() {
    const opps = this.triangulate();
    const matrix = { CRITICAL: [], STABLE: [], SPECULATIVE: [] };

    opps.forEach(o => {
      const risk = o.risk || 'SPECULATIVE';
      if (matrix[risk]) matrix[risk].push(o);
    });

    return matrix;
  }

  /**
   * ANALIZADOR DE CAOS VS FIRMA
   */
  analyzeRouletteState() {
    const spins = this.tracker.getSpins();
    if (spins.length < 20) return { state: 'Buscando patrón...', icon: '⏳', color: '#94a3b8' };

    const regime = this.detectRegime();

    if (regime === 'R4') {
      return {
        state: 'EDGE FÍSICO DETECTADO (R4)',
        icon: '🎯',
        color: '#10b981',
        detail: 'Confluencia de Chi-Cuadrado, baja entropía y sesgo angular.'
      };
    } else if (regime === 'R1') {
      return {
        state: 'CAOS / AZAR PURO',
        icon: '🌋',
        color: '#ef4444',
        detail: 'La aleatoriedad es total. Evita operar o usa extrema precaución.'
      };
    } else {
      return {
        state: 'FLUJO ESTRUCTURADO (' + regime + ')',
        icon: '🔄',
        color: '#3b82f6',
        detail: 'Detectada persistencia estadística o clusters moderados.'
      };
    }
  }

  _evaluateProcess(name, nums, total) {
    const spins = this.tracker.getSpins();
    const p0 = nums.length / 38;
    const p1 = p0 + 0.05; // Delta +5%

    // Conteo con Decay Temporal
    let weightedHits = 0;
    let totalWeight = 0;
    spins.forEach((s, i) => {
      const w = QuantUtils.exponentialDecay(total || spins.length, i, this.config.lambda || 0.01);
      if (nums.includes(s.number)) weightedHits += w;
      totalWeight += w;
    });

    const pObs = totalWeight > 0 ? weightedHits / totalWeight : 0;
    const confidence = totalWeight > 0 ? QuantUtils.wilsonLowerBound(pObs, totalWeight) : 0;
    const sprt = totalWeight > 0 ? QuantUtils.calculateSPRT(weightedHits, totalWeight, p0, p1) : 1;
    const ev = (pObs * 36 / Math.max(1, nums.length)) - 1;

    const stability = Math.min(1, (sprt > 10 ? 0.8 : 0) + (ev > 0 ? 0.2 : 0));

    // Refuerzo espacial: Si la serie es un \"Sector Dinámico\", tiene mayor peso balístico.
    const isPhysicalSector = name.startsWith('Sector_');

    return {
      name,
      numbers: nums,
      confidence: (confidence * 100).toFixed(1),
      stability: stability.toFixed(2),
      ev: ev.toFixed(4),
      sprt: sprt.toFixed(2),
      regime: this.regime,
      qValue: (1 - confidence).toFixed(4), // Proxy FDR
      isPhysicalSector: isPhysicalSector,
      risk: (confidence > 0.85 && (isPhysicalSector || sprt > 20)) ? 'CRITICAL' : (confidence > 0.7 ? 'STABLE' : 'SPECULATIVE')
    };
  }

  /**
   * REGLA FINAL DE APUESTA (Confluencia Espacial + Matemática)
   */
  shouldBet(opp) {
    // Permite apostar a S_32, S_90, sectores físicos, docenas o columnas
    const isTargetSeries = opp.name === 'S_32' || opp.name === 'S_90' || opp.isPhysicalSector || opp.name.startsWith('Docena_') || opp.name.startsWith('Col_');
    const isRegimeR4 = this.regime === 'R4';
    const confHigh = parseFloat(opp.confidence) >= (this.params.edgeThreshold * 100);
    const stabHigh = parseFloat(opp.stability) >= this.params.stabilityThreshold;
    const evPositive = parseFloat(opp.ev) > 0;
    const qValid = parseFloat(opp.qValue) <= 0.15;

    return isRegimeR4 && isTargetSeries && confHigh && stabHigh && evPositive && qValid;
  }

  /**
   * OPTIMIZACIÓN GENÉTICA
   */
  geneticOptimize() {
    const population = [];
    for (let i = 0; i < 20; i++) {
      const size = 4 + Math.floor(Math.random() * 5); // 4-8 números
      const nums = [];
      while (nums.length < size) {
        const n = ALL_NUMS[Math.floor(Math.random() * 38)];
        if (!nums.includes(n)) nums.push(n);
      }
      population.push(nums);
    }

    const total = this.tracker.getSpins().length;
    const results = population.map(nums => {
      const opp = this._evaluateProcess('GENETIC', nums, total);
      const fitness = parseFloat(opp.ev) * parseFloat(opp.stability) * Math.log(1 + total);
      return { nums, fitness, ...opp };
    });

    return results.sort((a, b) => b.fitness - a.fitness).slice(0, 10);
  }

  /**
   * PROGRESIÓN DINÁMICA (2-3-5-8)
   */
  getDynamicStake(stepIdx = 0) {
    const progression = [2, 3, 5, 8];
    const baseUnit = Math.max(1, Math.floor(this.bankroll / 100)); // 1 unidad cada 100 fichas
    const multiplier = progression[Math.min(stepIdx, progression.length - 1)];
    return baseUnit * (multiplier / 2); // Normalizado a la base de 2 fichas iniciales
  }

  /**
   * SIMULACIÓN DE BANCA (ORION v5)
   */
  simulateBankroll(lastSpin) {
    const opps = this.triangulate();
    const best = opps.find(o => this.shouldBet(o));

    if (best) {
      const stake = this.getDynamicStake(0);
      const won = best.numbers.includes(lastSpin);
      const payout = (36 / best.numbers.length) - 1;

      if (won) {
        this.bankroll += stake * payout;
      } else {
        this.bankroll -= stake;
      }
      this.history.push(this.bankroll);
    }

    return {
      bankroll: this.bankroll,
      betting: !!best,
      opportunity: best ? best.name : null,
      stake: best ? this.getDynamicStake(0) : 0
    };
  }

  getBestOpportunities() {
    return this.triangulate()
      .filter(opp => parseFloat(opp.confidence) >= 60)
      .map(opp => ({
        id: opp.name,
        confidence: parseFloat(opp.confidence) / 100,
        risk: opp.risk,
        numbers: opp.numbers,
        ev: opp.ev,
        stability: opp.stability,
        regime: opp.regime,
        isPhysicalSector: opp.isPhysicalSector
      }));
  }

  // ── Lifecycle (BaseEngine) ───────────────────────────────────────
  async initialize() {
    await super.initialize();
    // Any custom initialization for Orion
  }

  async start() {
    await super.start();
    // Any custom start logic for Orion
  }

  async stop() {
    await super.stop();
    // Any custom stop logic for Orion
  }

  async dispose() {
    await super.dispose();
    // Any custom cleanup for Orion
  }
}
