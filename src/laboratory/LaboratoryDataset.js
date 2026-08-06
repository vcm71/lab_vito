function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

export class LaboratoryDataset {
  constructor(options = {}) {
    this.id = options.id ?? null;
    this.datasetVersion = options.datasetVersion ?? 'unversioned';
    this.records = Object.freeze([...(options.records ?? [])]);
    this.metadata = freezeObject(options.metadata);
    this.createdAt = options.createdAt ?? new Date().toISOString();
    this.recordCount = this.records.length;
    Object.freeze(this);
  }

  [Symbol.iterator]() {
    return this.records[Symbol.iterator]();
  }

  slice(start, end) {
    return new LaboratoryDataset({
      id: this.id ? `${this.id}_slice_${start}_${end}` : null,
      datasetVersion: this.datasetVersion,
      records: this.records.slice(start, end),
      metadata: { ...this.metadata, parentDataset: this.id },
    });
  }

  toJSON() {
    return {
      id: this.id,
      datasetVersion: this.datasetVersion,
      records: [...this.records],
      metadata: { ...this.metadata },
      createdAt: this.createdAt,
      recordCount: this.recordCount,
    };
  }
}

export function defineLaboratoryDataset(options = {}) {
  return new LaboratoryDataset(options);
}
