export const DEFAULT_CONFIG = {
  enabled: true,
  windowSize: 'total',
  confidenceThreshold: 0.95
};

export function getConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}
