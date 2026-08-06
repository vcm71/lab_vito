/**
 * GroupedTemporalSplit — split calibration dataset by groups.
 *
 * Ensures all observations from the same group (e.g. wheelVersion,
 * configurationVersion, or session) stay together in one partition.
 *
 * NO row from a group appears in both train and test.
 *
 * Produces: { trainingSet, testSet, validationSet? }
 */

import { CalibrationDataset } from './CalibrationDataset.js';
import { createSeededRandom } from './SeededRandom.js';

const DEFAULT_SPLIT = { train: 0.70, validation: 0.15, test: 0.15 };

/**
 * Split a CalibrationDataset into train/validation/test by groups.
 *
 * @param {Object} options
 * @param {CalibrationDataset} options.dataset
 * @param {string} options.groupField — field name for grouping (e.g. 'wheelVersion', 'configurationVersion')
 * @param {{train:number, validation:number, test:number}} [options.ratios]
 * @param {number} [options.seed=42]
 * @param {number} [options.minGroups=3] — fail if fewer groups than this
 * @returns {{ trainingSet: CalibrationDataset, validationSet: CalibrationDataset|null, testSet: CalibrationDataset, groups: {train:string[], validation:string[], test:string[]}, summary: Object }}
 */
export function groupedTemporalSplit(options) {
  const { dataset, groupField, ratios, seed, minGroups } = options;
  const r = ratios ?? DEFAULT_SPLIT;
  const totalRatio = r.train + (r.validation ?? 0) + r.test;
  if (Math.abs(totalRatio - 1) > 0.001) {
    throw new Error(`GroupedTemporalSplit: ratios must sum to 1.0 (got ${totalRatio}).`);
  }

  // 1. Group records by the group field
  const groups = new Map();
  for (const record of dataset.records) {
    const key = String(record[groupField] ?? '__null__');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const groupKeys = Array.from(groups.keys());
  const numGroups = groupKeys.length;

  if (numGroups < (minGroups ?? 3)) {
    return {
      trainingSet: null,
      validationSet: null,
      testSet: null,
      groups: { train: [], validation: [], test: [] },
      summary: {
        status: 'INSUFFICIENT_GROUPS',
        reason: `Only ${numGroups} group(s) found (field: "${groupField}", min: ${minGroups ?? 3}).`,
        totalGroups: numGroups,
        totalRecords: dataset.records.length,
      },
    };
  }

  // 2. Sort groups by key (stable temporal proxy when groupField implies ordering)
  groupKeys.sort();

  // 3. Assign group indices to train/val/test using shuffled group indices
  //    This preserves intra-group integrity while randomizing assignment
  const rng = createSeededRandom('xoshiro128**', seed ?? 42);

  // Create shuffled group indices
  const indices = Array.from({ length: numGroups }, (_, i) => i);
  rng.shuffle(indices);

  const trainCount = Math.max(1, Math.round(numGroups * r.train));
  const valCount = r.validation > 0 ? Math.max(1, Math.round(numGroups * r.validation)) : 0;
  const testCount = numGroups - trainCount - valCount;

  if (testCount < 1) {
    return {
      trainingSet: null,
      validationSet: null,
      testSet: null,
      groups: { train: [], validation: [], test: [] },
      summary: {
        status: 'INSUFFICIENT_GROUPS',
        reason: `Cannot allocate test set with ${numGroups} groups (need train=${trainCount}, val=${valCount}, test=${testCount}).`,
        totalGroups: numGroups,
        totalRecords: dataset.records.length,
      },
    };
  }

  const trainIndices = new Set(indices.slice(0, trainCount));
  const valIndices = new Set(indices.slice(trainCount, trainCount + valCount));
  const testIndices = new Set(indices.slice(trainCount + valCount));

  const trainKeys = groupKeys.filter((_, i) => trainIndices.has(i));
  const valKeys = groupKeys.filter((_, i) => valIndices.has(i));
  const testKeys = groupKeys.filter((_, i) => testIndices.has(i));

  // 4. Build datasets
  const collectRecords = (keys) => {
    const records = [];
    for (const k of keys) {
      records.push(...groups.get(k));
    }
    return records;
  };

  const trainingSet = new CalibrationDataset({
    records: collectRecords(trainKeys),
    datasetVersion: `split_${dataset.datasetVersion ?? 'unknown'}_train`,
    metadata: { ...(dataset.metadata ?? {}), splitGroupField: groupField, splitRole: 'training' },
  });

  const validationSet = valKeys.length > 0
    ? new CalibrationDataset({
        records: collectRecords(valKeys),
        datasetVersion: `split_${dataset.datasetVersion ?? 'unknown'}_validation`,
        metadata: { ...(dataset.metadata ?? {}), splitGroupField: groupField, splitRole: 'validation' },
      })
    : null;

  const testSet = new CalibrationDataset({
    records: collectRecords(testKeys),
    datasetVersion: `split_${dataset.datasetVersion ?? 'unknown'}_test`,
    metadata: { ...(dataset.metadata ?? {}), splitGroupField: groupField, splitRole: 'test' },
  });

  return {
    trainingSet,
    validationSet,
    testSet,
    groups: { train: trainKeys, validation: valKeys, test: testKeys },
    summary: {
      status: 'OK',
      totalGroups: numGroups,
      totalRecords: dataset.records.length,
      trainGroups: trainKeys.length,
      validationGroups: valKeys.length,
      testGroups: testKeys.length,
      trainRecords: trainingSet.records.length,
      validationRecords: validationSet?.records.length ?? 0,
      testRecords: testSet.records.length,
      groupField,
      seed: seed ?? 42,
    },
  };
}
