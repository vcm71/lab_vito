/**
 * CalibrationObservation — immutable scientific record that links ONE
 * prediction to ONE physical spin outcome, including the binary
 * evaluation of the prediction target (observedOutcome).
 *
 * This is the future row of a calibration dataset: raw consensus score +
 * calibrated probability + which strategy/model produced it + whether the
 * target actually landed.
 *
 * Design decisions (Fase 2.3.2):
 * - `observedOutcome` is ALWAYS derived from prediction.target vs
 *   outcome.winningNumber by PredictionTargetEvaluator. It is never
 *   accepted from external input (the builder rejects it explicitly).
 * - `schemaVersion` is a stable contract version, independent of the
 *   package version: '1' is the first frozen shape of this record.
 * - Deep immutability via deepFreeze (protects target, calibration,
 *   metadata).
 * - Timestamps are ISO 8601 UTC strings, caller-injected.
 *
 * @typedef {Object} CalibrationObservation
 * @property {string} schemaVersion — stable contract version
 * @property {string} observationId — globally unique
 * @property {string} predictionId — links to the PredictionRecord
 * @property {string} outcomeId — links to the SpinOutcomeRecord
 * @property {string} spinId — links prediction and outcome to their spin
 * @property {object} target — discriminated prediction target (e.g. { type:'NUMBER', value:'23' })
 * @property {number} rawConsensusScore — [0, 1] finite; score BEFORE calibration
 * @property {{ probability: number, strategyName: string, modelId?: string, modelHash?: string }|null} calibration
 * @property {0|1} observedOutcome — 1 = target landed, 0 = it did not
 * @property {string} predictionCreatedAt — ISO 8601 UTC
 * @property {string} outcomeRecordedAt — ISO 8601 UTC
 * @property {string} observationCreatedAt — ISO 8601 UTC
 * @property {object|null} metadata — opaque JSON-safe frozen metadata bag
 */

import { deepFreeze } from './immutable.js';
import { normaliseMetadata } from './metadata.js';
import { InvalidCalibrationObservationError, InvalidConsensusScoreError } from './errors.js';

/** @type {string} — stable contract version for calibration observations */
export const CALIBRATION_OBSERVATION_SCHEMA_VERSION = '1';

/**
 * Create a deep-frozen CalibrationObservation.
 *
 * @param {Object} contract
 * @param {string} [contract.schemaVersion='1']
 * @param {string} contract.observationId
 * @param {string} contract.predictionId
 * @param {string} contract.outcomeId
 * @param {string} contract.spinId
 * @param {object} contract.target — PredictionTarget (must already be validated)
 * @param {number} contract.rawConsensusScore — [0, 1]
 * @param {{ probability: number, strategyName: string, modelId?: string, modelHash?: string }|null} [contract.calibration]
 * @param {0|1} contract.observedOutcome — derived, never external
 * @param {string} contract.predictionCreatedAt — ISO 8601
 * @param {string} contract.outcomeRecordedAt — ISO 8601
 * @param {string} contract.observationCreatedAt — ISO 8601
 * @param {object} [contract.metadata]
 * @returns {CalibrationObservation}
 */
export function createCalibrationObservation({
  schemaVersion = CALIBRATION_OBSERVATION_SCHEMA_VERSION,
  observationId,
  predictionId,
  outcomeId,
  spinId,
  target,
  rawConsensusScore,
  calibration = null,
  observedOutcome,
  predictionCreatedAt,
  outcomeRecordedAt,
  observationCreatedAt,
  metadata,
}) {
  // ── Schema version ───────────────────────────────────────────────────
  if (schemaVersion !== CALIBRATION_OBSERVATION_SCHEMA_VERSION) {
    throw new InvalidCalibrationObservationError(
      `unsupported schemaVersion "${schemaVersion}" (expected "${CALIBRATION_OBSERVATION_SCHEMA_VERSION}").`,
    );
  }

  // ── Required fields ──────────────────────────────────────────────────
  if (!observationId || typeof observationId !== 'string') {
    throw new TypeError('observationId must be a non-empty string.');
  }
  if (!predictionId || typeof predictionId !== 'string') {
    throw new TypeError('predictionId must be a non-empty string.');
  }
  if (!outcomeId || typeof outcomeId !== 'string') {
    throw new TypeError('outcomeId must be a non-empty string.');
  }
  if (!spinId || typeof spinId !== 'string') {
    throw new TypeError('spinId must be a non-empty string.');
  }
  if (typeof target !== 'object' || target === null) {
    throw new TypeError('target must be a PredictionTarget object.');
  }
  if (!predictionCreatedAt || typeof predictionCreatedAt !== 'string') {
    throw new TypeError('predictionCreatedAt must be a non-empty ISO string.');
  }
  if (!outcomeRecordedAt || typeof outcomeRecordedAt !== 'string') {
    throw new TypeError('outcomeRecordedAt must be a non-empty ISO string.');
  }
  if (!observationCreatedAt || typeof observationCreatedAt !== 'string') {
    throw new TypeError('observationCreatedAt must be a non-empty ISO string.');
  }

  // ── rawConsensusScore ────────────────────────────────────────────────
  if (
    typeof rawConsensusScore !== 'number' ||
    !Number.isFinite(rawConsensusScore) ||
    rawConsensusScore < 0 ||
    rawConsensusScore > 1
  ) {
    throw new InvalidConsensusScoreError(rawConsensusScore);
  }

  // ── observedOutcome ──────────────────────────────────────────────────
  if (observedOutcome !== 0 && observedOutcome !== 1) {
    throw new InvalidCalibrationObservationError(
      `observedOutcome must be 0 or 1, got ${JSON.stringify(observedOutcome)}.`,
    );
  }

  // ── Calibration (optional, but explicit) ─────────────────────────────
  let safeCal = null;
  if (calibration !== null) {
    if (typeof calibration !== 'object' || calibration === null) {
      throw new TypeError('calibration must be a plain object or null.');
    }
    if (
      typeof calibration.probability !== 'number' ||
      !Number.isFinite(calibration.probability) ||
      calibration.probability < 0 ||
      calibration.probability > 1
    ) {
      throw new RangeError('calibration.probability must be a finite number in [0, 1].');
    }
    if (!calibration.strategyName || typeof calibration.strategyName !== 'string') {
      throw new TypeError('calibration.strategyName is required when calibration is set.');
    }
    safeCal = {
      probability: calibration.probability,
      strategyName: calibration.strategyName,
      modelId: calibration.modelId !== undefined ? String(calibration.modelId) : undefined,
      modelHash: calibration.modelHash !== undefined ? String(calibration.modelHash) : undefined,
    };
  }

  // ── Metadata ─────────────────────────────────────────────────────────
  const safeMeta = normaliseMetadata(metadata);

  return deepFreeze({
    schemaVersion,
    observationId,
    predictionId,
    outcomeId,
    spinId,
    target,
    rawConsensusScore,
    calibration: safeCal ? deepFreeze(safeCal) : null,
    observedOutcome,
    predictionCreatedAt,
    outcomeRecordedAt,
    observationCreatedAt,
    metadata: safeMeta,
  });
}

/**
 * Effective probability of an observation: the calibrated probability when
 * a calibration was applied, otherwise the raw consensus score.
 *
 * Pure derivation — never mutates the observation.
 *
 * @param {CalibrationObservation} observation
 * @returns {number}
 */
export function getEffectiveProbability(observation) {
  if (observation.calibration) {
    return observation.calibration.probability;
  }
  return observation.rawConsensusScore;
}
