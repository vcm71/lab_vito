/**
 * Categorical normalization strategy.
 *
 * Preserves the original string value without imposing a numeric hierarchy.
 *
 * - The raw value is returned as the normalized value.
 * - For ordinal categories with a formal ranking map, a configurable `mapping`
 *   can be provided to map strings to numeric values.
 * - Without a mapping, the value is preserved as-is and marked with valid=false
 *   if it's not a string, or valid=nullMeaning (string preserved but not numeric).
 */
export class CategoricalStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='CATEGORICAL']
   * @param {Object<string, number>} [options.mapping] — optional ordinal mapping
   */
  constructor(options = {}) {
    this.name = options.name || 'CATEGORICAL';
    this.mapping = options.mapping && typeof options.mapping === 'object'
      ? Object.freeze({ ...options.mapping })
      : null;
  }

  /**
   * @param {string|null} rawValue
   * @param {{ values: number[] }} population — ignored
   * @param {Object} [fieldConfig]
   * @returns {{ rawValue: string|null, normalizedValue: string|number|null, method: string, valid: boolean, params: Object }}
   */
  normalize(rawValue, population, fieldConfig = {}) {
    const params = { populationSize: 0, hasMapping: this.mapping !== null };

    if (rawValue === null || rawValue === undefined) {
      return {
        rawValue: rawValue !== undefined ? rawValue : null,
        normalizedValue: null,
        method: 'CATEGORICAL',
        valid: false,
        params,
      };
    }

    if (typeof rawValue !== 'string') {
      return {
        rawValue,
        normalizedValue: null,
        method: 'CATEGORICAL',
        valid: false,
        params: { ...params, invalidType: typeof rawValue },
      };
    }

    if (this.mapping) {
      if (Object.prototype.hasOwnProperty.call(this.mapping, rawValue)) {
        return {
          rawValue,
          normalizedValue: this.mapping[rawValue],
          method: 'CATEGORICAL',
          valid: true,
          params,
        };
      }
      // Value not in mapping
      return {
        rawValue,
        normalizedValue: rawValue,
        method: 'CATEGORICAL',
        valid: false,
        params: { ...params, unmapped: true },
      };
    }

    // No mapping: preserve string, mark as not numerically comparable
    return {
      rawValue,
      normalizedValue: rawValue,
      method: 'CATEGORICAL',
      valid: false, // Not numerically comparable
      params: { ...params, reason: 'No ordinal mapping defined.' },
    };
  }
}
