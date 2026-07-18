/**
 * WinWin, Atrasos, CHI & Estrategias Engine
 * Migración de lógica de Google Apps Script a ES6 para Roulette Tracker Pro.
 */

import { RouletteTracker, RED_NUMBERS } from './rouletteTracker.js';
import { winwinHistoricalMaxesStore } from './winwinHistoricalMaxesStore.js';

export class WinWinEngine {
  constructor(tracker) {
    this.tracker = tracker;
    this.historicalMaxes = this._loadHistoricalMaxes();
    this._historicalRevision = 0;
    this._historicalPersistQueue = Promise.resolve();
    this.ready = this._hydrateHistoricalMaxes();
  }

  _loadHistoricalMaxes() {
    return winwinHistoricalMaxesStore.getSnapshot();
  }

  _saveHistoricalMaxes() {
    const snapshot = JSON.parse(JSON.stringify(this.historicalMaxes));
    this._historicalRevision += 1;
    this._historicalPersistQueue = this._historicalPersistQueue
      .then(() => winwinHistoricalMaxesStore.setMaxes(snapshot))
      .catch(() => winwinHistoricalMaxesStore.setMaxes(snapshot))
      .catch((e) => {
        console.warn('No se pudieron persistir los máximos de WinWin en IndexedDB:', e);
      });
    return this._historicalPersistQueue;
  }

  async _hydrateHistoricalMaxes() {
    try {
      const revisionAtStart = this._historicalRevision;
      const { maxes: persisted } = await winwinHistoricalMaxesStore.load();
      if (this._historicalRevision !== revisionAtStart) return;
      if (persisted && JSON.stringify(persisted) !== JSON.stringify(this.historicalMaxes)) {
        this.historicalMaxes = persisted;
      }
    } catch (e) {
      console.warn('No se pudieron hidratar los máximos de WinWin desde IndexedDB:', e);
    }
  }

  /**
   * Actualiza los máximos históricos basados en la sesión actual.
   */
  _updateMaxes(key, category, currentAtraso) {
    if (!this.historicalMaxes[key][category] || currentAtraso > this.historicalMaxes[key][category]) {
      this.historicalMaxes[key][category] = currentAtraso;
      this._saveHistoricalMaxes();
    }
    return this.historicalMaxes[key][category];
  }

  /**
   * ESCANEO PROFUNDO: Recorre todo el historial para reconstruir los récords.
   */
  rescanFullHistory(spins, customSeries = []) {
    // 1. Resetear récords actuales para esta sesión
    this.historicalMaxes = { externals: {}, dozens: {}, seisenas: {}, series: {} };
    const nums = spins.map(s => parseInt(s.number)).filter(n => !isNaN(n));
    const giros = spins.map(s => s.number);

    // Definición de condiciones
    const rojos = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const conds = {
      externals: {
        "Rojo": n => rojos.has(n), "Negro": n => n > 0 && n < 37 && !rojos.has(n),
        "Par": n => n > 0 && n <= 36 && n % 2 === 0, "Impar": n => n > 0 && n <= 36 && n % 2 !== 0,
        "Falta": n => n >= 1 && n <= 18, "Pasa": n => n >= 19 && n <= 36
      },
      dozens: {
        "D1": n => n >= 1 && n <= 12, "D2": n => n >= 13 && n <= 24, "D3": n => n >= 25 && n <= 36,
        "C1": n => n > 0 && n <= 36 && n % 3 === 1, "C2": n => n > 0 && n <= 36 && n % 3 === 2, "C3": n => n > 0 && n <= 36 && n % 3 === 0
      },
      seisenas: {
        "S1": n => n >= 1 && n <= 6, "S2": n => n >= 7 && n <= 12, "S3": n => n >= 13 && n <= 18,
        "S4": n => n >= 19 && n <= 24, "S5": n => n >= 25 && n <= 30, "S6": n => n >= 31 && n <= 36
      }
    };

    // Escanear Externals, Dozens, Seisenas
    for (let type in conds) {
      for (let key in conds[type]) {
        let max = 0, current = 0;
        nums.forEach(n => {
          if (conds[type][key](n)) {
            max = Math.max(max, current);
            current = 0;
          } else {
            current++;
          }
        });
        this.historicalMaxes[type][key] = Math.max(max, current);
      }
    }

    // Escanear Series Personalizadas
    customSeries.forEach(s => {
      let max = 0, current = 0;
      giros.forEach(g => {
        if (s.numbers.includes(g)) {
          max = Math.max(max, current);
          current = 0;
        } else {
          current++;
        }
      });
      this.historicalMaxes.series[s.name] = Math.max(max, current);
    });

    this._saveHistoricalMaxes();
    return true;
  }

  /**
   * Análisis de Seisenas (Grupos de 6)
   */
  analyzeSeisenas(spins, threshold, windowSize = null) {
    const data = windowSize ? spins.slice(-windowSize) : spins;
    const seisenas = {
      "S1": n => n >= 1 && n <= 6,
      "S2": n => n >= 7 && n <= 12,
      "S3": n => n >= 13 && n <= 18,
      "S4": n => n >= 19 && n <= 24,
      "S5": n => n >= 25 && n <= 30,
      "S6": n => n >= 31 && n <= 36
    };
    
    const results = [];
    const nums = data.map(s => parseInt(s.number)).filter(n => !isNaN(n));

    const fullNums = spins.map(s => parseInt(s.number)).filter(n => !isNaN(n));

    for (let k in seisenas) {
      const check = seisenas[k];
      
      // 1. Atraso Actual
      let currentAtr = 0;
      for (let i = nums.length - 1; i >= 0; i--) {
        if (check(nums[i])) break;
        currentAtr++;
      }

      // 2. Máximo Histórico (Total)
      let maxTotal = 0;
      let tempAtr = 0;
      for (let i = 0; i < fullNums.length; i++) {
        if (check(fullNums[i])) {
          if (tempAtr > maxTotal) maxTotal = tempAtr;
          tempAtr = 0;
        } else {
          tempAtr++;
        }
      }
      if (tempAtr > maxTotal) maxTotal = tempAtr;

      results.push({
        label: k,
        atraso: currentAtr,
        maxHist: maxTotal,
        delta: currentAtr - maxTotal,
        isAlert: currentAtr >= threshold
      });
    }
    return results;
  }

  /**
   * Análisis CHI (Sesgo) con umbrales (+ / -)
   */
  analyzeCHI(spins, windowSize, uNum, uApu) {
    if (spins.length < windowSize) return null;
    const sub = spins.slice(-windowSize).map(s => s.number === '00' ? 37 : parseInt(s.number));
    const total = sub.length;
    const expNum = total / 38;
    const expApu = total / 2;

    const freqs = {};
    sub.forEach(n => { freqs[n] = (freqs[n] || 0) + 1; });

    const numAlerts = [];
    for (let i = 0; i <= 37; i++) {
      let obs = freqs[i] || 0;
      const label = i === 37 ? "00" : i.toString();
      if (obs > expNum * (1 + uNum)) numAlerts.push({ num: label, type: 'plus', obs, exp: expNum.toFixed(1) });
      else if (obs < expNum * (1 - uNum)) numAlerts.push({ num: label, type: 'minus', obs, exp: expNum.toFixed(1) });
    }

    const rojos = new Set(RED_NUMBERS.map(n => parseInt(n)));
    let counts = { Rojo: 0, Negro: 0, Par: 0, Impar: 0, Falta: 0, Pasa: 0 };
    sub.forEach(n => {
      if (n === 0 || n === 37) return;
      if (rojos.has(n)) counts.Rojo++; else counts.Negro++;
      if (n % 2 === 0) counts.Par++; else counts.Impar++;
      if (n <= 18) counts.Falta++; else counts.Pasa++;
    });

    const apuAlerts = [];
    for (let key in counts) {
      if (counts[key] > expApu * (1 + uApu)) apuAlerts.push({ label: key, type: 'plus', obs: counts[key], exp: expApu.toFixed(1) });
      else if (counts[key] < expApu * (1 - uApu)) apuAlerts.push({ label: key, type: 'minus', obs: counts[key], exp: expApu.toFixed(1) });
    }

    return { nums: numAlerts, bets: apuAlerts };
  }

  /**
   * Análisis Win-Win (Rachas cortas)
   */
  analyzeWinWin(spins, series, windowSize = null) {
    const data = windowSize ? spins.slice(-windowSize) : spins;
    const results = [];
    const giros = data.map(s => s.number);

    series.forEach(s => {
      const dists = this._calcularDistancias(giros, s.numbers);
      const atr = this._calcularAtraso(giros, s.numbers);
      
      if (atr <= 5) {
        const winType = this._getWinWinLevel(dists);
        if (winType) {
          results.push({
            name: s.name,
            type: winType,
            lastDists: dists.slice(-5).join(', '),
            atraso: atr
          });
        }
      }
    });
    return results;
  }

  /**
   * Análisis de Series Atrasadas (Lógica original extendida)
   */
  analyzeSeriesAtrasadas(spins, activeSeries, windowSize = null, threshold = 20, weaknessDistCount = 3) {
    const data = windowSize ? spins.slice(-windowSize) : spins;
    const results = [];
    const nums = data.map(s => s.number);
    const allNums = spins.map(s => s.number);

    activeSeries.forEach(s => {
      // 1. Atraso Actual (Ventana)
      let currentAtr = 0;
      for (let i = nums.length - 1; i >= 0; i--) {
        if (s.numbers.map(n => n.toString()).includes(nums[i].toString())) break;
        currentAtr++;
      }

      // 2. Máximo en la VENTANA
      let maxWin = 0;
      let tempAtr = 0;
      for (let i = 0; i < nums.length; i++) {
        if (s.numbers.map(n => n.toString()).includes(nums[i].toString())) {
          if (tempAtr > maxWin) maxWin = tempAtr;
          tempAtr = 0;
        } else {
          tempAtr++;
        }
      }
      if (tempAtr > maxWin) maxWin = tempAtr;

      // Determinar debilidad basado en distancias pasadas (últimas 5 del TOTAL para debilidad)
      const lastDistances = this._getLastDistances(allNums, s.numbers);
      const isWeak = lastDistances.length >= (weaknessDistCount || 3) && 
                     lastDistances.slice(0, weaknessDistCount || 3).every(d => d > 37);

      results.push({
        label: s.name,
        atraso: currentAtr,
        maxHist: maxWin,
        delta: currentAtr - maxWin,
        isAlert: currentAtr >= threshold,
        isWeak: isWeak,
        lastDistances: lastDistances.slice(0, 5)
      });
    });
    return results;
  }

  /**
   * Análisis de Apuestas Externas (Rojo/Negro, Par/Impar, etc.) con Récords
   */
  analyzeExternals(spins, threshold, windowSize = null) {
    const data = windowSize ? spins.slice(-windowSize) : spins;
    const rojos = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const externals = { 
      "Rojo": n => rojos.has(n), 
      "Negro": n => n > 0 && n < 37 && !rojos.has(n),
      "Par": n => n > 0 && n <= 36 && n % 2 === 0, 
      "Impar": n => n > 0 && n <= 36 && n % 2 !== 0, 
      "Falta": n => n >= 1 && n <= 18, 
      "Pasa": n => n >= 19 && n <= 36 
    };
    
    const results = [];
    const nums = data.map(s => parseInt(s.number)).filter(n => !isNaN(n));

    const fullNums = spins.map(s => parseInt(s.number)).filter(n => !isNaN(n));

    for (let label in externals) {
      const check = externals[label];
      
      // 1. Atraso Actual (en la ventana/muestra elegida)
      let currentAtr = 0;
      for (let i = nums.length - 1; i >= 0; i--) {
        if (check(nums[i])) break;
        currentAtr++;
      }

      // 2. Máximo Histórico (en TODO el historial disponible)
      let maxTotal = 0;
      let tempAtr = 0;
      for (let i = 0; i < fullNums.length; i++) {
        if (check(fullNums[i])) {
          if (tempAtr > maxTotal) maxTotal = tempAtr;
          tempAtr = 0;
        } else {
          tempAtr++;
        }
      }
      if (tempAtr > maxTotal) maxTotal = tempAtr;

      results.push({
        label: label,
        atraso: currentAtr,
        maxHist: maxTotal,
        delta: currentAtr - maxTotal,
        isAlert: currentAtr >= threshold
      });
    }
    return results;
  }

  /**
   * Análisis de Docenas y Columnas con Récords
   */
  analyzeDozens(spins, threshold, windowSize = null) {
    const data = windowSize ? spins.slice(-windowSize) : spins;
    const dozens = { 
      "D1": n => n >= 1 && n <= 12, "D2": n => n >= 13 && n <= 24, "D3": n => n >= 25 && n <= 36, 
      "C1": n => n > 0 && n <= 36 && n % 3 === 1, "C2": n => n > 0 && n <= 36 && n % 3 === 2, "C3": n => n > 0 && n <= 36 && n % 3 === 0 
    };
    
    const results = [];
    const nums = data.map(s => parseInt(s.number)).filter(n => !isNaN(n));

    const fullNums = spins.map(s => parseInt(s.number)).filter(n => !isNaN(n));

    for (let label in dozens) {
      const check = dozens[label];
      
      // 1. Atraso Actual
      let currentAtr = 0;
      for (let i = nums.length - 1; i >= 0; i--) {
        if (check(nums[i])) break;
        currentAtr++;
      }

      // 2. Máximo Histórico (Total)
      let maxTotal = 0;
      let tempAtr = 0;
      for (let i = 0; i < fullNums.length; i++) {
        if (check(fullNums[i])) {
          if (tempAtr > maxTotal) maxTotal = tempAtr;
          tempAtr = 0;
        } else {
          tempAtr++;
        }
      }
      if (tempAtr > maxTotal) maxTotal = tempAtr;

      results.push({
        label: label,
        atraso: currentAtr,
        maxHist: maxTotal,
        delta: currentAtr - maxTotal,
        isAlert: currentAtr >= threshold
      });
    }
    return results;
  }

  /**
   * Análisis Ley del Tercio
   */
  analyzeLeyDelTercio(spins, evalWindow) {
    if (spins.length < evalWindow) return null;
    const sub = spins.slice(-evalWindow).map(s => s.number);
    const unique = new Set(sub);
    const expectedUnique = Math.round(38 * (1 - Math.pow(37/38, evalWindow)));
    
    return {
      window: evalWindow,
      observedUnique: unique.size,
      expectedUnique: expectedUnique,
      isAnomalous: unique.size > expectedUnique * 1.1 || unique.size < expectedUnique * 0.9
    };
  }

  // --- Auxiliares ---

  _calcularDistancias(giros, nums) {
    let idxs = [];
    const targetSet = new Set(nums.map(n => n.toString()));
    giros.forEach((g, i) => { 
      if (targetSet.has(g.toString())) idxs.push(i); 
    });
    let res = [];
    for (let i = 1; i < idxs.length; i++) res.push(idxs[i] - idxs[i - 1]);
    return res;
  }

  _calcularAtraso(giros, nums) {
    const targetSet = new Set(nums.map(n => n.toString()));
    const idx = giros.map(g => targetSet.has(g.toString())).lastIndexOf(true);
    return idx === -1 ? giros.length : giros.length - 1 - idx;
  }

  _getWinWinLevel(dists) {
    // Si los últimos n tiros han salido con distancia <= 5
    for (let n = Math.min(dists.length, 10); n >= 2; n--) {
      if (dists.slice(-n).every(d => d <= 5)) {
        return n >= 3 ? `WIN-WIN(${n - 2})` : `WIN`;
      }
    }
    return null;
  }

  _getLastDistances(giros, nums) {
    let lastIdx = -1;
    const distances = [];
    const targetSet = new Set(nums.map(n => n.toString()));

    giros.forEach((g, idx) => {
      if (targetSet.has(g.toString())) {
        if (lastIdx !== -1) {
          distances.push(idx - lastIdx);
        }
        lastIdx = idx;
      }
    });
    // Retornamos invertido para tener las más recientes primero
    return distances.reverse();
  }

  /**
   * Retorna los detalles de CHI² y anomalías para cada número.
   * Requerido por el motor ORION (LogicEngine).
   */
  getCHIDetails() {
    const totalSpins = this.tracker.getSpins().length;
    if (totalSpins < 37) return null;

    const expected = totalSpins / 38;
    const nums = [];
    const ROULETTE_NUMS = [
      "00","0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18",
      "19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36"
    ];

    ROULETTE_NUMS.forEach(n => {
      const freq = this.tracker._freq[n] || 0;
      const chi = Math.pow(freq - expected, 2) / expected;
      
      // Wilson CI simplificado (Anomalía si frecuencia > expected + 2*sigma)
      const sigma = Math.sqrt(totalSpins * (1/38) * (37/38));
      const isAnomalous = freq > (expected + 1.96 * sigma);

      nums.push({ num: n, chi: chi, isAnomalous: isAnomalous });
    });

    return { total: totalSpins, nums: nums };
  }
}
