import { LaboratoryDataset } from './LaboratoryDataset.js';
import { LaboratoryRegistry } from './LaboratoryRegistry.js';
import { LaboratorySession } from './LaboratorySession.js';
import { LaboratorySessionLifecycle } from './LaboratorySessionLifecycle.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeDataset(dataset) {
  if (dataset === null || dataset === undefined) {
    throw new TypeError('LaboratorySessionBuilder: dataset is required.');
  }

  if (dataset instanceof LaboratoryDataset) {
    return dataset;
  }

  if (typeof dataset === 'object' && Array.isArray(dataset.records)) {
    return new LaboratoryDataset(dataset);
  }

  throw new TypeError('LaboratorySessionBuilder: dataset must be a LaboratoryDataset or dataset-like object.');
}

function extractDatasetFromSource(source) {
  if (!source) return null;
  if (source instanceof LaboratoryDataset) return source;
  if (typeof source === 'object') {
    if (source.dataset instanceof LaboratoryDataset) return source.dataset;
    if (source.dataset && Array.isArray(source.dataset.records)) return new LaboratoryDataset(source.dataset);
    if (source.output instanceof LaboratoryDataset) return source.output;
    if (source.output && Array.isArray(source.output.records)) return new LaboratoryDataset(source.output);
  }
  return null;
}

function normalizeModuleIds(modules) {
  if (typeof modules === 'string') return [modules];
  if (!Array.isArray(modules)) return [];
  return modules
    .map(moduleDefinition => {
      if (typeof moduleDefinition === 'string') return moduleDefinition;
      if (moduleDefinition && typeof moduleDefinition === 'object') {
        return moduleDefinition.moduleId
          ?? moduleDefinition.id
          ?? moduleDefinition.manifest?.id
          ?? null;
      }
      return null;
    })
    .filter(Boolean);
}

function freezeStep(step) {
  return Object.freeze({
    ...step,
    moduleIds: freezeList(step.moduleIds),
    metadata: freezeObject(step.metadata),
    parameters: freezeObject(step.parameters),
  });
}

function normalizeExecutionPlan(modules, executionPlan, executionMode) {
  if (Array.isArray(executionPlan) && executionPlan.length > 0) {
    return freezeList(executionPlan.map((step, index) => {
      if (typeof step === 'string') {
        return freezeStep({
          id: `step-${index + 1}`,
          mode: 'sequential',
          moduleIds: [step],
          metadata: {},
          parameters: {},
        });
      }

      const moduleIds = normalizeModuleIds(step.moduleIds ?? step.modules ?? step.moduleId ?? []);
      if (moduleIds.length === 0) {
        throw new TypeError('LaboratorySessionBuilder: each execution step must reference at least one module.');
      }

      return freezeStep({
        id: step.id ?? `step-${index + 1}`,
        name: step.name ?? null,
        mode: step.mode ?? (moduleIds.length > 1 ? 'independent' : 'sequential'),
        moduleIds,
        metadata: freezeObject(step.metadata),
        parameters: freezeObject(step.parameters),
      });
    }));
  }

  const moduleIds = normalizeModuleIds(modules);
  if (moduleIds.length === 0) {
    throw new TypeError('LaboratorySessionBuilder: modules are required.');
  }

  if (executionMode === 'independent') {
    return freezeList([freezeStep({ id: 'step-1', mode: 'independent', moduleIds, metadata: {}, parameters: {} })]);
  }

  return freezeList(moduleIds.map((moduleId, index) => freezeStep({
    id: `step-${index + 1}`,
    mode: 'sequential',
    moduleIds: [moduleId],
    metadata: {},
    parameters: {},
  })));
}

function deriveExecutionMode(executionPlan) {
  if (executionPlan.length === 1 && executionPlan[0].moduleIds.length === 1) {
    return 'single';
  }

  if (executionPlan.length === 1 && executionPlan[0].mode === 'independent') {
    return 'independent';
  }

  const modes = new Set(executionPlan.map(step => step.mode));
  return modes.size === 1 ? [...modes][0] : 'plan';
}

function validateRegisteredModules(registry, executionPlan) {
  for (const step of executionPlan) {
    for (const moduleId of step.moduleIds) {
      if (!registry.get(moduleId)) {
        throw new Error(`LaboratorySessionBuilder: unknown module "${moduleId}".`);
      }
    }
  }
}

export class LaboratorySessionBuilder {
  constructor(options = {}) {
    this.registry = options.registry ?? new LaboratoryRegistry();
  }

  build(options = {}) {
    const dataset = normalizeDataset(options.dataset);
    const executionPlan = normalizeExecutionPlan(options.modules, options.executionPlan, options.executionMode);
    validateRegisteredModules(this.registry, executionPlan);

    const sessionId = options.sessionId ?? options.id ?? `session-${nowIso()}`;
    const createdAt = options.createdAt ?? nowIso();
    const readyAt = options.readyAt ?? createdAt;
    const lifecycle = options.lifecycle instanceof LaboratorySessionLifecycle
      ? options.lifecycle
      : new LaboratorySessionLifecycle({
        status: options.status ?? 'CREATED',
        timestamps: { createdAt },
      }).transitionTo(options.status ?? 'READY', readyAt);

    return new LaboratorySession({
      sessionId,
      dataset,
      modules: executionPlan.flatMap(step => step.moduleIds),
      executionPlan,
      parameters: freezeObject(options.parameters),
      configuration: freezeObject(options.configuration),
      executionMode: options.executionMode ?? deriveExecutionMode(executionPlan),
      metadata: freezeObject(options.metadata),
      timestamps: {
        createdAt,
        readyAt,
        ...(options.timestamps ?? {}),
      },
      status: lifecycle.status,
      lifecycle,
    });
  }

  fromDataset(dataset, options = {}) {
    return this.build({
      ...options,
      dataset,
    });
  }

  fromProvider(providerResult, options = {}) {
    const dataset = extractDatasetFromSource(providerResult);
    if (!dataset) {
      throw new TypeError('LaboratorySessionBuilder: provider result does not include a dataset.');
    }

    return this.build({
      ...options,
      dataset,
      metadata: {
        ...(options.metadata ?? {}),
        provider: providerResult?.sessionId ?? providerResult?.moduleId ?? options.metadata?.provider ?? null,
      },
      parameters: {
        ...(options.parameters ?? {}),
        providerSessionId: providerResult?.sessionId ?? null,
      },
    });
  }
}

export function defineLaboratorySessionBuilder(options = {}) {
  return new LaboratorySessionBuilder(options);
}
