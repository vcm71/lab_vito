import { deepFreeze } from './immutable.js';
import { isDatasetComparisonClassification } from './DatasetComparisonClassification.js';

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function cloneValue(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }
  if (isPlainObject(value)) {
    return { ...value };
  }
  return value;
}

export function createDatasetComparisonReport({
  mode,
  classification,
  comparable,
  scientificallyEquivalent,
  operationallyEquivalent,
  exactMatch,
  compatible,
  differences = [],
  summary = {},
  leftIntegrity = null,
  rightIntegrity = null,
  scientificEvaluated = true,
  operationalEvaluated = true,
  integrityComparable = true,
  reason = null,
}) {
  if (typeof mode !== 'string' || mode.length === 0) {
    throw new TypeError('mode must be a non-empty string.');
  }
  if (!isDatasetComparisonClassification(classification)) {
    throw new TypeError(`classification must be a valid DatasetComparisonClassification value (received ${JSON.stringify(classification)}).`);
  }
  for (const [name, value] of [
    ['comparable', comparable],
    ['scientificallyEquivalent', scientificallyEquivalent],
    ['operationallyEquivalent', operationallyEquivalent],
    ['exactMatch', exactMatch],
    ['compatible', compatible],
    ['scientificEvaluated', scientificEvaluated],
    ['operationalEvaluated', operationalEvaluated],
    ['integrityComparable', integrityComparable],
  ]) {
    if (typeof value !== 'boolean') {
      throw new TypeError(`${name} must be a boolean.`);
    }
  }
  if (!Array.isArray(differences)) {
    throw new TypeError('differences must be an array.');
  }
  if (!isPlainObject(summary)) {
    throw new TypeError('summary must be a plain object.');
  }
  if (reason !== null && typeof reason !== 'string') {
    throw new TypeError('reason must be a string or null.');
  }

  const frozenDifferences = differences.map(cloneValue);
  const frozenSummary = { ...summary };

  return {
    mode,
    classification,
    comparable,
    scientificallyEquivalent,
    operationallyEquivalent,
    exactMatch,
    compatible,
    differences: frozenDifferences,
    summary: frozenSummary,
    leftIntegrity: cloneValue(leftIntegrity),
    rightIntegrity: cloneValue(rightIntegrity),
    scientificEvaluated,
    operationalEvaluated,
    integrityComparable,
    reason,
  };
}

export class DatasetComparisonReport {
  constructor(payload) {
    if (!isPlainObject(payload)) {
      throw new TypeError('DatasetComparisonReport payload must be a plain object.');
    }
    Object.assign(this, createDatasetComparisonReport(payload));
    return Object.freeze(this);
  }

  isExactMatch() {
    return this.classification === 'EXACT_MATCH';
  }

  isScientificallyEquivalent() {
    return this.classification === 'SCIENTIFICALLY_EQUIVALENT';
  }

  isOperationallyEquivalent() {
    return this.classification === 'OPERATIONALLY_EQUIVALENT';
  }

  isCompatible() {
    return [
      'EXACT_MATCH',
      'SCIENTIFICALLY_EQUIVALENT',
      'OPERATIONALLY_EQUIVALENT',
      'COMPATIBLE_EVOLUTION',
    ].includes(this.classification);
  }

  getScientificDifferences() {
    return this.differences.filter((difference) => difference.scientific === true);
  }

  getOperationalDifferences() {
    return this.differences.filter((difference) => difference.scientific !== true);
  }

  getDifference(category) {
    return this.differences.find((difference) => difference.category === category) ?? null;
  }

  toJSON() {
    return { ...this, differences: this.differences.map((difference) => (typeof difference.toJSON === 'function' ? difference.toJSON() : { ...difference })), summary: { ...this.summary } };
  }
}

export const DatasetComparisonReportFactory = Object.freeze({
  create: (payload) => new DatasetComparisonReport(payload),
});
