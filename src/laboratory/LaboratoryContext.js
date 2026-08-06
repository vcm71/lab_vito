function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

export class LaboratoryContext {
  constructor(options = {}) {
    this.configuration = freezeObject(options.configuration);
    this.module = options.module ?? null;
    this.moduleId = options.moduleId ?? null;
    this.dataset = options.dataset ?? null;
    this.runId = options.runId ?? null;
    this.session = options.session ?? null;
    this.sessionId = options.sessionId ?? null;
    this.step = options.step ?? null;
    this.stepIndex = options.stepIndex ?? null;
    this.executionPlan = Object.freeze([...(options.executionPlan ?? [])]);
    this.parameters = freezeObject(options.parameters);
    this.evaluationMode = options.evaluationMode ?? 'execution';
    this.metadata = freezeObject(options.metadata);
    this.futureExtensions = freezeObject(options.futureExtensions);
    this.capabilities = Object.freeze([...(options.capabilities ?? [])]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      configuration: { ...this.configuration },
      module: this.module && typeof this.module.toJSON === 'function' ? this.module.toJSON() : this.module,
      moduleId: this.moduleId,
      dataset: this.dataset && typeof this.dataset.toJSON === 'function' ? this.dataset.toJSON() : this.dataset,
      runId: this.runId,
      session: this.session && typeof this.session.toJSON === 'function' ? this.session.toJSON() : this.session,
      sessionId: this.sessionId,
      step: this.step,
      stepIndex: this.stepIndex,
      executionPlan: [...this.executionPlan],
      parameters: { ...this.parameters },
      evaluationMode: this.evaluationMode,
      metadata: { ...this.metadata },
      futureExtensions: { ...this.futureExtensions },
      capabilities: [...this.capabilities],
    };
  }
}

export function defineLaboratoryContext(options = {}) {
  return new LaboratoryContext(options);
}
