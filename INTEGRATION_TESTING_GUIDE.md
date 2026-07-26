# INTEGRATION TESTING GUIDE

## Orion / Roulette Tracker — Fase 4.2

Guía para escribir y mantener tests de integración en el proyecto.

---

## Principios

1. **Clases reales.** Los managers del dominio (SpinManager, SessionManager, DelayManager, SettingsManager, HistoryManager, RouletteTracker) se prueban con instancias reales. No se mockean.
2. **Solo se mockea lo externo.** Dependencias fuera del dominio (IndexedDB/localStorage, stores, engines, renderers) se mockean con `vi.mock`.
3. **Estado fresco por test.** Cada `beforeEach` crea un `TrackerState` nuevo y un array de managers limpio.
4. **Lazy cache, no auto-invalidate.** `DelayManager` usa cache perezosa (dirty flag). `RouletteTracker.addSpin` NO invalida la cache de delays — solo `clearSession` e `invalidateDelays()` explícito lo hacen.
5. **Analytics es reactivo.** `RouletteAnalytics.getStats()` y `getAdvancedStats()` computan desde los giros actuales del SpinManager cada vez que se invocan.

---

## Estructura de archivos

```
tests/
├── integration/
│   ├── session-history.integration.test.js
│   ├── spin-analytics.integration.test.js
│   ├── tracker-delay.integration.test.js
│   ├── session-lifecycle.integration.test.js
│   ├── bootstrap.integration.test.js
│   └── settings-persistence.integration.test.js
├── unit/
│   ├── managers/
│   │   ├── DelayManager.test.js
│   │   └── SpinManager.test.js
│   └── utils/
│       └── numberMeta.test.js
├── helpers/
│   ├── assertions.js
│   ├── storage.mock.js
│   ├── vitest.setup.js
│   └── index.js
├── builders/
│   ├── tracker.js
│   └── index.js
├── fixtures/
│   ├── spins.js
│   └── index.js
├── mocks/
│   └── index.js
```

---

## Patrones comunes

### Crear un tracker de integración

```js
import { TrackerState } from '../../src/tracker/TrackerState.js';
import { SpinManager } from '../../src/tracker/SpinManager.js';
import { SessionManager } from '../../src/tracker/SessionManager.js';
import { HistoryManager } from '../../src/tracker/HistoryManager.js';
import { SettingsManager } from '../../src/tracker/SettingsManager.js';
import { DelayManager } from '../../src/tracker/DelayManager.js';
import { RouletteTracker } from '../../src/tracker/RouletteTracker.js';
import { createDefaultRouletteSettings } from '../../rouletteSettingsStore.js';
import { mockLocalStorage, restoreLocalStorage } from '../helpers/storage.mock.js';

let state;
let tracker;

beforeEach(() => {
  mockLocalStorage();
  state = new TrackerState();
  const sm = new SpinManager(state);
  const ss = new SessionManager(state);
  const hm = new HistoryManager(state);
  const stm = new SettingsManager(state);
  state.settings = createDefaultRouletteSettings();
  tracker = new RouletteTracker(state, sm, ss, hm, stm);
  const dm = new DelayManager(() => tracker.getSpins());
  tracker.setDelayManager(dm);
});

afterEach(() => {
  restoreLocalStorage();
});
```

### Mockear stores (para tests de Bootstrap)

```js
vi.mock('../../rouletteSettingsStore.js', () => ({
  rouletteSettingsStore: {
    load: vi.fn().mockResolvedValue({ settings: {}, source: 'empty' }),
    getSnapshot: vi.fn().mockReturnValue({}),
  },
  createDefaultRouletteSettings: vi.fn(() => ({ casinoName: '' })),
}));
```

### Mockear engines y renderers

```js
vi.mock('../../controlador_de_la_vista_lab.js', () => ({
  LabRenderer: function LabRendererMock() {
    return { init: () => {}, update: () => {} };
  },
}));

vi.mock('../../src/engines/WinWin/index.js', () => ({
  WinWinEngine: function WinWinMock() {
    return { initialize: () => {}, start: () => {}, stop: () => {} };
  },
}));
```

> **Importante:** NO uses `vi.fn()` dentro de las factories de `vi.mock`. El hoisting de Vitest impide que `vi` esté disponible en ese ámbito. Usa funciones planas o arrow functions.

---

## Comportamientos verificados en Fase 4.2

### 1. Session + History (`session-history.integration.test.js`)

- `startSession()` → crea sesión, la persiste en HistoryManager
- `endSession()` → cierra sesión con timestamp, totaliza giros
- Historial acumula sesiones completadas
- Secuencia: start → addSpin → end → start → addSpin (sesión nueva)

### 2. Spin + Analytics (`spin-analytics.integration.test.js`)

- `getStats()` retorna `colorsPct`, `dozensPct`, `columnsPct`, `parityPct`, `highLowPct`
  - dozen keys: `d1`, `d2`, `d3`
  - column keys: `c1`, `c2`, `c3`
  - highLow keys: `low`, `high`
- `getAdvancedStats()` retorna `chiSquare` (string, `.toFixed(2)`), `hotZone`, `meanDelays`
- `runsTest()` retorna `{ runs, n1, n2, muR, sigmaR, z, interpretation, n }`
  - Con < 20 datos: `z: null, interpretation: 'Mínimo...'`
- `getWindowStats()` retorna `{ windowSize, actual, chiSquare, chiDiagnosis, hotZone, top5 }`

### 3. Tracker + DelayManager (`tracker-delay.integration.test.js`)

- Sin giros: todos los delays = `0`
- Delay = número de giros desde la última aparición
- `addSpin()` NO invalida la cache de delays (cache perezosa)
- `invalidateDelays()` o `clearSession()` sí invalidan
- `getNumberDelay('X')` para números nunca vistos = total de giros actual

### 4. Ciclo de vida de sesión (`session-lifecycle.integration.test.js`)

- Sesiones múltiples acumulan giros correctamente
- `clearSession()` borra giros, resetea sesión y limpia delays
- Verificación de docenas y columnas entre sesiones

### 5. Bootstrap (`bootstrap.integration.test.js`)

- `Bootstrap.init(container)` crea `domainTracker` con todos los managers
- Registra stores, renderers y motores en el contenedor
- Engines se crean con instancia y `initialize` disponible

### 6. Settings + persistencia (`settings-persistence.integration.test.js`)

- `set(key, value)` guarda y recupera settings
- `get(key)` retorna valor específico
- `update(obj)` mergea shallow en el toplevel
- `merge(obj)` reemplaza keys toplevel (no deep merge)
- `reset()` revierte a default

---

## API de RouletteAnalytics

### `getStats() -> { colorsPct, dozensPct, columnsPct, parityPct, highLowPct }`

```js
colorsPct:  { red: 0.4, black: 0.4, green: 0.2 }   // fracción 0.0–1.0
dozensPct:  { d1: 0.4, d2: 0.4, d3: 0.2 }
columnsPct: { c1: 0.2, c2: 0.6, c3: 0.2 }
parityPct:  { even: 0.5, odd: 0.5 }
highLowPct: { low: 0.6, high: 0.4 }
```

### `getAdvancedStats() -> { chiSquare, hotZone, meanDelays }`

```js
chiSquare: "1.23"           // string (toFixed(2))
hotZone:   { center, sum, members }
meanDelays: { red: 3.2, black: 4.1 }
```

### `runsTest() -> { runs, n1, n2, muR, sigmaR, z, interpretation, n }`

```js
// Con suficientes datos:
{ runs: 6, n1: 5, n2: 5, muR: 6.0, sigmaR: 1.49, z: 0.0, interpretation: 'Aleatorio', n: 10 }

// Con < 20 datos:
{ runs: 0, n: 8, z: null, interpretation: 'Mínimo 20 tiradas no-cero' }
```

### `getWindowStats(size) -> { windowSize, actual, chiSquare, chiDiagnosis, hotZone, top5 }`

```js
{ windowSize: 10, actual: [...], chiSquare: "0.80", chiDiagnosis: 'Normal', hotZone: {...}, top5: [...] }
```

---

## Reglas de lint

- Lint se ejecuta solo sobre `tests/` (el árbol legacy `src/` no se evalúa).
- `max-warnings 0`: cero advertencias.
- Variables importadas y no usadas se consideran error.
- Los tests de integración deben importar solo lo que realmente usan.

---

## Referencia de colores de números

Basado en `src/utils/numberMeta.js`:

| Color | Números |
|-------|---------|
| Rojo | 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36 |
| Negro | 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35 |
| Verde | 0 |
