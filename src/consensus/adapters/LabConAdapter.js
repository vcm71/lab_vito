import { CONSENSUS_SOURCE_ENGINES, SIGNAL_QUALITY, WARNING_SEVERITY } from '../constants/consensusConstants.js';
import { createConsensusSignal } from '../consensusSignalFactory.js';
import { validateConsensusSignal } from '../validators/validateConsensusSignal.js';
import { SUBCONJUNTOS, UNIVERSO_RULETA } from '../../../labEngine.js';
import { rouletteSettingsStore } from '../../../rouletteSettingsStore.js';

const SOURCE_ENGINE = CONSENSUS_SOURCE_ENGINES.LAB_CON;
const DEFAULT_PROVENANCE = Object.freeze([
  Object.freeze({
    engine: SOURCE_ENGINE,
    file: 'labEngine.js',
    method: 'getSetDetails',
    version: null,
  }),
  Object.freeze({
    engine: SOURCE_ENGINE,
    file: 'labEngine.js',
    method: 'resolverScoresIndividuales',
    version: null,
  }),
]);

const DEFAULT_ACTIVE_SETS = Object.freeze(Object.keys(SUBCONJUNTOS));
const UNIVERSO_NUMBERS = Object.freeze(Array.from(UNIVERSO_RULETA));

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueStrings(values) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    if (typeof value !== 'string' || value.length === 0 || seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
}

function cloneShallow(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(item => (isPlainObject(item) ? { ...item } : item));
}

function getTrackerSpins(engine) {
  const tracker = engine?.tracker;
  if (!tracker || typeof tracker.getSpins !== 'function') {
    return [];
  }

  const spins = tracker.getSpins();
  return cloneShallow(spins);
}

function buildWarning(code, message, source = SOURCE_ENGINE, severity = WARNING_SEVERITY.WARNING) {
  return { code, message, severity, source };
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

function resolveSignalQuality({ sampleSize, supportCount }) {
  if (sampleSize <= 0 || supportCount <= 0) {
    return SIGNAL_QUALITY.INSUFFICIENT;
  }

  if (supportCount === 1 || sampleSize < 10) {
    return SIGNAL_QUALITY.LOW;
  }

  if (supportCount < 4 || sampleSize < 30) {
    return SIGNAL_QUALITY.MEDIUM;
  }

  return SIGNAL_QUALITY.HIGH;
}

function getWindowSize() {
  const snapshot = rouletteSettingsStore.getSnapshot();
  return Number.isFinite(snapshot.atrasosMaxWindow) ? Math.max(0, Math.floor(snapshot.atrasosMaxWindow)) : 100;
}

function normalizeActiveSets(activeSets) {
  const source = Array.isArray(activeSets) ? activeSets : [];
  const normalized = [];
  const invalid = [];

  for (const setName of source) {
    if (typeof setName !== 'string' || setName.length === 0) {
      invalid.push(setName);
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(SUBCONJUNTOS, setName)) {
      invalid.push(setName);
      continue;
    }

    normalized.push(setName);
  }

  return {
    activeSets: uniqueStrings(normalized),
    invalidActiveSets: invalid.filter(value => typeof value === 'string' && value.length > 0),
  };
}

function getMatchingSetDetails(activeSetNames, number, engine) {
  const matchingSetNames = activeSetNames.filter(setName => SUBCONJUNTOS[setName]?.has(number));
  if (matchingSetNames.length === 0 || !engine || typeof engine.getSetDetails !== 'function') {
    return {
      matchingSetNames,
      setDetails: [],
    };
  }

  const setDetails = engine.getSetDetails(matchingSetNames);
  return {
    matchingSetNames,
    setDetails: Array.isArray(setDetails) ? setDetails : [],
  };
}

function summarizeDelaySignal(number, setDetails, scoreMap) {
  if (setDetails.length === 0) {
    return null;
  }

  const actualDelay = Math.max(...setDetails.map(detail => (Number.isFinite(detail.actualDelay) ? detail.actualDelay : 0)));
  const maxDelay = Math.max(...setDetails.map(detail => (Number.isFinite(detail.maxDelay) ? detail.maxDelay : 0)));
  const delayRatio = maxDelay > 0 ? actualDelay / maxDelay : null;
  const delayScore = Number.isFinite(scoreMap[number])
    ? scoreMap[number]
    : (() => {
        const weights = setDetails.map(detail => detail.weight).filter(weight => Number.isFinite(weight));
        return weights.length > 0 ? Math.max(...weights) : null;
      })();
  const probabilityDelayValues = setDetails.map(detail => detail.hitProbability).filter(value => Number.isFinite(value));
  const pressureValues = setDetails.map(detail => detail.pressure).filter(value => Number.isFinite(value));

  return {
    actualDelay,
    maxDelay,
    delayRatio,
    delayScore,
    probabilityDelay: probabilityDelayValues.length > 0
      ? probabilityDelayValues.reduce((total, value) => total + value, 0) / probabilityDelayValues.length
      : null,
    pressure: pressureValues.length > 0 ? Math.max(...pressureValues) : null,
    activeSets: setDetails.map(detail => detail.name).filter(name => typeof name === 'string' && name.length > 0),
  };
}

function buildMetadataWarnings({ invalidActiveSets, matchingSetNames, hasTrackerSpins }) {
  const warnings = [
    buildWarning('WINWIN_ABSENT', 'Win-Win no está disponible desde Lab_Con; la señal se mantiene en null.', SOURCE_ENGINE),
    buildWarning('PCI_ABSENT', 'PCI no está disponible desde Lab_Con; la señal se mantiene en null.', SOURCE_ENGINE),
  ];

  if (!hasTrackerSpins) {
    warnings.push(buildWarning('LABCON_HISTORY_UNAVAILABLE', 'No se pudo leer historial de spins desde el tracker asociado a Lab_Con.', SOURCE_ENGINE));
  }

  if (invalidActiveSets.length > 0) {
    warnings.push(buildWarning('LABCON_INVALID_ACTIVE_SET', `Se ignoraron conjuntos inválidos: ${invalidActiveSets.join(', ')}.`, SOURCE_ENGINE));
  }

  if (matchingSetNames.length === 0) {
    warnings.push(buildWarning('LABCON_NO_MATCHING_SETS', 'No hay conjuntos válidos que expliquen la señal para este número.', SOURCE_ENGINE));
  }

  return warnings;
}

function buildConsensusSignalForNumber(engine, number, activeSets, context = {}) {
  const { invalidActiveSets = [], scoreMap = {}, hasTrackerSpins = false, sampleSize = 0 } = context;
  const { matchingSetNames, setDetails } = getMatchingSetDetails(activeSets, number, engine);
  const delaySignal = summarizeDelaySignal(number, setDetails, scoreMap);
  const evidenceSampleSize = hasTrackerSpins ? sampleSize : 0;
  const evidenceSupportCount = matchingSetNames.length;
  const evidenceWindowSize = getWindowSize();
  const evidenceHistoryLength = evidenceSampleSize;
  const evidenceSignalQuality = resolveSignalQuality({
    sampleSize: evidenceSampleSize,
    supportCount: evidenceSupportCount,
  });

  const signal = createConsensusSignal(number, {
    sourceEngines: [SOURCE_ENGINE],
    rawSignals: {
      delay: delaySignal,
      winWin: null,
      pci: null,
    },
    evidence: {
      occurrences: evidenceSupportCount,
      sampleSize: evidenceSampleSize,
      activeSets: matchingSetNames,
      windowSize: evidenceWindowSize,
      historyLength: evidenceHistoryLength,
      supportCount: evidenceSupportCount,
      signalQuality: evidenceSignalQuality,
    },
    metadata: {
      warnings: dedupeWarnings(buildMetadataWarnings({ invalidActiveSets, matchingSetNames, hasTrackerSpins })),
      provenance: DEFAULT_PROVENANCE,
    },
  });

  const validation = validateConsensusSignal(signal);
  signal.metadata.valid = validation.valid;
  signal.metadata.warnings = dedupeWarnings([...(signal.metadata.warnings || []), ...(validation.warnings || [])]);

  return signal;
}

export class LabConAdapter {
  constructor(engine, options = {}) {
    if (!engine || typeof engine !== 'object') {
      throw new TypeError('LabConAdapter: engine must be a LabEngine instance.');
    }

    this.engine = engine;
    this.defaultActiveSets = Array.isArray(options.activeSets) && options.activeSets.length > 0
      ? uniqueStrings(options.activeSets.filter(setName => Object.prototype.hasOwnProperty.call(SUBCONJUNTOS, setName)))
      : [...DEFAULT_ACTIVE_SETS];
    this.topK = Number.isFinite(options.topK) && options.topK > 0 ? Math.floor(options.topK) : 5;
  }

  adapt(activeSets = this.defaultActiveSets) {
    const requestedActiveSets = arguments.length === 0 ? this.defaultActiveSets : activeSets;
    const { activeSets: normalizedActiveSets, invalidActiveSets } = normalizeActiveSets(requestedActiveSets);
    const effectiveActiveSets = normalizedActiveSets;
    const spins = getTrackerSpins(this.engine);
    const hasTrackerSpins = spins.length > 0;
    const scoreMap = typeof this.engine.resolverScoresIndividuales === 'function'
      ? this.engine.resolverScoresIndividuales(effectiveActiveSets)
      : {};

    return UNIVERSO_NUMBERS.map(number => buildConsensusSignalForNumber(this.engine, number, effectiveActiveSets, {
      invalidActiveSets,
      scoreMap,
      hasTrackerSpins,
      sampleSize: spins.length,
    }));
  }

  toConsensusSignals(activeSets = this.defaultActiveSets) {
    return this.adapt(activeSets);
  }

  build(activeSets = this.defaultActiveSets) {
    return this.adapt(activeSets);
  }

  getConsensusSignals(activeSets = this.defaultActiveSets) {
    return this.adapt(activeSets);
  }
}
