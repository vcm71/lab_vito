/**
 * Repository tests — InMemoryCalibrationObservationRepository (Fase 2.3.2).
 *
 * Covers the invariants (s14/s15):
 * - Never overwrite; idempotent when content is identical
 * - Logical uniqueness: (predictionId, outcomeId) pair and
 *   one-observation-per-prediction
 * - Deterministic query order; count/clear; frozen stored records
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryCalibrationObservationRepository,
  createCalibrationObservation,
  createNumberTarget,
  DuplicateCalibrationObservationError,
} from '../../src/historical-evidence/index.js';

const T = (n) => createNumberTarget(n);

const observation = (overrides = {}) =>
  createCalibrationObservation({
    observationId: 'obs-spin-1-1',
    predictionId: 'p-001',
    outcomeId: 'o-001',
    spinId: 'spin-1',
    target: T('17'),
    rawConsensusScore: 0.72,
    observedOutcome: 1,
    predictionCreatedAt: '2026-01-01T00:00:00.000Z',
    outcomeRecordedAt: '2026-01-01T00:00:05.000Z',
    observationCreatedAt: '2026-01-01T00:00:05.000Z',
    ...overrides,
  });

describe('InMemoryCalibrationObservationRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryCalibrationObservationRepository();
  });

  it('saves and retrieves by id', () => {
    const obs = observation();
    repo.save(obs);
    expect(repo.findById('obs-spin-1-1')).toBe(obs);
    expect(repo.findById('unknown')).toBeNull();
  });

  it('is idempotent for the exact same observation', () => {
    const obs = observation();
    repo.save(obs);
    expect(() => repo.save(obs)).not.toThrow();
    expect(repo.count()).toBe(1);
  });

  it('rejects an existing observationId with different content (never overwrites)', () => {
    repo.save(observation());
    const tampered = observation({ observedOutcome: 0 });
    try {
      repo.save(tampered);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DuplicateCalibrationObservationError);
      expect(err.code).toBe('DUPLICATE_OBSERVATION');
    }
    expect(repo.count()).toBe(1);
  });

  it('rejects the same (predictionId, outcomeId) pair under a different observationId', () => {
    repo.save(observation());
    const secondId = observation({ observationId: 'obs-spin-1-2' });
    expect(() => repo.save(secondId)).toThrow(DuplicateCalibrationObservationError);
  });

  it('rejects the same predictionId observed against a different outcome', () => {
    repo.save(observation());
    const otherOutcome = observation({
      observationId: 'obs-spin-1-2',
      outcomeId: 'o-002',
      spinId: 'spin-2',
    });
    expect(() => repo.save(otherOutcome)).toThrow(DuplicateCalibrationObservationError);
  });

  it('allows the same outcomeId under different predictions', () => {
    repo.save(observation());
    const otherPrediction = observation({
      observationId: 'obs-spin-1-2',
      predictionId: 'p-002',
      target: T('5'),
    });
    expect(() => repo.save(otherPrediction)).not.toThrow();
    expect(repo.count()).toBe(2);
  });

  it('finds by predictionId (zero or one)', () => {
    repo.save(observation());
    expect(repo.findByPredictionId('p-001')).toHaveLength(1);
    expect(repo.findByPredictionId('p-999')).toEqual([]);
  });

  it('returns spin observations in deterministic order (createdAt asc, predictionId asc)', () => {
    repo.save(observation({ observationId: 'obs-s-2', predictionId: 'p-b', predictionCreatedAt: '2026-01-01T00:00:02.000Z' }));
    repo.save(observation({ observationId: 'obs-s-1', predictionId: 'p-a', predictionCreatedAt: '2026-01-01T00:00:01.000Z' }));
    repo.save(observation({ observationId: 'obs-s-3', predictionId: 'p-c', predictionCreatedAt: '2026-01-01T00:00:02.000Z' }));

    expect(repo.findBySpinId('spin-1').map((o) => o.predictionId)).toEqual(['p-a', 'p-b', 'p-c']);
  });

  it('counts and clears', () => {
    repo.save(observation());
    repo.save(observation({ observationId: 'obs-spin-2-1', predictionId: 'p-002', spinId: 'spin-2', target: T('5'), outcomeId: 'o-002' }));
    expect(repo.count()).toBe(2);
    repo.clear();
    expect(repo.count()).toBe(0);
    expect(repo.findBySpinId('spin-1')).toEqual([]);
  });

  it('preflight assertCanSave does not mutate state', () => {
    const obs = observation();
    repo.assertCanSave(obs);
    expect(repo.count()).toBe(0);
    repo.save(obs);
    expect(() => repo.assertCanSave(obs)).not.toThrow(); // idempotent
    expect(repo.count()).toBe(1);
  });
});
