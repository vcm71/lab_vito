import { LaboratoryMetric } from './LaboratoryMetric.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function serialize(value) {
  if (!value) return null;
  if (typeof value.toJSON === 'function') return value.toJSON();
  return { ...value };
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortObject(value));
}

function deepEqual(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function normalizeSnapshot(candidate, label) {
  if (!candidate || typeof candidate !== 'object') {
    throw new TypeError(`LaboratoryResultComparator: ${label} is required.`);
  }

  const snapshot = serialize(candidate);
  if (!snapshot || typeof snapshot !== 'object') {
    throw new TypeError(`LaboratoryResultComparator: ${label} could not be serialized.`);
  }

  return snapshot;
}

function diffObject(left, right) {
  const leftValue = left ?? {};
  const rightValue = right ?? {};
  const keys = new Set([...Object.keys(leftValue), ...Object.keys(rightValue)]);
  const entries = [];

  for (const key of [...keys].sort()) {
    const leftEntry = leftValue[key];
    const rightEntry = rightValue[key];
    if (deepEqual(leftEntry, rightEntry)) continue;
    entries.push(Object.freeze({
      key,
      left: serialize(leftEntry),
      right: serialize(rightEntry),
    }));
  }

  return Object.freeze(entries);
}

function normalizeDatasetSnapshot(dataset) {
  if (!dataset || typeof dataset !== 'object') return dataset;
  const { createdAt, ...rest } = dataset;
  return rest;
}

function compareMetrics(leftMetrics, rightMetrics) {
  const keys = new Set([...Object.keys(leftMetrics ?? {}), ...Object.keys(rightMetrics ?? {})]);
  const entries = [];

  for (const key of [...keys].sort()) {
    const left = leftMetrics?.[key];
    const right = rightMetrics?.[key];
    if (deepEqual(left, right)) continue;
    entries.push(Object.freeze({
      metricId: key,
      left: serialize(left),
      right: serialize(right),
    }));
  }

  return Object.freeze(entries);
}

export class LaboratoryResultComparator {
  constructor(options = {}) {
    this.comparatorId = options.comparatorId ?? options.id ?? 'laboratory-result-comparator';
    this.metrics = freezeList((options.metrics ?? []).map(metric => (
      metric instanceof LaboratoryMetric ? metric : new LaboratoryMetric(metric)
    )));
    this.metadata = freezeObject(options.metadata);
    Object.freeze(this);
  }

  compare(leftSessionResult, rightSessionResult, options = {}) {
    const left = normalizeSnapshot(leftSessionResult, 'leftSessionResult');
    const right = normalizeSnapshot(rightSessionResult, 'rightSessionResult');

    const datasetEqual = deepEqual(normalizeDatasetSnapshot(left.dataset), normalizeDatasetSnapshot(right.dataset));
    const parametersEqual = deepEqual(left.parameters, right.parameters);
    const configurationEqual = deepEqual(left.configuration, right.configuration);
    const metricsCompared = compareMetrics(left.metrics, right.metrics);
    const differences = Object.freeze({
      sessionId: left.sessionId === right.sessionId ? null : {
        left: left.sessionId ?? null,
        right: right.sessionId ?? null,
      },
      dataset: datasetEqual ? null : {
        left: serialize(left.dataset),
        right: serialize(right.dataset),
      },
      parameters: parametersEqual ? null : {
        left: serialize(left.parameters),
        right: serialize(right.parameters),
      },
      configuration: configurationEqual ? null : {
        left: serialize(left.configuration),
        right: serialize(right.configuration),
      },
      metrics: metricsCompared,
      results: Object.freeze([ ...diffObject(left.results ?? [], right.results ?? []) ]),
      metadata: Object.freeze([ ...diffObject(left.metadata ?? {}, right.metadata ?? {}) ]),
      status: left.status === right.status ? null : { left: left.status ?? null, right: right.status ?? null },
    });

    const equal =
      differences.sessionId === null
      && differences.dataset === null
      && differences.parameters === null
      && differences.configuration === null
      && differences.metrics.length === 0
      && differences.results.length === 0
      && differences.metadata.length === 0
      && differences.status === null;

    return Object.freeze({
      comparatorId: this.comparatorId,
      left,
      right,
      equal,
      differences,
      metadata: freezeObject({
        ...this.metadata,
        ...(options.metadata ?? {}),
      }),
    });
  }

  toJSON() {
    return {
      comparatorId: this.comparatorId,
      metrics: this.metrics.map(metric => metric.toJSON()),
      metadata: { ...this.metadata },
    };
  }
}

export function defineLaboratoryResultComparator(options = {}) {
  return new LaboratoryResultComparator(options);
}
