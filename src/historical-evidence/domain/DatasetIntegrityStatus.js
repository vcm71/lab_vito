import { deepFreeze } from './immutable.js';

export const DATASET_INTEGRITY_STATUS = deepFreeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  INCOMPLETE: 'INCOMPLETE',
});

export function isDatasetIntegrityStatus(value) {
  return Object.values(DATASET_INTEGRITY_STATUS).includes(value);
}
