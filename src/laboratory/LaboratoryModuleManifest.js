const DEFAULT_CONTRACTS = Object.freeze([]);

function freezeList(value) {
  if (!Array.isArray(value)) return DEFAULT_CONTRACTS;
  return Object.freeze([...new Set(value.filter(Boolean))]);
}

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

export class LaboratoryModuleManifest {
  constructor(options = {}) {
    const {
      id,
      name,
      version,
      description,
      category,
      capabilities = [],
      compatibility = {},
      supportedContracts = [],
    } = options;

    if (!id || typeof id !== 'string') {
      throw new TypeError('LaboratoryModuleManifest: id is required and must be a string.');
    }

    if (!name || typeof name !== 'string') {
      throw new TypeError('LaboratoryModuleManifest: name is required and must be a string.');
    }

    if (!version || typeof version !== 'string') {
      throw new TypeError('LaboratoryModuleManifest: version is required and must be a string.');
    }

    this.id = id;
    this.name = name;
    this.version = version;
    this.description = description ?? '';
    this.category = category ?? 'general';
    this.capabilities = freezeList(capabilities);
    this.compatibility = freezeObject(compatibility);
    this.supportedContracts = freezeList(supportedContracts);
    Object.freeze(this);
  }

  supportsContract(contractName) {
    return this.supportedContracts.includes(contractName);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      category: this.category,
      capabilities: [...this.capabilities],
      compatibility: { ...this.compatibility },
      supportedContracts: [...this.supportedContracts],
    };
  }
}

export function defineLaboratoryModuleManifest(options = {}) {
  return new LaboratoryModuleManifest(options);
}
