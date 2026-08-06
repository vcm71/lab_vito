/**
 * Fase 2.1 — Configuración por defecto del ConsensusEngine.
 *
 * Principios:
 *   - Pesos de motor neutrales (1:1:1) sin backtesting.
 *   - Señales seleccionadas para evitar doble conteo.
 *   - PCI individual/combinado excluido por estar fuera de [0,1].
 *   - winWin.level excluido por ser categórico no numérico.
 *   - Todos los umbrales son configurables y documentados.
 */

export const CONSENSUS_CONFIG_VERSION = 'consensus-default-v1';

export const DEFAULT_CONSENSUS_CONFIG = Object.freeze({
  mode: 'tolerant',

  aggregation: {
    strategy: 'HIERARCHICAL_WEIGHTED_MEAN',
    missingPolicy: 'RENORMALIZE_AVAILABLE',
  },

  requirements: {
    minimumEngines: 2,
    minimumCoverage: 0.4,
    minimumValidSignals: 2,
  },

  rounding: { precision: 12 },

  conflict: {
    spreadThresholds: {
      low: 0.25,
      medium: 0.40,
      high: 0.60,
    },
    conflictPenalty: {
      none: 1.0,
      low: 0.9,
      medium: 0.75,
      high: 0.5,
      blocking: 0,
    },
  },

  confidence: {
    components: {
      coverage: { weight: 0.30 },
      participation: { weight: 0.20 },
      agreement: { weight: 0.30 },
      conflict: { weight: 0.20 },
    },
    levels: {
      VERY_LOW: [0.00, 0.20],
      LOW: [0.20, 0.40],
      MEDIUM: [0.40, 0.60],
      HIGH: [0.60, 0.80],
      VERY_HIGH: [0.80, 1.00],
    },
  },

  engines: {
    Lab_Con: {
      weight: 1,
      signals: {
        'delay.delayRatio': { weight: 1, direction: 'POSITIVE' },
        'delay.delayScore': { weight: 1, direction: 'POSITIVE' },
        'delay.pressure': { weight: 1, direction: 'POSITIVE' },
      },
    },
    Lab_Con1: {
      weight: 1,
      signals: {
        'winWin.isActive': { weight: 0.5, direction: 'POSITIVE' },
        'winWin.winWinScore': { weight: 1, direction: 'POSITIVE' },
      },
    },
    AtRep: {
      weight: 1,
      signals: {
        'pci.occurrences': { weight: 1, direction: 'POSITIVE' },
        'pci.meanDist': { weight: 1, direction: 'NEGATIVE' },
      },
    },
  },
});

/**
 * @returns {Object} Deep-frozen merge of userConfig over defaults.
 */
export function buildConfig(userConfig) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONSENSUS_CONFIG));
  if (!userConfig) return Object.freeze(base);

  const merged = deepMerge(base, userConfig);
  return Object.freeze(merged);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
        && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
