/**
 * PairedBootstrap — paired bootstrap resampling for calibration strategy comparison.
 *
 * Resamples matched-pair differences to produce confidence intervals
 * and win-rate estimates without assuming normality.
 *
 * Accounts for group-level dependence when groupField is provided.
 */

import { createSeededRandom } from './SeededRandom.js';

/**
 * Bootstrap results.
 *
 * @typedef {Object} BootstrapResult
 * @property {number} n — number of observations
 * @property {number} b — number of bootstrap replicates
 * @property {Object} baseline — { brier, logLoss, ece }
 * @property {Object} candidate — { brier, logLoss, ece }
 * @property {Object} delta — { brier, logLoss, ece } (baseline - candidate, positive = improvement)
 * @property {Object} ci — 95% confidence intervals for each metric delta
 * @property {number} winRate — proportion of replicates where candidate beats baseline
 * @property {Object} summary — verdict and highlights
 */

/**
 * Run paired bootstrap comparison.
 *
 * @param {Object} options
 * @param {number[]} options.predictionsA — baseline predictions
 * @param {number[]} options.predictionsB — candidate predictions
 * @param {number[]} options.outcomes — binary outcomes (0/1)
 * @param {number} [options.nReplicates=2000]
 * @param {number} [options.seed=42]
 * @param {number[]} [options.groupIds] — group IDs for clustered bootstrap (0-indexed)
 * @returns {BootstrapResult}
 */
export function pairedBootstrap(options) {
  const { predictionsA, predictionsB, outcomes, nReplicates, seed, groupIds } = options;
  const n = outcomes.length;
  const B = nReplicates ?? 2000;
  const rng = createSeededRandom('xoshiro128**', seed ?? 42);

  if (n < 2) {
    return _emptyResult(n, 'INSUFFICIENT_OBSERVATIONS');
  }

  // 1. Compute point estimates
  const base = {
    brier: _brier(predictionsA, outcomes),
    logLoss: _logLoss(predictionsA, outcomes),
    ece: _ece(predictionsA, outcomes, 10),
  };
  const cand = {
    brier: _brier(predictionsB, outcomes),
    logLoss: _logLoss(predictionsB, outcomes),
    ece: _ece(predictionsB, outcomes, 10),
  };

  const pointDelta = {
    brier: base.brier - cand.brier,
    logLoss: base.logLoss - cand.logLoss,
    ece: base.ece - cand.ece,
  };

  // 2. Bootstrap replicates
  const deltas = { brier: [], logLoss: [], ece: [] };

  for (let b = 0; b < B; b++) {
    const sample = _resample(n, groupIds, rng);

    const aBrier = _brier(sample.map(i => predictionsA[i]), sample.map(i => outcomes[i]));
    const bBrier = _brier(sample.map(i => predictionsB[i]), sample.map(i => outcomes[i]));
    deltas.brier.push(aBrier - bBrier);

    const aLogLoss = _logLoss(sample.map(i => predictionsA[i]), sample.map(i => outcomes[i]));
    const bLogLoss = _logLoss(sample.map(i => predictionsB[i]), sample.map(i => outcomes[i]));
    deltas.logLoss.push(aLogLoss - bLogLoss);

    const aEce = _ece(sample.map(i => predictionsA[i]), sample.map(i => outcomes[i]));
    const bEce = _ece(sample.map(i => predictionsB[i]), sample.map(i => outcomes[i]));
    deltas.ece.push(aEce - bEce);
  }

  // 3. Confidence intervals (percentile method, 95%)
  const ci = {};
  for (const metric of ['brier', 'logLoss', 'ece']) {
    const sorted = [...deltas[metric]].sort((x, y) => x - y);
    const lo = sorted[Math.floor(B * 0.025)];
    const hi = sorted[Math.floor(B * 0.975)];
    ci[metric] = { lo, hi, significant: lo > 0 || hi < 0 };
  }

  // 4. Win rate: proportion of replicates where candidate beats baseline
  //    For Brier/LogLoss/ECE, lower is better → candidate wins if delta > 0
  //    Use two-sided counting to distinguish ties from baseline wins
  const epsWin = 1e-10; // numerical tolerance for "better than"
  const wins = {
    brier: deltas.brier.filter(d => d > epsWin).length / B,
    logLoss: deltas.logLoss.filter(d => d > epsWin).length / B,
    ece: deltas.ece.filter(d => d > epsWin).length / B,
  };
  // Baseline wins: delta < -eps (baseline strictly better)
  const baselineWinsRate = (
    deltas.brier.filter(d => d < -epsWin).length
    + deltas.logLoss.filter(d => d < -epsWin).length
    + deltas.ece.filter(d => d < -epsWin).length
  ) / (3 * B);

  const overallWinRate = (wins.brier + wins.logLoss + wins.ece) / 3;

  // 5. Verdict: two-sided, require ≥95% win rate for a call
  let verdict;
  if (overallWinRate >= 0.95) {
    verdict = 'CANDIDATE_BETTER';
  } else if (baselineWinsRate >= 0.95) {
    verdict = 'BASELINE_BETTER';
  } else {
    verdict = 'INCONCLUSIVE';
  }

  // 5. Summary
  const improved = [];
  for (const m of ['brier', 'logLoss', 'ece']) {
    if (wins[m] >= 0.95) improved.push(`${m} (wr=${wins[m].toFixed(2)})`);
  }
  const summary = improved.length > 0
    ? `Candidate improves ${improved.join(', ')}.`
    : 'No significant improvement over baseline.';

  return {
    n,
    B,
    baseline: base,
    candidate: cand,
    delta: pointDelta,
    ci,
    winRate: { brier: wins.brier, logLoss: wins.logLoss, ece: wins.ece, overall: overallWinRate },
    summary,
    verdict,
  };
}

function _emptyResult(n, reason) {
  return {
    n,
    B: 0,
    baseline: { brier: 0, logLoss: 0, ece: 0 },
    candidate: { brier: 0, logLoss: 0, ece: 0 },
    delta: { brier: 0, logLoss: 0, ece: 0 },
    ci: {
      brier: { lo: 0, hi: 0, significant: false },
      logLoss: { lo: 0, hi: 0, significant: false },
      ece: { lo: 0, hi: 0, significant: false },
    },
    winRate: { brier: 0, logLoss: 0, ece: 0, overall: 0 },
    summary: reason,
    verdict: 'INCONCLUSIVE',
  };
}

function _resample(n, groupIds, rng) {
  if (groupIds && groupIds.length === n) {
    // Clustered bootstrap: resample groups, not individual observations
    const uniqueGroups = [...new Set(groupIds)];
    const resampledGroups = [];
    for (let g = 0; g < uniqueGroups.length; g++) {
      resampledGroups.push(uniqueGroups[rng.nextInt(0, uniqueGroups.length - 1)]);
    }
    const indices = [];
    for (const g of resampledGroups) {
      for (let i = 0; i < n; i++) {
        if (groupIds[i] === g) indices.push(i);
      }
    }
    return indices;
  }

  // Standard bootstrap: resample individual observations
  const indices = [];
  for (let i = 0; i < n; i++) {
    indices.push(rng.nextInt(0, n - 1));
  }
  return indices;
}

// ── Metric helpers (inline — avoid circular imports) ────────────────────────

function _brier(preds, outs) {
  let sum = 0;
  for (let i = 0; i < preds.length; i++) sum += (preds[i] - outs[i]) ** 2;
  return preds.length > 0 ? sum / preds.length : 0;
}

function _logLoss(preds, outs, eps = 1e-15) {
  let sum = 0;
  for (let i = 0; i < preds.length; i++) {
    const p = Math.max(eps, Math.min(1 - eps, preds[i]));
    sum += outs[i] * Math.log(p) + (1 - outs[i]) * Math.log(1 - p);
  }
  return preds.length > 0 ? -sum / preds.length : 0;
}

function _ece(preds, outs, nBuckets = 10) {
  const bucketSize = 1 / nBuckets;
  let ece = 0;
  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize;
    const hi = (b + 1) * bucketSize;
    const idx = [];
    for (let i = 0; i < preds.length; i++) {
      if (preds[i] >= lo && preds[i] < hi) idx.push(i);
    }
    if (idx.length === 0) continue;
    const meanPred = idx.reduce((s, i) => s + preds[i], 0) / idx.length;
    const meanObs = idx.reduce((s, i) => s + outs[i], 0) / idx.length;
    ece += (idx.length / preds.length) * Math.abs(meanPred - meanObs);
  }
  return ece;
}

export { _brier, _logLoss, _ece };
