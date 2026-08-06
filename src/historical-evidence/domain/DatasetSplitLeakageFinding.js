import { deepFreeze } from './immutable.js';
import { DATASET_SPLIT_LEAKAGE_FINDING_TYPE, isDatasetSplitLeakageFindingType } from './DatasetSplitLeakageFindingType.js';
import { DATASET_SPLIT_LEAKAGE_SEVERITY, isDatasetSplitLeakageSeverity } from './DatasetSplitLeakageSeverity.js';

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

function assertString(field, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`DatasetSplitLeakageFinding ${field} must be a non-empty string`);
  }
  return value;
}

function assertStringArray(field, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`DatasetSplitLeakageFinding ${field} must be an array of strings`);
  }
  const seen = new Set();
  const safe = [];
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new TypeError(`DatasetSplitLeakageFinding ${field} contains an invalid entry`);
    }
    if (seen.has(entry)) {
      continue;
    }
    seen.add(entry);
    safe.push(entry);
  }
  return deepFreeze(safe);
}

export function isDatasetSplitLeakageFinding(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isDatasetSplitLeakageFindingType(value.type) &&
    isDatasetSplitLeakageSeverity(value.severity) &&
    typeof value.message === 'string' &&
    Array.isArray(value.partitionTypes)
  );
}

export class DatasetSplitLeakageFinding {
  constructor({
    type,
    severity,
    message,
    partitionTypes = [],
    partitionType = null,
    spinId = null,
    observationId = null,
    expected = null,
    actual = null,
    details = null,
  }) {
    this.type = assertString('type', type);
    this.severity = assertString('severity', severity);
    this.message = assertString('message', message);
    this.partitionTypes = assertStringArray('partitionTypes', partitionTypes);
    this.partitionType = partitionType;
    this.spinId = spinId;
    this.observationId = observationId;
    this.expected = cloneEntry(expected);
    this.actual = cloneEntry(actual);
    this.details = cloneEntry(details);

    if (!isDatasetSplitLeakageFindingType(this.type)) {
      throw new TypeError(`Invalid DatasetSplitLeakageFinding type: ${JSON.stringify(this.type)}`);
    }
    if (!isDatasetSplitLeakageSeverity(this.severity)) {
      throw new TypeError(`Invalid DatasetSplitLeakageFinding severity: ${JSON.stringify(this.severity)}`);
    }

    Object.freeze(this);
  }

  toJSON() {
    return deepFreeze({
      type: this.type,
      severity: this.severity,
      message: this.message,
      partitionTypes: cloneEntry(this.partitionTypes),
      partitionType: this.partitionType,
      spinId: this.spinId,
      observationId: this.observationId,
      expected: cloneEntry(this.expected),
      actual: cloneEntry(this.actual),
      details: cloneEntry(this.details),
    });
  }
}

export function createDatasetSplitLeakageFinding(payload) {
  return new DatasetSplitLeakageFinding(payload);
}

export const DatasetSplitLeakageFindingFactory = Object.freeze({
  create: createDatasetSplitLeakageFinding,
  is: isDatasetSplitLeakageFinding,
  type: DATASET_SPLIT_LEAKAGE_FINDING_TYPE,
  severity: DATASET_SPLIT_LEAKAGE_SEVERITY,
});
