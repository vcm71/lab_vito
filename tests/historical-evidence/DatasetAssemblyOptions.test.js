/**
 * DatasetAssemblyOptions tests (Fase 2.3.3).
 *
 * Covers normalisation (sorted/deduped arrays, frozen), defaults,
 * validation of timestamps / policies / from≤to, and schema versioning.
 */

import { describe, it, expect } from 'vitest';
import {
  createDatasetAssemblyOptions,
  InvalidDatasetOptionsError,
} from '../../src/historical-evidence/index.js';

describe('createDatasetAssemblyOptions', () => {
  it('returns frozen defaults when no options are given', () => {
    const opts = createDatasetAssemblyOptions(null);
    expect(opts).toEqual({
      schemaVersion: '1',
      includeCalibrationStrategies: null,
      excludeCalibrationStrategies: null,
      includeTargetTypes: null,
      predictionCreatedFrom: null,
      predictionCreatedTo: null,
      outcomeRecordedFrom: null,
      outcomeRecordedTo: null,
      requireCalibration: false,
      requireModelIdentity: false,
      duplicatePolicy: 'REJECT',
      unsupportedSchemaPolicy: 'REJECT_DATASET',
      invalidObservationPolicy: 'REJECT_DATASET',
      allowEmpty: false,
    });
    expect(Object.isFrozen(opts)).toBe(true);
  });

  it('normalises arrays: sorted, deduped, frozen', () => {
    const opts = createDatasetAssemblyOptions({
      includeCalibrationStrategies: ['b', 'a', 'b'],
      includeTargetTypes: ['NUMBER', 'NUMBER'],
    });
    expect(opts.includeCalibrationStrategies).toEqual(['a', 'b']);
    expect(opts.includeTargetTypes).toEqual(['NUMBER']);
    expect(Object.isFrozen(opts.includeCalibrationStrategies)).toBe(true);
    expect(Object.isFrozen(opts.includeTargetTypes)).toBe(true);
  });

  it('rejects non-string entries in strategy/target lists', () => {
    expect(() =>
      createDatasetAssemblyOptions({ includeCalibrationStrategies: ['a', 7] }),
    ).toThrow(InvalidDatasetOptionsError);
    expect(() =>
      createDatasetAssemblyOptions({ includeTargetTypes: [null] }),
    ).toThrow(InvalidDatasetOptionsError);
  });

  it('rejects invalid ISO timestamps', () => {
    expect(() =>
      createDatasetAssemblyOptions({ predictionCreatedFrom: 'ayer' }),
    ).toThrow(InvalidDatasetOptionsError);
    expect(() =>
      createDatasetAssemblyOptions({ outcomeRecordedTo: '2026-13-99' }),
    ).toThrow(InvalidDatasetOptionsError);
  });

  it('rejects from > to for the same axis (inclusive policy documented)', () => {
    expect(() =>
      createDatasetAssemblyOptions({
        predictionCreatedFrom: '2026-02-01T00:00:00.000Z',
        predictionCreatedTo: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow(InvalidDatasetOptionsError);
    expect(() =>
      createDatasetAssemblyOptions({
        outcomeRecordedFrom: '2026-02-01T00:00:00.000Z',
        outcomeRecordedTo: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow(InvalidDatasetOptionsError);
  });

  it('accepts from === to (boundaries are inclusive)', () => {
    const opts = createDatasetAssemblyOptions({
      predictionCreatedFrom: '2026-01-01T00:00:00.000Z',
      predictionCreatedTo: '2026-01-01T00:00:00.000Z',
    });
    expect(opts.predictionCreatedFrom).toBe('2026-01-01T00:00:00.000Z');
    expect(opts.predictionCreatedTo).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects non-boolean flag values', () => {
    expect(() =>
      createDatasetAssemblyOptions({ requireCalibration: 'yes' }),
    ).toThrow(InvalidDatasetOptionsError);
    expect(() =>
      createDatasetAssemblyOptions({ requireModelIdentity: 1 }),
    ).toThrow(InvalidDatasetOptionsError);
    expect(() =>
      createDatasetAssemblyOptions({ allowEmpty: 'true' }),
    ).toThrow(InvalidDatasetOptionsError);
  });

  it('rejects unsupported policies', () => {
    expect(() =>
      createDatasetAssemblyOptions({ duplicatePolicy: 'DEDUPE' }),
    ).toThrow(InvalidDatasetOptionsError);
    expect(() =>
      createDatasetAssemblyOptions({ invalidObservationPolicy: 'IGNORE' }),
    ).toThrow(InvalidDatasetOptionsError);
  });

  it('rejects an unsupported options schemaVersion (no silent migration)', () => {
    expect(() =>
      createDatasetAssemblyOptions({ schemaVersion: '2' }),
    ).toThrow(InvalidDatasetOptionsError);
  });

  it('accepts an already-normalised options object (idempotent)', () => {
    const first = createDatasetAssemblyOptions({
      includeTargetTypes: ['NUMBER'],
      requireCalibration: true,
    });
    const second = createDatasetAssemblyOptions(first);
    expect(second).toEqual(first);
  });
});
