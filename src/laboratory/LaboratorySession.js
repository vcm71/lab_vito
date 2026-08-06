import { LaboratoryDataset } from './LaboratoryDataset.js';
import { LaboratorySessionLifecycle } from './LaboratorySessionLifecycle.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function normalizeModuleId(moduleDefinition) {
  if (!moduleDefinition) return null;
  if (typeof moduleDefinition === 'string') return moduleDefinition;
  if (typeof moduleDefinition === 'object') {
    return moduleDefinition.moduleId
      ?? moduleDefinition.id
      ?? moduleDefinition.manifest?.id
      ?? null;
  }
  return null;
}

function normalizeStep(step, index) {
  if (typeof step === 'string') {
    return Object.freeze({
      id: `step-${index + 1}`,
      mode: 'sequential',
      moduleIds: freezeList([step]),
      metadata: freezeObject(),
      parameters: freezeObject(),
    });
  }

  if (!step || typeof step !== 'object') {
    throw new TypeError('LaboratorySession: execution steps must be strings or objects.');
  }

  const moduleIds = Array.isArray(step.moduleIds)
    ? step.moduleIds.map(normalizeModuleId).filter(Boolean)
    : Array.isArray(step.modules)
      ? step.modules.map(normalizeModuleId).filter(Boolean)
      : normalizeModuleId(step.moduleId)
        ? [normalizeModuleId(step.moduleId)]
        : [];

  if (moduleIds.length === 0) {
    throw new TypeError('LaboratorySession: execution steps must reference at least one registered module.');
  }

  const mode = step.mode ?? (moduleIds.length > 1 ? 'independent' : 'sequential');
  if (!['sequential', 'independent'].includes(mode)) {
    throw new TypeError(`LaboratorySession: unsupported step mode "${mode}".`);
  }

  return Object.freeze({
    id: step.id ?? `step-${index + 1}`,
    name: step.name ?? null,
    mode,
    moduleIds: freezeList(moduleIds),
    metadata: freezeObject(step.metadata),
    parameters: freezeObject(step.parameters),
  });
}

function freezeStep(step) {
  return Object.freeze({
    ...step,
    moduleIds: freezeList(step.moduleIds),
    metadata: freezeObject(step.metadata),
    parameters: freezeObject(step.parameters),
  });
}

function normalizeExecutionPlan(options = {}) {
  if (Array.isArray(options.executionPlan) && options.executionPlan.length > 0) {
    return Object.freeze(options.executionPlan.map((step, index) => freezeStep(normalizeStep(step, index))));
  }

  if (Array.isArray(options.steps) && options.steps.length > 0) {
    return Object.freeze(options.steps.map((step, index) => freezeStep(normalizeStep(step, index))));
  }

  if (typeof options.modules === 'string') {
    return Object.freeze([freezeStep(normalizeStep(options.modules, 0))]);
  }

  if (Array.isArray(options.modules) && options.modules.length > 0) {
    const normalizedModules = options.modules.map(normalizeModuleId).filter(Boolean);
    if (normalizedModules.length === 0) {
      throw new TypeError('LaboratorySession: modules must contain at least one registered module.');
    }

    if (options.executionMode === 'independent') {
      return Object.freeze([freezeStep({ 
        id: 'step-1',
        name: null,
        mode: 'independent',
        moduleIds: normalizedModules,
        metadata: {},
        parameters: {},
      })]);
    }

    return Object.freeze(normalizedModules.map((moduleId, index) => freezeStep(normalizeStep(moduleId, index))));
  }

  throw new TypeError('LaboratorySession: modules or executionPlan are required.');
}

function deriveExecutionMode(executionPlan) {
  if (executionPlan.length === 1 && executionPlan[0].moduleIds.length === 1) {
    return 'single';
  }

  const modes = new Set(executionPlan.map(step => step.mode));
  if (modes.size === 1) {
    return modes.has('independent') ? 'independent' : 'sequential';
  }

  return 'plan';
}

function normalizeDataset(dataset) {
  if (dataset === null || dataset === undefined) return null;
  if (dataset instanceof LaboratoryDataset) return dataset;
  if (typeof dataset === 'object' && Array.isArray(dataset.records)) {
    return new LaboratoryDataset(dataset);
  }
  throw new TypeError('LaboratorySession: dataset must be a LaboratoryDataset or a dataset-like object.');
}

export class LaboratorySession {
  constructor(options = {}) {
    const sessionId = options.sessionId ?? options.id ?? null;
    if (!sessionId || typeof sessionId !== 'string') {
      throw new TypeError('LaboratorySession: sessionId is required and must be a string.');
    }

    this.sessionId = sessionId;
    this.dataset = normalizeDataset(options.dataset);
    this.executionPlan = Array.isArray(options.executionPlan) && options.executionPlan.length > 0
      ? normalizeExecutionPlan({ executionPlan: options.executionPlan })
      : normalizeExecutionPlan(options);
    this.modules = freezeList(
      Array.isArray(options.modules) && options.modules.length > 0
        ? options.modules.map(normalizeModuleId).filter(Boolean)
        : this.executionPlan.flatMap(step => step.moduleIds),
    );
    this.parameters = freezeObject(options.parameters);
    this.configuration = freezeObject(options.configuration);
    this.executionMode = options.executionMode ?? deriveExecutionMode(this.executionPlan.length > 0 ? this.executionPlan : normalizeExecutionPlan(options));
    this.metadata = freezeObject(options.metadata);
    this.timestamps = freezeObject(options.timestamps);
    this.status = options.status ?? 'CREATED';
    this.lifecycle = options.lifecycle instanceof LaboratorySessionLifecycle
      ? options.lifecycle
      : new LaboratorySessionLifecycle({ status: this.status, timestamps: this.timestamps });
    Object.freeze(this);
  }

  withLifecycle(lifecycle) {
    return new LaboratorySession({
      sessionId: this.sessionId,
      dataset: this.dataset,
      modules: [...this.modules],
      executionPlan: [...this.executionPlan],
      parameters: { ...this.parameters },
      configuration: { ...this.configuration },
      executionMode: this.executionMode,
      metadata: { ...this.metadata },
      timestamps: lifecycle?.timestamps ?? { ...this.timestamps },
      status: lifecycle?.status ?? this.status,
      lifecycle,
    });
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      dataset: this.dataset && typeof this.dataset.toJSON === 'function' ? this.dataset.toJSON() : this.dataset,
      modules: [...this.modules],
      executionPlan: this.executionPlan.map(step => ({
        ...step,
        moduleIds: [...step.moduleIds],
        metadata: { ...step.metadata },
        parameters: { ...step.parameters },
      })),
      parameters: { ...this.parameters },
      configuration: { ...this.configuration },
      executionMode: this.executionMode,
      metadata: { ...this.metadata },
      timestamps: { ...this.timestamps },
      status: this.status,
      lifecycle: this.lifecycle ? this.lifecycle.toJSON() : null,
    };
  }
}

export function defineLaboratorySession(options = {}) {
  return new LaboratorySession(options);
}
