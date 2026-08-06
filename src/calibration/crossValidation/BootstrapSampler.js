/**
 * BootstrapSampler — architecture-only support for bootstrap resampling.
 * Not required to execute. Interface prepared for future use.
 */

export class BootstrapSampler {
  constructor(options = {}) {
    this.nSamples = options.nSamples ?? 1000;
    this.seed = options.seed ?? 42;
  }

  /**
   * Generate bootstrap samples (with replacement).
   * @param {import('../CalibrationDataset.js').CalibrationDataset} dataset
   * @returns {Array<{sample:CalibrationDataset, idx:number}>}
   */
  sample(dataset) {
    const rng = mulberry32(this.seed);
    const n = dataset.records.length;
    const samples = [];

    for (let i = 0; i < this.nSamples; i++) {
      const resampled = [];
      for (let j = 0; j < n; j++) {
        resampled.push(dataset.records[Math.floor(rng() * n)]);
      }
      samples.push({
        idx: i,
        sample: new (dataset.constructor)({
          id: `${dataset.id}_bs_${i}`,
          datasetVersion: dataset.datasetVersion,
          records: resampled,
          metadata: { ...dataset.metadata, bootstrapSample: i, nSamples: this.nSamples },
        }),
      });
    }

    return samples;
  }
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
