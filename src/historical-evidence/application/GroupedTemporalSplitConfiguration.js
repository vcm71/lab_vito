import {
  deepFreeze,
  isDatasetIdentity,
  isIsoTimestamp,
  InvalidGroupedTemporalSplitConfigurationError,
} from '../domain/index.js';

function assertValidTimestamp(name, value) {
  if (typeof value !== 'string' || !isIsoTimestamp(value)) {
    throw new InvalidGroupedTemporalSplitConfigurationError(`${name} must be a valid ISO timestamp`);
  }
}

export function isGroupedTemporalSplitConfiguration(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  if (!isDatasetIdentity(value.sourceDatasetIdentity)) {
    return false;
  }
  if (typeof value.trainUntil !== 'string' || !isIsoTimestamp(value.trainUntil)) {
    return false;
  }
  if (value.validationUntil !== null && value.validationUntil !== undefined && !isIsoTimestamp(value.validationUntil)) {
    return false;
  }
  if (value.validationUntil !== null && value.validationUntil !== undefined && value.validationUntil <= value.trainUntil) {
    return false;
  }
  return true;
}

export function createGroupedTemporalSplitConfiguration({
  sourceDatasetIdentity,
  trainUntil,
  validationUntil = null,
}) {
  if (!isDatasetIdentity(sourceDatasetIdentity)) {
    throw new InvalidGroupedTemporalSplitConfigurationError('sourceDatasetIdentity must be a valid DatasetIdentity');
  }
  assertValidTimestamp('trainUntil', trainUntil);
  if (validationUntil !== null && validationUntil !== undefined) {
    assertValidTimestamp('validationUntil', validationUntil);
    if (validationUntil <= trainUntil) {
      throw new InvalidGroupedTemporalSplitConfigurationError(
        'validationUntil must be strictly greater than trainUntil',
      );
    }
  }

  return deepFreeze({
    sourceDatasetIdentity,
    trainUntil,
    validationUntil: validationUntil ?? null,
  });
}
