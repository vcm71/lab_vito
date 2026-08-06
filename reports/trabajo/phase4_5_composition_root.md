# Fase4.5 — Composición y API Pública

**Fecha:** 2026-07-24
**Propósito:** Migrar lógica CRUD de main.js a RouletteTracker.js y limpiar dependencias directas.

---

## API Pública Migrada (RouletteTracker.js)

### CustomSeries API
| Método | Parámetros | Retorno | Descripción |
|--------|-----------|---------|-------------|
| `getSeries()` | — | `Array<{name, numbers, active}>` | Obtener todas las series |
| `addOrUpdateSeries(name, numbers, oldName?)` | `name`: string, `numbers`: string[], `oldName?`: string | `{added, updated, collisionName}` | Agregar/actualizar/renombrar con colisión |
| `toggleSeries(name)` | `name`: string | `boolean` (nuevo estado) | Alternar activación |
| `deleteSeries(name)` | `name`: string | `boolean` (encontrada) | Eliminar por nombre |

### Session Recording API
| Método | Parámetros | Retorno | Descripción |
|--------|-----------|---------|-------------|
| `recordAndClearSession(externalSpins?)` | `externalSpins?`: Array (desde Composition Root) | `Promise<{saved, spinCount}>` | Guardar sesión + reiniciar |

### HitMap / Radiografía API
| Método | Parámetros | Retorno | Descripción |
|--------|-----------|---------|-------------|
| `getHitMap(externalSpins?)` | `externalSpins?`: Array | `Object<string, number>` | Mapa frecuencia números |
| `getHitRanking(externalSpins?)` | `externalSpins?`: Array | `Array<{num, hits}>` | Ranking descendente |

---

## Migraciones Realizadas en main.js

### 1. Radiografía (línea ~665)
**Antes:** Construcción inline de hitMap con `forEach + {}`
```js
const hitMap = {};
spins.forEach(s => {
  const n = (s && typeof s === 'object') ? s.number : s;
  if (n !== undefined) hitMap[n] = (hitMap[n] || 0) + 1;
});
```
**Después:** `domainTracker.getHitMap(spins)`

### 2. clearSessionAction (línea ~1441)
**Antes:** 15 líneas con lectura de `domainTracker.getSpins()`, construcción manual de sessionRecord, llamada a `addSessionToHistory`, `resetSession()`
**Después:** `domainTracker.recordAndClearSession(tracker.getSpins())` — 2 líneas ejecutivas

### 3. renderSeries — Toggle (línea ~764)
**Antes:** Lectura de `domainTracker.getSettings().customSeries`, mutación inline, re-escritura vía `updateSettings`
**Después:** `domainTracker.toggleSeries(name)`

### 4. renderSeries — Delete (línea ~791)
**Antes:** Filtrado manual del array, re-escritura vía `updateSettings`
**Después:** `domainTracker.deleteSeries(name)`

### 5. btnAddSeries (línea ~1273)
**Antes:** 20+ líneas con lógica de edición/colisión/actualización inline sobre `customSeries`
**Después:** `domainTracker.addOrUpdateSeries(name, nums, editingSeriesName)` con chequeo de `result.collisionName`

### 6. renderSeries — getSeries (línea ~706)
**Antes:** `[...(domainTracker.getSettings().customSeries || [])]`
**Después:** `[...domainTracker.getSeries()]`

---

## Importaciones Limpiadas

| Importación eliminada | Archivo | Razón |
|----------------------|---------|-------|
| `RED_NUMBERS` | `./rouletteTracker.js` | No se usaba (solo importada) |
| `rouletteSettingsStore` | `./roulettesettingsStore.js` | No se usaba (solo importada) |

---

## Arquitectura: Composition Root

main.js actúa como **Composition Root**:
1. **Obtiene instancias** vía `kernel.bootstrap()` y `kernel.getTracker()`
2. **Pasa datos del tracker antiguo** como `externalSpins` a los métodos del dominio
3. **NO importa managers internos** (SpinManager, SessionManager, etc.)
4. **NO manipula estado interno** directamente — solo llama métodos públicos

```
main.js (Composition Root)
  ├── tracker (old bot) — source of truth para spins
  ├── domainTracker (new domain) — API pública
  │     ├── getHitMap(spins)    ← recibe spins del tracker
  │     ├── recordAndClearSession(spins)
  │     ├── addOrUpdateSeries()
  │     ├── toggleSeries()
  │     └── deleteSeries()
  └── engines — reciben tracker (old bot) por compatibilidad
```

---

## Tareas Pendientes (Fase4.5+)

- [ ] **migrate-tester-simulation**: Mover lógica TESTER a módulo separado
- [ ] **sync-addSpin**: Sincronizar `domainTracker.addSpin()` en el flujo addSpin de main.js (cuando se unifique la fuente de verdad)
- [ ] **sync-import**: Sincronizar spins importados con domainTracker
- [ ] **engine-migration**: Migrar engines (WinWin, DA, Orion) de `tracker` (old) a `domainTracker`
