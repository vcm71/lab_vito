/**
 * ObservationBuilder — application service that composes a single
 * CalibrationObservation from a PredictionRecord + SpinOutcomeRecord.
 *
 * Responsibilities (Fase 2.3.2):
 * - Cross-record validation: same spin, chronological integrity
 *   (reuses validateChronology — no duplicated temporal logic).
 * - Derives observedOutcome via PredictionTargetEvaluator. External
 *   `observedOutcome` input is REJECTED (policy: derived, never trusted).
 * - Delegates field-level validation to createCalibrationObservation.
 *
 * The builder never mutates its inputs and never persists.
 */

import { evaluatePredictionTarget } from '../domain/PredictionTargetEvaluator.js';
import { createCalibrationObservation } from '../domain/CalibrationObservation.js';
import { assertValidObservationId } from '../domain/ObservationIdentity.js';
import { validateChronology } from '../domain/chronology.js';
import { EvidenceSpinMismatchError, InvalidCalibrationObservationError } from '../domain/errors.js';

export class ObservationBuilder {
  /**
   * @param {Object} contract
   * @param {string} contract.observationId — must match OBSERVATION_ID_PATTERN
   * @param {PredictionRecord} contract.prediction — immutable prediction record
   * @param {SpinOutcomeRecord} contract.outcome — immutable outcome record
   * @param {string} contract.createdAt — observation materialisation time (ISO 8601)
   * @param {object} [contract.metadata] — JSON-safe metadata bag
   * @returns {CalibrationObservation}
   * @throws {EvidenceSpinMismatchError} prediction and outcome belong to different spins
   * @throws {TemporalEvidenceLeakageError} prediction recorded after the outcome
   * @throws {InvalidCalibrationObservationError} external observedOutcome supplied
   */
  buildObservation({ observationId, prediction, outcome, createdAt, metadata, observedOutcome: _observedOutcome }) {
    if (_observedOutcome !== undefined) {
      throw new InvalidCalibrationObservationError(
        'observedOutcome cannot be provided externally — it is derived by PredictionTargetEvaluator.',
      );
    }

    assertValidObservationId(observationId);

    if (prediction === null || typeof prediction !== 'object') {
      throw new TypeError('prediction must be a PredictionRecord object.');
    }
    if (outcome === null || typeof outcome !== 'object') {
      throw new TypeError('outcome must be a SpinOutcomeRecord object.');
    }
    if (!createdAt || typeof createdAt !== 'string') {
      throw new TypeError('createdAt must be a non-empty ISO string.');
    }

    if (prediction.spinId !== outcome.spinId) {
      throw new EvidenceSpinMismatchError(prediction.spinId, outcome.spinId);
    }

    validateChronology({
      spinId: prediction.spinId,
      predictionCreatedAt: prediction.createdAt,
      outcomeRecordedAt: outcome.recordedAt,
    });

    const observedOutcome = evaluatePredictionTarget(prediction.target, outcome.winningNumber);

    return createCalibrationObservation({
      observationId,
      predictionId: prediction.predictionId,
      outcomeId: outcome.outcomeId,
      spinId: prediction.spinId,
      target: prediction.target,
      rawConsensusScore: prediction.rawConsensusScore,
      calibration: prediction.calibration,
      observedOutcome,
      predictionCreatedAt: prediction.createdAt,
      outcomeRecordedAt: outcome.recordedAt,
      observationCreatedAt: createdAt,
      metadata,
    });
  }
}
