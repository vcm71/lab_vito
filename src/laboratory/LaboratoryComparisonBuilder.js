import { LaboratoryComparison } from './LaboratoryComparison.js';
import { LaboratoryDecisionLayer } from './LaboratoryDecisionLayer.js';
import { LaboratoryMetricAggregator } from './LaboratoryMetricAggregator.js';
import { LaboratoryResultComparator } from './LaboratoryResultComparator.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function normalizeSessionResult(sessionResult, label) {
  if (!sessionResult || typeof sessionResult !== 'object') {
    throw new TypeError(`LaboratoryComparisonBuilder: ${label} is required.`);
  }

  if (typeof sessionResult.toJSON === 'function') {
    return sessionResult.toJSON();
  }

  return { ...sessionResult };
}

function normalizeCriteria(criteria) {
  if (criteria === undefined || criteria === null) {
    return freezeList(['dataset', 'configuration', 'parameters', 'metrics', 'results', 'metadata']);
  }

  if (typeof criteria === 'string') {
    return freezeList([criteria]);
  }

  if (!Array.isArray(criteria)) {
    throw new TypeError('LaboratoryComparisonBuilder: criteria must be a string or array.');
  }

  return freezeList(criteria.filter(Boolean));
}

export class LaboratoryComparisonBuilder {
  constructor(options = {}) {
    this.comparator = options.comparator ?? new LaboratoryResultComparator({ metrics: options.metrics ?? [] });
    this.metricAggregator = options.metricAggregator ?? new LaboratoryMetricAggregator({ metrics: options.metrics ?? [] });
    this.decisionLayer = options.decisionLayer ?? new LaboratoryDecisionLayer(options.decisionLayerOptions ?? {});
    this.metadata = freezeObject(options.metadata);
    Object.freeze(this);
  }

  validateSessions(leftSessionResult, rightSessionResult) {
    const left = normalizeSessionResult(leftSessionResult, 'leftSessionResult');
    const right = normalizeSessionResult(rightSessionResult, 'rightSessionResult');

    if (!left.sessionId || !right.sessionId) {
      throw new TypeError('LaboratoryComparisonBuilder: both session results must include a sessionId.');
    }

    return { left, right };
  }

  validateCompatibility(leftSessionResult, rightSessionResult) {
    const { left, right } = this.validateSessions(leftSessionResult, rightSessionResult);

    if (left.dataset === undefined || right.dataset === undefined) {
      throw new TypeError('LaboratoryComparisonBuilder: both session results must include a dataset field.');
    }

    return { left, right };
  }

  prepareCriteria(criteria, comparison) {
    const normalizedCriteria = normalizeCriteria(criteria);
    return normalizedCriteria.map(entry => ({
      criterion: entry,
      satisfied: comparison.differences[entry] === null || comparison.differences[entry]?.length === 0,
    }));
  }

  build(options = {}) {
    const { left, right } = this.validateCompatibility(
      options.leftSessionResult ?? options.left,
      options.rightSessionResult ?? options.right,
    );

    const comparisonId = options.comparisonId ?? options.id ?? `${left.sessionId}__vs__${right.sessionId}`;
    const comparatorResult = this.comparator.compare(left, right, { metadata: options.metadata });
    const criteria = normalizeCriteria(options.criteria);
    const metricSummary = this.metricAggregator.aggregate(comparatorResult, {
      metadata: options.metadata,
      metrics: options.metrics,
      source: { leftSessionId: left.sessionId, rightSessionId: right.sessionId },
    });
    const criteriaState = this.prepareCriteria(criteria, comparatorResult);
    const decision = this.decisionLayer.decide(
      comparatorResult.equal
        ? { type: 'tie', label: 'Equivalent comparison', rationale: 'The selected session results are equal under the chosen criteria.' }
        : { type: 'difference', label: 'Difference detected', rationale: 'One or more comparison criteria diverged.' },
      { comparisonId, criteria: criteriaState },
    );

    return new LaboratoryComparison({
      comparisonId,
      leftSession: left,
      rightSession: right,
      sessions: [left, right],
      criteria: criteriaState,
      metrics: {
        comparator: comparatorResult,
        aggregate: metricSummary,
        decision,
      },
      differences: comparatorResult.differences,
      conclusions: [decision],
      metadata: {
        ...this.metadata,
        ...(options.metadata ?? {}),
      },
      timestamps: freezeObject({
        comparedAt: options.comparedAt ?? new Date().toISOString(),
        ...(options.timestamps ?? {}),
      }),
      comparisonType: options.comparisonType ?? 'session-result',
    });
  }
}

export function defineLaboratoryComparisonBuilder(options = {}) {
  return new LaboratoryComparisonBuilder(options);
}
