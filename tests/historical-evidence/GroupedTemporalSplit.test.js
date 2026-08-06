/**
 * Grouped temporal split contracts (Fase 2.3.5.1).
 *
 * Covers the new value objects introduced for the historical-evidence
 * domain: DatasetPartitionType, SplitPeriod, SplitMetadata,
 * DatasetPartition and GroupedTemporalSplit.
 */

import { describe, it, expect } from 'vitest';
import {
  DatasetVersion,
  createDatasetIdentity,
  createSplitPeriod,
  splitPeriodToJSON,
  splitPeriodsEqual,
  isSplitPeriod,
  DatasetPartitionType,
  createSplitMetadata,
  isSplitMetadata,
  SplitMetadata,
  createDatasetPartition,
  isDatasetPartition,
  createGroupedTemporalSplit,
  isGroupedTemporalSplit,
  InvalidPartitionTypeError,
  InvalidSplitPeriodError,
  InvalidSplitMetadataError,
  InvalidDatasetPartitionError,
  InvalidGroupedTemporalSplitError,
} from '../../src/historical-evidence/index.js';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);
const HASH_C = 'c'.repeat(64);

function makeIdentity(overrides = {}) {
  return createDatasetIdentity({
    datasetId: 'dataset.grouped.temporal.1',
    datasetVersion: DatasetVersion.create(2, 3, 5),
    schemaVersion: '1',
    observationSchemaVersion: '1',
    contentHash: HASH_A,
    manifestHash: HASH_B,
    ...overrides,
  });
}

function makeMetadata(overrides = {}) {
  return createSplitMetadata({
    sourceDatasetIdentity: makeIdentity(),
    createdAt: '2026-08-01T00:00:00Z',
    splitId: 'split-2026-08-01-0001',
    ...overrides,
  });
}

function makePartition(overrides = {}) {
  return createDatasetPartition({
    partitionType: DatasetPartitionType.TRAIN,
    period: createSplitPeriod({
      from: '2026-08-01T00:00:00Z',
      to: '2026-08-01T00:10:00Z',
    }),
    sourceDatasetIdentity: makeIdentity(),
    observationIds: ['obs-1', 'obs-2'],
    spinIds: ['spin-1'],
    ...overrides,
  });
}

describe('DatasetPartitionType', () => {
  it('exposes the closed set used by the split contract', () => {
    expect(DatasetPartitionType.values).toEqual(['TRAIN', 'VALIDATION', 'TEST']);
    expect(DatasetPartitionType.is('TRAIN')).toBe(true);
    expect(DatasetPartitionType.is('MAYBE')).toBe(false);
  });

  it('rejects unsupported partition types', () => {
    expect(() => DatasetPartitionType.assert('MAYBE')).toThrow(InvalidPartitionTypeError);
  });
});

describe('SplitPeriod', () => {
  it('creates an immutable inclusive ISO window', () => {
    const period = createSplitPeriod({
      from: '2026-08-01T00:00:00Z',
      to: '2026-08-01T12:00:00Z',
    });

    expect(period).toEqual({
      from: '2026-08-01T00:00:00Z',
      to: '2026-08-01T12:00:00Z',
    });
    expect(isSplitPeriod(period)).toBe(true);
    expect(splitPeriodToJSON(period)).toEqual(period);
    expect(splitPeriodsEqual(period, createSplitPeriod({ from: period.from, to: period.to }))).toBe(true);
  });

  it('rejects inverted or malformed periods', () => {
    expect(() => createSplitPeriod({ from: '2026-08-01T12:00:00Z', to: '2026-08-01T00:00:00Z' })).toThrow(
      InvalidSplitPeriodError,
    );
    expect(() => createSplitPeriod({ from: 'not-a-time', to: '2026-08-01T00:00:00Z' })).toThrow(
      InvalidSplitPeriodError,
    );
  });
});

describe('SplitMetadata', () => {
  it('captures source dataset traceability and injected split identity', () => {
    const sourceDatasetIdentity = makeIdentity();
    const metadata = createSplitMetadata({
      sourceDatasetIdentity,
      createdAt: '2026-08-01T01:23:45Z',
      splitId: 'split-2026-08-01-0420',
    });

    expect(isSplitMetadata(metadata)).toBe(true);
    expect(metadata.sourceDatasetIdentity).toBe(sourceDatasetIdentity);
    expect(metadata.strategy).toBe(SplitMetadata.strategy);
    expect(metadata.groupingKey).toBe(SplitMetadata.groupingKey);
    expect(metadata.temporalKey).toBe(SplitMetadata.temporalKey);
    expect(metadata.createdAt).toBe('2026-08-01T01:23:45Z');
    expect(metadata.splitId).toBe('split-2026-08-01-0420');
  });

  it('rejects unsupported strategy, grouping or temporal keys', () => {
    const sourceDatasetIdentity = makeIdentity();

    expect(() =>
      createSplitMetadata({
        sourceDatasetIdentity,
        createdAt: '2026-08-01T01:23:45Z',
        splitId: 'split-1',
        strategy: 'OTHER',
      }),
    ).toThrow(InvalidSplitMetadataError);

    expect(() =>
      createSplitMetadata({
        sourceDatasetIdentity,
        createdAt: '2026-08-01T01:23:45Z',
        splitId: 'split-1',
        groupingKey: 'spinGroup',
      }),
    ).toThrow(InvalidSplitMetadataError);
  });
});

describe('DatasetPartition', () => {
  it('keeps partition type, period, ids, counts and source traceability', () => {
    const sourceDatasetIdentity = makeIdentity();
    const partition = createDatasetPartition({
      partitionType: DatasetPartitionType.VALIDATION,
      period: createSplitPeriod({
        from: '2026-08-01T00:10:00Z',
        to: '2026-08-01T00:20:00Z',
      }),
      sourceDatasetIdentity,
      observationIds: ['obs-3', 'obs-4', 'obs-5'],
      spinIds: ['spin-2', 'spin-3'],
      metadata: { note: 'validation slice' },
    });

    expect(isDatasetPartition(partition)).toBe(true);
    expect(partition.partitionType).toBe(DatasetPartitionType.VALIDATION);
    expect(partition.period).toEqual({ from: '2026-08-01T00:10:00Z', to: '2026-08-01T00:20:00Z' });
    expect(partition.sourceDatasetIdentity).toBe(sourceDatasetIdentity);
    expect(partition.observationCount).toBe(3);
    expect(partition.spinCount).toBe(2);
    expect(partition.observationIds).toEqual(['obs-3', 'obs-4', 'obs-5']);
    expect(partition.spinIds).toEqual(['spin-2', 'spin-3']);
    expect(partition.metadata).toEqual({ note: 'validation slice' });
  });

  it('rejects empty ids, duplicate ids and invalid source traceability', () => {
    const sourceDatasetIdentity = makeIdentity();

    expect(() =>
      createDatasetPartition({
        partitionType: DatasetPartitionType.TEST,
        period: createSplitPeriod({ from: '2026-08-01T00:20:00Z', to: '2026-08-01T00:30:00Z' }),
        sourceDatasetIdentity,
        observationIds: [],
        spinIds: ['spin-4'],
      }),
    ).toThrow(InvalidDatasetPartitionError);

    expect(() =>
      createDatasetPartition({
        partitionType: DatasetPartitionType.TEST,
        period: createSplitPeriod({ from: '2026-08-01T00:20:00Z', to: '2026-08-01T00:30:00Z' }),
        sourceDatasetIdentity,
        observationIds: ['obs-1', 'obs-1'],
        spinIds: ['spin-4'],
      }),
    ).toThrow(InvalidDatasetPartitionError);
  });
});

describe('GroupedTemporalSplit', () => {
  it('assembles ordered, non-overlapping partitions into a traceable split', () => {
    const sourceDatasetIdentity = makeIdentity();
    const metadata = makeMetadata({ sourceDatasetIdentity });
    const train = createDatasetPartition({
      partitionType: DatasetPartitionType.TRAIN,
      period: createSplitPeriod({ from: '2026-08-01T00:00:00Z', to: '2026-08-01T00:10:00Z' }),
      sourceDatasetIdentity,
      observationIds: ['obs-1', 'obs-2'],
      spinIds: ['spin-1'],
    });
    const validation = createDatasetPartition({
      partitionType: DatasetPartitionType.VALIDATION,
      period: createSplitPeriod({ from: '2026-08-01T00:11:00Z', to: '2026-08-01T00:20:00Z' }),
      sourceDatasetIdentity,
      observationIds: ['obs-3', 'obs-4', 'obs-5'],
      spinIds: ['spin-2', 'spin-3'],
    });

    const split = createGroupedTemporalSplit({ metadata, partitions: [train, validation] });

    expect(isGroupedTemporalSplit(split)).toBe(true);
    expect(split.sourceDatasetIdentity).toBe(sourceDatasetIdentity);
    expect(split.metadata).toBe(metadata);
    expect(split.partitionCount).toBe(2);
    expect(split.observationCount).toBe(5);
    expect(split.spinCount).toBe(3);
    expect(split.period).toEqual({ from: '2026-08-01T00:00:00Z', to: '2026-08-01T00:20:00Z' });
    expect(split.partitions).toEqual([train, validation]);
  });

  it('rejects duplicate partition types, overlapping periods and source mismatches', () => {
    const sourceDatasetIdentity = makeIdentity();
    const metadata = makeMetadata({ sourceDatasetIdentity });
    const train = makePartition({
      partitionType: DatasetPartitionType.TRAIN,
      sourceDatasetIdentity,
    });
    const duplicateType = makePartition({
      partitionType: DatasetPartitionType.TRAIN,
      period: createSplitPeriod({ from: '2026-08-01T00:11:00Z', to: '2026-08-01T00:20:00Z' }),
      sourceDatasetIdentity,
      observationIds: ['obs-3'],
      spinIds: ['spin-2'],
    });

    expect(() => createGroupedTemporalSplit({ metadata, partitions: [train, duplicateType] })).toThrow(
      InvalidGroupedTemporalSplitError,
    );

    const overlapping = makePartition({
      partitionType: DatasetPartitionType.VALIDATION,
      period: createSplitPeriod({ from: '2026-08-01T00:10:00Z', to: '2026-08-01T00:20:00Z' }),
      sourceDatasetIdentity,
      observationIds: ['obs-3'],
      spinIds: ['spin-2'],
    });

    expect(() => createGroupedTemporalSplit({ metadata, partitions: [train, overlapping] })).toThrow(
      InvalidGroupedTemporalSplitError,
    );

    const otherIdentity = makeIdentity({ datasetId: 'dataset.grouped.temporal.2', contentHash: HASH_C });
    const mismatchedPartition = makePartition({
      partitionType: DatasetPartitionType.VALIDATION,
      period: createSplitPeriod({ from: '2026-08-01T00:11:00Z', to: '2026-08-01T00:20:00Z' }),
      sourceDatasetIdentity: otherIdentity,
      observationIds: ['obs-3'],
      spinIds: ['spin-2'],
    });

    expect(() => createGroupedTemporalSplit({ metadata, partitions: [train, mismatchedPartition] })).toThrow(
      InvalidGroupedTemporalSplitError,
    );
  });
});
