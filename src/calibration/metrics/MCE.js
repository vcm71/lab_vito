/** Maximum Calibration Error (MCE) — worst-case |accuracy - confidence| across all buckets. */
export function mce(predictions, outcomes, nBuckets = 10) {
  if (!predictions.length) return 0;
  const bucketSize = 1 / nBuckets;
  let maxErr = 0;
  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize;
    const hi = (b + 1) * bucketSize;
    let sumPred = 0, sumOut = 0, count = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] >= lo && predictions[i] < hi) { sumPred += predictions[i]; sumOut += outcomes[i]; count++; }
    }
    if (count === 0) continue;
    const err = Math.abs(sumOut / count - sumPred / count);
    if (err > maxErr) maxErr = err;
  }
  return maxErr;
}
