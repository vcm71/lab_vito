/**
 * ProbabilityCalibrator — transforms rawConsensusScore into calibratedProbability.
 *
 * Architecture:
 *   ConsensusEngine output → ProbabilityCalibrator.calibrate() → calibrated output
 *
 * The calibrator:
 *   - Validates input against the ConsensusEngine public contract
 *   - Looks up the active strategy from its registry
 *   - Applies the strategy to every per-number entry
 *   - Preserves all input fields (immutability via structural clone)
 *   - Produces deterministic output given the same input/strategy/config
 *
 * Never accesses engines, adapters, normalizers, or stores directly.
 * Works exclusively on the public contract defined by CalibrationContract.
 */

import { validateCalibrationInput } from './validators/CalibrationInputValidator.js';
import { CalibrationStrategyRegistry } from './CalibrationStrategyRegistry.js';
import { CalibrationResultFactory } from './factories/CalibrationResultFactory.js';

/**
 * Deep structural clone — JSON-safe, strips NaN/Infinity/Map/Set/functions.
 */
function structuralClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export class ProbabilityCalibrator {
  /**
   * @param {Object} options
   * @param {'strict'|'tolerant'} [options.mode='tolerant']
   * @param {CalibrationStrategyRegistry} [options.registry] — defaults to a fresh registry with IdentityCalibration
   */
  constructor(options = {}) {
    if (options.mode !== undefined && options.mode !== 'strict' && options.mode !== 'tolerant') {
      throw new Error(`ProbabilityCalibrator: unknown mode "${options.mode}".`);
    }
    this.mode = options.mode ?? 'tolerant';
    this.registry = options.registry ?? new CalibrationStrategyRegistry();
    this.factory = new CalibrationResultFactory(this.registry);
  }

  /**
   * Calibrate consensus scores using the active strategy.
   *
   * @param {import('./contracts/CalibrationContract').CalibrationInput} input — ConsensusEngine.compute() output
   * @param {string} [strategyName] — name in registry; defaults to registry.default()
   * @returns {import('./contracts/CalibrationContract').CalibrationOutput}
   * @throws {Error} in strict mode when validation fails
   */
  calibrate(input, strategyName = null) {
    // 1. Validate input contract
    const validation = validateCalibrationInput(input, this.mode);
    if (!validation.valid && this.mode === 'strict') {
      const msgs = validation.warnings.map(w => w.message).join('; ');
      throw new Error(`ProbabilityCalibrator: input validation failed — ${msgs}`);
    }

    // 2. Resolve strategy
    const strategy = strategyName
      ? this.registry.get(strategyName)
      : this.registry.default();

    if (!strategy) {
      throw new Error(`ProbabilityCalibrator: strategy "${strategyName}" not found in registry.`);
    }

    const strategyMeta = strategy.getMeta();

    // 3. Deep clone the input (immutability)
    const cloned = structuralClone(input);

    // 4. Calibrate each number
    const calibratedNumbers = {};

    for (const [numKey, entry] of Object.entries(cloned.numbers)) {
      const strategyResult = strategy.calibrate(entry.rawConsensusScore, {
        engineScores: entry.engineScores,
        coverage: entry.coverage,
        agreement: entry.agreement,
      });

      calibratedNumbers[numKey] = this.factory.buildEntry(entry, strategyResult, strategyMeta);
    }

    // 5. Build output envelope
    return this.factory.buildOutput(calibratedNumbers, cloned.metadata, strategyMeta);
  }
}

export { IdentityCalibration } from './strategies/IdentityCalibration.js';
export { CalibrationStrategyRegistry } from './CalibrationStrategyRegistry.js';
export { CalibrationVersion } from './versioning/CalibrationVersion.js';
export { validateCalibrationInput } from './validators/CalibrationInputValidator.js';
