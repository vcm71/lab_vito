/**
 * EngineRegistry — registro central de motores del sistema.
 * Mantiene orden de inserción. Permite registrar, obtener, listar,
 * eliminar y verificar existencia de motores.
 */
export class EngineRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._engines = new Map();
  }

  /**
   * Registrar un motor por nombre.
   * @param {string} name - Identificador único del motor.
   * @param {object} engine - Instancia del motor.
   */
  register(name, engine) {
    this._engines.set(name, engine);
  }

  /**
   * Eliminar un motor del registro.
   * @param {string} name
   */
  unregister(name) {
    this._engines.delete(name);
  }

  /**
   * Verificar si un motor está registrado.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._engines.has(name);
  }

  /**
   * Obtener un motor por nombre.
   * @param {string} name
   * @returns {object|undefined}
   */
  get(name) {
    return this._engines.get(name);
  }

  /**
   * Obtener todos los motores registrados (en orden de inserción).
   * @returns {object[]}
   */
  getAll() {
    return Array.from(this._engines.values());
  }

  /**
   * Eliminar todos los motores del registro.
   */
  clear() {
    this._engines.clear();
  }
}
