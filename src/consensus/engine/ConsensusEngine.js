/**
 * ConsensusEngine — agrega señales normalizadas en un score de consenso por número.
 *
 * Arquitectura:
 *   SignalNormalizer output → ConsensusEngine.compute() → resultado por número
 *
 * Soporta:
 *   - Agregación jerárquica: señales → motor → consenso
 *   - Cobertura y participación
 *   - Acuerdo entre motores
 *   - Detección de conflictos
 *   - Confianza estructural
 *   - Modos strict/tolerant
 *   - Determinismo (clock inyectable)
 *   - Copias defensivas
 */

import { AMERICAN_ROULETTE_NUMBERS } from '../constants/consensusConstants.js';
import { buildConfig } from './consensusConfiguration.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const isFinitePositive = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const isFiniteInRange = (n, lo, hi) => isFinitePositive(n) && n >= lo && n <= hi;
const isNormalizedValid = (entry) =>
  entry && typeof entry === 'object' && entry.valid !== false
  && typeof entry.normalizedValue === 'number' && Number.isFinite(entry.normalizedValue);
const isWithinUnit = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;

function round(v, precision) {
  if (!Number.isFinite(v)) return v;
  const factor = 10 ** precision;
  return Math.round(v * factor) / factor;
}

function structuralClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ── ConsensusEngine ────────────────────────────────────────────────────────

export class ConsensusEngine {
  /**
   * @param {Object} options
   * @param {'strict'|'tolerant'} [options.mode='tolerant']
   * @param {Object} [options.config] — partial override of DEFAULT_CONSENSUS_CONFIG
   * @param {Function} [options.clock] — () => ISO string; defaults to `() => new Date().toISOString()`
   */
  constructor(options = {}) {
    if (options.mode !== undefined) {
      if (options.mode !== 'strict' && options.mode !== 'tolerant') {
        throw new Error(`ConsensusEngine: unknown mode "${options.mode}".`);
      }
    }
    this.mode = options.mode ?? 'tolerant';
    this.config = buildConfig(options.config);
    this.clock = options.clock ?? (() => new Date().toISOString());
  }

  /**
   * Compute consensus scores for all numbers.
   *
   * @param {Object} normalizerOutput — SignalNormalizer.normalize() return value
   * @returns {Object} { numbers, metadata }
   */
  compute(normalizerOutput) {
    this._validateInput(normalizerOutput);

    const sourceNumbers = normalizerOutput.numbers;
    const warnings = [];
    const perNumber = {};

    // Process numbers in American roulette order
    for (const num of AMERICAN_ROULETTE_NUMBERS) {
      const entry = sourceNumbers[num];
      if (!entry) continue;

      try {
        perNumber[num] = this._computeNumber(num, entry, warnings);
      } catch (err) {
        if (this.mode === 'strict') throw err;
        warnings.push({ code: 'CONSENSUS_NUMBER_FAILED', number: num, reason: err.message, severity: 'ERROR' });
        perNumber[num] = this._invalidResult(num, err.message);
      }
    }

    const aggregated = this._aggregateGlobal(perNumber, warnings);

    return structuralClone({
      numbers: perNumber,
      metadata: {
        consensus: {
          appliedAt: this.clock(),
          schemaVersion: '1.0.0',
          mode: this.mode,
          aggregationStrategy: this.config.aggregation.strategy,
          missingPolicy: this.config.aggregation.missingPolicy,
          processedNumbers: Object.keys(perNumber).length,
          validNumbers: aggregated.validCount,
          invalidNumbers: aggregated.invalidCount,
          configurationVersion: this.config.configurationVersion || 'consensus-default-v1',
          configurationSummary: this._configSummary(),
          warnings: structuralClone(warnings),
        },
      },
    });
  }

  // ── Per-number computation ──────────────────────────────────────────────

  _computeNumber(num, sourceEntry, globalWarnings) {
    const normalizedSignals = sourceEntry.normalizedSignals || {};

    const engineResults = {};
    const allSignals = [];
    const allExcluded = [];
    const allWarnings = [];

    for (const engineName of Object.keys(this.config.engines)) {
      const engineCfg = this.config.engines[engineName];
      const ns = normalizedSignals[engineName];

      const { score, signals, excluded, warnings } = this._computeEngine(
        num, engineName, engineCfg, ns,
      );

      engineResults[engineName] = { score, signals, excluded, coverage: this._engineCoverage(engineCfg, signals) };
      allSignals.push(...signals.map(s => ({ ...s, engine: engineName })));
      allExcluded.push(...excluded.map(s => ({ ...s, engine: engineName })));
      allWarnings.push(...warnings);
    }

    // Push warnings to global
    for (const w of allWarnings) {
      globalWarnings.push(w);
    }

    // Aggregate engine scores → consensus score
    const { rawConsensusScore, engineContributions } = this._aggregateEngines(engineResults);

    // Agreement
    const agreement = this._computeAgreement(engineResults);

    // Conflicts
    const conflicts = this._detectConflicts(engineResults);

    // Confidence
    const confidence = this._computeConfidence(engineResults, agreement, conflicts);

    // Explanation
    const explanation = this._buildExplanation(num, engineResults, agreement, conflicts, allSignals, allExcluded);

    return {
      number: num,
      rawConsensusScore: rawConsensusScore !== null ? round(rawConsensusScore, this.config.rounding.precision) : null,
      valid: rawConsensusScore !== null,
      invalidReason: rawConsensusScore === null ? 'INSUFFICIENT_EVIDENCE' : null,
      engineScores: engineResults,
      engineContributions,
      agreement,
      conflicts: conflicts.length > 0 ? conflicts : [],
      confidence,
      coverage: this._globalCoverage(engineResults),
      explanation,
    };
  }

  // ── Engine-level computation ────────────────────────────────────────────

  _computeEngine(num, engineName, engineCfg, normalizedSignals) {
    const signals = [];
    const excluded = [];
    const warnings = [];

    if (!normalizedSignals) {
      warnings.push({
        code: 'CONSENSUS_ENGINE_UNAVAILABLE',
        number: num,
        engine: engineName,
        reason: 'ENGINE_UNAVAILABLE',
        severity: 'WARNING',
      });
      return { score: null, signals: [], excluded, warnings };
    }

    const signalCfgs = engineCfg.signals || {};
    const validEntries = [];
    let configuredWeight = 0;
    let availableWeight = 0;

    for (const [fieldKey, signalCfg] of Object.entries(signalCfgs)) {
      const weight = signalCfg.weight;
      if (!isFinitePositive(weight)) {
        warnings.push({
          code: 'CONSENSUS_INVALID_WEIGHT',
          number: num,
          engine: engineName,
          field: fieldKey,
          reason: 'INVALID_WEIGHT',
          severity: 'WARNING',
        });
        continue;
      }
      configuredWeight += weight;

      const entry = normalizedSignals[fieldKey];

      if (!entry) {
        excluded.push({
          engine: engineName,
          field: fieldKey,
          rawValue: null,
          normalizedValue: null,
          included: false,
          reason: 'MISSING_SIGNAL',
        });
        continue;
      }

      const rawValue = entry.rawValue;
      const normalizedValue = entry.normalizedValue;

      // Validate normalized value
      if (!isNormalizedValid(entry)) {
        excluded.push({
          engine: engineName,
          field: fieldKey,
          rawValue,
          normalizedValue,
          included: false,
          reason: 'INVALID_NORMALIZED_VALUE',
        });
        continue;
      }

      if (!isWithinUnit(normalizedValue)) {
        excluded.push({
          engine: engineName,
          field: fieldKey,
          rawValue,
          normalizedValue,
          included: false,
          reason: 'VALUE_OUTSIDE_UNIT_INTERVAL',
        });
        continue;
      }

      // Apply direction
      const direction = signalCfg.direction || 'POSITIVE';
      let effectiveValue = normalizedValue;

      if (direction === 'NEGATIVE') {
        effectiveValue = 1 - normalizedValue;
      } else if (direction === 'NEUTRAL') {
        effectiveValue = 0.5;
      } else if (direction !== 'POSITIVE') {
        warnings.push({
          code: 'CONSENSUS_UNKNOWN_DIRECTION',
          number: num,
          engine: engineName,
          field: fieldKey,
          reason: 'UNKNOWN_DIRECTION',
          severity: 'WARNING',
        });
        excluded.push({
          engine: engineName,
          field: fieldKey,
          rawValue,
          normalizedValue,
          included: false,
          reason: 'UNKNOWN_DIRECTION',
        });
        continue;
      }

      availableWeight += weight;

      signals.push({
        engine: engineName,
        field: fieldKey,
        rawValue,
        normalizedValue: round(normalizedValue, this.config.rounding.precision),
        effectiveValue: round(effectiveValue, this.config.rounding.precision),
        direction,
        configuredWeight: weight,
        included: true,
        reason: null,
      });

      validEntries.push({ value: effectiveValue, weight });
    }

    // Compute engine score
    let score = null;
    if (validEntries.length > 0 && availableWeight > 0) {
      let weightedSum = 0;
      for (const e of validEntries) {
        weightedSum += e.value * (e.weight / availableWeight);
      }
      score = round(weightedSum, this.config.rounding.precision);
    }

    return { score, signals, excluded, warnings };
  }

  // ── Aggregation: engines → consensus ────────────────────────────────────

  _aggregateEngines(engineResults) {
    const engineContributions = {};
    let totalWeight = 0;
    let weightedSum = 0;
    const availableEngines = [];

    for (const [engineName, cfg] of Object.entries(this.config.engines)) {
      const result = engineResults[engineName];
      if (!result || result.score === null) continue;

      const weight = isFinitePositive(cfg.weight) ? cfg.weight : 0;
      if (weight === 0) continue;

      availableEngines.push({ name: engineName, score: result.score, weight });
      totalWeight += weight;
    }

    // Renormalize weights
    if (totalWeight === 0 || availableEngines.length === 0) {
      return { rawConsensusScore: null, engineContributions };
    }

    const effectiveWeight = 1 / availableEngines.length;

    for (const eng of availableEngines) {
      const normalizedWeight = eng.weight / totalWeight;
      const contribution = eng.score * normalizedWeight;
      weightedSum += contribution;

      engineContributions[eng.name] = {
        configuredWeight: eng.weight,
        effectiveWeight: round(effectiveWeight, this.config.rounding.precision),
        score: eng.score,
        weightedContribution: round(contribution, this.config.rounding.precision),
      };
    }

    const rawConsensusScore = totalWeight > 0 ? round(weightedSum, this.config.rounding.precision) : null;

    return { rawConsensusScore, engineContributions };
  }

  // ── Coverage ────────────────────────────────────────────────────────────

  _engineCoverage(engineCfg, signals) {
    let configuredWeight = 0;
    let availableWeight = 0;
    for (const [_, cfg] of Object.entries(engineCfg.signals || {})) {
      configuredWeight += cfg.weight || 0;
    }
    for (const s of signals) {
      if (s.included) availableWeight += s.configuredWeight;
    }
    return {
      configuredWeight,
      availableWeight,
      coverageRatio: configuredWeight > 0 ? round(availableWeight / configuredWeight, this.config.rounding.precision) : 1,
      validSignalCount: signals.filter(s => s.included).length,
      excludedSignalCount: signals.filter(s => !s.included).length,
    };
  }

  _globalCoverage(engineResults) {
    let totalConfigured = 0;
    let totalAvailable = 0;
    let participating = 0;

    for (const [engineName, cfg] of Object.entries(this.config.engines)) {
      const er = engineResults[engineName];
      if (!er) continue;
      const weight = isFinitePositive(cfg.weight) ? cfg.weight : 0;
      totalConfigured += weight;
      if (er.score !== null && er.coverage) {
        participating++;
        // Per-engine signal-level coverage, weighted by engine weight.
        // This ensures global coverage ≠ participation when signals are partial.
        totalAvailable += er.coverage.coverageRatio * weight;
      }
    }

    return {
      configuredEngines: Object.keys(this.config.engines).length,
      participatingEngines: participating,
      configuredWeight: totalConfigured,
      availableWeight: totalAvailable,
      coverageRatio: totalConfigured > 0 ? round(totalAvailable / totalConfigured, this.config.rounding.precision) : 0,
    };
  }

  // ── Agreement ───────────────────────────────────────────────────────────

  _computeAgreement(engineResults) {
    const scores = [];
    for (const [name, cfg] of Object.entries(this.config.engines)) {
      const er = engineResults[name];
      if (er && er.score !== null && isFinitePositive(cfg.weight)) {
        scores.push(er.score);
      }
    }

    if (scores.length < 2) {
      return {
        score: null,
        calculable: false,
        reason: 'INSUFFICIENT_ENGINES',
      };
    }

    // Standard deviation of scores
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
    const stddev = Math.sqrt(variance);

    // Normalize: max possible stddev for values in [0,1] is 0.5
    const maxStddev = 0.5;
    const normalizedDispersion = clamp(stddev / maxStddev, 0, 1);
    const agreement = clamp(1 - normalizedDispersion, 0, 1);

    return {
      score: round(agreement, this.config.rounding.precision),
      calculable: true,
      reason: null,
      dispersion: round(stddev, this.config.rounding.precision),
      engineCount: scores.length,
    };
  }

  // ── Conflict detection ──────────────────────────────────────────────────

  _detectConflicts(engineResults) {
    const conflicts = [];
    const thresholds = this.config.conflict.spreadThresholds;

    const validEngines = [];
    for (const [name, cfg] of Object.entries(this.config.engines)) {
      const er = engineResults[name];
      if (er && er.score !== null && isFinitePositive(cfg.weight)) {
        validEngines.push({ name, score: er.score });
      }
    }

    // ENGINE_DIVERGENCE
    if (validEngines.length >= 2) {
      const scores = validEngines.map(e => e.score);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      const spread = maxScore - minScore;

      let severity = null;
      let conflictType = null;

      if (spread >= thresholds.high) {
        severity = 'HIGH';
        conflictType = 'ENGINE_DIVERGENCE';
      } else if (spread >= thresholds.medium) {
        severity = 'MEDIUM';
        conflictType = 'ENGINE_DIVERGENCE';
      } else if (spread >= thresholds.low) {
        severity = 'LOW';
        conflictType = 'ENGINE_DIVERGENCE';
      }

      if (conflictType) {
        const maxEng = validEngines.find(e => e.score === maxScore);
        const minEng = validEngines.find(e => e.score === minScore);
        conflicts.push({
          type: conflictType,
          severity,
          engines: [minEng.name, maxEng.name],
          scoreDifference: round(spread, this.config.rounding.precision),
          threshold: thresholds[severity.toLowerCase()],
          messageCode: 'ENGINE_SCORES_DIVERGE',
          blocking: severity === 'HIGH',
        });
      }
    }

    // INSUFFICIENT_COVERAGE
    const coverage = this._globalCoverage(engineResults);
    if (coverage.coverageRatio < this.config.requirements.minimumCoverage) {
      conflicts.push({
        type: 'INSUFFICIENT_COVERAGE',
        severity: 'HIGH',
        engines: [],
        scoreDifference: null,
        threshold: this.config.requirements.minimumCoverage,
        messageCode: 'COVERAGE_BELOW_MINIMUM',
        blocking: true,
      });
    }

    // DOMINANT_SINGLE_ENGINE
    if (validEngines.length === 1) {
      conflicts.push({
        type: 'DOMINANT_SINGLE_ENGINE',
        severity: 'LOW',
        engines: [validEngines[0].name],
        scoreDifference: null,
        threshold: null,
        messageCode: 'SINGLE_ENGINE_ONLY',
        blocking: false,
      });
    }

    return conflicts;
  }

  // ── Confidence ──────────────────────────────────────────────────────────

  _computeConfidence(engineResults, agreement, conflicts) {
    const cc = this.config.confidence.components;
    const coverage = this._globalCoverage(engineResults);

    // Coverage component
    const coverageComp = coverage.coverageRatio;

    // Participation component (linear: 1 engine = 0.33, 3 engines = 1)
    const totalEngines = coverage.configuredEngines;
    const participationComp = totalEngines > 0
      ? coverage.participatingEngines / totalEngines
      : 0;

    // Agreement component (only when calculable, else neutral contribution)
    const agreementComp = agreement.calculable ? agreement.score : 0.5;

    // Conflict penalty
    let conflictPenalty = 1;
    const hasBlocking = conflicts.some(c => c.blocking);
    if (hasBlocking) {
      conflictPenalty = this.config.conflict.conflictPenalty.blocking;
    } else {
      for (const c of conflicts) {
        const sev = (c.severity || '').toLowerCase();
        const penalty = this.config.conflict.conflictPenalty[sev];
        if (penalty !== undefined && penalty < conflictPenalty) {
          conflictPenalty = penalty;
        }
      }
    }

    // Weighted geometric-like product
    let confidenceScore = 0;
    if (cc.coverage.weight + cc.participation.weight + cc.agreement.weight + cc.conflict.weight > 0) {
      confidenceScore =
        coverageComp * cc.coverage.weight
        + participationComp * cc.participation.weight
        + agreementComp * cc.agreement.weight
        + conflictPenalty * cc.conflict.weight;
    }

    // Map to level
    let level = 'VERY_LOW';
    for (const [lvl, [lo, hi]] of Object.entries(this.config.confidence.levels)) {
      if (confidenceScore >= lo && confidenceScore <= hi) {
        level = lvl;
        break;
      }
    }

    return {
      score: round(clamp(confidenceScore, 0, 1), this.config.rounding.precision),
      level,
      components: {
        coverage: round(coverageComp, this.config.rounding.precision),
        participation: round(participationComp, this.config.rounding.precision),
        agreement: round(agreementComp, this.config.rounding.precision),
        conflictPenalty: round(conflictPenalty, this.config.rounding.precision),
      },
    };
  }

  // ── Explanation ─────────────────────────────────────────────────────────

  _buildExplanation(num, engineResults, agreement, conflicts, signals, excluded) {
    // Dominant engine
    let dominantEngine = null;
    let maxContribution = -1;
    for (const [name, er] of Object.entries(engineResults)) {
      if (er.score !== null && er.score > maxContribution) {
        maxContribution = er.score;
        dominantEngine = name;
      }
    }

    // Dominant signal
    let dominantSignals = [];
    let maxSignalContribution = -1;
    for (const s of signals) {
      if (s.included && s.effectiveValue > maxSignalContribution) {
        maxSignalContribution = s.effectiveValue;
        dominantSignals = [{ engine: s.engine, field: s.field, contribution: round(s.effectiveValue, this.config.rounding.precision) }];
      }
    }

    const positiveFactors = [];
    const limitingFactors = [];

    // Multi-engine support
    const participating = Object.values(engineResults).filter(er => er.score !== null).length;
    if (participating >= 3) positiveFactors.push('MULTI_ENGINE_SUPPORT');
    else if (participating >= 2) positiveFactors.push('MULTI_ENGINE_SUPPORT');

    // Coverage
    const cov = this._globalCoverage(engineResults);
    if (cov.coverageRatio >= 0.8) positiveFactors.push('HIGH_SIGNAL_COVERAGE');
    else if (cov.coverageRatio < 0.5) limitingFactors.push('LOW_SIGNAL_COVERAGE');

    // Agreement
    if (agreement.calculable) {
      if (agreement.score >= 0.8) positiveFactors.push('HIGH_ENGINE_AGREEMENT');
      else if (agreement.score < 0.5) limitingFactors.push('LOW_ENGINE_AGREEMENT');
    } else {
      limitingFactors.push('INSUFFICIENT_ENGINES_FOR_AGREEMENT');
    }

    // Conflicts
    if (conflicts.length > 0) limitingFactors.push('CONFLICTS_DETECTED');

    return {
      summaryCode: this._buildSummaryCode(participating, cov, agreement, conflicts),
      dominantEngine,
      dominantSignals,
      positiveFactors: positiveFactors.length > 0 ? positiveFactors : ['NONE'],
      limitingFactors: limitingFactors.length > 0 ? limitingFactors : ['NONE'],
      warningCodes: conflicts.map(c => c.messageCode),
    };
  }

  _buildSummaryCode(participating, coverage, agreement, conflicts) {
    const hasConflict = conflicts.length > 0;
    const highCov = coverage.coverageRatio >= 0.8;
    const highAgree = agreement.calculable && agreement.score >= 0.8;

    if (participating >= 3 && highCov && highAgree && !hasConflict) return 'HIGH_SCORE_HIGH_COVERAGE';
    if (participating >= 2 && highCov) return 'MODERATE_SCORE_GOOD_COVERAGE';
    if (participating === 1) return 'SINGLE_ENGINE_LIMITED';
    if (hasConflict) return 'CONFLICT_DETECTED';
    return 'STANDARD_CONSENSUS';
  }

  // ── Validation ──────────────────────────────────────────────────────────

  _validateInput(input) {
    if (!input || typeof input !== 'object') {
      throw new TypeError('ConsensusEngine.compute: input must be an object.');
    }
    if (!input.numbers || typeof input.numbers !== 'object') {
      throw new TypeError('ConsensusEngine.compute: input must have "numbers".');
    }

    // Validate config
    if (this.mode === 'strict') {
      for (const [engineName, ec] of Object.entries(this.config.engines)) {
        if (!isFinitePositive(ec.weight)) {
          throw new Error(`ConsensusEngine: engine "${engineName}" has invalid weight.`);
        }
        for (const [fieldKey, sc] of Object.entries(ec.signals || {})) {
          if (!isFinitePositive(sc.weight)) {
            throw new Error(`ConsensusEngine: signal "${fieldKey}" in engine "${engineName}" has invalid weight.`);
          }
          const dir = sc.direction;
          if (dir && !['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(dir)) {
            throw new Error(`ConsensusEngine: signal "${fieldKey}" in "${engineName}" has unknown direction "${dir}".`);
          }
        }
      }
    }
  }

  _configSummary() {
    const signalCount = {};
    for (const [name, ec] of Object.entries(this.config.engines)) {
      signalCount[name] = Object.keys(ec.signals || {}).length;
    }
    return {
      engines: Object.keys(this.config.engines),
      signalCounts: signalCount,
      aggregationStrategy: this.config.aggregation.strategy,
      requirements: { ...this.config.requirements },
    };
  }

  _invalidResult(num, reason) {
    return {
      number: num,
      rawConsensusScore: null,
      valid: false,
      invalidReason: reason || 'INSUFFICIENT_EVIDENCE',
      engineScores: {},
      engineContributions: {},
      agreement: { score: null, calculable: false, reason: 'INSUFFICIENT_ENGINES' },
      conflicts: [],
      confidence: { score: 0, level: 'VERY_LOW', components: { coverage: 0, participation: 0, agreement: 0, conflictPenalty: 0 } },
      coverage: { configuredEngines: 0, participatingEngines: 0, configuredWeight: 0, availableWeight: 0, coverageRatio: 0 },
      explanation: {
        summaryCode: 'INSUFFICIENT_EVIDENCE',
        dominantEngine: null,
        dominantSignals: [],
        positiveFactors: ['NONE'],
        limitingFactors: ['INSUFFICIENT_EVIDENCE'],
        warningCodes: [],
      },
    };
  }

  _aggregateGlobal(perNumber, warnings) {
    let validCount = 0;
    let invalidCount = 0;
    for (const entry of Object.values(perNumber)) {
      if (entry.valid) validCount++;
      else invalidCount++;
    }
    return { validCount, invalidCount };
  }
}
