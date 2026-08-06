import { deepFreeze } from './immutable.js';

export const DATASET_SPLIT_LEAKAGE_SEVERITY = deepFreeze({
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
});

export function isDatasetSplitLeakageSeverity(value) {
  return Object.values(DATASET_SPLIT_LEAKAGE_SEVERITY).includes(value);
}
