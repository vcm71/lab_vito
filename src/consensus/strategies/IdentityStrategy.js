/**
 * Identity / pass-through strategy.
 *
 * Returns the raw value unchanged. Useful for signals that are already
 * normalized (e.g. probabilities, ratios in [0, 1]).
 *
 * - Valid iff the raw value is a finite number.
 * - Does NOT alter or rescale the value.
 */
export class IdentityStrategy {
  /**
   * @param {Object} [options]
   * @param {string} [options.name='IDENTITY']
   */
  constructor(options = {}) {
    this.name = options.name || 'IDENTITY';
  }

  /**
   * @param {number|null} rawValue
   * @param {{ values: number[] }} population — ignored by identity
   * @param {Object} [fieldConfig]
   * @returns {{ rawValue: number|null, normalizedValue: number|null, method: string, valid: boolean, params: Object }}
   */
  normalize(rawValue, population, fieldConfig = {}) {
    const valid = (rawValue !== null && rawValue !== undefined && Number.isFinite(rawValue));
    return {
      rawValue: rawValue !== undefined ? rawValue : null,
      normalizedValue: valid ? rawValue : null,
      method: 'IDENTITY',
      valid,
      params: { populationSize: 0 },
    };
  }
}
