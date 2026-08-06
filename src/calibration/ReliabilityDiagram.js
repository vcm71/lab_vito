/**
 * ReliabilityDiagram — data structure only (no UI).
 *
 * Produces per-bucket: prediction mean, observed frequency, count, error.
 */
export function buildReliabilityDiagram(predictions, outcomes, nBuckets = 10) {
  const bucketSize = 1 / nBuckets;
  const buckets = [];

  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize;
    const hi = (b + 1) * bucketSize;
    let sumPred = 0, sumOut = 0, count = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] >= lo && predictions[i] < hi) {
        sumPred += predictions[i];
        sumOut += outcomes[i];
        count++;
      }
    }
    buckets.push({
      bucket: b,
      lo: parseFloat(lo.toFixed(3)),
      hi: parseFloat(hi.toFixed(3)),
      meanPrediction: count ? parseFloat((sumPred / count).toFixed(6)) : null,
      observedFrequency: count ? parseFloat((sumOut / count).toFixed(6)) : null,
      count,
      error: count ? parseFloat(Math.abs(sumOut / count - sumPred / count).toFixed(6)) : null,
    });
  }

  return { nBuckets, buckets };
}
