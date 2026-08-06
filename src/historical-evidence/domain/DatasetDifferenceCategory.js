import { deepFreeze } from './immutable.js';

export const DATASET_DIFFERENCE_CATEGORY = deepFreeze({
  IDENTITY: 'IDENTITY',
  VERSION: 'VERSION',
  SCHEMA: 'SCHEMA',
  CONTENT_HASH: 'CONTENT_HASH',
  MANIFEST_HASH: 'MANIFEST_HASH',
  PERIOD: 'PERIOD',
  OBSERVATIONS: 'OBSERVATIONS',
  STATISTICS: 'STATISTICS',
  MANIFEST: 'MANIFEST',
  DESCRIPTOR: 'DESCRIPTOR',
  POLICIES: 'POLICIES',
  FILTERS: 'FILTERS',
  PROVENANCE: 'PROVENANCE',
  LINEAGE: 'LINEAGE',
  METADATA: 'METADATA',
  INTEGRITY: 'INTEGRITY',
});

const VALUES = new Set(Object.values(DATASET_DIFFERENCE_CATEGORY));

export function isDatasetDifferenceCategory(value) {
  return typeof value === 'string' && VALUES.has(value);
}

export const DatasetDifferenceCategory = Object.freeze({
  ...DATASET_DIFFERENCE_CATEGORY,
  is: isDatasetDifferenceCategory,
});
