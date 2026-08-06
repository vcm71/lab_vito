/**
 * MONTE CARLO VALIDATION FRAMEWORK
 * Evaluación de la fiabilidad del ORION Engine (Edge Score)
 * 
 * Basado en:
 * H0: Distribución Uniforme (1/38)
 * H1: Distribución con Sesgo (P > 1/38)
 */

const ROULETTE_NUMS = [
  "00","0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18",
  "19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36"
];

export class MonteCarloValidator {
  /**
   * @param {number} [seed=12345]
   * @param {import('./src/tracker/RouletteTracker.js').RouletteTracker} [domainTracker] - Tracker del dominio (Fase5.5.2)
   */
  constructor(seed = 12345, domainTracker = null) {
    this.seed = seed;
    this.domainTracker = domainTracker;
  }

  // Generador de números aleatorios determinista (Seeded RNG)
  _rng() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /**
   * Genera tiradas uniformes (H0)
   */
  generateUniform(n) {
    const spins = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(this._rng() * ROULETTE_NUMS.length);
      spins.push(ROULETTE_NUMS[idx]);
    }
    return spins;
  }

  /**
   * Genera tiradas con sesgo en uno o varios objetivos (repartido)
   */
  generateSectorBiased(n, targetInput, sectorSize, probability) {
    const spins = [];
    const wheelOrder = ["00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2","0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1"];
    
    // Procesar múltiples targets si vienen separados por coma
    const targets = String(targetInput).split(',').map(s => s.trim()).filter(s => wheelOrder.includes(s));
    if (targets.length === 0) targets.push("32"); // Fallback

    const sectorNums = new Set();
    const half = Math.floor(sectorSize / 2);
    
    targets.forEach(t => {
      const centerIdx = wheelOrder.indexOf(t);
      for (let i = -half; i <= half; i++) {
        const idx = (centerIdx + i + 38) % 38;
        sectorNums.add(wheelOrder[idx]);
      }
    });

    const sectorArray = Array.from(sectorNums);

    for (let i = 0; i < n; i++) {
      if (this._rng() < probability) {
        // Cae dentro del conjunto de números seleccionados/sectores
        const sIdx = Math.floor(this._rng() * sectorArray.length);
        spins.push(sectorArray[sIdx]);
      } else {
        const idx = Math.floor(this._rng() * wheelOrder.length);
        spins.push(wheelOrder[idx]);
      }
    }
    return spins;
  }

  /**
   * Genera tiradas con deriva (Drift)
   * La distribución cambia a mitad de la sesión
   */
  generateDrift(n, targetNum, startProb, endProb) {
    const spins = [];
    for (let i = 0; i < n; i++) {
      const currentProb = startProb + (endProb - startProb) * (i / n);
      if (this._rng() < currentProb) {
        spins.push(targetNum);
      } else {
        const others = ROULETTE_NUMS.filter(num => num !== targetNum);
        const idx = Math.floor(this._rng() * others.length);
        spins.push(others[idx]);
      }
    }
    return spins;
  }

  /**
   * Ejecuta la validación masiva con optimización de memoria
   */
  async validate(config, onProgress) {
    console.log("MC: Iniciando validación...", config);
    try {
      const iterations = config.iterations || 1000;
      const windowSizes = config.windowSizes || [50, 100, 200];
      const threshold = config.threshold || 75;

    const results = {
      h0: { scores: [], falsePositives: 0 },
      h1: { detections: 0, totalOpportunities: 0 },
      by_window_size: {}
    };

    // 1. Evaluación FPR (Bajo H0)
    const h0Spins = this.generateUniform(iterations + Math.max(...windowSizes));
    
    for (let wIdx = 0; wIdx < windowSizes.length; wIdx++) {
      const w = windowSizes[wIdx];
      results.by_window_size[w] = { fp: 0, tp: 0, count: 0, sumSprt: 0 };
      
      onProgress(wIdx, windowSizes.length + 1, `Analizando Ventana ${w}...`);

      for (let i = 0; i < iterations; i++) {
        if (i % 10 === 0) {
           await new Promise(r => setTimeout(r, 0)); 
           const subPct = Math.round((i / iterations) * 100);
           onProgress(wIdx, windowSizes.length + 1, `Analizando Ventana ${w} (${subPct}%)...`);
        }

        const window = h0Spins.slice(i, i + w);
        const metrics = this._getEdgeScoreFast(window);
        
        results.h0.scores.push(metrics.confidence);
        if (metrics.confidence >= threshold) {
          results.h0.falsePositives++;
          results.by_window_size[w].fp++;
        }
        results.by_window_size[w].count++;
        results.by_window_size[w].sumSprt += metrics.sprt;
      }
    }

    // 2. Evaluación TPR (Bajo H1)
    onProgress(windowSizes.length, windowSizes.length + 2, `Evaluando Sensibilidad (H1: ${config.biasConfig.type})...`);
    const biasType = config.biasConfig.type || 'number';
    const targetInput = config.biasConfig.target || "32";
    const biasProb = config.biasConfig.biasProb || 0.12;
    const wheelOrder = ["00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2","0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1"];

    let finalTargets = targetInput;

    // Lógica de Grupos Automática del Profesor_Orion
    if (biasType === 'dozen') {
      if (targetInput.includes("1")) finalTargets = "1,2,3,4,5,6,7,8,9,10,11,12";
      else if (targetInput.includes("2")) finalTargets = "13,14,15,16,17,18,19,20,21,22,23,24";
      else finalTargets = "25,26,27,28,29,30,31,32,33,34,35,36";
    } else if (biasType === 'column') {
      if (targetInput.includes("1")) finalTargets = "1,4,7,10,13,16,19,22,25,28,31,34";
      else if (targetInput.includes("2")) finalTargets = "2,5,8,11,14,17,20,23,26,29,32,35";
      else finalTargets = "3,6,9,12,15,18,21,24,27,30,33,36";
    }

    const targets = String(finalTargets).split(',').map(s => s.trim()).filter(s => wheelOrder.includes(s));
    if (targets.length === 0) targets.push("32");

    const hitMap = {};
    let h1Spins = [];
    if (biasType === 'sector') {
      h1Spins = this.generateSectorBiased(iterations + 300, finalTargets, 5, biasProb);
    } else {
      h1Spins = this.generateSectorBiased(iterations + 300, finalTargets, 1, biasProb);
    }

    // Registrar distribución real de H1
    h1Spins.forEach(s => hitMap[s] = (hitMap[s] || 0) + 1);

    for (let i = 0; i < iterations; i++) {
      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, 0));
        // Calculamos un paso decimal para que la barra se mueva: 3.0 -> 3.1 -> 3.2 ... -> 4.0
        const granularStep = windowSizes.length + (i / iterations);
        onProgress(granularStep, windowSizes.length + 1, `Evaluando Sensibilidad (${Math.round(i/iterations*100)}%)...`);
      }
      
      const windowRaw = h1Spins.slice(i, i + 100); 
      const window = windowRaw.map(s => ({ number: String(s) }));

      const metrics = this._getEdgeScoreFast(window);
      
      if (metrics.confidence >= threshold) results.h1.detections++;
      results.h1.totalOpportunities++;
    }
    
    results.h1.hitMap = hitMap;

    // 3. Evaluación DRIFT (Adaptabilidad ante sesgo progresivo)
    onProgress(windowSizes.length + 1, windowSizes.length + 2, `Evaluando Adaptabilidad (Drift)...`);
    
    const driftTarget = targets[0] || "32";
    const driftSpinsRaw = this.generateDrift(iterations + 200, driftTarget, 0.026, 0.15); 
    const driftSpins = driftSpinsRaw.map(s => ({ number: String(s) }));

    let driftDetections = 0;
    for (let i = 0; i < iterations; i++) {
      if (i % 20 === 0) {
        await new Promise(r => setTimeout(r, 0));
        onProgress(windowSizes.length + 1 + (i / iterations), windowSizes.length + 2, `Analizando Drift (${Math.round(i/iterations*100)}%)...`);
      }
      
      const window = driftSpins.slice(i, i + 100);
      const metrics = this._getEdgeScoreFast(window);
      if (metrics.confidence >= threshold) driftDetections++;
    }
    const driftTpr = driftDetections / iterations;

    // Cálculos Finales
    const fpr = results.h0.falsePositives / (iterations * windowSizes.length);
    const tpr = results.h1.detections / results.h1.totalOpportunities;
    const precision = tpr / (tpr + fpr || 1);
    
    const scores = results.h0.scores.sort((a,b) => a - b);
    const mean = scores.reduce((a,b) => a+b, 0) / (scores.length || 1);
    const variance = scores.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / (scores.length || 1);
    const p95 = scores[Math.floor(scores.length * 0.95)] || 0;
    const p99 = scores[Math.floor(scores.length * 0.99)] || 0;

    Object.keys(results.by_window_size).forEach(w => {
      const d = results.by_window_size[w];
      d.fpr = +(d.fp / (d.count || 1)).toFixed(4);
      d.tpr = +tpr.toFixed(4);
      d.precision = +(d.tpr / (d.tpr + d.fpr) || 0).toFixed(4);
      d.sumSprt = d.sumSprt || 0;
    });

      return {
        fpr: +fpr.toFixed(4),
        tpr: +tpr.toFixed(4),
        drift_tpr: +driftTpr.toFixed(4),
        precision: +precision.toFixed(4),
        edge_distribution: {
          mean: +mean.toFixed(4),
          variance: +variance.toFixed(4),
          p95: +p95.toFixed(4),
          p99: +p99.toFixed(4)
        },
        acceptance_criteria: [
          { criterion: "FPR ≤ 5%", value: fpr, passed: fpr <= 0.05 },
          { criterion: "TPR (Bias) ≥ 60%", value: tpr, passed: tpr >= 0.60 },
          { criterion: "TPR (Drift) ≥ 40%", value: driftTpr, passed: driftTpr >= 0.40 },
          { criterion: "Precisión ≥ 80%", value: precision, passed: precision >= 0.80 }
        ],
        by_window_size: results.by_window_size,
        h1_hit_map: results.h1.hitMap,
        status: (fpr <= 0.05 && tpr >= 0.60) ? "VALIDATED" : "HIGH_NOISE"
      };
    } catch (err) {
      console.error("MC ERROR CRITICO:", err);
      throw err;
    }
  }

  /**
   * CÁLCULO DIRECTO: Evita bloqueos usando las fórmulas estadísticas puras
   * @param {Array} spins - Array de objetos {number: string}
   * @returns {{confidence: number, sprt: number}}
   */
  _getEdgeScoreFast(spins) {
    try {
      const n = spins.length;
      if (n === 0) return { confidence: 0, sprt: 0 };

      // Contamos frecuencias directamente del array para evitar overhead del tracker
      const freq = {};
      for (const s of spins) {
        const num = s.number;
        freq[num] = (freq[num] || 0) + 1;
      }

      let maxConfidence = 0;
      const z = 1.96; // 95% Confidence

      for (const num in freq) {
        const count = freq[num];
        const p = count / n;
        
        // Wilson Score Interval (Lower Bound)
        const den = 1 + z*z/n;
        const center = p + z*z/(2*n);
        const spread = z * Math.sqrt(p*(1-p)/n + z*z/(4*n*n));
        // FILTRO PROFESOR_ORION: Solo contamos lo que EXREDE al azar (1/38 ≈ 0.0263)
        const expected = 1 / 38;
        const excess = lowerBound - expected;
        
        // Si no hay exceso sobre el azar, la confianza es 0.
        // Si hay exceso, escalamos: un exceso de 0.04 (doble de prob) llegará a >0.90
        const confidence = excess > 0 ? Math.min(0.999, excess * 25) : 0;
        
        if (confidence > maxConfidence) maxConfidence = confidence;
      }

      return {
        confidence: +maxConfidence.toFixed(4),
        sprt: maxConfidence > 0.5 ? (maxConfidence * 5).toFixed(2) : 0
      };
    } catch (e) {
      return { confidence: 0, sprt: 0 };
    }
  }
}

/**
 * Función puente para ejecutar simulaciones desde el Worker de forma asíncrona
 */
export async function batchRunner(config, onProgress) {
  const validator = new MonteCarloValidator(config.seed || Date.now());
  const iterations = config.iterations || 1000;
  const windowSizes = config.windowSizes || [50, 100, 200];
  
  // Dividimos en fases para reportar progreso
  const totalSteps = windowSizes.length + 2; // Fases H0 + H1 + Drift
  let currentStep = 0;

  onProgress(currentStep, totalSteps, "Iniciando validación Monte Carlo...");

  const results = await validator.validate(config, onProgress);

  onProgress(totalSteps, totalSteps, "Simulación completada.");
  return results;
}
