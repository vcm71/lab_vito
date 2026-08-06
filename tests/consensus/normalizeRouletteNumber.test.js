import { describe, expect, it } from 'vitest';
import { normalizeRouletteNumber } from '../../src/consensus/index.js';

describe('normalizeRouletteNumber', () => {
  it.each([
    [0, '0'],
    ['0', '0'],
    ['00', '00'],
    [1, '1'],
    ['36', '36'],
  ])('accepts %s and returns %s', (input, expected) => {
    expect(normalizeRouletteNumber(input)).toBe(expected);
  });

  it.each([
    -1,
    37,
    '37',
    '000',
    'abc',
    null,
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects %s', input => {
    expect(() => normalizeRouletteNumber(input)).toThrow();
  });
});
