/**
 * IsotonicCalibration — PAV (Pool Adjacent Violators) algorithm.
 *
 * Guarantees monotonicity: calibrated probability never decreases
 * as raw consensus score increases.
 */

import { CalibrationStrategy } from './CalibrationStrategy.js';

export class IsotonicCalibration extends CalibrationStrategy {
  constructor() {
    super('IsotonicCalibration', '1.0.0');
    this.points = null;
  }

  fit(dataset, context = null) {
    // Sort by score ascending
    const sorted = dataset.records
      .map(r => ({ score: r.rawConsensusScore, outcome: r.observedOutcome ? 1 : 0 }))
      .sort((a, b) => a.score - b.score);

    if (sorted.length === 0) { this.points = []; return { points: [] }; }

    // PAV: start with one block per point
    const blocks = sorted.map(r => ({
      sumScore: r.score,
      sumOutcome: r.outcome,
      count: 1,
    }));

    // Merge adjacent blocks that violate monotonicity
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < blocks.length - 1; i++) {
        const a = blocks[i];
        const b = blocks[i + 1];
        if (a.sumOutcome / a.count > b.sumOutcome / b.count) {
          // Violation: merge a and b
          blocks.splice(i, 2, {
            sumScore: a.sumScore + b.sumScore,
            sumOutcome: a.sumOutcome + b.sumOutcome,
            count: a.count + b.count,
          });
          changed = true;
          break;
        }
      }
    }

    this.points = blocks.map(b => ({
      score: b.sumScore / b.count,
      prob: b.sumOutcome / b.count,
      count: b.count,
    }));

    // Ensure [0,1] coverage
    return { points: this.points.map(({ score, prob, count }) => ({ score, prob, count })) };
  }

  calibrate(rawConsensusScore, context = {}) {
    if (rawConsensusScore === null || rawConsensusScore === undefined || !Number.isFinite(rawConsensusScore)) {
      return { calibratedProbability: null, metadata: { appliedStrategy: this.name } };
    }
    if (!this.points || this.points.length === 0) {
      return { calibratedProbability: rawConsensusScore, metadata: { appliedStrategy: this.name, notes: 'not trained — passthrough' } };
    }

    const pts = this.points;

    // Below first point → use first probability
    if (rawConsensusScore <= pts[0].score) {
      return { calibratedProbability: pts[0].prob, metadata: { appliedStrategy: this.name, method: 'lowest' } };
    }
    // Above last point → use last probability
    if (rawConsensusScore >= pts[pts.length - 1].score) {
      return { calibratedProbability: pts[pts.length - 1].prob, metadata: { appliedStrategy: this.name, method: 'highest' } };
    }

    // Linear interpolation between two points
    for (let i = 0; i < pts.length - 1; i++) {
      if (rawConsensusScore >= pts[i].score && rawConsensusScore <= pts[i + 1].score) {
        const t = (rawConsensusScore - pts[i].score) / (pts[i + 1].score - pts[i].score);
        const prob = pts[i].prob + t * (pts[i + 1].prob - pts[i].prob);
        return { calibratedProbability: Math.max(0, Math.min(1, prob)), metadata: { appliedStrategy: this.name, method: 'interpolation' } };
      }
    }

    return { calibratedProbability: rawConsensusScore, metadata: { appliedStrategy: this.name, notes: 'fallback' } };
  }

  serialize() {
    return {
      name: this.name,
      strategyVersion: this.strategyVersion,
      parameters: { points: this.points },
    };
  }

  static deserialize(data) {
    const inst = new IsotonicCalibration();
    inst.points = data.parameters?.points ?? null;
    return inst;
  }

  validateModel(model) {
    const base = super.validateModel(model);
    if (!base.valid) return base;
    const pts = model.parameters?.points;
    if (!Array.isArray(pts)) {
      return { valid: false, issues: [{ message: 'Isotonic model missing points.', severity: 'error' }] };
    }
    // Verify monotonicity
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].prob < pts[i - 1].prob) {
        return { valid: false, issues: [{ message: `Non-monotonic at index ${i}.`, severity: 'error' }] };
      }
    }
    return { valid: true, issues: [] };
  }
}
