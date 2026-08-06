import { deepFreeze } from './immutable.js';
import { DATASET_INTEGRITY_STATUS, isDatasetIntegrityStatus } from './DatasetIntegrityStatus.js';

function assertCheckShape(check) {
  if (check === null || typeof check !== 'object' || Array.isArray(check)) {
    throw new TypeError('DatasetIntegrityReport checks must be plain objects');
  }
  for (const key of ['checkId', 'category', 'status', 'message', 'path', 'severity']) {
    if (typeof check[key] !== 'string' || check[key].length === 0) {
      throw new TypeError(`DatasetIntegrityReport check.${key} must be a non-empty string`);
    }
  }
  return deepFreeze({ ...check });
}

function cloneEntry(entry) {
  if (entry === null || typeof entry !== 'object') return entry;
  if (Array.isArray(entry)) return deepFreeze(entry.map(cloneEntry));
  const copy = {};
  for (const [key, value] of Object.entries(entry)) {
    copy[key] = cloneEntry(value);
  }
  return deepFreeze(copy);
}

export class DatasetIntegrityReport {
  constructor({
    mode,
    status,
    checks,
    summary,
    datasetId = null,
    identity = null,
    descriptor = null,
    generatedAt = null,
    errors = null,
    warnings = null,
  }) {
    this.mode = mode;
    this.status = status;
    this.datasetId = datasetId;
    this.identity = identity;
    this.descriptor = descriptor;
    this.generatedAt = generatedAt;

    this.checks = Array.isArray(checks) ? checks.map(assertCheckShape) : [];
    this.summary = cloneEntry(summary);
    this.errors = Array.isArray(errors)
      ? errors.map((entry) => cloneEntry(entry))
      : this.checks.filter((check) => check.status === 'FAIL').map((check) => cloneEntry(check));
    this.warnings = Array.isArray(warnings)
      ? warnings.map((entry) => cloneEntry(entry))
      : this.checks.filter((check) => check.status !== 'PASS').map((check) => cloneEntry(check));

    if (!isDatasetIntegrityStatus(this.status)) {
      throw new TypeError(`Invalid DatasetIntegrityReport status: ${JSON.stringify(this.status)}`);
    }

    Object.freeze(this);
  }

  isValid() {
    return this.status === DATASET_INTEGRITY_STATUS.VALID;
  }

  hasFailures() {
    return this.checks.some((check) => check.status === 'FAIL');
  }

  getFailures() {
    return this.checks.filter((check) => check.status === 'FAIL');
  }

  getWarnings() {
    return this.warnings;
  }

  getCheck(checkId) {
    return this.checks.find((check) => check.checkId === checkId) ?? null;
  }

  toJSON() {
    return deepFreeze({
      mode: this.mode,
      status: this.status,
      datasetId: this.datasetId,
      identity: cloneEntry(this.identity),
      descriptor: cloneEntry(this.descriptor),
      generatedAt: this.generatedAt,
      summary: cloneEntry(this.summary),
      checks: this.checks.map((check) => cloneEntry(check)),
      errors: this.errors.map((entry) => cloneEntry(entry)),
      warnings: this.warnings.map((entry) => cloneEntry(entry)),
    });
  }
}

export function createDatasetIntegrityReport(payload) {
  return new DatasetIntegrityReport(payload);
}
