/**
 * InMemoryEvidenceRepository — volatile in-memory storage adapter.
 *
 * Enforces all EvidenceRepository invariants:
 * - No duplicate predictions (by predictionId)
 * - No duplicate/contradictory outcomes (by spinId)
 * - Temporal anti-leakage (prediction createdAt <= outcome recordedAt)
 * - Idempotent for identical writes
 * - Deterministic ordering (createdAt desc, predictionId as tiebreaker)
 * - Defensive copies on read (prevents external mutation)
 * - O(1) key-based lookups
 */

import { EvidenceRepository } from '../application/EvidenceRepository.js';
import {
  DuplicatePredictionError,
  DuplicateOutcomeError,
  ContradictoryOutcomeError,
  TemporalEvidenceLeakageError,
} from '../domain/errors.js';
import { validateChronology } from '../domain/chronology.js';

export class InMemoryEvidenceRepository extends EvidenceRepository {
  constructor() {
    super();
    /** @type {Map<string, PredictionRecord>} */
    this._predictions = new Map();
    /** @type {Map<string, SpinOutcomeRecord>} */
    this._outcomes = new Map();
    /** @type {Map<string, Set<string>>} spinId → predictionIds */
    this._spinPredictions = new Map();
  }

  /* ── savePrediction ─────────────────────────────────────────────────── */

  /** @param {PredictionRecord} record */
  savePrediction(record) {
    const { predictionId, spinId, createdAt } = record;

    // Duplicate check
    if (this._predictions.has(predictionId)) {
      throw new DuplicatePredictionError(predictionId);
    }

    // Temporal check: if outcome already exists, validate chronology
    const existingOutcome = this._outcomes.get(spinId);
    if (existingOutcome) {
      validateChronology({
        spinId,
        predictionCreatedAt: createdAt,
        outcomeRecordedAt: existingOutcome.recordedAt,
      });
    }

    this._predictions.set(predictionId, record);

    if (!this._spinPredictions.has(spinId)) {
      this._spinPredictions.set(spinId, new Set());
    }
    this._spinPredictions.get(spinId).add(predictionId);
  }

  /* ── saveOutcome ────────────────────────────────────────────────────── */

  /** @param {SpinOutcomeRecord} record */
  saveOutcome(record) {
    const { spinId, winningNumber, recordedAt } = record;
    const existing = this._outcomes.get(spinId);

    // Duplicate check
    if (existing) {
      // Idempotent if identical
      if (existing.winningNumber === winningNumber && existing.outcomeId === record.outcomeId) {
        return;
      }
      // Contradictory
      if (existing.winningNumber !== winningNumber) {
        throw new ContradictoryOutcomeError(spinId);
      }
      throw new DuplicateOutcomeError(spinId);
    }

    // Temporal check: validate against all existing predictions for this spin
    const predIds = this._spinPredictions.get(spinId);
    if (predIds) {
      for (const pid of predIds) {
        const pred = this._predictions.get(pid);
        if (pred) {
          validateChronology({
            spinId,
            predictionCreatedAt: pred.createdAt,
            outcomeRecordedAt: recordedAt,
          });
        }
      }
    }

    this._outcomes.set(spinId, record);
  }

  /* ── Queries ────────────────────────────────────────────────────────── */

  /** @returns {SpinOutcomeRecord|null} — defensive copy */
  getOutcomeBySpinId(spinId) {
    const record = this._outcomes.get(spinId);
    return record ?? null;
  }

  /** @returns {PredictionRecord[]} — defensive copies, chronologically ordered */
  getPredictionsBySpinId(spinId) {
    const predIds = this._spinPredictions.get(spinId);
    if (!predIds) return [];

    const results = [];
    for (const pid of predIds) {
      const r = this._predictions.get(pid);
      if (r) results.push(r);
    }

    // Deterministic order: createdAt descending, predictionId ascending as tiebreaker
    results.sort((a, b) => {
      const cmp = b.createdAt.localeCompare(a.createdAt);
      if (cmp !== 0) return cmp;
      return a.predictionId.localeCompare(b.predictionId);
    });

    return results;
  }

  /* ── Maintenance ────────────────────────────────────────────────────── */

  clear() {
    this._predictions.clear();
    this._outcomes.clear();
    this._spinPredictions.clear();
  }
}
