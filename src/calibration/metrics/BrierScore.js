/** Brier Score — mean squared error between predictions and outcomes. */
export function brierScore(predictions, outcomes) {
  if (!predictions.length) return 0;
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) sum += (predictions[i] - outcomes[i]) ** 2;
  return sum / predictions.length;
}
