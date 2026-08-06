/**
 * Canonical dataset serialization helpers for historical-evidence.
 *
 * These functions project the domain objects into explicit JSON-safe shapes
 * before delegating to the shared calibration canonical serializer.
 */

import { canonicalSerialize } from '../../calibration/CanonicalHash.js';
import { datasetIdentityToJSON, isDatasetIdentity } from '../domain/DatasetIdentity.js';
import { InvalidSnapshotDescriptorError } from '../domain/errors.js';

function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  return value;
}

function assertDatasetLike(dataset) {
  const safe = assertObject(dataset, 'dataset');
  for (const field of ['schemaVersion', 'observationSchemaVersion', 'period', 'observations']) {
    if (safe[field] === undefined || safe[field] === null) {
      throw new TypeError(`dataset.${field} is required for canonical serialization`);
    }
  }
  if (!Array.isArray(safe.observations)) {
    throw new TypeError('dataset.observations must be an array for canonical serialization');
  }
  return safe;
}

function assertSnapshotDescriptorLike(descriptor) {
  const safe = assertObject(descriptor, 'descriptor');
  if (!isDatasetIdentity(safe.identity)) {
    throw new InvalidSnapshotDescriptorError('descriptor.identity must be a valid DatasetIdentity object');
  }
  for (const field of ['createdAt', 'period', 'manifest', 'statistics']) {
    if (safe[field] === undefined || safe[field] === null) {
      throw new InvalidSnapshotDescriptorError(`descriptor.${field} is required for canonical serialization`);
    }
  }
  return safe;
}

function projectCalibration(calibration) {
  if (calibration === null) return null;
  if (calibration === undefined) return null;
  return {
    probability: calibration.probability,
    strategyName: calibration.strategyName,
    modelId: calibration.modelId !== undefined ? String(calibration.modelId) : null,
    modelHash: calibration.modelHash !== undefined ? String(calibration.modelHash) : null,
  };
}

export function projectObservation(observation) {
  return {
    schemaVersion: observation.schemaVersion,
    observationId: observation.observationId,
    predictionId: observation.predictionId,
    outcomeId: observation.outcomeId,
    spinId: observation.spinId,
    target: observation.target,
    rawConsensusScore: observation.rawConsensusScore,
    calibration: projectCalibration(observation.calibration),
    observedOutcome: observation.observedOutcome,
    predictionCreatedAt: observation.predictionCreatedAt,
    outcomeRecordedAt: observation.outcomeRecordedAt,
    observationCreatedAt: observation.observationCreatedAt,
    metadata: observation.metadata ?? null,
  };
}

function projectScientificDataset(dataset) {
  const safe = assertDatasetLike(dataset);
  return {
    schemaVersion: safe.schemaVersion,
    observationSchemaVersion: safe.observationSchemaVersion,
    period: safe.period,
    observations: safe.observations.map(projectObservation),
  };
}

function projectDatasetSnapshotDescriptor(descriptor) {
  const safe = assertSnapshotDescriptorLike(descriptor);
  return {
    identity: datasetIdentityToJSON(safe.identity),
    createdAt: safe.createdAt,
    period: safe.period,
    manifest: safe.manifest,
    statistics: safe.statistics,
    policies: safe.policies ?? null,
    filters: safe.filters ?? null,
    provenance: safe.provenance ?? null,
    lineage: safe.lineage ?? null,
    metadata: safe.metadata ?? null,
  };
}

export { projectScientificDataset, projectDatasetSnapshotDescriptor };

export function serializeScientificDataset(dataset) {
  return canonicalSerialize(projectScientificDataset(dataset));
}

export function serializeDatasetIdentity(identity) {
  return canonicalSerialize(datasetIdentityToJSON(identity));
}

export function serializeDatasetManifest(manifest) {
  const safe = assertObject(manifest, 'manifest');
  return canonicalSerialize(safe);
}

export function serializeDatasetStatistics(statistics) {
  const safe = assertObject(statistics, 'statistics');
  return canonicalSerialize(safe);
}

export function serializeDatasetSnapshotDescriptor(descriptor) {
  return canonicalSerialize(projectDatasetSnapshotDescriptor(descriptor));
}
