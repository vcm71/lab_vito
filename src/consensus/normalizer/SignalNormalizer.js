/**
 * SignalNormalizer — enriches SignalCollector output with normalized signal data.
 *
 * Architecture:
 *   - Receives the output of SignalCollector.collect() -> { numbers, metadata }
 *   - For each field in each signal family, applies a configured normalization
 *     strategy using the global population (all numbers) as reference.
 *   - Returns an enriched copy with normalizedSignals alongside signals.
 *
 * Modes:
 *   - 'tolerant' (default): skips fields where normalization fails, records warnings.
 *   - 'strict': throws on the first normalization failure.
 *
 * Output shape (per entry):
 *   {
 *     number: "17",
 *     signals: { Lab_Con: signal, Lab_Con1: signal, AtRep: signal },
 *     normalizedSignals: {
 *       Lab_Con:  { "delay.actualDelay": { rawValue, normalizedValue, method, valid, params }, ... },
 *       Lab_Con1: { "winWin.atraso": { ... }, ... },
 *       AtRep:    { "pci.pciIndividual": { ... }, ... }
 *     }
 *   }
 */

import {
  PercentileStrategy,
  MinMaxStrategy,
  RobustMinMaxStrategy,
  ZScoreStrategy,
  IdentityStrategy,
  BinaryStrategy,
  CategoricalStrategy,
} from '../strategies/index.js';
import {
  DEFAULT_FIELD_CONFIGURATION,
  ENGINE_TO_FAMILY,
  SKIP_FIELDS,
} from './fieldConfiguration.js';

// ── Built-in strategy registry ─────────────────────────────────────────────

const STRATEGY_REGISTRY = new Map();

function registerBuiltins() {
  if (STRATEGY_REGISTRY.size > 0) return;
  const instances = [
    new PercentileStrategy(),
    new MinMaxStrategy(),
    new RobustMinMaxStrategy(),
    new RobustMinMaxStrategy({ name: 'ROBUST_MIN_MAX_10_90', lowerPercentile: 10, upperPercentile: 90 }),
    new ZScoreStrategy(),
    new IdentityStrategy(),
    new BinaryStrategy(),
    new CategoricalStrategy(),
    new CategoricalStrategy({
      name: 'CATEGORICAL_LEVEL',
      mapping: { 'WIN': 1, 'WIN-WIN(1)': 2, 'WIN-WIN(2)': 3, 'WIN-WIN(3)': 4, 'WIN-WIN(4)': 5, 'WIN-WIN(5)': 6 },
    }),
  ];
  for (const inst of instances) {
    STRATEGY_REGISTRY.set(inst.name, inst);
  }
}

// ── Utility ─────────────────────────────────────────────────────────────────

function getNestedValue(obj, dottedPath) {
  const parts = dottedPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Gather all numeric values for a given field across all numbers/engines.
 * Returns { values: number[] } matching the strategy interface.
 */
function buildPopulation(numbers, fieldKey) {
  const values = [];
  const rawPath = `rawSignals.${fieldKey}`;

  for (const entry of Object.values(numbers)) {
    const signals = entry?.signals || {};
    for (const engineName of Object.keys(ENGINE_TO_FAMILY)) {
      const signal = signals[engineName];
      if (!signal) continue;
      const rawValue = getNestedValue(signal, rawPath);
      if (rawValue !== null && rawValue !== undefined && Number.isFinite(rawValue)) {
        values.push(rawValue);
      }
    }
  }
  return { values };
}

function formatEntry(rawValue, result) {
  return {
    rawValue: result.rawValue,
    normalizedValue: result.normalizedValue,
    method: result.method,
    valid: result.valid,
    params: result.params,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

export class SignalNormalizer {
  /**
   * @param {Object} [options]
   * @param {string} [options.mode='tolerant']  — 'tolerant' | 'strict'
   * @param {Object} [options.fieldConfig]      — override DEFAULT_FIELD_CONFIGURATION
   * @param {Object} [options.strategies]       — fieldKey → strategy instance overrides
   * @param {Function} [options.clock]          — injectable clock returning ISO string (default: () => new Date().toISOString())
   */
  constructor(options = {}) {
    this.mode = options.mode === 'strict' ? 'strict' : 'tolerant';
    this.fieldConfig = options.fieldConfig && typeof options.fieldConfig === 'object'
      ? { ...DEFAULT_FIELD_CONFIGURATION, ...options.fieldConfig }
      : DEFAULT_FIELD_CONFIGURATION;
    this.strategyOverrides = options.strategies && typeof options.strategies === 'object'
      ? { ...options.strategies }
      : {};
    this.clock = typeof options.clock === 'function'
      ? options.clock
      : () => new Date().toISOString();

    registerBuiltins();
  }

  /**
   * Register a custom strategy instance.
   */
  registerStrategy(strategy) {
    if (!strategy || typeof strategy.name !== 'string' || typeof strategy.normalize !== 'function') {
      throw new TypeError(
        'SignalNormalizer.registerStrategy: strategy must have name (string) and normalize (function).',
      );
    }
    STRATEGY_REGISTRY.set(strategy.name, strategy);
  }

  /**
   * Resolve a strategy instance by name.
   */
  _getStrategy(strategyName, fieldKey) {
    if (this.strategyOverrides[fieldKey]) return this.strategyOverrides[fieldKey];
    const s = STRATEGY_REGISTRY.get(strategyName);
    if (!s) {
      const msg = `Unknown strategy "${strategyName}" for field "${fieldKey}".`;
      if (this.mode === 'strict') throw new Error(msg);
      return null;
    }
    return s;
  }

  /**
   * Normalize the output of SignalCollector.collect().
   *
   * @param {Object} collectorOutput — { numbers, metadata }
   * @returns {Object} enriched { numbers, metadata } with normalizedSignals
   */
  normalize(collectorOutput) {
    if (!collectorOutput || typeof collectorOutput !== 'object' || !collectorOutput.numbers) {
      throw new TypeError(
        'SignalNormalizer.normalize: input must be a SignalCollector output with "numbers".',
      );
    }

    const sourceNumbers = collectorOutput.numbers;
    const warnings = [];

    // Track which configured field keys are actually processed
    const processedFields = new Set();
    const failedFields = new Set();

    // Pre-build populations for every numeric field
    /** @type {Map<string, number[]>} */
    const populations = new Map();
    for (const fieldKey of Object.keys(this.fieldConfig)) {
      if (SKIP_FIELDS.has(fieldKey)) continue;
      const cfg = this.fieldConfig[fieldKey];
      const stratName = cfg.strategy;
      if (['PERCENTILE', 'MIN_MAX', 'ROBUST_MIN_MAX', 'Z_SCORE'].includes(stratName)
          || (stratName && stratName.startsWith('ROBUST_MIN_MAX'))) {
        populations.set(fieldKey, buildPopulation(sourceNumbers, fieldKey));
      }
    }

    // Enrich each number
    const enrichedNumbers = {};
    for (const [numKey, sourceEntry] of Object.entries(sourceNumbers)) {
      const sourceSignals = sourceEntry?.signals || {};
      const normPerEngine = {};

      for (const [engineName, signal] of Object.entries(sourceSignals)) {
        if (!signal) {
          normPerEngine[engineName] = null;
          continue;
        }

        const family = ENGINE_TO_FAMILY[engineName];
        if (!family) continue;

        const perEngine = {};
        for (const [fieldKey, cfg] of Object.entries(this.fieldConfig)) {
          // Only fields for this engine's family
          if (!fieldKey.startsWith(`${family}.`)) continue;
          if (SKIP_FIELDS.has(fieldKey)) continue;

          const rawValue = getNestedValue(signal, `rawSignals.${fieldKey}`);
          const strategy = this._getStrategy(cfg.strategy, fieldKey);

          if (!strategy) {
            // Unknown strategy in tolerant mode — skip
            continue;
          }

          const pop = populations.get(fieldKey) || { values: [] };

          try {
            const result = strategy.normalize(rawValue, pop, cfg);
            perEngine[fieldKey] = formatEntry(rawValue, result);
            processedFields.add(fieldKey);
            if (!result.valid) {
              failedFields.add(fieldKey);
              warnings.push({ field: fieldKey, engine: engineName, number: signal.number, reason: 'Result invalid.' });
            }
          } catch (err) {
            perEngine[fieldKey] = {
              rawValue,
              normalizedValue: null,
              method: cfg.strategy,
              valid: false,
              params: { error: err.message },
            };
            failedFields.add(fieldKey);
            warnings.push({ field: fieldKey, engine: engineName, number: signal.number, reason: err.message });
          }
        }

        normPerEngine[engineName] = perEngine;
      }

      enrichedNumbers[numKey] = {
        number: sourceEntry.number,
        signals: sourceSignals,       // Keep original signals immutable
        normalizedSignals: normPerEngine,
      };
    }

    // Build normalization metadata
    const strategyNames = [...new Set(Object.values(this.fieldConfig).map(c => c.strategy))];
    const configuredFields = Object.keys(this.fieldConfig).filter(fk => !SKIP_FIELDS.has(fk));
    const fieldsNormalizedCount = processedFields.size;
    const fieldsFailedCount = failedFields.size;
    const fieldsSkippedCount = configuredFields.length - fieldsNormalizedCount;

    return {
      numbers: enrichedNumbers,
      metadata: {
        ...(collectorOutput.metadata || {}),
        normalization: {
          appliedAt: this.clock(),
          mode: this.mode,
          strategyNames,
          fieldsConfigured: configuredFields.length,
          fieldsNormalized: fieldsNormalizedCount,
          fieldsSkipped: fieldsSkippedCount,
          fieldsFailed: fieldsFailedCount,
          warnings,
        },
      },
    };
  }
}
