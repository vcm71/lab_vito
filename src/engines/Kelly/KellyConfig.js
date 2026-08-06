export const DEFAULT_CONFIG = {
  enabled: true,
  fraction: 0.25,
  stopLossPct: 0.20,
  takeProfitPct: 0.30,
  minConfidence: 0.30
};

export function getConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}
