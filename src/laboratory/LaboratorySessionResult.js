function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function serializeEntry(entry) {
  if (!entry) return null;
  if (typeof entry.toJSON === 'function') return entry.toJSON();
  return { ...entry };
}

export class LaboratorySessionResult {
  constructor(options = {}) {
    this.session = options.session ?? null;
    this.sessionId = options.sessionId ?? options.session?.sessionId ?? null;
    this.status = options.status ?? 'COMPLETED';
    this.startedAt = options.startedAt ?? null;
    this.finishedAt = options.finishedAt ?? null;
    this.durationMs = options.durationMs ?? null;
    this.modulesExecuted = freezeList(options.modulesExecuted);
    this.moduleResults = freezeList((options.moduleResults ?? []).map(serializeEntry));
    this.results = freezeList((options.results ?? []).map(serializeEntry));
    this.metrics = freezeObject(options.metrics);
    this.errors = freezeList((options.errors ?? []).map(serializeEntry));
    this.metadata = freezeObject(options.metadata);
    Object.freeze(this);
  }

  get ok() {
    return this.status === 'COMPLETED' && this.errors.length === 0;
  }

  toJSON() {
    return {
      session: this.session && typeof this.session.toJSON === 'function' ? this.session.toJSON() : this.session,
      sessionId: this.sessionId,
      status: this.status,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      durationMs: this.durationMs,
      modulesExecuted: [...this.modulesExecuted],
      moduleResults: this.moduleResults.map(serializeEntry),
      results: this.results.map(serializeEntry),
      metrics: { ...this.metrics },
      errors: this.errors.map(serializeEntry),
      metadata: { ...this.metadata },
    };
  }
}

export function defineLaboratorySessionResult(options = {}) {
  return new LaboratorySessionResult(options);
}
