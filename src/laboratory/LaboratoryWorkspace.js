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

function normalizeExperiments(experiments) {
  return freezeList((experiments ?? []).map(serialize).filter(Boolean));
}

export class LaboratoryWorkspace {
  constructor(options = {}) {
    const workspaceId = options.workspaceId ?? options.id ?? null;
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new TypeError('LaboratoryWorkspace: workspaceId is required and must be a string.');
    }

    this.workspaceId = workspaceId;
    this.name = options.name ?? null;
    this.description = options.description ?? null;
    this.owner = options.owner ?? null;
    this.experiments = normalizeExperiments(options.experiments);
    this.metadata = freezeObject(options.metadata);
    this.provenance = freezeObject(options.provenance);
    this.createdAt = options.createdAt ?? new Date().toISOString();
    this.updatedAt = options.updatedAt ?? this.createdAt;
    this.timestamps = freezeObject({
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...(options.timestamps ?? {}),
    });
    Object.freeze(this);
  }

  toJSON() {
    return {
      workspaceId: this.workspaceId,
      name: this.name,
      description: this.description,
      owner: this.owner,
      experiments: [...this.experiments],
      metadata: { ...this.metadata },
      provenance: { ...this.provenance },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      timestamps: { ...this.timestamps },
    };
  }
}

export function defineLaboratoryWorkspace(options = {}) {
  return new LaboratoryWorkspace(options);
}
