/**
 * EventBus — bus de eventos minimalista basado en EventTarget.
 * Soporta: on(), once(), off(), emit(), removeAll().
 */
export class EventBus {
  constructor() {
    this._target = new EventTarget();
  }

  /**
   * Suscribirse a un evento.
   * @param {string} event
   * @param {EventListenerOrFunction} handler
   */
  on(event, handler) {
    this._target.addEventListener(event, handler);
  }

  /**
   * Suscribirse a un evento para una sola ejecución.
   * @param {string} event
   * @param {EventListenerOrFunction} handler
   */
  once(event, handler) {
    const wrapper = (evt) => {
      handler(evt);
      this.off(event, wrapper);
    };
    this._target.addEventListener(event, wrapper);
  }

  /**
   * Desuscribirse de un evento.
   * @param {string} event
   * @param {EventListenerOrFunction} handler
   */
  off(event, handler) {
    this._target.removeEventListener(event, handler);
  }

  /**
   * Emitir un evento con datos opcionales.
   * @param {string} event
   * @param {*} [detail]
   */
  emit(event, detail) {
    this._target.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /**
   * Eliminar todos los listeners de todos los eventos.
   */
  removeAll() {
    this._target = new EventTarget();
  }
}
