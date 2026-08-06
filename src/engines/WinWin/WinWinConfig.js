/**
 * WinWinConfig — configuración del motor WinWin.
 */
export const DEFAULT_CONFIG = {
  enabled: true,
  threshold: 20
};

export function getConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}
