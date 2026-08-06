import { isDatasetDifferenceCategory } from './DatasetDifferenceCategory.js';
import { isDatasetDifferenceSeverity } from './DatasetDifferenceSeverity.js';

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function createDatasetDifference({
  differenceId,
  category,
  path,
  left = null,
  right = null,
  severity = 'ERROR',
  scientific = false,
  message,
}) {
  if (typeof differenceId !== 'string' || differenceId.length === 0) {
    throw new TypeError('differenceId must be a non-empty string.');
  }
  if (!isDatasetDifferenceCategory(category)) {
    throw new TypeError(`category must be a valid DatasetDifferenceCategory value (received ${JSON.stringify(category)}).`);
  }
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('path must be a non-empty string.');
  }
  if (!isDatasetDifferenceSeverity(severity)) {
    throw new TypeError(`severity must be a valid DatasetDifferenceSeverity value (received ${JSON.stringify(severity)}).`);
  }
  if (typeof scientific !== 'boolean') {
    throw new TypeError('scientific must be a boolean.');
  }
  if (typeof message !== 'string' || message.length === 0) {
    throw new TypeError('message must be a non-empty string.');
  }

  return {
    differenceId,
    category,
    path,
    left,
    right,
    severity,
    scientific,
    message,
  };
}

export class DatasetDifference {
  constructor(payload) {
    if (!isPlainObject(payload)) {
      throw new TypeError('DatasetDifference payload must be a plain object.');
    }
    Object.assign(this, createDatasetDifference(payload));
    return Object.freeze(this);
  }

  toJSON() {
    return { ...this };
  }
}

export const DatasetDifferenceFactory = Object.freeze({
  create: (payload) => new DatasetDifference(payload),
});
