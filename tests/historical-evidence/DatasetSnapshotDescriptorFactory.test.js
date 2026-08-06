/**
 * DatasetSnapshotDescriptorFactory integration tests (Fase 2.3.4.1).
 *
 * Covers the full derivation chain against the REAL assembly pipeline
 * (DatasetBuilder): HistoricalCalibrationDataset → DatasetIdentity →
 * DatasetSnapshotDescriptor. Validates identity derivation from dataset
 * fields, policy/filter propagation, no mutation of the source dataset,
 * scientific vs operational equivalence across rebuilt datasets and
 * all-or-nothing typed failures.
 */

import { describe, it, expect } from 'vitest';
import {
  DatasetBuilder,
  DatasetSnapshotDescriptorFactory,
  SNAPSHOT_TEMPORAL_POLICY,
  createCalibrationObservation,
  createNumberTarget,
  createDatasetVersion,
  parseDatasetVersion,
  isDatasetIdentityScientificallyEquivalent,
  isDatasetIdentityOperationallyEquivalent,
  InvalidDatasetVersionError,
  InvalidDatasetTimestampError,
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

const builder = new DatasetBuilder();
const factory = new DatasetSnapshotDescriptorFactory();

const observations = () => [
  observation(),
  observation({ observationId: 'obs-2', predictionId: 'p-2', outcomeId: 'o-2', spinId: 'spin-2', rawConsensusScore: 0.31, calibration: { probability: 0.3, strategyName: 'isotonic', modelId: 'm1' }, observedOutcome: 0 }),
];

/** Build a real dataset; deterministic hashes come from the canonical pipeline. */
function buildDataset(datasetId = 'ds-001') {
  return builder.buildDataset({
    datasetId,
    observations: observations(),
    createdAt: '2026-01-02T00:00:00.000Z',
  });
}

describe('DatasetSnapshotDescriptorFactory — identity derivation', () => {
  it('derives identity fields from the real dataset without recomputing hashes', () => {
    const dataset = buildDataset();
    const descriptor = factory.create({
      dataset: dataset,
      datasetVersion: parseDatasetVersion('1.0.0'),
      createdAt: '2026-01-03T00:00:00.000Z',
    });
    const identity = descriptor.identity;
    expect(identity.datasetId).toBe(dataset.datasetId);
    expect(identity.datasetVersion).toEqual({ major: 1, minor: 0, patch: 0 });
    expect(identity.schemaVersion).toBe(dataset.schemaVersion);
    expect(identity.observationSchemaVersion).toBe(dataset.observationSchemaVersion);
    expect(identity.contentHash).toBe(dataset.contentHash);
    expect(identity.manifestHash).toBe(dataset.manifestHash);
  });

  it('references the dataset manifest/statistics/period without duplicating observations', () => {
    const dataset = buildDataset();
    const descriptor = factory.create({
      dataset: dataset,
      datasetVersion: createDatasetVersion(1, 0, 0),
      createdAt: '2026-01-03T00:00:00.000Z',
    });
    expect(descriptor.manifest).toBe(dataset.manifest);
    expect(descriptor.statistics).toBe(dataset.statistics);
    expect(descriptor.period).toEqual(dataset.period);
    expect('observations' in descriptor).toBe(false);
  });

  it('propagates applied policies and filters from the real manifest options', () => {
    const dataset = buildDataset();
    const descriptor = factory.create({
      dataset: dataset,
      datasetVersion: createDatasetVersion(1, 0, 0),
      createdAt: '2026-01-03T00:00:00.000Z',
    });
    expect(descriptor.policies.duplicatePolicy).toBe(dataset.manifest.options.duplicatePolicy);
    expect(descriptor.policies.invalidObservationPolicy).toBe(dataset.manifest.options.invalidObservationPolicy);
    expect(descriptor.policies.unsupportedSchemaPolicy).toBe(dataset.manifest.options.unsupportedSchemaPolicy);
    expect(descriptor.policies.temporalPolicy).toBe(SNAPSHOT_TEMPORAL_POLICY);
    expect(descriptor.filters).toEqual(dataset.manifest.filters);
    expect(Object.isFrozen(descriptor.policies)).toBe(true);
    expect(Object.isFrozen(descriptor.filters)).toBe(true);
  });

  it('accepts provenance and lineage pass-through', () => {
    const descriptor = factory.create({
      dataset: buildDataset(),
      datasetVersion: createDatasetVersion(1, 0, 0),
      createdAt: '2026-01-03T00:00:00.000Z',
      provenance: { sourceDatasetId: 'ds-000', sourceContentHash: 'c'.repeat(64), parentDatasetVersion: createDatasetVersion(0, 9, 0), assemblyReason: 'baseline', transformationType: 'none' },
      lineage: [{ datasetId: 'ds-000', contentHash: 'c'.repeat(64), datasetVersion: createDatasetVersion(0, 9, 0), createdAt: '2026-01-01T00:00:00.000Z' }],
      metadata: { source: 'factory-test' },
    });
    expect(descriptor.provenance.sourceDatasetId).toBe('ds-000');
    expect(descriptor.lineage).toHaveLength(1);
    expect(descriptor.metadata).toEqual({ source: 'factory-test' });
  });

  it('does not mutate the source dataset', () => {
    const dataset = buildDataset();
    const before = JSON.stringify(dataset);
    factory.create({ dataset, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' });
    expect(JSON.stringify(dataset)).toBe(before);
    expect(Object.isFrozen(dataset)).toBe(true);
  });

  it('produces deterministic descriptors for identical inputs', () => {
    const a = factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' });
    const b = factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('DatasetSnapshotDescriptorFactory — scientific vs operational equivalence', () => {
  it('rebuilding identical content under a different datasetId is scientifically equivalent', () => {
    const dsA = buildDataset('ds-001');
    const dsB = buildDataset('ds-002');
    const idA = factory.create({ dataset: dsA, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' }).identity;
    const idB = factory.create({ dataset: dsB, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' }).identity;
    expect(idA.contentHash).toBe(dsA.contentHash);
    expect(idB.contentHash).toBe(dsB.contentHash);
    expect(idA.contentHash).toBe(idB.contentHash);
    expect(isDatasetIdentityScientificallyEquivalent(idA, idB)).toBe(true);
    expect(isDatasetIdentityOperationallyEquivalent(idA, idB)).toBe(false);
  });

  it('changing content breaks scientific equivalence but not necessarily operational', () => {
    const dsA = buildDataset('ds-001');
    const dsB = builder.buildDataset({
      datasetId: 'ds-001',
      observations: [observation()],
      createdAt: '2026-01-02T00:00:00.000Z',
    });
    const idA = factory.create({ dataset: dsA, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' }).identity;
    const idB = factory.create({ dataset: dsB, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' }).identity;
    expect(idA.contentHash).not.toBe(idB.contentHash);
    expect(idA.manifestHash).not.toBe(idB.manifestHash);
    expect(isDatasetIdentityScientificallyEquivalent(idA, idB)).toBe(false);
    expect(isDatasetIdentityOperationallyEquivalent(idA, idB)).toBe(false);
  });
});

describe('DatasetSnapshotDescriptorFactory — all-or-nothing typed failures', () => {
  it('rejects a missing or malformed dataset', () => {
    expect(() => factory.create({ dataset: null, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => factory.create({ dataset: { datasetId: 'x' }, datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' })).toThrow(InvalidSnapshotDescriptorError);
  });

  it('rejects an invalid datasetVersion', () => {
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: null, createdAt: '2026-01-03T00:00:00.000Z' })).toThrow(InvalidDatasetVersionError);
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: '1.0.0', createdAt: '2026-01-03T00:00:00.000Z' })).toThrow(InvalidDatasetVersionError);
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(-1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z' })).toThrow(InvalidDatasetVersionError);
  });

  it('rejects an invalid injected createdAt', () => {
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: undefined })).toThrow(InvalidDatasetTimestampError);
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: 'not-a-date' })).toThrow(InvalidDatasetTimestampError);
  });

  it('rejects invalid provenance/lineage', () => {
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z', provenance: 'x' })).toThrow(InvalidSnapshotDescriptorError);
    expect(() => factory.create({ dataset: buildDataset(), datasetVersion: createDatasetVersion(1, 0, 0), createdAt: '2026-01-03T00:00:00.000Z', lineage: [null] })).toThrow(InvalidSnapshotDescriptorError);
  });
});
