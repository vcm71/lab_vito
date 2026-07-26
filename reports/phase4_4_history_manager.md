# Fase 4.4 — History Manager

**Fecha:** 2026-07-24  
**Fase:** 4.4  
**Proyecto:** Orion / Roulette Tracker  
**Estado:** ✓ Completado

---

## Objetivo

Implementar `HistoryManager` como gestor del historial de sesiones completadas, separando la responsabilidad de persistencia del historial del resto del dominio. Anteriormente, el historial de sesiones completadas no existía como concepto en el dominio — `TrackerState.history` era un array vacío que nunca se poblaba, y `getHistory()` devolvía incorrectamente los giros actuales en lugar de sesiones completadas.

## Cambios realizados

### 1. `src/tracker/HistoryManager.js` — Implementación completa

- **Persistencia:** usa `localStorage` (clave `orion_roulette_history`) — no toca IndexedDB.
- **API:**
  - `load()` — carga el historial desde localStorage a `state.history`
  - `save()` — persiste `state.history` a localStorage
  - `addSession(sessionRecord)` — agrega registro al array
  - `removeSession(index)` — elimina por índice
  - `clear()` — vacía el historial
  - `getHistory()` — devuelve referencia a `state.history`
  - `getLastSession()` — última sesión completada
  - `count()` — cantidad de sesiones
- **Constructor modificado:** ahora recibe `state` (TrackerState) para operar sobre el array compartido.

### 2. `src/core/Bootstrap.js` — Constructor actualizado

- `new HistoryManager()` → `new HistoryManager(trackerState)` para que HistoryManager reciba el estado compartido.

### 3. `src/tracker/RouletteTracker.js` — API de historial

- **`getHistory()` corregido:** ya no devuelve los giros actuales (`spinManager.getHistory()`), ahora devuelve `this.state.history` (sesiones completadas).
- **Nuevos métodos públicos:**
  - `addSessionToHistory(sessionRecord)` — agrega sesión + persiste
  - `clearHistory()` — vacía historial + persiste
  - `saveHistory()` — persiste solo
  - `loadHistory()` — recarga desde localStorage
  - `getLastSession()` — última sesión
  - `getHistoryCount()` — conteo de sesiones

### 4. `main.js` — Migración de `clearSessionAction`

- Ahora es `async` (aceptado por `addEventListener`).
- Antes de limpiar, captura los giros actuales (`domainTracker.getSpins()`) y la sesión (`domainTracker.getSession()`).
- Si hay giros (>0), los empaqueta como registro de sesión y los guarda en el historial via `domainTracker.addSessionToHistory()`.
- Luego procede con el reinicio (`resetSession()` + `clearSession()`).
- Order cambiado: primero `domainTracker` guarda y resetea, luego `tracker.clearSession()` limpia los giros del tracker original.

## Archivos modificados

| Archivo | Líneas | Cambio |
|---|---|---|
| `src/tracker/HistoryManager.js` | 67 | Implementación completa (antes era esqueleto vacío) |
| `src/core/Bootstrap.js` | 1 | Constructor: pasa `trackerState` a HistoryManager |
| `src/tracker/RouletteTracker.js` | 54 | `getHistory()` corregido + 6 nuevas API de history |
| `main.js` | 18 | `clearSessionAction` migrada a async con guardado en historial |

## Archivos NO modificados

- `src/tracker/TrackerState.js` — `history: []` ya existía, sin cambios
- `src/tracker/SpinManager.js` — sin cambios
- `src/tracker/SessionManager.js` — sin cambios
- `rouletteSettingsStore.js` — sin cambios (history usa localStorage, no IndexedDB)
- `rouletteTracker.js` — sin cambios (tracker legacy no tocado)

## Verificación

- `npm run build`: ✓ 77 módulos, 0 errores, 543ms

## Ownership

| Entidad | Propietario | Modificador | Lector |
|---|---|---|---|
| Historial de sesiones | `TrackerState.history` | `HistoryManager` | `RouletteTracker` |

## Notas

- Se eligió `localStorage` en lugar de IndexedDB para el historial para evitar dependencia cruzada con `rouletteSettingsStore` y mantener la implementación liviana.
- No se creó un store IndexedDB dedicado para el historial — esto se puede escalar si el tamaño crece (sesiones con miles de giros cada una).
- `getHistory()` en `RouletteTracker` cambió semánticamente de "giros actuales" a "sesiones completadas". Esto es seguro porque ningún código cliente llamaba a `domainTracker.getHistory()` (solo usaban `getSpins()` para giros actuales).
