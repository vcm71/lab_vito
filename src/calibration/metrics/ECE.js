/** Expected Calibration Error (ECE) — weighted average of |accuracy - confidence| per bucket. */
export function ece(predictions, outcomes, nBuckets = 10) {
  if (!predictions.length) return 0;
  const bucketSize = 1 / nBuckets;
  let total = 0;
  for (let b = 0; b < nBuckets; b++) {
    const lo = b * bucketSize;
    const hi = (b + 1) * bucketSize;
    const idx = [];
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] >= lo && predictions[i] < hi) idx.push(i);
    }
    if (!idx.length) continue;
    const conf = idx.reduce((s, i) => s + predictions[i], 0) / idx.length;
    const acc = idx.reduce((s, i) => s + outcomes[i], 0) / idx.length;
    total += (idx.length / predictions.length) * Math.abs(acc - conf);
  }
  return total;
}
