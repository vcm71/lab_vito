/**
 * DatasetPartitionType — closed set of scientific split partitions.
 *
 * Fase 2.3.5.1 keeps the contract intentionally small: TRAIN, VALIDATION
 * and TEST are the only accepted values. No silent coercion.
 */

import { InvalidPartitionTypeError } from './errors.js';

export const DATASET_PARTITION_TYPES = Object.freeze(['TRAIN', 'VALIDATION', 'TEST']);

export function isDatasetPartitionType(value) {
  return DATASET_PARTITION_TYPES.includes(value);
}

export function assertDatasetPartitionType(value) {
  if (!isDatasetPartitionType(value)) {
    throw new InvalidPartitionTypeError(value);
  }
  return value;
}

export const DatasetPartitionType = Object.freeze({
  TRAIN: 'TRAIN',
  VALIDATION: 'VALIDATION',
  TEST: 'TEST',
  values: DATASET_PARTITION_TYPES,
  is: isDatasetPartitionType,
  assert: assertDatasetPartitionType,
});
