# Auditoría de Arquitectura — Sistema ORION

**Fecha:** 2026-07-24
**Versión:** Fase 3 completa (Fase 3.5)
**Build:** 70 módulos, 0 errores (363ms)
**Total JS:** ~14,175 líneas · **HTML:** 458 líneas · **CSS:** 1,281 líneas

---

## 1. Arquitectura General

### Diagrama de Alto Nivel

```
index.html
  └─ main.js (2,568 líneas)
       ├─ kernel.bootstrap()
       │    └─ Bootstrap.init(container)
       │         ├─ RouletteTracker (+ stores)
       │         ├─ LabRenderer
       │         └─ 6 motores (WinWin, DA, Orion, Sesgo97, Chi, Kelly)
       │
       ├─ [renderers directos de raíz]
       │    ├─ tomadorRenderer.js   (2,160 líneas)
       │    ├─ atrasosRenderer.js   (835 líneas)
       │    ├─ orionRenderer.js     (583 líneas)
       │    ├─ ataqueRenderer.js    (560 líneas)
       │    ├─ seriesRenderer.js    (395 líneas)
       │    ├─ controladorLab.js    (367 líneas)
       │    ├─ sesgo97Renderer.js   (270 líneas)
       │    └─ chiRenderer.js       (207 líneas)
       │
       └─ stores (5)
```

### Núcleo (src/core/)

| Archivo | LOCs | Rol |
|---------|------|-----|
| `OrionKernel.js` | 111 | Ciclo de vida completo: bootstrap → initialize → start → stop → dispose |
| `Bootstrap.js` | 81 | Inicialización de servicios (DI container) |
| `ServiceContainer.js` | 101 | Contenedor DI con factory/singleton/instance |
| `EngineRegistry.js` | 61 | Registro central de motores (ordenado) |
| `EventBus.js` | 56 | Bus de eventos basado en EventTarget |
| `BaseEngine.js` | 59 | Clase base abstracta con ciclo de vida |

**Core total:** 469 líneas de infraestructura — módulos pequeños, cohesivos, cero dependencias externas entre sí.

El Kernel expone un lifecycle completo (`bootstrap() → initialize() → start() → stop() → dispose()`) pero **main.js solo llama a `bootstrap()`**. Los métodos `initialize()`, `start()`, `stop()` y `dispose()` del Kernel nunca se invocan — los engines se usan inmediatamente tras crearlos. **Lifecycle subutilizado.**

---

## 2. Inventario de Motores (src/engines/<Name>/)

| Motor | Archivo | LOCs | BaseEngine | Ciclo | Registrado en Bootstrap |
|-------|---------|------|------------|-------|------------------------|
| DA | `DAEngine.js` | 142 | ✅ | stubs | ✅ |
| Chi | `ChiAnalysisEngine.js` | ~120 | ✅ | stubs | ✅ |
| Kelly | `KellyManager.js` | ~80 | ✅ | stubs | ✅ |
| WinWin | `WinWinEngine.js` | 502 | ✅ | stubs + real `ready` promise | ✅ |
| Sesgo97 | `Sesgo97Logic.js` | 239 | ✅ | stubs | ✅ |
| Orion | `LogicEngine.js` | 404 | ✅ | stubs | ✅ |
| Ataque | `AtaqueEngine.js` | 18 | ✅ | stubs | ❌ |
| Tomador | `TomadorEngine.js` | 23 | ✅ | stubs | ❌ |
| Lab | `LabEngine.js` | 26 | ✅ | `initialize/start/stop/dispose` reales | ❌ |
| **Total** | | **~1,557** | | | 6/9 registrados |

### Hallazgos

- **6 motores pesados** (DA, Chi, Kelly, WinWin, Sesgo97, Orion) contienen algoritmos reales
- **3 wrappers livianos** (Ataque, Tomador, Lab) — su lógica vive en los renderers de raíz
- **WinWinEngine (502 líneas)** y **LogicEngine/Orion (404 líneas)** son los más grandes y complejos
- **Ataque/Tomador/Lab** NO se registran en Bootstrap/EngineRegistry — existen como wrappers pero no son accesibles vía el Kernel. Solo se usan en main.js mediante imports directos de renderers
- Los lifecycle stubs (`async initialize() {}`) son NO-OPs en 6/9 motores — solo LabEngine los implementa realmente

---

## 3. Renderers (archivos raíz)

| Archivo | LOCs | Rol | Importado desde |
|---------|------|-----|-----------------|
| `tomadorRenderer.js` | **2,160** | UI + lógica del Tomador (entrada manual) | main.js |
| `rouletteTracker.js` | 865 | Modelo principal (Tracker, números, rueda) | todos |
| `atrasosRenderer.js` | 835 | Tabla de atrasos + módulos | main.js |
| `orionRenderer.js` | 583 | Señales ORION + gráficos | main.js |
| `ataqueRenderer.js` | 560 | Tabla de estrategias de ataque | main.js, AtaqueEngine |
| `seriesRenderer.js` | 395 | Gráficos de series + DA | main.js |
| `controlador_de_la_vista_lab.js` | 367 | UI del laboratorio de conjuntos | main.js, LabEngine |
| `sesgo97Renderer.js` | 270 | UI de Sesgo97 | main.js |
| `chiRenderer.js` | 207 | UI de Chi-cuadrado | main.js |

**Total renderers:** ~6,242 líneas — **44% del código JS total**.

### Hallazgos

- **tomadorRenderer.js (2,160 líneas)** es el archivo más grande del proyecto, superando cualquier módulo individual. Contiene UI, templates HTML en strings, lógica de negocio y manejo de estado
- Todos los renderers importan directamente de `rouletteTracker.js` para acceder a constantes (RED_NUMBERS, AMERICAN_WHEEL_ORDER) — no hay una capa de abstracción
- Los renderers son **independientes entre sí** — no se importan mutuamente

---

## 4. Stores (archivos raíz)

| Archivo | LOCs | Persistencia |
|---------|------|-------------|
| `rouletteSettingsStore.js` | 225 | localStorage |
| `rouletteSpinsStore.js` | 131 | localStorage |
| `tomadorStateStore.js` | 181 | localStorage |
| `kellySettingsStore.js` | 111 | localStorage |
| `winwinHistoricalMaxesStore.js` | 109 | localStorage |

**Total stores:** 757 líneas. Todos implementan el mismo patrón: `load()`, `save()`, `refresh()`, `exportData()`, `importData()`.

### Hallazgos

- Alto acoplamiento: cada store es independiente pero todos usan `localStorage` directamente — no hay abstracción de almacenamiento
- No hay sincronización cross-store. Si dos stores dependen del mismo dato (p.ej., `settings.maxWindow` en settingsStore y su reflejo en otros stores), pueden desincronizarse
- `rouletteSettingsStore` y `tomadorStateStore` son los más activos, invocados en cada `updateUI()`

---

## 5. Mapa de Dependencias

```
                     main.js
                    /   |   \
                   /    |    \
         [renderers]   [kernel]   [Chart.js]
              |            |
          rouletteTracker.js   src/core/
              |               OrionKernel → ServiceContainer
              |                            → EventBus
              |                            → EngineRegistry
              |                            → Bootstrap → 6 engines
              |
          [stores × 5] → todas localStorage

                    [statsWorker.js]
                         │
                    monteCarloValidator.js
                         ├── rouletteTracker.js
                         ├── LogicEngine (re-export desde ORION_logicEngine.js)
                         └── WinWinEngine (re-export desde 3_WinWin_...js)
```

### Rutas de importación clave

- main.js importa de **renderers de raíz DIRECTAMENTE** + **kernel para engines**
- Bootstrap crea los 6 engines y los registra en container + engineRegistry
- main.js obtiene los engines vía `kernel.engineRegistry.get('...')`
- Los engines internos importan de `rouletteTracker.js` para constantes
- `statsWorker.js` es el único worker web, importa monteCarloValidator
- `monteCarloValidator.js` importa de los **archivos raíz originales** (re-exports), no de `src/engines/`

### Dualidad de acceso

main.js accede a los engines de dos formas distintas:
1. **Vía Kernel:** `kernel.engineRegistry.get('winWin')` — 6 engines (los pesados)
2. **Vía imports directos:** `renderAtrasosTab(tracker)` — de renderers raíz

Esto significa que los wrappers de Ataque/Tomador/Lab existen formalmente pero **no son el canal de acceso real** desde main.js. La app funciona porque los renderers se invocan directamente en las pestañas correspondientes.

---

## 6. Código Muerto y Archivos Huérfanos

| Archivo | LOCs | Estado | Evidencia |
|---------|------|--------|-----------|
| `labengine.js` | 117 | **DUPLICADO** | `labEngine.js` (214 líneas) es el real. `labengine.js` es copia antigua. Solo importado por `integrate_lab.js` (script Node, no app) |
| `motor_matematico_de_conjuntos.js` | ~100 | **MUERTO** | Solo referenciado en `integrate_lab.js` (script Node) |
| `strategyManager.js` | 73 | **MUERTO** | Sin imports desde ningún archivo de la app |
| `stress_test_orion.js` | ~50 | **TEST STANDALONE** | No parte del build |
| `integrate_lab.js` | ~200 | **SCRIPT NODE** | No se ejecuta en el navegador |
| `script_de_integracion.js` | ~200 | **SCRIPT NODE** | No se ejecuta en el navegador |
| `script_de_integracion_automatizada.js` | ~150 | **SCRIPT NODE** | No se ejecuta en el navegador |
| `node integrate_lab.js` | ~200 | **DUPLICADO** | Copia de `integrate_lab.js` |
| `src/main.js` | 10 | **BOILERPLATE VITE** | No vinculado desde index.html (apunta a `main.js` raíz) |
| `src/counter.js` | 23 | **BOILERPLATE VITE** | Solo importado por `src/main.js` |
| `labrenderer.js` | 1 | **RE-EXPORT HUÉRFANO** | Re-exporta LabRenderer pero no es importado por nada |

**Total código muerto estimado:** ~1,124 líneas (~7.9% del proyecto JS).

### Candidatos a revisión (posible código muerto)

- `src/engines/Ataque/AtaqueEngine.js` — existe pero no se usa vía kernel; main.js llama a `renderAtaqueTab()` directamente
- `src/engines/Tomador/TomadorEngine.js` — mismo caso; main.js crea `TomadorRenderer` directamente
- `src/engines/Lab/LabEngine.js` — mismo caso; main.js usa `labRenderer` directamente

---

## 7. Complejidad y Rendimiento

### Hotspots de complejidad

| Archivo | LOCs | Riesgo |
|---------|------|--------|
| `main.js` | 2,568 | **MUY ALTO** — punto único de entrada con toda la lógica de navegación, configuración, eventos, workers. Violación SRP |
| `tomadorRenderer.js` | 2,160 | **MUY ALTO** — UI + lógica + templates + estado. El archivo más grande |
| `rouletteTracker.js` | 865 | **MODERADO-ALTO** — modelo central, importado por casi todo |
| `WinWinEngine.js` | 502 | **MODERADO** — el engine más grande |
| `LogicEngine.js` (Orion) | 404 | **MODERADO** — contiene QuantUtils + análisis avanzado |

### Problemas de rendimiento identificados

1. **`updateUI()` en main.js (2,568 líneas)** — actualiza TODAS las pestañas en cada llamada, incluso las ocultas. No hay virtualización ni lazy rendering
2. **statsWorker.js** — Worker web para Monte Carlo, pero verifica constantemente `typeof window !== 'undefined'` con un escudo de compatibilidad. Cada postMessage crea un nuevo `id: Date.now()` para correlación
3. **Chart.js dual** — tanto `main.js` como `orionRenderer.js` importan Chart.js. El bundle final incluye Chart.js una sola vez (Vite lo resuelve), pero el patrón duplica la responsabilidad
4. **Stores sincrónicos con localStorage** — `rouletteSettingsStore.refresh()` espera I/O de disco en cada ciclo de UI
5. **Re-render completo** — cada cambio de pestaña dispara `updateUI()` que re-renderiza TODO. No hay diffing ni parches parciales

### Chunk size

El build produce un chunk de 530 kB para el JS principal. Vite advierte que supera 500 kB. Esto es normal para una SPA monolítica pero indica que no hay code-splitting por ruta/pestaña.

---

## 8. Recomendaciones

### Inmediatas (Fase 3.5)

1. **Limpiar código muerto** — eliminar o archivar los 8 archivos huérfanos (~1,124 líneas). Afecta legibilidad pero no funcionalidad
2. **Unificar acceso a engines** — decidir si main.js usa kernel.engineRegistry.get() O imports directos, no ambos. Recomendación: kernel.get() para los 9 engines
3. **LabRenderer desde container** — main.js línea 342 usa `labRenderer` como variable global/resuelta mágicamente. Resolverla vía `kernel.container.resolve('labRenderer')`

### Corto plazo

4. **Activar lifecycle del Kernel** — llamar `kernel.initialize()` y `kernel.start()` después de bootstrap. Los stubs no hacen nada hoy pero preparan el terreno para inicialización diferida
5. **Lazy rendering por pestaña** — `updateUI()` solo debería renderizar la pestaña activa. Las pestañas ocultas no necesitan re-render
6. **Registrar Ataque/Tomador/Lab en Bootstrap** — los 3 wrappers existen pero no están en el ciclo de vida. Integrarlos completa la normalización

### Mediano plazo

7. **Extraer controlador de main.js** — main.js a 2,568 líneas es insostenible. Separar navegación, configuración, bootstrap, workers en módulos independientes
8. **Desacoplar renderers de rouletteTracker.js** — crear un módulo de constantes compartido (`src/shared/constants.js`) para RED_NUMBERS, AMERICAN_WHEEL_ORDER, etc.
9. **Reducer/Store unificado** — los 5 stores individuales podrían unificarse en un store con slices, reduciendo I/O de localStorage
10. **Code-splitting por pestaña** — usar `import()` dinámico de Vite para cargar renderers bajo demanda (tomadorRenderer: 2,160 líneas, no necesita cargarse si la pestaña está oculta)

---

## Resumen de Métricas

| Métrica | Valor |
|---------|-------|
| Archivos JS totales (app) | ~55 |
| Líneas JS totales | ~14,175 |
| Archivos HTML | 1 (458 líneas) |
| Archivos CSS | 1 (1,281 líneas) |
| Motores normalizados | 9/9 |
| Motores registrados en Kernel | 6/9 |
| Stores | 5 |
| Renderers | 8 |
| Código muerto estimado | ~1,124 líneas (7.9%) |
| Archivos huérfanos | 10 |
| Build | 70 módulos, 0 errores, 367ms |
| Chunk principal | 530 kB |
