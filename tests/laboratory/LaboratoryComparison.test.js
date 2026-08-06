import { describe, expect, it } from 'vitest';
import {
  LaboratoryComparisonBuilder,
  LaboratoryDataset,
  LaboratoryDecisionLayer,
  LaboratoryEvidenceReport,
  LaboratoryMetric,
  LaboratoryMetricAggregator,
  LaboratoryResultComparator,
} from '../../src/laboratory/index.js';

function createSessionResult({ sessionId, moduleId, datasetVersion, configuration, parameters, metrics, results }) {
  return {
    sessionId,
    moduleId,
    status: 'COMPLETED',
    dataset: new LaboratoryDataset({
      id: `${sessionId}-dataset`,
      datasetVersion,
      records: [{ sessionId, moduleId }],
      metadata: { source: 'unit-test' },
    }),
    configuration,
    parameters,
    metrics,
    results,
    metadata: {
      moduleId,
      source: 'unit-test',
    },
    toJSON() {
      return {
        sessionId: this.sessionId,
        moduleId: this.moduleId,
        status: this.status,
        dataset: this.dataset.toJSON(),
        configuration: this.configuration,
        parameters: this.parameters,
        metrics: this.metrics,
        results: this.results,
        metadata: this.metadata,
      };
    },
  };
}

describe('Laboratory comparison framework', () => {
  it('compares session results, criteria, metrics, and differences', () => {
    const left = createSessionResult({
      sessionId: 'session-a',
      moduleId: 'lab.con',
      datasetVersion: '2026.08-a',
      configuration: { mode: 'alpha' },
      parameters: { seed: 1 },
      metrics: { pci: 12, score: 3 },
      results: [{ outcome: 'baseline' }],
    });
    const right = createSessionResult({
      sessionId: 'session-b',
      moduleId: 'lab.con1',
      datasetVersion: '2026.08-b',
      configuration: { mode: 'beta' },
      parameters: { seed: 2 },
      metrics: { pci: 15, score: 4 },
      results: [{ outcome: 'candidate' }],
    });

    const builder = new LaboratoryComparisonBuilder({
      metrics: [
        new LaboratoryMetric({
          id: 'difference-count',
          name: 'Difference Count',
          compute: comparison => Object.values(comparison.differences).filter(Boolean).length,
        }),
      ],
    });

    const comparison = builder.build({
      leftSessionResult: left,
      rightSessionResult: right,
      criteria: ['dataset', 'configuration', 'parameters', 'metrics', 'results'],
    });

    expect(Object.isFrozen(comparison)).toBe(true);
    expect(comparison.comparisonId).toBe('session-a__vs__session-b');
    expect(comparison.sessions).toHaveLength(2);
    expect(comparison.criteria[0]).toEqual({ criterion: 'dataset', satisfied: false });
    expect(comparison.metrics.comparator.equal).toBe(false);
    expect(comparison.metrics.aggregate.values['difference-count']).toBeGreaterThan(0);
    expect(comparison.conclusions[0]).toMatchObject({ type: 'difference' });
    expect(comparison.differences.dataset.left.datasetVersion).toBe('2026.08-a');
    expect(comparison.differences.dataset.right.datasetVersion).toBe('2026.08-b');
  });

  it('aggregates metrics and detects equal comparisons', () => {
    const left = createSessionResult({
      sessionId: 'session-c',
      moduleId: 'lab.same',
      datasetVersion: '2026.08',
      configuration: { mode: 'steady' },
      parameters: { seed: 7 },
      metrics: { pci: 21 },
      results: [{ outcome: 'identical' }],
    });
    const right = createSessionResult({
      sessionId: 'session-c',
      moduleId: 'lab.same',
      datasetVersion: '2026.08',
      configuration: { mode: 'steady' },
      parameters: { seed: 7 },
      metrics: { pci: 21 },
      results: [{ outcome: 'identical' }],
    });

    const comparator = new LaboratoryResultComparator();
    const comparison = comparator.compare(left, right);
    const aggregator = new LaboratoryMetricAggregator({
      metrics: [
        { id: 'equal-flag', name: 'Equal Flag', compute: result => (result.equal ? 1 : 0) },
      ],
    });

    expect(comparison.equal).toBe(true);
    expect(comparison.differences.metrics).toHaveLength(0);
    expect(aggregator.aggregate(comparison).values['equal-flag']).toBe(1);
  });

  it('packages comparisons into an evidence report and a decision layer', () => {
    const left = createSessionResult({
      sessionId: 'session-d',
      moduleId: 'lab.left',
      datasetVersion: '2026.08-d',
      configuration: { mode: 'report' },
      parameters: { seed: 11 },
      metrics: { pci: 34 },
      results: [{ outcome: 'left' }],
    });
    const right = createSessionResult({
      sessionId: 'session-e',
      moduleId: 'lab.right',
      datasetVersion: '2026.08-e',
      configuration: { mode: 'report' },
      parameters: { seed: 12 },
      metrics: { pci: 35 },
      results: [{ outcome: 'right' }],
    });

    const comparison = new LaboratoryComparisonBuilder().build({
      leftSessionResult: left,
      rightSessionResult: right,
    });
    const decisionLayer = new LaboratoryDecisionLayer({ layerId: 'layer-1' });
    const decision = decisionLayer.decide({ type: 'evidence-review', label: 'Review evidence' }, { comparisonId: comparison.comparisonId });
    const report = new LaboratoryEvidenceReport({
      reportId: 'report-1',
      title: 'Comparison evidence report',
      comparisons: [comparison],
      sessions: [left, right],
      results: [comparison.metrics.comparator, comparison.metrics.aggregate],
      differences: comparison.differences,
      metrics: comparison.metrics,
      traceability: { comparisonId: comparison.comparisonId },
      reproducibility: { deterministic: true },
      observations: ['Inputs are comparable and traceable.'],
      metadata: { owner: 'qa' },
      timestamps: { generatedAt: '2026-08-03T00:00:00.000Z' },
    });

    expect(decision.type).toBe('evidence-review');
    expect(decision.metadata.layerId).toBe('layer-1');
    expect(report.comparisons).toHaveLength(1);
    expect(report.traceability.comparisonId).toBe(comparison.comparisonId);
    expect(report.reproducibility.deterministic).toBe(true);
    expect(report.toJSON().observations).toEqual(['Inputs are comparable and traceable.']);
  });
});
