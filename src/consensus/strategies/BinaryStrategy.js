/**
 * Binary normalization strategy.
 *
 * Maps boolean values to numeric:
 * - true  → 1
 * - false → 0
 *
 * - null/undefined → normalizedValue = null, valid = false
 * - Non-boolean values → normalizedValue = null, valid = false
 * - Does NOT use any population data.
 */
export class BinaryStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='BINARY']
   */
  constructor(options = {}) {
    this.name = options.name || 'BINARY';
  }

  /**
   * @param {boolean|null} rawValue
   * @param {{ values: number[] }} population — ignored
   * @param {Object} [fieldConfig]
   * @returns {{ rawValue: boolean|null, normalizedValue: number|null, method: string, valid: boolean, params: Object }}
   */
  normalize(rawValue, population, fieldConfig = {}) {
    if (rawValue === null || rawValue === undefined) {
      return {
        rawValue: rawValue !== undefined ? rawValue : null,
        normalizedValue: null,
        method: 'BINARY',
        valid: false,
        params: { populationSize: 0 },
      };
    }

    if (typeof rawValue !== 'boolean') {
      return {
        rawValue,
        normalizedValue: null,
        method: 'BINARY',
        valid: false,
        params: { populationSize: 0, invalidType: typeof rawValue },
      };
    }

    return {
      rawValue,
      normalizedValue: rawValue ? 1 : 0,
      method: 'BINARY',
      valid: true,
      params: { populationSize: 0 },
    };
  }
}
