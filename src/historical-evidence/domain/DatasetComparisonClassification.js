import { deepFreeze } from './immutable.js';

export const DATASET_COMPARISON_CLASSIFICATION = deepFreeze({
  EXACT_MATCH: 'EXACT_MATCH',
  SCIENTIFICALLY_EQUIVALENT: 'SCIENTIFICALLY_EQUIVALENT',
  OPERATIONALLY_EQUIVALENT: 'OPERATIONALLY_EQUIVALENT',
  COMPATIBLE_EVOLUTION: 'COMPATIBLE_EVOLUTION',
  DIVERGENT: 'DIVERGENT',
  INCOMPATIBLE: 'INCOMPATIBLE',
  INDETERMINATE: 'INDETERMINATE',
});

const VALUES = new Set(Object.values(DATASET_COMPARISON_CLASSIFICATION));

export function isDatasetComparisonClassification(value) {
  return typeof value === 'string' && VALUES.has(value);
}

export const DatasetComparisonClassification = Object.freeze({
  ...DATASET_COMPARISON_CLASSIFICATION,
  is: isDatasetComparisonClassification,
});
