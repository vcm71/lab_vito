/**
 * SplitMetadata — traceability contract for grouped temporal splits.
 *
 * This object carries the source dataset identity, injected timestamps and
 * injected split identifiers. The phase keeps strategy and grouping keys
 * closed to the scientific contract established by the prompt.
 */

import { isDatasetIdentity } from './DatasetIdentity.js';
import { isIsoTimestamp } from './DatasetAssemblyOptions.js';
import { deepFreeze } from './immutable.js';
import { InvalidSplitMetadataError } from './errors.js';

export const GROUPED_TEMPORAL_SPLIT_STRATEGY = 'GROUPED_TEMPORAL';
export const GROUPED_TEMPORAL_GROUPING_KEY = 'spinId';
export const GROUPED_TEMPORAL_TEMPORAL_KEY = 'predictionCreatedAt';

function assertNonEmptyString(field, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidSplitMetadataError(`invalid ${field}: ${JSON.stringify(value)}`);
  }
  return value;
}

export function isSplitMetadata(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.strategy === GROUPED_TEMPORAL_SPLIT_STRATEGY &&
    value.groupingKey === GROUPED_TEMPORAL_GROUPING_KEY &&
    value.temporalKey === GROUPED_TEMPORAL_TEMPORAL_KEY &&
    isDatasetIdentity(value.sourceDatasetIdentity) &&
    typeof value.createdAt === 'string' &&
    isIsoTimestamp(value.createdAt) &&
    typeof value.splitId === 'string' &&
    value.splitId.length > 0
  );
}

export function createSplitMetadata({
  sourceDatasetIdentity,
  createdAt,
  splitId,
  strategy = GROUPED_TEMPORAL_SPLIT_STRATEGY,
  groupingKey = GROUPED_TEMPORAL_GROUPING_KEY,
  temporalKey = GROUPED_TEMPORAL_TEMPORAL_KEY,
}) {
  if (!isDatasetIdentity(sourceDatasetIdentity)) {
    throw new InvalidSplitMetadataError('invalid sourceDatasetIdentity');
  }
  const safeCreatedAt = assertNonEmptyString('createdAt', createdAt);
  if (!isIsoTimestamp(safeCreatedAt)) {
    throw new InvalidSplitMetadataError(`invalid createdAt: ${JSON.stringify(createdAt)}`);
  }
  const safeSplitId = assertNonEmptyString('splitId', splitId);
  if (strategy !== GROUPED_TEMPORAL_SPLIT_STRATEGY) {
    throw new InvalidSplitMetadataError(`unsupported strategy: ${JSON.stringify(strategy)}`);
  }
  if (groupingKey !== GROUPED_TEMPORAL_GROUPING_KEY) {
    throw new InvalidSplitMetadataError(`unsupported groupingKey: ${JSON.stringify(groupingKey)}`);
  }
  if (temporalKey !== GROUPED_TEMPORAL_TEMPORAL_KEY) {
    throw new InvalidSplitMetadataError(`unsupported temporalKey: ${JSON.stringify(temporalKey)}`);
  }

  return deepFreeze({
    sourceDatasetIdentity,
    strategy,
    groupingKey,
    temporalKey,
    createdAt: safeCreatedAt,
    splitId: safeSplitId,
  });
}

export const SplitMetadata = Object.freeze({
  create: createSplitMetadata,
  is: isSplitMetadata,
  strategy: GROUPED_TEMPORAL_SPLIT_STRATEGY,
  groupingKey: GROUPED_TEMPORAL_GROUPING_KEY,
  temporalKey: GROUPED_TEMPORAL_TEMPORAL_KEY,
});
