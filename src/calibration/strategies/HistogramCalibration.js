/**
 * HistogramCalibration — bucket-based probability calibration.
 *
 * Splits [0,1] range into nBuckets, computes observed frequency per bucket,
 * and maps raw scores to calibrated probabilities via linear interpolation
 * between bucket centers.
 */

import { CalibrationStrategy } from './CalibrationStrategy.js';

export class HistogramCalibration extends CalibrationStrategy {
  constructor(options = {}) {
    super('HistogramCalibration', '1.0.0');
    this.nBuckets = options.nBuckets ?? 10;
    this.buckets = null; // set after fit()
  }

  /**
   * Train: build bucket boundaries + observed frequencies.
   */
  fit(dataset, context = null) {
    const n = this.nBuckets;
    const buckets = Array.from({ length: n }, (_, i) => ({
      lo: i / n,
      hi: (i + 1) / n,
      scores: [],
      outcomes: [],
    }));

    for (const r of dataset.records) {
      const score = r.rawConsensusScore;
      const outcome = r.observedOutcome ? 1 : 0;
      // Clamp score to [0, 1) for bucket matching; score=1.0 goes to last bucket
      const clamped = Math.min(score, 1 - 1e-10);
      for (const b of buckets) {
        if (clamped >= b.lo && clamped < b.hi) {
          b.scores.push(score);
          b.outcomes.push(outcome);
          break;
        }
      }
    }

    const table = buckets.map(b => {
      const count = b.outcomes.length;
      const meanScore = count > 0 ? b.scores.reduce((s, v) => s + v, 0) / count : (b.lo + b.hi) / 2;
      const observedFreq = count > 0 ? b.outcomes.reduce((s, v) => s + v, 0) / count : 0;
      return { lo: b.lo, hi: b.hi, count, meanScore, observedFreq };
    });

    this.buckets = table;
    return { nBuckets: n, table };
  }

  /**
   * Map score to calibrated probability via bucket interpolation.
   */
  calibrate(rawConsensusScore, context = {}) {
    if (rawConsensusScore === null || rawConsensusScore === undefined || !Number.isFinite(rawConsensusScore)) {
      return { calibratedProbability: null, metadata: { appliedStrategy: this.name } };
    }

    if (!this.buckets || this.buckets.length === 0) {
      return { calibratedProbability: rawConsensusScore, metadata: { appliedStrategy: this.name, notes: 'not trained — passthrough' } };
    }

    const b = this.buckets.find(bucket => rawConsensusScore >= bucket.lo && rawConsensusScore < bucket.hi);
    const freq = b ? b.observedFreq : rawConsensusScore;

    return {
      calibratedProbability: Math.max(0, Math.min(1, freq)),
      metadata: { appliedStrategy: this.name, bucket: b, description: b ? `Bucket [${b.lo.toFixed(2)},${b.hi.toFixed(2)})` : 'extrapolated' },
    };
  }

  serialize() {
    return {
      name: this.name,
      strategyVersion: this.strategyVersion,
      parameters: { nBuckets: this.nBuckets, table: this.buckets },
    };
  }

  static deserialize(data) {
    const inst = new HistogramCalibration({ nBuckets: data.parameters?.nBuckets ?? 10 });
    inst.buckets = data.parameters?.table ?? null;
    return inst;
  }

  validateModel(model) {
    const base = super.validateModel(model);
    if (!base.valid) return base;
    if (!model.parameters?.table || !Array.isArray(model.parameters.table)) {
      return { valid: false, issues: [{ message: 'Histogram model missing table.', severity: 'error' }] };
    }
    return { valid: true, issues: [] };
  }
}
