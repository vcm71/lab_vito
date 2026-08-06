/** Sharpness — variance of predictions. Lower = more concentrated. */
export function sharpness(predictions) {
  if (predictions.length < 2) return 0;
  const mean = predictions.reduce((s, v) => s + v, 0) / predictions.length;
  return predictions.reduce((s, v) => s + (v - mean) ** 2, 0) / (predictions.length - 1);
}
