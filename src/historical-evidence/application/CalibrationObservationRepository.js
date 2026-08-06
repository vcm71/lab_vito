/**
 * CalibrationObservationRepository — persistence port for calibration
 * observations.
 *
 * The port is intentionally minimal and synchronous (in-memory in this
 * phase). Implementations must guarantee the duplication invariants:
 *   - Never overwrite: an existing observationId with DIFFERENT content
 *     is a DuplicateCalibrationObservationError.
 *   - Idempotent: saving the exact same observation again is a no-op.
 *   - Logical uniqueness: the (predictionId, outcomeId) pair may only map
 *     to one observation.
 *   - Deterministic query order: predictionCreatedAt asc, predictionId
 *     asc (tie-break observationId asc).
 *
 * `assertCanSave` is the mutation-free preflight used by the use case to
 * make batch saves all-or-nothing.
 */

export class CalibrationObservationRepository {
  /** @param {CalibrationObservation} _observation */
  save(_observation) {
    throw new Error('CalibrationObservationRepository is an abstract port — implement save().');
  }

  /** @param {CalibrationObservation} _observation */
  assertCanSave(_observation) {
    throw new Error('CalibrationObservationRepository is an abstract port — implement assertCanSave().');
  }

  /** @param {string} _observationId @returns {CalibrationObservation|null} */
  findById(_observationId) {
    throw new Error('CalibrationObservationRepository is an abstract port — implement findById().');
  }

  /** @param {string} _predictionId @returns {CalibrationObservation[]} */
  findByPredictionId(_predictionId) {
    throw new Error('CalibrationObservationRepository is an abstract port — implement findByPredictionId().');
  }

  /**
   * All stored observations as a defensive copy. Order is
   * implementation-defined but deterministic; DatasetBuilder always
   * re-sorts canonically.
   * @returns {CalibrationObservation[]}
   */
  findAll() {
    throw new Error('CalibrationObservationRepository is an abstract port — implement findAll().');
  }

  /** @param {string} _spinId @returns {CalibrationObservation[]} */
  findBySpinId(_spinId) {
    throw new Error('CalibrationObservationRepository is an abstract port — implement findBySpinId().');
  }

  /** @returns {number} */
  count() {
    throw new Error('CalibrationObservationRepository is an abstract port — implement count().');
  }

  /** @returns {void} */
  clear() {
    throw new Error('CalibrationObservationRepository is an abstract port — implement clear().');
  }
}
