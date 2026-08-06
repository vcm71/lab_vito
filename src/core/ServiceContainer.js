/**
 * ServiceContainer — contenedor de servicios con soporte para
 * instancias directas, singletons (factory lazy) y factories.
 * Sin dependencias externas.
 *
 * Tipos de registro:
 * - registerInstance / register: valor directo, siempre el mismo.
 * - registerSingleton: factory que se ejecuta una vez, se cachea.
 * - registerFactory: factory que se ejecuta en cada resolve.
 */
export class ServiceContainer {
  constructor() {
    /** @type {Map<string, {type: string, value: *}>} */
    this._services = new Map();
    /** @type {Map<string, *>} */
    this._singletonCache = new Map();
  }

  /**
   * Registrar una instancia directa (alias de register).
   * @param {string} name
   * @param {*} instance
   */
  registerInstance(name, instance) {
    this._services.set(name, { type: 'instance', value: instance });
  }

  /**
   * Registrar una instancia directa (compatibilidad).
   * @param {string} name
   * @param {*} instance
   */
  register(name, instance) {
    this.registerInstance(name, instance);
  }

  /**
   * Registrar un singleton: factory ejecutada una sola vez.
   * @param {string} name
   * @param {Function} factoryFn
   */
  registerSingleton(name, factoryFn) {
    this._services.set(name, { type: 'singleton', value: factoryFn });
    // Invalidar cache previo si existe
    this._singletonCache.delete(name);
  }

  /**
   * Registrar una factory: se ejecuta en cada resolve.
   * @param {string} name
   * @param {Function} factoryFn
   */
  registerFactory(name, factoryFn) {
    this._services.set(name, { type: 'factory', value: factoryFn });
  }

  /**
   * Resolver un servicio por nombre.
   * @param {string} name
   * @returns {*|undefined}
   */
  resolve(name) {
    const entry = this._services.get(name);
    if (!entry) return undefined;

    if (entry.type === 'instance') return entry.value;

    if (entry.type === 'singleton') {
      if (this._singletonCache.has(name)) {
        return this._singletonCache.get(name);
      }
      const instance = entry.value(this);
      this._singletonCache.set(name, instance);
      return instance;
    }

    if (entry.type === 'factory') {
      return entry.value(this);
    }

    return undefined;
  }

  /**
   * Verificar si un servicio está registrado.
   * @param {string} name
   * @returns {boolean}
   */
  exists(name) {
    return this._services.has(name);
  }

  /**
   * Eliminar un servicio del contenedor.
   * @param {string} name
   */
  remove(name) {
    this._services.delete(name);
    this._singletonCache.delete(name);
  }
}
