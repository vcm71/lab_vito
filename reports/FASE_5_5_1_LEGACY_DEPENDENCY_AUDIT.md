# Fase 5.5.1 — Auditoría Final de Dependencias Legacy

**Fecha:** 2026-07-24
**Build:** OK — 78 módulos, 0 errores, 497ms
**Propósito:** Mapear, clasificar y documentar TODAS las dependencias activas del archivo legacy `rouletteTracker.js` para planificar su eliminación total.

---

## Clasificación

| Categoría | Significado |
|-----------|-------------|
| 🔴 ACTIVA | Dependencia de instancia Legacy (constructor, métodos). NO se puede eliminar sin refactor. |
| 🟡 COMPATIBILIDAD | Importa constantes (RED_NUMBERS, AMERICAN_WHEEL_ORDER, ROULETTE_NUMBERS) o JSDoc type. Migrable a constantes propias del dominio. |
| 🟢 MUERTA | Importada pero NO usada. Se puede eliminar ahora mismo. |
| ⏳ PENDIENTE DE MIGRACIÓN | Requiere migración específica antes de eliminar. |

---

## 1. Instancias Activas de `new RouletteTracker()` 🔴

### 1.1 `src/core/Bootstrap.js:43`
```js
const tracker = new RouletteTracker();
```
**Rol:** Crea la instancia Legacy que se inyecta en todo el sistema (main.js, engines, renderers).
**Dependencias aguas abajo:**
- `main.js` recibe `tracker` y lo usa en `updateUI()` para ~30+ llamadas a métodos de instancia Legacy.
- Renderers reciben `tracker` como parámetro (ver §4).
- Engines reciben `tracker` en su constructor (ver §3).

### 1.2 `monteCarloValidator.js:115`
```js
const tracker = new RouletteTracker();
```
**Rol:** MonteCarloValidator crea su propia instancia Legacy internamente y la pasa a `WinWinEngine` y `LogicEngine`.
**Nota:** Marcado como pendiente desde Fase5.4. Su refactorización requiere que los engines acepten Domain en lugar de Legacy.

### 1.3 `stress_test_orion.js:33`
```js
const tracker = new RouletteTracker();
```
**Rol:** Script auxiliar de simulación independiente. NO es parte del bundle de producción.

---

## 2. Importaciones de `RouletteTracker` (clase) 🔴/⏳

| Archivo | Símbolo | Uso | Clasificación |
|---------|---------|-----|---------------|
| `main.js:6` | `RouletteTracker, AMERICAN_WHEEL_ORDER` | Solo como referencia de tipo (`window.rt = tracker`) | 🔴 ACTIVA |
| `tomadorRenderer.js:6` | `RED_NUMBERS, AMERICAN_WHEEL_ORDER, ROULETTE_NUMBERS, RouletteTracker` | Usa métodos **estáticos**: `RouletteTracker.getColor()`, `getParity()`, `getWheelDistance()`, etc. | ⏳ PENDIENTE |
| `src/engines/WinWin/WinWinEngine.js:7` | `RouletteTracker, RED_NUMBERS` | `RouletteTracker` **no se usa**; solo `RED_NUMBERS` se usa. | 🟢 MUERTA |
| `src/core/OrionKernel.js:31` | JSDoc `@param {import(...)}` | Solo anotación de tipo | 🟡 COMPATIBILIDAD |
| `src/sync/TrackerSyncAdapter.js:18,22` | JSDoc `@param {import(...)}` | Solo anotaciones de tipo | 🟡 COMPATIBILIDAD |

### 2.1 Dead import — `WinWinEngine.js`
La línea `import { RouletteTracker, RED_NUMBERS } from '../../../rouletteTracker.js'` importa `RouletteTracker` que **nunca se referencia** en el cuerpo del archivo. Solo `RED_NUMBERS` se usa en `analyzeCHI()` (línea 215). La importación de `RouletteTracker` puede eliminarse inmediatamente.

### 2.2 Static methods — `tomadorRenderer.js`
Requiere migración porque el Domain `RouletteTracker` **no tiene** métodos estáticos equivalentes (`getColor`, `getParity`, `getHighLow`, `getDozen`, `getColumn`, `getWheelDistance`). Ver §6.

---

## 3. Constantes desde Legacy 🟡

| Constante | Importada por | Clasificación |
|-----------|---------------|---------------|
| `AMERICAN_WHEEL_ORDER` | `main.js`, `ChiAnalysisEngine.js`, `Sesgo97Logic.js`, `LogicEngine.js`, `orionRenderer.js`, `tomadorRenderer.js`, `src/tracker/RouletteTracker.js` (Domain) | 🟡 COMPATIBILIDAD |
| `RED_NUMBERS` | `WinWinEngine.js`, `orionRenderer.js`, `sesgo97Renderer.js`, `tomadorRenderer.js` | 🟡 COMPATIBILIDAD |
| `ROULETTE_NUMBERS` | `tomadorRenderer.js`, `SpinManager.js` (Domain) | 🟡 COMPATIBILIDAD |
| `BLACK_NUMBERS` | *(no se importa externamente)* | — |

Todas estas constantes son datos puros — deben duplicarse como constantes propias del dominio o del módulo que las necesita para eliminar la dependencia del Legacy.

---

## 4. Renderers que reciben `tracker` (Legacy) 🔴

| Renderer | Firma | Métodos Legacy que usa |
|----------|-------|----------------------|
| `orionRenderer.js` | `renderOrionTab(tracker, orionEngine)` | `tracker.getSpins()`, `tracker.getStats()` |
| `atrasosRenderer.js` | `renderAtrasosTab(tracker)` | `tracker.getSpins()` |
| `ataqueRenderer.js` | `renderAtaqueTab(tracker)` | `tracker.getSpins()`, `tracker.winWinEngine?.historicalMaxes` |
| `tomadorRenderer.js` | *(creación propia)* | `RouletteTracker.getColor()` etc. (estáticos) |
| `sesgo97Renderer.js` | `renderSesgo97Tab(logicResult)` | No recibe tracker directamente |
| `chiRenderer.js` | `renderChiTab(data)` | No recibe tracker directamente |

**Observación:** Los renderers reciben el Legacy tracker y lo usan para leer `getSpins()`. Si el Domain expone `getSpins()` con el mismo contrato, el cambio es trivial. El Domain **ya tiene** `getSpins()` con idéntica interfaz.

---

## 5. Monkey Patches (main.js:24-27) 🟡

```js
tracker.addSpin     = (n) => syncAdapter.addSpin(n);
tracker.deleteSpin  = (id) => syncAdapter.deleteSpin(id);
tracker.updateSpin  = (id, n) => syncAdapter.updateSpin(id, n);
tracker.clearSession = () => syncAdapter.clearSession();
```

**Rol:** Puente CRUD del Legacy Tracker → Domain Tracker (a través de TrackerSyncAdapter).
**Dependencia:** Requiere que `syncAdapter` exista. Si main.js empezara a usar `domainTracker.addSpin()` directamente, estos parches serían innecesarios.

---

## 6. Métodos Estáticos Legacy sin Equivalente en Domain ⏳

El `RouletteTracker` Legacy expone estos estáticos que el Domain **no tiene**:

| Método Estático | Usado por | Propuesta |
|----------------|-----------|-----------|
| `RouletteTracker.getColor(n)` | tomadorRenderer.js | Mover a módulo utilidad numérica |
| `RouletteTracker.getParity(n)` | tomadorRenderer.js | Mover a módulo utilidad numérica |
| `RouletteTracker.getHighLow(n)` | tomadorRenderer.js | Mover a módulo utilidad numérica |
| `RouletteTracker.getDozen(n)` | tomadorRenderer.js | Mover a módulo utilidad numérica |
| `RouletteTracker.getColumn(n)` | tomadorRenderer.js | Mover a módulo utilidad numérica |
| `RouletteTracker.getWheelDistance(n1,n2)` | tomadorRenderer.js, Domain usa `AMERICAN_WHEEL_ORDER` | Mover a módulo utilidad numérica (Fase5.4 ya tiene `static getWheelDistance` en Domain) |
| `RouletteTracker.getHalf(n)` | *(no se usa externamente)* | Ignorar |

**Nota:** La Fase5.4 añadió `static getWheelDistance()` al Domain `RouletteTracker`, pero el resto de estáticos no se migraron.

---

## 7. TrackerSyncAdapter 🟡

| Archivo | Rol |
|---------|-----|
| `src/sync/TrackerSyncAdapter.js` | Puente bidireccional: Domain (fuente de verdad) → Legacy (reflejo) |
| `main.js:21` | Instancia: `syncAdapter = new TrackerSyncAdapter(tracker, domainTracker)` |

**Propósito:** Hasta que main.js use `domainTracker` directamente, el SyncAdapter mantiene consistencia entre ambas fuentes.

---

## 8. Resumen Ejecutivo

| Tipo | Cantidad | Archivos Afectados |
|------|----------|-------------------|
| 🔴 ACTIVA (instancia Legacy) | 3 | `Bootstrap.js`, `main.js` (indirecto), `monteCarloValidator.js` |
| 🔴 ACTIVA (métodos instancia) | ~30+ llamadas | `updateUI()` en `main.js` + 4 renderers |
| ⏳ PENDIENTE DE MIGRACIÓN | 2 | `monteCarloValidator.js`, `tomadorRenderer.js` |
| 🟡 COMPATIBILIDAD (constantes) | 7 archivos | Ver §3 |
| 🟡 COMPATIBILIDAD (JSDoc type) | 2 | `OrionKernel.js`, `TrackerSyncAdapter.js` |
| 🟢 MUERTA (eliminable ahora) | 1 | `WinWinEngine.js` (solo la importación de `RouletteTracker`) |
| 🟡 COMPATIBILIDAD (monkey patches) | 4 parches | `main.js:24-27` |

---

## 9. Roadmap de Eliminación

### ✅ Ya se puede eliminar (sin cambios adicionales)
1. `WinWinEngine.js:7` — eliminar `RouletteTracker` del import (dejar solo `RED_NUMBERS`)

### 🟡 Prioridad alta (constantes → módulo propio)
1. Mover `AMERICAN_WHEEL_ORDER`, `RED_NUMBERS`, `ROULETTE_NUMBERS`, `BLACK_NUMBERS` del Legacy a un módulo de constantes del dominio (ej. `src/tracker/rouletteConstants.js`)
2. Actualizar todos los imports en Domain, engines, y renderers para apuntar al nuevo módulo
3. Eliminar exportaciones de constantes del Legacy

### ⏳ Prioridad media (métodos estáticos → utilidad numérica)
1. Mover `getColor()`, `getParity()`, `getHighLow()`, `getDozen()`, `getColumn()` a un módulo de utilidad (`src/utils/numberMeta.js`)
2. Actualizar `tomadorRenderer.js` para importar desde la utilidad

### 🔴 Prioridad baja (instancia Legacy completa)
1. Migrar `main.js:updateUI()` para usar `domainTracker` en lugar de `tracker`
2. Migrar renderers para recibir `domainTracker` en lugar de Legacy
3. Eliminar `Bootstrap.js:43` (creación de Legacy tracker)
4. Refactorizar `monteCarloValidator.js` para no crear su propio Legacy

---

## 10. Verificación de Build

```
> vite build
✓ 78 modules transformed.
✓ built in 497ms
```

**Estado:** BUILD OK. Sin errores. Sin warnings (excepto chunk >500KB, pre-existente).

---

*Fin del reporte Fase 5.5.1 — Legacy Dependency Audit*
