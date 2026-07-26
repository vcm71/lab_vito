# FASE 5.3 — ELIMINACIÓN DE externalSpins + MIGRACIÓN TESTER / SIMULATION

**Fecha:** 2026-07-24
**Proyecto:** Roulette Tracker (Orion)
**Fase:** 5.3 (ETAPA 2)

---

## 1. Resumen Ejecutivo

Se eliminó el parámetro `externalSpins` de 3 métodos del dominio (`RouletteTracker.js`) y se migró el **Tester** para consumir exclusivamente el Domain Tracker. La **Simulación Monte Carlo** quedó documentada como dependencia conocida que no pudo ser migrada en esta fase debido a la restricción de no migrar engines principales.

### Resultado
- **externalSpins**: ✅ Eliminado — 3 parámetros removidos, 0 call sites restantes
- **Tester**: ✅ Migrado — ahora lee `domainTracker.getSpins()`
- **Simulación**: △ Documentada — usa Legacy Tracker interno (aislado, no afecta producción)
- **Build**: ✅ 78 módulos, 0 errores

---

## 2. Auditoría externalSpins

### Métodos afectados en `src/tracker/RouletteTracker.js`

| Método | Línea | Parámetro | Impacto | Decisión |
|---|---|---|---|---|
| `recordAndClearSession(externalSpins)` | 472 | `Array` opcional | Ninguno — llamado sin argumentos desde TrackerSyncAdapter | ✅ Eliminado |
| `getHitMap(externalSpins)` | 500 | `Array` opcional | Bajo — 1 call site en main.js que pasaba `tracker.getSpins()` (ya sincronizados) | ✅ Eliminado |
| `getHitRanking(externalSpins)` | 515 | `Array` opcional | Ninguno — sin llamantes externos, solo delegaba a `getHitMap()` | ✅ Eliminado |

### Veredicto

Los 3 parámetros estaban **funcionalmente muertos** desde Fase5.2 (cuando el Domain asumió ownership de spins). El único call site activo (`main.js:681` → `domainTracker.getHitMap(spins)`) pasaba spins idénticos a `this.getSpins()` interno, por lo que el cambio es seguro.

---

## 3. Dependencias encontradas

### 3.1 — `tracker.getSpins()` (Legacy) en consumidores

| Archivo | Línea | Consumidor | Decisión |
|---|---|---|---|
| `main.js` | 675, 681 | Radiografía (btnRealRadiography) | ✅ Migrado a `domainTracker.getHitMap()` |
| `main.js` | 905 | Tester (renderTesterTable) | ✅ Migrado a `domainTracker.getSpins()` |
| `main.js` | 693, 717, 1443, 1575, 1619, 1998, 2416 | Engines y renderers | ❌ No tocar (restricción Fase5.3) |
| `orionRenderer.js` | 20, 127, 311 | Orion Renderer | ❌ No tocar |
| `tomadorRenderer.js` | 218, 1485, 1533, 1705, 1994 | Tomador Renderer | ❌ No tocar |
| `ataqueRenderer.js` | 450 | Ataque Renderer | ❌ No tocar |
| `atrasosRenderer.js` | 715 | Atrasos Renderer | ❌ No tocar |
| `labEngine.js` | 77 | Lab Engine | ❌ No tocar |
| `MotorEstadistica_daEngine.js` | 52 | DA Engine (legacy) | ❌ No tocar |
| `src/engines/DA/DAEngine.js` | 55 | DA Engine | ❌ No tocar |
| `src/engines/Sesgo97/Sesgo97Logic.js` | 26 | Sesgo97 Engine | ❌ No tocar |
| `src/engines/WinWin/WinWinEngine.js` | 479 | WinWin Engine | ❌ No tocar |
| `src/engines/Chi/ChiAnalysisEngine.js` | 58, 119 | Chi Engine | ❌ No tocar |
| `src/engines/Orion/LogicEngine.js` | 86, 136, 224, 254, 321 | Orion Logic Engine | ❌ No tocar |

### 3.2 — Monte Carlo Validator

| Archivo | Consumidor | Dependencia | Decisión |
|---|---|---|---|
| `monteCarloValidator.js` | MonteCarloValidator | Crea su propio `new RouletteTracker()` (Legacy) + engines legacy | △ Documentado |

**Nota:** El MonteCarloValidator es **totalmente autocontenido**. No usa externalSpins, ni el tracker global de la app, ni el Domain Tracker. Crea una instancia Legacy aislada para pasar a los engines (LogicEngine, WinWinEngine) que necesita. Migrarlo requeriría cambiar engines que están fuera del alcance de Fase5.3.

---

## 4. Migraciones realizadas

### 4.1 — `src/tracker/RouletteTracker.js` — 3 métodos

```diff
- async recordAndClearSession(externalSpins) {
-   const spins = externalSpins || this.getSpins();
+ async recordAndClearSession() {
+   const spins = this.getSpins();

- getHitMap(externalSpins) {
-   const spins = externalSpins || this.getSpins();
+ getHitMap() {
+   const spins = this.getSpins();

- getHitRanking(externalSpins) {
-   const hitMap = this.getHitMap(externalSpins);
+ getHitRanking() {
+   const hitMap = this.getHitMap();
```

Ninguna lógica interna cambió — solo se eliminó el parámetro opcional y el fallback.

### 4.2 — `main.js` — Radiografía (línea 681)

```diff
- const hitMap = domainTracker.getHitMap(spins);
+ const hitMap = domainTracker.getHitMap();
```

Ahora usa `this.getSpins()` interno del Domain sin necesidad de pasarle el array por fuera.

### 4.3 — `main.js` — Tester (línea 905)

```diff
- let spins = tracker.getSpins();
+ let spins = domainTracker.getSpins();
```

El Tester ahora consume spins directamente del Domain Tracker. Funcionalmente idéntico porque ambos trackers están sincronizados.

---

## 5. Tester migrado

### Estado anterior
El Tester (`renderTesterTable` en `main.js`) leía spins del **Legacy Tracker** (`tracker.getSpins()`).

### Después
Lee spins del **Domain Tracker** (`domainTracker.getSpins()`).

### Verificación
- La lógica de iteración, configuración, charting y balance es idéntica.
- `currentDAWindow` filtering aplica igual sobre ambos arrays.
- **Comportamiento observable: sin cambios.**

---

## 6. Simulation migrada

### MonteCarloValidator — Estado actual

El MonteCarloValidator en `monteCarloValidator.js` es un sistema de simulación aislado que:

1. Genera sus propios spins sintéticos (uniforme, sesgado, drift)
2. Crea su propia instancia Legacy `RouletteTracker` (línea 115) para los engines
3. Usa `_getEdgeScoreFast()` que computa estadísticas directamente desde el array de spins
4. **No depende de externalSpins**
5. **No depende del Domain Tracker de producción**
6. **No afecta el estado de la aplicación**

### Decisión

△ **No migrado** en esta fase. Razones:
- El MonteCarloValidator usa engines legacy (LogicEngine, WinWinEngine) que la restricción Fase5.3 prohíbe migrar.
- Es autocontenido: su tracker Legacy no se comunica con el resto de la app.
- Migrarlo al Domain requeriría instanciar todos los managers (SpinManager, SessionManager, etc.) o cambiar los engines.
- No hay externalSpins involucrado.

**Se aplaza a Fase5.4** (Migración completa de Engines) cuando los engines del dominio estén disponibles para la simulación.

---

## 7. Código eliminado

| Archivo | Líneas | Código |
|---|---|---|
| `src/tracker/RouletteTracker.js` | 467-469 | JSDoc y parámetro `externalSpins` en `recordAndClearSession` |
| `src/tracker/RouletteTracker.js` | 496-497 | JSDoc y parámetro `externalSpins` en `getHitMap` |
| `src/tracker/RouletteTracker.js` | 509 | JSDoc y parámetro `externalSpins` en `getHitRanking` |
| `main.js` | 681 | Argumento `spins` en llamada a `domainTracker.getHitMap()` |

Total: **~8 líneas** de código/fuente eliminadas (más 8 líneas de JSDoc limpiadas).

---

## 8. Compatibilidad

| Componente | Antes | Después | Estado |
|---|---|---|---|
| UI | OK | OK | ✅ Sin cambios |
| Renderers (orion, tomador, ataque, atrasos) | OK | OK | ✅ Sin cambios |
| Engines (WinWin, Orion, DA, Chi, Sesgo97) | OK | OK | ✅ Sin cambios |
| History | OK | OK | ✅ Sin cambios |
| HitMap | OK | OK | ✅ Sin cambios (getHitMap sin args) |
| Ranking | OK | OK | ✅ Sin cambios (getHitRanking sin args) |
| Tester | OK | OK | ✅ Migrado a domainTracker.getSpins() |
| Monte Carlo | OK | OK | △ Sin cambios (autocontenido) |
| TrackerSyncAdapter | OK | OK | ✅ Sin cambios (llama recordAndClearSession() sin args) |
| Legacy Tracker | OK | OK | ✅ No modificado |

---

## 9. Riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R01 | Algún consumidor no identificado pase externalSpins a getHitMap | Muy baja | Bajo | Búsqueda exhaustiva en todo el código base |
| R02 | Tester rompa al cambiar de tracker | Baja | Bajo | Ambos trackers sincronizados vía _syncAllSpins |
| R03 | MonteCarloValidator rompa al tener dependencia Legacy | Baja | Ninguno | Es autocontenido, usa su propio tracker |

---

## 10. Resultado del Build

```
npm run build
✓ 78 modules transformed.
✓ built in 502ms
✓ 0 errors
```

Advertencia de chunk size > 500 kB: **preexistente** (no relacionada con Fase5.3).

---

## 11. Estado final de externalSpins

```
ANTES:
Spins
 ├── RouletteTracker (Domain)
 ├── externalSpins (parámetros muertos)
 └── Legacy Tracker (compatibilidad)

DESPUÉS:
Spins
 └── RouletteTracker (Domain)
        └── Legacy Tracker (compatibilidad)
```

**`externalSpins` ha sido eliminado del código base.** Ya no existe como parámetro, variable ni concepto en ningún archivo del proyecto.

---

## Checklist de Verificación

| Criterio | Estado |
|---|---|
| ✓ No existen consumidores activos de externalSpins | ✅ — 0 ocurrencias en código |
| ✓ Tester funciona con RouletteTracker | ✅ — `domainTracker.getSpins()` |
| ✓ Simulation funciona con RouletteTracker | △ — MonteCarloValidator autocontenido (dependencia conocida) |
| ✓ No existen estados duplicados | ✅ — Domain es única fuente de verdad |
| ✓ Legacy sigue funcionando como compatibilidad | ✅ — Sin modificar |
| ✓ TrackerSyncAdapter sigue operativo | ✅ — Sin modificar |
| ✓ History intacto | ✅ — Sin cambios |
| ✓ HitMap intacto | ✅ — `getHitMap()` sin parámetros |
| ✓ Build limpio | ✅ — 0 errores |

---

## Próxima Fase

**Fase 5.4 — Migración completa de Engines**
Eliminar dependencias restantes del Legacy en WinWin, Orion, DA, Kelly y demás motores.
