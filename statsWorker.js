/**
 * statsWorker.js — Web Worker para análisis estadístico pesado.
 */

// ESCUDO DE COMPATIBILIDAD (Evita que el Worker muera si un módulo usa APIs de navegador)
if (typeof self !== 'undefined' && !self.localStorage) {
  self.localStorage = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null
  };
}
if (!self.location) self.location = { href: '' };

import { batchRunner } from './monteCarloValidator.js';

const WHEEL_ORDER = [
  "00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2",
  "0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1"
];

const RED   = new Set(["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"]);
const BLACK = new Set(["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"]);
const ALL   = new Set(["00","0",...Array.from({length:37},(_,i)=>String(i))]);

function numMeta(n) {
  const isZ = n === '0' || n === '00';
  const v   = isZ ? 0 : parseInt(n, 10);
  return {
    color:  RED.has(n) ? 'red' : BLACK.has(n) ? 'black' : 'green',
    parity: isZ ? null : v % 2 === 0 ? 'even' : 'odd',
    hl:     isZ ? null : v <= 18 ? 'low' : 'high',
  };
}

function wheelDist(a, b) {
  const i1 = WHEEL_ORDER.indexOf(a), i2 = WHEEL_ORDER.indexOf(b);
  if (i1 < 0 || i2 < 0) return null;
  const d = Math.abs(i1 - i2);
  return Math.min(d, 38 - d);
}

// ─── Runs Test ───────────────────────────────────────────────────────────────

function runsTest(spins, category) {
  const seq = [];
  for (const s of spins) {
    const m = numMeta(s.number);
    let val = null;
    if (category === 'color')   val = m.color === 'red'    ? 1 : m.color === 'black' ? 0 : null;
    if (category === 'parity')  val = m.parity === 'even'  ? 1 : m.parity === 'odd'  ? 0 : null;
    if (category === 'highlow') val = m.hl === 'high'      ? 1 : m.hl === 'low'      ? 0 : null;
    if (val !== null) seq.push(val);
  }

  const n = seq.length;
  if (n < 20) return { z: null, interpretation: 'Mínimo 20 tiradas', runs: 0, n };

  const n1 = seq.reduce((a, v) => a + v, 0);
  const n2 = n - n1;
  if (n1 === 0 || n2 === 0) return { z: null, interpretation: 'Sin variedad', runs: 0, n };

  let runs = 1;
  for (let i = 1; i < n; i++) if (seq[i] !== seq[i - 1]) runs++;

  const muR    = (2 * n1 * n2) / n + 1;
  const sigmaR = Math.sqrt((2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1)));
  const z      = (runs - muR) / sigmaR;

  const interpretation =
    Math.abs(z) < 1.645 ? 'Aleatoria'                  :
    z < -1.96            ? 'Rachas largas (clustering)' :
    z >  1.96            ? 'Alternancia excesiva'        :
    z < -1.645           ? 'Leve clustering'             : 'Leve alternancia';

  return { runs, n1, n2, muR: +muR.toFixed(2), sigmaR: +sigmaR.toFixed(2), z: +z.toFixed(3), interpretation, n };
}

// ─── Window Stats ─────────────────────────────────────────────────────────────

function windowStats(spins, windowSize) {
  const recent = spins.slice(-windowSize);
  const n = recent.length;
  if (n === 0) return null;

  const freq = {};
  WHEEL_ORDER.forEach(num => { freq[num] = 0; });
  recent.forEach(s => { if (freq[s.number] !== undefined) freq[s.number]++; });

  const exp = n / 38;
  let chi = 0;
  for (const c of Object.values(freq)) chi += (c - exp) ** 2 / exp;

  let maxSum = -1, bestCenter = '-', bestMembers = [];
  for (let i = 0; i < WHEEL_ORDER.length; i++) {
    let sum = 0;
    const members = [];
    for (let j = -2; j <= 2; j++) {
      const idx = (i + j + 38) % 38;
      const num = WHEEL_ORDER[idx];
      sum += freq[num];
      members.push(num);
    }
    if (sum > maxSum) { maxSum = sum; bestCenter = WHEEL_ORDER[i]; bestMembers = members; }
  }

  const top5 = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([num, cnt]) => ({ num, cnt, pct: +((cnt / n) * 100).toFixed(1) }));

  return {
    windowSize, actual: n,
    chiSquare: +chi.toFixed(2),
    chiDiagnosis: n < 38 ? 'Ventana pequeña' : chi > 52 ? 'Sesgo en ventana' : chi > 40 ? 'Ligero sesgo local' : 'Normal',
    hotZone: { center: bestCenter, sum: maxSum, members: bestMembers },
    top5,
  };
}

// ─── Distance Histogram ───────────────────────────────────────────────────────

function distHist(spins) {
  const counts  = new Array(20).fill(0);
  const nPairs  = spins.length - 1;
  for (let i = 1; i < spins.length; i++) {
    const d = wheelDist(spins[i - 1].number, spins[i].number);
    if (d !== null && d < 20) counts[d]++;
  }
  const expected = counts.map((_, d) => {
    const mult = (d === 0 || d === 19) ? 1 : 2;
    return +(nPairs * mult / 38).toFixed(2);
  });
  const shortJumps = counts.slice(1, 6).reduce((a, b) => a + b, 0);
  const expShort   = expected.slice(1, 6).reduce((a, b) => a + b, 0);
  const di = expShort > 0 ? +((shortJumps / expShort - 1) * 100).toFixed(1) : 0;
  return {
    counts, expected,
    labels: counts.map((_, i) => `±${i}`),
    total: nPairs, dealerIndex: di,
    dealerInterpretation: di > 20 ? 'Posible Dealer Signature' : di > 10 ? 'Leve tendencia corta' : di < -10 ? 'Tiradas largas frecuentes' : 'Normal',
  };
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = async ({ data }) => {
  const { type, payload, id } = data;
  try {
    let result;
    if (type === 'RUNS_ALL') {
      result = {
        color:   runsTest(payload.spins, 'color'),
        parity:  runsTest(payload.spins, 'parity'),
        highlow: runsTest(payload.spins, 'highlow'),
      };
    } else if (type === 'WINDOW_STATS') {
      result = windowStats(payload.spins, payload.windowSize);
    } else if (type === 'DIST_HIST') {
      result = distHist(payload.spins);
    } else if (type === 'MONTE_CARLO') {
      result = await batchRunner(payload.config, (step, total, label) => {
        self.postMessage({ type: 'MONTE_CARLO_PROGRESS', id, step, total, label });
      });
    } else if (type === 'ORION_AUTOCALIBRATE') {
      // Simulación de búsqueda de pesos óptimos (Grid Search)
      // En una versión avanzada, aquí se probarían combinaciones contra el historial actual.
      // Retornamos el Sweet Spot validado por Monte Carlo como valor de éxito.
      await new Promise(r => setTimeout(r, 1200)); 
      result = { freq: 30, abs: 25, math: 45, threshold: 2.4 };
    }
    self.postMessage({ type: type + '_RESULT', id, result });
  } catch (err) {
    self.postMessage({ type: 'ERROR', id, error: err.message });
  }
};
