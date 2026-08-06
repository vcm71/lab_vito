/**
 * SplitPeriod — inclusive temporal window for a split partition.
 *
 * The period is defined by canonical ISO 8601 UTC timestamps and is kept
 * deeply immutable. This phase only validates the structural contract; the
 * actual splitting algorithm is deferred to later phases.
 */

import { compareIso } from './HistoricalCalibrationDataset.js';
import { isIsoTimestamp } from './DatasetAssemblyOptions.js';
import { deepFreeze } from './immutable.js';
import { InvalidSplitPeriodError } from './errors.js';

export function isSplitPeriod(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.from === 'string' &&
    typeof value.to === 'string' &&
    isIsoTimestamp(value.from) &&
    isIsoTimestamp(value.to)
  );
}

function assertIsoTimestamp(field, value) {
  if (typeof value !== 'string' || !isIsoTimestamp(value)) {
    throw new InvalidSplitPeriodError(`invalid ${field}: ${JSON.stringify(value)}`);
  }
  return value;
}

export function createSplitPeriod({ from, to }) {
  const safeFrom = assertIsoTimestamp('from', from);
  const safeTo = assertIsoTimestamp('to', to);

  if (compareIso(safeFrom, safeTo) > 0) {
    throw new InvalidSplitPeriodError(
      `period is inverted: from ${JSON.stringify(safeFrom)} is after to ${JSON.stringify(safeTo)}`,
    );
  }

  return deepFreeze({ from: safeFrom, to: safeTo });
}

export function splitPeriodToJSON(period) {
  if (!isSplitPeriod(period)) {
    throw new InvalidSplitPeriodError('expected a valid SplitPeriod');
  }
  return { from: period.from, to: period.to };
}

export function splitPeriodsEqual(a, b) {
  return isSplitPeriod(a) && isSplitPeriod(b) && a.from === b.from && a.to === b.to;
}

export const SplitPeriod = Object.freeze({
  create: createSplitPeriod,
  equals: splitPeriodsEqual,
  toJSON: splitPeriodToJSON,
});
