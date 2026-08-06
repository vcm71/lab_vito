import { deepFreeze } from './immutable.js';
import { DATASET_SPLIT_LEAKAGE_STATUS, isDatasetSplitLeakageStatus } from './DatasetSplitLeakageStatus.js';
import { isDatasetSplitLeakageFinding, createDatasetSplitLeakageFinding } from './DatasetSplitLeakageFinding.js';

function cloneEntry(entry) {
  if (entry === null || typeof entry !== 'object') {
    return entry;
  }
  if (Array.isArray(entry)) {
    return deepFreeze(entry.map(cloneEntry));
  }
  const copy = {};
  for (const [key, value] of Object.entries(entry)) {
    copy[key] = cloneEntry(value);
  }
  return deepFreeze(copy);
}

function assertFinding(value) {
  if (!isDatasetSplitLeakageFinding(value)) {
    return createDatasetSplitLeakageFinding(value);
  }
  return createDatasetSplitLeakageFinding(value.toJSON());
}

function sortFindings(findings) {
  const severityRank = { ERROR: 0, WARNING: 1, INFO: 2 };
  return [...findings].sort((a, b) => {
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
}

export class DatasetSplitLeakageReport {
  constructor({
    mode,
    status,
    findings,
    summary,
    statistics,
    sourceDatasetIdentity = null,
    splitId = null,
    checkedAt = null,
  }) {
    this.mode = mode;
    this.status = status;
    this.findings = Object.freeze((Array.isArray(findings) ? findings : []).map(assertFinding));
    this.summary = cloneEntry(summary);
    this.statistics = cloneEntry(statistics);
    this.sourceDatasetIdentity = cloneEntry(sourceDatasetIdentity);
    this.splitId = splitId;
    this.checkedAt = checkedAt;

    if (!isDatasetSplitLeakageStatus(this.status)) {
      throw new TypeError(`Invalid DatasetSplitLeakageReport status: ${JSON.stringify(this.status)}`);
    }

    Object.freeze(this);
  }

  isValid() {
    return this.status === DATASET_SPLIT_LEAKAGE_STATUS.VALID;
  }

  hasLeakage() {
    return this.findings.some((finding) => finding.severity === 'ERROR');
  }

  hasIncompleteEvidence() {
    return this.status === DATASET_SPLIT_LEAKAGE_STATUS.INCOMPLETE;
  }

  getFindingsByType(type) {
    return this.findings.filter((finding) => finding.type === type);
  }

  getFindingsBySeverity(severity) {
    return this.findings.filter((finding) => finding.severity === severity);
  }

  toJSON() {
    return deepFreeze({
      mode: this.mode,
      status: this.status,
      findings: sortFindings(this.findings).map((finding) => finding.toJSON()),
      summary: cloneEntry(this.summary),
      statistics: cloneEntry(this.statistics),
      sourceDatasetIdentity: cloneEntry(this.sourceDatasetIdentity),
      splitId: this.splitId,
      checkedAt: this.checkedAt,
    });
  }
}

export function createDatasetSplitLeakageReport(payload) {
  return new DatasetSplitLeakageReport(payload);
}

export const DatasetSplitLeakageReportFactory = Object.freeze({
  create: createDatasetSplitLeakageReport,
  is: (value) => value instanceof DatasetSplitLeakageReport,
});
