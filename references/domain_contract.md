# Contrato Público del Dominio — RouletteTracker

**Versión:** 1.0 (Fase 3.1 — API Freeze)
**Fecha:** 2026-07-24
**Estado:** Congelado. No modificar sin actualizar este documento.

> Este documento define el contrato estable del dominio `RouletteTracker` en
> `src/tracker/RouletteTracker.js`. Es la fuente de verdad para cualquier
> consumidor del dominio (UI, engines, testers, analytics).

---

## Principios

- **RouletteTracker** es el único orquestador del dominio.
- Recibe 5 managers por constructor: `TrackerState`, `SpinManager`,
  `SessionManager`, `HistoryManager`, `SettingsManager`.
- No implementa lógica de negocio directamente — delega a los managers.
- Expone una API asíncrona cuando hay persistencia (IndexedDB/localStorage).
- **No expone** `settings` como propiedad directa; siempre usar `getSettings()`.
- **No expone** `_freq` ni otros prefijos `_` (convención privada en TrackerCompat).

---

## API Pública Oficial

### Inicialización

```js
async initialize()
```

Carga settings, historial y giros desde persistencia. Debe llamarse una vez antes
de cualquier operación.

---

### Spin CRUD

```js
addSpin(number: string|number) → object|null
removeLastSpin() → object|undefined
deleteSpin(spinId: number) → boolean
updateSpin(spinId: number, newNumber: string|number) → boolean
clearSpins() → void
```

`addSpin` inyecta metadatos de casino, crupier y mesa desde settings actuales.

### Spin Queries

```js
getSpins() → Array<object>
getLastSpin() → object|undefined
getLastNumber() → string|undefined
count() → number
isEmpty() → boolean
```

`getSpins()` es el método más usado del dominio (~22 consumidores). Retorna
el array de giros actual (mutable por referencia — no clonar sin necesidad).

### Spin Persistence

```js
async saveSpins() → void
async loadSpins() → Array<object>
```

Persiste/recupera giros desde IndexedDB (`rouletteSpinsStore`).

---

### Session Lifecycle

```js
startSession() → void
stopSession() → void
resetSession() → void
isSessionActive() → boolean
getSession() → { active, startedAt, endedAt, spinCount }
getSessionSpinCount() → number
getSessionStartedAt() → string|null
incrementSessionSpinCount() → void
```

La sesión representa un perímetro de juego. `resetSession()` no borra giros,
solo reinicia los metadatos de sesión. `incrementSessionSpinCount()` se llama
automáticamente tras cada `addSpin` en el flujo productivo.

### Session Recording

```js
async recordAndClearSession() → { saved: boolean, spinCount: number }
```

Operación compuesta: (1) guarda sesión + giros en historial, (2) resetea sesión,
(3) limpia giros. Es la forma correcta de cerrar una sesión.

---

### History

```js
getHistory() → Array<object>
async addSessionToHistory(sessionRecord: object) → void
async clearHistory() → void
async saveHistory() → void
async loadHistory() → Array<object>
getLastSession() → object|null
getHistoryCount() → number
```

Historial de sesiones completadas. Persistencia en localStorage vía HistoryManager.

---

### Settings

```js
getSettings() → object
async updateSettings(partial: object) → void
async setSetting(key: string, value: any) → void
async loadSettings() → object
async refreshSettings() → object
async saveSettings() → void
async resetSettings() → void
getDefaultSettings() → object
```

`getSettings()` es la única forma autorizada de leer configuración. El objeto
retornado incluye `atrasosMaxWindow` (global), `moduleThresholds` (6 módulos),
y todas las claves de UI.

---

### Custom Series

```js
getSeries() → Array<{ name, numbers, active }>
addOrUpdateSeries(name, numbers, oldName?) → { added, updated, collisionName }
toggleSeries(name) → boolean
deleteSeries(name) → boolean
```

Series personalizadas anidadas dentro de `getSettings().customSeries`.
`addOrUpdateSeries` soporta renombrar vía parámetro `oldName`.

---

### Stats (Computados)

```js
getHitMap() → Object<string, number>
getHitRanking() → Array<{ num, hits }>
getStats() → { total, colorsPct, parityPct, highLowPct, dozensPct, columnsPct }
getAdvancedStats() → { chiSquare, chiDiagnosis, hotZone, meanDelays }
```

`getStats()` usa la ruleta americana (38 números). `getAdvancedStats()` incluye
chi-cuadrado, hot zone (ventana 5 números en la rueda) y medias de atraso de color.

---

### EventBus

```js
setEventBus(eventBus: EventBus) → void
getEventBus() → EventBus|null
```

Infraestructura para emisión de eventos futuros.

---

### Static Utilities

```js
static getWheelDistance(num1: string|number, num2: string|number) → number|null
```

Distancia mínima entre dos números en la rueda americana (0–19 posiciones).

---

## API de Compatibilidad (TrackerCompat)

> Los siguientes métodos existen en `TrackerCompat` (no en RouletteTracker) y son
> consumidos a través de la variable `tracker` en renderers. Son candidatos a ser
> absorbidos por el dominio o eliminados.

### Atrasos (Delay)

| Método | Tipo |
|--------|------|
| `getDozenDelay(dozen)` → number | Lectura |
| `getDozenMaxDelay(dozen)` → number | Lectura |
| `getColumnDelay(column)` → number | Lectura |
| `getColumnMaxDelay(column)` → number | Lectura |
| `getNumberDelay(numStr)` → number | Lectura |
| `getNumberMaxDelay(numStr)` → number | Lectura |

Usan cache dirty-flag recorriendo O(N) con 44 checks por giro. Migrar a un
DelayManager en el dominio cuando se consolide.

### Analytics

| Método | Delegación |
|--------|-----------|
| `getProbabilities()` → RouletteAnalytics |
| `getConfidenceIntervals()` → RouletteAnalytics |
| `getAlerts()` → RouletteAnalytics |
| `getStrategy()` → RouletteAnalytics |
| `getDistanceHistogram()` → RouletteAnalytics |
| `getWindowStats(windowSize)` → RouletteAnalytics |
| `runsTest(type)` → RouletteAnalytics |
| `getSeriesTrendData(...)` → RouletteAnalytics |
| `getAdvancedStats()` → RouletteAnalytics |

⚠️ `getStats()` y `getAdvancedStats()` existen tanto en RouletteTracker como en
RouletteAnalytics con implementaciones distintas. TrackerCompat delega a
RouletteAnalytics. Consumidores directos de RouletteTracker reciben una
implementación diferente (más simple). **Esto es una divergencia conocida.**

### Legacy Remanente

| Prop/Método | Tipo | Consumidor |
|------------|------|-----------|
| `get _freq` | computed | orionRenderer |
| `clearSession()` | método | orionRenderer |
| `winWinEngine` | propiedad | ataqueRenderer |
| `ready` | Promise | — (siempre resuelta) |
| `static getColor(num)` | static util | — (desde numberMeta) |

---

## Dead Code Identificado

| Método | Archivo | Estado |
|--------|---------|--------|
| `getStatsForSet(setName)` | labengine.js:43, motor_matematico_de_conjuntos.js:43 | No existe en ninguna clase, guard call siempre null |

---

## Reglas de Evolución

1. **No eliminar métodos** sin migrar todos los consumidores (verificar con
   `search_files`).
2. **No cambiar firma** de métodos públicos sin actualizar este documento y
   notificar a todos los consumidores conocidos.
3. **No añadir funcionalidad nueva** al dominio sin pasar por fase de diseño.
4. **Documentar divergencias** entre RouletteTracker y RouletteAnalytics antes
   de unificarlas.
5. **TrackerCompat** es la zona de amortiguación. Cuando un método de
   TrackerCompat se migre al dominio, actualizar este contrato.
