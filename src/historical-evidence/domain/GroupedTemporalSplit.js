/**
 * GroupedTemporalSplit — logical result of a grouped temporal partition.
 *
 * The contract guarantees that spinIds and observationIds do not cross
 * partition boundaries, that partitions remain temporally ordered, and that
 * the split keeps traceability to the source dataset identity.
 */

import { compareIso } from './HistoricalCalibrationDataset.js';
import { isDatasetIdentity, datasetIdentitiesEqual } from './DatasetIdentity.js';
import { isDatasetPartition } from './DatasetPartition.js';
import { isSplitMetadata } from './SplitMetadata.js';
import { InvalidGroupedTemporalSplitError } from './errors.js';

function assertNonEmptyArray(field, value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InvalidGroupedTemporalSplitError(`invalid ${field}: expected a non-empty array`);
  }
  return value;
}

export function isGroupedTemporalSplit(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isDatasetIdentity(value.sourceDatasetIdentity) &&
    isSplitMetadata(value.metadata) &&
    Array.isArray(value.partitions) &&
    typeof value.partitionCount === 'number' &&
    typeof value.observationCount === 'number' &&
    typeof value.spinCount === 'number' &&
    isPartitionSequence(value.partitions)
  );
}

function isPartitionSequence(partitions) {
  return partitions.every(isDatasetPartition);
}

function ensureNoDuplicates(label, values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      throw new InvalidGroupedTemporalSplitError(`duplicate ${label}: ${JSON.stringify(value)}`);
    }
    seen.add(value);
  }
}

function validatePartitionConsistency(partitions, sourceDatasetIdentity) {
  const seenTypes = new Set();
  const seenSpinIds = new Set();
  const seenObservationIds = new Set();

  let previous = null;
  let observationCount = 0;
  let spinCount = 0;

  for (const partition of partitions) {
    if (!isDatasetPartition(partition)) {
      throw new InvalidGroupedTemporalSplitError('invalid partition entry');
    }

    if (!datasetIdentitiesEqual(partition.sourceDatasetIdentity, sourceDatasetIdentity)) {
      throw new InvalidGroupedTemporalSplitError('dataset source inconsistent across partitions');
    }

    if (seenTypes.has(partition.partitionType)) {
      throw new InvalidGroupedTemporalSplitError(`duplicate partition type: ${JSON.stringify(partition.partitionType)}`);
    }
    seenTypes.add(partition.partitionType);

    if (previous !== null && compareIso(previous.period.to, partition.period.from) >= 0) {
      throw new InvalidGroupedTemporalSplitError(
        `overlapping or unordered periods: ${JSON.stringify(previous.period)} and ${JSON.stringify(partition.period)}`,
      );
    }

    ensureNoDuplicates('spinId', partition.spinIds);
    ensureNoDuplicates('observationId', partition.observationIds);

    for (const spinId of partition.spinIds) {
      if (seenSpinIds.has(spinId)) {
        throw new InvalidGroupedTemporalSplitError(`spinId shared between partitions: ${JSON.stringify(spinId)}`);
      }
      seenSpinIds.add(spinId);
    }

    for (const observationId of partition.observationIds) {
      if (seenObservationIds.has(observationId)) {
        throw new InvalidGroupedTemporalSplitError(
          `observationId shared between partitions: ${JSON.stringify(observationId)}`,
        );
      }
      seenObservationIds.add(observationId);
    }

    observationCount += partition.observationCount;
    spinCount += partition.spinCount;
    previous = partition;
  }

  return {
    observationCount,
    spinCount,
  };
}

function derivePeriod(partitions) {
  const first = partitions[0].period.from;
  const last = partitions[0].period.to;
  let from = first;
  let to = last;
  for (const partition of partitions) {
    if (compareIso(partition.period.from, from) < 0) from = partition.period.from;
    if (compareIso(partition.period.to, to) > 0) to = partition.period.to;
  }
  return { from, to };
}

export function createGroupedTemporalSplit({ metadata, partitions }) {
  if (!isSplitMetadata(metadata)) {
    throw new InvalidGroupedTemporalSplitError('invalid metadata');
  }

  const safePartitions = assertNonEmptyArray('partitions', partitions).map((partition) => partition);
  const { observationCount, spinCount } = validatePartitionConsistency(
    safePartitions,
    metadata.sourceDatasetIdentity,
  );

  const period = derivePeriod(safePartitions);

  return Object.freeze({
    sourceDatasetIdentity: metadata.sourceDatasetIdentity,
    metadata,
    period,
    partitions: Object.freeze([...safePartitions]),
    partitionCount: safePartitions.length,
    observationCount,
    spinCount,
  });
}

export const GroupedTemporalSplit = Object.freeze({
  create: createGroupedTemporalSplit,
  is: isGroupedTemporalSplit,
});
