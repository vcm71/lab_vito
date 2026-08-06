import { deepFreeze } from './immutable.js';

export const DATASET_LINEAGE_RELATION_TYPE = deepFreeze({
  PARENT_OF: 'PARENT_OF',
  CHILD_OF: 'CHILD_OF',
  DERIVED_FROM: 'DERIVED_FROM',
  SUPERSEDES: 'SUPERSEDES',
  SUPERSEDED_BY: 'SUPERSEDED_BY',
  SCIENTIFICALLY_EQUIVALENT_TO: 'SCIENTIFICALLY_EQUIVALENT_TO',
  OPERATIONALLY_EQUIVALENT_TO: 'OPERATIONALLY_EQUIVALENT_TO',
  BRANCH_OF: 'BRANCH_OF',
  MERGE_CANDIDATE: 'MERGE_CANDIDATE',
  UNRELATED: 'UNRELATED',
  INCOMPATIBLE: 'INCOMPATIBLE',
  INDETERMINATE: 'INDETERMINATE',
});

const TYPE_VALUES = Object.values(DATASET_LINEAGE_RELATION_TYPE);

const DATASET_LINEAGE_RELATION_TYPE_METADATA = deepFreeze({
  PARENT_OF: { type: 'PARENT_OF', directed: true, symmetric: false, inverse: 'CHILD_OF', declaredOnly: true },
  CHILD_OF: { type: 'CHILD_OF', directed: true, symmetric: false, inverse: 'PARENT_OF', declaredOnly: true },
  DERIVED_FROM: { type: 'DERIVED_FROM', directed: true, symmetric: false, inverse: null, declaredOnly: false },
  SUPERSEDES: { type: 'SUPERSEDES', directed: true, symmetric: false, inverse: 'SUPERSEDED_BY', declaredOnly: true },
  SUPERSEDED_BY: { type: 'SUPERSEDED_BY', directed: true, symmetric: false, inverse: 'SUPERSEDES', declaredOnly: true },
  SCIENTIFICALLY_EQUIVALENT_TO: { type: 'SCIENTIFICALLY_EQUIVALENT_TO', directed: false, symmetric: true, inverse: 'SCIENTIFICALLY_EQUIVALENT_TO', declaredOnly: false },
  OPERATIONALLY_EQUIVALENT_TO: { type: 'OPERATIONALLY_EQUIVALENT_TO', directed: false, symmetric: true, inverse: 'OPERATIONALLY_EQUIVALENT_TO', declaredOnly: false },
  BRANCH_OF: { type: 'BRANCH_OF', directed: false, symmetric: true, inverse: 'BRANCH_OF', declaredOnly: false },
  MERGE_CANDIDATE: { type: 'MERGE_CANDIDATE', directed: false, symmetric: true, inverse: 'MERGE_CANDIDATE', declaredOnly: false },
  UNRELATED: { type: 'UNRELATED', directed: false, symmetric: true, inverse: 'UNRELATED', declaredOnly: false },
  INCOMPATIBLE: { type: 'INCOMPATIBLE', directed: false, symmetric: true, inverse: 'INCOMPATIBLE', declaredOnly: false },
  INDETERMINATE: { type: 'INDETERMINATE', directed: false, symmetric: true, inverse: 'INDETERMINATE', declaredOnly: false },
});

const DIRECTED_TYPES = new Set(['PARENT_OF', 'CHILD_OF', 'DERIVED_FROM', 'SUPERSEDES', 'SUPERSEDED_BY']);
const SYMMETRIC_TYPES = new Set(['SCIENTIFICALLY_EQUIVALENT_TO', 'OPERATIONALLY_EQUIVALENT_TO', 'BRANCH_OF', 'MERGE_CANDIDATE', 'UNRELATED', 'INCOMPATIBLE', 'INDETERMINATE']);

export function isDatasetLineageRelationType(value) {
  return typeof value === 'string' && TYPE_VALUES.includes(value);
}

export function isDatasetLineageDirectedRelationType(value) {
  return typeof value === 'string' && DIRECTED_TYPES.has(value);
}

export function isDatasetLineageSymmetricRelationType(value) {
  return typeof value === 'string' && SYMMETRIC_TYPES.has(value);
}

export function getDatasetLineageRelationTypeMetadata(type) {
  return isDatasetLineageRelationType(type) ? DATASET_LINEAGE_RELATION_TYPE_METADATA[type] : null;
}

export function invertDatasetLineageRelationType(type) {
  const metadata = getDatasetLineageRelationTypeMetadata(type);
  return metadata ? metadata.inverse : null;
}

export const DatasetLineageRelationType = Object.freeze({
  ...DATASET_LINEAGE_RELATION_TYPE,
  is: isDatasetLineageRelationType,
  isDirected: isDatasetLineageDirectedRelationType,
  isSymmetric: isDatasetLineageSymmetricRelationType,
  metadata: getDatasetLineageRelationTypeMetadata,
  invert: invertDatasetLineageRelationType,
});
