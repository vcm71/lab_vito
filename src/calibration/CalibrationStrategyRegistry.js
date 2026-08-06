/**
 * CalibrationStrategyRegistry — registry for calibration strategies.
 *
 * Supports register, unregister, get, list, and default selection.
 * Strategy lookup is by name. Duplicate registrations overwrite.
 */

import { IdentityCalibration } from './strategies/IdentityCalibration.js';

export class CalibrationStrategyRegistry {
  constructor() {
    /** @type {Map<string, import('../strategies/CalibrationStrategy.js').CalibrationStrategy>} */
    this._strategies = new Map();

    // Pre-register the baseline
    this._strategies.set('IdentityCalibration', new IdentityCalibration());
  }

  /**
   * Register a strategy instance.
   * @param {import('../strategies/CalibrationStrategy.js').CalibrationStrategy} strategy
   * @throws {TypeError} if not a valid CalibrationStrategy subclass
   */
  register(strategy) {
    if (!strategy || typeof strategy.calibrate !== 'function' || typeof strategy.name !== 'string') {
      throw new TypeError('CalibrationStrategyRegistry.register: strategy must implement CalibrationStrategy interface.');
    }
    if (!strategy.name.trim()) {
      throw new TypeError('CalibrationStrategyRegistry.register: strategy.name must not be empty.');
    }
    this._strategies.set(strategy.name, strategy);
  }

  /**
   * Remove a strategy by name. Cannot remove 'IdentityCalibration'.
   * @param {string} name
   * @returns {boolean} true if removed
   */
  unregister(name) {
    if (name === 'IdentityCalibration') {
      throw new Error('CalibrationStrategyRegistry: cannot unregister the baseline IdentityCalibration strategy.');
    }
    return this._strategies.delete(name);
  }

  /**
   * Get a strategy by name.
   * @param {string} name
   * @returns {import('../strategies/CalibrationStrategy.js').CalibrationStrategy|undefined}
   */
  get(name) {
    return this._strategies.get(name);
  }

  /**
   * List all registered strategy names.
   * @returns {string[]}
   */
  list() {
    return Array.from(this._strategies.keys());
  }

  /**
   * Return the default strategy (IdentityCalibration).
   * @returns {import('../strategies/CalibrationStrategy.js').CalibrationStrategy}
   */
  default() {
    return this._strategies.get('IdentityCalibration');
  }

  /**
   * @returns {number} number of registered strategies
   */
  get size() {
    return this._strategies.size;
  }
}
