/**
 * CalibrationDatasetBuilder — accepts historical data and constructs
 * validated CalibrationDataset instances.
 *
 * Only accepts raw records with { rawConsensusScore, observedOutcome, timestamp }.
 * Never modifies historical data.
 */

import { CalibrationDataset } from './CalibrationDataset.js';
import { CalibrationDatasetValidator } from './CalibrationDatasetValidator.js';

export class CalibrationDatasetBuilder {
  /**
   * @param {Object} [options]
   * @param {'strict'|'tolerant'} [options.mode='tolerant']
   */
  constructor(options = {}) {
    this.mode = options.mode ?? 'tolerant';
  }

  /**
   * Build a dataset from raw historical records.
   *
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.datasetVersion
   * @param {Array<Object>} options.records — { rawConsensusScore, observedOutcome, timestamp, wheelVersion?, configurationVersion? }
   * @param {Object} [options.metadata]
   * @returns {CalibrationDataset}
   */
  build(options = {}) {
    const { id, datasetVersion, records, metadata } = options;

    if (!id || !datasetVersion) {
      throw new TypeError('CalibrationDatasetBuilder: id and datasetVersion are required.');
    }

    if (!Array.isArray(records)) {
      throw new TypeError('CalibrationDatasetBuilder: records must be an array.');
    }

    // Validate records and collect issues
    const validator = new CalibrationDatasetValidator({ mode: this.mode });
    const validation = validator.validate(records);

    if (!validation.valid && this.mode === 'strict') {
      const msgs = validation.issues.map(i => i.message).join('; ');
      throw new Error(`CalibrationDatasetBuilder: validation failed — ${msgs}`);
    }

    // Never modify historical records — pass through as-is
    return new CalibrationDataset({
      id,
      datasetVersion,
      records,
      metadata: {
        ...(metadata ?? {}),
        validated: validation.valid,
        validationWarnings: validation.issues.filter(i => i.severity === 'warning').length,
        validationErrors: validation.issues.filter(i => i.severity === 'error').length,
        buildMode: this.mode,
        buildTimestamp: new Date().toISOString(),
      },
    });
  }
}
