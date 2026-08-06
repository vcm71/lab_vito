function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
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

export class LaboratoryResult {
  constructor(options = {}) {
    this.runId = options.runId ?? null;
    this.moduleId = options.moduleId ?? null;
    this.status = options.status ?? 'success';
    this.startedAt = options.startedAt ?? null;
    this.finishedAt = options.finishedAt ?? null;
    this.context = options.context ?? null;
    this.dataset = options.dataset ?? null;
    this.output = options.output ?? null;
    this.metrics = freezeObject(options.metrics);
    this.error = serializeError(options.error ?? null);
    this.metadata = freezeObject(options.metadata);
    Object.freeze(this);
  }

  get ok() {
    return this.status === 'success';
  }

  toJSON() {
    return {
      runId: this.runId,
      moduleId: this.moduleId,
      status: this.status,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      context: this.context && typeof this.context.toJSON === 'function' ? this.context.toJSON() : this.context,
      dataset: this.dataset && typeof this.dataset.toJSON === 'function' ? this.dataset.toJSON() : this.dataset,
      output: this.output,
      metrics: { ...this.metrics },
      error: this.error ? { ...this.error } : null,
      metadata: { ...this.metadata },
    };
  }
}

export function defineLaboratoryResult(options = {}) {
  return new LaboratoryResult(options);
}
