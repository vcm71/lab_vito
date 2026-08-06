/**
 * PredictionRecord — immutable snapshot of a single prediction.
 *
 * A prediction links a target (e.g., NUMBER) to its raw consensus score
 * before any calibration is applied. Optional calibration metadata captures
 * post-hoc model output.
 *
 * Design decisions (Fase 2.3.1.1):
 * - `target` replaces `number` → extensible beyond single-number predictions
 * - `rawConsensusScore` is MANDATORY for calibration evidence
 * - `calibration` is nested explicitly, or null when not yet calibrated
 * - Deep immutability via `deepFreeze` (protects metadata, target, calibration)
 *
 * Immutability: all fields are read-only. Use the factory to create.
 * Timestamps: ISO 8601 UTC, caller-injected (clock injection).
 *
 * @typedef {Object} PredictionRecord
 * @property {string} predictionId — globally unique
 * @property {string} spinId — links prediction to its outcome
 * @property {object} target — discriminated prediction target (e.g. { type:'NUMBER', value:'23' })
 * @property {number} rawConsensusScore — [0, 1] finite number; the score BEFORE calibration
 * @property {{ probability: number, strategyName: string, modelId?: string, modelHash?: string }|null} calibration
 * @property {string} createdAt — ISO 8601 UTC
 * @property {object|null} metadata — opaque JSON-safe frozen metadata bag
 */

import { deepFreeze } from './immutable.js';
import { normaliseMetadata } from './metadata.js';
import { InvalidConsensusScoreError } from './errors.js';

export function createPredictionRecord({
  predictionId,
  spinId,
  target,
  rawConsensusScore,
  calibration = null,
  createdAt,
  metadata,
}) {
  // ── Required fields ──────────────────────────────────────────────────
  if (!predictionId || typeof predictionId !== 'string') {
    throw new TypeError('predictionId must be a non-empty string.');
  }
  if (!spinId || typeof spinId !== 'string') {
    throw new TypeError('spinId must be a non-empty string.');
  }
  if (!createdAt || typeof createdAt !== 'string') {
    throw new TypeError('createdAt must be a non-empty ISO string.');
  }
  if (typeof target !== 'object' || target === null) {
    throw new TypeError('target must be a PredictionTarget object.');
  }

  // ── rawConsensusScore ────────────────────────────────────────────────
  if (typeof rawConsensusScore !== 'number' || !Number.isFinite(rawConsensusScore) || rawConsensusScore < 0 || rawConsensusScore > 1) {
    throw new InvalidConsensusScoreError(rawConsensusScore);
  }

  // ── Calibration (optional, but explicit) ─────────────────────────────
  let safeCal = null;
  if (calibration !== null) {
    if (typeof calibration !== 'object' || calibration === null) {
      throw new TypeError('calibration must be a plain object or null.');
    }
    if (typeof calibration.probability !== 'number' || !Number.isFinite(calibration.probability) || calibration.probability < 0 || calibration.probability > 1) {
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
    predictionId,
    spinId,
    target,
    rawConsensusScore,
    calibration: safeCal ? deepFreeze(safeCal) : null,
    createdAt,
    metadata: safeMeta,
  });
}
