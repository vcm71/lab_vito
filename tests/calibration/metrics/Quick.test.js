import { describe, it, expect } from 'vitest';
import { brierScore, logLoss } from '../../../src/calibration/index.js';

describe('quick metrics check', () => {
  it('brierScore', () => expect(brierScore([0,1],[0,1])).toBe(0));
  it('logLoss', () => expect(logLoss([],[])).toBe(0));
});
