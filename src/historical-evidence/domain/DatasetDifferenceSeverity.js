import { deepFreeze } from './immutable.js';

export const DATASET_DIFFERENCE_SEVERITY = deepFreeze({
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
});

const VALUES = new Set(Object.values(DATASET_DIFFERENCE_SEVERITY));

export function isDatasetDifferenceSeverity(value) {
  return typeof value === 'string' && VALUES.has(value);
}

export const DatasetDifferenceSeverity = Object.freeze({
  ...DATASET_DIFFERENCE_SEVERITY,
  is: isDatasetDifferenceSeverity,
});
