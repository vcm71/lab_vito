import { deepFreeze } from './immutable.js';

export const DATASET_LINEAGE_EVIDENCE_SOURCE = deepFreeze({
  DECLARED_RELATION: 'DECLARED_RELATION',
  DERIVED_RELATION: 'DERIVED_RELATION',
  MIXED: 'MIXED',
  UNKNOWN: 'UNKNOWN',
});

const VALUES = new Set(Object.values(DATASET_LINEAGE_EVIDENCE_SOURCE));

export function isDatasetLineageEvidenceSource(value) {
  return typeof value === 'string' && VALUES.has(value);
}

export const DatasetLineageEvidenceSource = Object.freeze({
  ...DATASET_LINEAGE_EVIDENCE_SOURCE,
  is: isDatasetLineageEvidenceSource,
});
