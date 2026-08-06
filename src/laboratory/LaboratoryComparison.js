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

export class LaboratoryComparison {
  constructor(options = {}) {
    const comparisonId = options.comparisonId ?? options.id ?? null;
    if (!comparisonId || typeof comparisonId !== 'string') {
      throw new TypeError('LaboratoryComparison: comparisonId is required and must be a string.');
    }

    this.comparisonId = comparisonId;
    this.leftSession = serialize(options.leftSession ?? options.left ?? null);
    this.rightSession = serialize(options.rightSession ?? options.right ?? null);
    this.sessions = freezeList((options.sessions ?? [this.leftSession, this.rightSession]).map(serialize));
    this.criteria = freezeList(options.criteria);
    this.metrics = freezeObject(options.metrics);
    this.differences = freezeObject(options.differences);
    this.conclusions = freezeList(options.conclusions);
    this.metadata = freezeObject(options.metadata);
    this.timestamps = freezeObject(options.timestamps);
    this.comparisonType = options.comparisonType ?? 'session-result';
    Object.freeze(this);
  }

  toJSON() {
    return {
      comparisonId: this.comparisonId,
      comparisonType: this.comparisonType,
      leftSession: this.leftSession,
      rightSession: this.rightSession,
      sessions: [...this.sessions],
      criteria: [...this.criteria],
      metrics: { ...this.metrics },
      differences: { ...this.differences },
      conclusions: [...this.conclusions],
      metadata: { ...this.metadata },
      timestamps: { ...this.timestamps },
    };
  }
}

export function defineLaboratoryComparison(options = {}) {
  return new LaboratoryComparison(options);
}
