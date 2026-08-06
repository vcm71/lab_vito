export const DEFAULT_CONFIG = {
  enabled: true,
  lambda: 0.01,
  minSpins: 50,
  edgeThreshold: 0.50,
  stabilityThreshold: 0.40
};

export function getConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}
