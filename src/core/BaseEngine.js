/**
 * BaseEngine — clase base abstracta para todos los motores del sistema.
 * Define el ciclo de vida: initialize → start → stop → dispose.
 *
 * Todos los métodos retornan Promise (o son async).
 * No contiene lógica estadística ni algoritmos.
 */
export class BaseEngine {
  /**
   * @param {string} name - Identificador único del motor.
   */
  constructor(name) {
    /** @type {string} */
    this.name = name;
    /** @type {boolean} */
    this._initialized = false;
    /** @type {boolean} */
    this._started = false;
  }

  /** ¿El motor fue inicializado? @returns {boolean} */
  get initialized() { return this._initialized; }

  /** ¿El motor fue iniciado? @returns {boolean} */
  get started() { return this._started; }

  /**
   * Inicializar el motor. Debe ser llamado antes de start().
   * @returns {Promise<void>}
   */
  async initialize() {
    this._initialized = true;
  }

  /**
   * Iniciar el motor después de inicializar.
   * @returns {Promise<void>}
   */
  async start() {
    this._started = true;
  }

  /**
   * Detener el motor.
   * @returns {Promise<void>}
   */
  async stop() {
    this._started = false;
  }

  /**
   * Liberar recursos del motor. El motor no debe usarse después de dispose().
   * @returns {Promise<void>}
   */
  async dispose() {
    this._initialized = false;
    this._started = false;
  }
}
