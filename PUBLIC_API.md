# API Pública — RouletteTracker

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

Documentación de la API pública de `RouletteTracker` (clase orquestadora del dominio).

---

## RouletteTracker

### Constructor

```javascript
constructor(state, spinManager, sessionManager, historyManager, settingsManager, [delayManager])
```

**Parámetros:** inyectados por Bootstrap. No instanciar directamente.

---

### Inicialización

#### `async initialize()`

Carga settings, historial y giros desde stores persistentes. Debe llamarse una vez
antes de usar el tracker.

```javascript
await tracker.initialize();
```

---

### Spins API

#### `addSpin(number)`

Agrega un giro. Delega a SpinManager con metadatos de settings (casino, dealer, table).
Incrementa el contador de sesión si el giro es válido.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| number    | string\|number | Número de la ruleta |

**Retorna:** `object|null` — el spin creado o `null` si el número no es válido.

```javascript
const spin = tracker.addSpin("17");    // válido
const spin = tracker.addSpin(99);       // null (inválido)
```

#### `removeLastSpin()`

Elimina el último giro agregado.

**Retorna:** `object|undefined` — el spin eliminado o `undefined` si no hay giros.

#### `deleteSpin(spinId)`

Elimina un giro por su ID.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| spinId    | number | ID 1-based del giro |

**Retorna:** `boolean` — `true` si se eliminó.

#### `updateSpin(spinId, newNumber)`

Actualiza el número de un giro existente.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| spinId    | number | ID del giro |
| newNumber | string\|number | Nuevo número |

**Retorna:** `boolean` — `true` si se actualizó.

#### `clearSpins()`

Elimina todos los giros.

#### `getSpins()`

**Retorna:** `Array` — todos los giros (referencia directa).

#### `getLastSpin()`

**Retorna:** `object|undefined` — el último giro.

#### `getLastNumber()`

**Retorna:** `string|undefined` — el número del último giro.

#### `count()`

**Retorna:** `number` — cantidad total de giros.

#### `isEmpty()`

**Retorna:** `boolean` — `true` si no hay giros.

---

### Spin Persistence API

#### `async saveSpins()`

Persiste todos los giros actuales en IndexedDB.

#### `async loadSpins()`

Recarga giros desde IndexedDB y restaura en estado.

**Retorna:** `Promise<Array>`

---

### Session API

#### `startSession()`

Inicia una nueva sesión de juego.

#### `resetSession()`

Reinicia la sesión actual a valores por defecto.

#### `stopSession()`

Detiene la sesión activa.

#### `isSessionActive()`

**Retorna:** `boolean`

#### `getSession()`

**Retorna:**
```javascript
{ active: boolean, startedAt: string|null, endedAt: string|null, spinCount: number }
```

#### `incrementSessionSpinCount()`

Incrementa el contador de giros de la sesión activa.

#### `getSessionSpinCount()`

**Retorna:** `number`

#### `getSessionStartedAt()`

**Retorna:** `string|null` (ISO timestamp)

---

### History API

#### `async addSessionToHistory(sessionRecord)`

Agrega una sesión completada al historial y persiste.

#### `async clearHistory()`

Vacía el historial y persiste.

#### `async saveHistory()`

Persiste el historial actual.

#### `async loadHistory()`

Recarga el historial desde localStorage.

**Retorna:** `Promise<Array>`

#### `getHistory()`

**Retorna:** `Array` — sesiones completadas (referencia directa).

#### `getLastSession()`

**Retorna:** `object|null`

#### `getHistoryCount()`

**Retorna:** `number`

---

### Settings API

#### `getSettings()`

**Retorna:** `object` — configuración completa.

#### `async updateSettings(partial)`

Actualiza parcialmente la configuración y persiste.

#### `async setSetting(key, value)`

Establece un valor individual y persiste.

#### `async loadSettings()`

Carga configuración desde IndexedDB.

**Retorna:** `Promise<object>`

#### `async refreshSettings()`

Recarga configuración desde IndexedDB (refrescar).

**Retorna:** `Promise<object>`

#### `async saveSettings()`

Persiste la configuración actual.

#### `async resetSettings()`

Restablece a valores por defecto.

#### `getDefaultSettings()`

**Retorna:** `object` — configuración por defecto (sin modificar la actual).

---

### CustomSeries API

#### `getSeries()`

**Retorna:** `Array<{name, numbers, active}>`

#### `addOrUpdateSeries(name, numbers, [oldName])`

Agrega o actualiza una serie personalizada.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| name      | string | Nombre de la serie |
| numbers   | string[] | Array de números |
| oldName   | string (opcional) | Nombre anterior (para renombrar) |

**Retorna:** `{added: boolean, updated: boolean, collisionName: string|null}`

#### `toggleSeries(name)`

Alterna estado activo/inactivo de una serie.

**Retorna:** `boolean` — nuevo estado.

#### `deleteSeries(name)`

Elimina una serie por nombre.

**Retorna:** `boolean` — `true` si se eliminó.

---

### Getters de compatibilidad

#### `settings` (getter)

Delega a `getSettings()`. Permite sintaxis `tracker.settings.casinoName`.

#### `_freq` (getter)

Retorna objeto `{ número → count }`. Equivalente a `TrackerCompat._freq`.

---

### EventBus Integration

#### `setEventBus(eventBus)`

Vincular a un EventBus para futura emisión de eventos.

#### `getEventBus()`

**Retorna:** `EventBus|null`

#### `setDelayManager(delayManager)`

Vincular DelayManager externo para caché de atrasos.

#### `setAnalytics(analytics)`

Vincular RouletteAnalytics para delegar `getStats`/`getAdvancedStats`.

---

## RouletteAnalytics

### Constructor

```javascript
constructor(spins = [], settings = {})
```

### Métodos principales

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `refresh(spins, settings)` | `void` | Refresca datos internos |
| `getSpins()` | `Array` | Retorna referencia a spins |
| `getStats()` | `object` | Estadísticas básicas (porcentajes) |
| `getProbabilities()` | `object` | Comparación actual vs. teórica |
| `getAlerts()` | `Array` | Alertas de ausencias |
| `getStrategy()` | `Array<string>` | Sugerencias de apuesta |
| `getAdvancedStats()` | `object` | Chi-cuadrado, hot zone, distancias |
| `runsTest(category)` | `object` | Test de rachas (runs test) |
| `getConfidenceIntervals()` | `object` | Wilson confidence intervals |
| `getWindowStats(windowSize)` | `object` | Análisis de ventana deslizante |
| `getDistanceHistogram()` | `object` | Histograma de distancias (dealer signature) |
| `getSeriesTrendData()` | `Array` | Datos de tendencia de series |

---

## DelayManager

### Constructor

```javascript
constructor(getSpinsFn)
```

Recibe una función que retorna el array de giros vigente.

### Métodos

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `invalidateCache()` | `void` | Marca cache como sucio |
| `getNumberDelay(numStr)` | `number` | Atraso actual de un número |
| `getNumberMaxDelay(numStr)` | `number` | Atraso máximo histórico |
| `getDozenDelay(dozen)` | `number` | Atraso actual de una docena (1-3) |
| `getDozenMaxDelay(dozen)` | `number` | Atraso máximo de docena |
| `getColumnDelay(column)` | `number` | Atraso actual de una columna (1-3) |
| `getColumnMaxDelay(column)` | `number` | Atraso máximo de columna |
