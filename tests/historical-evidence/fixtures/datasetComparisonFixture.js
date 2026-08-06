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
const descriptorCreatedAt = '2026-02-03T00:05:00.000Z';

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

function buildDataset({ datasetId, observations, descriptorOffsetMinutes = 0 }) {
  const dataset = builder.buildDataset({
    datasetId,
    observations,
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
    createdAt: descriptorOffsetMinutes === 0 ? descriptorCreatedAt : '2026-02-03T00:06:00.000Z',
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
    metadata: { source: 'comparison-fixture', tags: ['historical', 'calibration'] },
  });

  return { dataset, identity, descriptor };
}

const exactObservations = [
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

const scientificObservations = exactObservations;

const divergentLeftObservations = exactObservations;
const divergentRightObservations = [
  exactObservations[0],
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

export function createComparisonFixture() {
  const exactLeft = buildDataset({
    datasetId: 'ds-comparison-exact',
    observations: exactObservations,
    descriptorOffsetMinutes: 0,
  });

  const exactRight = buildDataset({
    datasetId: 'ds-comparison-exact',
    observations: exactObservations,
    descriptorOffsetMinutes: 0,
  });

  const scientificLeft = buildDataset({
    datasetId: 'ds-comparison-scientific',
    observations: scientificObservations,
    descriptorOffsetMinutes: 0,
  });

  const scientificRight = buildDataset({
    datasetId: 'ds-comparison-scientific',
    observations: scientificObservations,
    descriptorOffsetMinutes: 1,
  });

  const divergentLeft = buildDataset({
    datasetId: 'ds-comparison-divergent',
    observations: divergentLeftObservations,
    descriptorOffsetMinutes: 0,
  });

  const divergentRight = buildDataset({
    datasetId: 'ds-comparison-divergent',
    observations: divergentRightObservations,
    descriptorOffsetMinutes: 0,
  });

  return {
    exactLeft,
    exactRight,
    scientificLeft,
    scientificRight,
    divergentLeft,
    divergentRight,
  };
}
