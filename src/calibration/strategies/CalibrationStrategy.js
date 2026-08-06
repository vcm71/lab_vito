/**
 * CalibrationStrategy — abstract base class defining the interface that all
 * calibration strategies must implement.
 *
 * Every strategy receives a rawConsensusScore and returns a calibratedProbability
 * with metadata. Strategies MUST be stateless: calibration parameters are
 * accepted at construction time and applied during calibrate().
 */
export class CalibrationStrategy {
  /**
   * @param {string} name — unique identifier, e.g. 'IdentityCalibration'
   * @param {string} version — semver string
   */
  constructor(name, version) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new TypeError('CalibrationStrategy: name must be a non-empty string.');
    }
    if (typeof version !== 'string' || !version.trim()) {
      throw new TypeError('CalibrationStrategy: version must be a non-empty string.');
    }
    this.name = name;
    this.strategyVersion = version;
  }

  /**
   * Transform a raw consensus score into a calibrated probability.
   *
   * @param {number|null} rawConsensusScore
   * @param {Object} [context={}] — per-number context (engineScores, coverage, etc.)
   * @returns {{calibratedProbability:number|null, metadata:Object}}
   *
   * Subclasses MUST override this method.
   */
  calibrate(rawConsensusScore, context = {}) {
    throw new Error(`CalibrationStrategy "${this.name}": calibrate() not implemented.`);
  }

  /**
   * Strategy metadata — provenance info attached to calibrated entries.
   * @param {Object} [overrides={}]
   * @returns {{name:string,strategyVersion:string,trainingDataset:string|null,trainedAt:string|null,modelVersion:string|null,calibrationVersion:string}}
   */
  getMeta(overrides = {}) {
    return {
      name: this.name,
      strategyVersion: this.strategyVersion,
      trainingDataset: overrides.trainingDataset ?? null,
      trainedAt: overrides.trainedAt ?? null,
      modelVersion: overrides.modelVersion ?? null,
      calibrationVersion: '1.0.0',
    };
  }

  /**
   * Train the strategy on a dataset. Returns strategy-specific parameters.
   *
   * @param {import('../CalibrationDataset.js').CalibrationDataset} dataset
   * @param {import('../CalibrationContext.js').CalibrationContext} [context]
   * @returns {Object} — serializable parameter object
   *
   * Subclasses MUST override this method.
   */
  fit(dataset, context = null) {
    throw new Error(`CalibrationStrategy "${this.name}": fit() not implemented.`);
  }

  /**
   * Serialize the strategy and its trained parameters to a JSON-safe object.
   * @returns {Object}
   */
  serialize() {
    throw new Error(`CalibrationStrategy "${this.name}": serialize() not implemented.`);
  }

  /**
   * Restore a strategy from a serialized object.
   * @param {Object} data — output from serialize()
   * @returns {CalibrationStrategy}
   */
  static deserialize(data) {
    throw new Error(`CalibrationStrategy: deserialize() not implemented on base class.`);
  }

  /**
   * Validate that a CalibrationModel is compatible with this strategy.
   * @param {import('../CalibrationModel.js').CalibrationModel} model
   * @returns {{ valid: boolean, issues: Array<{message:string, severity:'error'|'warning'}> }}
   */
  validateModel(model) {
    if (!model || !model.parameters) {
      return { valid: false, issues: [{ message: 'Model is null or missing parameters.', severity: 'error' }] };
    }
    if (model.strategy !== this.name) {
      return { valid: false, issues: [{ message: `Strategy mismatch: expected ${this.name}, got ${model.strategy}.`, severity: 'error' }] };
    }
    return { valid: true, issues: [] };
  }
}
