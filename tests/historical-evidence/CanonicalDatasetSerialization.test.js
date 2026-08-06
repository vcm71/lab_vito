/**
 * Canonical dataset serialization tests (Fase 2.3.4.2).
 *
 * Covers the explicit projections used for scientific datasets, identities
 * and snapshot descriptors. The goal is to keep the canonical hash stable
 * while rejecting hidden coercions and keeping operational fields out of the
 * scientific projection.
 */

import { describe, it, expect } from 'vitest';
import {
  DatasetBuilder,
  createCalibrationObservation,
  createDatasetIdentity,
  createDatasetSnapshotDescriptor,
  createDatasetVersion,
  createNumberTarget,
  serializeScientificDataset,
  serializeDatasetIdentity,
  serializeDatasetManifest,
  serializeDatasetStatistics,
  serializeDatasetSnapshotDescriptor,
  InvalidSnapshotDescriptorError,
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

function buildDataset(datasetId, createdAt) {
  const builder = new DatasetBuilder();
  return builder.buildDataset({
    datasetId,
    observations: [
      observation(),
      observation({
        observationId: 'obs-2',
        predictionId: 'p-2',
        outcomeId: 'o-2',
        spinId: 'spin-2',
        rawConsensusScore: 0.31,
        calibration: { probability: 0.3, strategyName: 'isotonic', modelId: 'm1' },
        observedOutcome: 0,
      }),
    ],
    createdAt,
  });
}

function buildIdentity(datasetId = 'ds-001') {
  return createDatasetIdentity({
    datasetId,
    datasetVersion: createDatasetVersion(1, 0, 0),
    schemaVersion: '1',
    observationSchemaVersion: '1',
    contentHash: 'a'.repeat(64),
    manifestHash: 'b'.repeat(64),
  });
}

describe('Canonical dataset serialization', () => {
  it('serializes the scientific dataset projection deterministically and excludes operational fields', () => {
    const a = buildDataset('ds-001', '2026-01-02T00:00:00.000Z');
    const b = buildDataset('ds-999', '2026-02-02T00:00:00.000Z');

    const sa = serializeScientificDataset(a);
    const sb = serializeScientificDataset(b);

    expect(sa).toBe(sb);

    const parsed = JSON.parse(sa);
    expect(Object.keys(parsed).sort()).toEqual(['observationSchemaVersion', 'observations', 'period', 'schemaVersion']);
    expect(parsed.schemaVersion).toBe('1');
    expect(parsed.observationSchemaVersion).toBe('1');
    expect(Array.isArray(parsed.observations)).toBe(true);
    expect(parsed.period).toEqual(a.period);
    expect(parsed.datasetId).toBeUndefined();
    expect(parsed.createdAt).toBeUndefined();
    expect(parsed.manifest).toBeUndefined();
    expect(parsed.statistics).toBeUndefined();
  });

  it('serializes dataset identities with a string datasetVersion and no mutable references', () => {
    const identity = buildIdentity();
    const parsed = JSON.parse(serializeDatasetIdentity(identity));

    expect(parsed.datasetId).toBe('ds-001');
    expect(parsed.datasetVersion).toBe('1.0.0');
    expect(parsed.schemaVersion).toBe('1');
    expect(parsed.observationSchemaVersion).toBe('1');
    expect(parsed.contentHash).toBe('a'.repeat(64));
    expect(parsed.manifestHash).toBe('b'.repeat(64));
  });

  it('serializes snapshot descriptors explicitly, including null defaults for optional fields', () => {
    const dataset = buildDataset('ds-001', '2026-01-02T00:00:00.000Z');
    const descriptor = createDatasetSnapshotDescriptor({
      identity: buildIdentity(),
      createdAt: '2026-01-03T00:00:00.000Z',
      period: dataset.period,
      manifest: dataset.manifest,
      statistics: dataset.statistics,
      provenance: { sourceDatasetId: 'ds-000' },
    });

    const parsed = JSON.parse(serializeDatasetSnapshotDescriptor(descriptor));
    expect(parsed.identity.datasetVersion).toBe('1.0.0');
    expect(parsed.identity.datasetId).toBe('ds-001');
    expect(parsed.createdAt).toBe('2026-01-03T00:00:00.000Z');
    expect(parsed.period).toEqual(dataset.period);
    expect(parsed.manifest).toEqual(dataset.manifest);
    expect(parsed.statistics).toEqual(dataset.statistics);
    expect(parsed.policies).toBeNull();
    expect(parsed.filters).toBeNull();
    expect(parsed.metadata).toBeNull();
    expect(parsed.provenance.sourceDatasetId).toBe('ds-000');
    expect(parsed.lineage).toBeNull();
  });

  it('serializes manifest and statistics as stable JSON strings', () => {
    const dataset = buildDataset('ds-001', '2026-01-02T00:00:00.000Z');
    expect(JSON.parse(serializeDatasetManifest(dataset.manifest))).toEqual(dataset.manifest);
    expect(JSON.parse(serializeDatasetStatistics(dataset.statistics))).toEqual(dataset.statistics);
  });

  it('rejects invalid snapshot descriptors before serialization', () => {
    expect(() => serializeDatasetSnapshotDescriptor(null)).toThrow(TypeError);
    expect(() =>
      serializeDatasetSnapshotDescriptor({
        identity: null,
        createdAt: '2026-01-03T00:00:00.000Z',
        period: {},
        manifest: {},
        statistics: {},
      }),
    ).toThrow(InvalidSnapshotDescriptorError);
  });
});
