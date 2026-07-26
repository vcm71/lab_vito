# Fase 5.4 — Migración de Engines a Domain Tracker

**Fecha:** 2026-07-24
**Estado:** COMPLETADO ✓
**Build:** 78 módulos, 0 errores, 490ms

---

## Objetivo

Eliminar dependencias directas de los motores de análisis (Engines) hacia el Legacy Tracker (`rouletteTracker.js`), migrándolos al Domain Tracker (`src/tracker/RouletteTracker.js`).

## Inventario previo

| Engine | `getSpins()` | `.settings` | `.spins` (directo) | Estáticos Legacy |
|--------|:---:|:---:|:---:|:---:|
| WinWinEngine | ✓ | — | — | — |
| LogicEngine (Orion) | ✓ | ✓ | — | `constructor.getWheelDistance` |
| DAEngine | ✓ | ✓ | — | — |
| ChiAnalysisEngine | ✓ | ✓ | — | — |
| Sesgo97Logic | ✓ | ✓ | — | — |
| KellyManager | — | — | ✓ | usa `getStats`/`getAdvancedStats` |

## Cambios realizados

### 1. Domain RouletteTracker — 3 métodos públicos añadidos

**Archivo:** `src/tracker/RouletteTracker.js`

Se añadieron 3 métodos que exponen la misma API que los engines ya consumían del Legacy:

- **`getStats()`** — estadísticas básicas (colores, paridad, alto/bajo, docenas, columnas). Lee de `this.getHitMap()` + `NUM_META`.
- **`getAdvancedStats()`** — chi-cuadrado, hot zone, medias de atraso. Lee de `this.getSpins()` y `this.getHitMap()`.
- **`static getWheelDistance(num1, num2)`** — distancia mínima entre dos números en la rueda americana.

Se importó `AMERICAN_WHEEL_ORDER` del Legacy y se definió `NUM_META` como constante local.

### 2. Engine fixes — `.settings` → `.getSettings()`

| Archivo | Línea | Cambio |
|---------|:-----:|--------|
| `src/engines/DA/DAEngine.js` | 95 | `this.tracker.settings.customSeries` → `this.tracker.getSettings().customSeries` |
| `src/engines/Chi/ChiAnalysisEngine.js` | 70 | `this.tracker.settings.customSeries` → `this.tracker.getSettings().customSeries` |
| `src/engines/Orion/LogicEngine.js` | 144 | `this.tracker.settings?.customSeries` → `this.tracker.getSettings().customSeries` |
| `src/engines/Sesgo97/Sesgo97Logic.js` | 19 | `this.tracker.settings` → `this.tracker.getSettings()` |

### 3. Kelly — array directo a API pública

| Archivo | Línea | Cambio |
|---------|:-----:|--------|
| `src/engines/Kelly/KellyManager.js` | 199 | `tracker.spins.filter(...)` → `tracker.getSpins().filter(...)` |

### 4. Bootstrap — inyección de Domain Tracker

**Archivo:** `src/core/Bootstrap.js` (líneas 86-90)

Todos los constructores de engine ahora reciben `domainTracker` en lugar de `tracker` (Legacy).

### 5. main.js — Kelly analyze usa Domain Tracker

| Línea | Cambio |
|:-----:|--------|
| 1556 | `kelly.analyze(tracker, orionSignals)` → `kelly.analyze(domainTracker, orionSignals)` |
| 1559 | `kelly.analyze(tracker, [])` → `kelly.analyze(domainTracker, [])` |
| 2226 | `kelly.analyze(tracker, signals)` → `kelly.analyze(domainTracker, signals)` |

### 6. LogicEngine — constructor.getWheelDistance

Línea 119: `this.tracker.constructor.getWheelDistance(...)` se mantiene igual. Ahora `this.tracker` es una instancia de Domain `RouletteTracker`, que expone `static getWheelDistance`.

## Pendiente para etapa posterior

### MonteCarloValidator (`monteCarloValidator.js`)

Crea su propio Legacy Tracker internamente (línea 115) y lo usa para validación batch con `clearSession()` y alimentación directa de spins. Es una herramienta de simulación aislada del flujo principal. Requiere:

1. Reemplazar `new RouletteTracker()` (Legacy) por instancia Domain
2. Migrar `_getEdgeScoreFast()` para inyectar spins via Domain API
3. No tiene dependencias cruzadas con Bootstrap/main.js

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/tracker/RouletteTracker.js` | +3 métodos, +1 import, +const NUM_META |
| `src/engines/DA/DAEngine.js` | 1 línea |
| `src/engines/Chi/ChiAnalysisEngine.js` | 1 línea |
| `src/engines/Orion/LogicEngine.js` | 1 línea |
| `src/engines/Sesgo97/Sesgo97Logic.js` | 1 línea |
| `src/engines/Kelly/KellyManager.js` | 1 línea |
| `src/core/Bootstrap.js` | 5 líneas |
| `main.js` | 3 líneas |

## Verificación

```
npm run build → 78 modules, 0 errors, 490ms ✓
```
