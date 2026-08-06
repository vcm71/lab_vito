/**
 * ConsensusToPredictionMapper — explicit, side-effect-free conversion of a
 * consensus/calibration output envelope into a PredictionRecord.
 *
 * Input contract (verified against src/consensus and src/calibration):
 *   {
 *     numbers: { [number]: CalibratedEntry },   // CalibratedEntry = {
 *       //   number, rawConsensusScore, calibratedProbability (number|null),
 *       //   valid (boolean), invalidReason (string|null),
 *       //   calibration: { name, strategyVersion, trainingDataset,
 *       //                  trainedAt, modelVersion, calibrationVersion } | null
 *       // }
 *     metadata: { consensus: { appliedAt, ... }, calibration: {...} }
 *   }
 *
 * Mapping rules (Fase 2.3.2):
 * - predictionId and spinId are NOT present in the consensus output and
 *   must be provided explicitly (s16.3 — no implicit context).
 * - The target number must be provided explicitly (`number` or `target`).
 *   Consensus output contains 38 entries, so a unique number can never be
 *   inferred — ambiguity is an error (TARGET_REQUIRED).
 * - calibration is mapped ONLY when the entry is valid and carries a
 *   calibrated probability + strategy name; otherwise null.
 *   modelId ← entry.calibration.modelVersion (the project's calibration
 *   contract has no model hash; modelHash stays undefined).
 * - createdAt defaults to metadata.consensus.appliedAt when not provided;
 *   if neither exists → TIMESTAMP_REQUIRED error.
 * - The mapper never persists and never mutates the input envelope.
 */

import { createNumberTarget } from '../../domain/PredictionTarget.js';
import { createPredictionRecord } from '../../domain/PredictionRecord.js';
import { InvalidConsensusOutputError } from '../../domain/errors.js';

export class ConsensusToPredictionMapper {
  /**
   * @param {Object} params
   * @param {Object} params.consensusOutput — CalibrationOutput envelope { numbers, metadata }
   * @param {string} params.predictionId — required, not present in the output
   * @param {string} params.spinId — required, not present in the output
   * @param {string} [params.number] — target number (e.g. '23'); ignored when `target` is given
   * @param {object} [params.target] — explicit PredictionTarget; wins over `number`
   * @param {string} [params.createdAt] — ISO 8601; defaults to metadata.consensus.appliedAt
   * @param {object} [params.metadata] — JSON-safe metadata bag for the record
   * @returns {PredictionRecord} frozen prediction record
   */
  map({ consensusOutput, predictionId, spinId, number, target, createdAt, metadata }) {
    if (consensusOutput === null || typeof consensusOutput !== 'object') {
      throw new InvalidConsensusOutputError('consensusOutput must be an object.');
    }

    const { numbers } = consensusOutput;
    if (numbers === null || typeof numbers !== 'object' || Array.isArray(numbers)) {
      throw new InvalidConsensusOutputError('consensusOutput.numbers must be a plain object.');
    }

    if (!predictionId || typeof predictionId !== 'string') {
      throw new InvalidConsensusOutputError(
        'predictionId is required and must be a non-empty string.',
        'PREDICTION_ID_REQUIRED',
      );
    }
    if (!spinId || typeof spinId !== 'string') {
      throw new InvalidConsensusOutputError('spinId is required and must be a non-empty string.', 'SPIN_REQUIRED');
    }

    // ── Target resolution ──────────────────────────────────────────────
    let resolvedTarget;
    if (target && typeof target === 'object' && target.type === 'NUMBER') {
      resolvedTarget = createNumberTarget(target.value);
    } else if (target !== undefined) {
      // Explicit but non-NUMBER target → malformed call, not an ambiguity.
      throw new InvalidConsensusOutputError(
        `target must be a NUMBER target; got ${JSON.stringify(target)}.`,
        'TARGET_REQUIRED',
      );
    } else {
      resolvedTarget = createNumberTarget(number); // throws InvalidPredictionTargetError when invalid
    }

    // ── Entry lookup ───────────────────────────────────────────────────
    const numKey = resolvedTarget.value;
    const entry = numbers[numKey];
    if (entry === undefined || entry === null || typeof entry !== 'object') {
      throw new InvalidConsensusOutputError(
        `no entry for number "${numKey}" in consensusOutput.numbers.`,
        'NUMBER_NOT_IN_OUTPUT',
      );
    }
    if (entry.valid !== true) {
      throw new InvalidConsensusOutputError(
        `entry for number "${numKey}" is not valid (${entry.invalidReason ?? 'unknown reason'}).`,
        'INVALID_ENTRY',
      );
    }

    // ── createdAt ──────────────────────────────────────────────────────
    const resolvedCreatedAt =
      (typeof createdAt === 'string' && createdAt.length > 0 ? createdAt : null) ??
      consensusOutput.metadata?.consensus?.appliedAt ??
      null;
    if (resolvedCreatedAt === null) {
      throw new InvalidConsensusOutputError(
        'createdAt is required when consensusOutput.metadata.consensus.appliedAt is absent.',
        'TIMESTAMP_REQUIRED',
      );
    }

    // ── Calibration mapping ────────────────────────────────────────────
    let calibration = null;
    if (
      entry.calibratedProbability !== null &&
      entry.calibratedProbability !== undefined &&
      entry.calibration !== null &&
      entry.calibration !== undefined &&
      typeof entry.calibration.name === 'string' &&
      entry.calibration.name.length > 0
    ) {
      calibration = {
        probability: entry.calibratedProbability,
        strategyName: entry.calibration.name,
        modelId: entry.calibration.modelVersion ?? undefined,
        modelHash: undefined, // the project's calibration contract has no model hash
      };
    }

    return createPredictionRecord({
      predictionId,
      spinId,
      target: resolvedTarget,
      rawConsensusScore: entry.rawConsensusScore,
      calibration,
      createdAt: resolvedCreatedAt,
      metadata,
    });
  }
}
