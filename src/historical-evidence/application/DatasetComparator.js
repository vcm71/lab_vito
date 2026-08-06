import { canonicalSerialize } from '../../calibration/CanonicalHash.js';
import { DatasetIntegrityVerifier } from './DatasetIntegrityVerifier.js';
import { normalizeDatasetComparisonMode, DATASET_COMPARISON_MODE } from './DatasetComparisonMode.js';
import { createDatasetSnapshotDescriptor } from '../domain/DatasetSnapshotDescriptor.js';
import { datasetIdentitiesEqual, isDatasetIdentityOperationallyEquivalent } from '../domain/DatasetIdentity.js';
import { getDatasetVersionCompatibility, VERSION_COMPATIBILITY } from '../domain/DatasetVersionPolicy.js';
import { serializeDatasetIdentity, serializeDatasetSnapshotDescriptor, serializeScientificDataset } from './CanonicalDatasetSerializer.js';
import { DatasetComparisonClassification } from '../domain/DatasetComparisonClassification.js';
import { DatasetDifferenceCategory } from '../domain/DatasetDifferenceCategory.js';
import { DatasetDifferenceSeverity } from '../domain/DatasetDifferenceSeverity.js';
import { createDatasetDifference } from '../domain/DatasetDifference.js';
import { DatasetComparisonReport } from '../domain/DatasetComparisonReport.js';
import {
  InvalidDatasetComparisonInputError,
  InvalidDatasetComparisonOptionsError,
} from '../domain/errors.js';

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function toCanonicalString(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  return canonicalSerialize(value);
}

function assertInput(input) {
  if (!isPlainObject(input)) {
    throw new InvalidDatasetComparisonInputError('comparison input must be a plain object');
  }
  if (!isPlainObject(input.left) || !isPlainObject(input.right)) {
    throw new InvalidDatasetComparisonInputError('input.left and input.right must be plain objects');
  }
  if (!isPlainObject(input.left.dataset) || !isPlainObject(input.right.dataset)) {
    throw new InvalidDatasetComparisonInputError('input.left.dataset and input.right.dataset must be plain objects');
  }
}

function normalizeOptions(options) {
  if (options === undefined || options === null) {
    return { mode: DATASET_COMPARISON_MODE.FULL, requireValidIntegrity: true, maxDifferenceDetails: Number.POSITIVE_INFINITY };
  }
  if (!isPlainObject(options)) {
    throw new InvalidDatasetComparisonOptionsError('options must be a plain object');
  }
  const mode = normalizeDatasetComparisonMode(options.mode);
  const requireValidIntegrity = options.requireValidIntegrity === undefined ? true : Boolean(options.requireValidIntegrity);
  const maxDifferenceDetails = options.maxDifferenceDetails === undefined ? Number.POSITIVE_INFINITY : options.maxDifferenceDetails;
  if (Number.isFinite(maxDifferenceDetails) && (!Number.isInteger(maxDifferenceDetails) || maxDifferenceDetails < 0)) {
    throw new InvalidDatasetComparisonOptionsError('maxDifferenceDetails must be a non-negative integer or Infinity');
  }
  return { mode, requireValidIntegrity, maxDifferenceDetails };
}

function resolveIdentity(side) {
  if (isPlainObject(side.identity)) return side.identity;
  if (isPlainObject(side.descriptor) && isPlainObject(side.descriptor.identity)) return side.descriptor.identity;
  return null;
}

function resolveDescriptor(side, identity) {
  if (isPlainObject(side.descriptor)) return side.descriptor;
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

function pushDifference(bucket, payload) {
  bucket.count += 1;
  if (bucket.items.length >= bucket.max) {
    bucket.truncated = true;
    return;
  }
  bucket.items.push(
    createDatasetDifference({
      differenceId: `${payload.category}:${payload.path}:${bucket.count}`,
      ...payload,
    }),
  );
}

function compareField(bucket, { category, path, left, right, scientific = false, severity = DatasetDifferenceSeverity.ERROR, message = `${path} differs` }) {
  if (toCanonicalString(left) === toCanonicalString(right)) return false;
  pushDifference(bucket, { category, path, left, right, scientific, severity, message });
  return true;
}

function observationKey(observation) {
  if (isNonEmptyString(observation.observationId)) return `observationId:${observation.observationId}`;
  if (isNonEmptyString(observation.predictionId) && isNonEmptyString(observation.outcomeId)) {
    return `predictionOutcome:${observation.predictionId}:${observation.outcomeId}`;
  }
  if (isNonEmptyString(observation.predictionId)) return `predictionId:${observation.predictionId}`;
  if (isNonEmptyString(observation.spinId)) return `spinId:${observation.spinId}`;
  return `obs:${toCanonicalString(observation)}`;
}

function compareObservations(left, right, bucket) {
  const leftMap = new Map(left.map((item) => [observationKey(item), item]));
  const rightMap = new Map(right.map((item) => [observationKey(item), item]));
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();
  let shared = 0;
  let onlyLeft = 0;
  let onlyRight = 0;
  let conflicts = 0;

  for (const key of keys) {
    const l = leftMap.get(key);
    const r = rightMap.get(key);
    if (l && r) {
      if (toCanonicalString(l) === toCanonicalString(r)) {
        shared += 1;
      } else {
        conflicts += 1;
        const samePredictionDifferentOutcome = isNonEmptyString(l.predictionId) && isNonEmptyString(r.predictionId) && l.predictionId === r.predictionId && l.outcomeId !== r.outcomeId;
        pushDifference(bucket, {
          category: DatasetDifferenceCategory.OBSERVATIONS,
          path: `observations.${key}`,
          left: l,
          right: r,
          scientific: true,
          severity: DatasetDifferenceSeverity.ERROR,
          message: samePredictionDifferentOutcome ? 'same predictionId but different outcomeId' : 'observation content differs',
        });
      }
    } else if (l) {
      onlyLeft += 1;
      pushDifference(bucket, {
        category: DatasetDifferenceCategory.OBSERVATIONS,
        path: `observations.${key}`,
        left: l,
        right: null,
        scientific: true,
        severity: DatasetDifferenceSeverity.ERROR,
        message: 'observation exists only on left dataset',
      });
    } else if (r) {
      onlyRight += 1;
      pushDifference(bucket, {
        category: DatasetDifferenceCategory.OBSERVATIONS,
        path: `observations.${key}`,
        left: null,
        right: r,
        scientific: true,
        severity: DatasetDifferenceSeverity.ERROR,
        message: 'observation exists only on right dataset',
      });
    }
  }

  return { shared, onlyLeft, onlyRight, conflicts };
}

function compareScientific(left, right, bucket) {
  const sameContent = serializeScientificDataset(left) === serializeScientificDataset(right);
  if (sameContent) return { equivalent: true, relation: 'equal', observationRelation: { shared: left.observations.length, onlyLeft: 0, onlyRight: 0, conflicts: 0 } };

  compareField(bucket, { category: DatasetDifferenceCategory.CONTENT_HASH, path: 'dataset.contentHash', left: left.contentHash, right: right.contentHash, scientific: true, severity: DatasetDifferenceSeverity.ERROR });
  compareField(bucket, { category: DatasetDifferenceCategory.SCHEMA, path: 'dataset.schemaVersion', left: left.schemaVersion, right: right.schemaVersion, scientific: true, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.SCHEMA, path: 'dataset.observationSchemaVersion', left: left.observationSchemaVersion, right: right.observationSchemaVersion, scientific: true, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.PERIOD, path: 'dataset.period', left: left.period, right: right.period, scientific: true, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.MANIFEST_HASH, path: 'dataset.manifestHash', left: left.manifestHash, right: right.manifestHash, scientific: true, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.STATISTICS, path: 'dataset.statistics', left: left.statistics, right: right.statistics, scientific: true, severity: DatasetDifferenceSeverity.WARNING });

  const observationRelation = compareObservations(left.observations, right.observations, bucket);
  return { equivalent: false, relation: 'different', observationRelation };
}

function compareIdentity(left, right, bucket) {
  if (!left || !right) {
    return { comparable: false, equal: false, operationalEquivalent: false, versionCompatibility: null };
  }

  const versionCompatibility = getDatasetVersionCompatibility(left.datasetVersion, right.datasetVersion);
  compareField(bucket, { category: DatasetDifferenceCategory.IDENTITY, path: 'identity.datasetId', left: left.datasetId, right: right.datasetId, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.VERSION, path: 'identity.datasetVersion', left: left.datasetVersion, right: right.datasetVersion, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.SCHEMA, path: 'identity.schemaVersion', left: left.schemaVersion, right: right.schemaVersion, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.SCHEMA, path: 'identity.observationSchemaVersion', left: left.observationSchemaVersion, right: right.observationSchemaVersion, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.CONTENT_HASH, path: 'identity.contentHash', left: left.contentHash, right: right.contentHash, severity: DatasetDifferenceSeverity.ERROR, scientific: true });
  compareField(bucket, { category: DatasetDifferenceCategory.MANIFEST_HASH, path: 'identity.manifestHash', left: left.manifestHash, right: right.manifestHash, severity: DatasetDifferenceSeverity.WARNING });

  const equal = datasetIdentitiesEqual(left, right);
  const operationalEquivalent = isDatasetIdentityOperationallyEquivalent(left, right);
  return { comparable: true, equal, operationalEquivalent, versionCompatibility };
}

function compareDescriptor(left, right, bucket) {
  if (!left || !right) {
    return { comparable: false, equal: false };
  }

  compareField(bucket, { category: DatasetDifferenceCategory.DESCRIPTOR, path: 'descriptor.createdAt', left: left.createdAt ?? null, right: right.createdAt ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.MANIFEST, path: 'descriptor.manifest', left: left.manifest ?? null, right: right.manifest ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.STATISTICS, path: 'descriptor.statistics', left: left.statistics ?? null, right: right.statistics ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.POLICIES, path: 'descriptor.policies', left: left.policies ?? null, right: right.policies ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.FILTERS, path: 'descriptor.filters', left: left.filters ?? null, right: right.filters ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.PROVENANCE, path: 'descriptor.provenance', left: left.provenance ?? null, right: right.provenance ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.LINEAGE, path: 'descriptor.lineage', left: left.lineage ?? null, right: right.lineage ?? null, severity: DatasetDifferenceSeverity.WARNING });
  compareField(bucket, { category: DatasetDifferenceCategory.METADATA, path: 'descriptor.metadata', left: left.metadata ?? null, right: right.metadata ?? null, severity: DatasetDifferenceSeverity.WARNING });

  return { comparable: true, equal: toCanonicalString(serializeDatasetSnapshotDescriptor(left)) === toCanonicalString(serializeDatasetSnapshotDescriptor(right)) };
}

function isCompatibleEvolution(versionCompatibility, observationRelation) {
  if (versionCompatibility === null || versionCompatibility === VERSION_COMPATIBILITY.INCOMPATIBLE) return false;
  const leftExtendsRight = observationRelation.onlyLeft > 0 && observationRelation.onlyRight === 0 && observationRelation.conflicts === 0;
  const rightExtendsLeft = observationRelation.onlyRight > 0 && observationRelation.onlyLeft === 0 && observationRelation.conflicts === 0;
  return leftExtendsRight || rightExtendsLeft;
}

export class DatasetComparator {
  constructor({ integrityVerifier = new DatasetIntegrityVerifier() } = {}) {
    this.integrityVerifier = integrityVerifier;
  }

  compare(input, options = {}) {
    assertInput(input);
    const { mode, requireValidIntegrity, maxDifferenceDetails } = normalizeOptions(options);
    const leftIdentity = resolveIdentity(input.left);
    const rightIdentity = resolveIdentity(input.right);
    const leftDescriptor = resolveDescriptor(input.left, leftIdentity);
    const rightDescriptor = resolveDescriptor(input.right, rightIdentity);

    const leftIntegrity = this.integrityVerifier.verify({ dataset: input.left.dataset, identity: leftIdentity, descriptor: leftDescriptor });
    const rightIntegrity = this.integrityVerifier.verify({ dataset: input.right.dataset, identity: rightIdentity, descriptor: rightDescriptor });

    const diffBucket = { items: [], count: 0, truncated: false, max: maxDifferenceDetails };
    const scientificEvaluated = mode !== DATASET_COMPARISON_MODE.OPERATIONAL;
    const operationalEvaluated = mode !== DATASET_COMPARISON_MODE.SCIENTIFIC;
    const integrityComparable = leftIntegrity.isValid() && rightIntegrity.isValid();

    let scientificEquivalent = false;
    let operationallyEquivalent = false;
    let exactMatch = false;
    let compatible = false;
    let comparable = false;
    let classification = DatasetComparisonClassification.INDETERMINATE;
    let reason = null;
    let versionCompatibility = null;
    let observationRelation = { shared: 0, onlyLeft: 0, onlyRight: 0, conflicts: 0 };

    if (!integrityComparable) {
      classification = requireValidIntegrity ? DatasetComparisonClassification.INCOMPATIBLE : DatasetComparisonClassification.INDETERMINATE;
      reason = 'one or both datasets failed integrity verification';
    } else {
      const identityComparison = compareIdentity(leftIdentity, rightIdentity, diffBucket);
      versionCompatibility = identityComparison.versionCompatibility;
      const descriptorComparison = compareDescriptor(leftDescriptor, rightDescriptor, diffBucket);
      const scientificComparison = scientificEvaluated ? compareScientific(input.left.dataset, input.right.dataset, diffBucket) : { equivalent: false, observationRelation: { shared: 0, onlyLeft: 0, onlyRight: 0, conflicts: 0 } };
      scientificEquivalent = scientificEvaluated && scientificComparison.equivalent;
      observationRelation = scientificComparison.observationRelation;
      operationallyEquivalent = operationalEvaluated && identityComparison.operationalEquivalent && descriptorComparison.equal;
      exactMatch = scientificEquivalent && operationallyEquivalent;
      compatible = exactMatch || scientificEquivalent || operationallyEquivalent;

      if (mode === DATASET_COMPARISON_MODE.OPERATIONAL) {
        if (operationallyEquivalent) {
          classification = DatasetComparisonClassification.OPERATIONALLY_EQUIVALENT;
          comparable = true;
        } else {
          classification = DatasetComparisonClassification.INDETERMINATE;
          reason = 'operational comparison requires equivalent identity and descriptor contracts';
        }
      } else if (versionCompatibility === VERSION_COMPATIBILITY.INCOMPATIBLE) {
        classification = DatasetComparisonClassification.INCOMPATIBLE;
        reason = 'dataset versions are incompatible';
      } else if (exactMatch) {
        classification = DatasetComparisonClassification.EXACT_MATCH;
        comparable = true;
      } else if (scientificEquivalent) {
        classification = DatasetComparisonClassification.SCIENTIFICALLY_EQUIVALENT;
        comparable = true;
      } else if (operationallyEquivalent) {
        classification = DatasetComparisonClassification.OPERATIONALLY_EQUIVALENT;
        comparable = true;
      } else if (isCompatibleEvolution(versionCompatibility, observationRelation)) {
        classification = DatasetComparisonClassification.COMPATIBLE_EVOLUTION;
        comparable = true;
      } else if (diffBucket.count > 0) {
        classification = DatasetComparisonClassification.DIVERGENT;
        comparable = true;
      } else {
        classification = DatasetComparisonClassification.INDETERMINATE;
        reason = 'insufficient evidence to establish a stable relation';
      }

      if (!reason && classification === DatasetComparisonClassification.OPERATIONALLY_EQUIVALENT && scientificEvaluated && !scientificEquivalent) {
        reason = 'scientific content differs or was not part of the selected mode';
      }
      if (!reason && classification === DatasetComparisonClassification.COMPATIBLE_EVOLUTION) {
        reason = 'one dataset extends the other without logical conflicts';
      }
    }

    compatible = compatible || classification === DatasetComparisonClassification.COMPATIBLE_EVOLUTION;

    const summary = {
      mode,
      scientificEvaluated,
      operationalEvaluated,
      integrityComparable,
      versionCompatibility,
      leftDatasetId: input.left.dataset.datasetId ?? null,
      rightDatasetId: input.right.dataset.datasetId ?? null,
      leftIdentity: leftIdentity ? serializeDatasetIdentity(leftIdentity) : null,
      rightIdentity: rightIdentity ? serializeDatasetIdentity(rightIdentity) : null,
      leftDescriptor: leftDescriptor ? serializeDatasetSnapshotDescriptor(leftDescriptor) : null,
      rightDescriptor: rightDescriptor ? serializeDatasetSnapshotDescriptor(rightDescriptor) : null,
      scientificDifferenceCount: scientificEvaluated ? diffBucket.count : 0,
      scientificDifferenceTruncated: diffBucket.truncated,
      observationSharedCount: observationRelation.shared,
      observationOnlyLeftCount: observationRelation.onlyLeft,
      observationOnlyRightCount: observationRelation.onlyRight,
      observationConflictCount: observationRelation.conflicts,
      reason,
    };

    return new DatasetComparisonReport({
      mode,
      classification,
      comparable,
      scientificallyEquivalent: scientificEquivalent,
      operationallyEquivalent,
      exactMatch,
      compatible,
      differences: diffBucket.items,
      summary,
      leftIntegrity,
      rightIntegrity,
      scientificEvaluated,
      operationalEvaluated,
      integrityComparable,
      reason,
    });
  }
}

export const DATASET_COMPARATOR = Object.freeze({
  create: (options) => new DatasetComparator(options),
});
