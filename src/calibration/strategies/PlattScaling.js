/**
 * PlattScaling — logistic regression calibration.
 *
 * Fits: P(y=1) = 1 / (1 + exp(-(A * s + B)))
 *
 * Separates parameters A (slope) and B (intercept).
 */

import { CalibrationStrategy } from './CalibrationStrategy.js';

export class PlattScaling extends CalibrationStrategy {
  constructor() {
    super('PlattScaling', '1.0.0');
    this.A = 0;
    this.B = 0;
    this.trained = false;
  }

  fit(dataset, context = null) {
    const scores = dataset.records.map(r => r.rawConsensusScore);
    const outcomes = dataset.records.map(r => r.observedOutcome ? 1 : 0);
    const n = scores.length;

    if (n < 2) return { A: 0, B: 0 };

    // Gradient descent for logistic regression
    const lr = 0.1;
    const epochs = 1000;
    let A = 0;
    let B = 0;

    for (let e = 0; e < epochs; e++) {
      let gradA = 0, gradB = 0;
      for (let i = 0; i < n; i++) {
        const z = A * scores[i] + B;
        const p = 1 / (1 + Math.exp(-z));
        const err = p - outcomes[i];
        gradA += err * scores[i];
        gradB += err;
      }
      A -= lr * gradA / n;
      B -= lr * gradB / n;
    }

    this.A = A;
    this.B = B;
    this.trained = true;

    return { A, B };
  }

  calibrate(rawConsensusScore, context = {}) {
    if (rawConsensusScore === null || rawConsensusScore === undefined || !Number.isFinite(rawConsensusScore)) {
      return { calibratedProbability: null, metadata: { appliedStrategy: this.name } };
    }
    if (!this.trained) {
      return { calibratedProbability: rawConsensusScore, metadata: { appliedStrategy: this.name, notes: 'not trained — passthrough' } };
    }
    const z = this.A * rawConsensusScore + this.B;
    const prob = 1 / (1 + Math.exp(-z));
    return {
      calibratedProbability: Math.max(0, Math.min(1, prob)),
      metadata: { appliedStrategy: this.name, params: { A: this.A, B: this.B } },
    };
  }

  serialize() {
    return {
      name: this.name,
      strategyVersion: this.strategyVersion,
      parameters: { A: this.A, B: this.B, trained: this.trained },
    };
  }

  static deserialize(data) {
    const inst = new PlattScaling();
    inst.A = data.parameters?.A ?? 0;
    inst.B = data.parameters?.B ?? 0;
    inst.trained = data.parameters?.trained ?? false;
    return inst;
  }

  validateModel(model) {
    const base = super.validateModel(model);
    if (!base.valid) return base;
    const p = model.parameters;
    if (p.A === undefined || p.B === undefined) {
      return { valid: false, issues: [{ message: 'Platt model missing A/B.', severity: 'error' }] };
    }
    return { valid: true, issues: [] };
  }
}
