import { describe, expect, it } from 'vitest';
import {
  AMERICAN_WHEEL_ORDER,
  BLACK_NUMBERS,
  NUM_META,
  RED_NUMBERS,
  getColumn,
  getColor,
  getDozen,
  getHighLow,
  getParity,
  getWheelDistance,
} from '../../../src/utils/numberMeta.js';

describe('numberMeta', () => {
  it('exposes American wheel metadata for known numbers', () => {
    expect(AMERICAN_WHEEL_ORDER).toHaveLength(38);
    expect(RED_NUMBERS).toContain('1');
    expect(BLACK_NUMBERS).toContain('2');
    expect(NUM_META['00']).toMatchObject({ color: 'green', parity: null, hl: null, dozen: null, column: null });
    expect(NUM_META['36']).toMatchObject({ color: 'red', parity: 'even', hl: 'high', dozen: 3, column: 3 });
  });

  it('resolves color, parity, high/low, dozen and column', () => {
    expect(getColor('1')).toBe('red');
    expect(getParity('2')).toBe('even');
    expect(getHighLow('18')).toBe('low');
    expect(getDozen('24')).toBe(2);
    expect(getColumn('11')).toBe(2);
  });

  it('returns safe fallbacks for unknown inputs', () => {
    expect(getColor('99')).toBe('unknown');
    expect(getParity('99')).toBeNull();
    expect(getHighLow('99')).toBeNull();
    expect(getDozen('99')).toBeNull();
    expect(getColumn('99')).toBeNull();
  });

  it('computes wheel distance with wraparound', () => {
    expect(getWheelDistance('00', '27')).toBe(1);
    expect(getWheelDistance('00', '1')).toBe(1);
    expect(getWheelDistance('0', '00')).toBe(19);
    expect(getWheelDistance('1', 'not-a-number')).toBeNull();
  });
});
