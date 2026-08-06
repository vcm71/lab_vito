import { EngineRegistry } from '../core/EngineRegistry.js';
import { LaboratoryModuleManifest } from './LaboratoryModuleManifest.js';

function normalizeManifest(moduleOrManifest) {
  if (moduleOrManifest instanceof LaboratoryModuleManifest) {
    return moduleOrManifest;
  }

  if (moduleOrManifest?.manifest instanceof LaboratoryModuleManifest) {
    return moduleOrManifest.manifest;
  }

  if (moduleOrManifest?.manifest) {
    return new LaboratoryModuleManifest(moduleOrManifest.manifest);
  }

  return new LaboratoryModuleManifest(moduleOrManifest);
}

function pickExecutor(definition) {
  if (typeof definition.execute === 'function') return definition.execute;
  if (typeof definition.run === 'function') return definition.run;
  if (definition.implementation && typeof definition.implementation.execute === 'function') {
    return definition.implementation.execute;
  }
  if (definition.implementation && typeof definition.implementation.run === 'function') {
    return definition.implementation.run;
  }
  if (definition.adapter && typeof definition.adapter.execute === 'function') {
    return definition.adapter.execute;
  }
  return null;
}

function normalizeDefinition(moduleDefinition) {
  const manifest = normalizeManifest(moduleDefinition);
  const definition = {
    manifest,
    capabilities: [...manifest.capabilities],
    compatibility: { ...manifest.compatibility },
    supportedContracts: [...manifest.supportedContracts],
    implementation: moduleDefinition?.implementation ?? null,
    adapter: moduleDefinition?.adapter ?? null,
    contextFactory: moduleDefinition?.contextFactory ?? null,
    resultFactory: moduleDefinition?.resultFactory ?? null,
  };

  const executor = pickExecutor(moduleDefinition ?? {});
  if (executor) {
    definition.execute = executor.bind(moduleDefinition);
  }

  if (moduleDefinition?.run && typeof moduleDefinition.run === 'function') {
    definition.run = moduleDefinition.run.bind(moduleDefinition);
  }

  return Object.freeze(definition);
}

export class LaboratoryRegistry extends EngineRegistry {
  constructor(initialModules = []) {
    super();
    for (const moduleDefinition of initialModules) {
      this.register(moduleDefinition);
    }
  }

  register(moduleDefinition) {
    const definition = normalizeDefinition(moduleDefinition);
    super.register(definition.manifest.id, definition);
    return definition;
  }

  get(id) {
    return super.get(id);
  }

  list() {
    return super.getAll();
  }

  getCapabilities(id) {
    const module = this.get(id);
    return module ? [...module.capabilities] : [];
  }

  getManifest(id) {
    return this.get(id)?.manifest ?? null;
  }

  supportsContract(id, contractName) {
    const manifest = this.getManifest(id);
    return manifest ? manifest.supportsContract(contractName) : false;
  }
}
