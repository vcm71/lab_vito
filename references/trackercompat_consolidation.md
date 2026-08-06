# TrackerCompat Consolidation

**Fase:** 3.4 — TrackerCompat Consolidation
**Fecha:** 2026-07-24
**Estado:** Consolidación completada.

---

## 1. Cambios Realizados

### 1.1 DelayManager — Nuevo Componente de Dominio

**Archivo creado:** `src/tracker/DelayManager.js`
**Propósito:** Cómputo y cache de atrasos (delays) de números, docenas y columnas.

- Lógica extraída íntegramente de TrackerCompat
- Recibe función `getSpins()` para desacoplamiento (no acopla a RouletteTracker ni TrackerCompat)
- Mantiene cache con dirty flag (O(1) tras primer cómputo)
- Algoritmo O(N × 44) idéntico al Legacy
- Expone: `invalidateCache()`, `getDozenDelay()`, `getDozenMaxDelay()`, `getColumnDelay()`, `getColumnMaxDelay()`, `getNumberDelay()`, `getNumberMaxDelay()`

### 1.2 TrackerCompat — Métodos Eliminados

| Método | Motivo |
|--------|--------|
| `clearSpins()` | 0 consumidores externos. `clearSession()` hace lo mismo (llama a `_domain.clearSpins()` directamente). Eliminado. |
| `getSeriesTrendData()` | 0 consumidores. El método sigue existiendo en RouletteAnalytics. |
| `ready` | 0 consumidores. Era `Promise.resolve()` siempre resuelta. Ningún código verificaba `tracker.ready` (los `.ready?.then()` en main.js son de engines, no de TrackerCompat). |
| `_delaysDirty` (estado) | Migrado a DelayManager |
| `_cachedDelays` (estado) | Migrado a DelayManager |
| `_recomputeDelays()` (interno) | Migrado a DelayManager como `_recompute()` |
| `_invalidateDelays()` (lógica) | Conservado como delegación pública a `delayManager.invalidateCache()` |

### 1.3 TrackerCompat — Métodos Conservados (Delegación Pura)

| Método | Destino |
|--------|---------|
| `getSpins()` | RouletteTracker.getSpins() |
| `addSpin(number)` | RouletteTracker.addSpin() |
| `deleteSpin(spinId)` | RouletteTracker.deleteSpin() |
| `updateSpin(spinId, newNumber)` | RouletteTracker.updateSpin() |
| `clearSession()` | RouletteTracker + DelayManager.invalidateCache() |
| `updateSettings(partial)` | RouletteTracker.updateSettings() |
| `getHitMap()` | RouletteTracker.getHitMap() |
| `getHitRanking()` | RouletteTracker.getHitRanking() |
| `getStats()` | RouletteAnalytics.getStats() |
| `getAdvancedStats()` | RouletteAnalytics.getAdvancedStats() |
| `getProbabilities()` | RouletteAnalytics.getProbabilities() |
| `getConfidenceIntervals()` | RouletteAnalytics.getConfidenceIntervals() |
| `getAlerts()` | RouletteAnalytics.getAlerts() |
| `getStrategy()` | RouletteAnalytics.getStrategy() |
| `getDistanceHistogram()` | RouletteAnalytics.getDistanceHistogram() |
| `getWindowStats(windowSize)` | RouletteAnalytics.getWindowStats() |
| `runsTest(type)` | RouletteAnalytics.runsTest() |
| `_freq` (getter) | Cómputo local en TrackerCompat (O(N) por acceso, sin cache) |
| `winWinEngine` | Propiedad asignada externamente |
| `_invalidateDelays()` | DelayManager.invalidateCache() |
| `getDozenDelay(dozen)` | DelayManager.getDozenDelay() |
| `getDozenMaxDelay(dozen)` | DelayManager.getDozenMaxDelay() |
| `getColumnDelay(column)` | DelayManager.getColumnDelay() |
| `getColumnMaxDelay(column)` | DelayManager.getColumnMaxDelay() |
| `getNumberDelay(numStr)` | DelayManager.getNumberDelay() |
| `getNumberMaxDelay(numStr)` | DelayManager.getNumberMaxDelay() |
| `static getColor(num)` | getColor() utilidad |

### 1.4 TrackerCompat — Propiedades Públicas

| Propiedad | Tipo | Propósito |
|-----------|------|-----------|
| `settings` | Copia de RouletteTracker.getSettings() | Acceso sincrónico para renderers |
| `winWinEngine` | Asignación externa | No pertenece al dominio |
| `_freq` (getter) | Cómputo O(N) | Frecuencia para renderers |

---

## 2. Ownership Definitivo

| Responsabilidad | Owner |
|-----------------|-------|
| Spins CRUD | RouletteTracker (en src/tracker/) |
| Sesión | SessionManager (en src/tracker/) |
| Settings | SettingsManager (en src/tracker/) |
| **Atrasos (Delays)** | **DelayManager** (en src/tracker/) |
| Análisis básico | RouletteAnalytics (en src/analytics/) |
| Compatibilidad Legacy | TrackerCompat (fachada delgada) |
| UI / Renderers | main.js y *Renderer.js (capa de presentación) |
| Motores | engines/* (reciben RouletteTracker directamente) |

---

## 3. Tabla Comparativa

### Antes de Fase 3.4

```
TrackerCompat (272 líneas)
├── 4 métodos CRUD (delegación)
├── 2 duplicados (clearSpins(), clearSession() idénticos)
├── 10 métodos de análisis (delegación a RouletteAnalytics)
├── 1 método sin consumidores (getSeriesTrendData)
├── 1 método residual (ready)
├── 2 consultas de dominio (getHitMap, getHitRanking)
├── 1 estático (getColor)
├── 7 métodos/estados de delay ✓ (propietario)
│   ├── _delaysDirty, _cachedDelays
│   ├── _recomputeDelays(), _invalidateDelays()
│   └── 6 getters públicos
├── winWinEngine (no pertenece)
└── _freq getter (comodín)

Responsabilidades de TrackerCompat: 5 (CRUD + análisis + retrasos + dominio + compatibilidad)
```

### Después de Fase 3.4

```
TrackerCompat (~206 líneas)
├── 4 métodos CRUD (delegación)
├── 0 duplicados (clearSession únicamente)
├── 9 métodos de análisis (delegación a RouletteAnalytics)
├── 0 método sin consumidores (eliminados)
├── 0 método residual (eliminado)
├── 2 consultas de dominio (delegación)
├── 1 estático (getColor)
├── 7 métodos/estados de delay ✗ (SOLO delegación)
│   ├── _invalidateDelays() → DelayManager.invalidateCache()
│   └── 6 getters → DelayManager.*
├── winWinEngine (conservado como propiedad, documentado como no perteneciente)
└── _freq getter (conservado)

Responsabilidades de TrackerCompat: 4 (CRUD + análisis + dominio + compatibilidad)
                                    └── todo delegación pura, sin estado propio de negocio

DelayManager (~142 líneas) [NUEVO — src/tracker/]
├── 1 estado de cache (dirty flag)
├── 1 cache completo (_cache)
├── 1 método de invalidación (invalidateCache)
├── 1 método de recálculo (_recompute)
└── 6 métodos públicos de consulta

Responsabilidades de DelayManager: 1 (cómputo y cache de atrasos)
```

### Métricas

| Métrica | Antes | Después |
|---------|-------|---------|
| Líneas de TrackerCompat | 272 | ~206 |
| Métodos en TrackerCompat | 28 | 23 |
| Estados de negocio en TrackerCompat | 2 (_delaysDirty, _cachedDelays) | 0 |
| Lógica de negocio en TrackerCompat | ~110 líneas (delays) | 0 |
| Componentes de dominio (src/tracker/) | 6 | 7 (+DelayManager) |

---

## 4. Lista Final de Métodos en TrackerCompat

### Adaptadores Indispensables
(Capa de compatibilidad que TrackerCompat debe mantener)

| Método | Justificación |
|--------|---------------|
| `getSpins()` | Consumido por 5+ renderers. RouletteTracker.getSpins() es el destino. |
| `addSpin(number)` | Consumido indirectamente por tomadorRenderer. |
| `deleteSpin(spinId)` | Consumido por tomadorRenderer. |
| `updateSpin(spinId, newNumber)` | Consumido por tomadorRenderer. |
| `clearSession()` | Consumido por orionRenderer y main.js. |
| `updateSettings(partial)` | Consumido por tomadorRenderer y main.js. |
| `settings` | Acceso sincrónico; consumido por tomadorRenderer (20+ usos). |
| `getHitMap()` | Contrato público válido. |
| `getHitRanking()` | Contrato público válido. |
| `static getColor(num)` | Contrato público válido. |

### Compatibilidad Temporal
(Candidatos a eliminación en Fase 3.5)

| Método | Justificación | Migración Necesaria |
|--------|---------------|---------------------|
| `getStats()` | main.js consume en updateUI() | main.js → RouletteAnalytics |
| `getAdvancedStats()` | main.js consume | main.js → RouletteAnalytics |
| `getProbabilities()` | main.js consume | main.js → RouletteAnalytics |
| `getConfidenceIntervals()` | main.js consume | main.js → RouletteAnalytics |
| `getAlerts()` | main.js consume | main.js → RouletteAnalytics |
| `getStrategy()` | main.js consume | main.js → RouletteAnalytics |
| `getDistanceHistogram()` | main.js consume | main.js → RouletteAnalytics |
| `getWindowStats(windowSize)` | main.js consume | main.js → RouletteAnalytics |
| `runsTest(type)` | main.js consume | main.js → RouletteAnalytics |

### No Pertenece (Documentado, Refactor Fase 3.5)

| Propiedad | Justificación |
|-----------|---------------|
| `winWinEngine` | Asignada externamente. No es responsabilidad de TrackerCompat. |
| `_freq` | Cómputo de presentación. Debería estar en orionRenderer o dominio. |

---

## 5. Riesgos Residuales

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| `_freq` en TrackerCompat | BAJA | No es lógica de dominio pero tampoco bloquea nada. |
| `winWinEngine` en TrackerCompat | BAJA | No hay acoplamiento activo; es una propiedad pasiva. |
| Duplicidad getStats/getAdvancedStats | MEDIA | RouletteTracker y RouletteAnalytics tienen implementaciones divergentes. No bloquea la eliminación de TrackerCompat. |
| main.js consume analytics via TrackerCompat | MEDIA | ~9 métodos que deberían consumir RouletteAnalytics directamente. |

---

## 6. Conclusión — ¿Puede eliminarse TrackerCompat en Fase 3.5?

**SÍ, parcialmente.** No en su totalidad en una sola fase, pero:

- **Eliminable inmediatamente:** Los 9 métodos de análisis (main.js puede consumir RouletteAnalytics directamente)
- **Eliminable con migración de main.js:** `_freq`, `winWinEngine`
- **Requiere migración de tomadorRenderer:** CRUD + settings (5 métodos + 1 propiedad)
- **Debe permanecer:** Hasta que todos los consumidores migren

**Recomendación:** Iniciar en Fase 3.5 con la migración a RouletteAnalytics directo (los 9 métodos de análisis) y la eliminación de `winWinEngine` + `_freq` de TrackerCompat. Esto dejaría TrackerCompat con solo ~12 métodos CRUD/compat, que pueden eliminarse en Fase 3.6.
