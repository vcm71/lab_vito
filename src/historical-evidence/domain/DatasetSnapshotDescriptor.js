/**
 * DatasetSnapshotDescriptor — immutable, auditable DESCRIPTION of a
 * historical calibration dataset snapshot.
 *
 * It is NOT a copy of the data: it carries the DatasetIdentity plus
 * references to the already-frozen manifest and statistics, deep-frozen
 * copies of the applied filters and policies, and minimal provenance /
 * lineage contracts. No observations are duplicated, no hashes are
 * recomputed, no statistics are derived (Fase 2.3.4.1 restrictions).
 *
 * Fields:
 * - `identity`   — DatasetIdentity (scientific + operational identity)
 * - `createdAt`  — ISO 8601 UTC, injected (no global clock)
 * - `period`     — deep-frozen copy of the dataset period
 * - `manifest`   — reference to the frozen DatasetManifest
 * - `statistics` — reference to the frozen DatasetStatistics
 * - `policies`   — descriptive snapshot of applied policies (null = none)
 * - `filters`    — deep-frozen copy of the applied normalised filters
 * - `provenance` — minimal direct-source contract (null = unknown)
 * - `lineage`    — minimal ordered list of ancestor references (full graph
 *                  is deferred to Subfase 2.3.4.5)
 * - `metadata`   — opaque JSON-safe frozen metadata (normaliseMetadata)
 *
 * Validation is all-or-nothing: any invalid component throws
 * InvalidSnapshotDescriptorError (or InvalidMetadataError via
 * normaliseMetadata) and nothing is returned.
 */

import { deepFreeze } from './immutable.js';
import { normaliseMetadata } from './metadata.js';
import { isIsoTimestamp } from './DatasetAssemblyOptions.js';
import { isDatasetIdentity } from './DatasetIdentity.js';
import { isDatasetVersion, datasetVersionToString } from './DatasetVersion.js';
import { InvalidSnapshotDescriptorError, InvalidMetadataError } from './errors.js';
import { HEX64 } from './HistoricalCalibrationDataset.js';

/**
 * Validate the period object: the four inclusive-window keys, each a
 * non-empty ISO timestamp string or null (shape produced by
 * deriveDatasetPeriod()).
 *
 * @param {*} period
 * @returns {object} deep-frozen copy
 */
function assertPeriod(period) {
  if (period === null || typeof period !== 'object' || Array.isArray(period)) {
    throw new InvalidSnapshotDescriptorError('period must be the object returned by deriveDatasetPeriod()');
  }
  const keys = [
    'predictionCreatedFrom',
    'predictionCreatedTo',
    'outcomeRecordedFrom',
    'outcomeRecordedTo',
  ];
  const copy = {};
  for (const key of keys) {
    const value = period[key];
    if (value !== null && !isIsoTimestamp(value)) {
      throw new InvalidSnapshotDescriptorError(`period.${key} must be an ISO 8601 timestamp or null`);
    }
    copy[key] = value;
  }
  return deepFreeze(copy);
}

/**
 * Validate an optional provenance object.
 *
 * @param {*} provenance
 * @returns {object|null} deep-frozen copy with only the explicit known keys
 */
function assertProvenance(provenance) {
  if (provenance === undefined || provenance === null) return null;
  if (typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new InvalidSnapshotDescriptorError('provenance must be a plain object or null');
  }
  const { sourceDatasetId, sourceContentHash, parentDatasetVersion, assemblyReason, transformationType } = provenance;
  if (sourceDatasetId !== undefined && sourceDatasetId !== null) {
    if (typeof sourceDatasetId !== 'string' || sourceDatasetId.length === 0) {
      throw new InvalidSnapshotDescriptorError('provenance.sourceDatasetId must be a non-empty string or null');
    }
  }
  if (sourceContentHash !== undefined && sourceContentHash !== null) {
    if (typeof sourceContentHash !== 'string' || !HEX64.test(sourceContentHash)) {
      throw new InvalidSnapshotDescriptorError('provenance.sourceContentHash must be a 64-char lowercase hex sha256 string or null');
    }
  }
  if (parentDatasetVersion !== undefined && parentDatasetVersion !== null && !isDatasetVersion(parentDatasetVersion)) {
    throw new InvalidSnapshotDescriptorError('provenance.parentDatasetVersion must be a valid DatasetVersion object or null');
  }
  for (const [field, value] of Object.entries({ assemblyReason, transformationType })) {
    if (value !== undefined && value !== null && (typeof value !== 'string' || value.length === 0)) {
      throw new InvalidSnapshotDescriptorError(`provenance.${field} must be a non-empty string or null`);
    }
  }
  return deepFreeze({
    sourceDatasetId: sourceDatasetId === undefined ? null : sourceDatasetId,
    sourceContentHash: sourceContentHash === undefined ? null : sourceContentHash,
    parentDatasetVersion: parentDatasetVersion === undefined ? null : parentDatasetVersion,
    assemblyReason: assemblyReason === undefined ? null : assemblyReason,
    transformationType: transformationType === undefined ? null : transformationType,
  });
}

/**
 * Validate an optional lineage list. Each entry references ONE ancestor
 * snapshot: { datasetId, contentHash, datasetVersion, createdAt }.
 * The full lineage graph is deferred to Subfase 2.3.4.5.
 *
 * @param {*} lineage
 * @returns {readonly object[]|null} deep-frozen list
 */
function assertLineage(lineage) {
  if (lineage === undefined || lineage === null) return null;
  if (!Array.isArray(lineage)) {
    throw new InvalidSnapshotDescriptorError('lineage must be an array of ancestor references or null');
  }
  const entries = [];
  for (const entry of lineage) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new InvalidSnapshotDescriptorError('lineage entries must be plain objects');
    }
    const { datasetId, contentHash, datasetVersion, createdAt } = entry;
    if (typeof datasetId !== 'string' || datasetId.length === 0) {
      throw new InvalidSnapshotDescriptorError('lineage entry datasetId must be a non-empty string');
    }
    if (typeof contentHash !== 'string' || !HEX64.test(contentHash)) {
      throw new InvalidSnapshotDescriptorError('lineage entry contentHash must be a 64-char lowercase hex sha256 string');
    }
    if (!isDatasetVersion(datasetVersion)) {
      throw new InvalidSnapshotDescriptorError('lineage entry datasetVersion must be a valid DatasetVersion object');
    }
    if (!isIsoTimestamp(createdAt)) {
      throw new InvalidSnapshotDescriptorError('lineage entry createdAt must be an ISO 8601 timestamp');
    }
    entries.push(
      deepFreeze({
        datasetId,
        contentHash,
        datasetVersion: deepFreeze({
          major: datasetVersion.major,
          minor: datasetVersion.minor,
          patch: datasetVersion.patch,
        }),
        createdAt,
      }),
    );
  }
  return deepFreeze(entries);
}

/**
 * Create a deep-frozen DatasetSnapshotDescriptor.
 *
 * @param {Object} contract
 * @param {DatasetIdentity} contract.identity — valid DatasetIdentity object
 * @param {string} contract.createdAt — ISO 8601 UTC, injected
 * @param {object} contract.period — dataset period (deriveDatasetPeriod shape)
 * @param {DatasetManifest} contract.manifest — frozen manifest reference
 * @param {DatasetStatistics} contract.statistics — frozen statistics reference
 * @param {object|null} [contract.policies=null] — descriptive policy snapshot
 * @param {readonly object[]|null} [contract.filters=null] — applied filters
 * @param {object|null} [contract.provenance=null] — minimal direct-source contract
 * @param {readonly object[]|null} [contract.lineage=null] — minimal ancestor references
 * @param {object|null} [contract.metadata=null] — opaque JSON-safe metadata
 * @returns {DatasetSnapshotDescriptor}
 */
export function createDatasetSnapshotDescriptor({
  identity,
  createdAt,
  period,
  manifest,
  statistics,
  policies = null,
  filters = null,
  provenance = null,
  lineage = null,
  metadata = null,
}) {
  if (!isDatasetIdentity(identity)) {
    throw new InvalidSnapshotDescriptorError('identity must be a valid DatasetIdentity object');
  }
  if (!isIsoTimestamp(createdAt)) {
    throw new InvalidSnapshotDescriptorError('createdAt must be a valid ISO 8601 timestamp');
  }
  if (manifest === null || typeof manifest !== 'object') {
    throw new InvalidSnapshotDescriptorError('manifest must be the frozen DatasetManifest');
  }
  if (statistics === null || typeof statistics !== 'object') {
    throw new InvalidSnapshotDescriptorError('statistics must be the frozen DatasetStatistics');
  }

  const safePolicies =
    policies === null || policies === undefined
      ? null
      : (() => {
          if (typeof policies !== 'object' || Array.isArray(policies)) {
            throw new InvalidSnapshotDescriptorError('policies must be a plain object or null');
          }
          return deepFreeze({ ...policies });
        })();

  const safeFilters = filters === null || filters === undefined ? null : (() => {
    if (!Array.isArray(filters)) {
      throw new InvalidSnapshotDescriptorError('filters must be an array of filter descriptors or null');
    }
    return deepFreeze([...filters]);
  })();

  return deepFreeze({
    identity,
    createdAt,
    period: assertPeriod(period),
    manifest,
    statistics,
    policies: safePolicies,
    filters: safeFilters,
    provenance: assertProvenance(provenance),
    lineage: assertLineage(lineage),
    metadata: (() => {
      try {
        return normaliseMetadata(metadata);
      } catch (error) {
        throw new InvalidMetadataError(error.message);
      }
    })(),
  });
}
