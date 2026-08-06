/**
 * DatasetSnapshotDescriptor tests (Fase 2.3.4.1).
 *
 * Covers: creation from real dataset-derived fixtures (manifest, statistics,
 * period built with DatasetBuilder — no invented hashes), field presence,
 * no observation duplication, deep immutability (no mutable arrays),
 * all-or-nothing validation (identity, createdAt, period, manifest,
 * statistics, policies, filters, provenance, lineage, metadata),
 * deterministic serialisation and metadata via normaliseMetadata.
 */

import { describe, it, expect } from 'vitest';
import {
  DatasetBuilder,
  createCalibrationObservation,
  createNumberTarget,
  createDatasetIdentity,
  createDatasetVersion,
  createDatasetSnapshotDescriptor,
  InvalidSnapshotDescriptorError,
  InvalidMetadataError,
  deepFreeze,
} from '../../src/historical-evidence/index.js';

const T = (n) => createNumberTarget(n);

const observation = (overrides = {}) =>
  createCalibrationObservation({
    observationId: 'obs-1',
    predictionId: 'p-1',
    outcomeId: 'o-1',
    spinId: 'spin-1',
    target: T('17'),
    rawConsensusScore: 0.72,
    calibration: { probability: 0.7, strategyName: 'isotonic', modelId: 'm1' },
    observedOutcome: 1,
    predictionCreatedAt: '2026-01-01T00:00:00.000Z',
    outcomeRecordedAt: '2026-01-01T00:00:05.000Z',
    observationCreatedAt: '2026-01-01T00:00:05.000Z',
    ...overrides,
  });

const builder = new DatasetBuilder();

/** Build a real dataset (deterministic hashes from the canonical pipeline). */
function buildRealDataset() {
  return builder.buildDataset({
    datasetId: 'ds-001',
    observations: [
      observation(),
      observation({ observationId: 'obs-2', predictionId: 'p-2', outcomeId: 'o-2', spinId: 'spin-2', rawConsensusScore: 0.31, calibration: { probability: 0.3, strategyName: 'isotonic', modelId: 'm1' }, observedOutcome: 0 }),
    ],
    createdAt: '2026-01-02T00:00:00.000Z',
  });
}

const VALID_IDENTITY = () =>
  createDatasetIdentity({
    datasetId: 'ds-001',
    datasetVersion: createDatasetVersion(1, 0, 0),
    schemaVersion: '1',
    observationSchemaVersion: '1',
    contentHash: 'a'.repeat(64),
    manifestHash: 'b'.repeat(64),
  });

const CREATED_AT = '2026-01-03T00:00:00.000Z';

/** Build a descriptor over a real dataset with a valid identity. */
function validDescriptor(overrides = {}, dataset = buildRealDataset()) {
  return createDatasetSnapshotDescriptor({
    identity: VALID_IDENTITY(),
    createdAt: CREATED_AT,
    period: dataset.period,
    manifest: dataset.manifest,
    statistics: dataset.statistics,
    ...overrides,
  });
}

describe('DatasetSnapshotDescriptor — creation', () => {
  it('creates a descriptor with identity, createdAt, period, manifest and statistics', () => {
    const dataset = buildRealDataset();
    const d = validDescriptor({}, dataset);
    expect(d.identity).toEqual(VALID_IDENTITY());
    expect(d.createdAt).toBe(CREATED_AT);
    expect(d.period).toEqual(dataset.period);
    expect(d.manifest).toBe(dataset.manifest);
    expect(d.statistics).toBe(dataset.statistics);
  });

  it('references the frozen manifest/statistics (no duplication of observations)', () => {
    const dataset = buildRealDataset();
    const d = validDescriptor({}, dataset);
    expect(d.manifest).toBe(dataset.manifest);
    expect(d.statistics).toBe(dataset.statistics);
    expect('observations' in d).toBe(false);
    expect(Object.isFrozen(d.manifest)).toBe(true);
    expect(Object.isFrozen(d.statistics)).toBe(true);
  });

  it('defaults optional fields to null / frozen empty collections', () => {
    const d = validDescriptor();
    expect(d.policies).toBeNull();
    expect(d.filters).toBeNull();
    expect(d.provenance).toBeNull();
    expect(d.lineage).toBeNull();
    expect(d.metadata).toBeNull();
  });

  it('deep-frozen policy and filter copies with no mutable aliasing', () => {
    const filters = [{ field: 'target', op: 'equals', value: 17 }];
    const d = validDescriptor({
      policies: { duplicatePolicy: 'REJECT', invalidObservationPolicy: 'EXCLUDE', unsupportedSchemaPolicy: 'REJECT_DATASET', temporalPolicy: 'INCLUSIVE_FROM_TO' },
      filters,
    });
    expect(d.policies).toEqual({ duplicatePolicy: 'REJECT', invalidObservationPolicy: 'EXCLUDE', unsupportedSchemaPolicy: 'REJECT_DATASET', temporalPolicy: 'INCLUSIVE_FROM_TO' });
    expect(d.filters).toEqual(filters);
    expect(Object.isFrozen(d.policies)).toBe(true);
    expect(Object.isFrozen(d.filters)).toBe(true);
    expect(d.filters).not.toBe(filters);
    expect(() => {
      'use strict';
      d.filters[0].value = 99;
    }).toThrow(TypeError);
    expect(filters[0].value).toBe(17);
  });

  it('accepts provenance with all optional fields and normalises nulls', () => {
    const parent = createDatasetVersion(0, 9, 0);
    const d = validDescriptor({
      provenance: {
        sourceDatasetId: 'ds-000',
        sourceContentHash: 'c'.repeat(64),
        parentDatasetVersion: parent,
        assemblyReason: 'baseline',
        transformationType: 'none',
      },
    });
    expect(d.provenance).toEqual({
      sourceDatasetId: 'ds-000',
      sourceContentHash: 'c'.repeat(64),
      parentDatasetVersion: { major: 0, minor: 9, patch: 0 },
      assemblyReason: 'baseline',
      transformationType: 'none',
    });
    expect(Object.isFrozen(d.provenance)).toBe(true);
  });

  it('normalises absent provenance fields to null', () => {
    const d = validDescriptor({ provenance: { sourceDatasetId: 'ds-000' } });
    expect(d.provenance.sourceDatasetId).toBe('ds-000');
    expect(d.provenance.sourceContentHash).toBeNull();
    expect(d.provenance.parentDatasetVersion).toBeNull();
    expect(d.provenance.assemblyReason).toBeNull();
    expect(d.provenance.transformationType).toBeNull();
  });

  it('accepts a minimal lineage list of frozen ancestor references', () => {
    const d = validDescriptor({
      lineage: [
        {
          datasetId: 'ds-000',
          contentHash: 'c'.repeat(64),
          datasetVersion: createDatasetVersion(0, 9, 0),
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    expect(d.lineage).toHaveLength(1);
    expect(d.lineage[0].datasetId).toBe('ds-000');
    expect(Object.isFrozen(d.lineage)).toBe(true);
    expect(Object.isFrozen(d.lineage[0])).toBe(true);
  });

  it('normalises metadata via normaliseMetadata and freezes it', () => {
    const d = validDescriptor({ metadata: { source: 'test', tags: ['a', 'b'] } });
    expect(d.metadata).toEqual({ source: 'test', tags: ['a', 'b'] });
    expect(Object.isFrozen(d.metadata)).toBe(true);
    expect(Object.isFrozen(d.metadata.tags)).toBe(true);
  });

  it('is deeply frozen and deterministic', () => {
    const d = validDescriptor();
    expect(Object.isFrozen(d)).toBe(true);
    expect(Object.isFrozen(d.period)).toBe(true);
    expect(Object.isFrozen(d.identity)).toBe(true);
    expect(deepFreeze(d)).toBe(d);
    expect(validDescriptor()).toEqual(validDescriptor());
  });

  it('serialises deterministically to JSON', () => {
    const a = JSON.stringify(validDescriptor());
    const b = JSON.stringify(validDescriptor());
    expect(a).toBe(b);
  });
});

describe('DatasetSnapshotDescriptor — all-or-nothing validation', () => {
  it('rejects an invalid identity', () => {
    expect(() => validDescriptor({ identity: null })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ identity: { datasetId: 'x' } })).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects an invalid createdAt', () => {
    expect(() => validDescriptor({ createdAt: undefined })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ createdAt: '2026-13-01' })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ createdAt: 'not-a-date' })).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects an invalid period shape', () => {
    expect(() => validDescriptor({ period: null })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ period: {} })).toThrow(InvalidSnapshotDescriptorError);
    expect(() =>
      validDescriptor({
        period: {
          predictionCreatedFrom: 'not-a-date',
          predictionCreatedTo: '2026-01-01T00:00:00.000Z',
          outcomeRecordedFrom: '2026-01-01T00:00:00.000Z',
          outcomeRecordedTo: '2026-01-01T00:00:05.000Z',
        },
      }),
    ).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects a missing manifest or statistics', () => {
    expect(() => validDescriptor({ manifest: null })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ statistics: undefined })).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects non-object policies and non-array filters', () => {
    expect(() => validDescriptor({ policies: 'x' })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ policies: [] })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ filters: 'x' })).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects invalid provenance fields', () => {
    expect(() => validDescriptor({ provenance: 'x' })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ provenance: { sourceContentHash: 'zzz' } })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ provenance: { parentDatasetVersion: '1.0.0' } })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ provenance: { sourceDatasetId: '' } })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ provenance: { assemblyReason: 123 } })).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects invalid lineage entries', () => {
    expect(() => validDescriptor({ lineage: 'x' })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => validDescriptor({ lineage: [null] })).toThrow(InvalidSnapshotDescriptorError);
    expect(() =>
      validDescriptor({ lineage: [{ datasetId: 'ds-000', contentHash: 'x', datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-01T00:00:00.000Z' }] }),
    ).toThrow(InvalidSnapshotDescriptorError);
    expect(() =>
      validDescriptor({ lineage: [{ datasetId: 'ds-000', contentHash: 'c'.repeat(64), datasetVersion: null, createdAt: '2026-01-01T00:00:00.000Z' }] }),
    ).toThrow(InvalidSnapshotDescriptorError);
    expect(() =>
      validDescriptor({ lineage: [{ datasetId: 'ds-000', contentHash: 'c'.repeat(64), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: 'bad' }] }),
    ).toThrow(InvalidSnapshotDescriptorError);
  });

  it('propagates InvalidMetadataError for invalid metadata (safe utility)', () => {
    expect(() => validDescriptor({ metadata: { nested: () => {} } })).toThrow(InvalidMetadataError);
    expect(() => validDescriptor({ metadata: { nested: new Date() } })).toThrow(InvalidMetadataError);
  });
});
