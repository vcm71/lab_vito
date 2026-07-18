import { rouletteSpinsStore } from './rouletteSpinsStore.js';
import { rouletteSettingsStore } from './rouletteSettingsStore.js';

/**
 * Roulette Tracker Logic — v2
 * Mejoras: cache incremental O(1), Runs Test, Wilson CI,
 *          ventana deslizante, histograma de distancias.
 */

export const ROULETTE_NUMBERS = [
  "00", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
  "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"
];

export const RED_NUMBERS   = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];
export const BLACK_NUMBERS = ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"];

export const AMERICAN_WHEEL_ORDER = [
  "00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2",
  "0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1"
];

// Propiedades estáticas pre-computadas para eliminar O(n) en getStats()
const NUM_META = (() => {
  const m = {};
  ROULETTE_NUMBERS.forEach(n => {
    const isZero = n === '0' || n === '00';
    const v = isZero ? 0 : parseInt(n, 10);
    m[n] = {
      color:  RED_NUMBERS.includes(n) ? 'red' : BLACK_NUMBERS.includes(n) ? 'black' : 'green',
      parity: isZero ? null : v % 2 === 0 ? 'even' : 'odd',
      hl:     isZero ? null : v <= 18 ? 'low' : 'high',
      dozen:  isZero ? null : v <= 12 ? 1 : v <= 24 ? 2 : 3,
      column: isZero ? null : v % 3 === 1 ? 1 : v % 3 === 2 ? 2 : 3,
    };
  });
  return m;
})();

export class RouletteTracker {
  constructor() {
    this.settings  = this._loadSettings();
    this.spins     = this._loadSpins();
    this._spinRevision = 0;
    this._settingsRevision = 0;
    this._settingsPersistQueue = Promise.resolve();
    this._persistQueue = Promise.resolve();
    this.ready = Promise.all([
      this._hydratePersistedSpins(),
      this._hydratePersistedSettings(),
    ]);

    // --- Cache incremental ---
    this._freq     = this._buildFreq();   // { num → count }, O(38) en getStats/Chi
    this._chiDirty = true;
    this._chiValue = 0;

    // --- Cache de Atrasos (Performance v2) ---
    this._delaysDirty = true;
    this._cachedDelays = {
      numbers: {},
      maxNumbers: {},
      dozens: {},
      maxDozens: {},
      columns: {},
      maxColumns: {}
    };
  }

  // ─── Privados de sesión ───────────────────────────────────────────────────

  // ─── Privados de sesión (Deprecados) ──────────────────────────────────────

  _loadSettings() {
    return rouletteSettingsStore.getSnapshot();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._settingsRevision += 1;
    const snapshot = JSON.parse(JSON.stringify(this.settings));
    this._settingsPersistQueue = this._settingsPersistQueue
      .then(() => rouletteSettingsStore.setSettings(snapshot))
      .catch(() => rouletteSettingsStore.setSettings(snapshot))
      .catch((e) => {
        console.warn('No se pudieron persistir los ajustes en IndexedDB:', e);
      });
    return this._settingsPersistQueue;
  }

  _loadSpins() {
    return rouletteSpinsStore.getSnapshot();
  }

  _saveSpins() {
    const snapshot = this.spins.map(spin => ({ ...spin }));
    this._persistQueue = this._persistQueue
      .then(() => rouletteSpinsStore.setSpins(snapshot))
      .catch(() => rouletteSpinsStore.setSpins(snapshot))
      .catch((e) => {
        console.warn('No se pudieron persistir las tiradas en IndexedDB:', e);
      });
    return this._persistQueue;
  }

  async _hydratePersistedSpins() {
    try {
      const revisionAtStart = this._spinRevision;
      const persisted = await rouletteSpinsStore.load();
      if (this._spinRevision !== revisionAtStart) return;
      if (!this._sameSpins(this.spins, persisted)) {
        this.spins = persisted;
        this._freq = this._buildFreq();
        this._chiDirty = true;
        this._chiValue = 0;
        this._delaysDirty = true;
      }
    } catch (e) {
      console.warn('No se pudieron hidratar las tiradas desde IndexedDB:', e);
    }
  }

  async _hydratePersistedSettings() {
    try {
      const revisionAtStart = this._settingsRevision;
      const { settings: persisted } = await rouletteSettingsStore.load();
      if (this._settingsRevision !== revisionAtStart) return;
      if (persisted && !this._sameSettings(this.settings, persisted)) {
        this.settings = persisted;
      }
    } catch (e) {
      console.warn('No se pudieron hidratar los ajustes desde IndexedDB:', e);
    }
  }

  _sameSpins(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      const left = a[i] || {};
      const right = b[i] || {};
      if (left.number !== right.number) return false;
      if (String(left.timestamp || '') !== String(right.timestamp || '')) return false;
      if ((left.dealer || '') !== (right.dealer || '')) return false;
      if ((left.casino || '') !== (right.casino || '')) return false;
      if ((left.table || '') !== (right.table || '')) return false;
    }

    return true;
  }

  _sameSettings(a, b) {
    try {
      return JSON.stringify(a || {}) === JSON.stringify(b || {});
    } catch {
      return false;
    }
  }

  // ─── Cache de frecuencias ─────────────────────────────────────────────────

  _buildFreq() {
    const freq = {};
    ROULETTE_NUMBERS.forEach(n => { freq[n] = 0; });
    this.spins.forEach(s => { freq[s.number]++; });
    return freq;
  }

  /** Chi² diferido: solo recomputa cuando el cache está sucio. O(38). */
  _getChi() {
    if (!this._chiDirty) return this._chiValue;
    const total = this.spins.length;
    if (total === 0) { this._chiValue = 0; this._chiDirty = false; return 0; }
    const expected = total / 38;
    let chi = 0;
    for (const count of Object.values(this._freq)) {
      chi += (count - expected) ** 2 / expected;
    }
    this._chiValue = chi;
    this._chiDirty = false;
    return chi;
  }

  // ─── CRUD de spins ────────────────────────────────────────────────────────

  addSpin(numberStr) {
    if (!ROULETTE_NUMBERS.includes(numberStr)) return null;
    const spin = { 
      id: this.spins.length + 1, 
      number: numberStr, 
      timestamp: new Date().toISOString(),
      casino: this.settings.casinoName,
      dealer: this.settings.crupierName,
      table: this.settings.tableName
    };
    this.spins.push(spin);
    this._spinRevision += 1;
    this._freq[numberStr]++;
    this._chiDirty = true;
    this._delaysDirty = true;
    this._saveSpins();
    return spin;
  }

  getSpins() { return this.spins; }

  deleteSpin(spinId) {
    const idx = this.spins.findIndex(s => s.id === spinId);
    if (idx === -1) return false;
    const num = this.spins[idx].number;
    this.spins.splice(idx, 1);
    this.spins.forEach((s, i) => { s.id = i + 1; });
    this._spinRevision += 1;
    this._freq[num] = Math.max(0, (this._freq[num] || 0) - 1);
    this._chiDirty = true;
    this._delaysDirty = true;
    this._saveSpins();
    return true;
  }

  updateSpin(spinId, newNumber) {
    if (!ROULETTE_NUMBERS.includes(newNumber)) return false;
    const spin = this.spins.find(s => s.id === spinId);
    if (!spin) return false;
    this._freq[spin.number] = Math.max(0, (this._freq[spin.number] || 0) - 1);
    this._freq[newNumber]   = (this._freq[newNumber] || 0) + 1;
    spin.number = newNumber;
    this._spinRevision += 1;
    this._chiDirty = true;
    this._delaysDirty = true;
    this._saveSpins();
    return true;
  }

  clearSession() {
    this.spins = [];
    this._spinRevision += 1;
    this._saveSpins();
    ROULETTE_NUMBERS.forEach(n => { this._freq[n] = 0; });
    this._chiDirty = true;
    this._chiValue = 0;
    this._delaysDirty = true;
  }

  importSpins(numbersArray) {
    const report = { total: numbersArray.length, valid: 0, discarded: 0, details: [] };
    const discardedSet = new Set();
    this.spins = [];
    
    const now = Date.now();
    numbersArray.forEach((val, i) => {
      let cleanNum = val.toString().trim().split('.')[0].split(',')[0];
      
      // Regla especial: 90 es 00
      if (cleanNum === "90") cleanNum = "00";
      
      if (ROULETTE_NUMBERS.includes(cleanNum)) {
        this.spins.push({ id: this.spins.length + 1, number: cleanNum, timestamp: new Date(now + i * 1000).toISOString() });
        report.valid++;
      } else {
        report.discarded++;
        discardedSet.add(val);
      }
    });

    report.details = Array.from(discardedSet).slice(0, 10);
    this._freq = this._buildFreq();
    this._spinRevision += 1;
    this._chiDirty = true;
    this._delaysDirty = true;
    
    this._saveSpins();
    return report;
  }

  // ─── Utilidades estáticas ─────────────────────────────────────────────────

  static getColor(numberStr)  { return NUM_META[numberStr]?.color  ?? 'unknown'; }
  static getParity(numberStr) { return NUM_META[numberStr]?.parity ?? null; }
  static getHalf(numberStr)   { return NUM_META[numberStr]?.hl     ?? null; }
  static getDozen(numberStr)  { return NUM_META[numberStr]?.dozen  ?? null; }
  static getColumn(numberStr) { return NUM_META[numberStr]?.column ?? null; }
  static getHighLow(numberStr){ return NUM_META[numberStr]?.hl     ?? null; }

  static getWheelDistance(num1, num2) {
    const i1 = AMERICAN_WHEEL_ORDER.indexOf(String(num1));
    const i2 = AMERICAN_WHEEL_ORDER.indexOf(String(num2));
    if (i1 === -1 || i2 === -1) return null;
    const d = Math.abs(i1 - i2);
    return Math.min(d, 38 - d);
  }

  // ─── Stats básicos — O(38) gracias al cache ───────────────────────────────

  getStats() {
    const total = this.spins.length;
    let redC = 0, blackC = 0, greenC = 0;
    let evenC = 0, oddC = 0, lowC = 0, highC = 0;
    let d1C = 0, d2C = 0, d3C = 0;
    let c1C = 0, c2C = 0, c3C = 0;

    for (const [num, count] of Object.entries(this._freq)) {
      const m = NUM_META[num];
      if (m.color === 'red')        redC   += count;
      else if (m.color === 'black') blackC += count;
      else                          greenC += count;

      if (m.parity === 'even')      evenC += count;
      else if (m.parity === 'odd')  oddC  += count;

      if (m.hl === 'low')           lowC  += count;
      else if (m.hl === 'high')     highC += count;

      if (m.dozen === 1)            d1C   += count;
      else if (m.dozen === 2)       d2C   += count;
      else if (m.dozen === 3)       d3C   += count;

      if (m.column === 1)           c1C   += count;
      else if (m.column === 2)      c2C   += count;
      else if (m.column === 3)      c3C   += count;
    }

    const pct = c => total ? ((c / total) * 100).toFixed(0) : '0';

    return {
      total,
      colorsPct:  { red: pct(redC),  black: pct(blackC), green: pct(greenC) },
      parityPct:  { even: pct(evenC), odd: pct(oddC) },
      highLowPct: { low: pct(lowC),   high: pct(highC) },
      dozensPct:  { d1: pct(d1C),     d2: pct(d2C),      d3: pct(d3C) },
      columnsPct: { c1: pct(c1C),     c2: pct(c2C),      c3: pct(c3C) },
    };
  }

  // ─── Métodos de Atraso (Delay) — Optimizados con Cache ──────────────────────
  
  _recomputeDelays() {
    if (!this._delaysDirty) return;
    
    const spins = this.spins;
    const numMeta = NUM_META;
    
    // Reset caches
    const nAtr = {}, nMax = {}, dAtr = {}, dMax = {}, cAtr = {}, cMax = {};
    ROULETTE_NUMBERS.forEach(n => { nAtr[n] = 0; nMax[n] = 0; });
    [1, 2, 3].forEach(i => { dAtr[i] = 0; dMax[i] = 0; cAtr[i] = 0; cMax[i] = 0; });

    // Contadores temporales para el recorrido lineal
    const curN = {}, curD = {}, curC = {};
    ROULETTE_NUMBERS.forEach(n => curN[n] = 0);
    [1, 2, 3].forEach(i => { curD[i] = 0; curC[i] = 0; });

    // Un solo recorrido O(N) para calcular TODO
    for (const s of spins) {
      const num = s.number;
      const meta = numMeta[num];

      // Números
      ROULETTE_NUMBERS.forEach(n => {
        if (n === num) {
          nMax[n] = Math.max(nMax[n], curN[n]);
          curN[n] = 0;
        } else {
          curN[n]++;
        }
      });

      // Docenas
      [1, 2, 3].forEach(d => {
        if (meta.dozen === d) {
          dMax[d] = Math.max(dMax[d], curD[d]);
          curD[d] = 0;
        } else {
          curD[d]++;
        }
      });

      // Columnas
      [1, 2, 3].forEach(c => {
        if (meta.column === c) {
          cMax[c] = Math.max(cMax[c], curC[c]);
          curC[c] = 0;
        } else {
          curC[c]++;
        }
      });
    }

    // Atraso actual
    ROULETTE_NUMBERS.forEach(n => {
      nAtr[n] = curN[n];
      nMax[n] = Math.max(nMax[n], curN[n]);
    });
    [1, 2, 3].forEach(i => {
      dAtr[i] = curD[i];
      dMax[i] = Math.max(dMax[i], curD[i]);
      cAtr[i] = curC[i];
      cMax[i] = Math.max(cMax[i], curC[i]);
    });

    this._cachedDelays = {
      numbers: nAtr, maxNumbers: nMax,
      dozens: dAtr, maxDozens: dMax,
      columns: cAtr, maxColumns: cMax
    };
    this._delaysDirty = false;
  }

  getDozenDelay(dozen) {
    this._recomputeDelays();
    return this._cachedDelays.dozens[dozen] || 0;
  }

  getDozenMaxDelay(dozen) {
    this._recomputeDelays();
    return this._cachedDelays.maxDozens[dozen] || 0;
  }

  getColumnDelay(column) {
    this._recomputeDelays();
    return this._cachedDelays.columns[column] || 0;
  }

  getColumnMaxDelay(column) {
    this._recomputeDelays();
    return this._cachedDelays.maxColumns[column] || 0;
  }

  getNumberDelay(numStr) {
    this._recomputeDelays();
    return this._cachedDelays.numbers[numStr] || 0;
  }

  getNumberMaxDelay(numStr) {
    if (!this.spins || this.spins.length === 0) return 0;
    let maxDelay = 0;
    let currentDelay = 0;
    for (const s of this.spins) {
      if (s.number === numStr) {
        if (currentDelay > maxDelay) maxDelay = currentDelay;
        currentDelay = 0;
      } else {
        currentDelay++;
      }
    }
    const lastDelay = this.getNumberDelay(numStr);
    return Math.max(maxDelay, lastDelay);
  }

  // ─── Probabilidades (API pública sin cambios) ─────────────────────────────

  getProbabilities() {
    const stats = this.getStats();
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

  // ─── Alertas (sin cambios en lógica) ─────────────────────────────────────

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
      const { color, parity, hl, dozen, column } = NUM_META[spin.number] || {};

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

  // ─── Stats avanzados — usa cache en lugar de O(n) ─────────────────────────

  getAdvancedStats() {
    const totalSpins  = this.spins.length;
    const chiSquare   = this._getChi();   // O(38) lazy

    let chiDiagnosis = 'Mesa muy joven para diagnosticar';
    if (totalSpins >= 38) {
      if (chiSquare > 52)      chiDiagnosis = 'Rueda posiblemente sesgada (Anormal)';
      else if (chiSquare > 40) chiDiagnosis = 'Ligero sesgo temporal';
      else                     chiDiagnosis = 'Distribución Normal (Aleatoria)';
    }

    // Hot zone — O(38×5) usando _freq, nunca O(n)
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

    // Medias de atraso (aún O(n) pero sólo itera una vez)
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

  // ─── NUEVO: Runs Test — O(n_secuencia) ───────────────────────────────────

  /**
   * Wald-Wolfowitz Runs Test para detectar clustering o alternancia excesiva.
   * @param {'color'|'parity'|'highlow'} category
   * @returns {{ runs, n1, n2, muR, sigmaR, z, interpretation, n }}
   */
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

  // ─── NUEVO: Wilson CI — O(38) ─────────────────────────────────────────────

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

  /**
   * Intervalos de confianza Wilson para todas las categorías.
   * El nivel de confianza es paramétrico (10% - 99%).
   */
  getConfidenceIntervals() {
    const total = this.spins.length;
    if (total === 0) return null;

    const s = this.settings;
    
    // Aproximación de Z-score para el nivel de confianza (Abramowitz & Stegun)
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


  // ─── NUEVO: Ventana Deslizante — O(W + 38×5) ─────────────────────────────

  /**
   * Estadísticas sobre las últimas `windowSize` tiradas.
   * Permite detectar cambios de comportamiento recientes sin reanalizar toda la sesión.
   */
  getWindowStats(windowSize = 50) {
    const recent = this.spins.slice(-windowSize);
    const n = recent.length;
    if (n === 0) return null;

    // Frecuencias de ventana
    const freqW = {};
    ROULETTE_NUMBERS.forEach(num => { freqW[num] = 0; });
    recent.forEach(s => { freqW[s.number]++; });

    // Chi² de ventana
    const exp = n / 38;
    let chiW = 0;
    for (const cnt of Object.values(freqW)) chiW += (cnt - exp) ** 2 / exp;

    let chiDiag = 'Ventana pequeña';
    if (n >= 38) {
      if (chiW > 52)      chiDiag = 'Sesgo en ventana (Anormal)';
      else if (chiW > 40) chiDiag = 'Ligero sesgo local';
      else                chiDiag = 'Distribución Normal';
    }

    // Hot zone de ventana
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

    // Top 5 números de la ventana
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

  // ─── NUEVO: Histograma de distancias físicas — O(n) ──────────────────────

  /**
   * Distribución de distancias entre tiradas consecutivas en el cilindro.
   * Detecta dealer signature (tiradas cortas repetidas) o desgaste mecánico.
   *
   * Distribución teórica uniforme:
   *   d=0: 1/38,  d=1..18: 2/38,  d=19: 1/38
   */
  getDistanceHistogram() {
    const counts   = new Array(20).fill(0);
    const nPairs   = this.spins.length - 1;

    for (let i = 1; i < this.spins.length; i++) {
      const d = RouletteTracker.getWheelDistance(this.spins[i - 1].number, this.spins[i].number);
      if (d !== null) counts[d]++;
    }

    // Distribución teórica esperada
    const expected = counts.map((_, d) => {
      const mult = (d === 0 || d === 19) ? 1 : 2;
      return +(nPairs * mult / 38).toFixed(2);
    });

    // Índice de Dealer Signature: sobre-representación de distancias cortas (1-5)
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

  // ─── Series trend (sin cambios) ───────────────────────────────────────────

  getSeriesTrendData() {
    if (!this.settings.customSeries) return [];
    
    return this.settings.customSeries.filter(s => s.active).map(series => {
      const hitIndices = [];
      this.spins.forEach((spin, index) => {
        if (series.numbers.includes(spin.number)) {
          hitIndices.push(index + 1); // 1-indexed
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
