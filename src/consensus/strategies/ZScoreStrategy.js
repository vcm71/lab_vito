/**
 * Z-Score normalization strategy.
 *
 * Standardizes values to have mean 0 and standard deviation 1.
 * The normalized value is the raw z-score (not scaled to [0, 1]).
 *
 * - Single-value population: normalizedValue = 0.0 (no deviation possible).
 * - Non-finite values result in normalizedValue = null.
 * - Very large |z| values (e.g. beyond ±10) are still returned as-is.
 */
export class ZScoreStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='Z_SCORE']
   */
  constructor(options = {}) {
    this.name = options.name || 'Z_SCORE';
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
      mean: null,
      std: null,
    };

    if (!Array.isArray(population.values) || population.values.length === 0) {
      return this._nullResult(rawValue, 'Z_SCORE', params);
    }

    const valid = population.values.filter(v => Number.isFinite(v));
    params.populationSize = valid.length;

    if (valid.length === 0) {
      return this._nullResult(rawValue, 'Z_SCORE', params);
    }

    const n = valid.length;
    const sum = valid.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    params.mean = mean;

    if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue)) {
      return this._nullResult(rawValue, 'Z_SCORE', params);
    }

    if (n === 1) {
      return {
        rawValue,
        normalizedValue: 0.0,
        method: 'Z_SCORE',
        valid: true,
        params: { ...params, std: 0, degenerate: true },
      };
    }

    const variance = valid.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    params.std = std;

    if (std === 0) {
      return {
        rawValue,
        normalizedValue: 0.0,
        method: 'Z_SCORE',
        valid: true,
        params: { ...params, degenerate: true },
      };
    }

    return {
      rawValue,
      normalizedValue: (rawValue - mean) / std,
      method: 'Z_SCORE',
      valid: true,
      params,
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
