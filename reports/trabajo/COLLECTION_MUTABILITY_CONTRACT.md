2026-08-02T15:48:41-04:00
# COLLECTION_MUTABILITY_CONTRACT

## Criterio
Se clasifica cada API según si devuelve:
- referencia viva mutable
- copia nueva
- valor primitivo
- objeto derivado nuevo

## Matriz principal

| API | Ubicación | Tipo actual | Contrato observado |
| --- | --- | --- | --- |
| `SpinManager.getSpins()` | `src/tracker/SpinManager.js:125-127` | array | referencia viva mutable |
| `SpinManager.getHistory()` | `src/tracker/SpinManager.js:133-135` | array | copia nueva (`[...]`) |
| `SpinManager.getLastSpin()` | `src/tracker/SpinManager.js:141-144` | objeto / undefined | referencia al último spin |
| `SpinManager.getLastNumber()` | `src/tracker/SpinManager.js:150-153` | string / undefined | valor primitivo derivado |
| `HistoryManager.getHistory()` | `src/tracker/HistoryManager.js:77-79` | array | referencia viva mutable |
| `HistoryManager.getLastSession()` | `src/tracker/HistoryManager.js:85-88` | objeto / null | referencia al último elemento |
| `SessionManager.getSession()` | `src/tracker/SessionManager.js:63-65` | objeto | referencia viva mutable |
| `SessionManager.getSpinCount()` | `src/tracker/SessionManager.js:78-80` | number | valor primitivo |
| `SessionManager.getStartedAt()` | `src/tracker/SessionManager.js:86-88` | string / null | valor primitivo |
| `SettingsManager.get()` | `src/tracker/SettingsManager.js:55-57` | objeto | referencia viva mutable |
| `SettingsManager.getDefault()` | `src/tracker/SettingsManager.js:106-108` | objeto | objeto nuevo por llamada |
| `RouletteTracker.getSpins()` | `src/tracker/RouletteTracker.js` | array | referencia viva (vía SpinManager) |
| `RouletteTracker.getHistory()` | `src/tracker/RouletteTracker.js:185-187` | array | referencia viva al historial interno |
| `RouletteTracker.getSession()` | `src/tracker/RouletteTracker.js:330-332` | objeto | referencia viva (vía SessionManager) |
| `RouletteTracker.getSettings()` | `src/tracker/RouletteTracker.js:363-365` | objeto | referencia viva (vía SettingsManager) |
| `RouletteTracker.getHitMap()` | `src/tracker/RouletteTracker.js:540-547` | object | objeto nuevo derivado |
| `RouletteTracker.getHitRanking()` | `src/tracker/RouletteTracker.js:554-558` | array | array nuevo derivado |

## Evidencia de tests
- `tests/regression/tracker-regression.test.js` cubre mutabilidad de `getSpins()`, `getHistory()`, `getSession()` y `getSettings()`
- el mismo archivo confirma que `getHitMap()` y `getHitRanking()` producen nuevas estructuras

## Clasificación
- APIs de referencia viva: contractualmente mutables, no copiar en el consumidor sin necesidad
- APIs derivadas: seguras para lectura, pero no deben tomarse como referencias internas
- APIs primitivas: estables para consumo directo

## Riesgo residual
- Las referencias vivas son intencionales pero propensas a mutación externa accidental
- Cualquier consumidor nuevo debe tratar estos getters como parte del contrato, no como detalle accidental
