# Modelo de Dominio — Roulette Tracker Pro

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26  
> **Fase:** 4.4 — Engineering Documentation & Governance

---

## 1. Entidades del dominio

### 1.1 Spin (Giro)

**¿Qué representa?** Una tirada individual de ruleta americana.

**Propietario:** `SpinManager` — único responsable de crear, modificar y eliminar giros.

**Estructura:**

```javascript
{
  id:        Number,       // 1-based, secuencial, se reindexa al eliminar
  number:    String,       // "00", "0", "1".."36" — validado contra ROULETTE_NUMBERS
  timestamp: String,       // ISO 8601
  casino:    String|undefined,  // Metadato del casino
  dealer:    String|undefined,  // Metadato del crupier
  table:     String|undefined   // Metadato de la mesa
}
```

**Invariantes:**
- `number` ∈ ROULETTE_NUMBERS (38 valores válidos)
- `id` siempre es 1-based secuencial sin huecos
- Al eliminar un spin, los IDs posteriores se reindexan
- `timestamp` se genera al momento de crear el spin

### 1.2 Session (Sesión)

**¿Qué representa?** Una sesión de juego activa, con inicio, fin y conteo de giros.

**Propietario:** `SessionManager` — único responsable del ciclo de vida de sesión.

**Estructura:**

```javascript
{
  active:    Boolean,      // true = sesión en curso
  startedAt: String|null,  // ISO 8601
  endedAt:   String|null,  // ISO 8601
  spinCount: Number        // Giros registrados en esta sesión
}
```

**Invariantes:**
- Solo puede haber una sesión activa a la vez
- `active=false` ∧ `endedAt≠null` = sesión completada
- `active=false` ∧ `endedAt=null` = sesión nunca iniciada o reseteada
- `spinCount` se incrementa solo cuando `addSpin()` tiene éxito

### 1.3 SessionRecord (Registro de historial)

**¿Qué representa?** Una sesión completada archivada en el historial.

**Propietario:** `HistoryManager` — único responsable del array `state.history`.

**Estructura (definida por el consumidor):**

```javascript
{
  // No hay estructura fija — el HistoryManager almacena objetos opacos.
  // Convención: { startTime, endTime, spinCount, spins: [...] }
}
```

**Invariantes:**
- El array `history` es de solo-append vía `addSession()`
- Se puede eliminar por índice con `removeSession(index)`
- `clear()` vacía todo el historial

### 1.4 Settings (Configuración)

**¿Qué representa?** La configuración global del tracker.

**Propietario:** `SettingsManager` — único responsable de leer, mutar y persistir settings.

**Estructura (parcial):**

```javascript
{
  casinoName:        String,
  crupierName:       String,
  tableName:         String,
  colorAlert:        Number,      // Umbral de alerta para colores
  parityAlert:       Number,
  highLowAlert:      Number,
  dozenAlert:        Number,
  columnAlert:       Number,
  seriesAlert:       Number,
  confidenceColors:  Number,      // % confianza para intervalos
  confidenceParity:  Number,
  confidenceRange:   Number,
  confidenceDozens:  Number,
  confidenceColumns: Number,
  customSeries:      Array<{name: String, numbers: String[], active: Boolean}>,
  // ... más campos gestionados por rouletteSettingsStore
}
```

**Invariantes:**
- `settings` nunca es `null` — siempre tiene valores por defecto
- Se muta por merge superficial (`update`) o asignación directa (`set`)
- `customSeries` es un array con elementos que tienen `name`, `numbers`, `active`

---

## 2. Agregados

### 2.1 RouletteTracker (Agregado raíz)

El agregado `RouletteTracker` coordina todas las operaciones del dominio.
Las operaciones externas siempre pasan por el tracker; los managers internos
no se exponen públicamente.

**Relaciones:**
- Posee 1 `TrackerState` (estado único)
- Posee 1 `SpinManager` (gestión de giros)
- Posee 1 `SessionManager` (gestión de sesiones)
- Posee 1 `HistoryManager` (gestión de historial)
- Posee 1 `SettingsManager` (gestión de configuración)
- Posee 0..1 `DelayManager` (cómputo de atrasos, inyectado externamente)
- Posee 0..1 `RouletteAnalytics` (análisis, inyectado externamente)

---

## 3. Value Objects

| Value Object   | Descripción                                      | Inmutable |
|----------------|--------------------------------------------------|-----------|
| `numberMeta`   | Metadatos: color, paridad, docena, columna       | Sí        |
| `DelayCache`   | Cache de atrasos: numbers, dozens, columns       | Interno   |
| `Spin metadata`| casino, dealer, table — opacos para el dominio   | No        |

---

## 4. Diagrama de relaciones entre entidades

```
RouletteTracker (Agregado raíz)
│
├── 1 TrackerState
│   ├── spins[]    ──── 0..* Spin (entidad)
│   ├── session{}  ──── 0..1 Session (entidad)
│   ├── history[]  ──── 0..* SessionRecord (entidad)
│   └── settings{} ──── 1 Settings (entidad)
│
├── 1 SpinManager     ──── opera sobre TrackerState.spins
├── 1 SessionManager  ──── opera sobre TrackerState.session
├── 1 HistoryManager  ──── opera sobre TrackerState.history
├── 1 SettingsManager ──── opera sobre TrackerState.settings
├── 0..1 DelayManager ──── recibe getSpins()
└── 0..1 RouletteAnalytics ──── recibe (spins, settings)
```

---

## 5. Invariantes del dominio

| # | Invariante | Responsable | Violación posible |
|---|-----------|-------------|-------------------|
| 1 | `state.spins` es siempre un Array | `SpinManager` | Asignación directa externa |
| 2 | Los IDs de spin son 1-based sin huecos | `SpinManager.deleteSpin()` | No llamar reindexación |
| 3 | `number` validado contra ROULETTE_NUMBERS | `SpinManager.addSpin/updateSpin` | Llamar con número inválido |
| 4 | Solo hay una sesión activa | `SessionManager` | Múltiples `start()` sin `stop()` |
| 5 | `spinCount` refleja giros exitosos | `RouletteTracker.addSpin()` | Incrementar sin verificar retorno |
| 6 | Los atrasos se recalculan al mutar spins | `DelayManager.invalidateCache()` | Mutar spins sin invalidar |
| 7 | `settings` nunca es null/undefined | `SettingsManager.load()` | Error de carga no manejado |
| 8 | El historial persiste tras agregar | `RouletteTracker.addSessionToHistory()` | Olvidar `save()` |

---

## 6. Flujos de estado

### Agregar un giro

```
Usuario → RouletteTracker.addSpin(number)
  → SpinManager.addSpin(number, meta)
    → Valida number ∈ ROULETTE_NUMBERS
    → Crea objeto Spin {id, number, timestamp, ...}
    → Push a state.spins
  → Si éxito: RouletteTracker.incrementSessionSpinCount()
    → SessionManager.incrementSpinCount()
  → Retorna Spin|null
```

### Iniciar sesión

```
Usuario → RouletteTracker.startSession()
  → SessionManager.start()
    → state.session = {active: true, startedAt: now, endedAt: null, spinCount: 0}
```

### Cerrar y archivar sesión

```
Usuario → RouletteTracker.stopSession()
  → SessionManager.stop()
    → state.session.active = false
    → state.session.endedAt = now
  → (Externamente) RouletteTracker.addSessionToHistory(record)
    → HistoryManager.addSession(record)
    → HistoryManager.save()
```

---

## 7. Responsabilidades y permisos

| Entidad        | ¿Quién crea? | ¿Quién modifica? | ¿Quién lee? |
|----------------|-------------|------------------|-------------|
| Spin           | `SpinManager.addSpin()` | `SpinManager.updateSpin/deleteSpin`, `SpinManager.removeLastSpin` | Cualquier consumidor vía `getSpins()` |
| Session        | `SessionManager.start()` | `SessionManager.stop/reset`, `SessionManager.incrementSpinCount` | Cualquier consumidor vía `getSession()` |
| SessionRecord  | `HistoryManager.addSession()` | `HistoryManager.removeSession`, `HistoryManager.clear` | Cualquier consumidor vía `getHistory()` |
| Settings       | `SettingsManager.load()` | `SettingsManager.set/update/merge/reset` | Cualquier consumidor vía `getSettings()` |
| DelayCache     | `DelayManager._recompute()` | Solo lectura (cache) | `getNumberDelay()`, `getDozenDelay()`, `getColumnDelay()` |
