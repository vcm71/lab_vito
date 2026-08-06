export const DEFAULT_CONFIG = { enabled: true };
export function getConfig(overrides = {}) { return { ...DEFAULT_CONFIG, ...overrides }; }
