/**
 * DatasetPartition — logical slice of a historical calibration dataset.
 *
 * Partitions are descriptors, not duplicated datasets. They preserve
 * traceability to the source dataset and keep observation/spin identifiers
 * as immutable reference lists.
 */

import { isDatasetIdentity } from './DatasetIdentity.js';
import { deepFreeze } from './immutable.js';
import { createSplitPeriod, isSplitPeriod } from './SplitPeriod.js';
import { assertDatasetPartitionType, isDatasetPartitionType } from './DatasetPartitionType.js';
import { InvalidDatasetPartitionError } from './errors.js';

function assertStringArray(field, values) {
  if (!Array.isArray(values)) {
    throw new InvalidDatasetPartitionError(`invalid ${field}: expected an array`);
  }
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new InvalidDatasetPartitionError(`invalid ${field}: contains an empty or non-string id`);
    }
    if (seen.has(value)) {
      throw new InvalidDatasetPartitionError(`invalid ${field}: duplicate id ${JSON.stringify(value)}`);
    }
    seen.add(value);
  }
  return values;
}

function assertNonNegativeInteger(field, value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidDatasetPartitionError(`invalid ${field}: ${JSON.stringify(value)}`);
  }
  return value;
}

function normalizePeriod(period) {
  if (period === null || typeof period !== 'object') {
    throw new InvalidDatasetPartitionError('invalid period: expected an object');
  }
  if (isSplitPeriod(period)) {
    return createSplitPeriod({ from: period.from, to: period.to });
  }
  return createSplitPeriod(period);
}

export function isDatasetPartition(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isDatasetPartitionType(value.partitionType) &&
    isSplitPeriod(value.period) &&
    isDatasetIdentity(value.sourceDatasetIdentity) &&
    Array.isArray(value.observationIds) &&
    Array.isArray(value.spinIds) &&
    typeof value.observationCount === 'number' &&
    typeof value.spinCount === 'number'
  );
}

export function createDatasetPartition({
  partitionType,
  period,
  sourceDatasetIdentity,
  observationIds,
  spinIds,
  metadata = null,
}) {
  const safePartitionType = assertDatasetPartitionType(partitionType);
  const safePeriod = normalizePeriod(period);

  if (!isDatasetIdentity(sourceDatasetIdentity)) {
    throw new InvalidDatasetPartitionError('invalid sourceDatasetIdentity');
  }

  const safeObservationIds = assertStringArray('observationIds', observationIds);
  const safeSpinIds = assertStringArray('spinIds', spinIds);
  if (safeObservationIds.length === 0) {
    throw new InvalidDatasetPartitionError('observationIds must not be empty');
  }
  if (safeSpinIds.length === 0) {
    throw new InvalidDatasetPartitionError('spinIds must not be empty');
  }

  const observationCount = assertNonNegativeInteger('observationCount', safeObservationIds.length);
  const spinCount = assertNonNegativeInteger('spinCount', safeSpinIds.length);

  const safeMetadata = metadata === null ? null : deepFreeze(metadata);

  return deepFreeze({
    partitionType: safePartitionType,
    period: safePeriod,
    sourceDatasetIdentity,
    observationIds: [...safeObservationIds],
    spinIds: [...safeSpinIds],
    observationCount,
    spinCount,
    metadata: safeMetadata,
  });
}

export const DatasetPartition = Object.freeze({
  create: createDatasetPartition,
  is: isDatasetPartition,
});
