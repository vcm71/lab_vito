/**
 * BuildHistoricalDatasetUseCase — application service that assembles a
 * HistoricalCalibrationDataset from the calibration observation
 * repository.
 *
 * Responsibilities (Fase 2.3.3):
 * - Load all observations via CalibrationObservationRepository.findAll().
 * - Delegate assembly to the injected DatasetBuilder (pure).
 * - NEVER persist, train, or mutate anything: the dataset is a
 *   read-only snapshot for downstream scientific use.
 *
 * No internal randomness and no global clock: `datasetId` and `createdAt`
 * are caller-injected. An optional `datasetIdGenerator` (provided by the
 * caller, never Math.random/timestamps inside this layer) is only used
 * when `datasetId` is omitted.
 */

import { InvalidDatasetIdError } from '../domain/index.js';
import { DatasetBuilder } from './DatasetBuilder.js';

export class BuildHistoricalDatasetUseCase {
  /**
   * @param {Object} deps
   * @param {CalibrationObservationRepository} deps.observationRepository
   * @param {DatasetBuilder} [deps.builder]
   */
  constructor({ observationRepository, builder }) {
    if (!observationRepository) {
      throw new TypeError('BuildHistoricalDatasetUseCase requires an observationRepository.');
    }
    this._repository = observationRepository;
    this._builder = builder || new DatasetBuilder();
  }

  /**
   * @param {Object} input
   * @param {string} [input.datasetId] — required unless datasetIdGenerator provided
   * @param {string} input.createdAt — ISO 8601 UTC
   * @param {object|null} [input.options] — raw or normalised DatasetAssemblyOptions
   * @param {object|null} [input.metadata] — manifest metadata bag
   * @param {Function} [input.datasetIdGenerator] — () => string, caller-owned
   * @returns {HistoricalCalibrationDataset}
   */
  execute({ datasetId, createdAt, options = null, metadata = null, datasetIdGenerator } = {}) {
    let resolvedId = datasetId;
    if (!resolvedId || typeof resolvedId !== 'string') {
      if (typeof datasetIdGenerator === 'function') {
        resolvedId = datasetIdGenerator();
      } else {
        throw new InvalidDatasetIdError(resolvedId);
      }
    }

    const observations = this._repository.findAll();
    return this._builder.buildDataset({
      datasetId: resolvedId,
      observations,
      createdAt,
      options,
      metadata,
      sourceType: 'IN_MEMORY_REPOSITORY',
    });
  }
}
