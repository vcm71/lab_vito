function freezeList(value) {
  return Object.freeze([...(value ?? [])]);
}

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

export function defineLaboratoryMetric(descriptor = {}) {
  const {
    id,
    name,
    description = '',
    compute,
    category = 'general',
    unit = null,
    direction = 'maximize',
    tags = [],
    metadata = {},
  } = descriptor;

  if (!id || typeof id !== 'string') {
    throw new TypeError('LaboratoryMetric: id is required and must be a string.');
  }

  if (!name || typeof name !== 'string') {
    throw new TypeError('LaboratoryMetric: name is required and must be a string.');
  }

  if (typeof compute !== 'function') {
    throw new TypeError('LaboratoryMetric: compute must be a function.');
  }

  return Object.freeze({
    id,
    name,
    description,
    category,
    unit,
    direction,
    tags: freezeList(tags),
    metadata: freezeObject(metadata),
    compute,
  });
}

export class LaboratoryMetric {
  constructor(descriptor = {}) {
    const metric = defineLaboratoryMetric(descriptor);
    Object.assign(this, metric);
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      unit: this.unit,
      direction: this.direction,
      tags: [...this.tags],
      metadata: { ...this.metadata },
    };
  }
}
