import { LaboratoryExperimentLifecycle } from './LaboratoryExperimentLifecycle.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function serialize(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  return { ...value };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeArray(value) {
  return freezeList((value ?? []).map(serialize).filter(Boolean));
}

function normalizeProvenance(options = {}) {
  return freezeObject({
    modules: freezeObject(options.modules),
    dataset: serialize(options.dataset),
    session: serialize(options.session),
    parameters: freezeObject(options.parameters),
    configuration: freezeObject(options.configuration),
    origin: options.origin ?? null,
    runnerVersion: options.runnerVersion ?? null,
    observedAt: options.observedAt ?? null,
    source: options.source ?? null,
  });
}

export class LaboratoryExperiment {
  constructor(options = {}) {
    const experimentId = options.experimentId ?? options.id ?? null;
    const workspaceId = options.workspaceId ?? null;

    if (!experimentId || typeof experimentId !== 'string') {
      throw new TypeError('LaboratoryExperiment: experimentId is required and must be a string.');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new TypeError('LaboratoryExperiment: workspaceId is required and must be a string.');
    }

    this.experimentId = experimentId;
    this.workspaceId = workspaceId;
    this.hypothesis = options.hypothesis ?? null;
    this.objective = options.objective ?? null;
    this.sessions = normalizeArray(options.sessions);
    this.comparisons = normalizeArray(options.comparisons);
    this.evidence = normalizeArray(options.evidence);
    this.metadata = freezeObject(options.metadata);
    this.provenance = normalizeProvenance(options.provenance);
    this.createdAt = options.createdAt ?? nowIso();
    this.updatedAt = options.updatedAt ?? this.createdAt;
    this.lifecycle = options.lifecycle instanceof LaboratoryExperimentLifecycle
      ? options.lifecycle
      : new LaboratoryExperimentLifecycle({
        status: options.status ?? 'CREATED',
        timestamps: {
          createdAt: this.createdAt,
          ...(options.timestamps ?? {}),
        },
      });
    this.status = this.lifecycle.status;
    this.timestamps = freezeObject({
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...(options.timestamps ?? {}),
    });
    Object.freeze(this);
  }

  toJSON() {
    return {
      experimentId: this.experimentId,
      workspaceId: this.workspaceId,
      hypothesis: this.hypothesis,
      objective: this.objective,
      sessions: [...this.sessions],
      comparisons: [...this.comparisons],
      evidence: [...this.evidence],
      metadata: { ...this.metadata },
      provenance: { ...this.provenance },
      status: this.status,
      lifecycle: this.lifecycle.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      timestamps: { ...this.timestamps },
    };
  }
}

export function defineLaboratoryExperiment(options = {}) {
  return new LaboratoryExperiment(options);
}
