/**
 * MetricRegistry — collection of MetricDescriptors, pre-registered with
 * the canonical calibration metrics.
 *
 * Single source of truth for metric metadata. New metrics registered here
 * automatically participate in benchmarks.
 */

import { defineMetric } from './MetricDescriptor.js';
import { brierScore } from './metrics/BrierScore.js';
import { logLoss } from './metrics/LogLoss.js';
import { ece } from './metrics/ECE.js';
import { mce } from './metrics/MCE.js';
import { sharpness } from './metrics/Sharpness.js';
import { resolution } from './metrics/Resolution.js';
import { uncertainty } from './metrics/Uncertainty.js';
import { accuracy } from './metrics/Accuracy.js';

/** @type {Map<string, ReturnType<typeof defineMetric>>} */
let _registry = null;

function buildDefaultRegistry() {
  const m = new Map();
  const register = (desc) => {
    const metric = defineMetric(desc);
    m.set(metric.id, metric);
    return metric;
  };

  // Calibration metrics — LOWER = BETTER
  register({ id: 'brierScore', name: 'Brier Score', description: 'MSE between predicted probabilities and outcomes.', minimizer: true, referenceRange: [0, 0.25], qualifiedRange: [0, 0.15], criticalThreshold: 0.25, compute: brierScore, tags: ['calibration', 'proper'] });
  register({ id: 'logLoss', name: 'Log Loss', description: 'Binary cross-entropy.', minimizer: true, referenceRange: [0, 0.8], qualifiedRange: [0, 0.5], criticalThreshold: 0.693, compute: logLoss, tags: ['calibration', 'proper'] });
  register({ id: 'ece', name: 'Expected Calibration Error', description: 'Weighted mean of |accuracy - confidence| per bucket.', minimizer: true, referenceRange: [0, 0.2], qualifiedRange: [0, 0.05], criticalThreshold: 0.15, compute: ece, tags: ['calibration', 'diagnostic'] });
  register({ id: 'mce', name: 'Maximum Calibration Error', description: 'Maximum deviation in any bucket.', minimizer: true, referenceRange: [0, 0.5], qualifiedRange: [0, 0.15], criticalThreshold: 0.25, compute: mce, tags: ['calibration', 'diagnostic'] });

  // Sharpness — LOWER (not zero) = BETTER (model is confident, not overconfident)
  register({ id: 'sharpness', name: 'Sharpness', description: 'Variance of predicted probabilities.', minimizer: false, referenceRange: [0, 0.25], qualifiedRange: [0.02, 0.25], compute: sharpness, tags: ['sharpness'] });

  // Decomposition terms — informative, not optimised directly
  register({ id: 'resolution', name: 'Resolution', description: 'How well predictions separate into distinct bins.', minimizer: false, referenceRange: [0, 0.25], compute: resolution, tags: ['decomposition'] });
  register({ id: 'uncertainty', name: 'Uncertainty', description: 'Inherent uncertainty: mean * (1 - mean).', minimizer: false, referenceRange: [0, 0.25], compute: uncertainty, tags: ['decomposition'] });

  // Accuracy — HIGHER = BETTER
  register({ id: 'accuracy', name: 'Accuracy', description: 'Classification accuracy at threshold 0.5.', minimizer: false, referenceRange: [0, 1], qualifiedRange: [0.5, 1], compute: accuracy, tags: ['classification'] });

  return m;
}

export class MetricRegistry {
  constructor() {
    if (!_registry) _registry = buildDefaultRegistry();
    /** @type {Map<string, ReturnType<typeof defineMetric>>} */
    this._metrics = new Map(_registry);
  }

  /** @param {Object} descriptor */
  register(descriptor) {
    const metric = defineMetric(descriptor);
    this._metrics.set(metric.id, metric);
    return metric;
  }

  /** @param {string} id */
  get(id) {
    return this._metrics.get(id);
  }

  /** @returns {ReturnType<typeof defineMetric>[]} */
  list() {
    return Array.from(this._metrics.values());
  }

  /** @returns {string[]} */
  listIds() {
    return Array.from(this._metrics.keys());
  }

  /**
   * Compute all registered metrics on predictions/outcomes.
   * @returns {Object<string, number>}
   */
  computeAll(predictions, outcomes) {
    const result = {};
    for (const [id, metric] of this._metrics) {
      result[id] = metric.compute(predictions, outcomes);
    }
    return result;
  }

  /** @returns {number} */
  get size() {
    return this._metrics.size;
  }
}
