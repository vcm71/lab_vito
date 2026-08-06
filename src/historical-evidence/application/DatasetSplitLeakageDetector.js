import { compareIso } from '../domain/HistoricalCalibrationDataset.js';
import { isIsoTimestamp } from '../domain/DatasetAssemblyOptions.js';
import { isDatasetIdentity, datasetIdentitiesEqual, isDatasetIdentityScientificallyEquivalent, isDatasetIdentityOperationallyEquivalent } from '../domain/DatasetIdentity.js';
import { isSplitPeriod } from '../domain/SplitPeriod.js';
import { isDatasetPartition } from '../domain/DatasetPartition.js';
import { DATASET_INTEGRITY_STATUS } from '../domain/DatasetIntegrityStatus.js';
import { DatasetSplitLeakageFindingFactory } from '../domain/DatasetSplitLeakageFinding.js';
import { DATASET_SPLIT_LEAKAGE_FINDING_TYPE } from '../domain/DatasetSplitLeakageFindingType.js';
import { DATASET_SPLIT_LEAKAGE_SEVERITY } from '../domain/DatasetSplitLeakageSeverity.js';
import { DATASET_SPLIT_LEAKAGE_STATUS } from '../domain/DatasetSplitLeakageStatus.js';
import { createDatasetSplitLeakageReport } from '../domain/DatasetSplitLeakageReport.js';
import { IncompleteIntegrityVerificationError, InvalidDatasetSplitLeakageInputError, UnsupportedDatasetSplitValidationModeError, DatasetSplitLeakageDetectionError } from '../domain/errors.js';
import { INTEGRITY_VERIFICATION_MODE } from './IntegrityVerificationMode.js';
import { DatasetIntegrityVerifier } from './DatasetIntegrityVerifier.js';

export const DATASET_SPLIT_VALIDATION_MODE = Object.freeze({
  FULL: 'FULL',
  STRUCTURAL: 'STRUCTURAL',
});

export function isDatasetSplitValidationMode(value) {
  return Object.values(DATASET_SPLIT_VALIDATION_MODE).includes(value);
}

export function normalizeDatasetSplitValidationMode(value) {
  if (value === undefined || value === null) {
    return DATASET_SPLIT_VALIDATION_MODE.FULL;
  }
  if (!isDatasetSplitValidationMode(value)) {
    throw new UnsupportedDatasetSplitValidationModeError(value);
  }
  return value;
}

function asPlainObject(value, detail) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidDatasetSplitLeakageInputError(detail);
  }
  return value;
}

function identityFromDataset(dataset) {
  if (isDatasetIdentity(dataset.identity)) {
    return dataset.identity;
  }
  if (isDatasetIdentity(dataset)) {
    return dataset;
  }
  throw new InvalidDatasetSplitLeakageInputError('dataset.identity is required and must be a dataset identity');
}

function identityFromSplit(split) {
  const candidates = [split.sourceDatasetIdentity, split?.metadata?.sourceDatasetIdentity];
  for (const candidate of candidates) {
    if (isDatasetIdentity(candidate)) return candidate;
  }
  return null;
}

function getPartitionTypes(partitions) {
  return partitions.map((partition) => partition.partitionType).filter((value) => typeof value === 'string');
}

function cloneFinding(payload) {
  return DatasetSplitLeakageFindingFactory.create(payload);
}

function addFinding(findings, payload) {
  findings.push(cloneFinding(payload));
}

function countBySeverity(findings, severity) {
  return findings.filter((finding) => finding.severity === severity).length;
}

function countByType(findings, type) {
  return findings.filter((finding) => finding.type === type).length;
}

function safeIso(value) {
  return typeof value === 'string' && isIsoTimestamp(value) ? value : null;
}

function compareMaybeIso(a, b) {
  if (safeIso(a) === null || safeIso(b) === null) return null;
  return compareIso(a, b);
}

function observationLookup(dataset) {
  const map = new Map();
  const invalidObservations = [];
  for (const observation of Array.isArray(dataset.observations) ? dataset.observations : []) {
    if (observation === null || typeof observation !== 'object') {
      invalidObservations.push(observation);
      continue;
    }
    const observationId = typeof observation.observationId === 'string' ? observation.observationId : null;
    const spinId = typeof observation.spinId === 'string' ? observation.spinId : null;
    const predictionCreatedAt = safeIso(observation.predictionCreatedAt);
    if (observationId === null || spinId === null || predictionCreatedAt === null) {
      invalidObservations.push(observation);
      continue;
    }
    map.set(observationId, {
      observation,
      observationId,
      spinId,
      predictionCreatedAt,
    });
  }
  return { map, invalidObservations };
}

function buildFinding(type, severity, message, details = {}) {
  return {
    type,
    severity,
    message,
    partitionTypes: details.partitionTypes ?? [],
    partitionType: details.partitionType ?? null,
    spinId: details.spinId ?? null,
    observationId: details.observationId ?? null,
    expected: details.expected ?? null,
    actual: details.actual ?? null,
    details: details.details ?? null,
  };
}

function compareIdentityFields(sourceIdentity, splitIdentity) {
  const fields = ['datasetId', 'datasetVersion', 'schemaVersion', 'observationSchemaVersion', 'contentHash', 'manifestHash'];
  const differences = [];
  for (const field of fields) {
    if (sourceIdentity?.[field] !== splitIdentity?.[field]) {
      differences.push({ field, expected: sourceIdentity?.[field] ?? null, actual: splitIdentity?.[field] ?? null });
    }
  }
  return differences;
}

function validatePartitionPeriod(partition) {
  if (!isSplitPeriod(partition.period)) {
    return false;
  }
  return compareIso(partition.period.from, partition.period.to) <= 0;
}

function getTimeBounds(period) {
  return { from: period.from, to: period.to };
}

export class DatasetSplitLeakageDetector {
  constructor({ integrityVerifier = new DatasetIntegrityVerifier() } = {}) {
    this.integrityVerifier = integrityVerifier;
    Object.freeze(this);
  }

  detect({ dataset, split, mode = DATASET_SPLIT_VALIDATION_MODE.FULL, checkedAt = null } = {}) {
    const safeDataset = asPlainObject(dataset, 'dataset must be a plain object');
    const safeSplit = asPlainObject(split, 'split must be a plain object');
    const safeMode = normalizeDatasetSplitValidationMode(mode);
    const findings = [];
    const checksExecuted = [];

    const sourceIdentity = identityFromDataset(safeDataset);
    const splitIdentity = identityFromSplit(safeSplit);
    const splitSourceIdentity = splitIdentity ?? sourceIdentity;

    if (splitIdentity === null) {
      addFinding(
        findings,
        buildFinding(
          DATASET_SPLIT_LEAKAGE_FINDING_TYPE.INVALID_PARTITION,
          DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          'split source identity is missing or invalid',
          { details: { field: 'sourceDatasetIdentity' } },
        ),
      );
    }

    const partitionList = Array.isArray(safeSplit.partitions) ? safeSplit.partitions : null;
    if (!Array.isArray(partitionList) || partitionList.length === 0) {
      throw new InvalidDatasetSplitLeakageInputError('split.partitions must be a non-empty array');
    }

    checksExecuted.push('partition-structure');

    let integrityStatus = DATASET_INTEGRITY_STATUS.INCOMPLETE;
    if (safeMode === DATASET_SPLIT_VALIDATION_MODE.FULL && this.integrityVerifier?.verify) {
      checksExecuted.push('source-integrity');
      try {
        const integrityReport = this.integrityVerifier.verify({
          dataset: safeDataset,
          identity: sourceIdentity,
          descriptor: safeDataset.descriptor ?? null,
        }, { mode: INTEGRITY_VERIFICATION_MODE.FULL });
        integrityStatus = integrityReport.status;
        if (integrityReport.status === DATASET_INTEGRITY_STATUS.INVALID) {
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_INTEGRITY_INVALID,
              DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
              'source dataset integrity verification failed',
              {
                details: {
                  integrityStatus: integrityReport.status,
                  summary: integrityReport.summary ?? null,
                },
              },
            ),
          );
        } else if (integrityReport.status === DATASET_INTEGRITY_STATUS.INCOMPLETE) {
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_INTEGRITY_INCOMPLETE,
              DATASET_SPLIT_LEAKAGE_SEVERITY.WARNING,
              'source dataset integrity evidence is incomplete',
              {
                details: {
                  integrityStatus: integrityReport.status,
                  summary: integrityReport.summary ?? null,
                },
              },
            ),
          );
        }
      } catch (error) {
        if (error instanceof IncompleteIntegrityVerificationError) {
          integrityStatus = DATASET_INTEGRITY_STATUS.INCOMPLETE;
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_INTEGRITY_INCOMPLETE,
              DATASET_SPLIT_LEAKAGE_SEVERITY.WARNING,
              'source dataset integrity verification was incomplete',
              { details: { error: error.detail ?? error.message } },
            ),
          );
        } else {
          throw new DatasetSplitLeakageDetectionError(error?.message ?? 'dataset split leakage detection failed');
        }
      }
    }

    if (splitIdentity !== null && !datasetIdentitiesEqual(sourceIdentity, splitIdentity)) {
      const scientificallyEquivalent = isDatasetIdentityScientificallyEquivalent(sourceIdentity, splitIdentity);
      const operationallyEquivalent = isDatasetIdentityOperationallyEquivalent(sourceIdentity, splitIdentity);
      const differences = compareIdentityFields(sourceIdentity, splitIdentity);
      addFinding(
        findings,
        buildFinding(
          scientificallyEquivalent
            ? DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_OPERATIONAL_DRIFT
            : DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_IDENTITY_MISMATCH,
          scientificallyEquivalent ? DATASET_SPLIT_LEAKAGE_SEVERITY.WARNING : DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          scientificallyEquivalent
            ? 'source dataset identity diverges only at operational fields'
            : 'source dataset identity diverges scientifically from the dataset being analysed',
          {
            expected: sourceIdentity,
            actual: splitIdentity,
            details: {
              scientificallyEquivalent,
              operationallyEquivalent,
              differences,
            },
          },
        ),
      );
    }

    const partitions = [];
    const sourceObservationLookup = observationLookup(safeDataset);
    const sourceObservationIds = new Set(sourceObservationLookup.map.keys());
    const sourceSpinIds = new Set();
    for (const record of sourceObservationLookup.map.values()) {
      sourceSpinIds.add(record.spinId);
    }

    const seenPartitionTypes = new Set();
    const seenObservationIds = new Set();
    const seenSpinIds = new Set();
    const partitionObservationCoverage = new Set();
    const partitionSpinCoverage = new Set();
    const partitionByType = new Map();
    const spinAssignments = new Map();
    let partitionPeriodConflictCount = 0;
    let invalidPartitionCount = 0;

    for (const partition of partitionList) {
      if (!isDatasetPartition(partition)) {
        invalidPartitionCount += 1;
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.INVALID_PARTITION,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'partition is not a valid dataset partition',
            { details: { partition } },
          ),
        );
        continue;
      }

      partitions.push(partition);
      partitionByType.set(partition.partitionType, partition);

      if (seenPartitionTypes.has(partition.partitionType)) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.DUPLICATE_PARTITION_TYPE,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'partition type is duplicated across the split',
            { partitionType: partition.partitionType, partitionTypes: getPartitionTypes(partitionList) },
          ),
        );
      }
      seenPartitionTypes.add(partition.partitionType);

      if (!datasetIdentitiesEqual(partition.sourceDatasetIdentity, splitSourceIdentity)) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.PARTITION_SOURCE_IDENTITY_MISMATCH,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'partition source identity does not match the split source identity',
            {
              partitionType: partition.partitionType,
              expected: splitSourceIdentity,
              actual: partition.sourceDatasetIdentity,
            },
          ),
        );
      }

      if (!validatePartitionPeriod(partition)) {
        partitionPeriodConflictCount += 1;
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.INVALID_PERIOD,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'partition period is missing or invalid',
            { partitionType: partition.partitionType, actual: partition.period },
          ),
        );
      }

      if (partitions.length > 1) {
        const previous = partitions[partitions.length - 2];
        const comparison = compareMaybeIso(previous.period?.to, partition.period?.from);
        if (comparison !== null && comparison >= 0) {
          partitionPeriodConflictCount += 1;
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.PARTITION_PERIOD_OVERLAP,
              DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
              'partition periods overlap or share an inclusive boundary',
              {
                partitionTypes: [previous.partitionType, partition.partitionType],
                expected: { previousTo: previous.period?.to, currentFrom: partition.period?.from },
                actual: { previousPeriod: previous.period, currentPeriod: partition.period },
              },
            ),
          );
        }
      }

      const observationIds = Array.isArray(partition.observationIds) ? partition.observationIds : [];
      const spinIds = Array.isArray(partition.spinIds) ? partition.spinIds : [];

      for (const observationId of observationIds) {
        if (seenObservationIds.has(observationId)) {
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.DUPLICATE_PARTITION_OBSERVATION,
              DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
              'observationId is shared by more than one partition',
              {
                partitionType: partition.partitionType,
                observationId,
                partitionTypes: [partition.partitionType],
              },
            ),
          );
        }
        seenObservationIds.add(observationId);
        partitionObservationCoverage.add(observationId);
      }

      for (const spinId of spinIds) {
        if (seenSpinIds.has(spinId)) {
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.DUPLICATE_PARTITION_SPIN,
              DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
              'spinId is shared by more than one partition',
              {
                partitionType: partition.partitionType,
                spinId,
                partitionTypes: [partition.partitionType],
              },
            ),
          );
        }
        seenSpinIds.add(spinId);
        partitionSpinCoverage.add(spinId);
      }
    }

    const sourceObservationCount = sourceObservationIds.size;
    const sourceSpinCount = sourceSpinIds.size;
    const splitObservationCount = partitionObservationCoverage.size;
    const splitSpinCount = partitionSpinCoverage.size;

    if (typeof safeSplit.observationCount === 'number' && safeSplit.observationCount !== splitObservationCount) {
      addFinding(
        findings,
        buildFinding(
          DATASET_SPLIT_LEAKAGE_FINDING_TYPE.COUNT_MISMATCH,
          DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          'split observationCount does not match partition coverage',
          {
            expected: splitObservationCount,
            actual: safeSplit.observationCount,
            details: { countField: 'observationCount' },
          },
        ),
      );
    }

    if (typeof safeSplit.spinCount === 'number' && safeSplit.spinCount !== splitSpinCount) {
      addFinding(
        findings,
        buildFinding(
          DATASET_SPLIT_LEAKAGE_FINDING_TYPE.COUNT_MISMATCH,
          DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          'split spinCount does not match partition coverage',
          {
            expected: splitSpinCount,
            actual: safeSplit.spinCount,
            details: { countField: 'spinCount' },
          },
        ),
      );
    }

    if (typeof safeSplit.partitionCount === 'number' && safeSplit.partitionCount !== partitions.length) {
      addFinding(
        findings,
        buildFinding(
          DATASET_SPLIT_LEAKAGE_FINDING_TYPE.COUNT_MISMATCH,
          DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          'split partitionCount does not match valid partitions',
          {
            expected: partitions.length,
            actual: safeSplit.partitionCount,
            details: { countField: 'partitionCount' },
          },
        ),
      );
    }

    for (const sourceObservationId of sourceObservationIds) {
      if (!partitionObservationCoverage.has(sourceObservationId)) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.MISSING_SOURCE_OBSERVATION,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'source observation is not covered by any partition',
            { observationId: sourceObservationId },
          ),
        );
      }
    }

    for (const sourceSpinId of sourceSpinIds) {
      if (!partitionSpinCoverage.has(sourceSpinId)) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.MISSING_SOURCE_SPIN,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'source spin is not covered by any partition',
            { spinId: sourceSpinId },
          ),
        );
      }
    }

    for (const observationId of partitionObservationCoverage) {
      if (!sourceObservationIds.has(observationId)) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.UNEXPECTED_PARTITION_OBSERVATION,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'partition contains an observation that does not exist in the source dataset',
            { observationId },
          ),
        );
      }
    }

    for (const spinId of partitionSpinCoverage) {
      if (!sourceSpinIds.has(spinId)) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.UNEXPECTED_PARTITION_SPIN,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'partition contains a spin that does not exist in the source dataset',
            { spinId },
          ),
        );
      }
    }

    for (const partition of partitions) {
      if (!isSplitPeriod(partition.period)) {
        continue;
      }
      for (const observationId of Array.isArray(partition.observationIds) ? partition.observationIds : []) {
        const sourceObservation = sourceObservationLookup.map.get(observationId);
        if (!sourceObservation) continue;
        const timestamp = sourceObservation.predictionCreatedAt;
        if (!isIsoTimestamp(timestamp)) {
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_OBSERVATION_INVALID,
              DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
              'source observation is missing a valid predictionCreatedAt timestamp',
              { observationId, spinId: sourceObservation.spinId, partitionType: partition.partitionType },
            ),
          );
          continue;
        }
        if (compareIso(timestamp, partition.period.from) < 0 || compareIso(timestamp, partition.period.to) > 0) {
          addFinding(
            findings,
            buildFinding(
              DATASET_SPLIT_LEAKAGE_FINDING_TYPE.OBSERVATION_OUTSIDE_PARTITION_PERIOD,
              DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
              'observation timestamp falls outside the partition period',
              {
                partitionType: partition.partitionType,
                observationId,
                spinId: sourceObservation.spinId,
                expected: getTimeBounds(partition.period),
                actual: { predictionCreatedAt: timestamp },
              },
            ),
          );
        }
      }
    }

    for (const [spinId, entries] of new Map(
      [...sourceObservationLookup.map.values()].reduce((acc, record) => {
        if (!acc.has(record.spinId)) acc.set(record.spinId, []);
        acc.get(record.spinId).push(record);
        return acc;
      }, new Map()),
    ).entries()) {
      const partitionsForSpin = new Set();
      for (const record of entries) {
        for (const partition of partitions) {
          if (Array.isArray(partition.observationIds) && partition.observationIds.includes(record.observationId)) {
            partitionsForSpin.add(partition.partitionType);
          }
        }
      }
      if (partitionsForSpin.size > 1) {
        addFinding(
          findings,
          buildFinding(
            DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SPIN_TIMESTAMP_CONFLICT,
            DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
            'spin observations are split across multiple partition periods',
            {
              spinId,
              partitionTypes: [...partitionsForSpin],
              details: {
                observationIds: entries.map((entry) => entry.observationId),
                timestamps: entries.map((entry) => entry.predictionCreatedAt),
              },
            },
          ),
        );
      }
    }

    if (sourceObservationLookup.invalidObservations.length > 0) {
      addFinding(
        findings,
        buildFinding(
          DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_OBSERVATION_INVALID,
          DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR,
          'source dataset contains observations that cannot be analysed deterministically',
          {
            details: { invalidObservationCount: sourceObservationLookup.invalidObservations.length },
          },
        ),
      );
    }

    const sortedFindings = findings.sort((a, b) => {
      const severityRank = { ERROR: 0, WARNING: 1, INFO: 2 };
      const severityDiff = severityRank[a.severity] - severityRank[b.severity];
      if (severityDiff !== 0) return severityDiff;
      const typeDiff = a.type.localeCompare(b.type);
      if (typeDiff !== 0) return typeDiff;
      const partitionTypeDiff = String(a.partitionType ?? '').localeCompare(String(b.partitionType ?? ''));
      if (partitionTypeDiff !== 0) return partitionTypeDiff;
      const spinIdDiff = String(a.spinId ?? '').localeCompare(String(b.spinId ?? ''));
      if (spinIdDiff !== 0) return spinIdDiff;
      return String(a.observationId ?? '').localeCompare(String(b.observationId ?? ''));
    });

    const hasErrorFindings = sortedFindings.some((finding) => finding.severity === DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR);
    const hasIntegrityBlocker = integrityStatus !== DATASET_INTEGRITY_STATUS.VALID;
    const status = hasErrorFindings
      ? DATASET_SPLIT_LEAKAGE_STATUS.INVALID
      : hasIntegrityBlocker
        ? DATASET_SPLIT_LEAKAGE_STATUS.INCOMPLETE
        : DATASET_SPLIT_LEAKAGE_STATUS.VALID;

    const summary = {
      checksExecuted,
      evidenceSufficient: integrityStatus === DATASET_INTEGRITY_STATUS.VALID,
      integrityStatus,
      sourceIdentityMatches: splitIdentity !== null ? datasetIdentitiesEqual(sourceIdentity, splitIdentity) : false,
      scientificallyEquivalent: splitIdentity !== null ? isDatasetIdentityScientificallyEquivalent(sourceIdentity, splitIdentity) : false,
      operationallyEquivalent: splitIdentity !== null ? isDatasetIdentityOperationallyEquivalent(sourceIdentity, splitIdentity) : false,
      sourceObservationCount,
      sourceSpinCount,
      splitObservationCount,
      splitSpinCount,
      partitionCount: partitions.length,
      invalidPartitionCount,
      leakageFindingCount: countBySeverity(sortedFindings, DATASET_SPLIT_LEAKAGE_SEVERITY.ERROR),
      warningFindingCount: countBySeverity(sortedFindings, DATASET_SPLIT_LEAKAGE_SEVERITY.WARNING),
      infoFindingCount: countBySeverity(sortedFindings, DATASET_SPLIT_LEAKAGE_SEVERITY.INFO),
    };

    const statistics = {
      totalFindings: sortedFindings.length,
      sourceObservationCount,
      sourceSpinCount,
      coveredObservationCount: splitObservationCount,
      coveredSpinCount: splitSpinCount,
      missingObservationCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.MISSING_SOURCE_OBSERVATION),
      missingSpinCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.MISSING_SOURCE_SPIN),
      unexpectedObservationCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.UNEXPECTED_PARTITION_OBSERVATION),
      unexpectedSpinCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.UNEXPECTED_PARTITION_SPIN),
      temporalConflictCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.OBSERVATION_OUTSIDE_PARTITION_PERIOD) +
        countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SPIN_TIMESTAMP_CONFLICT) +
        partitionPeriodConflictCount,
      duplicateObservationCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.DUPLICATE_PARTITION_OBSERVATION),
      duplicateSpinCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.DUPLICATE_PARTITION_SPIN),
      duplicatePartitionTypeCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.DUPLICATE_PARTITION_TYPE),
      countMismatchCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.COUNT_MISMATCH),
      identityMismatchCount: countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_IDENTITY_MISMATCH) +
        countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_OPERATIONAL_DRIFT) +
        countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.PARTITION_SOURCE_IDENTITY_MISMATCH),
      integrityFindingCount:
        countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_INTEGRITY_INVALID) +
        countByType(sortedFindings, DATASET_SPLIT_LEAKAGE_FINDING_TYPE.SOURCE_DATASET_INTEGRITY_INCOMPLETE),
    };

    return createDatasetSplitLeakageReport({
      mode: safeMode,
      status,
      findings: sortedFindings,
      summary,
      statistics,
      sourceDatasetIdentity: sourceIdentity,
      splitId: safeSplit?.metadata?.splitId ?? safeSplit.splitId ?? null,
      checkedAt,
    });
  }
}

export const DATASET_SPLIT_LEAKAGE_DETECTOR = Object.freeze({
  create: (options) => new DatasetSplitLeakageDetector(options),
});
