/**
 * CalibrationModelFactory — builds CalibrationModel instances.
 * Single source of truth. Never create models manually.
 */

import { CalibrationModel } from './CalibrationModel.js';
import { CalibrationVersion } from './versioning/CalibrationVersion.js';

let seq = 1;

export class CalibrationModelFactory {
  build(options = {}) {
    const strategyVersion = options.strategyVersion ?? '0.0.0';
    const parsed = CalibrationVersion.parse(strategyVersion);
    const modelVersion = `model_${parsed.major}.${parsed.minor}.${parsed.patch}_${Date.now()}_${seq++}`;

    return new CalibrationModel({
      id: `cal_model_${Date.now()}_${seq}`,
      strategy: options.strategy ?? 'unknown',
      strategyVersion,
      modelVersion,
      datasetVersion: options.datasetVersion ?? null,
      trainingSamples: options.trainingSamples ?? 0,
      parameters: options.parameters ?? {},
      metrics: options.metrics ?? {},
      hash: options.hash ?? null,
      metadata: options.metadata ?? {},
    });
  }
}
