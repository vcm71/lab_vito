2026-08-02T16:26:53-04:00
# PUBLIC_MUTABILITY_INVARIANT_ANALYSIS

## Spins
- Fuente única de verdad: `SpinManager` sobre `TrackerState.spins`.
- `getSpins()` devuelve la referencia viva del array.
- `getHistory()` en `SpinManager` devuelve copia superficial; `RouletteTracker.getSpins()` delega al manager.
- Riesgo: mutación externa de un spin individual o del array completo.

## Historial
- `HistoryManager.getHistory()` devuelve la referencia viva de `TrackerState.history`.
- `RouletteTracker.getHistory()` delega a `state.history` directamente.
- Riesgo: inserciones/eliminaciones externas sin pasar por `HistoryManager`.

## Sesión
- `SessionManager.getSession()` devuelve el objeto de sesión vivo.
- `RouletteTracker.getSession()` delega sin clonar.
- Riesgo: cambios externos en `active`, `startedAt`, `endedAt` o `spinCount`.

## Settings
- `SettingsManager.get()` devuelve `TrackerState.settings` sin clonar.
- `RouletteTracker.getSettings()` expone la misma referencia.
- Riesgo: mutación accidental o deliberada de claves top-level y anidadas.
- Evidencia de contrato vivo: la regresión verifica que `settings` y `getSettings()` son la misma referencia.

## Colecciones adicionales
- `getSeries()` devuelve `settings.customSeries || []`, que puede ser una referencia viva a una colección anidada.
- `DelayManager` depende de una función que lea spins actuales.
- `RouletteAnalytics` guarda referencias de `spins` y `settings` para recálculo.

## Conclusión
- El dominio usa referencias vivas como contrato funcional, no como accidente aislado.
- No se encontró una mutación peligrosa reproducida en producción, pero sí una superficie real de mutación externa.
- La semántica debe documentarse antes de cualquier migración a copias o proxies de lectura.
