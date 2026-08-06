/**
 * InMemoryCalibrationObservationRepository — in-memory adapter for
 * CalibrationObservationRepository (Fase 2.3.2, phase-scoped).
 *
 * Invariants (s14/s15):
 * - Never overwrites: existing observationId with different content →
 *   DuplicateCalibrationObservationError.
 * - Idempotent: saving the exact same observation again is a no-op.
 * - Logical uniqueness: the (predictionId, outcomeId) pair maps to at
 *   most one observation; the same predictionId may never be observed
 *   against a different outcome.
 * - Deterministic query order: predictionCreatedAt asc, predictionId asc,
 *   observationId asc as final tie-break.
 * - Stored records are the caller's deep-frozen observations; the
 *   repository never mutates them.
 *
 * Duplicates are checked with three indexes:
 *   _byId         observationId → observation
 *   _byPrediction predictionId → observationId   (one observation per prediction)
 *   _logical      [predictionId, outcomeId] → observationId
 */

import { CalibrationObservationRepository } from '../application/CalibrationObservationRepository.js';
import { DuplicateCalibrationObservationError } from '../domain/errors.js';

/** Stable, collision-free logical key for a (predictionId, outcomeId) pair. */
function logicalKey(observation) {
  return JSON.stringify([observation.predictionId, observation.outcomeId]);
}

/** Canonical deep-equality check — observations are deep-frozen with stable key order. */
function identical(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export class InMemoryCalibrationObservationRepository extends CalibrationObservationRepository {
  constructor() {
    super();
    this._byId = new Map();
    this._byPrediction = new Map();
    this._logical = new Map();
  }

  /**
   * Mutation-free invariant check (preflight for batch atomicity).
   * @param {CalibrationObservation} observation
   * @throws {DuplicateCalibrationObservationError}
   */
  assertCanSave(observation) {
    const existing = this._byId.get(observation.observationId);
    if (existing !== undefined) {
      if (identical(existing, observation)) return; // idempotent no-op
      throw new DuplicateCalibrationObservationError(
        `observationId "${observation.observationId}" already exists with different content`,
      );
    }

    const key = logicalKey(observation);
    const logicalOwner = this._logical.get(key);
    if (logicalOwner !== undefined) {
      throw new DuplicateCalibrationObservationError(
        `prediction "${observation.predictionId}" + outcome "${observation.outcomeId}" ` +
          `already observed (observation "${logicalOwner}")`,
      );
    }

    const predictionOwner = this._byPrediction.get(observation.predictionId);
    if (predictionOwner !== undefined) {
      throw new DuplicateCalibrationObservationError(
        `prediction "${observation.predictionId}" already observed against another outcome ` +
          `(observation "${predictionOwner}")`,
      );
    }
  }

  /**
   * @param {CalibrationObservation} observation
   * @returns {CalibrationObservation} the stored observation
   * @throws {DuplicateCalibrationObservationError}
   */
  save(observation) {
    this.assertCanSave(observation);
    this._byId.set(observation.observationId, observation);
    this._byPrediction.set(observation.predictionId, observation.observationId);
    this._logical.set(logicalKey(observation), observation.observationId);
    return observation;
  }

  /** @param {string} observationId @returns {CalibrationObservation|null} */
  findById(observationId) {
    return this._byId.get(observationId) ?? null;
  }

  /**
   * @param {string} predictionId
   * @returns {CalibrationObservation[]} zero or one observation, frozen
   */
  findByPredictionId(predictionId) {
    const observationId = this._byPrediction.get(predictionId);
    if (observationId === undefined) return [];
    return [this._byId.get(observationId)];
  }

   /**
    * All stored observations as a defensive copy, deterministic order
    * (predictionCreatedAt asc, predictionId asc, observationId asc).
    * @returns {CalibrationObservation[]}
    */
   findAll() {
     const results = [...this._byId.values()];
     results.sort((a, b) => {
       const byTime = a.predictionCreatedAt.localeCompare(b.predictionCreatedAt);
       if (byTime !== 0) return byTime;
       const byPrediction = a.predictionId.localeCompare(b.predictionId);
       if (byPrediction !== 0) return byPrediction;
       return a.observationId.localeCompare(b.observationId);
     });
     return results;
   }

  /**
   * @param {string} spinId
   * @returns {CalibrationObservation[]} observations of the spin, deterministic order
   */
  findBySpinId(spinId) {
    const results = [];
    for (const observation of this._byId.values()) {
      if (observation.spinId === spinId) results.push(observation);
    }
    results.sort((a, b) => {
      const byTime = a.predictionCreatedAt.localeCompare(b.predictionCreatedAt);
      if (byTime !== 0) return byTime;
      const byPrediction = a.predictionId.localeCompare(b.predictionId);
      if (byPrediction !== 0) return byPrediction;
      return a.observationId.localeCompare(b.observationId);
    });
    return results;
  }

  /** @returns {number} total stored observations */
  count() {
    return this._byId.size;
  }

  /** @returns {void} */
  clear() {
    this._byId.clear();
    this._byPrediction.clear();
    this._logical.clear();
  }
}
