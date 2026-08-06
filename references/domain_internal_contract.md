# Contrato Interno del Dominio — RouletteTracker

**Versión:** 1.0 (Fase 3.2 — Domain Contracts)
**Fecha:** 2026-07-24
**Estado:** Auditoría completa. Contrato interno definido y documentado.

---

## 1. Responsabilidades por Componente

### 1.1 RouletteTracker (Orquestador)

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | Orquestar el dominio: coordinar managers y exponer API unificada. |
| **Responsabilidades secundarias** | — Inyección de metadatos (casino/dealer/table) en `addSpin`<br>— Gestión de CustomSeries (lógica de negocio que no está en SettingsManager)<br>— Construcción de HitMap/HitRanking<br>— Cálculo propio de `getStats()` y `getAdvancedStats()` (DUPLICADO con RouletteAnalytics) |
| **Posibles mezclas** | — Lógica de CustomSeries debería estar en un SeriesManager dedicado<br>— `getStats()` y `getAdvancedStats()` son análisis puro, deberían delegar a RouletteAnalytics en lugar de recalcular |
| **Riesgos arquitectónicos** | — Duplicidad de stats entre RouletteTracker y RouletteAnalytics (ver Sección 6)<br>— RouletteTracker expone `state` como propiedad pública (`this.state`), violando encapsulamiento |

### 1.2 SpinManager

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | CRUD de giros (spins) sobre `TrackerState.spins`. |
| **Responsabilidades secundarias** | — Normalización de números (`normalizeNumber`)<br>— Reindexación de IDs tras eliminación<br>— Validación contra `ROULETTE_NUMBERS` |
| **Posibles mezclas** | Ninguna detectable. SRP respetado. |
| **Riesgos arquitectónicos** | — `getSpins()` retorna referencia directa al array (mutable externamente)<br>— `getHistory()` en SpinManager es un alias de `getSpins()` con spread: confunde historial con giros |

### 1.3 SessionManager

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | Ciclo de vida de la sesión actual sobre `TrackerState.session`. |
| **Responsabilidades secundarias** | — Contador de giros (`spinCount`)<br>— EventBus preparado pero no implementado (`setEventBus` es stub) |
| **Posibles mezclas** | Ninguna. SRP respetado. |
| **Riesgos arquitectónicos** | — `spinCount` nunca se sincroniza automáticamente con `spins.length` (puede desincronizarse)<br>— No hay eventos de sesión emitidos (started/reset/ended) |

### 1.4 HistoryManager

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | Persistir y recuperar el historial de sesiones completadas en localStorage. |
| **Responsabilidades secundarias** | — CRUD sobre `TrackerState.history` |
| **Posibles mezclas** | Ninguna. SRP respetado. |
| **Riesgos arquitectónicos** | — `load()` y `save()` son async pero no hay validación de schema<br>— Persiste solo en localStorage (no IndexedDB), a diferencia del resto del dominio<br>— `getHistory()` retorna referencia directa |

### 1.5 SettingsManager

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | Persistencia y mutación de configuración (`TrackerState.settings`) vía IndexedDB. |
| **Responsabilidades secundarias** | — Creación de settings por defecto<br>— Merge profundo de objetos anidados |
| **Posibles mezclas** | Ninguna. SRP respetado. |
| **Riesgos arquitectónicos** | — `set()` y `update()` siempre persisten inmediatamente (sin batch)<br>— Dependencia directa de `rouletteSettingsStore` externo |

### 1.6 TrackerState

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | Contenedor de estado del dominio. Sin lógica de negocio. |
| **Responsabilidades secundarias** | Ninguna. |
| **Posibles mezclas** | Ninguna. SRP respetado estrictamente. |
| **Riesgos arquitectónicos** | — Todas las propiedades son públicas y mutables directamente |

### 1.7 RouletteAnalytics

| Atributo | Descripción |
|----------|-------------|
| **Responsabilidad principal** | Motor de análisis estadístico puro. Sin dependencias del dominio. |
| **Responsabilidades secundarias** | — No tiene |
| **Posibles mezclas** | — `getAlerts()` usa `this.settings` (acoplamiento a estructura de settings)<br>— Lee `customSeries` directamente de settings |
| **Riesgos arquitectónicos** | — `getStats()` y `getAdvancedStats()` duplican lógica de RouletteTracker.getStats/getAdvancedStats<br>— `NUM_META` duplicado: existe también en RouletteTracker.js |

---

## 2. Ownership del Dominio

### 2.1 Matriz de Ownership

| Tipo de Información | Owner (escritura) | Lectores | ¿Único Owner? |
|--------------------|-------------------|----------|---------------|
| **Spins** | SpinManager | RouletteTracker, TrackerCompat, RouletteAnalytics (copia), engines, renderers | **SÍ** — SpinManager es el único que muta `TrackerState.spins` |
| **History (sesiones)** | HistoryManager | RouletteTracker, renderers, testers | **SÍ** — HistoryManager es el único que muta `TrackerState.history` |
| **Session** | SessionManager | RouletteTracker, engines | **SÍ** — SessionManager es el único que muta `TrackerState.session` |
| **Settings** | SettingsManager | RouletteTracker, RouletteAnalytics (lectura), engines, renderers | **SÍ** — SettingsManager es el único que muta `TrackerState.settings` |
| **Stats básicos** | RouletteTracker + RouletteAnalytics (DUPLICADO) | KellyManager, TrackerCompat, TomadorRenderer, UI | **NO** — Dos implementaciones divergentes |
| **Stats avanzados** | RouletteTracker + RouletteAnalytics (DUPLICADO) | KellyManager, TrackerCompat | **NO** — Dos implementaciones divergentes |
| **Delay/Atrasos** | TrackerCompat (cache dirty) | labengine.js, motor_matematico_de_conjuntos.js, renderers | **IMPLÍCITO** — Sin manager dedicado en el dominio |
| **CustomSeries** | RouletteTracker (lógica directa) | SettingsManager (persistencia), RouletteAnalytics (lectura), renderers | **AMBIGUO** — La lógica de negocio está en RouletteTracker, la persistencia en SettingsManager |
| **Persistencia (spins)** | rouletteSpinsStore (externo) | RouletteTracker via saveSpins/loadSpins | **SÍ** — Punto único de persistencia |
| **Persistencia (settings)** | rouletteSettingsStore (externo) | SettingsManager | **SÍ** — Punto único de persistencia |

### 2.2 Problemas de Ownership Detectados

1. **Stats/AdvancedStats**: Ownership duplicado entre RouletteTracker y RouletteAnalytics. Cada uno implementa su propia versión con lógica similar pero no idéntica.
2. **CustomSeries**: Ownership ambiguo — la lógica de negocio (validación, búsqueda, toggle) está en RouletteTracker, pero los datos residen en settings gestionados por SettingsManager.
3. **Delay/Atrasos**: Ownership implícito en TrackerCompat. No hay un DelayManager en el dominio. Los únicos consumidores son `labengine.js` y `motor_matematico_de_conjuntos.js`, que además intentan llamar a `getStatsForSet()` que nunca existió.

---

## 3. Mapa de Dependencias

### 3.1 Diagrama de Dependencias

```
RouletteTracker (orquestador)
├── TrackerState (estado compartido)
├── SpinManager → TrackerState.spins
├── SessionManager → TrackerState.session
├── HistoryManager → TrackerState.history
├── SettingsManager → TrackerState.settings
│   └── rouletteSettingsStore (externo)
├── rouletteSpinsStore (externo, persistencia directa)
└── EventBus (opcional)

RouletteAnalytics (puro, recibe datos)
├── numberMeta.js (dependencia de import)
└── settings (recibido por constructor, no import)

TrackerCompat (capa de compatibilidad)
├── RouletteTracker (domainTracker)
├── RouletteAnalytics (analytics)
└── numberMeta.js (dependencia de import)
    └── getColor, getDozen, getColumn

Bootstrap (inicialización)
├── TrackerState
├── SpinManager
├── SessionManager
├── HistoryManager
├── SettingsManager
├── RouletteTracker (DomainTracker)
├── EventBus
├── rouletteSettingsStore
├── tomadorStateStore
└── Engines (WinWin, DA, Orion, Sesgo97, Chi, Kelly)

Engines (consumidores del dominio)
├── WinWinEngine → domainTracker
├── DAEngine → domainTracker
├── LogicEngine (Orion) → domainTracker + WinWinEngine
├── Sesgo97Logic → domainTracker
├── ChiAnalysisEngine → domainTracker
└── KellyManager → tracker (getStats, getAdvancedStats)
```

### 3.2 Análisis de Dependencias

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| **Permitidas** | ~20 | Managers → TrackerState, Engines → RouletteTracker, Bootstrap → todos |
| **Innecesarias** | 2 | `getHistory()` en SpinManager (es alias de getSpins con spread, confunde semántica) |
| **Acoplamientos fuertes** | 4 | — RouletteAnalytics conoce estructura interna de settings (customSeries)<br>— TrackerCompat conoce ambos: domainTracker y analytics<br>— SettingsManager importa rouletteSettingsStore directo<br>— RouletteTracker importa rouletteSpinsStore directo |
| **Ciclos potenciales** | 0 | Sin ciclos detectados. Flujo unidireccional: Bootstrap → Managers → TrackerState y Engines → RouletteTracker. |
| **Inversión futura** | 3 | — rouletteSpinsStore podría inyectarse en RouletteTracker<br>— rouletteSettingsStore podría inyectarse en SettingsManager<br>— EventBus podría ser obligatorio en lugar de opcional |

### 3.3 Flujo de Datos

```
[UI/main.js] → addSpin() → RouletteTracker → SpinManager → TrackerState.spins
                                                      ↓
                                            saveSpins() → rouletteSpinsStore (IndexedDB)

[UI/main.js] → updateSettings() → RouletteTracker → SettingsManager → TrackerState.settings
                                                      ↓
                                            save() → rouletteSettingsStore (IndexedDB)

[Engine] → getSpins() + getSettings() → RouletteTracker → devuelve datos en vivo
[Engine] → getStats()/getAdvancedStats() → RouletteTracker → cálculo inline (o RouletteAnalytics vía TrackerCompat)

[Renderer] → domainTracker.getX() → datos
[Renderer] → tracker.getX() → TrackerCompat → domainTracker.getX() o analytics.getX()
```

---

## 4. Invariantes del Dominio

### 4.1 Invariantes Protegidas por Código

| Invariante | Dónde se Protege | Tipo |
|-----------|-----------------|------|
| **Spin number** debe ser un número válido de ruleta americana (0-36, 00) | SpinManager.addSpin() valida vs ROULETTE_NUMBERS | Validación explícita |
| **Spin ID** debe ser 1-based secuencial | SpinManager.deleteSpin() reindexa IDs | Post-condición |
| **Spin update** debe ser número válido | SpinManager.updateSpin() valida vs ROULETTE_NUMBERS | Validación explícita |
| **Normalización** de números (trim, split por '.', ',', '90'→'00') | SpinManager.normalizeNumber() | Pre-condición |
| **Session** solo puede estar activa o inactiva | SessionManager.start()/stop()/reset() | Máquina de estados |
| **Settings defaults** siempre disponibles | SettingsManager.load() / reset() / getDefault() | Fallback |

### 4.2 Invariantes Dependientes de Convenciones

| Invariante | Riesgo |
|-----------|--------|
| **Session.spinCount == spins.length** | No hay sincronización automática. `incrementSessionSpinCount()` debe llamarse explícitamente tras cada `addSpin`. |
| **History persistence schema** | `load()` no valida que el JSON de localStorage tenga la estructura esperada. |
| **Settings structure** | RouletteAnalytics.getAlerts() asume que existen `colorAlert`, `parityAlert`, etc. Si faltan, usa undefined en comparación `>=`. |
| **CustomSeries.active** | RouletteTracker.toggleSeries() asume que `active` es booleano o ausente. |
| **EventBus opcional** | Si no se vincula EventBus, no hay notificaciones de cambios. Los engines y renderers operan sobre datos en vivo sin saber si cambiaron. |
| **TrackerCompat.settings** | Se copia sincrónicamente en constructor y en `updateSettings()`. Puede quedar desactualizado si alguien muta settings directamente. |

### 4.3 Invariantes No Protegidas

| Invariante | Contexto |
|-----------|----------|
| **Una sola sesión activa a la vez** | `startSession()` no verifica si ya hay una activa; la reinicia silenciosamente. |
| **Spins no vacíos al cerrar sesión** | `recordAndClearSession()` funciona incluso si no hay spins (retorna `saved: false`). |
| **Consistencia entre TrackerCompat y RouletteTracker** | TrackerCompat mantiene su propio cache de delays. No se invalida automáticamente cuando cambian los spins. |

---

## 5. Delegaciones

### 5.1 Clasificación de las 18 Delegaciones de RouletteTracker

| Método | Delega a | Clasificación | Justificación |
|--------|---------|---------------|---------------|
| `addSpin` | SpinManager | ✅ Correcta | SRP claro |
| `removeLastSpin` | SpinManager | ✅ Correcta | SRP claro |
| `deleteSpin` | SpinManager | ✅ Correcta | SRP claro |
| `updateSpin` | SpinManager | ✅ Correcta | SRP claro |
| `clearSpins` | SpinManager | ✅ Correcta | SRP claro |
| `getSpins` | SpinManager | ✅ Correcta | SRP claro |
| `getLastSpin` | SpinManager | ✅ Correcta | SRP claro |
| `getLastNumber` | SpinManager | ✅ Correcta | SRP claro |
| `count` | SpinManager | ✅ Correcta | SRP claro |
| `isEmpty` | SpinManager | ✅ Correcta | SRP claro |
| `startSession` | SessionManager | ✅ Correcta | SRP claro |
| `resetSession` | SessionManager | ✅ Correcta | SRP claro |
| `stopSession` | SessionManager | ✅ Correcta | SRP claro |
| `isSessionActive` | SessionManager | ✅ Correcta | SRP claro |
| `getSession` | SessionManager | ✅ Correcta | SRP claro |
| `incrementSessionSpinCount` | SessionManager | ✅ Correcta | SRP claro |
| `getSessionSpinCount` | SessionManager | ✅ Correcta | SRP claro |
| `getSessionStartedAt` | SessionManager | ✅ Correcta | SRP claro |

**Resultado:** Las 18 delegaciones son correctas. No hay delegaciones innecesarias.

### 5.2 Delegaciones Futuras (Candidatas)

| Método Actual | Propuesto para | Razón |
|--------------|---------------|-------|
| `getHitMap`, `getHitRanking` | HitMapManager (nuevo) | Lógica de agregación que no es CRUD de spins |
| `addOrUpdateSeries`, `toggleSeries`, `deleteSeries` | SeriesManager (nuevo) | Lógica de negocio específica de series |
| `recordAndClearSession` | SessionManager | Operación compuesta de sesión |
| `getStats`, `getAdvancedStats` | RouletteAnalytics | Eliminar duplicidad |

---

## 6. Duplicidades: getStats() y getAdvancedStats()

### 6.1 Análisis Comparativo

#### getStats()

| Aspecto | RouletteTracker.getStats() | RouletteAnalytics.getStats() |
|---------|---------------------------|------------------------------|
| Fuente de datos | `getHitMap()` (itera Object.entries) | `this._freq` (preconstruido en constructor/refresh) |
| Precisión porcentajes | `toFixed(0)` → strings | `toFixed(1)` con `+` → numbers |
| Cálculo | Cada llamada recalcula | Cacheado en `this._freq`, recalcula en cada llamada igualmente |
| Rendimiento | O(38) siempre (itera hitMap) | O(38) siempre (itera _freq) |
| 0/00 distinción | Usa número literal en `Object.entries` | Misma distinción vía `NUM_META` |

#### getAdvancedStats()

| Aspecto | RouletteTracker.getAdvancedStats() | RouletteAnalytics.getAdvancedStats() |
|---------|-------------------------------------|---------------------------------------|
| Chi-cuadrado | Calcula desde `hitMap` (reconstruye cada vez) | Lazy: `_getChi()` con dirty flag |
| Hot zone | Usa `hitMap[num] || 0` | Usa `this._freq[num]` |
| meanDelays | Solo rojo y negro | Solo rojo y negro |
| Cache | Sin cache (recalcula cada llamada) | Caché lazy para chi (dirty flag) |

### 6.2 Recomendaciones

1. **RouletteAnalytics** debe ser la fuente única de verdad para **todos** los análisis estadísticos.
2. **RouletteTracker.getStats()** y **RouletteTracker.getAdvancedStats()** deben eliminarse (o delegar a RouletteAnalytics) en una fase futura.
3. La divergencia de precisión (strings vs numbers) debe resolverse: el dominio debe retornar números en un formato consistente.
4. El caché lazy de chi-cuadrado de RouletteAnalytics es superior y debería preservarse.

---

## 7. Dead Code: getStatsForSet()

### 7.1 Investigación Completa

| Aspecto | Hallazgo |
|---------|----------|
| **Dónde se invoca** | `labengine.js:43-44`, `motor_matematico_de_conjuntos.js:43` |
| **Forma de invocación** | Guard call: `typeof this.tracker.getStatsForSet === 'function'` (labengine) / `this.tracker.getStatsForSet ?` (motor_matematico) |
| **¿Alguna vez existió?** | No hay evidencia en el código actual. Probablemente existió en el Legacy tracker original (rouletteTracker.js, ya eliminado) que tenía `delays` y `maxDelays` como propiedades. |
| **Comportamiento actual** | La guard siempre resulta en `null`, y el código cae al fallback `this.tracker.delays?.[setName]` que también es undefined porque RouletteTracker no tiene `delays`. |
| **¿Bug?** | **Sí, latente.** `calcularPesoRetraso(setName)` siempre produce peso 0 porque `actual` y `max` caen a 0/1 por defecto. Esto significa que el cálculo de estrés en motores de conjuntos (labengine, motor_matematico) no funciona desde que se eliminó el Legacy. |
| **¿Dead code?** | No exactamente. El método `calcularPesoRetraso` se ejecuta, pero su resultado siempre es 0 porque el dato de atraso no está disponible. La referencia a `getStatsForSet` es código zombi: se ejecuta pero no produce el efecto deseado. |
| **Acción recomendada** | Implementar un `DelayManager` en el dominio con la API `getStatsForSet(setName)` o migrar los consumidores a usar `TrackerCompat.getDozenDelay/getColumnDelay/getNumberDelay` directamente. |

### 7.2 Consumers del Código Zombi

```
labengine.js:44   → calcularPesoRetraso(setName) → siempre 0 (bug latente)
motor_matematico_de_conjuntos.js:43 → idéntico
```

Ambos motores se ejecutan pero su salida de estrés es siempre cero — afecta a lógica de apuestas basada en atrasos de conjuntos.

---

## 8. Riesgos Arquitectónicos Identificados

| ID | Riesgo | Severidad | Componente |
|----|--------|-----------|------------|
| R1 | `getStats()` y `getAdvancedStats()` duplicados (RouletteTracker vs RouletteAnalytics) | **ALTA** | RouletteTracker + RouletteAnalytics |
| R2 | `NUM_META` duplicado en RouletteTracker.js y RouletteAnalytics.js | **MEDIA** | RouletteTracker + RouletteAnalytics |
| R3 | `getStats()` retorna strings (toFixed), RouletteAnalytics retorna numbers | **ALTA** | Contrato inconsistente |
| R4 | `this.state` expuesto como propiedad pública en RouletteTracker | **MEDIA** | RouletteTracker |
| R5 | `calcularPesoRetraso` en motores de conjuntos siempre produce 0 (bug latente) | **ALTA** | labengine, motor_matematico |
| R6 | Session.spinCount puede desincronizarse de spins.length | **MEDIA** | SessionManager |
| R7 | TrackerCompat tiene cache de delays propio sin invalidación automática | **MEDIA** | TrackerCompat |
| R8 | RouletteAnalytics.getAlerts() conoce estructura interna de settings | **BAJA** | RouletteAnalytics |
| R9 | HistoryManager persiste en localStorage, no IndexedDB (inconsistencia) | **BAJA** | HistoryManager |
| R10 | EventBus opcional: sin notificaciones, los consumidores no saben de cambios | **BAJA** | RouletteTracker |
| R11 | `getHistory()` en SpinManager es alias semánticamente incorrecto | **BAJA** | SpinManager |
| R12 | CustomSeries sin manager dedicado (lógica en RouletteTracker) | **MEDIA** | RouletteTracker |

---

## 9. Clasificación de Incidencias por Prioridad

### Críticas
| ID | Descripción |
|----|-------------|
| R5 | **Bug latente**: `calcularPesoRetraso` en labengine y motor_matematico_de_conjuntos produce peso 0 desde la eliminación del Legacy. Afecta lógica de apuestas basada en atrasos de conjuntos. |

### Altas
| ID | Descripción |
|----|-------------|
| R1 | Duplicidad de stats entre RouletteTracker y RouletteAnalytics (riesgo de divergencia futura) |
| R3 | Inconsistencia de tipos (string vs number) entre implementaciones de getStats |
| R6 | Session.spinCount puede desincronizarse |

### Medias
| ID | Descripción |
|----|-------------|
| R2 | NUM_META duplicado (riesgo de divergencia en metadatos de números) |
| R4 | TrackerState expuesto como público vía `this.state` |
| R7 | Cache de delays sin invalidación automática |
| R12 | CustomSeries sin manager dedicado |

### Bajas
| ID | Descripción |
|----|-------------|
| R8 | RouletteAnalytics conoce estructura de settings |
| R9 | HistoryManager persiste en localStorage vs IndexedDB del resto |
| R10 | EventBus opcional |
| R11 | SpinManager.getHistory() alias semánticamente incorrecto |

### Informativas
| ID | Descripción |
|----|-------------|
| — | Considerar migrar RouletteTracker a recibir rouletteSpinsStore por inyección |
| — | Considerar migrar SettingsManager a recibir rouletteSettingsStore por inyección |
| — | Evaluar si EventBus debe ser obligatorio en el constructor |
| — | Evaluar unificación de persistencia (todo a IndexedDB o todo a localStorage) |
