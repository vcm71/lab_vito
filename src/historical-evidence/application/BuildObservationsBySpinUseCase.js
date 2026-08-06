/**
 * BuildObservationsBySpinUseCase — materialises ALL complete calibration
 * observations for one spin.
 *
 * Semantics (Fase 2.3.2):
 * - COMPLETED spin  → one observation per prediction, in deterministic
 *   order (predictionCreatedAt asc, then predictionId asc).
 * - PENDING_OUTCOME → zero observations, status reported. Missing
 *   outcomes are NEVER interpreted as observedOutcome = 0.
 * - EMPTY (no evidence) → SpinNotFoundError (mirrors
 *   GetEvidenceBySpinUseCase).
 * - All-or-nothing: every observation is built (validate all) and every
 *   duplicate/invariant is checked (preflight) BEFORE any save. If any
 *   step fails, nothing is persisted.
 * - Persistence is optional: when `observationRepository` is null the use
 *   case only builds and returns the observations (no side effects).
 *
 * observationId is produced by an injected generator; the default is the
 * deterministic sequential generator from ObservationIdentity.
 */

import { EvidenceStatus, determineStatus } from '../domain/EvidenceStatus.js';
import { createSequentialObservationId } from '../domain/ObservationIdentity.js';
import { SpinNotFoundError } from '../domain/errors.js';

/**
 * @typedef {Object} BuildObservationsResult
 * @property {string} spinId
 * @property {string} evidenceStatus — PENDING_OUTCOME | COMPLETED
 * @property {number} observationCount
 * @property {CalibrationObservation[]} observations
 */

export class BuildObservationsBySpinUseCase {
  /**
   * @param {Object} deps
   * @param {EvidenceRepository} deps.evidenceRepository — source of predictions + outcome
   * @param {ObservationBuilder} deps.observationBuilder
   * @param {CalibrationObservationRepository|null} [deps.observationRepository] — null = build-only (no persistence)
   * @param {((spinId: string, index: number) => string)|null} [deps.observationIdGenerator]
   */
  constructor({ evidenceRepository, observationBuilder, observationRepository = null, observationIdGenerator = null }) {
    this.evidenceRepository = evidenceRepository;
    this.observationBuilder = observationBuilder;
    this.observationRepository = observationRepository;
    this.observationIdGenerator = observationIdGenerator ?? createSequentialObservationId;
  }

  /**
   * @param {Object} params
   * @param {string} params.spinId
   * @returns {BuildObservationsResult}
   * @throws {SpinNotFoundError} no evidence exists for the spin
   */
  execute({ spinId }) {
    if (!spinId || typeof spinId !== 'string') {
      throw new TypeError('spinId must be a non-empty string.');
    }

    const outcome = this.evidenceRepository.getOutcomeBySpinId(spinId);
    const predictions = this.evidenceRepository.getPredictionsBySpinId(spinId);
    const status = determineStatus(predictions, outcome);

    if (status === EvidenceStatus.EMPTY) {
      throw new SpinNotFoundError(spinId);
    }

    if (status === EvidenceStatus.PENDING_OUTCOME) {
      return { spinId, evidenceStatus: status, observationCount: 0, observations: [] };
    }

    // COMPLETED — deterministic order: predictionCreatedAt asc, predictionId asc
    const ordered = [...predictions].sort((a, b) => {
      const byTime = a.createdAt.localeCompare(b.createdAt);
      if (byTime !== 0) return byTime;
      return a.predictionId.localeCompare(b.predictionId);
    });

    // 1. Validate all — build every observation before touching storage.
    const observations = ordered.map((prediction, index) =>
      this.observationBuilder.buildObservation({
        observationId: this.observationIdGenerator(spinId, index),
        prediction,
        outcome,
        createdAt: outcome.recordedAt,
      }),
    );

    // 2. Preflight all — duplicate/invariant checks without mutating.
    if (this.observationRepository) {
      for (const observation of observations) {
        this.observationRepository.assertCanSave(observation);
      }
      // 3. Save all — cannot fail after a successful preflight.
      for (const observation of observations) {
        this.observationRepository.save(observation);
      }
    }

    return { spinId, evidenceStatus: status, observationCount: observations.length, observations };
  }
}
