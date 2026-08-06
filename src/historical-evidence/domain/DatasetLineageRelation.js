import { deepFreeze } from './immutable.js';
import { datasetIdentityToJSON, datasetIdentitiesEqual, isDatasetIdentity } from './DatasetIdentity.js';
import {
  DATASET_LINEAGE_EVIDENCE_SOURCE,
  isDatasetLineageEvidenceSource,
} from './DatasetLineageEvidenceSource.js';
import {
  DATASET_LINEAGE_RELATION_TYPE,
  getDatasetLineageRelationTypeMetadata,
  invertDatasetLineageRelationType,
  isDatasetLineageRelationType,
} from './DatasetLineageRelationType.js';
import { InvalidDatasetLineageRelationError } from './errors.js';

const SELF_RELATION_BLOCKLIST = new Set([
  DATASET_LINEAGE_RELATION_TYPE.PARENT_OF,
  DATASET_LINEAGE_RELATION_TYPE.CHILD_OF,
  DATASET_LINEAGE_RELATION_TYPE.DERIVED_FROM,
  DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES,
  DATASET_LINEAGE_RELATION_TYPE.SUPERSEDED_BY,
  DATASET_LINEAGE_RELATION_TYPE.BRANCH_OF,
]);

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function assertRelationIdentity(value, label) {
  if (!isDatasetIdentity(value)) {
    throw new InvalidDatasetLineageRelationError(`${label} must be a valid DatasetIdentity object`);
  }
  return value;
}

function normalizeEvidenceSources(evidenceSource, evidenceSources) {
  const sources = [];
  if (evidenceSource !== undefined && evidenceSource !== null) {
    if (!isDatasetLineageEvidenceSource(evidenceSource)) {
      throw new InvalidDatasetLineageRelationError(`evidenceSource must be one of ${Object.values(DATASET_LINEAGE_EVIDENCE_SOURCE).join(', ')}`);
    }
    sources.push(evidenceSource);
  }
  if (Array.isArray(evidenceSources)) {
    for (const source of evidenceSources) {
      if (!isDatasetLineageEvidenceSource(source)) {
        throw new InvalidDatasetLineageRelationError(`evidenceSources contains an invalid value: ${JSON.stringify(source)}`);
      }
      if (!sources.includes(source)) sources.push(source);
    }
  }
  if (sources.length === 0) sources.push(DATASET_LINEAGE_EVIDENCE_SOURCE.UNKNOWN);
  return Object.freeze(sources);
}

function buildRelationId(type, source, target, relationId) {
  if (relationId !== undefined && relationId !== null) {
    if (typeof relationId !== 'string' || relationId.trim().length === 0) {
      throw new InvalidDatasetLineageRelationError('relationId must be a non-empty string when provided');
    }
    return relationId;
  }
  return [
    type,
    source.datasetId ?? 'unknown-source',
    source.datasetVersion ? `${source.datasetVersion.major}.${source.datasetVersion.minor}.${source.datasetVersion.patch}` : 'unknown-version',
    source.contentHash ?? 'no-source-hash',
    target.datasetId ?? 'unknown-target',
    target.datasetVersion ? `${target.datasetVersion.major}.${target.datasetVersion.minor}.${target.datasetVersion.patch}` : 'unknown-target-version',
    target.contentHash ?? 'no-target-hash',
  ].join('|');
}

function sameIdentity(source, target) {
  return datasetIdentitiesEqual(source, target);
}

function sanitizeMetadata(metadata) {
  if (metadata === undefined || metadata === null) return null;
  if (!isPlainObject(metadata)) {
    throw new InvalidDatasetLineageRelationError('metadata must be a plain object when provided');
  }
  return metadata;
}

export function createDatasetLineageRelation({
  relationId,
  type,
  source,
  target,
  declared = false,
  derived = false,
  evidenceSource,
  evidenceSources,
  reason = null,
  metadata = null,
}) {
  if (!isDatasetLineageRelationType(type)) {
    throw new InvalidDatasetLineageRelationError(`invalid relationType: ${JSON.stringify(type)}`);
  }
  const sourceIdentity = assertRelationIdentity(source, 'source');
  const targetIdentity = assertRelationIdentity(target, 'target');
  if (SELF_RELATION_BLOCKLIST.has(type) && sameIdentity(sourceIdentity, targetIdentity)) {
    throw new InvalidDatasetLineageRelationError(`${type} does not allow self-relations`);
  }
  const safeMetadata = sanitizeMetadata(metadata);
  const normalizedEvidenceSources = normalizeEvidenceSources(evidenceSource, evidenceSources);
  const safeReason = reason === undefined || reason === null ? null : String(reason);
  const safeRelationId = buildRelationId(type, sourceIdentity, targetIdentity, relationId);
  const relation = {
    relationId: safeRelationId,
    type,
    source: sourceIdentity,
    target: targetIdentity,
    declared: Boolean(declared),
    derived: Boolean(derived),
    evidenceSource: normalizedEvidenceSources[0],
    evidenceSources: normalizedEvidenceSources,
    direct: Boolean(getDatasetLineageRelationTypeMetadata(type)?.directed),
    symmetric: Boolean(getDatasetLineageRelationTypeMetadata(type)?.symmetric),
    inverseType: invertDatasetLineageRelationType(type),
    reason: safeReason,
    metadata: safeMetadata,
  };
  return deepFreeze(relation);
}

export function isDatasetLineageRelation(value) {
  return isPlainObject(value)
    && typeof value.relationId === 'string'
    && isDatasetLineageRelationType(value.type)
    && isDatasetIdentity(value.source)
    && isDatasetIdentity(value.target);
}

export function datasetLineageRelationToJSON(relation) {
  if (!isDatasetLineageRelation(relation)) {
    throw new InvalidDatasetLineageRelationError('relation must be a valid DatasetLineageRelation object');
  }
  return {
    relationId: relation.relationId,
    type: relation.type,
    source: datasetIdentityToJSON(relation.source),
    target: datasetIdentityToJSON(relation.target),
    declared: relation.declared,
    derived: relation.derived,
    evidenceSource: relation.evidenceSource,
    evidenceSources: [...relation.evidenceSources],
    direct: relation.direct,
    symmetric: relation.symmetric,
    inverseType: relation.inverseType,
    reason: relation.reason,
    metadata: relation.metadata,
  };
}

export function invertDatasetLineageRelation(relation) {
  if (!isDatasetLineageRelation(relation)) {
    throw new InvalidDatasetLineageRelationError('relation must be a valid DatasetLineageRelation object');
  }
  const inverseType = invertDatasetLineageRelationType(relation.type);
  if (inverseType === null) return null;
  return createDatasetLineageRelation({
    relationId: `${relation.relationId}:inverse`,
    type: inverseType,
    source: relation.target,
    target: relation.source,
    declared: relation.declared,
    derived: relation.derived,
    evidenceSource: relation.evidenceSource,
    evidenceSources: relation.evidenceSources,
    reason: relation.reason,
    metadata: relation.metadata,
  });
}

export function getDatasetLineageRelationDirection(relation) {
  if (!isDatasetLineageRelation(relation)) {
    throw new InvalidDatasetLineageRelationError('relation must be a valid DatasetLineageRelation object');
  }
  return getDatasetLineageRelationTypeMetadata(relation.type);
}

export const DatasetLineageRelation = Object.freeze({
  create: createDatasetLineageRelation,
  is: isDatasetLineageRelation,
  toJSON: datasetLineageRelationToJSON,
  invert: invertDatasetLineageRelation,
  direction: getDatasetLineageRelationDirection,
});
