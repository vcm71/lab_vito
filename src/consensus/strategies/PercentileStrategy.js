/**
 * Percentile (rank-based) normalization strategy.
 *
 * Maps each value to its empirical percentile rank within the population,
 * producing a normalized value in [0, 1].
 *
 * - Ties receive the midpoint of their shared rank interval.
 * - Values outside the population range are clamped to [0, 1].
 * - A population with a single unique value maps everything to 0.5.
 * - Non-finite values (NaN, ±Infinity) are excluded from the population
 *   and result in normalizedValue = null.
 */
export class PercentileStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='PERCENTILE']
   */
  constructor(options = {}) {
    this.name = options.name || 'PERCENTILE';
  }

  /**
   * @param {number|null} rawValue
   * @param {{ values: number[] }} population — all valid numeric values
   * @param {Object} [fieldConfig]
   * @returns {{ rawValue: number|null, normalizedValue: number|null, method: string, valid: boolean, params: Object }}
   */
  normalize(rawValue, population, fieldConfig = {}) {
    const params = {
      populationSize: 0,
      uniqueCount: 0,
      excludedCount: 0,
      min: null,
      max: null,
    };

    if (!Array.isArray(population.values) || population.values.length === 0) {
      return this._nullResult(rawValue, 'PERCENTILE', params);
    }

    const valid = population.values.filter(v => Number.isFinite(v));
    params.populationSize = valid.length;

    if (valid.length === 0) {
      return this._nullResult(rawValue, 'PERCENTILE', params);
    }

    const sorted = [...valid].sort((a, b) => a - b);
    params.min = sorted[0];
    params.max = sorted[sorted.length - 1];
    params.uniqueCount = new Set(sorted).size;

    if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue)) {
      return this._nullResult(rawValue, 'PERCENTILE', params);
    }

    if (sorted.length === 1) {
      // Single unique value: all map to 0.5
      return {
        rawValue,
        normalizedValue: 0.5,
        method: 'PERCENTILE',
        valid: true,
        params,
      };
    }

    // Find rank — use midrank for ties
    let below = 0;
    let same = 0;

    for (const v of sorted) {
      if (v < rawValue) below++;
      else if (v === rawValue) same++;
      else break;
    }

    if (same === 0) {
      // Value not in population — extrapolate
      const result = rawValue <= sorted[0] ? 0.0 : 1.0;
      return {
        rawValue,
        normalizedValue: result,
        method: 'PERCENTILE',
        valid: true,
        params: { ...params, extrapolated: true },
      };
    }

    // Midrank: normalize below + (same - 1)/2 into [0, 1]
    const rank = below + (same - 1) / 2;
    const normalizedValue = rank / (sorted.length - 1);

    return {
      rawValue,
      normalizedValue: Math.max(0, Math.min(1, normalizedValue)),
      method: 'PERCENTILE',
      valid: true,
      params: { ...params, rank, same, below },
    };
  }

  _nullResult(rawValue, method, params) {
    return {
      rawValue: rawValue !== undefined ? rawValue : null,
      normalizedValue: null,
      method,
      valid: false,
      params,
    };
  }
}
