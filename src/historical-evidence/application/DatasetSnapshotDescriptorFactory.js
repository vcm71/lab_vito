/**
 * DatasetSnapshotDescriptorFactory — application-layer factory that derives
 * a DatasetSnapshotDescriptor (with its DatasetIdentity) from an existing
 * HistoricalCalibrationDataset.
 *
 * Responsibilities (limited, Fase 2.3.4.1):
 * - Validate that the input is a real assembled dataset (all-or-nothing).
 * - Derive the DatasetIdentity by CARRYING the dataset's existing
 *   contentHash/manifestHash/schemaVersion/observationSchemaVersion — hashes
 *   are never recomputed here.
 * - Derive the descriptive `policies` snapshot from the manifest options and
 *   copy the applied `filters`.
 * - Inject external dependencies per call: `datasetVersion`, `createdAt`,
 *   `provenance`, `lineage`, `metadata`. No global clock, no random ids.
 *
 * It does NOT persist, export, train, promote or mutate anything.
 */

import {
  createDatasetIdentity,
  createDatasetSnapshotDescriptor,
  isDatasetVersion,
  InvalidDatasetVersionError,
  InvalidSnapshotDescriptorError,
  InvalidDatasetTimestampError,
} from '../domain/index.js';
import { isIsoTimestamp } from '../domain/DatasetAssemblyOptions.js';

/** Descriptive temporal policy — inclusive windows (from <= x <= to). */
export const SNAPSHOT_TEMPORAL_POLICY = 'INCLUSIVE_FROM_TO';

export class DatasetSnapshotDescriptorFactory {
  /**
   * @param {Object} input
   * @param {HistoricalCalibrationDataset} input.dataset — assembled dataset
   * @param {DatasetVersion} input.datasetVersion — artifact version (injected)
   * @param {string} input.createdAt — ISO 8601 UTC snapshot timestamp (injected)
   * @param {object|null} [input.provenance=null] — minimal direct-source contract
   * @param {readonly object[]|null} [input.lineage=null] — minimal ancestor references
   * @param {object|null} [input.metadata=null] — opaque JSON-safe metadata
   * @returns {DatasetSnapshotDescriptor}
   */
  create({ dataset, datasetVersion, createdAt, provenance = null, lineage = null, metadata = null }) {
    if (dataset === null || typeof dataset !== 'object') {
      throw new InvalidSnapshotDescriptorError('dataset must be an assembled HistoricalCalibrationDataset');
    }
    const required = [
      'datasetId',
      'schemaVersion',
      'observationSchemaVersion',
      'contentHash',
      'manifestHash',
      'period',
      'manifest',
      'statistics',
    ];
    for (const key of required) {
      if (dataset[key] === undefined || dataset[key] === null) {
        throw new InvalidSnapshotDescriptorError(`dataset.${key} is required (is this an assembled HistoricalCalibrationDataset?)`);
      }
    }
    if (!isDatasetVersion(datasetVersion)) {
      throw new InvalidDatasetVersionError('datasetVersion must be a valid DatasetVersion object', datasetVersion);
    }
    if (!isIsoTimestamp(createdAt)) {
      throw new InvalidDatasetTimestampError('createdAt', createdAt);
    }

    const identity = createDatasetIdentity({
      datasetId: dataset.datasetId,
      datasetVersion,
      schemaVersion: dataset.schemaVersion,
      observationSchemaVersion: dataset.observationSchemaVersion,
      contentHash: dataset.contentHash,
      manifestHash: dataset.manifestHash,
    });

    const options = dataset.manifest.options;
    const policies =
      options && typeof options === 'object'
        ? {
            duplicatePolicy: options.duplicatePolicy,
            invalidObservationPolicy: options.invalidObservationPolicy,
            unsupportedSchemaPolicy: options.unsupportedSchemaPolicy,
            temporalPolicy: SNAPSHOT_TEMPORAL_POLICY,
          }
        : null;

    return createDatasetSnapshotDescriptor({
      identity,
      createdAt,
      period: dataset.period,
      manifest: dataset.manifest,
      statistics: dataset.statistics,
      policies,
      filters: dataset.manifest.filters,
      provenance,
      lineage,
      metadata,
    });
  }
}
