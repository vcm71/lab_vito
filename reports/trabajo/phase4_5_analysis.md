# Análisis Fase 4.5 — Composición del Root (main.js)

## Resumen

**Archivo:** `main.js` — 2588 líneas, 119 KB

**Propósito actual:** Punto de entrada único. Inicializa la app, conecta el dominio (RouletteTracker + managers) con la UI, registra listeners, renderiza paneles, y contiene **lógica de negocio** que debe migrarse al dominio.

---

## Clasificación por bloques

### A) Inicialización / Bootstrap (seguro en main.js — Composition Root)

| Líneas | Contenido | Estado |
|--------|-----------|--------|
| 1-15 | Imports de módulos y librerías | ✅ OK |
| 17-20 | `kernel.bootstrap()`, obtención del tracker y settings | ✅ OK |
| 22-26 | Obtención de engines vía `kernel.engineRegistry.get(...)` | ⚠️ Engines son módulos independientes, no managers. OK. |
| 28-39 | Variables de estado (`readyState`, `initialBootstrapDone`) | ⚠️ Estado local aceptable |
| 41-49 | `ready` promises (orion, tomador) | ✅ OK |
| 166-172 | Kelly engine ready | ✅ OK |
| 175-202 | Web Worker setup | ✅ OK |
| 204-260 | DOM element references | ✅ OK |
| 1431-1444 | Tomador initialization | ✅ OK |

### B) UI / Render (debe permanecer en main.js)

| Líneas | Contenido | Estado |
|--------|-----------|--------|
| 246-260 | Accordion toggle | ✅ OK |
| 328-364 | Tab activation + nav buttons | ✅ OK |
| 375-412 | CHI window, series chart, DA window buttons | ✅ OK |
| 414-461 | Quick toggles UI (Ver Tablas, Ver Gráficos) | ✅ OK |
| 463-511 | Sliders setup (sesgo97, alert thresholds) | ✅ OK |
| 512-551 | Autocalibrate UI | ✅ OK |
| 1419-1429 | Wheel rotation slider | ✅ OK |
| 1473-1631 | **updateUI()** — renderiza TODOS los paneles | ⚠️ Mezcla llamadas a dominio y renders |
| 1635-1646 | `addSpin()` — wrapper UI | ✅ OK |
| 1648-1794 | `renderWheel()` — SVG wheel | ✅ OK |
| 1796-1826 | `renderProbabilities()` | ✅ OK |
| 1828-1841 | `renderAlerts()` | ✅ OK |
| 1843-1856 | `renderStrategy()` | ✅ OK |
| 1858-1918 | Monte Carlo UI + worker setup | ✅ OK |
| 1920-2020 | `renderHeatMap()` / `renderMCResult()` | ✅ OK |
| 2022-2032 | Window slider | ✅ OK |
| 2036-2109 | `renderRunsTest()` / `renderWindowStats()` | ✅ OK |
| 2111-2145 | `renderDistHist()` | ✅ OK |
| 2147-2226 | `renderConfidenceIntervals()` | ✅ OK |
| 2229-2349 | Kelly UI | ✅ OK |
| 2352 | `updateUI()` initial call | ✅ OK |
| 2354-2445 | Import UI (local + Sheets) | ✅ OK |
| 2447-2586 | `renderWinWinTab()` | ✅ OK |

### C) LÓGICA DE NEGOCIO — DEBE MIGRARSE

| Líneas | Contenido | Prioridad | Destino |
|--------|-----------|-----------|---------|
| **662-685** | Radiografía: `btnRealRadiography` construye hitMap iterando spins | 🔴 ALTA | `RouletteTracker.getHitMap()` |
| **708-846** | `renderSeries()` — toggle active, delete, edit series (modifica customSeries) | 🔴 ALTA | `RouletteTracker.addOrUpdateSeries()`, `.toggleSeries()`, `.deleteSeries()` |
| **848-1272** | **TESTER** — Simulación completa de estrategias (Fibonacci, win-win state machine, balance tracking, Chart.js) | 🔴 ALTA | Nuevo módulo `src/tracker/TesterSimulator.js` |
| **1284-1322** | `btnAddSeries` — CRUD de customSeries (colisión de nombres, merge) | 🔴 ALTA | `RouletteTracker.addOrUpdateSeries()` |
| **1446-1471** | `clearSessionAction` — construye sessionRecord manualmente | 🔴 ALTA | `RouletteTracker.recordAndClearSession()` |

### D) LÓGICA MIXTA — MAIN.JS USA Managers INDIRECTAMENTE

| Líneas | Contenido | Riesgo |
|--------|-----------|--------|
| 58-163 | `syncSettingsForm()` — lee settings y escribe DOM. Lee `domainTracker.getSettings()` y conoce TODAS las keys. | ⚠️ MEDIO |
| 553-620 | Settings form submit — conoce TODAS las keys de configuración | ⚠️ MEDIO |
| 622-660 | Ajustes_vito — guarda Muestra toggle, usa `domainTracker.updateSettings()` | ✅ Ya usa API pública |
| 687-706 | Rescan history — llama `winWinEngine.reprocess(...)` directamente | ⚠️ Bajo (es motor independiente) |

---

## Resumen de Migraciones

| # | Responsabilidad | Líneas en main.js | Método nuevo en dominio | Tipo |
|---|----------------|-------------------|------------------------|------|
| 1 | CRUD customSeries | 710-846, 1284-1322 | `RouletteTracker.addOrUpdateSeries()`, `.toggleSeries()`, `.deleteSeries()`, `.getSeries()` | Métodos |
| 2 | Session record + clear | 1446-1471 | `RouletteTracker.recordAndClearSession()` | Método |
| 3 | Radiografía (hitMap) | 662-685 | `RouletteTracker.getHitMap()` | Método |
| 4 | TESTER simulation | 848-1272 | `src/tracker/TesterSimulator.js` | Módulo nuevo |
