import { DatasetComparator } from './DatasetComparator.js';
import { compareDatasetVersions, datasetVersionToString } from '../domain/DatasetVersion.js';
import { datasetIdentityToJSON, isDatasetIdentity } from '../domain/DatasetIdentity.js';
import { createDatasetSnapshotDescriptor } from '../domain/DatasetSnapshotDescriptor.js';
import { createDatasetLineageRelation, DatasetLineageRelation } from '../domain/DatasetLineageRelation.js';
import { DatasetLineageResolution, createDatasetLineageResolution } from '../domain/DatasetLineageResolution.js';
import { DATASET_LINEAGE_EVIDENCE_SOURCE } from '../domain/DatasetLineageEvidenceSource.js';
import { DATASET_LINEAGE_RELATION_TYPE } from '../domain/DatasetLineageRelationType.js';
import { DATASET_COMPARISON_CLASSIFICATION } from '../domain/DatasetComparisonClassification.js';
import { VERSION_COMPATIBILITY } from '../domain/DatasetVersionPolicy.js';
import {
  InvalidDatasetLineageInputError,
  InvalidDatasetLineageOptionsError,
} from '../domain/errors.js';

const SUPERSEDING_MARKERS = new Set(['SUPERSEDE', 'REPLACEMENT', 'REPLACED_BY_NEW_SNAPSHOT']);

const COMPATIBLE_CLASSIFICATIONS = new Set([
  DATASET_COMPARISON_CLASSIFICATION.EXACT_MATCH,
  DATASET_COMPARISON_CLASSIFICATION.SCIENTIFICALLY_EQUIVALENT,
  DATASET_COMPARISON_CLASSIFICATION.OPERATIONALLY_EQUIVALENT,
  DATASET_COMPARISON_CLASSIFICATION.COMPATIBLE_EVOLUTION,
  DATASET_COMPARISON_CLASSIFICATION.DIVERGENT,
]);

const RELATION_PRIORITY = new Map([
  [DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES, 0],
  [DATASET_LINEAGE_RELATION_TYPE.PARENT_OF, 1],
  [DATASET_LINEAGE_RELATION_TYPE.DERIVED_FROM, 2],
  [DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO, 3],
  [DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO, 4],
  [DATASET_LINEAGE_RELATION_TYPE.BRANCH_OF, 5],
  [DATASET_LINEAGE_RELATION_TYPE.MERGE_CANDIDATE, 6],
  [DATASET_LINEAGE_RELATION_TYPE.UNRELATED, 7],
  [DATASET_LINEAGE_RELATION_TYPE.INCOMPATIBLE, 8],
  [DATASET_LINEAGE_RELATION_TYPE.INDETERMINATE, 9],
]);

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeOptions(options) {
  if (options === undefined || options === null) return {};
  if (!isPlainObject(options)) {
    throw new InvalidDatasetLineageOptionsError('options must be a plain object');
  }
  return options;
}

function assertInput(input) {
  if (!isPlainObject(input)) {
    throw new InvalidDatasetLineageInputError('input must be a plain object with left and right dataset operands');
  }
  if (!isPlainObject(input.left) || !isPlainObject(input.right)) {
    throw new InvalidDatasetLineageInputError('input.left and input.right must be plain objects');
  }
  if (!('dataset' in input.left) || !('dataset' in input.right)) {
    throw new InvalidDatasetLineageInputError('input.left.dataset and input.right.dataset are required');
  }
}

function resolveIdentity(side, label) {
  if (side.identity !== undefined && side.identity !== null) {
    if (!isDatasetIdentity(side.identity)) {
      throw new InvalidDatasetLineageInputError(`${label}.identity must be a valid DatasetIdentity object when provided`);
    }
    return side.identity;
  }
  if (isPlainObject(side.descriptor) && isPlainObject(side.descriptor.identity)) {
    if (!isDatasetIdentity(side.descriptor.identity)) {
      throw new InvalidDatasetLineageInputError(`${label}.descriptor.identity must be a valid DatasetIdentity object when provided`);
    }
    return side.descriptor.identity;
  }
  return null;
}

function resolveDescriptor(side, label, identity) {
  if (side.descriptor !== undefined && side.descriptor !== null) {
    if (!isPlainObject(side.descriptor)) {
      throw new InvalidDatasetLineageInputError(`${label}.descriptor must be a plain object when provided`);
    }
    return side.descriptor;
  }
  if (!identity) return null;
  return createDatasetSnapshotDescriptor({
    identity,
    createdAt: side.dataset.createdAt,
    period: side.dataset.period,
    manifest: side.dataset.manifest,
    statistics: side.dataset.statistics,
    policies: null,
    filters: null,
  });
}

function normalizeProvenance(provenance) {
  if (provenance === undefined || provenance === null) return null;
  if (!isPlainObject(provenance)) {
    throw new InvalidDatasetLineageInputError('descriptor.provenance must be a plain object when provided');
  }
  return {
    sourceDatasetId: provenance.sourceDatasetId ?? null,
    sourceContentHash: provenance.sourceContentHash ?? null,
    parentDatasetVersion: provenance.parentDatasetVersion ?? null,
    assemblyReason: provenance.assemblyReason ?? null,
    transformationType: provenance.transformationType ?? null,
  };
}

function isSupersedingProvenance(provenance) {
  if (!provenance) return false;
  const marker = `${provenance.transformationType ?? ''} ${provenance.assemblyReason ?? ''}`.toUpperCase();
  return Array.from(SUPERSEDING_MARKERS).some((token) => marker.includes(token));
}

function sourceMatchesIdentity(provenance, identity) {
  if (!provenance || !identity) return false;
  if (provenance.sourceDatasetId !== null && provenance.sourceDatasetId !== identity.datasetId) return false;
  if (provenance.sourceContentHash !== null && provenance.sourceContentHash !== identity.contentHash) return false;
  return provenance.sourceDatasetId !== null || provenance.sourceContentHash !== null;
}

function isDirectParentRelation(provenance, sourceIdentity) {
  if (!sourceMatchesIdentity(provenance, sourceIdentity)) return false;
  if (provenance.parentDatasetVersion === null) return false;
  return compareDatasetVersions(provenance.parentDatasetVersion, sourceIdentity.datasetVersion) === 0;
}

function hasSharedDeclaredSource(leftProvenance, rightProvenance) {
  if (!leftProvenance || !rightProvenance) return false;
  if (leftProvenance.sourceDatasetId === null || rightProvenance.sourceDatasetId === null) return false;
  if (leftProvenance.sourceDatasetId !== rightProvenance.sourceDatasetId) return false;
  if (leftProvenance.sourceContentHash !== null && rightProvenance.sourceContentHash !== null && leftProvenance.sourceContentHash !== rightProvenance.sourceContentHash) {
    return false;
  }
  return true;
}

function createRelation(type, source, target, detail) {
  return createDatasetLineageRelation({
    type,
    source,
    target,
    declared: Boolean(detail.declared),
    derived: Boolean(detail.derived),
    evidenceSource: detail.evidenceSource,
    evidenceSources: detail.evidenceSources,
    reason: detail.reason,
    metadata: detail.metadata ?? null,
  });
}

function sortRelations(relations) {
  return [...relations].sort((a, b) => {
    const priorityA = RELATION_PRIORITY.get(a.type) ?? 99;
    const priorityB = RELATION_PRIORITY.get(b.type) ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.relationId.localeCompare(b.relationId);
  });
}

function buildSummary({ comparison, leftIdentity, rightIdentity, leftProvenance, rightProvenance, relationTypes, declaredRelationTypes, derivedRelationTypes }) {
  return {
    comparisonClassification: comparison.classification,
    comparisonReason: comparison.reason ?? null,
    versionCompatibility: comparison.summary?.versionCompatibility ?? null,
    integrityComparable: comparison.summary?.integrityComparable ?? null,
    observationSharedCount: comparison.summary?.observationSharedCount ?? 0,
    observationOnlyLeftCount: comparison.summary?.observationOnlyLeftCount ?? 0,
    observationOnlyRightCount: comparison.summary?.observationOnlyRightCount ?? 0,
    observationConflictCount: comparison.summary?.observationConflictCount ?? 0,
    leftIdentity: datasetIdentityToJSON(leftIdentity),
    rightIdentity: datasetIdentityToJSON(rightIdentity),
    leftDatasetId: leftIdentity.datasetId,
    rightDatasetId: rightIdentity.datasetId,
    leftVersion: datasetVersionToString(leftIdentity.datasetVersion),
    rightVersion: datasetVersionToString(rightIdentity.datasetVersion),
    leftSourceDatasetId: leftProvenance?.sourceDatasetId ?? null,
    rightSourceDatasetId: rightProvenance?.sourceDatasetId ?? null,
    sharedSourceDatasetId: leftProvenance && rightProvenance && leftProvenance.sourceDatasetId === rightProvenance.sourceDatasetId
      ? leftProvenance.sourceDatasetId
      : null,
    sharedSourceContentHash: leftProvenance && rightProvenance && leftProvenance.sourceContentHash === rightProvenance.sourceContentHash
      ? leftProvenance.sourceContentHash
      : null,
    declaredRelationCount: declaredRelationTypes.length,
    derivedRelationCount: derivedRelationTypes.length,
    relationCount: relationTypes.length,
    relationTypes,
  };
}

export class DatasetLineageResolver {
  constructor({ comparator = new DatasetComparator() } = {}) {
    this.comparator = comparator;
  }

  resolve(input, options = {}) {
    assertInput(input);
    const safeOptions = normalizeOptions(options);
    const compareOptions = safeOptions.comparisonOptions ?? safeOptions.compareOptions ?? {};
    const comparison = this.comparator.compare(input, compareOptions);

    const leftIdentity = resolveIdentity(input.left, 'input.left');
    const rightIdentity = resolveIdentity(input.right, 'input.right');

    if (!isDatasetIdentity(leftIdentity) || !isDatasetIdentity(rightIdentity)) {
      throw new InvalidDatasetLineageInputError('both sides must provide a valid dataset identity either directly or through the dataset payload');
    }

    const leftDescriptor = resolveDescriptor(input.left, 'input.left', leftIdentity);
    const rightDescriptor = resolveDescriptor(input.right, 'input.right', rightIdentity);
    const leftProvenance = normalizeProvenance(leftDescriptor?.provenance ?? null);
    const rightProvenance = normalizeProvenance(rightDescriptor?.provenance ?? null);

    const relations = [];
    const declaredRelationTypes = [];
    const derivedRelationTypes = [];

    const leftDeclaresRight = isDirectParentRelation(leftProvenance, rightIdentity);
    const rightDeclaresLeft = isDirectParentRelation(rightProvenance, leftIdentity);

    if (leftDeclaresRight) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.PARENT_OF,
        rightIdentity,
        leftIdentity,
        {
          declared: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION],
          reason: 'left snapshot declares the right snapshot as its direct parent',
        },
      ));
      declaredRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.PARENT_OF);

      if (isSupersedingProvenance(leftProvenance) && comparison.summary?.versionCompatibility !== VERSION_COMPATIBILITY.INCOMPATIBLE) {
        relations.push(createRelation(
          DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES,
          leftIdentity,
          rightIdentity,
          {
            declared: true,
            evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION,
            evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION],
            reason: 'left snapshot explicitly replaces the right snapshot',
          },
        ));
        declaredRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES);
      }
    }

    if (rightDeclaresLeft) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.PARENT_OF,
        leftIdentity,
        rightIdentity,
        {
          declared: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION],
          reason: 'right snapshot declares the left snapshot as its direct parent',
        },
      ));
      declaredRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.PARENT_OF);

      if (isSupersedingProvenance(rightProvenance) && comparison.summary?.versionCompatibility !== VERSION_COMPATIBILITY.INCOMPATIBLE) {
        relations.push(createRelation(
          DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES,
          rightIdentity,
          leftIdentity,
          {
            declared: true,
            evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION,
            evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DECLARED_RELATION],
            reason: 'right snapshot explicitly replaces the left snapshot',
          },
        ));
        declaredRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.SUPERSEDES);
      }
    }

    const classification = comparison.classification;
    const versionCompatibility = comparison.summary?.versionCompatibility ?? null;
    const observationOnlyLeft = comparison.summary?.observationOnlyLeftCount ?? 0;
    const observationOnlyRight = comparison.summary?.observationOnlyRightCount ?? 0;
    const observationConflict = comparison.summary?.observationConflictCount ?? 0;
    const compatibleEvolution = classification === DATASET_COMPARISON_CLASSIFICATION.COMPATIBLE_EVOLUTION;
    const exactMatch = classification === DATASET_COMPARISON_CLASSIFICATION.EXACT_MATCH;
    const scientificEquivalent = classification === DATASET_COMPARISON_CLASSIFICATION.SCIENTIFICALLY_EQUIVALENT || exactMatch;
    const operationalEquivalent = classification === DATASET_COMPARISON_CLASSIFICATION.OPERATIONALLY_EQUIVALENT || exactMatch;
    const divergent = classification === DATASET_COMPARISON_CLASSIFICATION.DIVERGENT;
    const incompatible = classification === DATASET_COMPARISON_CLASSIFICATION.INCOMPATIBLE;
    const indeterminate = classification === DATASET_COMPARISON_CLASSIFICATION.INDETERMINATE;

    if (scientificEquivalent) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO,
        leftIdentity,
        rightIdentity,
        {
          derived: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
          reason: exactMatch ? 'datasets are scientifically and operationally identical' : 'datasets preserve the same scientific content',
        },
      ));
      derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.SCIENTIFICALLY_EQUIVALENT_TO);
    }

    if (operationalEquivalent) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO,
        leftIdentity,
        rightIdentity,
        {
          derived: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
          reason: exactMatch ? 'datasets are operationally identical' : 'datasets remain operationally compatible',
        },
      ));
      derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.OPERATIONALLY_EQUIVALENT_TO);
    }

    if (compatibleEvolution) {
      if (observationOnlyLeft > 0 && observationOnlyRight === 0 && observationConflict === 0) {
        relations.push(createRelation(
          DATASET_LINEAGE_RELATION_TYPE.DERIVED_FROM,
          rightIdentity,
          leftIdentity,
          {
            derived: true,
            evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
            evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
            reason: 'left snapshot extends the right snapshot without logical conflicts',
          },
        ));
        derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.DERIVED_FROM);
      } else if (observationOnlyRight > 0 && observationOnlyLeft === 0 && observationConflict === 0) {
        relations.push(createRelation(
          DATASET_LINEAGE_RELATION_TYPE.DERIVED_FROM,
          leftIdentity,
          rightIdentity,
          {
            derived: true,
            evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
            evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
            reason: 'right snapshot extends the left snapshot without logical conflicts',
          },
        ));
        derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.DERIVED_FROM);
      } else if (hasSharedDeclaredSource(leftProvenance, rightProvenance)) {
        relations.push(createRelation(
          DATASET_LINEAGE_RELATION_TYPE.BRANCH_OF,
          leftIdentity,
          rightIdentity,
          {
            derived: true,
            evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
            evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
            reason: 'datasets branch from the same declared source snapshot',
          },
        ));
        derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.BRANCH_OF);
      }
    }

    if (divergent && hasSharedDeclaredSource(leftProvenance, rightProvenance)) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.MERGE_CANDIDATE,
        leftIdentity,
        rightIdentity,
        {
          derived: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
          reason: 'divergent siblings share the same declared source and may need reconciliation',
        },
      ));
      derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.MERGE_CANDIDATE);
    }

    if (incompatible) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.INCOMPATIBLE,
        leftIdentity,
        rightIdentity,
        {
          derived: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
          reason: comparison.reason ?? 'datasets cannot be reconciled under the current version policy',
        },
      ));
      derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.INCOMPATIBLE);
    }

    if (indeterminate && relations.length === 0) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.INDETERMINATE,
        leftIdentity,
        rightIdentity,
        {
          derived: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.UNKNOWN,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.UNKNOWN],
          reason: comparison.reason ?? 'insufficient evidence to establish a stable lineage relation',
        },
      ));
      derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.INDETERMINATE);
    }

    if (!scientificEquivalent && !operationalEquivalent && !compatibleEvolution && !divergent && !incompatible && !indeterminate && relations.length === 0) {
      relations.push(createRelation(
        DATASET_LINEAGE_RELATION_TYPE.UNRELATED,
        leftIdentity,
        rightIdentity,
        {
          derived: true,
          evidenceSource: DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION,
          evidenceSources: [DATASET_LINEAGE_EVIDENCE_SOURCE.DERIVED_RELATION],
          reason: 'no declared or derived lineage relation was found between the datasets',
        },
      ));
      derivedRelationTypes.push(DATASET_LINEAGE_RELATION_TYPE.UNRELATED);
    }

    const sortedRelations = sortRelations(relations);
    const relationTypes = sortedRelations.map((relation) => relation.type);
    const primaryRelation = sortedRelations[0] ?? null;
    const compatible = relationTypes.some((type) => type !== DATASET_LINEAGE_RELATION_TYPE.INDETERMINATE && type !== DATASET_LINEAGE_RELATION_TYPE.INCOMPATIBLE)
      && comparison.classification !== DATASET_COMPARISON_CLASSIFICATION.INDETERMINATE;
    const resolved = relationTypes.length > 0 && relationTypes[0] !== DATASET_LINEAGE_RELATION_TYPE.INDETERMINATE;
    const evidenceSources = [...new Set(sortedRelations.flatMap((relation) => relation.evidenceSources))];

    return createDatasetLineageResolution({
      left: leftIdentity,
      right: rightIdentity,
      primaryRelation,
      relations: sortedRelations,
      relationTypes,
      declaredRelationTypes: [...new Set(declaredRelationTypes)],
      derivedRelationTypes: [...new Set(derivedRelationTypes)],
      evidenceSources,
      resolved,
      compatible,
      comparable: COMPATIBLE_CLASSIFICATIONS.has(comparison.classification),
      reason: comparison.reason ?? null,
      comparisonClassification: comparison.classification,
      versionCompatibility,
      integrityComparable: comparison.summary?.integrityComparable ?? null,
      summary: buildSummary({
        comparison,
        leftIdentity,
        rightIdentity,
        leftProvenance,
        rightProvenance,
        relationTypes,
        declaredRelationTypes: [...new Set(declaredRelationTypes)],
        derivedRelationTypes: [...new Set(derivedRelationTypes)],
      }),
    });
  }
}

export const DATASET_LINEAGE_RESOLVER = Object.freeze({
  create: (options) => new DatasetLineageResolver(options),
});

export { DatasetLineageRelation, DatasetLineageResolution };
