2026-08-02T16:26:53-04:00
# PUBLIC_MUTABILITY_MIGRATION_PLAN

## Estado
No se propone una migración obligatoria en esta subfase.

## APIs que podrían requerir migración futura
1. `RouletteTracker.getSettings()`
2. `RouletteTracker.getSession()`
3. `RouletteTracker.getHistory()`
4. `RouletteTracker.getSeries()`
5. `RouletteTracker.getSpins()`

## Motivo
- Todas exponen referencias vivas del estado.
- Cualquier cambio a snapshots/clones rompería consumidores que dependen de identidad o mutación controlada.

## Consumidores a revisar primero
- `tests/regression/tracker-regression.test.js`
- `DelayManager`
- `RouletteAnalytics`
- `main.js`
- adaptadores de consenso (`LabConAdapter`, `LabCon1Adapter`, `AtRepAdapter`)

## Compatibilidad
- Mantener el contrato actual en esta fase.
- Si se migra más adelante, introducir primero APIs explícitas de lectura protegida y después marcar deprecación.

## Tests necesarios para una migración futura
- Contratos de referencia viva vs copia.
- Pruebas de mutación accidental en arrays/objetos devueltos.
- Pruebas de compatibilidad de consumidores con snapshots.
- Pruebas de no regresión en `recordAndClearSession()` y `clearSession()`.

## Estrategia de deprecación
- Documentar el contrato actual.
- Introducir getters alternativos de solo lectura si hace falta.
- Migrar consumidores uno por uno.
- Solo después cambiar la semántica por defecto.

## Riesgo
- Alto si se cambia sin coordinación.
- Bajo si se mantiene el contrato actual.
