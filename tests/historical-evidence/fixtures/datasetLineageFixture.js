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

function observation({
  observationId,
  predictionId,
  outcomeId,
  spinId,
  targetValue,
  rawConsensusScore,
  observedOutcome,
  predictionCreatedAt,
  outcomeRecordedAt,
  observationCreatedAt,
}) {
  return createCalibrationObservation({
    observationId,
    predictionId,
    outcomeId,
    spinId,
    target: createNumberTarget(targetValue),
    rawConsensusScore,
    calibration: null,
    observedOutcome,
    predictionCreatedAt,
    outcomeRecordedAt,
    observationCreatedAt,
  });
}

function buildSnapshot({
  datasetId,
  datasetVersion,
  observations,
  descriptorCreatedAt,
  provenance = null,
}) {
  const dataset = builder.buildDataset({
    datasetId,
    observations,
    createdAt,
  });

  const identity = createDatasetIdentity({
    datasetId: dataset.datasetId,
    datasetVersion,
    schemaVersion: dataset.schemaVersion,
    observationSchemaVersion: dataset.observationSchemaVersion,
    contentHash: dataset.contentHash,
    manifestHash: dataset.manifestHash,
  });

  const descriptor = createDatasetSnapshotDescriptor({
    identity,
    createdAt: descriptorCreatedAt,
    period: dataset.period,
    manifest: dataset.manifest,
    statistics: dataset.statistics,
    policies: {
      duplicatePolicy: dataset.manifest.duplicatePolicy,
      invalidObservationPolicy: dataset.manifest.invalidObservationPolicy,
    },
    filters: [{ field: 'target.type', operator: 'eq', value: 'number' }],
    provenance,
    lineage: provenance === null
      ? []
      : [
          {
            datasetId: provenance.sourceDatasetId,
            contentHash: provenance.sourceContentHash,
            datasetVersion: provenance.parentDatasetVersion,
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
    metadata: { source: 'lineage-fixture', tags: ['historical', 'calibration'] },
  });

  return { dataset, identity, descriptor };
}

const baseObservations = [
  observation({
    observationId: 'obs-1',
    predictionId: 'pred-1',
    outcomeId: 'out-1',
    spinId: 'spin-1',
    targetValue: '17',
    rawConsensusScore: 0.72,
    observedOutcome: 1,
    predictionCreatedAt: '2026-02-01T00:00:00.000Z',
    outcomeRecordedAt: '2026-02-01T00:00:05.000Z',
    observationCreatedAt: '2026-02-01T00:00:05.000Z',
  }),
  observation({
    observationId: 'obs-2',
    predictionId: 'pred-2',
    outcomeId: 'out-2',
    spinId: 'spin-2',
    targetValue: '18',
    rawConsensusScore: 0.41,
    observedOutcome: 0,
    predictionCreatedAt: '2026-02-01T00:00:10.000Z',
    outcomeRecordedAt: '2026-02-01T00:00:15.000Z',
    observationCreatedAt: '2026-02-01T00:00:15.000Z',
  }),
];

const divergentObservations = [
  baseObservations[0],
  observation({
    observationId: 'obs-2',
    predictionId: 'pred-2',
    outcomeId: 'out-2',
    spinId: 'spin-2',
    targetValue: '18',
    rawConsensusScore: 0.41,
    observedOutcome: 1,
    predictionCreatedAt: '2026-02-01T00:00:10.000Z',
    outcomeRecordedAt: '2026-02-01T00:00:15.000Z',
    observationCreatedAt: '2026-02-01T00:00:15.000Z',
  }),
];

export function createLineageFixture() {
  const exactLeft = buildSnapshot({
    datasetId: 'ds-lineage-exact',
    datasetVersion: createDatasetVersion(1, 2, 3),
    observations: baseObservations,
    descriptorCreatedAt: '2026-02-03T00:05:00.000Z',
  });

  const exactRight = buildSnapshot({
    datasetId: 'ds-lineage-exact',
    datasetVersion: createDatasetVersion(1, 2, 3),
    observations: baseObservations,
    descriptorCreatedAt: '2026-02-03T00:05:00.000Z',
  });

  const parent = buildSnapshot({
    datasetId: 'ds-lineage-parent',
    datasetVersion: createDatasetVersion(1, 2, 2),
    observations: baseObservations,
    descriptorCreatedAt: '2026-02-02T00:05:00.000Z',
  });

  const child = buildSnapshot({
    datasetId: 'ds-lineage-parent',
    datasetVersion: createDatasetVersion(1, 2, 3),
    observations: baseObservations,
    descriptorCreatedAt: '2026-02-03T00:05:00.000Z',
    provenance: {
      sourceDatasetId: parent.identity.datasetId,
      sourceContentHash: parent.identity.contentHash,
      parentDatasetVersion: parent.identity.datasetVersion,
      assemblyReason: 'REPLACEMENT',
      transformationType: 'REPLACEMENT',
    },
  });

  const divergentLeft = buildSnapshot({
    datasetId: 'ds-lineage-divergent',
    datasetVersion: createDatasetVersion(2, 0, 0),
    observations: baseObservations,
    descriptorCreatedAt: '2026-02-03T00:05:00.000Z',
    provenance: {
      sourceDatasetId: 'ds-lineage-base',
      sourceContentHash: 'd'.repeat(64),
      parentDatasetVersion: createDatasetVersion(1, 9, 0),
      assemblyReason: 'baseline',
      transformationType: 'derived',
    },
  });

  const divergentRight = buildSnapshot({
    datasetId: 'ds-lineage-divergent',
    datasetVersion: createDatasetVersion(2, 0, 0),
    observations: divergentObservations,
    descriptorCreatedAt: '2026-02-03T00:05:00.000Z',
    provenance: {
      sourceDatasetId: 'ds-lineage-base',
      sourceContentHash: 'd'.repeat(64),
      parentDatasetVersion: createDatasetVersion(1, 9, 0),
      assemblyReason: 'baseline',
      transformationType: 'derived',
    },
  });

  const incompatibleLeft = buildSnapshot({
    datasetId: 'ds-lineage-incompatible',
    datasetVersion: createDatasetVersion(1, 0, 0),
    observations: baseObservations,
    descriptorCreatedAt: '2026-02-03T00:05:00.000Z',
  });

  const incompatibleRight = {
    dataset: {
      ...incompatibleLeft.dataset,
      contentHash: '0'.repeat(64),
    },
    identity: {
      ...incompatibleLeft.identity,
      datasetVersion: createDatasetVersion(1, 0, 0),
      contentHash: '0'.repeat(64),
    },
    descriptor: incompatibleLeft.descriptor,
  };

  return {
    exactLeft,
    exactRight,
    parent,
    child,
    divergentLeft,
    divergentRight,
    incompatibleLeft,
    incompatibleRight,
  };
}
