import { LaboratoryComparisonBuilder } from './LaboratoryComparisonBuilder.js';
import { LaboratoryEvidenceReport } from './LaboratoryEvidenceReport.js';
import { LaboratoryExperiment } from './LaboratoryExperiment.js';
import { LaboratoryExperimentBuilder } from './LaboratoryExperimentBuilder.js';
import { LaboratoryExperimentLifecycle } from './LaboratoryExperimentLifecycle.js';
import { LaboratoryRunner } from './LaboratoryRunner.js';
import { LaboratorySession } from './LaboratorySession.js';
import { LaboratoryWorkspace } from './LaboratoryWorkspace.js';
import { LaboratoryWorkspaceBuilder } from './LaboratoryWorkspaceBuilder.js';
import { LaboratoryWorkspaceCatalog } from './LaboratoryWorkspaceCatalog.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function nowIso() {
  return new Date().toISOString();
}

function serialize(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  if (Array.isArray(value)) {
    return value.map(serialize).filter(Boolean);
  }

  if (typeof value === 'object') {
    return { ...value };
  }

  return value;
}

function serializeError(error) {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: 'Error',
    message: String(error),
    stack: null,
  };
}

function normalizeWorkspace(workspace) {
  if (!workspace || typeof workspace !== 'object') {
    throw new TypeError('LaboratoryOrchestrator: workspace is required.');
  }

  return workspace instanceof LaboratoryWorkspace ? workspace : new LaboratoryWorkspace(workspace);
}

function normalizeExperiment(experiment) {
  if (!experiment || typeof experiment !== 'object') {
    throw new TypeError('LaboratoryOrchestrator: experiment is required.');
  }

  return experiment instanceof LaboratoryExperiment ? experiment : new LaboratoryExperiment(experiment);
}

function normalizeSession(session) {
  if (!session || typeof session !== 'object') {
    throw new TypeError('LaboratoryOrchestrator: session is required.');
  }

  return session instanceof LaboratorySession ? session : new LaboratorySession(session);
}

function normalizeSessionResult(sessionResult) {
  if (!sessionResult || typeof sessionResult !== 'object') {
    throw new TypeError('LaboratoryOrchestrator: session result is required.');
  }

  return serialize(sessionResult);
}

function normalizeComparison(comparison) {
  if (!comparison || typeof comparison !== 'object') {
    throw new TypeError('LaboratoryOrchestrator: comparison is required.');
  }

  return serialize(comparison);
}

function normalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    throw new TypeError('LaboratoryOrchestrator: evidence is required.');
  }

  return evidence instanceof LaboratoryEvidenceReport ? evidence : new LaboratoryEvidenceReport(evidence);
}

function omitKeys(source, keys) {
  const result = { ...(source ?? {}) };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

function pickExperimentInput(options = {}) {
  if (options.experiment && typeof options.experiment === 'object') {
    return options.experiment;
  }

  return omitKeys(options, [
    'workspace',
    'workspaceCatalog',
    'workspaceBuilder',
    'workspaceBuilderOptions',
    'experimentBuilder',
    'experimentBuilderOptions',
    'comparisonBuilder',
    'comparisonBuilderOptions',
    'runner',
    'runnerOptions',
    'evidenceFactory',
    'eventSink',
    'metadata',
    'provenance',
    'timestamps',
  ]);
}

function pickWorkspaceInput(options = {}) {
  if (options.workspace && typeof options.workspace === 'object') {
    return options.workspace;
  }

  return omitKeys(options, [
    'workspaceCatalog',
    'workspaceBuilder',
    'workspaceBuilderOptions',
    'experiment',
    'experimentBuilder',
    'experimentBuilderOptions',
    'comparisonBuilder',
    'comparisonBuilderOptions',
    'runner',
    'runnerOptions',
    'evidenceFactory',
    'eventSink',
    'metadata',
    'provenance',
    'timestamps',
  ]);
}

function pickSessionInput(options = {}) {
  if (options.session && typeof options.session === 'object') {
    return options.session;
  }

  return omitKeys(options, ['experiment', 'result', 'sessionResult', 'sessions', 'metadata', 'provenance', 'timestamps']);
}

function buildEvent(type, payload, metadata = {}) {
  return Object.freeze({
    type,
    occurredAt: nowIso(),
    payload: serialize(payload),
    metadata: freezeObject(metadata),
  });
}

export class LaboratoryOrchestrator {
  constructor(options = {}) {
    this.workspaceCatalog = options.workspaceCatalog ?? new LaboratoryWorkspaceCatalog(options.workspaceCatalogOptions ?? {});
    this.workspaceBuilder = options.workspaceBuilder ?? new LaboratoryWorkspaceBuilder(options.workspaceBuilderOptions ?? {});
    this.experimentBuilder = options.experimentBuilder ?? new LaboratoryExperimentBuilder(options.experimentBuilderOptions ?? {});
    this.comparisonBuilder = options.comparisonBuilder ?? new LaboratoryComparisonBuilder(options.comparisonBuilderOptions ?? {});
    this.runner = options.runner ?? new LaboratoryRunner(options.runnerOptions ?? {});
    this.evidenceFactory = options.evidenceFactory ?? (payload => new LaboratoryEvidenceReport(payload));
    this.metadata = freezeObject(options.metadata);
    this.provenance = freezeObject(options.provenance);
    this.eventSink = typeof options.eventSink === 'function' ? options.eventSink : null;
    Object.freeze(this);
  }

  emit(type, payload, metadata = {}) {
    const event = buildEvent(type, payload, {
      ...this.metadata,
      ...metadata,
    });

    if (this.eventSink) {
      this.eventSink(event);
    }

    return event;
  }

  wrap(operation, fn, metadata = {}) {
    const startedAt = nowIso();
    const events = [];

    const publish = (type, payload, eventMetadata = {}) => {
      const event = this.emit(type, payload, {
        operation,
        ...metadata,
        ...eventMetadata,
      });
      events.push(event);
      return event;
    };

    const complete = data => {
      const finishedAt = nowIso();
      return Object.freeze({
        ok: true,
        operation,
        status: 'COMPLETED',
        startedAt,
        finishedAt,
        durationMs: Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime()),
        events: freezeList(events),
        metadata: freezeObject({ ...this.metadata, ...metadata }),
        provenance: freezeObject({ ...this.provenance, operation, startedAt, finishedAt }),
        data: serialize(data),
      });
    };

    const fail = error => {
      const finishedAt = nowIso();
      return Object.freeze({
        ok: false,
        operation,
        status: 'FAILED',
        startedAt,
        finishedAt,
        durationMs: Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime()),
        events: freezeList(events),
        metadata: freezeObject({ ...this.metadata, ...metadata }),
        provenance: freezeObject({ ...this.provenance, operation, startedAt, finishedAt }),
        error: serializeError(error),
      });
    };

    try {
      const data = fn({ startedAt, publish });
      if (data && typeof data.then === 'function') {
        return data.then(complete).catch(fail);
      }

      return complete(data);
    } catch (error) {
      return fail(error);
    }
  }

  createExperiment(options = {}) {
    return this.wrap('createExperiment', ({ publish, startedAt }) => {
      const workspace = normalizeWorkspace(pickWorkspaceInput(options));
      const experimentInput = pickExperimentInput(options);
      const createdAt = experimentInput.createdAt ?? options.createdAt ?? startedAt;
      const readyAt = experimentInput.readyAt ?? options.readyAt ?? createdAt;
      const experiment = this.experimentBuilder.build({
        ...experimentInput,
        workspaceId: experimentInput.workspaceId ?? workspace.workspaceId,
        createdAt,
        readyAt,
        updatedAt: experimentInput.updatedAt ?? options.updatedAt ?? createdAt,
        status: experimentInput.status ?? options.status ?? 'READY',
        provenance: {
          ...this.provenance,
          ...(experimentInput.provenance ?? {}),
          workspace: workspace.toJSON(),
          workspaceId: workspace.workspaceId,
          observedAt: options.observedAt ?? experimentInput.provenance?.observedAt ?? startedAt,
        },
        metadata: {
          ...this.metadata,
          ...(experimentInput.metadata ?? {}),
        },
      });

      const registeredWorkspace = this.workspaceCatalog.register(workspace, {
        metadata: {
          ...(options.workspaceMetadata ?? {}),
          experimentId: experiment.experimentId,
        },
        registeredAt: options.registeredAt ?? startedAt,
      });

      const updatedWorkspace = this.workspaceBuilder.withExperiment(registeredWorkspace.workspace, experiment, {
        updatedAt: options.updatedAt ?? startedAt,
        observedAt: options.observedAt ?? startedAt,
      });

      publish('ExperimentCreated', {
        experiment,
        workspace: updatedWorkspace,
      }, {
        experimentId: experiment.experimentId,
        workspaceId: workspace.workspaceId,
      });

      return {
        workspace: updatedWorkspace,
        experiment,
      };
    }, {
      workspaceId: options.workspaceId ?? options.workspace?.workspaceId ?? null,
      experimentId: options.experimentId ?? options.experiment?.experimentId ?? null,
    });
  }

  startExperiment(options = {}) {
    return this.wrap('startExperiment', ({ publish, startedAt }) => {
      const experiment = normalizeExperiment(options.experiment ?? options);
      const lifecycle = experiment.lifecycle instanceof LaboratoryExperimentLifecycle
        ? experiment.lifecycle
        : new LaboratoryExperimentLifecycle({ status: experiment.status, timestamps: experiment.timestamps });
      const nextLifecycle = lifecycle.transitionTo('RUNNING', options.timestamp ?? startedAt);
      const updatedExperiment = this.experimentBuilder.build({
        ...experiment.toJSON(),
        lifecycle: nextLifecycle,
        updatedAt: options.updatedAt ?? startedAt,
        timestamps: {
          ...experiment.timestamps,
          ...nextLifecycle.timestamps,
          updatedAt: options.updatedAt ?? startedAt,
        },
      });

      publish('ExperimentStarted', {
        experiment: updatedExperiment,
      }, {
        experimentId: updatedExperiment.experimentId,
      });

      return {
        experiment: updatedExperiment,
      };
    }, {
      experimentId: options.experiment?.experimentId ?? options.experimentId ?? null,
    });
  }

  async executeSession(options = {}) {
    return this.wrap('executeSession', async ({ publish, startedAt }) => {
      const session = normalizeSession(pickSessionInput(options));
      const runnerOptions = {
        ...(options.runnerOptions ?? {}),
        startedAt: options.startedAt ?? startedAt,
        metadata: {
          ...this.metadata,
          ...(options.metadata ?? {}),
        },
      };

      publish('SessionStarted', {
        session,
      }, {
        sessionId: session.sessionId,
      });

      const result = await this.runner.runSession(session, runnerOptions);
      const sessionResult = normalizeSessionResult(result);
      const experiment = options.experiment
        ? this.experimentBuilder.withSession(normalizeExperiment(options.experiment), session, {
          updatedAt: options.updatedAt ?? sessionResult.finishedAt ?? startedAt,
          observedAt: sessionResult.finishedAt ?? startedAt,
        })
        : null;

      publish('SessionCompleted', {
        session: session.toJSON(),
        result: sessionResult,
        experiment,
      }, {
        sessionId: session.sessionId,
        experimentId: experiment?.experimentId ?? null,
      });

      return {
        session,
        result: sessionResult,
        experiment,
      };
    }, {
      sessionId: options.session?.sessionId ?? options.sessionId ?? null,
      experimentId: options.experiment?.experimentId ?? null,
    });
  }

  async executeSessions(options = {}) {
    return this.wrap('executeSessions', async ({ publish }) => {
      const sessions = freezeList((options.sessions ?? []).map(normalizeSession));
      const results = [];
      let experiment = options.experiment ? normalizeExperiment(options.experiment) : null;

      for (const session of sessions) {
        const entry = await this.executeSession({
          ...options,
          experiment,
          session,
          runnerOptions: options.runnerOptions,
        });

        results.push(entry.data.result);
        experiment = entry.data.experiment ?? experiment;
      }

      publish('BatchExecutionCompleted', {
        sessions: sessions.map(session => session.toJSON()),
        results,
        experiment,
      }, {
        experimentId: experiment?.experimentId ?? null,
        sessionCount: sessions.length,
      });

      return {
        sessions,
        results,
        experiment,
      };
    }, {
      experimentId: options.experiment?.experimentId ?? null,
      sessionCount: Array.isArray(options.sessions) ? options.sessions.length : 0,
    });
  }

  compareResults(options = {}) {
    return this.wrap('compareResults', ({ publish, startedAt }) => {
      const left = options.leftSessionResult ?? options.leftResult ?? options.left;
      const right = options.rightSessionResult ?? options.rightResult ?? options.right;
      const comparison = this.comparisonBuilder.build({
        leftSessionResult: left,
        rightSessionResult: right,
        criteria: options.criteria,
        metrics: options.metrics,
        metadata: {
          ...this.metadata,
          ...(options.metadata ?? {}),
        },
        comparedAt: options.comparedAt ?? startedAt,
      });
      const experiment = options.experiment
        ? this.experimentBuilder.withComparison(normalizeExperiment(options.experiment), comparison, {
          updatedAt: options.updatedAt ?? startedAt,
          observedAt: options.observedAt ?? startedAt,
        })
        : null;

      publish('ComparisonFinished', {
        comparison,
        experiment,
      }, {
        comparisonId: comparison.comparisonId,
        experimentId: experiment?.experimentId ?? null,
      });

      return {
        comparison,
        experiment,
      };
    }, {
      comparisonId: options.comparisonId ?? null,
    });
  }

  executeResearch(options = {}) {
    return this.wrap('executeResearch', ({ publish, startedAt }) => {
      const request = serialize(options.request ?? {});
      const context = request.context ?? options.context ?? null;
      const query = String(request.query ?? options.query ?? '').trim();
      const scope = serialize(request.scope ?? options.scope ?? { kind: 'current-experiment', label: 'Current experiment' });
      const providerId = request.providerId ?? options.providerId ?? 'local-research-provider';
      const highlights = [];
      for (const section of context?.sections ?? []) {
        for (const item of (section.items ?? []).slice(0, 2)) {
          if (!item) continue;
          highlights.push({
            sectionId: section.id ?? section.label ?? 'context',
            itemId: item.id ?? item.itemId ?? item.reportId ?? item.eventId ?? null,
            label: item.label ?? item.title ?? item.id ?? 'Context item',
            detail: item.detail ?? item.summary ?? null,
          });
        }
      }

      const response = freezeObject({
        providerId,
        mode: 'deterministic-local',
        generatedAt: startedAt,
        requestId: request.requestId ?? `research-${Date.now()}`,
        summary: `Draft for ${scope?.label ?? scope?.kind ?? 'current scope'} using ${(context?.totals?.timelineEvents ?? 0)} timeline events and ${(context?.totals?.evidenceReports ?? 0)} evidence reports.`,
        answer: `Focus the next review on ${query || 'the active laboratory state'} and trace the most relevant evidence before proposing changes.`,
        highlights: freezeList(highlights),
        limitations: freezeList([
          'This response is generated locally from the laboratory view models.',
          'It does not call an external LLM provider in this environment.',
        ]),
      });

      publish('ResearchExecuted', {
        request: {
          ...request,
          context,
          scope,
        },
        response,
      }, {
        providerId,
      });

      return {
        request: freezeObject({
          ...request,
          context,
          scope,
          providerId,
        }),
        response,
      };
    }, {
      providerId: options.request?.providerId ?? options.providerId ?? null,
    });
  }

  generateEvidence(options = {}) {
    return this.wrap('generateEvidence', ({ publish, startedAt }) => {
      const comparisons = freezeList((options.comparisons ?? []).map(normalizeComparison));
      const sessions = freezeList((options.sessions ?? []).map(normalizeSessionResult));
      const results = freezeList((options.results ?? []).map(serialize));
      const evidencePayload = {
        reportId: options.reportId ?? options.id ?? `${options.experiment?.experimentId ?? 'experiment'}-evidence`,
        title: options.title ?? 'Laboratory evidence report',
        comparisons,
        sessions,
        results,
        differences: options.differences ?? (comparisons[0]?.differences ?? {}),
        metrics: options.metrics ?? (comparisons[0]?.metrics ?? {}),
        traceability: options.traceability ?? {
          comparisonIds: comparisons.map(item => item.comparisonId),
          sessionIds: sessions.map(item => item.sessionId).filter(Boolean),
        },
        reproducibility: options.reproducibility ?? {
          deterministic: true,
          provenance: this.provenance,
        },
        observations: options.observations ?? [],
        metadata: {
          ...this.metadata,
          ...(options.metadata ?? {}),
        },
        timestamps: {
          generatedAt: options.generatedAt ?? startedAt,
          ...(options.timestamps ?? {}),
        },
      };
      const evidence = normalizeEvidence(this.evidenceFactory(evidencePayload));

      const experiment = options.experiment
        ? this.experimentBuilder.withEvidence(normalizeExperiment(options.experiment), evidence, {
          updatedAt: options.updatedAt ?? startedAt,
          observedAt: options.observedAt ?? startedAt,
        })
        : null;

      publish('EvidenceGenerated', {
        evidence,
        experiment,
      }, {
        reportId: evidence.reportId,
        experimentId: experiment?.experimentId ?? null,
      });

      return {
        evidence,
        experiment,
      };
    }, {
      reportId: options.reportId ?? options.id ?? null,
      experimentId: options.experiment?.experimentId ?? null,
    });
  }

  updateExperiment(options = {}) {
    return this.wrap('updateExperiment', ({ publish, startedAt }) => {
      let experiment = normalizeExperiment(options.experiment ?? options);
      const changes = options.changes ?? options.updates ?? {};
      const base = this.experimentBuilder.build({
        ...experiment.toJSON(),
        ...changes,
        updatedAt: options.updatedAt ?? startedAt,
        provenance: {
          ...experiment.provenance,
          ...(changes.provenance ?? {}),
          ...(options.provenance ?? {}),
          observedAt: options.observedAt ?? experiment.provenance.observedAt ?? startedAt,
        },
        metadata: {
          ...experiment.metadata,
          ...(changes.metadata ?? {}),
          ...(options.metadata ?? {}),
        },
      });

      experiment = base;

      for (const session of options.sessions ?? []) {
        experiment = this.experimentBuilder.withSession(experiment, normalizeSession(session), {
          updatedAt: options.updatedAt ?? startedAt,
          observedAt: options.observedAt ?? startedAt,
        });
      }

      for (const comparison of options.comparisons ?? []) {
        experiment = this.experimentBuilder.withComparison(experiment, normalizeComparison(comparison), {
          updatedAt: options.updatedAt ?? startedAt,
          observedAt: options.observedAt ?? startedAt,
        });
      }

      for (const evidence of options.evidence ?? []) {
        experiment = this.experimentBuilder.withEvidence(experiment, normalizeEvidence(evidence), {
          updatedAt: options.updatedAt ?? startedAt,
          observedAt: options.observedAt ?? startedAt,
        });
      }

      if (options.status) {
        const lifecycle = experiment.lifecycle instanceof LaboratoryExperimentLifecycle
          ? experiment.lifecycle
          : new LaboratoryExperimentLifecycle({ status: experiment.status, timestamps: experiment.timestamps });
        const nextLifecycle = lifecycle.transitionTo(options.status, options.timestamp ?? startedAt);
        experiment = this.experimentBuilder.build({
          ...experiment.toJSON(),
          lifecycle: nextLifecycle,
          updatedAt: options.updatedAt ?? startedAt,
          timestamps: {
            ...experiment.timestamps,
            ...nextLifecycle.timestamps,
            updatedAt: options.updatedAt ?? startedAt,
          },
        });
      }

      publish('ExperimentUpdated', {
        experiment,
      }, {
        experimentId: experiment.experimentId,
      });

      return {
        experiment,
      };
    }, {
      experimentId: options.experiment?.experimentId ?? options.experimentId ?? null,
    });
  }

  finishExperiment(options = {}) {
    return this.wrap('finishExperiment', ({ publish, startedAt }) => {
      const experiment = normalizeExperiment(options.experiment ?? options);
      const lifecycle = experiment.lifecycle instanceof LaboratoryExperimentLifecycle
        ? experiment.lifecycle
        : new LaboratoryExperimentLifecycle({ status: experiment.status, timestamps: experiment.timestamps });
      const nextStatus = options.status ?? 'COMPLETED';
      const nextLifecycle = lifecycle.transitionTo(nextStatus, options.timestamp ?? startedAt);
      const updatedExperiment = this.experimentBuilder.build({
        ...experiment.toJSON(),
        lifecycle: nextLifecycle,
        updatedAt: options.updatedAt ?? startedAt,
        timestamps: {
          ...experiment.timestamps,
          ...nextLifecycle.timestamps,
          updatedAt: options.updatedAt ?? startedAt,
        },
      });

      publish('ExperimentCompleted', {
        experiment: updatedExperiment,
      }, {
        experimentId: updatedExperiment.experimentId,
        status: updatedExperiment.status,
      });

      return {
        experiment: updatedExperiment,
      };
    }, {
      experimentId: options.experiment?.experimentId ?? options.experimentId ?? null,
    });
  }
}

export function defineLaboratoryOrchestrator(options = {}) {
  return new LaboratoryOrchestrator(options);
}
