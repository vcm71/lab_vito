/**
 * Robust Min-Max normalization with configurable winsorization.
 *
 * Applies winsorization (clipping at percentile bounds) before min-max scaling:
 *
 * 1. Sorts the population.
 * 2. Computes lower/upper bounds at the given percentiles (default: 5th / 95th).
 * 3. Clips the raw value to [lower, upper].
 * 4. Applies min-max on the winsorized range.
 *
 * - The raw value in the output is the original, not the winsorized one.
 * - Records whether winsorization was applied and the clip bounds.
 * - Single value or degenerate populations map to 0.5.
 */
export class RobustMinMaxStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='ROBUST_MIN_MAX']
   * @param {number} [options.lowerPercentile=5]  — percentile for lower clip (0-50)
   * @param {number} [options.upperPercentile=95] — percentile for upper clip (50-100)
   */
  constructor(options = {}) {
    this.name = options.name || 'ROBUST_MIN_MAX';
    this.lowerPercentile = Number.isFinite(options.lowerPercentile)
      ? Math.max(0, Math.min(50, options.lowerPercentile))
      : 5;
    this.upperPercentile = Number.isFinite(options.upperPercentile)
      ? Math.max(50, Math.min(100, options.upperPercentile))
      : 95;
  }

  /**
   * @param {number|null} rawValue
   * @param {{ values: number[] }} population
   * @param {Object} [fieldConfig]
   * @returns {{ rawValue: number|null, normalizedValue: number|null, method: string, valid: boolean, params: Object }}
   */
  normalize(rawValue, population, fieldConfig = {}) {
    const params = {
      populationSize: 0,
      min: null,
      max: null,
      lowerBound: null,
      upperBound: null,
      winsorized: false,
      lowerPercentile: this.lowerPercentile,
      upperPercentile: this.upperPercentile,
    };

    if (!Array.isArray(population.values) || population.values.length === 0) {
      return this._nullResult(rawValue, params);
    }

    const valid = population.values.filter(v => Number.isFinite(v));
    params.populationSize = valid.length;

    if (valid.length === 0) {
      return this._nullResult(rawValue, params);
    }

    const sorted = [...valid].sort((a, b) => a - b);
    const n = sorted.length;

    // Compute percentile bounds via linear interpolation
    const percentileValue = (p) => {
      const idx = (p / 100) * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
    };

    const lower = percentileValue(this.lowerPercentile);
    const upper = percentileValue(this.upperPercentile);
    params.lowerBound = lower;
    params.upperBound = upper;

    if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue)) {
      return this._nullResult(rawValue, params);
    }

    const range = upper - lower;

    if (range === 0) {
      return {
        rawValue,
        normalizedValue: 0.5,
        method: 'ROBUST_MIN_MAX',
        valid: true,
        params: { ...params, degenerate: true },
      };
    }

    // Winsorize: clip to [lower, upper]
    let winsorized = rawValue;
    let wasClipped = false;
    if (rawValue < lower) {
      winsorized = lower;
      wasClipped = true;
    } else if (rawValue > upper) {
      winsorized = upper;
      wasClipped = true;
    }

    const normalizedValue = (winsorized - lower) / range;

    return {
      rawValue,
      normalizedValue: Math.max(0, Math.min(1, normalizedValue)),
      method: 'ROBUST_MIN_MAX',
      valid: true,
      params: {
        ...params,
        winsorized: wasClipped,
        winsorizedValue: wasClipped ? winsorized : undefined,
      },
    };
  }

  _nullResult(rawValue, params) {
    return {
      rawValue: rawValue !== undefined ? rawValue : null,
      normalizedValue: null,
      method: 'ROBUST_MIN_MAX',
      valid: false,
      params: { ...params, winsorized: false },
    };
  }
}
