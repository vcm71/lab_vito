# PHASE 2.1 CONSENSUS ENGINE — Implementation Report

**Date:** 2026-07-30T14:45:00-06:00
**Project:** Roulette Tracker Pro
**Target:** Fase2.1_gpt.md — ConsensusEngine design and implementation

## Summary

Fase 2.1 implements the ConsensusEngine, which aggregates normalized signals from Engines (Lab_Con, Lab_Con1, AtRep) into a single consensus score per roulette number. The engine uses a hierarchical weighted-mean aggregation strategy with neutral weights (1:1:1), signal direction handling, agreement/conflict detection, and structured confidence evaluation.

## Architecture

```
SignalNormalizer output
  → ConsensusEngine.compute()
    → Per-number: _extractValidSignals → _aggregateEngineScores → _aggregateGlobalScore
      → _computeAgreement → _detectConflicts → _evaluateConfidence → _buildExplanation
    → structuralClone(result)
```

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/consensus/engine/consensusConfiguration.js` | 110 | Default configuration: signals, weights, groups, direction directions |
| `src/consensus/engine/ConsensusEngine.js` | 724 | Main engine: aggregation, agreement, conflict, confidence, explanation |
| `src/consensus/engine/index.js` | 3 | Barrel export |
| `tests/consensus/ConsensusEngine.test.js` | 832 | 42 integration tests |

### Files Modified

| File | Change |
|------|--------|
| `src/consensus/index.js` | Added: ConsensusEngine, DEFAULT_CONSENSUS_CONFIG, CONSENSUS_CONFIG_VERSION |
| `tests/consensus/consensusExports.test.js` | Added 3 new public exports |

## Signal Selection (spec §38–§40)

### Selected Signals

| Engine | Field | Strategy | Direction | Reason |
|--------|-------|----------|-----------|--------|
| Lab_Con | delay.delayRatio | IDENTITY | POSITIVE | Already in [0,1] |
| Lab_Con | delay.delayScore | PERCENTILE → IDENTITY | POSITIVE | Normalized by normalizer |
| Lab_Con | delay.pressure | PERCENTILE → IDENTITY | POSITIVE | Normalized by normalizer |
| Lab_Con1 | winWin.isActive | BINARY → IDENTITY | POSITIVE | 0/1 signal |
| Lab_Con1 | winWin.winWinScore | PERCENTILE → IDENTITY | POSITIVE | Normalized by normalizer |
| AtRep | pci.occurrences | PERCENTILE → IDENTITY | POSITIVE | Normalized by normalizer |
| AtRep | pci.meanDist | PERCENTILE → IDENTITY | NEGATIVE | Lower distance = better (inverted to 1−v) |

### Excluded Signals (Rationale)

- winWin.level — CATEGORICAL (ordinal, not numeric)
- winWin.streakLength — encoded into winWinScore
- winWin.lastWinAtraso — not selected
- pci.pciIndividual, pci.pciCombined — outside [0,1] range
- pci.expectedDist — theoretical constant
- delay fields (non-selected) — redundant with delayRatio

## Engines & Weights

| Engine | Weight | Signal Count |
|--------|--------|-------------|
| Lab_Con | 1 | 3 signals |
| Lab_Con1 | 1 | 2 signals |
| AtRep | 1 | 2 signals |

Total: 7 signals across 3 engines. Neutral weights per spec §42.

## Aggregation Strategy

- Engine level: HIERARCHICAL_WEIGHTED_MEAN — aggregate signals within each engine
- Global level: Weighted mean of engine scores by engine weight
- Missing policy: TOLERANT — partial engine contribution still valid
- Out-of-range handling: ignore (preserved from normalization contract)

## Consensus Score Computation

1. **Signal validation**: required fields in [0,1], in `valid === true`, in `normalizedValue >= 0 && <= 1`
2. **Direction application**: POSITIVE signals pass through; NEGATIVE signals use `1 − normalizedValue`
3. **Engine score**: weighted mean of all valid signals per engine (signal weights from config)
4. **Global score**: weighted mean of engine scores (engine weights from config), clamped to [0,1]
5. **Coverage**: ratio of expected signals present per engine, plus engine participation ratio

## Agreement & Conflict Detection (§60–§65)

- **Agreement** (CV-based): 1 − (σ / μ) for engine scores; ≥2 engines required; highly aligned → >0.9, divergence → <0.3
- **ENGINE_DIVERGENCE**: max engine spread > divergenceThreshold (configurable, default 0.7)
- **SIGNAL_CONFLICT**: within-engine signal spread > intraEngineConflictThreshold
- **MISSING_ENGINE**: engine excluded (no valid signals)
- **LOW_COVERAGE**: per-engine coverage below 50%

## Confidence Evaluation (§67–§75)

Confidence score = weighted sum of:
| Component | Weight | Description |
|-----------|--------|-------------|
| coverage | 0.30 | Signal completeness (per-engine) |
| participation | 0.35 | Engine participation ratio |
| agreement | 0.25 | Inter-engine agreement |
| conflictPenalty | 0.10 | 1.0 minus conflict severity |

**Level mapping**: VERY_HIGH (>0.85), HIGH (>0.70), MEDIUM (>0.45), LOW (>0.20), VERY_LOW (≤0.20)

## Modes

| Mode | Missing signals | Engine failures | Invalid numbers |
|------|----------------|-----------------|-----------------|
| tolerant | excluded with reason | perNumber[invalid] = _invalidResult | warning logged |
| strict | excluded, logged | throw Error | throw Error |

## Yielded Attributes per Number

```js
{
  number: '17',
  rawConsensusScore: 0.63,          // [0,1]
  valid: true,
  engineScores: {                    // per-engine aggregated
    Lab_Con: { score, signals, excluded, coverage },
    Lab_Con1: { ... },
    AtRep: { ... }
  },
  engineContributions: {             // weighted contributions to global
    Lab_Con: 0.21, Lab_Con1: 0.21, AtRep: 0.21
  },
  agreement: { score, calculable, engineCount },
  conflicts: [                       // detected conflicts
    { type: 'ENGINE_DIVERGENCE', severity, details }
  ],
  confidence: { score, level, components },
  explanation: {                     // diagnostics
    summaryCode, dominantEngine, dominantSignals,
    positiveFactors, limitingFactors
  }
}
```

## Quality Gates

| Metric | Result |
|--------|--------|
| Tests | 186/186 pass (11 files, +42 new) |
| Lint | 0 errors, 0 warnings |
| Build | 83 modules, ~414ms |
| Consensus suite | 11 files, 186 tests |
| EsLint (full) | 0 errors |

## Edge Cases Covered

- Empty input (no numbers) — zero processedNumbers
- Single engine only — agreement.calculable=false, lower confidence
- Missing fields — excluded with MISSING_SIGNAL reason, coverage ratio reduced
- 0 / 00 numbers — processed independently
- Defensive copy — structuralClone prevents input mutation leakage
- Value outside [0,1] — excluded via isWithinUnit check
- All engines invalid for a number — valid=false, confidence VERY_LOW

## Open Items / Intentional Limitations

- No backtesting weight optimization (per spec — out of scope for Fase 2.1)
- No online/streaming mode (batch-only)
- Agreement uses CV-based approach (not Cohen's kappa — multi-engine limitation)
- Explanation is diagnostic-only; no user-facing natural language rendering
