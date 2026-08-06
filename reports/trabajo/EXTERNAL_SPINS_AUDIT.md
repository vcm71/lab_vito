2026-08-02T16:45:12-04:00
# EXTERNAL_SPINS_AUDIT

## Inventario completo

### Código fuente
- `src/tracker/RouletteTracker.js`
  - `recordAndClearSession()` ya opera sobre `this.getSpins()`.
  - `getHitMap()` ya opera sobre `this.getSpins()`.
  - `getHitRanking()` delega en `getHitMap()` sin argumentos.
- `main.js`
  - No se detectaron llamadas activas que pasen `externalSpins`.
- `monteCarloValidator.js`
  - Componente autocontenido; no consume `externalSpins` ni el Domain Tracker global.

### Documentación histórica
- `reports/Fase5.3.md`
- `reports/trabajo/FASE_5_3_EXTERNAL_SPINS_REMOVAL.md`
- `Refactura_hermes/Fase5.1_hermes.md`
- `Refactura_hermes/Fase5.2.5_hermes.md`
- `Refactura_hermes/Fase5.3_hermes.md`
- `Refactura_hermes/Fase5.4_hermes.md`
- `Refactura_hermes/Fase5.5.1_hermes.md`
- `Refactura_hermes/Fase5.5.3_hermes.md`
- `Refactura_hermes/Fase5.5.4_hermes.md`

## Clasificación
- ACTIVO: 0
- LEGACY: 0 en runtime; solo menciones históricas
- NO USADO: 0 en código fuente
- REDUNDANTE: 0
- MIGRADO: superficie funcional ya migrada previamente
- DESCONOCIDO: 0 tras búsquedas exhaustivas

## Criterio de auditoría
- La búsqueda en `*.js` no devolvió coincidencias activas para `ExternalSpin`, `ExternalSpins`, `externalSpin` ni `externalSpins`.
- Las coincidencias restantes pertenecen a reportes o documentación heredada.
