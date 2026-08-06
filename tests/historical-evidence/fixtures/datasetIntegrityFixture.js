import {
  DatasetBuilder,
  createCalibrationObservation,
  createDatasetIdentity,
  createDatasetSnapshotDescriptor,
  createDatasetVersion,
  createNumberTarget,
} from '../../../src/historical-evidence/index.js';

const builder = new DatasetBuilder();
const createdAt = '2026-02-03T00:00:00.000Z';

function observation(overrides = {}) {
  return createCalibrationObservation({
    observationId: 'obs-1',
    predictionId: 'pred-1',
    outcomeId: 'out-1',
    spinId: 'spin-1',
    target: createNumberTarget('17'),
    rawConsensusScore: 0.72,
    calibration: { probability: 0.7, strategyName: 'isotonic', modelId: 'm-1' },
    observedOutcome: 1,
    predictionCreatedAt: '2026-02-01T00:00:00.000Z',
    outcomeRecordedAt: '2026-02-01T00:00:05.000Z',
    observationCreatedAt: '2026-02-01T00:00:05.000Z',
    ...overrides,
  });
}

function observationTwo(overrides = {}) {
  return createCalibrationObservation({
    observationId: 'obs-2',
    predictionId: 'pred-2',
    outcomeId: 'out-2',
    spinId: 'spin-2',
    target: createNumberTarget('18'),
    rawConsensusScore: 0.41,
    calibration: null,
    observedOutcome: 0,
    predictionCreatedAt: '2026-02-01T00:00:10.000Z',
    outcomeRecordedAt: '2026-02-01T00:00:15.000Z',
    observationCreatedAt: '2026-02-01T00:00:15.000Z',
    ...overrides,
  });
}

export function createIntegrityFixture() {
  const dataset = builder.buildDataset({
    datasetId: 'ds-integrity-001',
    observations: [observationTwo(), observation()],
    createdAt,
  });

  const identity = createDatasetIdentity({
    datasetId: dataset.datasetId,
    datasetVersion: createDatasetVersion(1, 2, 3),
    schemaVersion: dataset.schemaVersion,
    observationSchemaVersion: dataset.observationSchemaVersion,
    contentHash: dataset.contentHash,
    manifestHash: dataset.manifestHash,
  });

  const descriptor = createDatasetSnapshotDescriptor({
    identity,
    createdAt: '2026-02-03T00:05:00.000Z',
    period: dataset.period,
    manifest: dataset.manifest,
    statistics: dataset.statistics,
    policies: {
      duplicatePolicy: dataset.manifest.duplicatePolicy,
      invalidObservationPolicy: dataset.manifest.invalidObservationPolicy,
    },
    filters: [{ field: 'target.type', operator: 'eq', value: 'number' }],
    provenance: {
      sourceDatasetId: 'ds-base-000',
      sourceContentHash: 'c'.repeat(64),
      parentDatasetVersion: createDatasetVersion(1, 2, 2),
      assemblyReason: 'baseline',
      transformationType: 'none',
    },
    lineage: [
      {
        datasetId: 'ds-base-000',
        contentHash: 'c'.repeat(64),
        datasetVersion: createDatasetVersion(1, 2, 2),
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ],
    metadata: { source: 'integrity-fixture', tags: ['historical', 'calibration'] },
  });

  return { dataset, identity, descriptor };
}

export function cloneIntegrityFixture(value) {
  return structuredClone(value);
}
