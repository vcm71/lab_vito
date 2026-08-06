import { CONSENSUS_SOURCE_ENGINES, SIGNAL_QUALITY, WARNING_SEVERITY } from '../constants/consensusConstants.js';
import { createConsensusSignal } from '../consensusSignalFactory.js';
import { validateConsensusSignal } from '../validators/validateConsensusSignal.js';
import { SUBCONJUNTOS, UNIVERSO_RULETA } from '../../../labCon1Engine.js';
import { rouletteSettingsStore } from '../../../rouletteSettingsStore.js';

const SOURCE_ENGINE = CONSENSUS_SOURCE_ENGINES.LAB_CON_1;
const DEFAULT_PROVENANCE = Object.freeze([
  Object.freeze({
    engine: SOURCE_ENGINE,
    file: 'labCon1Engine.js',
    method: 'getSetDetails',
    version: null,
  }),
  Object.freeze({
    engine: SOURCE_ENGINE,
    file: 'labCon1Engine.js',
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

function cloneShallowArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(item => (isPlainObject(item) ? { ...item } : item));
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

function getWindowSize() {
  const snapshot = rouletteSettingsStore.getSnapshot();
  return Number.isFinite(snapshot.atrasosMaxWindow)
    ? Math.max(0, Math.floor(snapshot.atrasosMaxWindow))
    : 100;
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

function getTrackerSpins(engine) {
  const tracker = engine?.tracker;
  if (!tracker || typeof tracker.getSpins !== 'function') {
    return [];
  }

  return cloneShallowArray(tracker.getSpins());
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

function parseLevelToStreakLength(level) {
  if (typeof level !== 'string' || level.length === 0) {
    return 0;
  }

  if (level === 'WIN') {
    return 1;
  }

  const match = level.match(/^WIN-WIN\((\d+)\)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) + 2;
}

function buildWinWinSignal(number, engine, activeSets, context = {}) {
  const { invalidActiveSets = [], scoreMap = {}, sampleSize = 0, hasTrackerSpins = false } = context;
  const { matchingSetNames, setDetails } = getMatchingSetDetails(activeSets, number, engine);
  const selectedDetail = setDetails[0] ?? null;
  const score = Number.isFinite(scoreMap[number]) ? scoreMap[number] : null;
  const hasDetail = Boolean(selectedDetail);
  const thresholdAvailable = false;
  const levelAvailable = typeof selectedDetail?.level === 'string' ? selectedDetail.level : null;
  const isActive = hasDetail ? Boolean(selectedDetail.isActive) : false;
  const actualDelay = hasDetail && Number.isFinite(selectedDetail.actualDelay)
    ? selectedDetail.actualDelay
    : 0;
  const streakLength = parseLevelToStreakLength(levelAvailable);

  const warnings = [
    buildWarning('LABCON1_THRESHOLD_UNAVAILABLE', 'Lab_Con1 no expone threshold público; se usa 0 como valor neutral.', SOURCE_ENGINE),
  ];

  if (!hasTrackerSpins) {
    warnings.push(buildWarning('LABCON1_HISTORY_UNAVAILABLE', 'No se pudo leer historial de spins desde el tracker asociado a Lab_Con1.', SOURCE_ENGINE));
  }

  if (invalidActiveSets.length > 0) {
    warnings.push(buildWarning('LABCON1_INVALID_ACTIVE_SET', `Se ignoraron conjuntos inválidos: ${invalidActiveSets.join(', ')}.`, SOURCE_ENGINE));
  }

  if (matchingSetNames.length === 0) {
    warnings.push(buildWarning('LABCON1_NO_MATCHING_SETS', 'No hay conjuntos válidos que expliquen la señal para este número.', SOURCE_ENGINE));
  }

  if (levelAvailable === null) {
    warnings.push(buildWarning('LABCON1_MISSING_LEVEL', 'Lab_Con1 no expone un level público para este número.', SOURCE_ENGINE));
  }

  if (!hasDetail) {
    warnings.push(buildWarning('LABCON1_MISSING_ACTIVE_STATE', 'Lab_Con1 no expone un estado activo público para este número.', SOURCE_ENGINE));
  }

  if (score === null) {
    warnings.push(buildWarning('LABCON1_MISSING_INDIVIDUAL_SCORE', 'Lab_Con1 no expone un score individual público para este número.', SOURCE_ENGINE));
  }

  const signal = createConsensusSignal(number, {
    sourceEngines: [SOURCE_ENGINE],
    rawSignals: {
      delay: null,
      winWin: {
        atraso: actualDelay,
        threshold: thresholdAvailable ? selectedDetail.threshold : 0,
        level: levelAvailable,
        isActive,
        streakLength,
        streakBonus: null,
        recencyBonus: null,
        winWinScore: score,
      },
      pci: null,
    },
    evidence: {
      occurrences: 0,
      sampleSize,
      activeSets: cloneShallowArray(matchingSetNames),
      windowSize: getWindowSize(),
      historyLength: sampleSize,
      supportCount: matchingSetNames.length,
      signalQuality: resolveSignalQuality({ sampleSize, supportCount: matchingSetNames.length }),
    },
    metadata: {
      warnings: dedupeWarnings(warnings),
      provenance: DEFAULT_PROVENANCE,
    },
  });

  const validation = validateConsensusSignal(signal);
  signal.metadata.valid = validation.valid;
  signal.metadata.warnings = dedupeWarnings([...(signal.metadata.warnings || []), ...(validation.warnings || [])]);

  return signal;
}

export class LabCon1Adapter {
  constructor(engine, options = {}) {
    if (!engine || typeof engine !== 'object') {
      throw new TypeError('LabCon1Adapter: engine must be a LabCon1Engine instance.');
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
    const scoreMap = typeof this.engine.resolverScoresIndividuales === 'function'
      ? this.engine.resolverScoresIndividuales(effectiveActiveSets)
      : {};

    return UNIVERSO_NUMBERS.map(number => buildWinWinSignal(number, this.engine, effectiveActiveSets, {
      invalidActiveSets,
      scoreMap,
      sampleSize: spins.length,
      hasTrackerSpins: spins.length > 0,
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
