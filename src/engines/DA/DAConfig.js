/**
 * DAConfig — configuración del motor de Distancia Absoluta.
 */
export const DEFAULT_CONFIG = {
  enabled: true,
  maxWindow: 100,
  showLast: 20
};

export function getConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}
