function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function serialize(value) {
  if (!value) return null;
  if (typeof value.toJSON === 'function') return value.toJSON();
  return { ...value };
}

export class LaboratoryEvidenceReport {
  constructor(options = {}) {
    this.reportId = options.reportId ?? options.id ?? null;
    this.title = options.title ?? 'Laboratory evidence report';
    this.comparisons = freezeList((options.comparisons ?? []).map(serialize));
    this.sessions = freezeList((options.sessions ?? []).map(serialize));
    this.results = freezeList((options.results ?? []).map(serialize));
    this.differences = freezeObject(options.differences);
    this.metrics = freezeObject(options.metrics);
    this.traceability = freezeObject(options.traceability);
    this.reproducibility = freezeObject(options.reproducibility);
    this.observations = freezeList(options.observations);
    this.metadata = freezeObject(options.metadata);
    this.timestamps = freezeObject(options.timestamps);
    Object.freeze(this);
  }

  toJSON() {
    return {
      reportId: this.reportId,
      title: this.title,
      comparisons: [...this.comparisons],
      sessions: [...this.sessions],
      results: [...this.results],
      differences: { ...this.differences },
      metrics: { ...this.metrics },
      traceability: { ...this.traceability },
      reproducibility: { ...this.reproducibility },
      observations: [...this.observations],
      metadata: { ...this.metadata },
      timestamps: { ...this.timestamps },
    };
  }
}

export function defineLaboratoryEvidenceReport(options = {}) {
  return new LaboratoryEvidenceReport(options);
}
