import { deepFreeze } from './immutable.js';
import { datasetIdentityToJSON, isDatasetIdentity } from './DatasetIdentity.js';
import { datasetLineageRelationToJSON, isDatasetLineageRelation } from './DatasetLineageRelation.js';
import {
  DATASET_LINEAGE_EVIDENCE_SOURCE,
  isDatasetLineageEvidenceSource,
} from './DatasetLineageEvidenceSource.js';
import { DATASET_LINEAGE_RELATION_TYPE, isDatasetLineageRelationType } from './DatasetLineageRelationType.js';
import { InvalidDatasetLineageResolutionError } from './errors.js';

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function assertIdentity(value, label) {
  if (!isDatasetIdentity(value)) {
    throw new InvalidDatasetLineageResolutionError(`${label} must be a valid DatasetIdentity object`);
  }
  return value;
}

function normalizeRelationList(relations) {
  if (relations === undefined || relations === null) return Object.freeze([]);
  if (!Array.isArray(relations)) {
    throw new InvalidDatasetLineageResolutionError('relations must be an array when provided');
  }
  const safe = [];
  for (const relation of relations) {
    if (!isDatasetLineageRelation(relation)) {
      throw new InvalidDatasetLineageResolutionError('relations contains an invalid DatasetLineageRelation object');
    }
    if (!safe.some((item) => item.relationId === relation.relationId)) {
      safe.push(relation);
    }
  }
  return Object.freeze(safe);
}

function normalizeEvidenceSources(evidenceSources, relationSources) {
  const sources = [];
  const sourceList = evidenceSources ?? relationSources;
  if (sourceList === undefined || sourceList === null) {
    return Object.freeze([DATASET_LINEAGE_EVIDENCE_SOURCE.UNKNOWN]);
  }
  if (!Array.isArray(sourceList)) {
    throw new InvalidDatasetLineageResolutionError('evidenceSources must be an array when provided');
  }
  for (const source of sourceList) {
    if (!isDatasetLineageEvidenceSource(source)) {
      throw new InvalidDatasetLineageResolutionError(`evidenceSources contains an invalid value: ${JSON.stringify(source)}`);
    }
    if (!sources.includes(source)) sources.push(source);
  }
  return Object.freeze(sources.length > 0 ? sources : [DATASET_LINEAGE_EVIDENCE_SOURCE.UNKNOWN]);
}

function normalizeTypes(types) {
  if (types === undefined || types === null) return Object.freeze([]);
  if (!Array.isArray(types)) {
    throw new InvalidDatasetLineageResolutionError('relationTypes must be an array when provided');
  }
  const safe = [];
  for (const type of types) {
    if (!isDatasetLineageRelationType(type)) {
      throw new InvalidDatasetLineageResolutionError(`relationTypes contains an invalid value: ${JSON.stringify(type)}`);
    }
    if (!safe.includes(type)) safe.push(type);
  }
  return Object.freeze(safe);
}

function normalizeSummary(summary) {
  if (summary === undefined || summary === null) return null;
  if (!isPlainObject(summary)) {
    throw new InvalidDatasetLineageResolutionError('summary must be a plain object when provided');
  }
  return summary;
}

function buildResolutionId(left, right, relationTypes) {
  return [
    left.datasetId ?? 'unknown-left',
    left.datasetVersion ? `${left.datasetVersion.major}.${left.datasetVersion.minor}.${left.datasetVersion.patch}` : 'unknown-left-version',
    right.datasetId ?? 'unknown-right',
    right.datasetVersion ? `${right.datasetVersion.major}.${right.datasetVersion.minor}.${right.datasetVersion.patch}` : 'unknown-right-version',
    relationTypes.length > 0 ? relationTypes.join('+') : DATASET_LINEAGE_RELATION_TYPE.INDETERMINATE,
  ].join('|');
}

export function createDatasetLineageResolution({
  resolutionId,
  left,
  right,
  primaryRelation = null,
  relations = [],
  relationTypes,
  declaredRelationTypes,
  derivedRelationTypes,
  evidenceSources,
  resolved,
  compatible,
  comparable,
  reason = null,
  comparisonClassification = null,
  versionCompatibility = null,
  integrityComparable = null,
  summary = null,
}) {
  const safeLeft = assertIdentity(left, 'left');
  const safeRight = assertIdentity(right, 'right');
  const safePrimaryRelation = primaryRelation === null ? null : isDatasetLineageRelation(primaryRelation)
    ? primaryRelation
    : (() => { throw new InvalidDatasetLineageResolutionError('primaryRelation must be null or a valid DatasetLineageRelation object'); })();
  const safeRelations = normalizeRelationList(relations);
  const safeRelationTypes = normalizeTypes(relationTypes ?? safeRelations.map((relation) => relation.type));
  const safeDeclaredRelationTypes = normalizeTypes(declaredRelationTypes);
  const safeDerivedRelationTypes = normalizeTypes(derivedRelationTypes);
  const safeEvidenceSources = normalizeEvidenceSources(evidenceSources, safeRelations.map((relation) => relation.evidenceSource));
  const safeSummary = normalizeSummary(summary);
  const safeResolved = resolved === undefined ? safeRelationTypes.length > 0 : Boolean(resolved);
  const safeCompatible = compatible === undefined ? null : Boolean(compatible);
  const safeComparable = comparable === undefined ? null : Boolean(comparable);
  const safeReason = reason === undefined || reason === null ? null : String(reason);
  const safeComparisonClassification = comparisonClassification === undefined ? null : comparisonClassification;
  const safeVersionCompatibility = versionCompatibility === undefined ? null : versionCompatibility;
  const safeIntegrityComparable = integrityComparable === undefined ? null : Boolean(integrityComparable);
  const safeResolutionId = typeof resolutionId === 'string' && resolutionId.trim().length > 0
    ? resolutionId
    : buildResolutionId(safeLeft, safeRight, safeRelationTypes);

  const resolution = {
    resolutionId: safeResolutionId,
    left: safeLeft,
    right: safeRight,
    primaryRelation: safePrimaryRelation,
    relations: safeRelations,
    relationTypes: safeRelationTypes,
    declaredRelationTypes: safeDeclaredRelationTypes,
    derivedRelationTypes: safeDerivedRelationTypes,
    evidenceSources: safeEvidenceSources,
    resolved: safeResolved,
    compatible: safeCompatible,
    comparable: safeComparable,
    reason: safeReason,
    comparisonClassification: safeComparisonClassification,
    versionCompatibility: safeVersionCompatibility,
    integrityComparable: safeIntegrityComparable,
    summary: safeSummary,
  };

  return Object.freeze(resolution);
}

export function isDatasetLineageResolution(value) {
  return isPlainObject(value)
    && typeof value.resolutionId === 'string'
    && isDatasetIdentity(value.left)
    && isDatasetIdentity(value.right)
    && (value.primaryRelation === null || isDatasetLineageRelation(value.primaryRelation))
    && Array.isArray(value.relations)
    && value.relations.every(isDatasetLineageRelation);
}

export function datasetLineageResolutionToJSON(resolution) {
  if (!isDatasetLineageResolution(resolution)) {
    throw new InvalidDatasetLineageResolutionError('resolution must be a valid DatasetLineageResolution object');
  }
  return {
    resolutionId: resolution.resolutionId,
    left: datasetIdentityToJSON(resolution.left),
    right: datasetIdentityToJSON(resolution.right),
    primaryRelation: resolution.primaryRelation === null ? null : datasetLineageRelationToJSON(resolution.primaryRelation),
    relations: resolution.relations.map(datasetLineageRelationToJSON),
    relationTypes: [...resolution.relationTypes],
    declaredRelationTypes: [...resolution.declaredRelationTypes],
    derivedRelationTypes: [...resolution.derivedRelationTypes],
    evidenceSources: [...resolution.evidenceSources],
    resolved: resolution.resolved,
    compatible: resolution.compatible,
    comparable: resolution.comparable,
    reason: resolution.reason,
    comparisonClassification: resolution.comparisonClassification,
    versionCompatibility: resolution.versionCompatibility,
    integrityComparable: resolution.integrityComparable,
    summary: resolution.summary,
  };
}

export function getDatasetLineagePrimaryRelation(resolution) {
  if (!isDatasetLineageResolution(resolution)) {
    throw new InvalidDatasetLineageResolutionError('resolution must be a valid DatasetLineageResolution object');
  }
  return resolution.primaryRelation;
}

export function hasDatasetLineageRelationType(resolution, type) {
  if (!isDatasetLineageResolution(resolution)) {
    throw new InvalidDatasetLineageResolutionError('resolution must be a valid DatasetLineageResolution object');
  }
  if (!isDatasetLineageRelationType(type)) {
    throw new InvalidDatasetLineageResolutionError('type must be a valid DatasetLineageRelationType');
  }
  return resolution.relationTypes.includes(type);
}

export function getDatasetLineageRelation(resolution, type) {
  if (!isDatasetLineageResolution(resolution)) {
    throw new InvalidDatasetLineageResolutionError('resolution must be a valid DatasetLineageResolution object');
  }
  if (!isDatasetLineageRelationType(type)) {
    throw new InvalidDatasetLineageResolutionError('type must be a valid DatasetLineageRelationType');
  }
  return resolution.relations.find((relation) => relation.type === type) ?? null;
}

export const DatasetLineageResolution = Object.freeze({
  create: createDatasetLineageResolution,
  is: isDatasetLineageResolution,
  toJSON: datasetLineageResolutionToJSON,
  primaryRelation: getDatasetLineagePrimaryRelation,
  hasType: hasDatasetLineageRelationType,
  getRelation: getDatasetLineageRelation,
});
