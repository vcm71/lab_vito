import { describe, expect, it } from 'vitest';
import {
  LaboratoryDataset,
  LaboratoryOrchestrator,
  LaboratorySession,
  LaboratorySessionLifecycle,
  LaboratorySessionResult,
  LaboratoryWorkspace,
} from '../../src/laboratory/index.js';

function createSession(sessionId, datasetId, moduleId = 'lab.con') {
  return new LaboratorySession({
    sessionId,
    dataset: {
      id: datasetId,
      records: [{ sessionId }],
      metadata: { source: 'unit-test' },
    },
    modules: [moduleId],
    executionPlan: [{ id: 'step-1', mode: 'sequential', moduleIds: [moduleId], metadata: {}, parameters: {} }],
    parameters: { seed: 1 },
    configuration: { mode: 'test' },
    metadata: { source: 'unit-test' },
    timestamps: { createdAt: '2026-08-03T00:00:00.000Z', readyAt: '2026-08-03T00:00:00.000Z' },
    status: 'READY',
    lifecycle: new LaboratorySessionLifecycle({ status: 'READY', timestamps: { createdAt: '2026-08-03T00:00:00.000Z', readyAt: '2026-08-03T00:00:00.000Z' } }),
  });
}

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

function createOrchestrator(events, runner) {
  return new LaboratoryOrchestrator({
    eventSink: event => events.push(event),
    runner,
  });
}

describe('LaboratoryOrchestrator', () => {
  it('coordinates workspace, experiment, session execution, comparison, evidence, update, and finish flows', async () => {
    const events = [];
    const runner = {
      async runSession(session, options) {
        return new LaboratorySessionResult({
          session,
          sessionId: session.sessionId,
          status: 'COMPLETED',
          startedAt: options.startedAt,
          finishedAt: '2026-08-03T00:00:01.000Z',
          durationMs: 1000,
          modulesExecuted: session.modules,
          moduleResults: session.modules.map(moduleId => ({ moduleId, ok: true })),
          results: session.modules.map(moduleId => ({ moduleId, outcome: 'completed' })),
          metrics: { pci: 42, score: 7 },
          metadata: { source: 'unit-test' },
        });
      },
    };
    const orchestrator = createOrchestrator(events, runner);

    const workspace = new LaboratoryWorkspace({
      workspaceId: 'workspace-1',
      name: 'Orchestrator workspace',
      experiments: [],
      provenance: { origin: 'reports/Fase6.B.7B.md' },
      timestamps: { createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' },
    });
    const session = createSession('session-a', 'dataset-a');
    const experimentInput = {
      experimentId: 'experiment-1',
      hypothesis: 'The orchestrator should coordinate the laboratory pipeline.',
      objective: 'Track workflow transitions and artifacts.',
      metadata: { owner: 'qa' },
      provenance: { source: 'reports/Fase6.B.7B.md' },
    };

    const created = await orchestrator.createExperiment({ workspace, experiment: experimentInput });
    expect(created.ok).toBe(true);
    expect(created.data.experiment.status).toBe('READY');
    expect(created.data.workspace.experiments).toHaveLength(1);
    expect(events.at(-1).type).toBe('ExperimentCreated');

    const started = await orchestrator.startExperiment({ experiment: created.data.experiment });
    expect(started.ok).toBe(true);
    expect(started.data.experiment.status).toBe('RUNNING');
    expect(events.at(-1).type).toBe('ExperimentStarted');

    const executed = await orchestrator.executeSession({ experiment: started.data.experiment, session });
    expect(executed.ok).toBe(true);
    expect(executed.data.result.status).toBe('COMPLETED');
    expect(executed.data.experiment.sessions).toHaveLength(1);
    expect(events.at(-1).type).toBe('SessionCompleted');

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

    const comparison = await orchestrator.compareResults({
      experiment: executed.data.experiment,
      leftSessionResult: left,
      rightSessionResult: right,
    });
    expect(comparison.ok).toBe(true);
    expect(comparison.data.comparison.comparisonId).toBe('session-a__vs__session-b');
    expect(comparison.data.experiment.comparisons).toHaveLength(1);
    expect(events.at(-1).type).toBe('ComparisonFinished');

    const evidence = await orchestrator.generateEvidence({
      experiment: comparison.data.experiment,
      comparisons: [comparison.data.comparison],
      sessions: [executed.data.result],
      results: [comparison.data.comparison.metrics],
      observations: ['Comparison trace is reproducible.'],
    });
    expect(evidence.ok).toBe(true);
    expect(evidence.data.evidence.reportId).toBe('experiment-1-evidence');
    expect(evidence.data.experiment.evidence).toHaveLength(1);
    expect(events.at(-1).type).toBe('EvidenceGenerated');

    const updated = await orchestrator.updateExperiment({
      experiment: created.data.experiment,
      changes: { objective: 'Updated objective' },
      sessions: [session],
      comparisons: [comparison.data.comparison],
      evidence: [evidence.data.evidence],
    });
    expect(updated.ok).toBe(true);
    expect(updated.data.experiment.objective).toBe('Updated objective');
    expect(updated.data.experiment.sessions).toHaveLength(1);
    expect(updated.data.experiment.comparisons).toHaveLength(1);
    expect(updated.data.experiment.evidence).toHaveLength(1);
    expect(events.at(-1).type).toBe('ExperimentUpdated');

    const finished = await orchestrator.finishExperiment({ experiment: executed.data.experiment });
    expect(finished.ok).toBe(true);
    expect(finished.data.experiment.status).toBe('COMPLETED');
    expect(events.at(-1).type).toBe('ExperimentCompleted');

    expect(events.map(event => event.type)).toEqual([
      'ExperimentCreated',
      'ExperimentStarted',
      'SessionStarted',
      'SessionCompleted',
      'ComparisonFinished',
      'EvidenceGenerated',
      'ExperimentUpdated',
      'ExperimentCompleted',
    ]);
  });

  it('executes sessions in batch and returns a coordinated experiment snapshot', async () => {
    const events = [];
    const runner = {
      async runSession(session, options) {
        return new LaboratorySessionResult({
          session,
          sessionId: session.sessionId,
          status: 'COMPLETED',
          startedAt: options.startedAt,
          finishedAt: '2026-08-03T00:00:01.000Z',
          durationMs: 1000,
          modulesExecuted: session.modules,
          moduleResults: session.modules.map(moduleId => ({ moduleId, ok: true })),
          results: session.modules.map(moduleId => ({ moduleId, outcome: 'completed' })),
          metrics: { pci: 21 },
          metadata: { source: 'unit-test' },
        });
      },
    };
    const orchestrator = createOrchestrator(events, runner);
    const workspace = new LaboratoryWorkspace({
      workspaceId: 'workspace-batch',
      name: 'Batch workspace',
      experiments: [],
      provenance: { origin: 'reports/Fase6.B.7B.md' },
      timestamps: { createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z' },
    });
    const experiment = await orchestrator.createExperiment({
      workspace,
      experiment: { experimentId: 'experiment-batch', objective: 'Batch execution' },
    });

    const batch = await orchestrator.executeSessions({
      experiment: experiment.data.experiment,
      sessions: [
        createSession('session-b-1', 'dataset-b-1', 'lab.con'),
        createSession('session-b-2', 'dataset-b-2', 'lab.con1'),
      ],
    });

    expect(batch.ok).toBe(true);
    expect(batch.data.results).toHaveLength(2);
    expect(batch.data.experiment.sessions).toHaveLength(2);
    expect(events.map(event => event.type)).toContain('BatchExecutionCompleted');
  });

  it('returns structured failures when a dependency throws', () => {
    const orchestrator = new LaboratoryOrchestrator({
      comparisonBuilder: {
        build() {
          throw new Error('comparison failed');
        },
      },
    });

    const response = orchestrator.compareResults({
      leftSessionResult: createSessionResult({
        sessionId: 'session-x',
        moduleId: 'lab.con',
        datasetVersion: '2026.08-x',
        configuration: { mode: 'x' },
        parameters: { seed: 1 },
        metrics: { pci: 10 },
        results: [{ outcome: 'x' }],
      }),
      rightSessionResult: createSessionResult({
        sessionId: 'session-y',
        moduleId: 'lab.con1',
        datasetVersion: '2026.08-y',
        configuration: { mode: 'y' },
        parameters: { seed: 2 },
        metrics: { pci: 20 },
        results: [{ outcome: 'y' }],
      }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe('FAILED');
    expect(response.error.message).toBe('comparison failed');
    expect(response.events).toHaveLength(0);
  });
});
