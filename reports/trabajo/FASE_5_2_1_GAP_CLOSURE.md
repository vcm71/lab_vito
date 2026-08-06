# FASE 5.2.1 — Cierre de Gaps Críticos (Bloque I)

**Fecha:** 2026-07-24
**Proyecto:** Roulette Tracker (Orion)
**Estado:** COMPLETADO

---

## Resumen

Se cerraron los 3 gaps críticos identificados en la auditoría Fase5.2,
manteniendo el Legacy como único dueño de los spins (Opción B).

| Gap | Severidad | Archivo(s) | Estado |
|-----|-----------|-----------|--------|
| **GAP-01** | CRÍTICO | `src/tracker/SpinManager.js` | ✅ Cerrado |
| **GAP-04** | CRÍTICO | `src/tracker/RouletteTracker.js` + `rouletteSpinsStore.js` | ✅ Cerrado |
| **GAP-07** | ALTO | `src/tracker/RouletteTracker.js` + `rouletteSpinsStore.js` | ✅ Cerrado |

**Arquitectura:** Legacy sigue siendo la fuente de verdad (Opción B).
Dominio adquiere validación defensiva y capacidad de persistir/recuperar
desde la misma infraestructura.

---

## GAP-01: Validación de Spins (CRÍTICO)

### Problema
`SpinManager.addSpin()` aceptaba cualquier número, incluso valores inválidos
como `"99"`, `"xyz"`, `""`, etc. Solo el Legacy validaba contra `ROULETTE_NUMBERS`.

### Solución
**Archivo:** `src/tracker/SpinManager.js` (línea 10, línea 35)

- Import de `ROULETTE_NUMBERS` desde `rouletteTracker.js` (constante compartida,
  misma que usa el Legacy, sin duplicación).
- Validación en `addSpin()`: después del chequeo de null/undefined/vacío,
  se verifica que el número esté en `ROULETTE_NUMBERS`.
- Retorna `null` si no es válido, consistente con el Legacy.

El flujo `SyncAdapter → domainTracker.addSpin(num)` ahora rechaza números
inválidos en el dominio, aunque el Legacy ya lo hace — esto establece la
validación en el dominio para cuando el ownership se invierta.

### Consistencia con el Legacy
Ambos usan el mismo array `ROULETTE_NUMBERS`. El Legacy llama
`ROULETTE_NUMBERS.includes(numberStr)`, ahora el Domain hace
`ROULETTE_NUMBERS.includes(String(number))`.

---

## GAP-04: Persistencia del Dominio (CRÍTICO)

### Problema
El dominio no tenía capacidad de persistir ni recuperar spins.
Todo persistencia residía exclusivamente en el Legacy (`rouletteSpinsStore`).

### Solución
**Archivo:** `src/tracker/RouletteTracker.js` (líneas 151–173)

Se agregaron dos métodos que reutilizan la infraestructura existente:

```js
async saveSpins() {
  await rouletteSpinsStore.setSpins(this.getSpins());
}

async loadSpins() {
  const spins = await rouletteSpinsStore.load();
  this.state.spins = spins;
  return spins;
}
```

### Principios cumplidos
- **Sin duplicación:** usan `rouletteSpinsStore`, el mismo singleton que el Legacy.
- **Sin segundo acceso a IndexedDB:** es el mismo punto de acceso.
- **Desacoplado:** `RouletteTracker` es quien importa la infraestructura,
  no `SpinManager` (el dominio puro queda limpio).
- **Coordinación centralizada:** `saveSpins()` actualiza la fuente de verdad
  compartida, accesible por Legacy y Domain desde la misma DB.

---

## GAP-07: Hidratación de Spins (ALTO)

### Problema
Al recargar la página, el dominio perdía todos los spins en memoria.
La UI usaba el Legacy para todo — pero el dominio se quedaba vacío hasta
que el adapter sincronizara explícitamente.

### Solución
**Archivo:** `src/tracker/RouletteTracker.js` (líneas 67–77)

`RouletteTracker.initialize()` ahora carga spins desde `rouletteSpinsStore.load()`
junto con settings e history:

```js
async initialize() {
  const settings = await this.settingsManager.load();
  const history = await this.historyManager.load();
  const spins = await rouletteSpinsStore.load();
  this.state.settings = settings;
  this.state.history = history;
  this.state.spins = spins;
}
```

### Flujo de arranque final
1. `domainTracker.initialize()` → carga settings, history, spins desde IndexedDB
2. Legacy constructor → llama `_loadSpins()` → carga desde el mismo IndexedDB
3. Ambos trackers tienen los mismos datos sin necesidad de sincronización inicial
4. `TrackerSyncAdapter.syncAllSpins()` aún funciona para casos de desincronización

---

## Compatibilidad

### Flujo addSpin (sin cambios observables)
```
user → main.js → syncAdapter.addSpin(num)
  → legacy.addSpin(num) → valida ROULETTE_NUMBERS → guarda en IndexedDB
  → domainTracker.addSpin(num)
    → spinManager.addSpin(num) → valida ROULETTE_NUMBERS → guarda en memoria
  → OK (ambos aceptan/rechazan los mismos números)
```

### Flujo importSpins (sin cambios)
```
user → syncAdapter.importSpins(numbersArray)
  → legacy.importSpins(numbersArray) → normaliza, valida, guarda en IndexedDB
  → _syncAllSpins() → copia todos los spins del Legacy al dominio
```

### Flujo clearSessionAndRecord (sin cambios)
```
user → syncAdapter.clearSessionAndRecord()
  → domainTracker.recordAndClearSession() → historial, limpia dominio
  → legacy.clearSession() → limpia Legacy
```

### Build
`npm run build` → 78 módulos transformados, 0 errores.

---

## Archivos modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/tracker/SpinManager.js` | Import + validación ROULETTE_NUMBERS en addSpin() | +3 |
| `src/tracker/RouletteTracker.js` | Import rouletteSpinsStore; initialize() carga spins; saveSpins(), loadSpins() | +25 |

---

## Estado final de los gaps

| Gap | Antes | Después |
|-----|-------|---------|
| GAP-01 | Domain aceptaba números inválidos | Domain valida contra ROULETTE_NUMBERS (mismo set que Legacy) |
| GAP-04 | Domain no podía persistir | Domain tiene saveSpins()/loadSpins() vía rouletteSpinsStore |
| GAP-07 | Domain se iniciaba vacío | Domain hidrata desde IndexedDB en initialize() |

**Ownership:** Legacy sigue siendo el dueño. No se invirtió.
**Deuda técnica restante:** GAP-02 (deleteSpin/updateSpin), GAP-03 (normalización),
GAP-05 (cache de frecuencias), GAP-06 (metadatos casino/dealer/table).
