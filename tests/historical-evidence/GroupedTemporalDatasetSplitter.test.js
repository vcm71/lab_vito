import { describe, expect, it } from 'vitest';
import {
  AmbiguousSpinTimestampError,
  DatasetBuilder,
  DatasetPartitionType,
  DatasetSnapshotDescriptorFactory,
  EmptyDatasetPartitionError,
  GroupedTemporalDatasetSplitter,
  InvalidGroupedTemporalSplitConfigurationError,
  createCalibrationObservation,
  createDatasetVersion,
  createGroupedTemporalSplitConfiguration,
  createNumberTarget,
} from '../../src/historical-evidence/index.js';

const builder = new DatasetBuilder();
const descriptorFactory = new DatasetSnapshotDescriptorFactory();
const splitter = new GroupedTemporalDatasetSplitter();

function observation({
  observationId,
  predictionId,
  outcomeId,
  spinId,
  predictionCreatedAt,
  outcomeRecordedAt = '2026-01-05T00:00:00.000Z',
  observationCreatedAt = '2026-01-05T00:00:05.000Z',
}) {
  return createCalibrationObservation({
    observationId,
    predictionId,
    outcomeId,
    spinId,
    target: createNumberTarget('17'),
    rawConsensusScore: 0.72,
    calibration: { probability: 0.7, strategyName: 'isotonic', modelId: 'm1' },
    observedOutcome: 1,
    predictionCreatedAt,
    outcomeRecordedAt,
    observationCreatedAt,
  });
}

function buildDataset({ datasetId = 'ds-splitter', observations }) {
  return builder.buildDataset({
    datasetId,
    observations,
    createdAt: '2026-01-02T00:00:00.000Z',
  });
}

function makeIdentity(dataset) {
  return descriptorFactory
    .create({
      dataset,
      datasetVersion: createDatasetVersion(1, 0, 0),
      createdAt: '2026-01-03T00:00:00.000Z',
    })
    .identity;
}

describe('GroupedTemporalDatasetSplitter', () => {
  it('creates a deterministic train/validation/test split from grouped temporal cutoffs', () => {
    const t1 = '2026-01-01T00:00:00.000Z';
    const t2 = '2026-01-02T00:00:00.000Z';
    const t3 = '2026-01-03T00:00:00.000Z';
    const dataset = buildDataset({
      observations: [
        observation({
          observationId: 'obs-1a',
          predictionId: 'pred-1a',
          outcomeId: 'out-1a',
          spinId: 'spin-1',
          predictionCreatedAt: t1,
        }),
        observation({
          observationId: 'obs-1b',
          predictionId: 'pred-1b',
          outcomeId: 'out-1b',
          spinId: 'spin-1',
          predictionCreatedAt: t1,
        }),
        observation({
          observationId: 'obs-2',
          predictionId: 'pred-2',
          outcomeId: 'out-2',
          spinId: 'spin-2',
          predictionCreatedAt: t1,
        }),
        observation({
          observationId: 'obs-3',
          predictionId: 'pred-3',
          outcomeId: 'out-3',
          spinId: 'spin-3',
          predictionCreatedAt: t2,
        }),
        observation({
          observationId: 'obs-4',
          predictionId: 'pred-4',
          outcomeId: 'out-4',
          spinId: 'spin-4',
          predictionCreatedAt: t3,
        }),
      ],
    });
    const identity = makeIdentity(dataset);
    const configuration = createGroupedTemporalSplitConfiguration({
      sourceDatasetIdentity: identity,
      trainUntil: t1,
      validationUntil: t2,
    });

    const split = splitter.split({
      dataset,
      configuration,
      splitId: 'split-001',
      createdAt: '2026-01-04T00:00:00.000Z',
    });

    expect(split.sourceDatasetIdentity).toEqual(identity);
    expect(split.metadata.splitId).toBe('split-001');
    expect(split.metadata.strategy).toBe('GROUPED_TEMPORAL');
    expect(split.metadata.groupingKey).toBe('spinId');
    expect(split.metadata.temporalKey).toBe('predictionCreatedAt');
    expect(split.partitionCount).toBe(3);
    expect(split.observationCount).toBe(5);
    expect(split.spinCount).toBe(4);
    expect(split.period).toEqual({ from: t1, to: t3 });

    expect(split.partitions.map((partition) => partition.partitionType)).toEqual([
      DatasetPartitionType.TRAIN,
      DatasetPartitionType.VALIDATION,
      DatasetPartitionType.TEST,
    ]);
    expect(split.partitions[0].spinIds).toEqual(['spin-1', 'spin-2']);
    expect(split.partitions[0].observationIds).toEqual(['obs-1a', 'obs-1b', 'obs-2']);
    expect(split.partitions[0].period).toEqual({ from: t1, to: t1 });
    expect(split.partitions[1].spinIds).toEqual(['spin-3']);
    expect(split.partitions[1].observationIds).toEqual(['obs-3']);
    expect(split.partitions[1].period).toEqual({ from: t2, to: t2 });
    expect(split.partitions[2].spinIds).toEqual(['spin-4']);
    expect(split.partitions[2].observationIds).toEqual(['obs-4']);
    expect(split.partitions[2].period).toEqual({ from: t3, to: t3 });
  });

  it('rejects invalid cutoff ordering in the explicit configuration contract', () => {
    const dataset = buildDataset({
      observations: [
        observation({
          observationId: 'obs-1',
          predictionId: 'pred-1',
          outcomeId: 'out-1',
          spinId: 'spin-1',
          predictionCreatedAt: '2026-01-01T00:00:00.000Z',
        }),
      ],
    });
    const identity = makeIdentity(dataset);

    expect(() =>
      createGroupedTemporalSplitConfiguration({
        sourceDatasetIdentity: identity,
        trainUntil: '2026-01-02T00:00:00.000Z',
        validationUntil: '2026-01-02T00:00:00.000Z',
      }),
    ).toThrow(InvalidGroupedTemporalSplitConfigurationError);
  });

  it('rejects a spin group that mixes timestamps', () => {
    const dataset = buildDataset({
      observations: [
        observation({
          observationId: 'obs-1',
          predictionId: 'pred-1',
          outcomeId: 'out-1',
          spinId: 'spin-1',
          predictionCreatedAt: '2026-01-01T00:00:00.000Z',
        }),
        observation({
          observationId: 'obs-2',
          predictionId: 'pred-2',
          outcomeId: 'out-2',
          spinId: 'spin-1',
          predictionCreatedAt: '2026-01-02T00:00:00.000Z',
        }),
        observation({
          observationId: 'obs-3',
          predictionId: 'pred-3',
          outcomeId: 'out-3',
          spinId: 'spin-2',
          predictionCreatedAt: '2026-01-03T00:00:00.000Z',
        }),
      ],
    });
    const identity = makeIdentity(dataset);
    const configuration = createGroupedTemporalSplitConfiguration({
      sourceDatasetIdentity: identity,
      trainUntil: '2026-01-02T00:00:00.000Z',
    });

    expect(() =>
      splitter.split({
        dataset,
        configuration,
        splitId: 'split-002',
        createdAt: '2026-01-04T00:00:00.000Z',
      }),
    ).toThrow(AmbiguousSpinTimestampError);
  });

  it('rejects a split that would leave a required partition empty', () => {
    const dataset = buildDataset({
      observations: [
        observation({
          observationId: 'obs-1',
          predictionId: 'pred-1',
          outcomeId: 'out-1',
          spinId: 'spin-1',
          predictionCreatedAt: '2026-01-01T00:00:00.000Z',
        }),
        observation({
          observationId: 'obs-2',
          predictionId: 'pred-2',
          outcomeId: 'out-2',
          spinId: 'spin-2',
          predictionCreatedAt: '2026-01-02T00:00:00.000Z',
        }),
      ],
    });
    const identity = makeIdentity(dataset);
    const configuration = createGroupedTemporalSplitConfiguration({
      sourceDatasetIdentity: identity,
      trainUntil: '2025-12-31T23:59:59.000Z',
    });

    expect(() =>
      splitter.split({
        dataset,
        configuration,
        splitId: 'split-003',
        createdAt: '2026-01-04T00:00:00.000Z',
      }),
    ).toThrow(EmptyDatasetPartitionError);
  });
});
