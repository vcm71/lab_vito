import { LaboratoryContext } from './LaboratoryContext.js';
import { LaboratoryDataset } from './LaboratoryDataset.js';
import { LaboratoryResult } from './LaboratoryResult.js';
import { LaboratoryRegistry } from './LaboratoryRegistry.js';
import { LaboratorySession } from './LaboratorySession.js';
import { LaboratorySessionResult } from './LaboratorySessionResult.js';

function nowIso() {
  return new Date().toISOString();
}

function buildContext(moduleDefinition, session, step, stepIndex, options = {}) {
  const contextFactory = options.contextFactory
    ?? moduleDefinition.contextFactory
    ?? ((ctxOptions = {}) => new LaboratoryContext(ctxOptions));

  const contextOptions = {
    configuration: {
      ...(session.configuration ?? {}),
      ...(step?.parameters ?? {}),
      ...(options.contextOptions?.configuration ?? {}),
    },
    module: moduleDefinition.manifest,
    moduleId: moduleDefinition.manifest.id,
    dataset: session.dataset ?? null,
    runId: options.runId ?? `${session.sessionId}:${moduleDefinition.manifest.id}:${stepIndex + 1}`,
    evaluationMode: options.evaluationMode ?? 'session',
    capabilities: moduleDefinition.capabilities,
    metadata: {
      ...(session.metadata ?? {}),
      ...(options.metadata ?? {}),
      sessionId: session.sessionId,
      sessionStatus: session.status,
      sessionExecutionMode: session.executionMode,
      stepId: step?.id ?? `step-${stepIndex + 1}`,
      stepMode: step?.mode ?? 'sequential',
      stepIndex,
      parameters: { ...(session.parameters ?? {}), ...(step?.parameters ?? {}) },
    },
    futureExtensions: {
      session: session.toJSON(),
      executionPlan: session.executionPlan,
      parameters: session.parameters,
      step,
    },
  };

  return contextFactory(contextOptions);
}

function resolveExecutor(moduleDefinition) {
  if (typeof moduleDefinition.execute === 'function') return moduleDefinition.execute;
  if (typeof moduleDefinition.run === 'function') return moduleDefinition.run;
  if (moduleDefinition.implementation && typeof moduleDefinition.implementation.execute === 'function') {
    return moduleDefinition.implementation.execute;
  }
  if (moduleDefinition.implementation && typeof moduleDefinition.implementation.run === 'function') {
    return moduleDefinition.implementation.run;
  }
  if (moduleDefinition.adapter && typeof moduleDefinition.adapter.execute === 'function') {
    return moduleDefinition.adapter.execute;
  }
  throw new Error(`LaboratoryRunner: module "${moduleDefinition.manifest.id}" does not expose an executable contract.`);
}

async function executeModule({ moduleDefinition, session, step, stepIndex, registry, options }) {
  const context = buildContext(moduleDefinition, session, step, stepIndex, options);
  const executor = resolveExecutor(moduleDefinition);
  const moduleOptions = {
    ...session.parameters,
    ...(step?.parameters ?? {}),
    ...(options.parameters ?? {}),
  };
  const startedAt = options.startedAt ?? nowIso();

  try {
    const output = await executor({
      context,
      module: moduleDefinition,
      registry,
      options: moduleOptions,
      session,
      step,
    });

    const derivedDataset = output instanceof LaboratoryResult
      ? output.dataset
      : (output instanceof LaboratoryDataset
        ? output
        : (output && typeof output === 'object' && 'dataset' in output ? output.dataset : null));

    const result = output instanceof LaboratoryResult
      ? output
      : new LaboratoryResult({
        runId: context.runId,
        moduleId: moduleDefinition.manifest.id,
        status: 'success',
        startedAt,
        finishedAt: nowIso(),
        context,
        dataset: derivedDataset ?? session.dataset,
        output,
        metrics: options.metrics ?? {},
        metadata: {
          ...(options.metadata ?? {}),
          sessionId: session.sessionId,
          stepId: step?.id ?? null,
          stepIndex,
        },
      });

    return {
      moduleId: moduleDefinition.manifest.id,
      stepId: step?.id ?? `step-${stepIndex + 1}`,
      stepIndex,
      stepMode: step?.mode ?? 'sequential',
      result,
    };
  } catch (error) {
    const result = new LaboratoryResult({
      runId: context.runId,
      moduleId: moduleDefinition.manifest.id,
      status: 'failure',
      startedAt,
      finishedAt: nowIso(),
      context,
      dataset: session.dataset,
      error,
      metadata: {
        ...(options.metadata ?? {}),
        sessionId: session.sessionId,
        stepId: step?.id ?? null,
        stepIndex,
      },
    });

    return {
      moduleId: moduleDefinition.manifest.id,
      stepId: step?.id ?? `step-${stepIndex + 1}`,
      stepIndex,
      stepMode: step?.mode ?? 'sequential',
      result,
    };
  }
}

async function executeStep({ session, step, stepIndex, registry, options }) {
  if (step.mode === 'independent' && step.moduleIds.length > 1) {
    return Promise.all(step.moduleIds.map(async (moduleId) => {
      const moduleDefinition = registry.get(moduleId);
      if (!moduleDefinition) {
        throw new Error(`LaboratoryRunner: unknown module "${moduleId}".`);
      }
      return executeModule({ moduleDefinition, session, step: { ...step, moduleIds: [moduleId] }, stepIndex, registry, options });
    }));
  }

  const entries = [];
  for (const moduleId of step.moduleIds) {
    const moduleDefinition = registry.get(moduleId);
    if (!moduleDefinition) {
      throw new Error(`LaboratoryRunner: unknown module "${moduleId}".`);
    }
    entries.push(await executeModule({ moduleDefinition, session, step, stepIndex, registry, options }));
  }
  return entries;
}

function isLaboratorySession(candidate) {
  return candidate instanceof LaboratorySession
    || (candidate && typeof candidate === 'object' && typeof candidate.sessionId === 'string' && Array.isArray(candidate.executionPlan));
}

export class LaboratoryRunner {
  constructor(options = {}) {
    this.registry = options.registry ?? new LaboratoryRegistry();
    this.defaultContextFactory = options.contextFactory ?? null;
  }

  async run(sessionOrModuleId, options = {}) {
    if (isLaboratorySession(sessionOrModuleId)) {
      return this.runSession(sessionOrModuleId, options);
    }

    if (typeof sessionOrModuleId === 'string') {
      return this.runModule(sessionOrModuleId, options);
    }

    throw new TypeError('LaboratoryRunner: expected a LaboratorySession or module id.');
  }

  async runModule(moduleId, options = {}) {
    const moduleDefinition = this.registry.get(moduleId);
    if (!moduleDefinition) {
      throw new Error(`LaboratoryRunner: unknown module "${moduleId}".`);
    }

    const session = new LaboratorySession({
      sessionId: options.sessionId ?? `${moduleId}-${nowIso()}`,
      dataset: options.dataset ?? null,
      modules: [moduleId],
      executionPlan: [{ id: 'step-1', mode: 'sequential', moduleIds: [moduleId], metadata: {}, parameters: {} }],
      parameters: options.parameters ?? {},
      configuration: options.configuration ?? {},
      executionMode: 'single',
      metadata: options.metadata ?? {},
      timestamps: { createdAt: options.startedAt ?? nowIso(), readyAt: options.startedAt ?? nowIso() },
      status: 'READY',
    });

    const entry = await executeModule({
      moduleDefinition,
      session,
      step: session.executionPlan[0],
      stepIndex: 0,
      registry: this.registry,
      options: {
        ...options,
        evaluationMode: options.evaluationMode ?? 'execution',
        contextFactory: options.contextFactory ?? this.defaultContextFactory,
        parameters: options.parameters ?? {},
        metadata: options.metadata ?? {},
        startedAt: options.startedAt ?? nowIso(),
      },
    });

    if (Array.isArray(options.resultSink)) {
      options.resultSink.push(entry.result);
    }

    return entry.result;
  }

  async runSession(session, options = {}) {
    if (!isLaboratorySession(session)) {
      throw new TypeError('LaboratoryRunner: expected a LaboratorySession.');
    }

    const startedAt = options.startedAt ?? nowIso();
    const moduleResults = [];
    const results = [];
    const modulesExecuted = [];
    const errors = [];

    for (let stepIndex = 0; stepIndex < session.executionPlan.length; stepIndex += 1) {
      const step = session.executionPlan[stepIndex];
      const entries = await executeStep({
        session,
        step,
        stepIndex,
        registry: this.registry,
        options: {
          ...options,
          contextFactory: options.contextFactory ?? this.defaultContextFactory,
        },
      });

      for (const entry of entries) {
        modulesExecuted.push(entry.moduleId);
        moduleResults.push(entry);
        results.push(entry.result);
        if (!entry.result.ok && entry.result.error) {
          errors.push(entry.result.error);
        }
      }
    }

    const status = errors.length > 0 ? 'FAILED' : 'COMPLETED';
    const finishedAt = nowIso();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

    return new LaboratorySessionResult({
      session,
      sessionId: session.sessionId,
      status,
      startedAt,
      finishedAt,
      durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : null,
      modulesExecuted,
      moduleResults,
      results,
      metrics: options.metrics ?? {},
      errors,
      metadata: {
        ...(options.metadata ?? {}),
        executionMode: session.executionMode,
        status,
      },
    });
  }
}
