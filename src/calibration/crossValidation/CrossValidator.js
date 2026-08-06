/**
 * CrossValidator — K-Fold cross-validation.
 * Configurable K, decoupled from strategies.
 */

export class CrossValidator {
  constructor(options = {}) {
    this.k = options.k ?? 5;
    this.seed = options.seed ?? 42;
  }

  /**
   * Run K-Fold cross-validation.
   * @param {import('../CalibrationDataset.js').CalibrationDataset} dataset
   * @param {Function} trainFn — (trainDs, valDs, foldIdx) => metrics
   * @returns {Array<{fold:number, metrics:Object}>}
   */
  run(dataset, trainFn) {
    const k = this.k;
    const n = dataset.records.length;
    if (n < k) throw new Error(`CrossValidator: dataset has ${n} records, need at least ${k} for ${k}-fold.`);

    const shuffled = dataset.shuffle(this.seed);
    const foldSize = Math.floor(n / k);
    const results = [];

    for (let fold = 0; fold < k; fold++) {
      const valStart = fold * foldSize;
      const valEnd = fold === k - 1 ? n : (fold + 1) * foldSize;
      const valRecords = shuffled.records.slice(valStart, valEnd);
      const trainRecords = [...shuffled.records.slice(0, valStart), ...shuffled.records.slice(valEnd)];

      const trainDs = new (dataset.constructor)({
        id: `${dataset.id}_fold${fold}_train`,
        datasetVersion: dataset.datasetVersion,
        records: trainRecords,
        metadata: { ...dataset.metadata, fold: fold, role: 'train' },
      });

      const valDs = new (dataset.constructor)({
        id: `${dataset.id}_fold${fold}_val`,
        datasetVersion: dataset.datasetVersion,
        records: valRecords,
        metadata: { ...dataset.metadata, fold: fold, role: 'validation' },
      });

      results.push({ fold, metrics: trainFn(trainDs, valDs, fold) });
    }

    return results;
  }
}
