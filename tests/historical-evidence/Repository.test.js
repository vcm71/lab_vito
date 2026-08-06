/**
 * Repository tests — hardened adapter (Fase 2.3.1.1).
 *
 * Covers:
 * - savePrediction / getPredictionsBySpinId
 * - saveOutcome / getOutcomeBySpinId
 * - Duplicate / contradiction / idempotent writes
 * - Temporal anti-leakage enforced by repository
 * - Defensive ordering (createdAt desc, predictionId tiebreaker)
 * - Clear
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryEvidenceRepository,
  createPredictionRecord,
  createSpinOutcomeRecord,
  createNumberTarget,
  DuplicatePredictionError,
  ContradictoryOutcomeError,
  DuplicateOutcomeError,
  TemporalEvidenceLeakageError,
} from '../../src/historical-evidence/index.js';

// ── Helpers ────────────────────────────────────────────────────────────

const target17 = createNumberTarget('17');
const target5 = createNumberTarget('5');

const makePred = (id, spin = 's1', overrides = {}) => createPredictionRecord({
  predictionId: id,
  spinId: spin,
  target: target17,
  rawConsensusScore: 0.65,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const makeOut = (id, spin = 's1', num = '17', recAt = '2026-01-01T00:00:01.000Z') =>
  createSpinOutcomeRecord({
    outcomeId: id,
    spinId: spin,
    winningNumber: num,
    recordedAt: recAt,
  });

// ═══════════════════════════════════════════════════════════════════════

describe('InMemoryEvidenceRepository (hardened)', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryEvidenceRepository();
  });

  // ── savePrediction ───────────────────────────────────────────────────

  describe('savePrediction', () => {
    it('saves and retrieves predictions by spin', () => {
      repo.savePrediction(makePred('p1'));
      const results = repo.getPredictionsBySpinId('s1');
      expect(results).toHaveLength(1);
      expect(results[0].predictionId).toBe('p1');
    });

    it('rejects duplicate prediction IDs', () => {
      repo.savePrediction(makePred('p1'));
      expect(() => repo.savePrediction(makePred('p1')))
        .toThrow(DuplicatePredictionError);
    });

    it('stores multiple predictions for the same spin', () => {
      repo.savePrediction(makePred('p1'));
      repo.savePrediction(makePred('p2', 's1', { target: target5 }));
      expect(repo.getPredictionsBySpinId('s1')).toHaveLength(2);
    });

    it('returns empty array for unknown spin', () => {
      expect(repo.getPredictionsBySpinId('nonexistent')).toEqual([]);
    });

    it('orders predictions: createdAt desc, predictionId ascending tiebreaker', () => {
      repo.savePrediction(makePred('p2', 's1', { createdAt: '2026-01-02T00:00:00.000Z' }));
      repo.savePrediction(makePred('p1', 's1', { createdAt: '2026-01-01T00:00:00.000Z' }));
      repo.savePrediction(makePred('p3', 's1', { createdAt: '2026-01-02T00:00:00.000Z' }));

      const results = repo.getPredictionsBySpinId('s1');
      // Most recent first: p3 and p2 (same ts), then p1
      expect(results[0].predictionId).toBe('p2'); // p2 < p3 lexicographically
      expect(results[1].predictionId).toBe('p3');
      expect(results[2].predictionId).toBe('p1');
    });

    // ── Temporal integrity ─────────────────────────────────────────

    it('rejects prediction recorded AFTER an existing outcome', () => {
      repo.saveOutcome(makeOut('o1', 's1', '17', '2026-01-01T00:00:01.000Z'));
      expect(() =>
        repo.savePrediction(makePred('p-late', 's1', {
          createdAt: '2026-01-01T00:00:02.000Z', // AFTER outcome
        })),
      ).toThrow(TemporalEvidenceLeakageError);
    });

    it('allows prediction at same timestamp as outcome (legitimate)', () => {
      repo.saveOutcome(makeOut('o1', 's1', '17', '2026-01-01T00:00:01.000Z'));
      expect(() =>
        repo.savePrediction(makePred('p-same', 's1', {
          createdAt: '2026-01-01T00:00:01.000Z',
        })),
      ).not.toThrow();
    });
  });

  // ── saveOutcome ──────────────────────────────────────────────────────

  describe('saveOutcome', () => {
    it('saves and retrieves an outcome', () => {
      repo.saveOutcome(makeOut('o1'));
      const r = repo.getOutcomeBySpinId('s1');
      expect(r).not.toBeNull();
      expect(r.outcomeId).toBe('o1');
    });

    it('returns null for unknown spin', () => {
      expect(repo.getOutcomeBySpinId('nonexistent')).toBeNull();
    });

    it('rejects contradictory outcomes (different winningNumber, same spin)', () => {
      repo.saveOutcome(makeOut('o1', 's1', '17'));
      expect(() => repo.saveOutcome(makeOut('o2', 's1', '5')))
        .toThrow(ContradictoryOutcomeError);
    });

    it('is idempotent for identical outcomeId + winningNumber', () => {
      repo.saveOutcome(makeOut('o1', 's1', '17'));
      // Same outcomeId and winningNumber — should be silently idempotent
      expect(() => repo.saveOutcome(makeOut('o1', 's1', '17')))
        .not.toThrow();
      expect(repo.getOutcomeBySpinId('s1').outcomeId).toBe('o1');
    });

    it('rejects duplicate outcome for different outcomeId but same spin+number', () => {
      repo.saveOutcome(makeOut('o1', 's1', '17'));
      expect(() => repo.saveOutcome(makeOut('o2', 's1', '17')))
        .toThrow(DuplicateOutcomeError);
    });

    // ── Temporal integrity ─────────────────────────────────────────

    it('rejects outcome recorded BEFORE an existing prediction', () => {
      repo.savePrediction(makePred('p1', 's1', { createdAt: '2026-01-01T00:00:01.000Z' }));
      expect(() =>
        repo.saveOutcome(makeOut('o1', 's1', '17', '2026-01-01T00:00:00.000Z')),
      ).toThrow(TemporalEvidenceLeakageError);
    });

    it('allows outcome at same timestamp as prediction', () => {
      repo.savePrediction(makePred('p1', 's1', { createdAt: '2026-01-01T00:00:00.000Z' }));
      expect(() =>
        repo.saveOutcome(makeOut('o1', 's1', '17', '2026-01-01T00:00:00.000Z')),
      ).not.toThrow();
    });
  });

  // ── clear ────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all data', () => {
      repo.savePrediction(makePred('p1', 's1'));
      repo.saveOutcome(makeOut('o1', 's2'));
      repo.clear();
      expect(repo.getPredictionsBySpinId('s1')).toEqual([]);
      expect(repo.getOutcomeBySpinId('s2')).toBeNull();
    });
  });
});
