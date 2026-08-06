2026-08-02T16:26:53-04:00
# Fase5.2.2 — Public Collection Mutability Safety Audit

## Baseline
- Rama: main
- Estado del árbol: sucio con cambios preexistentes fuera de esta fase
- Tests: npm test ✅
- Lint: npm run lint ✅
- Build: npm run build ✅

## Superficie auditada
- `RouletteTracker.getSpins()`
- `RouletteTracker.getHistory()`
- `RouletteTracker.getSession()`
- `RouletteTracker.getSettings()`
- `RouletteTracker.getSeries()`
- `RouletteTracker.getLastSpin()`
- `RouletteTracker.getLastSession()`
- `SpinManager.getSpins()` / `getHistory()`
- `SessionManager.getSession()`
- `SettingsManager.get()`
- `HistoryManager.getHistory()` / `getLastSession()`

## Clasificación de consumidores
### Lectura pura
- Renderers que solo recorren los datos para pintar UI.
- Engines que calculan estadísticas o señales sin escribir en las colecciones.
- Adaptadores de consenso que consumen datos para crear señales.

### Identidad viva intencional
- `DelayManager(() => tracker.getSpins())`
- `RouletteAnalytics.refresh(spins, settings)`
- Pruebas de regresión que mutan `getSettings()` para fijar el contrato actual.

### Protección por clon
- `LabConAdapter`
- `LabCon1Adapter`
- `AtRepAdapter` en los caminos donde ya hay copia superficial o aislamiento de entrada.

## Hallazgos
### High
- Los getters principales devuelven referencias vivas al estado interno.
- Eso habilita mutación externa de `spins`, `history`, `session`, `settings` y `customSeries`.

### Medium
- Varias rutas dependen explícitamente de esa identidad viva.
- Cambiar el contrato a copias sería una ruptura para consumidores y tests.

### Low
- Algunos adaptadores ya se protegen con copias superficiales y disminuyen el riesgo.

### Informational
- No se observó mutación directa en consumidores de producción fuera de los managers propietarios.

## Tests relevantes
- `tests/regression/tracker-regression.test.js`
- `tests/integration/session-lifecycle.integration.test.js`
- `tests/integration/session-history.integration.test.js`
- `tests/integration/tracker-delay.integration.test.js`
- `tests/unit/managers/SpinManager.test.js`
- `tests/unit/managers/DelayManager.test.js`

## Decisión contractual
- Mantener la semántica actual.
- No introducir clones globales en esta subfase.
- Documentar el riesgo de mutación externa.

## Riesgos residuales
- Mutaciones desde código externo pueden eludir validaciones del manager.
- Cualquier migración futura debe planificarse junto a los consumidores con dependencia de identidad.

## Veredicto
PASS WITH CONDITIONS
