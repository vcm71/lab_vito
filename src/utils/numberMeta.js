/**
 * numberMeta — utilidades de metadatos de números de ruleta americana.
 * Independiente del Legacy RouletteTracker.
 * Fase5.5.2 — extraído de rouletteTracker.js para que tomadorRenderer
 * dependa de esta utilidad en lugar del Legacy.
 */

export const ROULETTE_NUMBERS = [
  "00", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
  "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"
];

export const RED_NUMBERS = ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"];
export const BLACK_NUMBERS = ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"];

export const AMERICAN_WHEEL_ORDER = [
  "00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2",
  "0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1"
];

// Metadatos pre-computados de todos los números
export const NUM_META = (() => {
  const m = {};
  ROULETTE_NUMBERS.forEach(n => {
    const isZero = n === '0' || n === '00';
    const v = isZero ? 0 : parseInt(n, 10);
    m[n] = {
      color:  isZero ? 'green' : RED_NUMBERS.includes(n) ? 'red' : 'black',
      parity: isZero ? null : (v % 2 === 0 ? 'even' : 'odd'),
      hl:     isZero ? null : (v <= 18 ? 'low' : 'high'),
      dozen:  isZero ? null : Math.ceil(v / 12),
      column: isZero ? null : ((v - 1) % 3) + 1,
    };
  });
  return m;
})();

/** @param {string} numberStr */
export function getColor(numberStr) {
  return NUM_META[numberStr]?.color ?? 'unknown';
}

/** @param {string} numberStr */
export function getParity(numberStr) {
  return NUM_META[numberStr]?.parity ?? null;
}

/** @param {string} numberStr */
export function getHighLow(numberStr) {
  return NUM_META[numberStr]?.hl ?? null;
}

/** @param {string} numberStr */
export function getDozen(numberStr) {
  return NUM_META[numberStr]?.dozen ?? null;
}

/** @param {string} numberStr */
export function getColumn(numberStr) {
  return NUM_META[numberStr]?.column ?? null;
}

/**
 * Distancia entre dos números en la ruleta americana.
 * @param {string} num1
 * @param {string} num2
 * @returns {number|null}
 */
export function getWheelDistance(num1, num2) {
  const i1 = AMERICAN_WHEEL_ORDER.indexOf(String(num1));
  const i2 = AMERICAN_WHEEL_ORDER.indexOf(String(num2));
  if (i1 === -1 || i2 === -1) return null;
  const d = Math.abs(i1 - i2);
  return Math.min(d, 38 - d);
}

// Re-exportar también como objeto agrupado para quien prefiera acceso dinámico
export const NumberMeta = {
  getColor,
  getParity,
  getHighLow,
  getDozen,
  getColumn,
  getWheelDistance,
};
