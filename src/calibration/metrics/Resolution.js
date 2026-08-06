/** Resolution — how much conditional outcome probabilities vary across prediction bins. */
export function resolution(predictions, outcomes, nBuckets = 10) {
  if (!predictions.length) return 0;
  const overallMean = outcomes.reduce((s, v) => s + v, 0) / outcomes.length;
  const bucketSize = 1 / nBuckets;
  let res = 0;
  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize, hi = (b + 1) * bucketSize;
    let sumPred = 0, sumOut = 0, count = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] >= lo && predictions[i] < hi) { sumPred += predictions[i]; sumOut += outcomes[i]; count++; }
    }
    if (!count) continue;
    const binMean = sumOut / count;
    res += (count / predictions.length) * (binMean - overallMean) ** 2;
  }
  return res;
}
