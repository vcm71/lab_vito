2026-08-02T16:26:53-04:00
# PUBLIC_MUTABILITY_CONSUMER_MATRIX

| Consumidor | API usada | Clasificación | Observación |
| --- | --- | --- | --- |
| `main.js` | `getSpins()`, `getSettings()`, `getSeries()` | Lectura pura / identidad viva implícita | Recalcula UI, activa toggles y reanuda analytics con datos actuales. |
| `src/tracker/DelayManager.js` | función `() => tracker.getSpins()` | Identidad viva intencional | Requiere array actualizado para invalidación y caché de atrasos. |
| `src/analytics/RouletteAnalytics.js` | `refresh(spins, settings)` | Identidad viva intencional | Recibe snapshots de referencia para recomputar métricas. |
| `src/consensus/adapters/LabConAdapter.js` | `getSpins()` | Protección por clon | Copia superficial antes de producir señales. |
| `src/consensus/adapters/LabCon1Adapter.js` | `getSpins()` | Protección por clon | Devuelve copia superficial del arreglo. |
| `src/consensus/adapters/AtRepAdapter.js` | `getSpins()` / `_spins` | Mixto | En algunos caminos usa el array vivo; en otros protege el input. |
| `src/engines/Orion/LogicEngine.js` | `getSpins()` | Lectura pura | Usa el historial para estadística/regímenes. |
| `src/engines/WinWin/WinWinEngine.js` | `getSpins()` | Lectura pura | Calcula métricas históricas y de chi/inercia. |
| `src/engines/Chi/ChiAnalysisEngine.js` | `getSpins()` | Lectura pura | Recorre grupos/externalidades para análisis. |
| `src/engines/Sesgo97/Sesgo97Logic.js` | `getSettings()` | Lectura pura | Toma parámetros de configuración. |
| `src/viewmodels/atRepViewModel.js` | `getSettings()` | Lectura pura | Lee topK y umbrales. |
| `tests/regression/tracker-regression.test.js` | `getSettings()` | Mutación intencional en test | Fija el contrato actual de referencia viva. |
| `tests/integration/session-lifecycle.integration.test.js` | `getSession()`, `getSpins()` | Lectura/validación | Confirma semántica de sesión y preservación de spins. |
| `tests/integration/session-history.integration.test.js` | `getHistory()`, `getLastSession()` | Lectura/validación | Verifica almacenamiento y recuperación de sesiones. |

## Resumen
- Total de consumidores relevantes observados: múltiples, con predominio de lectura pura.
- Consumidores que requieren identidad viva: pocos, pero reales.
- Consumidores con clon defensivo: algunos, y son los más seguros.
- Consumidores con mutación explícita: solo pruebas de contrato.
