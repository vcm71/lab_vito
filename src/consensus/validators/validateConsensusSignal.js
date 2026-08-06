import { CONSENSUS_SOURCE_ENGINES, SIGNAL_QUALITY, WARNING_SEVERITY } from '../constants/consensusConstants.js';
import { CONSENSUS_SIGNAL_SCHEMA } from '../contracts/consensusSignalSchema.js';
import { normalizeRouletteNumber } from '../utils/normalizeRouletteNumber.js';

const SOURCE_ENGINE_VALUES = new Set(Object.values(CONSENSUS_SOURCE_ENGINES));
const WARNING_SEVERITY_VALUES = new Set(Object.values(WARNING_SEVERITY));

function createResult() {
  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

function pushError(result, path, message) {
  result.valid = false;
  result.errors.push({ path, message });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  const output = [];
  for (const warning of warnings) {
    const key = JSON.stringify(warning);
    if (!seen.has(key)) {
      seen.add(key);
      output.push(warning);
    }
  }
  return output;
}

function validateNode(value, descriptor, path, result) {
  if (value === undefined) {
    if (descriptor.required) {
      pushError(result, path, 'Missing required value.');
    }
    return;
  }

  if (value === null) {
    if (descriptor.nullable) {
      return;
    }
    pushError(result, path, 'Null is not allowed here.');
    return;
  }

  switch (descriptor.kind) {
    case 'string': {
      if (typeof value !== 'string') {
        pushError(result, path, 'Expected a string.');
        return;
      }
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        pushError(result, path, 'Expected a boolean.');
        return;
      }
      break;
    }
    case 'number': {
      if (typeof value !== 'number') {
        pushError(result, path, 'Expected a number.');
        return;
      }
      if (!Number.isFinite(value)) {
        pushError(result, path, 'Expected a finite number.');
        return;
      }
      if (descriptor.integer && !Number.isInteger(value)) {
        pushError(result, path, 'Expected an integer.');
        return;
      }
      if (typeof descriptor.min === 'number' && value < descriptor.min) {
        pushError(result, path, `Expected a value greater than or equal to ${descriptor.min}.`);
        return;
      }
      if (typeof descriptor.max === 'number' && value > descriptor.max) {
        pushError(result, path, `Expected a value less than or equal to ${descriptor.max}.`);
        return;
      }
      break;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        pushError(result, path, 'Expected an array.');
        return;
      }
      break;
    }
    case 'object': {
      if (!isPlainObject(value)) {
        pushError(result, path, 'Expected an object.');
        return;
      }
      break;
    }
    default:
      pushError(result, path, `Unknown schema kind: ${descriptor.kind}`);
      return;
  }

  if (descriptor.enum && !descriptor.enum.includes(value)) {
    pushError(result, path, `Unexpected value: ${JSON.stringify(value)}.`);
    return;
  }

  if (typeof descriptor.check === 'function' && !descriptor.check(value)) {
    pushError(result, path, 'Custom schema check failed.');
    return;
  }

  if (descriptor.kind === 'array') {
    if (descriptor.items) {
      value.forEach((item, index) => {
        validateNode(item, descriptor.items, `${path}[${index}]`, result);
      });
    }
    return;
  }

  if (descriptor.kind === 'object') {
    const allowedKeys = new Set(Object.keys(descriptor.properties ?? {}));
    if (descriptor.allowUnknown === false) {
      for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
          pushError(result, path ? `${path}.${key}` : key, 'Unknown property.');
        }
      }
    }

    for (const [key, childDescriptor] of Object.entries(descriptor.properties ?? {})) {
      validateNode(value[key], childDescriptor, path ? `${path}.${key}` : key, result);
    }
  }
}

function buildEvidenceWarnings(signal) {
  const warnings = [];
  const rawSignals = signal?.rawSignals ?? {};
  const evidence = signal?.evidence ?? {};

  if (rawSignals.delay === null) {
    warnings.push({
      code: 'DELAY_ABSENT',
      message: 'Delay no disponible por ausencia de señal.',
      severity: WARNING_SEVERITY.WARNING,
      source: 'Lab_Con',
    });
  }

  if (rawSignals.winWin === null) {
    warnings.push({
      code: 'WINWIN_ABSENT',
      message: 'Win-Win no disponible por ausencia de señal.',
      severity: WARNING_SEVERITY.WARNING,
      source: 'Lab_Con1',
    });
  }

  if (rawSignals.pci === null) {
    warnings.push({
      code: 'PCI_ABSENT',
      message: 'PCI no disponible por ausencia de señal.',
      severity: WARNING_SEVERITY.WARNING,
      source: 'AtRep',
    });
  }

  if (evidence.supportCount === 0) {
    warnings.push({
      code: 'SUPPORT_COUNT_ZERO',
      message: 'supportCount = 0.',
      severity: WARNING_SEVERITY.WARNING,
      source: 'Consensus',
    });
  }

  if (evidence.historyLength === 0) {
    warnings.push({
      code: 'HISTORY_LENGTH_ZERO',
      message: 'historyLength = 0.',
      severity: WARNING_SEVERITY.WARNING,
      source: 'Consensus',
    });
  }

  if (rawSignals.pci && (rawSignals.pci.occurrences < 2 || rawSignals.pci.pciIndividual === null)) {
    warnings.push({
      code: 'PCI_INSUFFICIENT_SAMPLE',
      message: 'PCI individual no disponible por muestra insuficiente.',
      severity: WARNING_SEVERITY.WARNING,
      source: 'AtRep',
    });
  }

  if (evidence.signalQuality === SIGNAL_QUALITY.INSUFFICIENT) {
    warnings.push({
      code: 'SIGNAL_QUALITY_INSUFFICIENT',
      message: 'La calidad de señal es insuficiente.',
      severity: WARNING_SEVERITY.INFO,
      source: 'Consensus',
    });
  }

  return warnings;
}

function validateWarningsStructure(warnings, result) {
  if (!Array.isArray(warnings)) {
    pushError(result, 'metadata.warnings', 'Expected an array of warnings.');
    return;
  }

  warnings.forEach((warning, index) => {
    const path = `metadata.warnings[${index}]`;
    if (!isPlainObject(warning)) {
      pushError(result, path, 'Expected a warning object.');
      return;
    }

    const allowedKeys = new Set(['code', 'message', 'severity', 'source']);
    for (const key of Object.keys(warning)) {
      if (!allowedKeys.has(key)) {
        pushError(result, `${path}.${key}`, 'Unknown warning property.');
      }
    }

    if (typeof warning.code !== 'string' || warning.code.length === 0) {
      pushError(result, `${path}.code`, 'Warning code must be a non-empty string.');
    }
    if (typeof warning.message !== 'string' || warning.message.length === 0) {
      pushError(result, `${path}.message`, 'Warning message must be a non-empty string.');
    }
    if (typeof warning.severity !== 'string' || !WARNING_SEVERITY_VALUES.has(warning.severity)) {
      pushError(result, `${path}.severity`, 'Warning severity is invalid.');
    }
    if (warning.source !== undefined && warning.source !== null && typeof warning.source !== 'string') {
      pushError(result, `${path}.source`, 'Warning source must be a string when present.');
    }
  });
}

function validateProvenanceStructure(provenance, result) {
  if (!Array.isArray(provenance)) {
    pushError(result, 'metadata.provenance', 'Expected an array of provenance entries.');
    return;
  }

  provenance.forEach((entry, index) => {
    const path = `metadata.provenance[${index}]`;
    if (!isPlainObject(entry)) {
      pushError(result, path, 'Expected a provenance object.');
      return;
    }

    const allowedKeys = new Set(['engine', 'file', 'method', 'version']);
    for (const key of Object.keys(entry)) {
      if (!allowedKeys.has(key)) {
        pushError(result, `${path}.${key}`, 'Unknown provenance property.');
      }
    }

    if (typeof entry.engine !== 'string' || !SOURCE_ENGINE_VALUES.has(entry.engine)) {
      pushError(result, `${path}.engine`, 'Provenance engine is invalid.');
    }
    if (typeof entry.file !== 'string' || entry.file.length === 0) {
      pushError(result, `${path}.file`, 'Provenance file must be a non-empty string.');
    }
    if (typeof entry.method !== 'string' || entry.method.length === 0) {
      pushError(result, `${path}.method`, 'Provenance method must be a non-empty string.');
    }
    if (entry.version !== undefined && entry.version !== null && typeof entry.version !== 'string') {
      pushError(result, `${path}.version`, 'Provenance version must be a string or null when present.');
    }
  });
}

export function validateConsensusSignal(signal) {
  const result = createResult();

  if (!isPlainObject(signal)) {
    pushError(result, '', 'Consensus signal must be a plain object.');
    return result;
  }

  validateNode(signal, CONSENSUS_SIGNAL_SCHEMA, '', result);

  if (result.errors.length === 0) {
    validateWarningsStructure(signal.metadata?.warnings, result);
    validateProvenanceStructure(signal.metadata?.provenance, result);

    if (signal.number !== undefined) {
      try {
        normalizeRouletteNumber(signal.number);
      } catch (error) {
        pushError(result, 'number', error.message);
      }
    }

    const metadataWarnings = Array.isArray(signal.metadata?.warnings) ? signal.metadata.warnings : [];
    const computedWarnings = buildEvidenceWarnings(signal);
    result.warnings = dedupeWarnings([...metadataWarnings, ...computedWarnings]);
  }

  return result;
}
