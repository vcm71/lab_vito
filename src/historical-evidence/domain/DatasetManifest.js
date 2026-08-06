/**
 * DatasetManifest — immutable provenance record of HOW a historical
 * calibration dataset was assembled.
 *
 * The manifest answers: where did the observations come from, which
 * selection filters were applied (normalised, in canonical form), how the
 * rows are ordered, and how many rows were excluded (and why). It is
 * frozen at assembly time and becomes part of the dataset audit trail.
 *
 * `exclusionsByReason` keys are stable reason strings, e.g.
 * 'PREDICTION_CREATED_FROM', 'INCLUDE_TARGET_TYPES', 'REQUIRE_CALIBRATION',
 * 'INVALID_OBSERVATION'. Filters that excluded nothing simply have count 0
 * and are still listed in `filters` (traceability, not just diffs).
 */

import { deepFreeze } from './immutable.js';

/** @type {string} — stable contract version of the manifest shape */
export const DATASET_MANIFEST_SCHEMA_VERSION = '1';

/**
 * Create a deep-frozen DatasetManifest.
 *
 * @param {Object} contract
 * @param {string} contract.datasetId
 * @param {string} contract.createdAt — ISO 8601 UTC
 * @param {'IN_MEMORY_REPOSITORY'|'PROVIDED_COLLECTION'} contract.sourceType
 * @param {DatasetAssemblyOptions} contract.options — normalised options used
 * @param {readonly object[]} contract.filters — normalised filter descriptors actually applied
 * @param {readonly string[]} contract.sortOrder — canonical sort keys (CANONICAL_SORT_ORDER)
 * @param {string} contract.duplicatePolicy — 'REJECT'
 * @param {string} contract.invalidObservationPolicy — 'REJECT_DATASET' | 'EXCLUDE_AND_REPORT'
 * @param {number} contract.observationCount — rows included
 * @param {number} contract.excludedCount — rows dropped by filters (valid observations)
 * @param {object} contract.exclusionsByReason — { REASON: count }
 * @param {number} contract.invalidCount — rows dropped as invalid (0 under REJECT_DATASET)
 * @param {string} contract.builderVersion — DATASET_BUILDER_VERSION
 * @param {object|null} [contract.metadata]
 * @returns {DatasetManifest}
 */
export function createDatasetManifest({
  datasetId,
  createdAt,
  sourceType,
  options,
  filters,
  sortOrder,
  duplicatePolicy,
  invalidObservationPolicy,
  observationCount,
  excludedCount,
  exclusionsByReason,
  invalidCount,
  builderVersion,
  metadata,
}) {
  const safeMeta =
    metadata === undefined || metadata === null
      ? null
      : deepFreeze({ ...metadata });

  return deepFreeze({
    schemaVersion: DATASET_MANIFEST_SCHEMA_VERSION,
    datasetId,
    createdAt,
    sourceType,
    options,
    filters: deepFreeze([...filters]),
    sortOrder: deepFreeze([...sortOrder]),
    duplicatePolicy,
    invalidObservationPolicy,
    observationCount,
    excludedCount,
    exclusionsByReason: deepFreeze({ ...exclusionsByReason }),
    invalidCount,
    builderVersion,
    metadata: safeMeta,
  });
}
