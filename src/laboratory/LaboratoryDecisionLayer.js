function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function normalizeDecisionType(decision) {
  if (!decision || typeof decision !== 'object') {
    throw new TypeError('LaboratoryDecisionLayer: decision is required.');
  }

  const type = decision.type ?? decision.decision ?? null;
  if (!type || typeof type !== 'string') {
    throw new TypeError('LaboratoryDecisionLayer: decision type must be a string.');
  }

  return type;
}

export class LaboratoryDecisionLayer {
  constructor(options = {}) {
    this.layerId = options.layerId ?? options.id ?? 'laboratory-decision-layer';
    this.statuses = freezeList(options.statuses ?? [
      'tie',
      'statistical-advantage',
      'significant-difference',
      'insufficient-evidence',
      'invalid-comparison',
    ]);
    this.metadata = freezeObject(options.metadata);
    Object.freeze(this);
  }

  decide(decision, details = {}) {
    const type = normalizeDecisionType(decision);
    return Object.freeze({
      type,
      label: decision.label ?? null,
      rationale: decision.rationale ?? null,
      details: freezeObject({
        ...details,
        ...(decision.details ?? {}),
      }),
      metadata: freezeObject({
        ...(decision.metadata ?? {}),
        layerId: this.layerId,
      }),
    });
  }

  toJSON() {
    return {
      layerId: this.layerId,
      statuses: [...this.statuses],
      metadata: { ...this.metadata },
    };
  }
}

export function defineLaboratoryDecisionLayer(options = {}) {
  return new LaboratoryDecisionLayer(options);
}
