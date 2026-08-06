import { describe, it, expect } from 'vitest';
import {
  DATASET_SPLIT_LEAKAGE_FINDING_TYPE,
  DATASET_SPLIT_VALIDATION_MODE,
  DatasetBuilder,
  DatasetSnapshotDescriptorFactory,
  DatasetSplitLeakageDetector,
  GroupedTemporalDatasetSplitter,
  createCalibrationObservation,
  createDatasetIdentity,
  createDatasetVersion,
  createGroupedTemporalSplitConfiguration,
  createNumberTarget,
  deepFreeze,
} from '../../src/historical-evidence/index.js';

const splitter = new GroupedTemporalDatasetSplitter();
const detector = new DatasetSplitLeakageDetector();
const descriptorFactory = new DatasetSnapshotDescriptorFactory();
const createdAt = '2026-02-03T00:00:00.000Z';
const splitCreatedAt = '2026-02-03T00:10:00.000Z';
const checkedAt = '2026-02-03T00:20:00.000Z';

function makeObservation({
  observationId,
  predictionId,
  outcomeId,
  spinId,
  predictionCreatedAt,
  outcomeRecordedAt,
  observationCreatedAt,
  observedOutcome,
}) {
  return createCalibrationObservation({
    observationId,
    predictionId,
    outcomeId,
    spinId,
    target: createNumberTarget('17'),
    rawConsensusScore: 0.5,
    calibration: null,
    observedOutcome,
    predictionCreatedAt,
    outcomeRecordedAt,
    observationCreatedAt,
  });
}

function buildFixture() {
  const builder = new DatasetBuilder();
  const observations = [
    makeObservation({
      observationId: 'obs-a',
      predictionId: 'pred-a',
      outcomeId: 'out-a',
      spinId: 'spin-a',
      predictionCreatedAt: '2026-02-01T00:00:00.000Z',
      outcomeRecordedAt: '2026-02-01T00:00:02.000Z',
      observationCreatedAt: '2026-02-01T00:00:02.000Z',
      observedOutcome: 1,
    }),
    makeObservation({
      observationId: 'obs-b',
      predictionId: 'pred-b',
      outcomeId: 'out-b',
      spinId: 'spin-b',
      predictionCreatedAt: '2026-02-01T00:10:00.000Z',
      outcomeRecordedAt: '2026-02-01T00:10:02.000Z',
      observationCreatedAt: '2026-02-01T00:10:02.000Z',
      observedOutcome: 0,
    }),
    makeObservation({
      observationId: 'obs-c',
      predictionId: 'pred-c',
      outcomeId: 'out-c',
      spinId: 'spin-c',
      predictionCreatedAt: '2026-02-01T00:20:00.000Z',
      outcomeRecordedAt: '2026-02-01T00:20:02.000Z',
      observationCreatedAt: '2026-02-01T00:20:02.000Z',
      observedOutcome: 1,
    }),
    makeObservation({
      observationId: 'obs-d',
      predictionId: 'pred-d',
      outcomeId: 'out-d',
      spinId: 'spin-d',
      predictionCreatedAt: '2026-02-01T00:30:00.000Z',
      outcomeRecordedAt: '2026-02-01T00:30:02.000Z',
      observationCreatedAt: '2026-02-01T00:30:02.000Z',
      observedOutcome: 0,
    }),
  ];

  const builtDataset = builder.buildDataset({
    datasetId: 'ds-grouped-temporal-audit',
    observations,
    createdAt,
  });

  const identity = createDatasetIdentity({
    datasetId: builtDataset.datasetId,
    datasetVersion: createDatasetVersion(2, 3, 5),
    schemaVersion: builtDataset.schemaVersion,
    observationSchemaVersion: builtDataset.observationSchemaVersion,
    contentHash: builtDataset.contentHash,
    manifestHash: builtDataset.manifestHash,
  });

  const descriptor = structuredClone(
    descriptorFactory.create({
      dataset: builtDataset,
      datasetVersion: createDatasetVersion(2, 3, 5),
      createdAt: '2026-02-03T00:05:00.000Z',
      metadata: { source: 'grouped-temporal-audit' },
    }),
  );

  const dataset = deepFreeze({
    ...structuredClone(builtDataset),
    identity,
    descriptor,
  });

  const configuration = createGroupedTemporalSplitConfiguration({
    sourceDatasetIdentity: identity,
    trainUntil: '2026-02-01T00:15:00.000Z',
    validationUntil: '2026-02-01T00:25:00.000Z',
  });

  return { dataset, identity, configuration };
}

function buildSplit() {
  const { dataset, identity, configuration } = buildFixture();
  const split = splitter.split({
    dataset,
    configuration,
    splitId: 'split-grouped-temporal-audit',
    createdAt: splitCreatedAt,
  });

  return { dataset, identity, split };
}

describe('GroupedTemporal split integration', () => {
  it('splits a frozen dataset into ordered partitions and validates the result end to end', () => {
    const { dataset, identity, split } = buildSplit();
    const report = detector.detect({
      dataset,
      split,
      mode: DATASET_SPLIT_VALIDATION_MODE.FULL,
      checkedAt,
    });

    expect(split.partitionCount).toBe(3);
    expect(split.observationCount).toBe(4);
    expect(split.spinCount).toBe(4);
    expect(split.partitions.map((partition) => partition.partitionType)).toEqual(['TRAIN', 'VALIDATION', 'TEST']);
    expect(split.metadata.sourceDatasetIdentity).toEqual(identity);
    expect(report.status).toBe('VALID');
    expect(report.isValid()).toBe(true);
    expect(report.hasLeakage()).toBe(false);
    expect(report.findings).toHaveLength(0);
  });

  it('accepts the same split in structural mode without requiring a fresh integrity sweep', () => {
    const { dataset, split } = buildSplit();
    const report = detector.detect({
      dataset,
      split,
      mode: DATASET_SPLIT_VALIDATION_MODE.STRUCTURAL,
      checkedAt,
    });

    expect(report.status).toBe('INCOMPLETE');
    expect(report.isValid()).toBe(false);
    expect(report.findings).toHaveLength(0);
  });

  it('flags missing source observations when a partition is dropped from the split', () => {
    const { dataset, split } = buildSplit();
    const tamperedSplit = structuredClone(split);
    tamperedSplit.partitions = tamperedSplit.partitions.slice(0, 2);
    tamperedSplit.partitionCount = 2;
    tamperedSplit.observationCount = 3;
    tamperedSplit.spinCount = 3;

    const report = detector.detect({
      dataset,
      split: tamperedSplit,
      mode: DATASET_SPLIT_VALIDATION_MODE.FULL,
      checkedAt,
    });

    expect(report.status).not.toBe('VALID');
    expect(report.getFindingsByType(DATASET_SPLIT_LEAKAGE_FINDING_TYPE.MISSING_SOURCE_OBSERVATION)).toHaveLength(1);
    expect(report.getFindingsByType(DATASET_SPLIT_LEAKAGE_FINDING_TYPE.MISSING_SOURCE_SPIN)).toHaveLength(1);
  });

  it('flags partition source identity drift when a partition points to another dataset', () => {
    const { dataset, split } = buildSplit();
    const tamperedSplit = structuredClone(split);
    tamperedSplit.partitions[2].sourceDatasetIdentity = createDatasetIdentity({
      datasetId: 'ds-grouped-temporal-foreign',
      datasetVersion: createDatasetVersion(9, 9, 9),
      schemaVersion: split.metadata.sourceDatasetIdentity.schemaVersion,
      observationSchemaVersion: split.metadata.sourceDatasetIdentity.observationSchemaVersion,
      contentHash: split.metadata.sourceDatasetIdentity.contentHash,
      manifestHash: split.metadata.sourceDatasetIdentity.manifestHash,
    });

    const report = detector.detect({
      dataset,
      split: tamperedSplit,
      mode: DATASET_SPLIT_VALIDATION_MODE.FULL,
      checkedAt,
    });

    expect(report.status).not.toBe('VALID');
    expect(report.getFindingsByType(DATASET_SPLIT_LEAKAGE_FINDING_TYPE.PARTITION_SOURCE_IDENTITY_MISMATCH)).toHaveLength(1);
  });
});
