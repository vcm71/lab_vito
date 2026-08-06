/** Log Loss / Cross-Entropy */
export function logLoss(predictions, outcomes, eps = 1e-15) {
  if (!predictions.length) return 0;
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    const p = Math.max(eps, Math.min(1 - eps, predictions[i]));
    sum += outcomes[i] * Math.log(p) + (1 - outcomes[i]) * Math.log(1 - p);
  }
  return -sum / predictions.length;
}
