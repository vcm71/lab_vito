/**
 * SpinManager — gestión de giros (spins).
 * Único responsable de administrar las tiradas.
 * Opera sobre TrackerState.spins como fuente única de verdad.
 *
 * Fase4.1 — migración completa de responsabilidad de spins.
 * Fase5.2.1 — validación ROULETTE_NUMBERS (GAP-01).
 * Fase5.2.2 — deleteSpin/updateSpin (GAP-02), normalizeNumber (GAP-03),
 *             metadatos casino/dealer/table (GAP-06).
 */
import { TrackerState } from './TrackerState.js';

import { ROULETTE_NUMBERS } from '../utils/numberMeta.js';

export class SpinManager {
  /**
   * @param {TrackerState} state
   */
  constructor(state) {
    /** @type {TrackerState} */
    this._state = state;

    // Inicializar array si no existe
    if (!Array.isArray(this._state.spins)) {
      this._state.spins = [];
    }
  }

  // ── Normalización (GAP-03) ────────────────────────────────

  /**
   * Normalizar una entrada de número antes de validación.
   * Reproduce exactamente el comportamiento de Legacy.importSpins().
   *
   * - Trim
   * - Separadores "." y "," → se descartan (split y primer segmento)
   * - "90" → "00"
   *
   * @param {*} input
   * @returns {string}
   */
  static normalizeNumber(input) {
    let clean = String(input).trim().split('.')[0].split(',')[0];
    if (clean === "90") clean = "00";
    return clean;
  }

  // ── CRUD (GAP-02) ─────────────────────────────────────────

  /**
   * Agregar un nuevo giro.
   * Valida contra ROULETTE_NUMBERS antes de incorporar.
   * Crea el objeto spin con estructura estándar.
   * @param {string|number} number - Número de la ruleta
   * @param {object} [meta={}] - Metadatos opcionales (casino, dealer, table)
   * @returns {object|null} El spin creado o null si no es válido
   */
  addSpin(number, meta = {}) {
    if (number === undefined || number === null || number === '') return null;
    if (!ROULETTE_NUMBERS.includes(String(number))) return null;

    const spins = this._state.spins;
    const spin = {
      id: spins.length + 1,
      number: String(number),
      timestamp: new Date().toISOString(),
      casino: meta.casino,
      dealer: meta.dealer,
      table: meta.table
    };
    spins.push(spin);
    return spin;
  }

  /**
   * Eliminar un giro por su ID.
   * Reindexa los IDs subsiguientes (1-based).
   * @param {number} spinId
   * @returns {boolean} true si se eliminó, false si no se encontró
   */
  deleteSpin(spinId) {
    const idx = this._state.spins.findIndex(s => s.id === spinId);
    if (idx === -1) return false;
    this._state.spins.splice(idx, 1);
    // Reindexar IDs (1-based)
    this._state.spins.forEach((s, i) => { s.id = i + 1; });
    return true;
  }

  /**
   * Actualizar el número de un giro existente.
   * @param {number} spinId
   * @param {string|number} newNumber
   * @returns {boolean} true si se actualizó, false si no se encontró o inválido
   */
  updateSpin(spinId, newNumber) {
    if (!ROULETTE_NUMBERS.includes(String(newNumber))) return false;
    const spin = this._state.spins.find(s => s.id === spinId);
    if (!spin) return false;
    spin.number = String(newNumber);
    return true;
  }

  // ── Utilidades ────────────────────────────────────────────

  /**
   * Eliminar el último giro agregado.
   * @returns {object|undefined} El spin eliminado o undefined si no hay
   */
  removeLastSpin() {
    return this._state.spins.pop();
  }

  /**
   * Limpiar todos los giros.
   */
  clearSpins() {
    this._state.spins = [];
  }

  /**
   * Obtener todos los giros (referencia directa).
   * @returns {Array}
   */
  getSpins() {
    return this._state.spins;
  }

  /**
   * Obtener una copia del historial de giros.
   * @returns {Array}
   */
  getHistory() {
    return [...this._state.spins];
  }

  /**
   * Obtener el último giro registrado.
   * @returns {object|undefined}
   */
  getLastSpin() {
    const spins = this._state.spins;
    return spins.length > 0 ? spins[spins.length - 1] : undefined;
  }

  /**
   * Obtener el número del último giro.
   * @returns {string|undefined}
   */
  getLastNumber() {
    const last = this.getLastSpin();
    return last ? last.number : undefined;
  }

  /**
   * Cantidad total de giros registrados.
   * @returns {number}
   */
  count() {
    return this._state.spins.length;
  }

  /**
   * Verificar si no hay giros registrados.
   * @returns {boolean}
   */
  isEmpty() {
    return this._state.spins.length === 0;
  }
}
