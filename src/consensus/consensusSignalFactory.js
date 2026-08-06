import { CONSENSUS_SCHEMA_VERSION, SIGNAL_QUALITY } from './constants/consensusConstants.js';
import { validateConsensusSignal } from './validators/validateConsensusSignal.js';
import { normalizeRouletteNumber } from './utils/normalizeRouletteNumber.js';
import { cloneConsensusSignal } from './utils/cloneConsensusSignal.js';

function createBaseSignal(number) {
  const missingSignals = ['delay', 'winWin', 'pci'];

  return {
    schemaVersion: CONSENSUS_SCHEMA_VERSION,
    number,
    sourceEngines: [],
    rawSignals: {
      delay: null,
      winWin: null,
      pci: null,
    },
    evidence: {
      occurrences: 0,
      sampleSize: 0,
      activeSets: [],
      windowSize: 0,
      historyLength: 0,
      supportCount: 0,
      signalQuality: SIGNAL_QUALITY.INSUFFICIENT,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      valid: false,
      warnings: [],
      missingSignals,
      provenance: [],
    },
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, source) {
  if (!isPlainObject(source)) {
    return target;
  }

  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value)) {
      if (!isPlainObject(target[key])) {
        target[key] = {};
      }
      deepMerge(target[key], value);
      continue;
    }

    if (Array.isArray(value)) {
      target[key] = cloneConsensusSignal(value);
      continue;
    }

    target[key] = value;
  }

  return target;
}

function refreshDerivedFields(signal) {
  signal.schemaVersion = CONSENSUS_SCHEMA_VERSION;
  signal.number = normalizeRouletteNumber(signal.number);
  signal.metadata.generatedAt = new Date().toISOString();
  signal.metadata.valid = false;
  signal.metadata.missingSignals = [
    ...(signal.rawSignals?.delay === null ? ['delay'] : []),
    ...(signal.rawSignals?.winWin === null ? ['winWin'] : []),
    ...(signal.rawSignals?.pci === null ? ['pci'] : []),
  ];
  if (!Array.isArray(signal.metadata.warnings)) {
    signal.metadata.warnings = [];
  }
  if (!Array.isArray(signal.metadata.provenance)) {
    signal.metadata.provenance = [];
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}

export function createConsensusSignal(number, overrides = {}) {
  if (!isPlainObject(overrides)) {
    throw new TypeError('createConsensusSignal: overrides must be a plain object.');
  }

  const { freeze = false, ...restOverrides } = cloneConsensusSignal(overrides);
  const normalizedNumber = normalizeRouletteNumber(number);
  const signal = createBaseSignal(normalizedNumber);

  deepMerge(signal, restOverrides);
  refreshDerivedFields(signal);

  if (Object.prototype.hasOwnProperty.call(restOverrides, 'schemaVersion')) {
    throw new Error('createConsensusSignal: schemaVersion cannot be overridden.');
  }
  if (Object.prototype.hasOwnProperty.call(restOverrides, 'number')) {
    throw new Error('createConsensusSignal: number cannot be overridden.');
  }

  const validation = validateConsensusSignal(signal);
  if (!validation.valid) {
    const errorSummary = validation.errors.map(entry => `${entry.path || '<root>'}: ${entry.message}`).join('; ');
    throw new Error(`createConsensusSignal: invalid override payload (${errorSummary})`);
  }

  if (freeze) {
    deepFreeze(signal);
  }

  return signal;
}
