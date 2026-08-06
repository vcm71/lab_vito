import { describe, it, expect } from 'vitest';
import { CalibrationModel } from '../../src/calibration/CalibrationModel.js';

describe('CalibrationModel — SHA-256 hash', () => {
  it('produces SHA-256 hash instead of legacy djb2', () => {
    const hash = CalibrationModel.computeHash(
      { a: 1, b: 0.05 },
      'v1.0.0',
      'BetaCalibration',
      '1.2.0',
    );

    // SHA-256 is 64 hex chars
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic across identical inputs', () => {
    const h1 = CalibrationModel.computeHash({ slope: 1.0 }, 'v1', 'Platt', 'v1');
    const h2 = CalibrationModel.computeHash({ slope: 1.0 }, 'v1', 'Platt', 'v1');
    expect(h1).toBe(h2);
  });

  it('detects parameter changes', () => {
    const h1 = CalibrationModel.computeHash({ slope: 1.0 }, 'v1', 'Platt', 'v1');
    const h2 = CalibrationModel.computeHash({ slope: 1.01 }, 'v1', 'Platt', 'v1');
    expect(h1).not.toBe(h2);
  });

  it('detects strategy changes', () => {
    const h1 = CalibrationModel.computeHash({}, 'v1', 'Beta', 'v1');
    const h2 = CalibrationModel.computeHash({}, 'v1', 'Platt', 'v1');
    expect(h1).not.toBe(h2);
  });

  it('detects datasetVersion changes', () => {
    const h1 = CalibrationModel.computeHash({}, 'v1.0.0', 'Beta', 'v1');
    const h2 = CalibrationModel.computeHash({}, 'v1.0.1', 'Beta', 'v1');
    expect(h1).not.toBe(h2);
  });

  it('is distinct from legacy djb2 format', () => {
    const hash = CalibrationModel.computeHash({ test: 1 }, 'v1', 'Test', 'v1');
    // Legacy djb2 produced decimal numbers like 1970425681
    expect(hash).not.toMatch(/^\d+$/);
    expect(hash.length).toBe(64);
  });
});
