/**
 * Use cases tests — hardened flows (Fase 2.3.1.1).
 *
 * Covers:
 * - RecordPredictionUseCase: target shortcut + calibration
 * - RecordOutcomeUseCase: winningNumber, no observedOutcome
 * - GetEvidenceBySpinUseCase: PENDING_OUTCOME / COMPLETED / SpinNotFoundError
 * - End-to-end: prediction → outcome → retrieval
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryEvidenceRepository,
  RecordPredictionUseCase,
  RecordOutcomeUseCase,
  GetEvidenceBySpinUseCase,
  EvidenceStatus,
  SpinNotFoundError,
} from '../../src/historical-evidence/index.js';
import { createNumberTarget } from '../../src/historical-evidence/domain/PredictionTarget.js';

describe('Use Cases (hardened)', () => {
  let repo, recordPrediction, recordOutcome, getEvidence;

  beforeEach(() => {
    repo = new InMemoryEvidenceRepository();
    recordPrediction = new RecordPredictionUseCase(repo);
    recordOutcome = new RecordOutcomeUseCase(repo);
    getEvidence = new GetEvidenceBySpinUseCase(repo);
  });

  // ── RecordPredictionUseCase ──────────────────────────────────────────

  describe('RecordPredictionUseCase', () => {
    it('creates and stores a prediction via target', () => {
      const r = recordPrediction.execute({
        predictionId: 'p-001',
        spinId: 'spin-1',
        target: createNumberTarget('17'),
        rawConsensusScore: 0.72,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      expect(r.predictionId).toBe('p-001');
      expect(r.target.value).toBe('17');
      expect(r.rawConsensusScore).toBe(0.72);

      const stored = repo.getPredictionsBySpinId('spin-1');
      expect(stored).toHaveLength(1);
    });

    it('accepts backward compat { number } shortcut', () => {
      const r = recordPrediction.execute({
        predictionId: 'p-s1',
        spinId: 's1',
        number: '5',
        rawConsensusScore: 0.41,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(r.target.type).toBe('NUMBER');
      expect(r.target.value).toBe('5');
    });

    it('stores calibration as a nested object', () => {
      const r = recordPrediction.execute({
        predictionId: 'p-cal',
        spinId: 's-cal',
        target: createNumberTarget('23'),
        rawConsensusScore: 0.81,
        calibration: { probability: 0.78, strategyName: 'Isotonic-M1' },
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(r.calibration.probability).toBe(0.78);
      expect(r.calibration.strategyName).toBe('Isotonic-M1');
    });

    it('handles double zero via target', () => {
      const r = recordPrediction.execute({
        predictionId: 'p-zz',
        spinId: 'zz',
        target: createNumberTarget('00'),
        rawConsensusScore: 0.1,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(r.target.value).toBe('00');
    });

    it('handles double zero via backward compat shortcut', () => {
      const r = recordPrediction.execute({
        predictionId: 'p-zz2',
        spinId: 'zz2',
        number: '00',
        rawConsensusScore: 0.1,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(r.target.value).toBe('00');
    });
  });

  // ── RecordOutcomeUseCase ─────────────────────────────────────────────

  describe('RecordOutcomeUseCase', () => {
    it('creates and stores an outcome with winningNumber', () => {
      const r = recordOutcome.execute({
        outcomeId: 'o-001',
        spinId: 'spin-1',
        winningNumber: '17',
        recordedAt: '2026-01-01T00:00:01.000Z',
      });

      expect(r.outcomeId).toBe('o-001');
      expect(r.winningNumber).toBe('17');
      // observedOutcome is removed — not present
      expect(r.observedOutcome).toBeUndefined();
    });

    it('supports "0" and "00" outcomes', () => {
      expect(recordOutcome.execute({
        outcomeId: 'oz', spinId: 'z', winningNumber: '0',
        recordedAt: '2026-01-01T00:00:01.000Z',
      }).winningNumber).toBe('0');

      expect(recordOutcome.execute({
        outcomeId: 'ozz', spinId: 'zz', winningNumber: '00',
        recordedAt: '2026-01-01T00:00:01.000Z',
      }).winningNumber).toBe('00');
    });

    it('rejects invalid winning number (e.g. "37")', () => {
      expect(() => recordOutcome.execute({
        outcomeId: 'o-bad', spinId: 'bad', winningNumber: '37',
        recordedAt: '2026-01-01T00:00:01.000Z',
      })).toThrow();
    });

    it('returns a deep-frozen record', () => {
      const r = recordOutcome.execute({
        outcomeId: 'o-f', spinId: 'f', winningNumber: '17',
        recordedAt: '2026-01-01T00:00:01.000Z',
      });
      expect(Object.isFrozen(r)).toBe(true);
    });
  });

  // ── GetEvidenceBySpinUseCase ─────────────────────────────────────────

  describe('GetEvidenceBySpinUseCase', () => {
    it('returns PENDING_OUTCOME when only predictions exist', () => {
      recordPrediction.execute({
        predictionId: 'p1', spinId: 's1', number: '17',
        rawConsensusScore: 0.5, createdAt: '2026-01-01T00:00:00.000Z',
      });

      const result = getEvidence.execute('s1');
      expect(result.status).toBe(EvidenceStatus.PENDING_OUTCOME);
      expect(result.predictions).toHaveLength(1);
      expect(result.outcome).toBeNull();
    });

    it('returns COMPLETED when outcome exists', () => {
      recordPrediction.execute({
        predictionId: 'p1', spinId: 's1', number: '17',
        rawConsensusScore: 0.5, createdAt: '2026-01-01T00:00:00.000Z',
      });
      recordOutcome.execute({
        outcomeId: 'o1', spinId: 's1', winningNumber: '17',
        recordedAt: '2026-01-01T00:00:01.000Z',
      });

      const result = getEvidence.execute('s1');
      expect(result.status).toBe(EvidenceStatus.COMPLETED);
      expect(result.outcome).not.toBeNull();
      expect(result.outcome.winningNumber).toBe('17');
    });

    it('throws SpinNotFoundError for unknown spin', () => {
      expect(() => getEvidence.execute('unknown'))
        .toThrow(SpinNotFoundError);
    });
  });

  // ── End-to-end ───────────────────────────────────────────────────────

  describe('End-to-end flow', () => {
    it('prediction → outcome → retrieval', () => {
      const pred = recordPrediction.execute({
        predictionId: 'e2e-p1',
        spinId: 'e2e',
        target: createNumberTarget('23'),
        rawConsensusScore: 0.81,
        calibration: { probability: 0.78, strategyName: 'Isotonic-M1' },
        createdAt: '2026-07-30T10:00:00.000Z',
      });

      const out = recordOutcome.execute({
        outcomeId: 'e2e-o1',
        spinId: 'e2e',
        winningNumber: '23',
        recordedAt: '2026-07-30T10:00:30.000Z',
      });

      const result = getEvidence.execute('e2e');
      expect(result.status).toBe(EvidenceStatus.COMPLETED);
      expect(result.predictions).toHaveLength(1);
      expect(result.predictions[0].predictionId).toBe(pred.predictionId);
      expect(result.outcome.outcomeId).toBe(out.outcomeId);
    });

    it('multiple predictions, single outcome', () => {
      recordPrediction.execute({
        predictionId: 'm1', spinId: 'multi', number: '7',
        rawConsensusScore: 0.3, createdAt: '2026-01-01T00:00:00.000Z',
      });
      recordPrediction.execute({
        predictionId: 'm2', spinId: 'multi', number: '14',
        rawConsensusScore: 0.4, createdAt: '2026-01-01T00:00:00.100Z',
      });

      recordOutcome.execute({
        outcomeId: 'mo', spinId: 'multi', winningNumber: '14',
        recordedAt: '2026-01-01T00:00:01.000Z',
      });

      const result = getEvidence.execute('multi');
      expect(result.predictions).toHaveLength(2);
      expect(result.status).toBe(EvidenceStatus.COMPLETED);
    });

    it('temporal integrity: outcome cannot precede prediction', () => {
      recordPrediction.execute({
        predictionId: 'tp', spinId: 'temporal',
        target: createNumberTarget('5'),
        rawConsensusScore: 0.5,
        createdAt: '2026-01-01T00:00:01.000Z', // prediction AT 00:01
      });

      expect(() =>
        recordOutcome.execute({
          outcomeId: 'to', spinId: 'temporal',
          winningNumber: '5',
          recordedAt: '2026-01-01T00:00:00.000Z', // outcome BEFORE prediction
        }),
      ).toThrow();
    });
  });
});
