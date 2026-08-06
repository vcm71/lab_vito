import { LaboratoryExperiment } from './LaboratoryExperiment.js';
import { LaboratoryWorkspace } from './LaboratoryWorkspace.js';

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

  return { ...value };
}

function normalizeWorkspace(workspace) {
  if (!workspace || typeof workspace !== 'object') {
    throw new TypeError('LaboratoryWorkspaceBuilder: workspace is required.');
  }

  return workspace instanceof LaboratoryWorkspace ? workspace : new LaboratoryWorkspace(workspace);
}

function normalizeExperiment(experiment) {
  if (!experiment || typeof experiment !== 'object') {
    throw new TypeError('LaboratoryWorkspaceBuilder: experiment is required.');
  }

  return experiment instanceof LaboratoryExperiment ? experiment : new LaboratoryExperiment(experiment);
}

function experimentIdOf(experiment) {
  return experiment?.experimentId ?? experiment?.id ?? null;
}

export class LaboratoryWorkspaceBuilder {
  constructor(options = {}) {
    this.metadata = freezeObject(options.metadata);
    this.provenance = freezeObject(options.provenance);
    Object.freeze(this);
  }

  build(options = {}) {
    const workspaceId = options.workspaceId ?? options.id ?? null;
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new TypeError('LaboratoryWorkspaceBuilder: workspaceId is required and must be a string.');
    }

    const createdAt = options.createdAt ?? nowIso();
    const updatedAt = options.updatedAt ?? createdAt;

    return new LaboratoryWorkspace({
      workspaceId,
      name: options.name ?? null,
      description: options.description ?? null,
      owner: options.owner ?? null,
      experiments: freezeList((options.experiments ?? []).map(serialize).filter(Boolean)),
      metadata: freezeObject({
        ...this.metadata,
        ...(options.metadata ?? {}),
      }),
      provenance: freezeObject({
        ...this.provenance,
        ...(options.provenance ?? {}),
      }),
      createdAt,
      updatedAt,
      timestamps: freezeObject({
        createdAt,
        updatedAt,
        ...(options.timestamps ?? {}),
      }),
    });
  }

  fromJSON(json) {
    return this.build(json);
  }

  withExperiment(workspace, experiment, options = {}) {
    const current = normalizeWorkspace(workspace);
    const nextExperiment = normalizeExperiment(experiment);
    const experimentJson = serialize(nextExperiment);
    const nextExperimentId = experimentIdOf(experimentJson);

    if (!nextExperimentId) {
      throw new TypeError('LaboratoryWorkspaceBuilder: experiment must include an experimentId.');
    }

    if (current.experiments.some(item => experimentIdOf(item) === nextExperimentId)) {
      throw new Error(`LaboratoryWorkspaceBuilder: experiment "${nextExperimentId}" already exists in workspace ${current.workspaceId}.`);
    }

    if (experimentJson.workspaceId !== current.workspaceId) {
      throw new Error(`LaboratoryWorkspaceBuilder: experiment ${nextExperimentId} belongs to workspace ${experimentJson.workspaceId}, not ${current.workspaceId}.`);
    }

    return this.build({
      ...current.toJSON(),
      experiments: [...current.experiments, experimentJson],
      updatedAt: options.updatedAt ?? nowIso(),
      provenance: {
        ...current.provenance,
        experiment: experimentJson,
        observedAt: options.observedAt ?? current.provenance.observedAt ?? null,
      },
    });
  }

  validateConsistency(workspace) {
    const current = normalizeWorkspace(workspace);
    const seen = new Set();

    for (const experiment of current.experiments) {
      const experimentId = experimentIdOf(experiment);
      if (!experimentId) {
        throw new TypeError(`LaboratoryWorkspaceBuilder: every experiment in workspace ${current.workspaceId} must have an experimentId.`);
      }

      if (seen.has(experimentId)) {
        throw new Error(`LaboratoryWorkspaceBuilder: duplicate experiment "${experimentId}" found in workspace ${current.workspaceId}.`);
      }

      seen.add(experimentId);

      if (experiment.workspaceId !== current.workspaceId) {
        throw new Error(`LaboratoryWorkspaceBuilder: experiment ${experimentId} belongs to workspace ${experiment.workspaceId}, not ${current.workspaceId}.`);
      }
    }

    return {
      workspaceId: current.workspaceId,
      consistent: true,
      experimentCount: current.experiments.length,
    };
  }
}

export function defineLaboratoryWorkspaceBuilder(options = {}) {
  return new LaboratoryWorkspaceBuilder(options);
}
