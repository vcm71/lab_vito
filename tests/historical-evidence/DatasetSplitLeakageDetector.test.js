import { describe, it, expect } from 'vitest';
import {
  DATASET_INTEGRITY_STATUS,
  DATASET_SPLIT_LEAKAGE_FINDING_TYPE,
  DATASET_SPLIT_LEAKAGE_SEVERITY,
  DATASET_SPLIT_LEAKAGE_STATUS,
  DATASET_SPLIT_VALIDATION_MODE,
  DatasetSplitLeakageDetector,
  UnsupportedDatasetSplitValidationModeError,
  createDatasetIdentity,
  createDatasetPartition,
  createDatasetVersion,
  createHistoricalCalibrationDataset,
  createSplitMetadata,
  createSplitPeriod,
  createDatasetSplitLeakageFinding,
  createDatasetSplitLeakageReport,
} from '../../src/historical-evidence/index.js';

function observation({ observationId, spinId, predictionCreatedAt }) {
  return Object.freeze({
    schemaVersion: '1',
    observationId,
    predictionId: `${observationId}-prediction`,
    outcomeId: `${observationId}-outcome`,
    spinId,
    target: { kind: 'number', value: 17 },
    rawConsensusScore: 0.72,
    calibration: { probability: 0.7, strategyName: 'isotonic', modelId: 'm1' },
    observedOutcome: 1,
    predictionCreatedAt,
    outcomeRecordedAt: predictionCreatedAt,
    observationCreatedAt: predictionCreatedAt,
    metadata: null,
  });
}

function datasetFixture({
  datasetId = 'ds-split-1',
  contentHash = 'c'.repeat(64),
  manifestHash = 'd'.repeat(64),
  createdAt = '2026-08-01T00:00:00.000Z',
  observations = [
    observation({ observationId: 'obs-1', spinId: 'spin-1', predictionCreatedAt: '2026-01-01T00:00:01.000Z' }),
    observation({ observationId: 'obs-2', spinId: 'spin-1', predictionCreatedAt: '2026-01-01T00:00:02.000Z' }),
    observation({ observationId: 'obs-3', spinId: 'spin-2', predictionCreatedAt: '2026-01-01T00:00:03.000Z' }),
    observation({ observationId: 'obs-4', spinId: 'spin-3', predictionCreatedAt: '2026-01-01T00:00:04.000Z' }),
  ],
} = {}) {
  const identity = createDatasetIdentity({
    datasetId,
    datasetVersion: createDatasetVersion(1, 0, 0),
    schemaVersion: '1',
    observationSchemaVersion: '1',
    contentHash,
    manifestHash,
  });

  return {
    ...createHistoricalCalibrationDataset({
      datasetId,
      observationSchemaVersion: '1',
      createdAt,
      period: {
        predictionCreatedFrom: '2026-01-01T00:00:01.000Z',
        predictionCreatedTo: '2026-01-01T00:00:04.000Z',
        outcomeRecordedFrom: '2026-01-01T00:00:01.000Z',
        outcomeRecordedTo: '2026-01-01T00:00:04.000Z',
      },
      manifest: { datasetId },
      statistics: { observationCount: observations.length },
      contentHash,
      manifestHash,
      observations,
    }),
    identity,
  };
}

function partition({ partitionType, sourceDatasetIdentity, from, to, observationIds, spinIds }) {
  return createDatasetPartition({
    partitionType,
    sourceDatasetIdentity,
    period: createSplitPeriod({ from, to }),
    observationIds,
    spinIds,
  });
}

function splitFixture({ sourceDatasetIdentity, partitions, splitId = 'split-1', createdAt = '2026-08-01T00:00:00.000Z' }) {
  return {
    metadata: createSplitMetadata({ sourceDatasetIdentity, createdAt, splitId }),
    sourceDatasetIdentity,
    partitions,
  };
}

const sourceIdentity = createDatasetIdentity({
  datasetId: 'ds-split-1',
  datasetVersion: createDatasetVersion(1, 0, 0),
  schemaVersion: '1',
  observationSchemaVersion: '1',
  contentHash: 'c'.repeat(64),
  manifestHash: 'd'.repeat(64),
});

function makeDetector(integrityVerifier = undefined) {
  return new DatasetSplitLeakageDetector(integrityVerifier === undefined ? {} : { integrityVerifier });
}

describe('DatasetSplitLeakageDetector', () => {
  it('reports a clean split as VALID', () => {
    const dataset = datasetFixture();
    const split = splitFixture({
      sourceDatasetIdentity: dataset.identity,
      partitions: [
        partition({
          partitionType: 'TRAIN',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:01.000Z',
          to: '2026-01-01T00:00:02.000Z',
          observationIds: ['obs-1', 'obs-2'],
          spinIds: ['spin-1'],
        }),
        partition({
          partitionType: 'TEST',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:03.000Z',
          to: '2026-01-01T00:00:04.000Z',
          observationIds: ['obs-3', 'obs-4'],
          spinIds: ['spin-2', 'spin-3'],
        }),
      ],
    });

    const report = makeDetector({
      verify: () => ({
        status: DATASET_INTEGRITY_STATUS.VALID,
        summary: { reason: 'lineage fully materialised' },
      }),
    }).detect({
      dataset,
      split,
      mode: DATASET_SPLIT_VALIDATION_MODE.FULL,
      checkedAt: '2026-08-01T23:44:15-04:00',
    });

    expect(report.status).toBe(DATASET_SPLIT_LEAKAGE_STATUS.VALID);
    expect(report.isValid()).toBe(true);
    expect(report.hasLeakage()).toBe(false);
    expect(report.hasIncompleteEvidence()).toBe(false);
    expect(report.findings).toHaveLength(0);
    expect(report.summary.evidenceSufficient).toBe(true);
    expect(report.statistics.totalFindings).toBe(0);
    expect(report.checkedAt).toBe('2026-08-01T23:44:15-04:00');
  });

  it('rejects unsupported validation modes', () => {
    const dataset = datasetFixture();
    const split = splitFixture({
      sourceDatasetIdentity: dataset.identity,
      partitions: [
        partition({
          partitionType: 'TRAIN',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:01.000Z',
          to: '2026-01-01T00:00:02.000Z',
          observationIds: ['obs-1', 'obs-2'],
          spinIds: ['spin-1'],
        }),
      ],
    });

    expect(() =>
      makeDetector().detect({
        dataset,
        split,
        mode: 'BROKEN',
      }),
    ).toThrow(UnsupportedDatasetSplitValidationModeError);
  });

  it('marks the report as INCOMPLETE when integrity evidence is incomplete', () => {
    const dataset = datasetFixture();
    const split = splitFixture({
      sourceDatasetIdentity: dataset.identity,
      partitions: [
        partition({
          partitionType: 'TRAIN',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:01.000Z',
          to: '2026-01-01T00:00:02.000Z',
          observationIds: ['obs-1', 'obs-2'],
          spinIds: ['spin-1'],
        }),
        partition({
          partitionType: 'TEST',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:03.000Z',
          to: '2026-01-01T00:00:04.000Z',
          observationIds: ['obs-3', 'obs-4'],
          spinIds: ['spin-2', 'spin-3'],
        }),
      ],
    });

    const report = makeDetector().detect({ dataset, split, mode: DATASET_SPLIT_VALIDATION_MODE.STRUCTURAL });

    expect(report.status).toBe(DATASET_SPLIT_LEAKAGE_STATUS.INCOMPLETE);
    expect(report.hasIncompleteEvidence()).toBe(true);
    expect(report.findings).toHaveLength(0);
    expect(report.summary.integrityStatus).toBe(DATASET_INTEGRITY_STATUS.INCOMPLETE);
  });

  it('detects temporal leakage when an observation falls outside its partition period', () => {
    const dataset = datasetFixture();
    const split = splitFixture({
      sourceDatasetIdentity: dataset.identity,
      partitions: [
        partition({
          partitionType: 'TRAIN',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:01.000Z',
          to: '2026-01-01T00:00:02.000Z',
          observationIds: ['obs-1', 'obs-2'],
          spinIds: ['spin-1'],
        }),
        partition({
          partitionType: 'TEST',
          sourceDatasetIdentity: dataset.identity,
          from: '2026-01-01T00:00:04.000Z',
          to: '2026-01-01T00:00:04.000Z',
          observationIds: ['obs-3', 'obs-4'],
          spinIds: ['spin-2', 'spin-3'],
        }),
      ],
    });

    const report = makeDetector().detect({ dataset, split, mode: DATASET_SPLIT_VALIDATION_MODE.STRUCTURAL });

    expect(report.status).toBe(DATASET_SPLIT_LEAKAGE_STATUS.INVALID);
    expect(report.hasLeakage()).toBe(true);
    expect(report.getFindingsByType(DATASET_SPLIT_LEAKAGE_FINDING_TYPE.OBSERVATION_OUTSIDE_PARTITION_PERIOD)).toHaveLength(1);
    expect(report.statistics.temporalConflictCount).toBeGreaterThan(0);
  });

  it('sorts findings in the report payload by severity and type', () => {
    const report = createDatasetSplitLeakageReport({
      mode: DATASET_SPLIT_VALIDATION_MODE.FULL,
      status: DATASET_SPLIT_LEAKAGE_STATUS.INVALID,
      findings: [
        createDatasetSplitLeakageFinding({
          type: DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_OPERATIONAL_DRIFT,
          severity: DATASET_SPLIT_LEAKAGE_SEVERITY.WARNING,
          message: 'operational drift',
        }),
        createDatasetSplitLeakageFinding({
          type: DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_IDENTITY_MISMATCH,
          severity: DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          message: 'identity mismatch',
        }),
      ],
      summary: {},
      statistics: {},
      sourceDatasetIdentity: sourceIdentity,
      splitId: 'split-1',
    });

    const json = report.toJSON();
    expect(json.findings[0].severity).toBe(DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR);
    expect(json.findings[1].severity).toBe(DATASET_SPLIT_LEAKAGE_SEVERITY.WARNING);
  });
});
