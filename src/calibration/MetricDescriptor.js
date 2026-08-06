/**
 * MetricDescriptor — describes a calibration metric with its metadata.
 *
 * Each metric declares:
 *  - id: unique identifier
 *  - name: human-readable name
 *  - minimizer: true if LOW = BETTER, false if HIGH = BETTER
 *  - referenceRange: [lo, hi] typical range for the metric
 *  - qualifiedRange: [lo, hi] range considered acceptable
 *  - criticalThreshold: value beyond which the model is UNFIT
 *  - compute: (predictions, outcomes) => number
 *  - tags: e.g. ['calibration', 'sharpness']
 */

/**
 * @param {Object} descriptor
 */
export function defineMetric(descriptor) {
  const required = ['id', 'name', 'minimizer', 'referenceRange', 'compute'];
  for (const key of required) {
    if (!(key in descriptor)) {
      throw new TypeError(`MetricDescriptor: "${key}" is required.`);
    }
  }
  if (typeof descriptor.compute !== 'function') {
    throw new TypeError('MetricDescriptor: compute must be a function.');
  }
  return Object.freeze({
    id: descriptor.id,
    name: descriptor.name,
    description: descriptor.description ?? '',
    minimizer: !!descriptor.minimizer,
    referenceRange: descriptor.referenceRange.slice(0, 2),
    qualifiedRange: descriptor.qualifiedRange ?? descriptor.referenceRange.slice(0, 2),
    criticalThreshold: descriptor.criticalThreshold ?? null,
    compute: descriptor.compute,
    tags: Object.freeze([...(descriptor.tags ?? [])]),
  });
}
