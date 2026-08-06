/** Uncertainty — inherent unpredictability: overallMean * (1 - overallMean). */
export function uncertainty(outcomes) {
  if (!outcomes.length) return 0;
  const mean = outcomes.reduce((s, v) => s + v, 0) / outcomes.length;
  return mean * (1 - mean);
}
