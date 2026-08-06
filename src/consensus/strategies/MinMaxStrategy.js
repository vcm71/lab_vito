/**
 * Min-Max normalization strategy.
 *
 * Linearly scales values to [0, 1] using the population min and max.
 *
 * - When min === max and there's variation, returns 0.5 for the constant value.
 * - Values outside [min, max] are clamped to 0 or 1.
 * - Non-finite values result in normalizedValue = null.
 */
export class MinMaxStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='MIN_MAX']
   */
  constructor(options = {}) {
    this.name = options.name || 'MIN_MAX';
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
      range: null,
    };

    if (!Array.isArray(population.values) || population.values.length === 0) {
      return this._nullResult(rawValue, 'MIN_MAX', params);
    }

    const valid = population.values.filter(v => Number.isFinite(v));
    params.populationSize = valid.length;

    if (valid.length === 0) {
      return this._nullResult(rawValue, 'MIN_MAX', params);
    }

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min;
    params.min = min;
    params.max = max;
    params.range = range;

    if (rawValue === null || rawValue === undefined || !Number.isFinite(rawValue)) {
      return this._nullResult(rawValue, 'MIN_MAX', params);
    }

    if (range === 0) {
      // All values equal — return 0.5 as neutral midpoint
      return {
        rawValue,
        normalizedValue: 0.5,
        method: 'MIN_MAX',
        valid: true,
        params: { ...params, degenerate: true },
      };
    }

    const normalizedValue = (rawValue - min) / range;

    return {
      rawValue,
      normalizedValue: Math.max(0, Math.min(1, normalizedValue)),
      method: 'MIN_MAX',
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
