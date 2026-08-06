# TrackerCompat Audit

**Versión:** 1.0 (Fase 3.3 — TrackerCompat Audit)
**Fecha:** 2026-07-24
**Estado:** Auditoría completa. Plan de retirada documentado.

---

## 1. Inventario Completo de Métodos

TrackerCompat (272 líneas, `src/tracker/TrackerCompat.js`) tiene **28 métodos públicos + 1 propiedad estática + 3 propiedades públicas de referencia**.

### 1.1 CRUD — Delegación Directa a RouletteTracker

| Método | Propósito | Origen | Líneas |
|--------|-----------|--------|--------|
| `getSpins()` | Obtener array de giros | Legacy | 54-56 |
| `addSpin(number)` | Añadir giro | Legacy | 58-60 |
| `deleteSpin(spinId)` | Eliminar giro | Legacy | 62-64 |
| `updateSpin(spinId, newNumber)` | Actualizar número | Legacy | 66-68 |
| `clearSpins()` | Limpiar todo + reset + save | Legacy | 70-75 |
| `clearSession()` | Limpiar sin historial | Legacy | 81-86 |
| `getHitMap()` | Mapa de aciertos | Domain | 137-139 |
| `getHitRanking()` | Ranking de aciertos | Domain | 141-143 |
| `updateSettings(partial)` | Actualizar config | Legacy | 88-91 |

**Clasificación:** Adaptador temporal (excepto `getHitMap`, `getHitRanking` que son contrato válido).

### 1.2 Análisis — Delegación Directa a RouletteAnalytics

| Método | Propósito | Origen | Consumidores |
|--------|-----------|--------|--------------|
| `getStats()` | Estadísticas básicas | Legacy | main.js:1440 |
| `getAdvancedStats()` | Estadísticas avanzadas | Legacy | main.js (implícito) |
| `getProbabilities()` | Probabilidades | Legacy | main.js:1470 |
| `getConfidenceIntervals()` | Intervalos de confianza | Legacy | main.js:1471 |
| `getAlerts()` | Alertas | Legacy | main.js:1472 |
| `getStrategy()` | Estrategia | Legacy | main.js:1474 |
| `getDistanceHistogram()` | Histograma distancias | Legacy | main.js:1490, main.js:202 |
| `getWindowStats(windowSize)` | Estadísticas ventana | Legacy | main.js:201 |
| `runsTest(type)` | Test de rachas | Legacy | main.js:196-198 |
| `getSeriesTrendData(...)` | Tendencia de series | Legacy | Ninguno (no referenciado) |

**Clasificación:** Adaptador temporal (excepto `getSeriesTrendData` que es **candidato a eliminación** por no tener consumidores).

### 1.3 Cómputo de Atrasos (Propio — Cache Dirty)

| Método | Propósito | Consumidores |
|--------|-----------|--------------|
| `getDozenDelay(dozen)` | Atraso de docena | tomadorRenderer:859,897,907,946 |
| `getDozenMaxDelay(dozen)` | Máximo atraso de docena | tomadorRenderer:908 |
| `getColumnDelay(column)` | Atraso de columna | tomadorRenderer:860,871-873,879,945 |
| `getColumnMaxDelay(column)` | Máximo atraso de columna | tomadorRenderer:880 |
| `getNumberDelay(numStr)` | Atraso de número | tomadorRenderer:935 |
| `getNumberMaxDelay(numStr)` | Máximo atraso de número | tomadorRenderer:936 |
| `_recomputeDelays()` | Recálculo completo O(N × 44) | Interno (lazy) |
| `_invalidateDelays()` | Marcar cache sucio | Interno |

**Clasificación:** Contrato válido (la lógica de atrasos es correcta, pero debería migrarse a un `DelayManager` en el dominio).

### 1.4 Propiedades Públicas

| Propiedad | Propósito | Consumidores |
|-----------|-----------|--------------|
| `settings` | Copia sincrónica de config | tomadorRenderer:218,541-543,559-561,835,1540,1557,1574,1648-1686,1996 |
| `_freq` (getter) | Frecuencia O(38) computada | orionRenderer:128,260 |
| `winWinEngine` | Referencia al motor WinWin | ataqueRenderer:451 |
| `ready` | Promesa de disponibilidad | main.js (no referenciado directamente desde que se eliminó readyState) |

**Clasificación:**
- `settings`: **Adaptador temporal** — debe accederse via `getSettings()`
- `_freq`: **Contrato válido** pero ubicación incorrecta — debería estar en el dominio
- `winWinEngine`: **No pertenece al dominio** — referencia externa mal ubicada
- `ready`: **Código muerto** — main.js crea TrackerCompat ya inicializado

### 1.5 Estáticos / Utilidad

| Método | Propósito | Consumidores |
|--------|-----------|--------------|
| `static getColor(num)` | Color del número | No referenciado en el código auditado |

**Clasificación:** Contrato válido (puede permanecer o migrar a utils).

---

## 2. Mapa de Consumidores

```
TrackerCompat
├── main.js
│   ├── getStats()            → renderStats (línea 1440)
│   ├── getProbabilities()    → renderProbabilities (1470)
│   ├── getConfidenceIntervals() → renderConfidenceIntervals (1471)
│   ├── getAlerts()           → renderAlerts (1472)
│   ├── getStrategy()         → renderStrategy (1474)
│   ├── getDistanceHistogram() → renderDistHist (1490, 202)
│   ├── getWindowStats()      → renderWindowStats (201)
│   ├── runsTest()            → renderRunsTest (196-198)
│   ├── getSpins()            → varios (indirecto)
│   └── winWinEngine          → renderWinWinTab, renderAtaqueTab
│
├── tomadorRenderer.js
│   ├── settings.*            → acceso directo a propiedades (20+ usos)
│   ├── getSpins()            → construcción de UI (líneas 219, 1486, 1534, 1706, 1995)
│   ├── getDozenDelay()       → tabla de atrasos (859, 897, 907, 946)
│   ├── getDozenMaxDelay()    → tabla de atrasos (908)
│   ├── getColumnDelay()      → tabla de atrasos (860, 871-873, 879, 945)
│   ├── getColumnMaxDelay()   → tabla de atrasos (880)
│   ├── getNumberDelay()      → tabla de atrasos (935)
│   ├── getNumberMaxDelay()   → tabla de atrasos (936)
│   ├── deleteSpin()          → edición de giros (1447)
│   ├── updateSpin()          → edición de giros (1456)
│   └── updateSettings()      → cambio de sesión (565)
│
├── orionRenderer.js
│   ├── getSpins()            → renderWheel (127), renderSector (indirecto)
│   ├── _freq                 → renderWheel (128), renderSector (260)
│   └── clearSession()        → debug/sesgo sintético (549)
│
├── ataqueRenderer.js
│   ├── getSpins()            → renderAtaqueTab (450)
│   └── winWinEngine          → historicalMaxes (451)
│
├── labengine.js  (lowercase — DEAD, solo en integrate_lab.js)
│   ├── getStatsForSet()      → guard call, siempre null (43)
│   └── delays/maxDelays     → fallback, no existen (47-48)
│
└── motor_matematico_de_conjuntos.js (DEAD, solo en integrate_lab.js)
    ├── getStatsForSet()      → guard call, siempre null (43)
    └── delays/maxDelays     → fallback, no existen (45-46)
```

**Routing analysis:**

- **main.js** recibe `tracker` = TrackerCompat, `domainTracker` = RouletteTracker (línea 20-23)
- **tomadorRenderer** recibe `tracker` en constructor: `new TomadorRenderer(tracker, ...)` (main.js:1408)
- **orionRenderer** recibe `tracker` en cada llamada: `renderOrionTab(tracker)`, `renderOrionWheel(tracker)` (main.js:1477)
- **ataqueRenderer** recibe `tracker`: `renderAtaqueTab(tracker)` (main.js:1476)
- **Todos los motores** (DAEngine, WinWinEngine, etc.) reciben `domainTracker` = RouletteTracker (Bootstrap.js:85-90)
- **labengine.js/motor_matematico** — solo en `integrate_lab.js` (script Node.js, no app), **muertos**

**Conclusión:** Hay una separación clara: los motores (lógica de negocio) usan RouletteTracker directo; los renderers (capa de presentación) usan TrackerCompat. Esta separación se creó intencionalmente durante Fase5.5.x para permitir la migración gradual.

---

## 3. Bug Crítico: `getStatsForSet()`

### 3.1 Investigación Completa

| Dimensión | Respuesta |
|-----------|-----------|
| **¿Quién realiza la llamada?** | `labengine.js:43-44` y `motor_matematico_de_conjuntos.js:43` |
| **¿Desde cuándo existe?** | Desde que se crearon estos archivos (probablemente durante migración Legacy→Domain) |
| **¿Proviene del Legacy?** | Sí, el Legacy (`rouletteTracker.js`) tenía un método `getStatsForSet(setName)` que devolvía `{ actualDelay, maxDelay }` para un conjunto arbitrario |
| **¿Qué comportamiento esperaba?** | Obtener el atraso actual y máximo de un conjunto (e.g., "Rojo", "1a Docena") para calcular el peso de estrés estocástico |
| **¿Por qué nunca falló explícitamente?** | Porque usa **guard call** — `typeof fn === 'function'` evalúa `false`, y el código cae al fallback `this.tracker.delays?.[setName] || 0`, que también es `null` (propiedad inexistente), silenciando el error |
| **¿Por qué produce peso 0?** | `actual = 0`, `max = 1` → `ratio_limite = 0/1 = 0` → peso = 0 × (1 - prob) = 0 |

### 3.2 Impacto Real

**CERO.** Los archivos que contienen el bug (`labengine.js` lowercase y `motor_matematico_de_conjuntos.js`) solo son importados por `integrate_lab.js` — un script Node.js de automatización que parcha `index.html` y `main.js`. No forman parte del árbol de módulos de la SPA.

El **código activo** (`labEngine.js` con 'E' mayúscula, 214 líneas, en `controlador_de_la_vista_lab.js`) implementa `_getSetStats(setName)` que calcula correctamente los atrasos locales sin depender de `getStatsForSet()` ni de propiedades `delays`/`maxDelays`.

### 3.3 Causa Raíz

Durante la migración Legacy→Domain (Fase5.5.x), se eliminó el archivo `rouletteTracker.js` que contenía `getStatsForSet()`. Se creó la alternativa correcta `labEngine.js` (con `_getSetStats`) para la app real, pero los archivos duplicados `labengine.js` y `motor_matematico_de_conjuntos.js` quedaron como residuos no eliminados.

### 3.4 Estrategia de Corrección Recomendada

1. **Eliminar** `labengine.js` (lowercase) — es un duplicado muerto de `labEngine.js`
2. **Eliminar** `motor_matematico_de_conjuntos.js` — solo referenciado por `integrate_lab.js`
3. **Evaluar eliminación de `integrate_lab.js`** — script de despliegue antiguo; la integración del Lab ya está en `Bootstrap.js`
4. **NO necesita parche en el dominio** — la funcionalidad ya existe correctamente en `labEngine.js`

---

## 4. Auditoría de Delays

### 4.1 ¿Dónde se calculan?

Existen **tres sistemas independientes** de cálculo de atrasos:

| Sistema | Archivo | Algoritmo | Cobertura |
|---------|---------|-----------|-----------|
| **TrackerCompat** | `src/tracker/TrackerCompat.js:147-257` | Cache dirty, O(N × 44) | Números, docenas, columnas |
| **labEngine.js** (activo) | `labEngine.js:73-109` | O(windowSize) por conjunto | Conjuntos arbitrarios (rojo, negro, series, etc.) |
| **labengine.js** (muerto) | `labengine.js:42-57` | Bug: siempre 0 | Ninguna (dead code) |

### 4.2 Ownership

| Sistema | Owner | Estado |
|---------|-------|--------|
| TrackerCompat | **IMPLÍCITO** — Sin manager en el dominio | Provisional — debe migrarse |
| labEngine.js | labEngine (clase independiente) | Correcto |
| labengine.js | Ninguno (dead code) | Debe eliminarse |

### 4.3 Consumidores

| Consumidor | Sistema usado | Método |
|------------|---------------|--------|
| tomadorRenderer | TrackerCompat | `getDozenDelay`, `getColumnDelay`, `getNumberDelay` |
| labEngine (activo) | Propio (`_getSetStats`) | Interno |

### 4.4 Duplicidades

**NO hay duplicidad real.** TrackerCompat calcula atrasos por número/docena/columna (vista tabular en UI). labEngine.js calcula atrasos por conjunto arbitrario (lógica de estrés estocástico). Sirven propósitos distintos.

**Problema de diseño:** TrackerCompat no debería ser el owner de los delays. Debería existir un `DelayManager` en el dominio que exponga ambos tipos de consulta.

---

## 5. Flujo de Estadísticas

```
TrackerCompat.getStats()
    └→ RouletteAnalytics.getStats()
         ├→ spins de RouletteTracker.getSpins() (referencia)
         └→ cálculos propios: frecuencias, colores, paridades, docenas, columnas

TrackerCompat.getAdvancedStats()
    └→ RouletteAnalytics.getAdvancedStats()
         └→ cálculos propios sobre spins[]
```

**Divergencia documentada:** RouletteTracker.getStats() devuelve porcentajes como strings (`.toFixed(0)` + template literal). RouletteAnalytics.getStats() devuelve porcentajes como números (`.toFixed(1)` convertido con unario `+`). Esta divergencia se documentó en `domain_internal_contract.md` (Fase 3.2).

**Impacto sobre TrackerCompat:** Ninguno — TrackerCompat usa RouletteAnalytics, que es la fuente correcta. La versión de RouletteTracker.getStats() no se usa desde la UI (solo por legacy interno).

---

## 6. Plan de Retirada de TrackerCompat

### Clasificación de métodos

| Método | Clasificación | Acción |
|--------|---------------|--------|
| `getStats()` | Requiere migración | Redirigir consumidores a RouletteAnalytics |
| `getAdvancedStats()` | Requiere migración | Ídem |
| `getProbabilities()` | Requiere migración | Ídem |
| `getConfidenceIntervals()` | Requiere migración | Ídem |
| `getAlerts()` | Requiere migración | Ídem |
| `getStrategy()` | Requiere migración | Ídem |
| `getDistanceHistogram()` | Requiere migración | Ídem |
| `getWindowStats()` | Requiere migración | Ídem |
| `runsTest()` | Requiere migración | Ídem |
| `getSeriesTrendData()` | Puede eliminarse | 0 consumidores |
| `getSpins()` | Requiere migración | Consumidores a RouletteTracker |
| `addSpin()` | Requiere migración | main.js a RouletteTracker |
| `deleteSpin()` | Requiere migración | tomadorRenderer a RouletteTracker |
| `updateSpin()` | Requiere migración | tomadorRenderer a RouletteTracker |
| `clearSpins()` | Puede eliminarse | 0 consumidores externos |
| `clearSession()` | Requiere migración | orionRenderer debug a domainTracker |
| `getHitMap()` | Contrato válido | Pasa al dominio permanentemente |
| `getHitRanking()` | Contrato válido | Pasa al dominio permanentemente |
| `updateSettings()` | Requiere migración | Consumidores a RouletteTracker |
| `settings` (prop) | Requiere migración | Consumidores a `getSettings()` |
| `_freq` (getter) | Requiere migración | Consumidores a método en dominio |
| `winWinEngine` | No pertenece al dominio | Pasar directamente a renderers |
| `ready` | Puede eliminarse | Siempre resuelto |
| `getDozenDelay()` | Requiere migración | Crear DelayManager en dominio |
| `getDozenMaxDelay()` | Requiere migración | Ídem |
| `getColumnDelay()` | Requiere migración | Ídem |
| `getColumnMaxDelay()` | Requiere migración | Ídem |
| `getNumberDelay()` | Requiere migración | Ídem |
| `getNumberMaxDelay()` | Requiere migración | Ídem |
| `static getColor()` | Contrato válido | Permanecer en utils |

### Resumen del plan

| Paso | Descripción | Dependencias |
|------|-------------|--------------|
| **P1** | Eliminar `labengine.js` (lowercase), `motor_matematico_de_conjuntos.js` | Ninguna (dead code) |
| **P2** | Eliminar `integrate_lab.js` | Ninguna (script obsoleto) |
| **P3** | Crear `DelayManager` en `src/tracker/` con API de atrasos | Ninguna |
| **P4** | Migrar tomadorRenderer de TrackerCompat.delay a DelayManager | P3 |
| **P5** | Eliminar `getSeriesTrendData()` de TrackerCompat | Ninguna |
| **P6** | Migrar orionRenderer de `_freq` a `getHitMap()` + cálculo local | Ninguna |
| **P7** | Migrar orionRenderer `clearSession()` a domainTracker | P6 |
| **P8** | Migrar ataqueRenderer `winWinEngine` a parámetro directo | Ninguna |
| **P9** | Eliminar `winWinEngine` de TrackerCompat | P8 |
| **P10** | Migrar analytics consumers a RouletteAnalytics directo | Ninguna |
| **P11** | Migrar CRUD consumers a RouletteTracker + domainTracker | Ninguna |
| **P12** | Eliminar TrackerCompat completamente | P1-P11 |

**Estimación:** 4-5 fases de trabajo (Fase 3.4 → Fase 3.8).

### ¿Puede eliminarse en Fase 3.4?

**NO.** No directamente. Antes de eliminar TrackerCompat es necesario:
1. Migrar los ~20 consumidores activos (P3-P11)
2. Asegurar que ningún renderer dependa de él
3. Verificar que la UI no pierda funcionalidad

**Recomendación:** Iniciar en Fase 3.4 con la limpieza de dead code (P1-P2) y la migración de `_freq` (P6) y `winWinEngine` (P7-P8), que son cambios de bajo riesgo.
