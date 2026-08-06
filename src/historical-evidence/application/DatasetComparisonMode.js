import { deepFreeze } from '../domain/immutable.js';
import { InvalidDatasetComparisonOptionsError } from '../domain/errors.js';

export const DATASET_COMPARISON_MODE = deepFreeze({
  SCIENTIFIC: 'SCIENTIFIC',
  OPERATIONAL: 'OPERATIONAL',
  FULL: 'FULL',
});

const VALUES = new Set(Object.values(DATASET_COMPARISON_MODE));

export function isDatasetComparisonMode(value) {
  return typeof value === 'string' && VALUES.has(value);
}

export function normalizeDatasetComparisonMode(value = DATASET_COMPARISON_MODE.FULL) {
  if (value === undefined || value === null) {
    return DATASET_COMPARISON_MODE.FULL;
  }
  if (!isDatasetComparisonMode(value)) {
    throw new InvalidDatasetComparisonOptionsError(`unsupported comparison mode ${JSON.stringify(value)}`);
  }
  return value;
}

export const DatasetComparisonMode = Object.freeze({
  ...DATASET_COMPARISON_MODE,
  is: isDatasetComparisonMode,
  normalize: normalizeDatasetComparisonMode,
});
