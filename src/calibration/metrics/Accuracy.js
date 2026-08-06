/** Accuracy — fraction of predictions on correct side of threshold. */
export function accuracy(predictions, outcomes, threshold = 0.5) {
  if (!predictions.length) return 0;
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    if ((predictions[i] >= threshold ? 1 : 0) === outcomes[i]) correct++;
  }
  return correct / predictions.length;
}
