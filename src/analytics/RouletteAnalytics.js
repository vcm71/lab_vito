/**
 * RouletteAnalytics — Motor de análisis estadístico para ruleta americana.
 * 
 * Clase pura: NO depende del Legacy ni del Domain Tracker.
 * Recibe datos a analizar: (spins, settings).
 * Todos los algoritmos son idénticos a la Legacy RouletteTracker (Fase5.5.3).
 *
 * Uso en main.js:
 *   const analytics = new RouletteAnalytics(domainTracker.getSpins(), domainTracker.getSettings());
 *   analytics.runsTest('color');
 *   analytics.getWindowStats(100);
 *   // etc.
 *
 * Para refrescar tras cambios:
 *   analytics.refresh(domainTracker.getSpins(), domainTracker.getSettings());
 */

import { AMERICAN_WHEEL_ORDER, ROULETTE_NUMBERS, RED_NUMBERS, NUM_META } from '../utils/numberMeta.js';
import { getColor, getParity, getHighLow, getDozen, getColumn, getWheelDistance } from '../utils/numberMeta.js';

export class RouletteAnalytics {
  /**
   * @param {Array} spins - Array de objetos {number: string} (o Spin)
   * @param {Object} settings - Configuración (getSettings() del Domain Tracker)
   */
  constructor(spins = [], settings = {}) {
    this.spins = spins;
    this.settings = settings;
    this._freq = this._buildFreq();
    this._chiDirty = true;
    this._chiValue = 0;
    this._delaysDirty = true;
  }

  /**
   * Refrescar datos internos. Útil cuando se modifican spins o settings.
   */
  refresh(spins, settings) {
    this.spins = spins;
    this.settings = settings;
    this._freq = this._buildFreq();
    this._chiDirty = true;
    this._chiValue = 0;
    this._delaysDirty = true;
  }

  /** Reconstruir frecuencias desde los spins */
  _buildFreq() {
    const freq = {};
    ROULETTE_NUMBERS.forEach(n => { freq[n] = 0; });
    this.spins.forEach(s => { freq[s.number]++; });
    return freq;
  }

  /** Chi-cuadrado perezoso (solo recalcula si dirty) */
  _getChi() {
    if (this._chiDirty) {
      const n = this.spins.length;
      const exp = n / 38;
      let chi = 0;
      for (const cnt of Object.values(this._freq)) chi += ((cnt - exp) ** 2) / exp;
      this._chiValue = chi;
      this._chiDirty = false;
    }
    return this._chiValue;
  }

  /** Wilson CI helper */
  _wilsonCI(count, total, z = 1.96) {
    if (total === 0) return { pct: 0, lower: 0, upper: 0 };
    const p   = count / total;
    const z2  = z * z;
    const den = 1 + z2 / total;
    const ctr = (p + z2 / (2 * total)) / den;
    const mg  = (z / den) * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total));
    return {
      pct:   +(p * 100).toFixed(1),
      lower: +Math.max(0, (ctr - mg) * 100).toFixed(1),
      upper: +Math.min(100, (ctr + mg) * 100).toFixed(1),
    };
  }

  /** Calcular estadísticas básicas desde frecuencias */
  _calcStats() {
    const total = this.spins.length;
    const counts = { red:0, black:0, green:0, even:0, odd:0, low:0, high:0, d1:0, d2:0, d3:0, c1:0, c2:0, c3:0 };
    for (const [num, cnt] of Object.entries(this._freq)) {
      const m = NUM_META[num];
      if (m.color === 'red')        counts.red   += cnt;
      else if (m.color === 'black') counts.black += cnt;
      else if (m.color === 'green') counts.green += cnt;
      if (m.parity === 'even')      counts.even  += cnt;
      else if (m.parity === 'odd')  counts.odd   += cnt;
      if (m.hl === 'low')           counts.low   += cnt;
      else if (m.hl === 'high')     counts.high  += cnt;
      if (m.dozen === 1)            counts.d1    += cnt;
      else if (m.dozen === 2)       counts.d2    += cnt;
      else if (m.dozen === 3)       counts.d3    += cnt;
      if (m.column === 1)           counts.c1    += cnt;
      else if (m.column === 2)      counts.c2    += cnt;
      else if (m.column === 3)      counts.c3    += cnt;
    }

    const pct = (v) => total > 0 ? +((v / total) * 100).toFixed(1) : 0;

    return {
      total,
      colorsPct:   { red: pct(counts.red), black: pct(counts.black), green: pct(counts.green) },
      parityPct:   { even: pct(counts.even), odd: pct(counts.odd) },
      highLowPct:  { low: pct(counts.low), high: pct(counts.high) },
      dozensPct:   { d1: pct(counts.d1), d2: pct(counts.d2), d3: pct(counts.d3) },
      columnsPct:  { c1: pct(counts.c1), c2: pct(counts.c2), c3: pct(counts.c3) },
    };
  }

  // ─── API pública (idéntica a Legacy RouletteTracker) ───────────────────────

  getSpins() { return this.spins; }

  getStats() { return this._calcStats(); }

  getProbabilities() {
    const stats = this._calcStats();
    const T_COLOR = 47.4, T_GREEN = 5.3, T_DOZEN = 31.6;
    return {
      colors: [
        { label: 'Rojo',  actual: +stats.colorsPct.red,   theoretical: T_COLOR },
        { label: 'Negro', actual: +stats.colorsPct.black, theoretical: T_COLOR },
        { label: 'Verde', actual: +stats.colorsPct.green, theoretical: T_GREEN },
      ],
      parity: [
        { label: 'Par',   actual: +stats.parityPct.even, theoretical: T_COLOR },
        { label: 'Impar', actual: +stats.parityPct.odd,  theoretical: T_COLOR },
      ],
      dozens: [
        { label: 'Docena 1', actual: +stats.dozensPct.d1, theoretical: T_DOZEN },
        { label: 'Docena 2', actual: +stats.dozensPct.d2, theoretical: T_DOZEN },
        { label: 'Docena 3', actual: +stats.dozensPct.d3, theoretical: T_DOZEN },
      ],
    };
  }

  getAlerts() {
    const customAbsences = {}, customFlags = {};
    (this.settings.customSeries || []).forEach(s => {
      if (s.active) { customAbsences[s.id] = 0; customFlags[s.id] = false; }
    });

    const abs = {
      red:0, black:0, green:0, even:0, odd:0,
      low:0, high:0, d1:0, d2:0, d3:0, c1:0, c2:0, c3:0
    };
    const flags = { ...abs };

    for (const spin of [...this.spins].reverse()) {
      const m = NUM_META[spin.number];
      if (!m) continue;
      const { color, parity, hl, dozen, column } = m;

      if (color) {
        if (!flags[color]) flags[color] = true;
        if (!flags.red   && color !== 'red')   abs.red++;
        if (!flags.black && color !== 'black') abs.black++;
        if (!flags.green && color !== 'green') abs.green++;
      }
      if (parity) {
        if (!flags[parity]) flags[parity] = true;
        if (!flags.even && parity !== 'even') abs.even++;
        if (!flags.odd  && parity !== 'odd')  abs.odd++;
      }
      if (hl) {
        if (!flags[hl]) flags[hl] = true;
        if (!flags.low  && hl !== 'low')  abs.low++;
        if (!flags.high && hl !== 'high') abs.high++;
      }
      if (dozen) {
        const dk = 'd' + dozen;
        if (!flags[dk]) flags[dk] = true;
        if (!flags.d1 && dozen !== 1) abs.d1++;
        if (!flags.d2 && dozen !== 2) abs.d2++;
        if (!flags.d3 && dozen !== 3) abs.d3++;
      }
      if (column) {
        const ck = 'c' + column;
        if (!flags[ck]) flags[ck] = true;
        if (!flags.c1 && column !== 1) abs.c1++;
        if (!flags.c2 && column !== 2) abs.c2++;
        if (!flags.c3 && column !== 3) abs.c3++;
      }
      (this.settings.customSeries || []).forEach(s => {
        if (!s.active) return;
        const hit = s.numbers.includes(spin.number);
        if (hit && !customFlags[s.id]) { customFlags[s.id] = true; }
        if (!customFlags[s.id] && !hit) customAbsences[s.id]++;
      });
    }

    const alerts = [];
    const { colorAlert: cA, parityAlert: pA, highLowAlert: hA, dozenAlert: dA, columnAlert: colA, seriesAlert: sA } = this.settings;

    if (abs.red   >= cA) alerts.push({ type:'color',  msg:`El Rojo no ha salido en ${abs.red} tiradas.`,           level:'high' });
    if (abs.black >= cA) alerts.push({ type:'color',  msg:`El Negro no ha salido en ${abs.black} tiradas.`,         level:'high' });
    if (abs.even  >= pA) alerts.push({ type:'parity', msg:`Los Pares no han salido en ${abs.even} tiradas.`,        level:'medium' });
    if (abs.odd   >= pA) alerts.push({ type:'parity', msg:`Los Impares no han salido en ${abs.odd} tiradas.`,       level:'medium' });
    if (abs.low   >= hA) alerts.push({ type:'highlow',msg:`Los Menores (1-18) no han salido en ${abs.low} tiradas.`,level:'medium' });
    if (abs.high  >= hA) alerts.push({ type:'highlow',msg:`Los Mayores (19-36) no han salido en ${abs.high} tiradas.`,level:'medium' });
    [1,2,3].forEach(n => {
      if (abs['d'+n] >= dA)   alerts.push({ type:'dozen',  msg:`La Docena ${n} no ha salido en ${abs['d'+n]} tiradas.`,   level:'high' });
      if (abs['c'+n] >= colA) alerts.push({ type:'column', msg:`La Columna ${n} no ha salido en ${abs['c'+n]} tiradas.`,  level:'high' });
    });
    (this.settings.customSeries || []).forEach(s => {
      if (s.active && customAbsences[s.id] >= sA) {
        alerts.push({ type:'series', msg:`La serie "${s.name}" no ha salido en ${customAbsences[s.id]} tiradas.`, level:'high' });
      }
    });

    return alerts;
  }

  getStrategy() {
    return this.getAlerts()
      .filter(a => ['color','parity','dozen','column'].includes(a.type))
      .map(a => `Apostar a ${a.msg.split(' no ')[0]} (probabilidad de retorno inminente).`);
  }

  getAdvancedStats() {
    const totalSpins  = this.spins.length;
    const chiSquare   = this._getChi();

    let chiDiagnosis = 'Mesa muy joven para diagnosticar';
    if (totalSpins >= 38) {
      if (chiSquare > 52)      chiDiagnosis = 'Rueda posiblemente sesgada (Anormal)';
      else if (chiSquare > 40) chiDiagnosis = 'Ligero sesgo temporal';
      else                     chiDiagnosis = 'Distribución Normal (Aleatoria)';
    }

    let hotZone = { center: '-', sum: 0, members: [] };
    if (totalSpins > 0) {
      let maxSum = -1, bestCenter = null, bestMembers = [];
      for (let i = 0; i < AMERICAN_WHEEL_ORDER.length; i++) {
        let sum = 0;
        const members = [];
        for (let j = -2; j <= 2; j++) {
          const idx = (i + j + AMERICAN_WHEEL_ORDER.length) % AMERICAN_WHEEL_ORDER.length;
          const num = AMERICAN_WHEEL_ORDER[idx];
          sum += this._freq[num];
          members.push(num);
        }
        if (sum > maxSum) { maxSum = sum; bestCenter = AMERICAN_WHEEL_ORDER[i]; bestMembers = members; }
      }
      hotZone = { center: bestCenter, sum: maxSum, members: bestMembers };
    }

    let lastRedIdx = -1, lastBlackIdx = -1;
    const redDist = [], blackDist = [];
    this.spins.forEach((s, i) => {
      const c = NUM_META[s.number]?.color;
      if (c === 'red')   { if (lastRedIdx   !== -1) redDist.push(i - lastRedIdx);     lastRedIdx   = i; }
      if (c === 'black') { if (lastBlackIdx !== -1) blackDist.push(i - lastBlackIdx); lastBlackIdx = i; }
    });
    const mean = a => a.length > 0 ? (a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) : '-';

    return {
      chiSquare: chiSquare.toFixed(2),
      chiDiagnosis,
      hotZone,
      meanDelays: { red: mean(redDist), black: mean(blackDist) },
    };
  }

  runsTest(category = 'color') {
    const seq = [];
    for (const s of this.spins) {
      const m = NUM_META[s.number];
      let val = null;
      if (category === 'color') {
        if (m.color === 'red')   val = 1;
        else if (m.color === 'black') val = 0;
      } else if (category === 'parity') {
        if (m.parity === 'even') val = 1;
        else if (m.parity === 'odd') val = 0;
      } else if (category === 'highlow') {
        if (m.hl === 'high') val = 1;
        else if (m.hl === 'low') val = 0;
      }
      if (val !== null) seq.push(val);
    }

    const n = seq.length;
    if (n < 20) return { z: null, interpretation: 'Mínimo 20 tiradas no-cero', runs: 0, n };

    const n1 = seq.reduce((a, v) => a + v, 0);
    const n2 = n - n1;
    if (n1 === 0 || n2 === 0) return { z: null, interpretation: 'Sin variedad', runs: 0, n };

    let runs = 1;
    for (let i = 1; i < n; i++) if (seq[i] !== seq[i - 1]) runs++;

    const muR    = (2 * n1 * n2) / n + 1;
    const sigmaR = Math.sqrt(
      (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1))
    );

    const z = (runs - muR) / sigmaR;

    let interpretation;
    if      (Math.abs(z) < 1.645) interpretation = 'Aleatoria';
    else if (z < -1.96)            interpretation = 'Rachas largas (clustering)';
    else if (z > 1.96)             interpretation = 'Alternancia excesiva';
    else if (z < -1.645)           interpretation = 'Leve clustering';
    else                           interpretation = 'Leve alternancia';

    return { runs, n1, n2, muR: +muR.toFixed(2), sigmaR: +sigmaR.toFixed(2), z: +z.toFixed(3), interpretation, n };
  }

  getConfidenceIntervals() {
    const total = this.spins.length;
    if (total === 0) return null;

    const s = this.settings;

    const getZ = (c) => {
      const p = 1 - (1 - c / 100) / 2;
      const t = Math.sqrt(-2 * Math.log(1 - p));
      const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
      const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
      return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
    };

    const zColors  = getZ(s.confidenceColors  || 95);
    const zParity  = getZ(s.confidenceParity  || 95);
    const zRange   = getZ(s.confidenceRange   || 95);
    const zDozens  = getZ(s.confidenceDozens  || 95);
    const zColumns = getZ(s.confidenceColumns || 95);

    const counts = { red:0, black:0, even:0, odd:0, low:0, high:0, d1:0, d2:0, d3:0, c1:0, c2:0, c3:0 };
    for (const [num, cnt] of Object.entries(this._freq)) {
      const m = NUM_META[num];
      if (m.color === 'red')        counts.red   += cnt;
      else if (m.color === 'black') counts.black += cnt;
      if (m.parity === 'even')      counts.even  += cnt;
      else if (m.parity === 'odd')  counts.odd   += cnt;
      if (m.hl === 'low')           counts.low   += cnt;
      else if (m.hl === 'high')     counts.high  += cnt;
      if (m.dozen === 1)            counts.d1    += cnt;
      else if (m.dozen === 2)       counts.d2    += cnt;
      else if (m.dozen === 3)       counts.d3    += cnt;
      if (m.column === 1)           counts.c1    += cnt;
      else if (m.column === 2)      counts.c2    += cnt;
      else if (m.column === 3)      counts.c3    += cnt;
    }

    const T_COLOR = 47.4, T_DOZEN = 31.6;

    return {
      total,
      groups: {
        colors:  { label: 'Colores',  conf: s.confidenceColors  || 95, z: zColors,  items: { red: counts.red, black: counts.black }, theo: T_COLOR },
        parity:  { label: 'Paridad',  conf: s.confidenceParity  || 95, z: zParity,  items: { even: counts.even, odd: counts.odd }, theo: T_COLOR },
        range:   { label: 'Rango',    conf: s.confidenceRange   || 95, z: zRange,   items: { low: counts.low, high: counts.high }, theo: T_COLOR },
        dozens:  { label: 'Docenas',  conf: s.confidenceDozens  || 95, z: zDozens,  items: { d1: counts.d1, d2: counts.d2, d3: counts.d3 }, theo: T_DOZEN },
        columns: { label: 'Columnas', conf: s.confidenceColumns || 95, z: zColumns, items: { c1: counts.c1, c2: counts.c2, c3: counts.c3 }, theo: T_DOZEN },
      }
    };
  }

  getWindowStats(windowSize = 50) {
    const recent = this.spins.slice(-windowSize);
    const n = recent.length;
    if (n === 0) return null;

    const freqW = {};
    ROULETTE_NUMBERS.forEach(num => { freqW[num] = 0; });
    recent.forEach(s => { freqW[s.number]++; });

    const exp = n / 38;
    let chiW = 0;
    for (const cnt of Object.values(freqW)) chiW += (cnt - exp) ** 2 / exp;

    let chiDiag = 'Ventana pequeña';
    if (n >= 38) {
      if (chiW > 52)      chiDiag = 'Sesgo en ventana (Anormal)';
      else if (chiW > 40) chiDiag = 'Ligero sesgo local';
      else                chiDiag = 'Distribución Normal';
    }

    let maxSum = -1, bestCenter = '-', bestMembers = [];
    for (let i = 0; i < AMERICAN_WHEEL_ORDER.length; i++) {
      let sum = 0;
      const members = [];
      for (let j = -2; j <= 2; j++) {
        const idx = (i + j + AMERICAN_WHEEL_ORDER.length) % AMERICAN_WHEEL_ORDER.length;
        const num = AMERICAN_WHEEL_ORDER[idx];
        sum += freqW[num];
        members.push(num);
      }
      if (sum > maxSum) { maxSum = sum; bestCenter = AMERICAN_WHEEL_ORDER[i]; bestMembers = members; }
    }

    const top5 = Object.entries(freqW)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([num, cnt]) => ({ num, cnt, pct: +((cnt / n) * 100).toFixed(1) }));

    return {
      windowSize,
      actual: n,
      chiSquare: +chiW.toFixed(2),
      chiDiagnosis: chiDiag,
      hotZone: { center: bestCenter, sum: maxSum, members: bestMembers },
      top5,
    };
  }

  getDistanceHistogram() {
    const counts   = new Array(20).fill(0);
    const nPairs   = this.spins.length - 1;

    for (let i = 1; i < this.spins.length; i++) {
      const d = getWheelDistance(this.spins[i - 1].number, this.spins[i].number);
      if (d !== null) counts[d]++;
    }

    const expected = counts.map((_, d) => {
      const mult = (d === 0 || d === 19) ? 1 : 2;
      return +(nPairs * mult / 38).toFixed(2);
    });

    const shortJumps    = counts.slice(1, 6).reduce((a, b) => a + b, 0);
    const expShortJumps = expected.slice(1, 6).reduce((a, b) => a + b, 0);
    const dealerIndex   = expShortJumps > 0
      ? +((shortJumps / expShortJumps - 1) * 100).toFixed(1)
      : 0;

    return {
      counts,
      expected,
      labels: counts.map((_, i) => `±${i}`),
      total: nPairs,
      dealerIndex,
      dealerInterpretation: dealerIndex > 20  ? 'Posible Dealer Signature' :
                             dealerIndex > 10  ? 'Leve tendencia corta'     :
                             dealerIndex < -10 ? 'Tiradas largas frecuentes' : 'Normal',
    };
  }

  getSeriesTrendData() {
    if (!this.settings.customSeries) return [];

    return this.settings.customSeries.filter(s => s.active).map(series => {
      const hitIndices = [];
      this.spins.forEach((spin, index) => {
        if (series.numbers.includes(spin.number)) {
          hitIndices.push(index + 1);
        }
      });

      const daSequence = [];
      for (let i = 1; i < hitIndices.length; i++) {
        daSequence.push({
          hitNumber: i,
          spinId: hitIndices[i],
          da: hitIndices[i] - hitIndices[i - 1]
        });
      }

      return {
        name: series.name,
        numbers: series.numbers,
        history: daSequence
      };
    });
  }
}
