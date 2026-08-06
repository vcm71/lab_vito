export const DEFAULT_CONFIG = { enabled: true, showInputPanel: true };
export function getConfig(overrides = {}) { return { ...DEFAULT_CONFIG, ...overrides }; }
