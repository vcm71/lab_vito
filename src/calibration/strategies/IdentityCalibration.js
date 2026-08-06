/**
 * IdentityCalibration — baseline calibration strategy.
 *
 * calibratedProbability = rawConsensusScore
 *
 * This is a pure identity function: it passes the raw consensus score through
 * unchanged while preserving all contracts. Used as:
 *   - Development baseline before real calibration methods exist
 *   - Reference implementation proving the Strategy Pattern works
 *   - Fallback when no learned model is available
 */

import { CalibrationStrategy } from './CalibrationStrategy.js';

export class IdentityCalibration extends CalibrationStrategy {
  constructor() {
    super('IdentityCalibration', '1.0.0');
  }

  /**
   * @param {number|null} rawConsensusScore
   * @param {Object} [context={}]
   * @returns {{calibratedProbability:number|null, metadata:{appliedStrategy:string,description:string,notes:string}}}
   */
  calibrate(rawConsensusScore, context = {}) {
    if (rawConsensusScore === null || rawConsensusScore === undefined) {
      return {
        calibratedProbability: null,
        metadata: {
          appliedStrategy: this.name,
          description: 'Identity calibration: insufficient consensus score.',
          notes: 'rawConsensusScore was null/undefined — cannot calibrate.',
        },
      };
    }

    if (typeof rawConsensusScore !== 'number' || !Number.isFinite(rawConsensusScore)) {
      return {
        calibratedProbability: null,
        metadata: {
          appliedStrategy: this.name,
          description: 'Identity calibration: invalid input.',
          notes: `rawConsensusScore=${rawConsensusScore} is not a finite number.`,
        },
      };
    }

    return {
      calibratedProbability: rawConsensusScore,
      metadata: {
        appliedStrategy: this.name,
        description: 'Identity calibration: output equals input (baseline).',
        notes: 'No transformation applied. Use as development reference.',
      },
    };
  }

  /**
   * Identity does not require training — returns empty parameters.
   */
  fit(dataset, context = null) {
    return {};
  }

  /**
   * Serialize to a JSON-safe object. Identity has no trained state.
   */
  serialize() {
    return {
      name: this.name,
      strategyVersion: this.strategyVersion,
      parameters: {},
    };
  }

  /**
   * Deserialize — always returns a new IdentityCalibration.
   */
  static deserialize(data) {
    return new IdentityCalibration();
  }

  /**
   * Validate a model for compatibility. Identity accepts any model.
   */
  validateModel(model) {
    if (!model || !model.parameters) {
      return { valid: false, issues: [{ message: 'Model is null or missing parameters.', severity: 'error' }] };
    }
    return { valid: true, issues: [] };
  }
}
