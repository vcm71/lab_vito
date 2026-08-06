/**
 * Normalize an American roulette number to a canonical string.
 *
 * Accepts 0, "0", "00", and integers from 1 to 36. Rejects any value that
 * would conflate "0" with "00" or fall outside the wheel domain.
 *
 * @param {number|string} value
 * @returns {string}
 */
export function normalizeRouletteNumber(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new TypeError('normalizeRouletteNumber: expected a finite integer number.');
    }

    if (value === 0) {
      return '0';
    }

    if (value >= 1 && value <= 36) {
      return String(value);
    }

    throw new RangeError('normalizeRouletteNumber: number must be between 0 and 36.');
  }

  if (typeof value === 'string') {
    if (value === '0' || value === '00') {
      return value;
    }

    if (!/^(?:[1-9]|[12]\d|3[0-6])$/.test(value)) {
      if (/^\d+$/.test(value)) {
        throw new RangeError('normalizeRouletteNumber: string number must be between 0 and 36.');
      }

      throw new TypeError('normalizeRouletteNumber: expected "0", "00", or a canonical integer string.');
    }

    return value;
  }

  throw new TypeError('normalizeRouletteNumber: expected a number or string.');
}
