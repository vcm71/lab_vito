/**
 * BetaCalibration — Beta-distribution-based calibration.
 *
 * Fits a Beta(alpha, beta) distribution to raw scores and maps
 * CDF of the calibrated distribution to probabilities.
 *
 * Alpha and beta parameters estimated via method of moments.
 */

import { CalibrationStrategy } from './CalibrationStrategy.js';

export class BetaCalibration extends CalibrationStrategy {
  constructor() {
    super('BetaCalibration', '1.0.0');
    this.alphaPos = 1;
    this.betaPos = 1;
    this.alphaNeg = 1;
    this.betaNeg = 1;
    this.trained = false;
  }

  fit(dataset, context = null) {
    // Separate positive and negative outcomes
    const posScores = [];
    const negScores = [];
    for (const r of dataset.records) {
      if (r.observedOutcome) posScores.push(r.rawConsensusScore);
      else negScores.push(r.rawConsensusScore);
    }

    const fitBeta = (scores) => {
      if (scores.length < 2) return { alpha: 1, beta: 1 };
      const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
      const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (scores.length - 1);
      // Method of moments
      const shared = mean * (1 - mean) / Math.max(variance, 1e-6) - 1;
      const alpha = Math.max(0.5, mean * shared);
      const beta = Math.max(0.5, (1 - mean) * shared);
      return { alpha, beta };
    };

    const pos = fitBeta(posScores);
    const neg = fitBeta(negScores);

    this.alphaPos = pos.alpha;
    this.betaPos = pos.beta;
    this.alphaNeg = neg.alpha;
    this.betaNeg = neg.beta;
    this.trained = true;

    return { alphaPos: pos.alpha, betaPos: pos.beta, alphaNeg: neg.alpha, betaNeg: neg.beta };
  }

  calibrate(rawConsensusScore, context = {}) {
    if (rawConsensusScore === null || rawConsensusScore === undefined || !Number.isFinite(rawConsensusScore)) {
      return { calibratedProbability: null, metadata: { appliedStrategy: this.name } };
    }
    if (!this.trained) {
      return { calibratedProbability: rawConsensusScore, metadata: { appliedStrategy: this.name, notes: 'not trained — passthrough' } };
    }

    // Beta PDF at score for positive and negative classes
    const pdf = (x, a, b) => {
      const B = Math.exp(lgamma(a) + lgamma(b) - lgamma(a + b));
      return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1) / B;
    };

    const posPdf = pdf(rawConsensusScore, this.alphaPos, this.betaPos);
    const negPdf = pdf(rawConsensusScore, this.alphaNeg, this.betaNeg);
    const prob = posPdf / (posPdf + negPdf);

    return {
      calibratedProbability: isFinite(prob) ? Math.max(0, Math.min(1, prob)) : rawConsensusScore,
      metadata: { appliedStrategy: this.name, params: { alphaPos: this.alphaPos, betaPos: this.betaPos } },
    };
  }

  serialize() {
    return {
      name: this.name,
      strategyVersion: this.strategyVersion,
      parameters: { alphaPos: this.alphaPos, betaPos: this.betaPos, alphaNeg: this.alphaNeg, betaNeg: this.betaNeg, trained: this.trained },
    };
  }

  static deserialize(data) {
    const inst = new BetaCalibration();
    inst.alphaPos = data.parameters?.alphaPos ?? 1;
    inst.betaPos = data.parameters?.betaPos ?? 1;
    inst.alphaNeg = data.parameters?.alphaNeg ?? 1;
    inst.betaNeg = data.parameters?.betaNeg ?? 1;
    inst.trained = data.parameters?.trained ?? false;
    return inst;
  }

  validateModel(model) {
    const base = super.validateModel(model);
    if (!base.valid) return base;
    const p = model.parameters;
    if (p.alphaPos == null || p.betaPos == null) {
      return { valid: false, issues: [{ message: 'Beta model missing params.', severity: 'error' }] };
    }
    return { valid: true, issues: [] };
  }
}

// Log-gamma approximation (Stirling)
function lgamma(z) {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  const x = z - 1;
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let s = c[0];
  for (let i = 1; i < g + 2; i++) s += c[i] / (x + i);
  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(s) - Math.log(z);
}
