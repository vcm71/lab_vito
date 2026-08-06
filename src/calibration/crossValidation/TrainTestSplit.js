/**
 * TrainTestSplit — splits a dataset into training, validation, and testing sets.
 * NEVER mix them.
 */

export function trainTestSplit(dataset, options = {}) {
  const trainRatio = options.trainRatio ?? 0.7;
  const valRatio = options.valRatio ?? 0.15;
  const seed = options.seed ?? 42;

  if (trainRatio + valRatio > 1) throw new Error('trainTestSplit: ratios exceed 1.');
  if (!dataset || !dataset.records || !dataset.records.length) throw new TypeError('trainTestSplit: dataset must have records.');

  const shuffled = dataset.shuffle(seed);
  const n = shuffled.records.length;
  const trainEnd = Math.floor(n * trainRatio);
  const valEnd = Math.floor(n * (trainRatio + valRatio));

  return {
    training: shuffled.slice(0, trainEnd),
    validation: shuffled.slice(trainEnd, valEnd),
    testing: shuffled.slice(valEnd),
  };
}
