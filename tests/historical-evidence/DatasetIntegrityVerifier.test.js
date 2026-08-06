/**
 * DatasetIntegrityVerifier tests (Fase 2.3.4.3).
 *
 * Covers the scientific baseline, the full operational snapshot checks,
 * immutability, corruption detection and explicit options validation.
 */

import { describe, it, expect } from 'vitest';
import {
  DatasetIntegrityVerifier,
  DATASET_INTEGRITY_CHECK_IDS,
  DATASET_INTEGRITY_STATUS,
  INTEGRITY_VERIFICATION_MODE,
  UnsupportedIntegrityCheckError,
} from '../../src/historical-evidence/index.js';
import { cloneIntegrityFixture, createIntegrityFixture } from './fixtures/datasetIntegrityFixture.js';

const verifier = new DatasetIntegrityVerifier();

function sortStrings(values) {
  return [...values].sort();
}

describe('DatasetIntegrityVerifier — scientific mode', () => {
  it('validates a frozen scientific dataset without mutating inputs', () => {
    const fixture = createIntegrityFixture();
    const before = structuredClone(fixture.dataset);

    const report = verifier.verify(
      { dataset: fixture.dataset },
      { mode: INTEGRITY_VERIFICATION_MODE.SCIENTIFIC },
    );

    expect(report.status).toBe(DATASET_INTEGRITY_STATUS.VALID);
    expect(report.isValid()).toBe(true);
    expect(report.summary).toMatchObject({
      totalChecks: 8,
      executedChecks: 8,
      passedChecks: 8,
      failedChecks: 0,
      skippedChecks: 0,
    });
    expect(report.getFailures()).toEqual([]);
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.CONTENT_HASH).status).toBe('PASS');
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.CANONICAL_ORDER).status).toBe('PASS');
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.STATISTICS).status).toBe('PASS');
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.checks[0])).toBe(true);
    expect(fixture.dataset).toEqual(before);
  });

  it('flags scientific corruption in hashes, order and statistics', () => {
    const fixture = createIntegrityFixture();
    const dataset = cloneIntegrityFixture(fixture.dataset);
    dataset.observations = [...dataset.observations].reverse();
    dataset.contentHash = '0'.repeat(64);
    dataset.statistics = { ...dataset.statistics, observationCount: 99 };

    const report = verifier.verify(
      { dataset },
      { mode: INTEGRITY_VERIFICATION_MODE.SCIENTIFIC },
    );

    expect(report.status).toBe(DATASET_INTEGRITY_STATUS.INVALID);
    expect(sortStrings(report.getFailures().map((check) => check.checkId))).toEqual(
      sortStrings([
        DATASET_INTEGRITY_CHECK_IDS.CONTENT_HASH,
        DATASET_INTEGRITY_CHECK_IDS.CANONICAL_ORDER,
        DATASET_INTEGRITY_CHECK_IDS.STATISTICS,
      ]),
    );
  });
});

describe('DatasetIntegrityVerifier — full mode', () => {
  it('validates identity, descriptor and immutability for the snapshot contract', () => {
    const fixture = createIntegrityFixture();
    const report = verifier.verify(
      {
        dataset: fixture.dataset,
        identity: fixture.identity,
        descriptor: fixture.descriptor,
      },
      { mode: INTEGRITY_VERIFICATION_MODE.FULL },
    );

    expect(report.status).toBe(DATASET_INTEGRITY_STATUS.VALID);
    expect(report.summary).toMatchObject({
      totalChecks: 12,
      executedChecks: 12,
      passedChecks: 12,
      failedChecks: 0,
      skippedChecks: 0,
    });
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.DATASET_IDENTITY).status).toBe('PASS');
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.SNAPSHOT_DESCRIPTOR).status).toBe('PASS');
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.IMMUTABILITY).status).toBe('PASS');
  });

  it('flags a mutable identity/descriptor even when hashes still match', () => {
    const fixture = createIntegrityFixture();
    const mutableIdentity = cloneIntegrityFixture(fixture.identity);
    const mutableDescriptor = cloneIntegrityFixture(fixture.descriptor);

    const report = verifier.verify(
      {
        dataset: fixture.dataset,
        identity: mutableIdentity,
        descriptor: mutableDescriptor,
      },
      { mode: INTEGRITY_VERIFICATION_MODE.FULL },
    );

    expect(report.status).toBe(DATASET_INTEGRITY_STATUS.INVALID);
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.DATASET_IDENTITY).status).toBe('PASS');
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.SNAPSHOT_DESCRIPTOR).status).toBe('PASS');
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.IMMUTABILITY).status).toBe('FAIL');
    expect(report.getFailures().map((check) => check.checkId)).toContain(
      DATASET_INTEGRITY_CHECK_IDS.IMMUTABILITY,
    );
  });

  it('flags descriptor drift in the shared snapshot fields', () => {
    const fixture = createIntegrityFixture();
    const descriptor = cloneIntegrityFixture(fixture.descriptor);
    descriptor.statistics = { ...descriptor.statistics, observationCount: descriptor.statistics.observationCount + 1 };

    const report = verifier.verify(
      {
        dataset: fixture.dataset,
        identity: fixture.identity,
        descriptor,
      },
      { mode: INTEGRITY_VERIFICATION_MODE.FULL },
    );

    expect(report.status).toBe(DATASET_INTEGRITY_STATUS.INVALID);
    expect(report.getCheck(DATASET_INTEGRITY_CHECK_IDS.SNAPSHOT_DESCRIPTOR).status).toBe('FAIL');
  });
});

describe('DatasetIntegrityVerifier — options validation', () => {
  it('rejects unsupported check ids explicitly', () => {
    const fixture = createIntegrityFixture();

    expect(() =>
      verifier.verify(
        { dataset: fixture.dataset },
        { mode: INTEGRITY_VERIFICATION_MODE.SCIENTIFIC, checks: ['NOPE'] },
      ),
    ).toThrow(UnsupportedIntegrityCheckError);
  });
});
