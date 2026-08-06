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

export class LaboratoryMetricAggregator {
  constructor(options = {}) {
    this.aggregatorId = options.aggregatorId ?? options.id ?? 'laboratory-metric-aggregator';
    this.metrics = freezeList((options.metrics ?? []).map(metric => (
      metric instanceof LaboratoryMetric ? metric : new LaboratoryMetric(metric)
    )));
    this.metadata = freezeObject(options.metadata);
    Object.freeze(this);
  }

  aggregate(input, options = {}) {
    const source = options.source ?? input ?? null;
    const metrics = options.metrics
      ? freezeList(options.metrics.map(metric => (metric instanceof LaboratoryMetric ? metric : new LaboratoryMetric(metric))))
      : this.metrics;

    const values = {};
    for (const metric of metrics) {
      values[metric.id] = metric.compute(input, {
        source,
        metadata: { ...this.metadata, ...(options.metadata ?? {}) },
      });
    }

    return Object.freeze({
      aggregatorId: this.aggregatorId,
      source: serialize(source),
      values: freezeObject(values),
      metrics: metrics.map(metric => metric.toJSON()),
      metadata: freezeObject({
        ...this.metadata,
        ...(options.metadata ?? {}),
      }),
    });
  }

  merge(...aggregates) {
    const merged = {};
    for (const aggregate of aggregates.flat()) {
      if (!aggregate || typeof aggregate !== 'object') continue;
      Object.assign(merged, aggregate.values ?? aggregate);
    }

    return Object.freeze({
      aggregatorId: this.aggregatorId,
      values: freezeObject(merged),
      metadata: { ...this.metadata },
    });
  }

  toJSON() {
    return {
      aggregatorId: this.aggregatorId,
      metrics: this.metrics.map(metric => metric.toJSON()),
      metadata: { ...this.metadata },
    };
  }
}

export function defineLaboratoryMetricAggregator(options = {}) {
  return new LaboratoryMetricAggregator(options);
}
