/**
 * DelayManager — cómputo de atrasos (delays) para la interfaz de usuario.
 *
 * Responsabilidades:
 *  - Calcular atrasos actuales y máximos de números, docenas y columnas
 *  - Mantener cache con dirty flag para O(1) tras el primer cómputo
 *  - NO tiene dependencia de TrackerCompat ni de RouletteTracker
 *
 * Recibe una función getSpins() que retorna el array de giros vigente.
 * Esto permite que el manager pertenezca al dominio sin acoplamiento directo.
 *
 * Fase 3.4 — Extraído de TrackerCompat hacia el dominio.
 */

import { ROULETTE_NUMBERS, getDozen, getColumn } from '../utils/numberMeta.js';

export class DelayManager {
  /**
   * @param {function(): Array<{id: string, number: number}>} getSpinsFn
   */
  constructor(getSpinsFn) {
    this._getSpins = getSpinsFn;
    this._delaysDirty = true;
    this._cache = {
      numbers: {},
      maxNumbers: {},
      dozens: {},
      maxDozens: {},
      columns: {},
      maxColumns: {}
    };
  }

  // ─── Cache ────────────────────────────────────────────────

  /** Marcar cache como sucio para recalcular en el próximo acceso */
  invalidateCache() {
    this._delaysDirty = true;
  }

  /** (Re)calcular todos los atrasos en una pasada O(N × 44) */
  _recompute() {
    if (!this._delaysDirty) return;
    const spins = this._getSpins();
    const cache = this._cache;

    if (!spins || spins.length === 0) {
      ROULETTE_NUMBERS.forEach(n => {
        cache.numbers[n] = 0;
        cache.maxNumbers[n] = 0;
      });
      [1, 2, 3].forEach(i => {
        cache.dozens[i] = 0;
        cache.maxDozens[i] = 0;
        cache.columns[i] = 0;
        cache.maxColumns[i] = 0;
      });
      this._delaysDirty = false;
      return;
    }

    // Contadores temporales para recorrido lineal
    const curN = {}, curD = {}, curC = {};
    const nAtr = {}, nMax = {}, dAtr = {}, dMax = {}, cAtr = {}, cMax = {};
    ROULETTE_NUMBERS.forEach(n => { curN[n] = 0; nAtr[n] = 0; nMax[n] = 0; });
    [1, 2, 3].forEach(i => { curD[i] = 0; dAtr[i] = 0; dMax[i] = 0; curC[i] = 0; cAtr[i] = 0; cMax[i] = 0; });

    for (const s of spins) {
      const num = s.number;
      const docena = getDozen(num);
      const columna = getColumn(num);

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
        if (docena === d) {
          dMax[d] = Math.max(dMax[d], curD[d]);
          curD[d] = 0;
        } else {
          curD[d]++;
        }
      });

      // Columnas
      [1, 2, 3].forEach(c => {
        if (columna === c) {
          cMax[c] = Math.max(cMax[c], curC[c]);
          curC[c] = 0;
        } else {
          curC[c]++;
        }
      });
    }

    // Atraso actual (lo que lleva sin salir)
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

    cache.numbers = nAtr;
    cache.maxNumbers = nMax;
    cache.dozens = dAtr;
    cache.maxDozens = dMax;
    cache.columns = cAtr;
    cache.maxColumns = cMax;

    this._delaysDirty = false;
  }

  // ─── Getters públicos ────────────────────────────────────

  getDozenDelay(dozen) {
    this._recompute();
    return this._cache.dozens[dozen] || 0;
  }

  getDozenMaxDelay(dozen) {
    this._recompute();
    return this._cache.maxDozens[dozen] || 0;
  }

  getColumnDelay(column) {
    this._recompute();
    return this._cache.columns[column] || 0;
  }

  getColumnMaxDelay(column) {
    this._recompute();
    return this._cache.maxColumns[column] || 0;
  }

  getNumberDelay(numStr) {
    this._recompute();
    return this._cache.numbers[numStr] || 0;
  }

  getNumberMaxDelay(numStr) {
    this._recompute();
    return this._cache.maxNumbers[numStr] || 0;
  }
}
