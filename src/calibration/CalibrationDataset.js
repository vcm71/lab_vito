/**
 * CalibrationDataset — immutable collection of historical records for
 * training calibration models.
 *
 * Each record links a rawConsensusScore to an observedOutcome (0/1).
 */

export class CalibrationDataset {
  /**
   * @param {Object} options
   * @param {string} options.id — dataset identifier
   * @param {string} options.datasetVersion — semver string
   * @param {Array} options.records — array of { rawConsensusScore, observedOutcome, timestamp, wheelVersion, configurationVersion }
   * @param {Object} [options.metadata] — extra metadata
   */
  constructor(options = {}) {
    this.id = options.id ?? null;
    this.datasetVersion = options.datasetVersion ?? 'unversioned';
    this.records = Object.freeze([...(options.records ?? [])]);
    this.metadata = Object.freeze({ ...(options.metadata ?? {}) });
    this.createdAt = new Date().toISOString();
    this.recordCount = this.records.length;
    Object.freeze(this);
  }

  /**
   * Iterate records without exposing mutable reference.
   */
  [Symbol.iterator]() {
    return this.records[Symbol.iterator]();
  }

  /**
   * Slice a new dataset (used for train/test splits).
   */
  slice(start, end) {
    const sliced = this.records.slice(start, end);
    return new CalibrationDataset({
      id: `${this.id}_slice_${start}_${end}`,
      datasetVersion: this.datasetVersion,
      records: sliced,
      metadata: { ...this.metadata, parentDataset: this.id },
    });
  }

  /**
   * Shuffle and return a new dataset.
   */
  shuffle(seed = 42) {
    const rng = mulberry32(seed);
    const shuffled = [...this.records];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return new CalibrationDataset({
      id: `${this.id}_shuffled`,
      datasetVersion: this.datasetVersion,
      records: shuffled,
      metadata: { ...this.metadata, parentDataset: this.id, seed },
    });
  }

  toJSON() {
    return {
      id: this.id,
      datasetVersion: this.datasetVersion,
      records: [...this.records],
      metadata: { ...this.metadata },
      createdAt: this.createdAt,
      recordCount: this.recordCount,
    };
  }
}

/** Seeded PRNG for reproducible shuffles */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
