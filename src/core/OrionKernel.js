/**
 * OrionKernel — núcleo del sistema ORION.
 * Controla el ciclo de vida completo: bootstrap → initialize → start → stop → dispose.
 *
 * bootstrap()  → crea container + eventBus + engineRegistry + ejecuta Bootstrap
 * initialize() → llama initialize() de todos los motores registrados
 * start()      → llama start() de todos los motores
 * stop()       → llama stop() de todos los motores
 * dispose()    → libera recursos
 */
import { ServiceContainer } from './ServiceContainer.js';
import { EventBus } from './EventBus.js';
import { EngineRegistry } from './EngineRegistry.js';
import { Bootstrap } from './Bootstrap.js';

export class OrionKernel {
  constructor() {
    /** @type {ServiceContainer} */
    this.container = new ServiceContainer();
    /** @type {EventBus} */
    this.eventBus = new EventBus();
    /** @type {EngineRegistry} */
    this.engineRegistry = new EngineRegistry();

    this._bootstrapped = false;
  }

  /**
   * Inicializar el sistema: crear servicios y motores.
   * Registra automáticamente los motores devueltos por Bootstrap en EngineRegistry.
   * @returns {Promise<{tracker: import('../tracker/RouletteTracker.js').RouletteTracker}>}
   */
  async bootstrap() {
    if (this._bootstrapped) return { tracker: this.container.resolve('domainTracker') };
    this._bootstrapped = true;

    // Registrar servicios core en el container
    this.container.register('eventBus', this.eventBus);
    this.container.register('engineRegistry', this.engineRegistry);

    // Ejecutar Bootstrap: crea tracker, stores, renderers, motores
    const result = await Bootstrap.init(this.container);

    // Auto-registrar todos los motores en EngineRegistry
    for (const engine of result.engines) {
      if (engine.name && engine.instance) {
        this.engineRegistry.register(engine.name, engine.instance);
      }
    }

    // Guardar referencia al tracker del dominio (Fase4)
    this._domainTracker = result.domainTracker;

    return { tracker: result.tracker };
  }

  /**
   * Obtener el tracker del dominio (src/tracker/).
   * Disponible después de bootstrap().
   * @returns {import('../tracker/RouletteTracker.js').RouletteTracker|null}
   */
  getTracker() {
    return this._domainTracker || null;
  }

  /**
   * Inicializar todos los motores registrados.
   * Cada motor debe implementar initialize() (async).
   * @returns {Promise<void>}
   */
  async initialize() {
    const engines = this.engineRegistry.getAll();
    for (const engine of engines) {
      if (typeof engine.initialize === 'function') {
        await engine.initialize();
      }
    }
  }

  /**
   * Iniciar todos los motores registrados.
   * Cada motor debe implementar start() (async).
   * @returns {Promise<void>}
   */
  async start() {
    const engines = this.engineRegistry.getAll();
    for (const engine of engines) {
      if (typeof engine.start === 'function') {
        await engine.start();
      }
    }
  }

  /**
   * Detener todos los motores registrados.
   * Cada motor debe implementar stop() (async).
   * @returns {Promise<void>}
   */
  async stop() {
    const engines = this.engineRegistry.getAll();
    for (const engine of engines) {
      if (typeof engine.stop === 'function') {
        await engine.stop();
      }
    }
  }

  /**
   * Liberar recursos de todos los motores y limpiar el sistema.
   * El kernel no debe usarse después de dispose().
   * @returns {Promise<void>}
   */
  async dispose() {
    const engines = this.engineRegistry.getAll();
    for (const engine of engines) {
      if (typeof engine.dispose === 'function') {
        await engine.dispose();
      }
    }
    this.engineRegistry.clear();
    this._bootstrapped = false;
  }
}
