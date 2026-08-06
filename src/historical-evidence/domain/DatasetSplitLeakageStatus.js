import { deepFreeze } from './immutable.js';

export const DATASET_SPLIT_LEAKAGE_STATUS = deepFreeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  INCOMPLETE: 'INCOMPLETE',
});

export function isDatasetSplitLeakageStatus(value) {
  return Object.values(DATASET_SPLIT_LEAKAGE_STATUS).includes(value);
}
