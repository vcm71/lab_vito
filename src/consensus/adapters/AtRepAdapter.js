import {
  CONSENSUS_SOURCE_ENGINES,
  SIGNAL_QUALITY,
  WARNING_SEVERITY,
} from '../constants/consensusConstants.js';
import { createConsensusSignal } from '../consensusSignalFactory.js';
import { validateConsensusSignal } from '../validators/validateConsensusSignal.js';
import { SUBCONJUNTOS, UNIVERSO_RULETA } from '../../../atRepEngine.js';

const SOURCE_ENGINE = CONSENSUS_SOURCE_ENGINES.AT_REP;
const DEFAULT_PROVENANCE = Object.freeze([
  Object.freeze({ engine: SOURCE_ENGINE, file: 'atRepEngine.js', method: 'refresh', version: null }),
  Object.freeze({ engine: SOURCE_ENGINE, file: 'atRepEngine.js', method: 'getNumeroScores', version: null }),
  Object.freeze({ engine: SOURCE_ENGINE, file: 'atRepEngine.js', method: 'getSetDetails', version: null }),
]);
const DEFAULT_ACTIVE_SETS = Object.freeze(SUBCONJUNTOS.map(definition => definition.name));
const UNIVERSO_NUMBERS = UNIVERSO_RULETA.map(number => String(number));

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

function buildWarning(code, message, source = SOURCE_ENGINE, severity = WARNING_SEVERITY.WARNING) {
  return { code, message, severity, source };
}

function dedupeWarnings(warnings) {
  const seen = new Set();
  const output = [];

  for (const warning of warnings) {
    const key = JSON.stringify(warning);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(warning);
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

function getAvailableSetNames(engine) {
  const definitions = Array.isArray(engine?._allDefinitions) && engine._allDefinitions.length > 0
    ? engine._allDefinitions
    : SUBCONJUNTOS;

  return uniqueStrings(definitions.map(definition => definition.name));
}

function normalizeActiveSets(activeSets, availableSetNames) {
  const source = Array.isArray(activeSets) ? activeSets : [];
  const available = new Set(availableSetNames);
  const normalized = [];
  const invalid = [];

  for (const setName of source) {
    if (typeof setName !== 'string' || setName.length === 0) {
      invalid.push(setName);
      continue;
    }

    if (!available.has(setName)) {
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
  if (Array.isArray(engine?._spins)) {
    return engine._spins;
  }

  if (engine?.domainTracker && typeof engine.domainTracker.getSpins === 'function') {
    const spins = engine.domainTracker.getSpins();
    return Array.isArray(spins) ? spins : [];
  }

  return [];
}

function getMatchingSetDetails(engine, activeSets, number) {
  const rawDetails = typeof engine?.getSetDetails === 'function'
    ? engine.getSetDetails(activeSets)
    : null;
  const setDetails = Array.isArray(rawDetails?.setDetails) ? rawDetails.setDetails : [];
  const key = String(number);
  const matchingSetDetails = setDetails.filter(detail => Array.isArray(detail.numberScores)
    && detail.numberScores.some(score => String(score.number) === key));

  return {
    matchingSetNames: matchingSetDetails
      .map(detail => detail.name)
      .filter(name => typeof name === 'string' && name.length > 0),
    matchingSetDetails,
  };
}

function buildPciSignal(engine, number, activeSets, scoreMap, context = {}) {
  const { invalidActiveSets = [], sampleSize = 0, historyLength = 0, hasTrackerSpins = false } = context;
  const { matchingSetNames, matchingSetDetails } = getMatchingSetDetails(engine, activeSets, number);
  const key = String(number);
  const score = scoreMap[key] ?? null;
  const numberResult = typeof engine?._numberResults?.[key] === 'object' && engine._numberResults[key] !== null
    ? engine._numberResults[key]
    : null;

  const occurrences = Number.isFinite(numberResult?.occurrences) ? numberResult.occurrences : 0;
  const meanDist = Number.isFinite(numberResult?.meanDist) ? numberResult.meanDist : null;
  const expectedDist = Number.isFinite(numberResult?.expectedDist) ? numberResult.expectedDist : null;
  const pciIndividual = Number.isFinite(score?.individualPci)
    ? score.individualPci
    : (Number.isFinite(numberResult?.pci) ? numberResult.pci : null);
  const pciCombined = Number.isFinite(score?.groupPci)
    ? score.groupPci
    : (Number.isFinite(score?.pci)
      ? score.pci
      : (Number.isFinite(numberResult?.pci) ? numberResult.pci : null));

  const pciBySet = matchingSetDetails.map(detail => {
    const setScore = Array.isArray(detail.numberScores)
      ? detail.numberScores.find(candidate => String(candidate.number) === key)
      : null;

    return {
      set: detail.name || detail.label || String(number),
      pci: Number.isFinite(setScore?.pci) ? setScore.pci : null,
    };
  });

  const warnings = [
    buildWarning('ATREP_DELAY_UNAVAILABLE', 'AtRep no expone delay; la señal se mantiene en null.', SOURCE_ENGINE),
    buildWarning('ATREP_WINWIN_UNAVAILABLE', 'AtRep no expone winWin; la señal se mantiene en null.', SOURCE_ENGINE),
  ];

  if (!hasTrackerSpins) {
    warnings.push(buildWarning('ATREP_HISTORY_UNAVAILABLE', 'No se pudo leer historial de spins desde el tracker asociado a AtRep.', SOURCE_ENGINE));
  }

  if (invalidActiveSets.length > 0) {
    warnings.push(buildWarning('ATREP_INVALID_ACTIVE_SET', `Se ignoraron conjuntos inválidos: ${invalidActiveSets.join(', ')}.`, SOURCE_ENGINE));
  }

  if (matchingSetNames.length === 0) {
    warnings.push(buildWarning('ATREP_NO_MATCHING_SETS', 'No hay conjuntos válidos que expliquen la señal para este número.', SOURCE_ENGINE));
  }

  if (occurrences < 2 || pciIndividual === null) {
    warnings.push(buildWarning('ATREP_MISSING_INDIVIDUAL_PCI', 'AtRep no puede calcular PCI individual suficiente para este número.', SOURCE_ENGINE));
  }

  if (meanDist === null) {
    warnings.push(buildWarning('ATREP_MISSING_MEAN_DISTANCE', 'AtRep no puede calcular la distancia media observada para este número.', SOURCE_ENGINE));
  }

  if (expectedDist === null) {
    warnings.push(buildWarning('ATREP_MISSING_EXPECTED_DISTANCE', 'AtRep no puede calcular la distancia esperada para este número.', SOURCE_ENGINE));
  }

  if (pciCombined === null) {
    warnings.push(buildWarning('ATREP_MISSING_COMBINED_PCI', 'AtRep no puede calcular PCI combinado para este número.', SOURCE_ENGINE));
  }

  const signal = createConsensusSignal(number, {
    sourceEngines: [SOURCE_ENGINE],
    rawSignals: {
      delay: null,
      winWin: null,
      pci: {
        occurrences,
        meanDist,
        expectedDist,
        pciIndividual,
        pciCombined,
        pciBySet,
      },
    },
    evidence: {
      occurrences,
      sampleSize,
      activeSets: matchingSetNames,
      windowSize: Number.isFinite(engine?._windowSize) ? engine._windowSize : 0,
      historyLength,
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

export class AtRepAdapter {
  constructor(engine, options = {}) {
    if (!engine || typeof engine !== 'object') {
      throw new TypeError('AtRepAdapter: engine must be an AtRepEngine instance.');
    }

    this.engine = engine;
    this.defaultActiveSets = Array.isArray(options.activeSets) && options.activeSets.length > 0
      ? uniqueStrings(options.activeSets)
      : [...DEFAULT_ACTIVE_SETS];
  }

  adapt(activeSets = this.defaultActiveSets) {
    const requestedActiveSets = arguments.length === 0 ? this.defaultActiveSets : activeSets;

    if (typeof this.engine.refresh === 'function') {
      this.engine.refresh();
    }

    const availableSetNames = getAvailableSetNames(this.engine);
    const { activeSets: normalizedActiveSets, invalidActiveSets } = normalizeActiveSets(requestedActiveSets, availableSetNames);
    const effectiveActiveSets = normalizedActiveSets;
    const spins = getTrackerSpins(this.engine);
    const sampleSize = spins.length;
    const historyLength = Number.isFinite(this.engine?._totalSampleSize) ? this.engine._totalSampleSize : sampleSize;
    const scoreMap = typeof this.engine.getNumeroScores === 'function'
      ? Object.fromEntries(this.engine.getNumeroScores(effectiveActiveSets).map(score => [String(score.number), score]))
      : {};

    return UNIVERSO_NUMBERS.map(number => buildPciSignal(this.engine, number, effectiveActiveSets, scoreMap, {
      invalidActiveSets,
      sampleSize,
      historyLength,
      hasTrackerSpins: sampleSize > 0,
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
