/**
 * SyntheticCalibrationDatasetFactory — generates training and test datasets
 * with known calibration properties for benchmarking.
 *
 * Datasets:
 *  1. 'wellCalibrated' — predictions match outcomes (perfect calibration)
 *  2. 'overconfident' — predictions cluster near 0/1
 *  3. 'underconfident' — predictions cluster near 0.5
 *  4. 'skewed' — predictions biased away from outcomes
 *  5. 'uniform' — uniform predictions [0,1]
 *
 * All datasets have matching outcomes drawn from Bernoulli(predicted_prob).
 * Each generation is REPRODUCIBLE given the same seed.
 */

import { CalibrationDataset } from './CalibrationDataset.js';
import { createSeededRandom } from './SeededRandom.js';

export class SyntheticCalibrationDatasetFactory {
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.algorithm = options.algorithm ?? 'xoshiro128**';
  }

  /**
   * Generate a named synthetic dataset.
   * @param {'wellCalibrated'|'overconfident'|'underconfident'|'skewed'|'uniform'} type
   * @param {number} [n=1000]
   * @param {number} [seedOverride]
   * @returns {CalibrationDataset}
   */
  generate(type, n = 1000, seedOverride = null) {
    const rng = createSeededRandom(this.algorithm, seedOverride ?? this.seed);
    const records = [];
    const tsBase = Date.now();

    // Synthetic grouping: ~10 groups of equal size
    const groupCount = 10;
    const baseSize = Math.floor(n / groupCount);

    for (let i = 0; i < n; i++) {
      const p = this._prediction(type, i, n, rng);
      const outcome = rng.next() < p ? 1 : 0;
      const groupIndex = Math.min(Math.floor(i / baseSize), groupCount - 1);

      records.push({
        rawConsensusScore: parseFloat(p.toFixed(8)),
        observedOutcome: outcome,
        timestamp: new Date(tsBase + i * 1000).toISOString(),
        syntheticType: type,
        syntheticIndex: i,
        wheelVersion: `wheel_v${(groupIndex % 3) + 1}`,
        configurationVersion: `config_${String.fromCharCode(65 + (groupIndex % 4))}`,
        __groupId: `synth_group_${String(groupIndex).padStart(3, '0')}`,
      });
    }

    return new CalibrationDataset({
      id: `synthetic_${type}_n${n}`,
      datasetVersion: '1.0.0',
      records,
      metadata: {
        synthetic: true,
        type,
        n,
        seed: seedOverride ?? this.seed,
        algorithm: this.algorithm,
        groupCount,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Generate all 5 standard datasets.
   * @returns {Object<string, CalibrationDataset>}
   */
  generateAll(n = 1000) {
    const types = ['wellCalibrated', 'overconfident', 'underconfident', 'skewed', 'uniform'];
    const datasets = {};
    for (const type of types) {
      // Each type gets a distinct deterministic seed
      const seed = this.seed + types.indexOf(type) * 1000;
      datasets[type] = this.generate(type, n, seed);
    }
    return datasets;
  }

  /**
   * Generate train/test split datasets with the same properties.
   * @returns {{train: Object<string, CalibrationDataset>, test: Object<string, CalibrationDataset>}}
   */
  generateTrainTest(nTrain = 800, nTest = 200) {
    const types = ['wellCalibrated', 'overconfident', 'underconfident', 'skewed', 'uniform'];
    const train = {}, test = {};
    for (const type of types) {
      train[type] = this.generate(type, nTrain, this.seed + types.indexOf(type) * 1000);
      test[type] = this.generate(type, nTest, this.seed + types.indexOf(type) * 1000 + 10000);
    }
    return { train, test };
  }

  // --- prediction generators ---

  _prediction(type, i, n, rng) {
    switch (type) {
      case 'wellCalibrated':
        return rng.next();
      case 'overconfident':
        // Push toward extremes
        return rng.next() < 0.9
          ? (rng.next() < 0.5 ? rng.next() * 0.1 : 0.9 + rng.next() * 0.1)
          : rng.next();
      case 'underconfident':
        // Cluster in [0.3, 0.7]
        return 0.3 + rng.next() * 0.4;
      case 'skewed':
        // Predictions ~ Beta(2,5) — biased low
        return _betaSample(rng, 2, 5);
      case 'uniform':
        return (i / n) + (rng.next() - 0.5) * 0.1; // slightly ascending
      default:
        return rng.next();
    }
  }
}

/**
 * Simple Beta(alpha, beta) sampling via gamma method.
 */
function _betaSample(rng, alpha, beta) {
  // Sum of 2*alpha uniform(-ln u) for gamma(alpha,1) approximation
  let x = 0;
  for (let k = 0; k < Math.ceil(alpha) * 2; k++) {
    x += -Math.log(Math.max(rng.next(), 1e-12));
  }
  let y = 0;
  for (let k = 0; k < Math.ceil(beta) * 2; k++) {
    y += -Math.log(Math.max(rng.next(), 1e-12));
  }
  return x / (x + y);
}
