import { describe, expect, it } from 'vitest';
import {
  LaboratoryComparison,
  LaboratoryEvidenceReport,
  LaboratoryExperiment,
  LaboratoryExperimentBuilder,
  LaboratoryExperimentLifecycle,
  LaboratorySession,
  LaboratorySessionLifecycle,
  LaboratoryWorkspace,
  LaboratoryWorkspaceBuilder,
  LaboratoryWorkspaceCatalog,
} from '../../src/laboratory/index.js';

function createSession(sessionId, datasetId) {
  return new LaboratorySession({
    sessionId,
    dataset: {
      id: datasetId,
      records: [{ sessionId }],
      metadata: { source: 'unit-test' },
    },
    modules: ['lab.con'],
    executionPlan: [{ id: 'step-1', mode: 'sequential', moduleIds: ['lab.con'], metadata: {}, parameters: {} }],
    parameters: { seed: 1 },
    configuration: { mode: 'test' },
    metadata: { source: 'unit-test' },
    timestamps: { createdAt: '2026-08-03T00:00:00.000Z', readyAt: '2026-08-03T00:00:00.000Z' },
    status: 'READY',
    lifecycle: new LaboratorySessionLifecycle({ status: 'READY', timestamps: { createdAt: '2026-08-03T00:00:00.000Z', readyAt: '2026-08-03T00:00:00.000Z' } }),
  });
}

function createComparison(sessionA, sessionB) {
  return new LaboratoryComparison({
    comparisonId: `${sessionA.sessionId}__vs__${sessionB.sessionId}`,
    leftSession: sessionA,
    rightSession: sessionB,
    sessions: [sessionA, sessionB],
    criteria: ['dataset', 'configuration'],
    metrics: { comparator: { equal: false }, aggregate: { values: { 'difference-count': 1 } } },
    differences: { dataset: { left: sessionA.dataset.toJSON(), right: sessionB.dataset.toJSON() }, configuration: [{ key: 'mode' }] },
    conclusions: [{ type: 'difference' }],
    metadata: { source: 'unit-test' },
    timestamps: { comparedAt: '2026-08-03T00:00:00.000Z' },
  });
}

describe('Laboratory workspace and experiment orchestration', () => {
  it('builds immutable experiment aggregates and validates consistency', () => {
    const builder = new LaboratoryExperimentBuilder({
      provenance: {
        runnerVersion: 'test-runner/1.0.0',
        source: 'reports/Fase6.B.6B.md',
      },
    });
    const sessionA = createSession('session-a', 'dataset-a');
    const sessionB = createSession('session-b', 'dataset-b');
    const comparison = createComparison(sessionA, sessionB);
    const evidence = new LaboratoryEvidenceReport({
      reportId: 'report-1',
      title: 'Evidence report',
      comparisons: [comparison],
      sessions: [sessionA, sessionB],
      results: [comparison.metrics],
      differences: comparison.differences,
      metrics: comparison.metrics,
      traceability: { comparisonId: comparison.comparisonId },
      reproducibility: { deterministic: true },
      observations: ['traceable comparison'],
      metadata: { owner: 'qa' },
      timestamps: { generatedAt: '2026-08-03T00:00:00.000Z' },
    });

    const experiment = builder.build({
      experimentId: 'experiment-1',
      workspaceId: 'workspace-1',
      hypothesis: 'Workspace should aggregate laboratory evidence.',
      objective: 'Track sessions, comparisons, and evidence.',
      metadata: { owner: 'qa' },
      provenance: { origin: 'reports/Fase6.B.6B.md', runnerVersion: 'test-runner/1.0.0' },
    });

    const withSession = builder.withSession(experiment, sessionA);
    const withComparison = builder.withComparison(withSession, comparison);
    const withEvidence = builder.withEvidence(withComparison, evidence);

    expect(Object.isFrozen(withEvidence)).toBe(true);
    expect(withEvidence.status).toBe('READY');
    expect(withEvidence.sessions).toHaveLength(1);
    expect(withEvidence.comparisons).toHaveLength(1);
    expect(withEvidence.evidence).toHaveLength(1);
    expect(withEvidence.provenance.runnerVersion).toBe('test-runner/1.0.0');
    expect(builder.validateConsistency(withEvidence)).toEqual({
      experimentId: 'experiment-1',
      workspaceId: 'workspace-1',
      consistent: true,
      counts: { sessions: 1, comparisons: 1, evidence: 1 },
    });
  });

  it('keeps workspaces immutable and supports registering multiple experiments', () => {
    const builder = new LaboratoryWorkspaceBuilder({
      metadata: { domain: 'roulette-tracker' },
      provenance: { runnerVersion: 'test-runner/1.0.0' },
    });
    const workspace = builder.build({
      workspaceId: 'workspace-1',
      name: 'Laboratory workspace',
      owner: 'qa',
    });
    const experimentA = new LaboratoryExperiment({
      experimentId: 'experiment-a',
      workspaceId: 'workspace-1',
      sessions: [],
      comparisons: [],
      evidence: [],
      provenance: { origin: 'reports/Fase6.B.6B.md' },
      timestamps: { createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' },
      lifecycle: new LaboratoryExperimentLifecycle({ status: 'READY', timestamps: { createdAt: '2026-08-03T00:00:00.000Z', readyAt: '2026-08-03T00:00:00.000Z' } }),
      status: 'READY',
    });
    const experimentB = new LaboratoryExperiment({
      experimentId: 'experiment-b',
      workspaceId: 'workspace-1',
      sessions: [],
      comparisons: [],
      evidence: [],
      provenance: { origin: 'reports/Fase6.B.6B.md' },
      timestamps: { createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' },
      lifecycle: new LaboratoryExperimentLifecycle({ status: 'READY', timestamps: { createdAt: '2026-08-03T00:00:00.000Z', readyAt: '2026-08-03T00:00:00.000Z' } }),
      status: 'READY',
    });

    const withExperimentA = builder.withExperiment(workspace, experimentA);
    const withExperimentB = builder.withExperiment(withExperimentA, experimentB);

    expect(Object.isFrozen(workspace)).toBe(true);
    expect(workspace.experiments).toHaveLength(0);
    expect(withExperimentB.experiments).toHaveLength(2);
    expect(withExperimentB.metadata.domain).toBe('roulette-tracker');
    expect(builder.validateConsistency(withExperimentB)).toEqual({
      workspaceId: 'workspace-1',
      consistent: true,
      experimentCount: 2,
    });
  });

  it('registers, consults, opens, closes, and lists workspaces in the catalog', () => {
    const catalog = new LaboratoryWorkspaceCatalog();
    const workspace = new LaboratoryWorkspace({
      workspaceId: 'workspace-catalog',
      name: 'Catalog workspace',
      experiments: [],
      provenance: { origin: 'reports/Fase6.B.6B.md' },
      timestamps: { createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' },
    });

    const registered = catalog.register(workspace, { metadata: { owner: 'qa' } });
    const opened = catalog.open('workspace-catalog');
    const consulted = catalog.consult('workspace-catalog');
    const closed = catalog.close('workspace-catalog');
    const listed = catalog.list();

    expect(registered.open).toBe(false);
    expect(opened.open).toBe(true);
    expect(consulted.workspace.workspaceId).toBe('workspace-catalog');
    expect(closed.open).toBe(false);
    expect(listed).toHaveLength(1);
    expect(listed[0].workspace.workspaceId).toBe('workspace-catalog');
    expect(catalog.toJSON().entries[0].workspace.name).toBe('Catalog workspace');
  });
});
