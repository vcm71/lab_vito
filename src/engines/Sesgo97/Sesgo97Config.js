/**
 * Sesgo97Config — configuración del motor de Análisis de Sesgo 97.
 */
export const DEFAULT_CONFIG = {
  enabled: true,
  sectorSize: 5,
  topSectorSize: 5,
  topRanking: 10
};

export function getConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}
