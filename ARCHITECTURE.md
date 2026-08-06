# Arquitectura — Roulette Tracker Pro (Orion)

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26  
> **Fase:** 4.4 — Engineering Documentation & Governance

---

## 1. Visión general

Roulette Tracker Pro es una aplicación de frontend SPA (Single-Page Application)
para el registro y análisis estadístico de giros de ruleta americana.
La aplicación corre enteramente en el navegador, sin backend.

### Stack tecnológico

| Capa        | Tecnología                       |
|-------------|----------------------------------|
| Lenguaje    | JavaScript (ES2022+)             |
| Build       | Vite 6.x                         |
| Testing     | Vitest 3.2.7                     |
| Persistencia| localStorage (historial), IndexedDB (spins, settings) |
| UI          | DOM nativo (sin frameworks)      |
| Empaquetado | `npm run build` → `dist/`        |

---

## 2. Arquitectura de capas

```
┌──────────────────────────────────────────────────────────────────┐
│                        UI Layer (DOM)                            │
│  main.js, controlador_de_la_vista_lab.js, renderers, overlays   │
│  Responsabilidad: Renderizar, capturar eventos de usuario        │
├──────────────────────────────────────────────────────────────────┤
│                    Engine Layer (Lógica analítica)               │
│  WinWinEngine, DAEngine, LogicEngine (Orion), Sesgo97Logic,     │
│  ChiAnalysisEngine, KellyManager, RouletteAnalytics             │
│  Responsabilidad: Análisis estadístico, estrategias, alertas     │
├──────────────────────────────────────────────────────────────────┤
│                    Domain Layer (Núcleo del negocio)             │
│  RouletteTracker (orquestador)                                   │
│  SpinManager | SessionManager | HistoryManager | SettingsManager │
│  DelayManager | TrackerState (estado único)                      │
│  Responsabilidad: modelo de dominio, reglas de negocio           │
├──────────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer (Persistencia)            │
│  rouletteSpinsStore, rouletteSettingsStore, tomadorStateStore    │
│  localStorage (historial), IndexedDB (spins, settings)           │
│  Responsabilidad: Persistencia, carga, hidratación               │
├──────────────────────────────────────────────────────────────────┤
│                    Core Layer (Infraestructura compartida)       │
│  Bootstrap, OrionKernel, ServiceContainer, EventBus              │
│  Responsabilidad: Inicialización, DI, ciclo de vida              │
└──────────────────────────────────────────────────────────────────┘
```

### Principios arquitectónicos

1. **Domain Layer es el centro** — Toda la lógica de negocio reside en `src/tracker/`.
   Los motores (engines) consumen el dominio, no al revés.
2. **Inyección de dependencias** — Bootstrap construye el grafo de objetos y lo registra
   en ServiceContainer. Ningún módulo instancia sus dependencias directamente.
3. **Estado único centralizado** — `TrackerState` es la única fuente de verdad.
   Managers mutan el estado vía referencia; no hay copias redundantes.
4. **Separación de responsabilidades** — Cada manager tiene exactamente un área de
   responsabilidad (spins, sesiones, historial, settings).
5. **Aislación de persistencia** — Los managers de dominio no saben de IndexedDB.
   La infraestructura (`rouletteSpinsStore`, `rouletteSettingsStore`) maneja la
   serialización. El Domain Tracker expone métodos `save()`/`load()` para orquestar.

---

## 3. Domain Tracker — Estructura interna

```
                    ┌─────────────────────────────┐
                    │      RouletteTracker        │  ← Orquestador
                    │  (coordinación + API pública)│
                    └──────────┬──────────────────┘
                               │ delega
           ┌───────────────────┼───────────────────────┐
           │                   │                       │
           ▼                   ▼                       ▼
   ┌──────────────┐  ┌────────────────┐  ┌────────────────────┐
   │  SpinManager │  │ SessionManager │  │  HistoryManager   │
   │  - addSpin   │  │  - start/stop  │  │  - addSession     │
   │  - deleteSpin│  │  - isActive    │  │  - removeSession  │
   │  - updateSpin│  │  - getSession  │  │  - save/load      │
   │  - getSpins  │  │  - increment   │  │  - clear          │
   └──────┬───────┘  └───────┬────────┘  └────────┬──────────┘
          │                  │                     │
          └──────────────────┼─────────────────────┘
                             │ mutan
                             ▼
                    ┌────────────────┐
                    │  TrackerState  │  ← Estado único
                    │  - spins[]     │
                    │  - session{}   │
                    │  - history[]   │
                    │  - settings{}  │
                    └────────────────┘
                                    ▲
                                    │
                          ┌─────────┴─────────┐
                          │  SettingsManager  │
                          │  - get/set/update │
                          │  - save/load      │
                          │  - merge/reset    │
                          └───────────────────┘
                    ┌─────────────────┐
                    │  DelayManager   │  ← Cómputo de atrasos
                    │  - cache dirty  │
                    │  - getNumberDelay│
                    │  - getDozenDelay │
                    └─────────────────┘
```

### Managers

| Manager          | Propiedad de          | Métodos clave                              |
|------------------|-----------------------|--------------------------------------------|
| `SpinManager`    | `state.spins`         | `addSpin`, `deleteSpin`, `updateSpin`, `getSpins`, `clearSpins` |
| `SessionManager` | `state.session`       | `start`, `stop`, `reset`, `isActive`, `getSession` |
| `HistoryManager` | `state.history`       | `addSession`, `removeSession`, `save`, `load`, `clear` |
| `SettingsManager`| `state.settings`      | `get`, `set`, `update`, `merge`, `save`, `load`, `reset` |
| `DelayManager`   | (cálculo puro)        | `getNumberDelay`, `getDozenDelay`, `getColumnDelay` |

---

## 4. Motor de análisis (RouletteAnalytics)

`RouletteAnalytics` es una **clase pura**: recibe `(spins, settings)` y produce
estadísticas. No tiene estado mutable propio más allá de caches internos (`_freq`,
`_chiDirty`).

### Capacidades analíticas

1. **Estadísticas básicas** — `getStats()` → porcentajes por color, paridad,
   rango, docenas, columnas.
2. **Probabilidades** — `getProbabilities()` → comparación actual vs. teórica.
3. **Alertas de ausencia** — `getAlerts()` → detecta números/categorías que no
   han salido en N tiradas (configurable por tipo).
4. **Estrategia** — `getStrategy()` → sugerencias basadas en alertas.
5. **Estadísticas avanzadas** — `getAdvancedStats()` → Chi-cuadrado, hot zone,
   distancias medias rojo/negro.
6. **Runs test** — `runsTest()` → test de rachas para detectar patrones.
7. **Intervalos de confianza** — `getConfidenceIntervals()` → Wilson CI.
8. **Ventana deslizante** — `getWindowStats(N)` → análisis de última N tiradas.
9. **Histograma de distancias** — `getDistanceHistogram()` → dealer signature.
10. **Series personalizadas** — `getSeriesTrendData()` → tracking por serie.

---

## 5. Flujo de inicialización (Bootstrap)

```
main.js
  │
  ▼
Bootstrap.init(container)
  │
  ├── TrackerState (estado vacío)
  ├── SpinManager(trackerState)
  ├── SessionManager(trackerState)
  ├── HistoryManager(trackerState)
  ├── SettingsManager(trackerState)
  ├── RouletteTracker(state, spinMgr, sessionMgr, historyMgr, settingsMgr)
  │   └── setDelayManager(DelayManager)
  │   └── setEventBus(EventBus)
  │   └── setAnalytics(RouletteAnalytics)
  │   └── initialize() → carga settings + history + spins desde stores
  │
  ├── Engines (cada uno recibe domainTracker)
  │   ├── WinWinEngine
  │   ├── DAEngine
  │   ├── LogicEngine (Orion) ← WinWinEngine
  │   ├── Sesgo97Logic
  │   ├── ChiAnalysisEngine
  │   └── KellyManager
  │
  └── Retorna { tracker, domainTracker, services, engines }
```

---

## 6. Decisiones arquitectónicas documentadas

Ver [docs/adr/](docs/adr/) para los Architecture Decision Records completos:

| ADR | Título                                      |
|-----|---------------------------------------------|
| 001 | Estado único centralizado (Single Source of Truth) |
| 002 | Managers con responsabilidad única           |
| 003 | Clase de análisis pura (sin efectos)        |
| 004 | Persistencia delegada a stores externos     |
| 005 | Inicialización con Bootstrap y ServiceContainer |
| 006 | Cache lazy con dirty flag en DelayManager   |

---

## 7. Estructura de directorios

```
lab_vito/
├── src/
│   ├── tracker/           ← Domain Layer
│   │   ├── RouletteTracker.js  (orquestador)
│   │   ├── TrackerState.js     (estado único)
│   │   ├── SpinManager.js      (giros)
│   │   ├── SessionManager.js   (sesiones)
│   │   ├── HistoryManager.js   (historial)
│   │   ├── SettingsManager.js  (configuración)
│   │   ├── DelayManager.js     (atrasos)
│   │   └── index.js            (barrel export)
│   ├── analytics/         ← Capa de análisis
│   │   └── RouletteAnalytics.js
│   ├── engines/           ← Motores de estrategia
│   │   ├── WinWin/
│   │   ├── DA/
│   │   ├── Orion/
│   │   ├── Sesgo97/
│   │   ├── Chi/
│   │   ├── Kelly/
│   │   ├── Lab/
│   │   ├── Tomador/
│   │   └── Ataque/
│   ├── core/              ← Infraestructura compartida
│   │   ├── Bootstrap.js
│   │   ├── OrionKernel.js
│   │   ├── ServiceContainer.js
│   │   └── EventBus.js
│   └── utils/             ← Utilidades
│       └── numberMeta.js
├── tests/
│   ├── unit/              ← Tests unitarios del dominio
│   ├── integration/       ← Tests de integración
│   └── regression/        ← Tests de regresión
├── reports/               ← Reportes de fases
├── docs/                  ← Documentación técnica
│   └── adr/               ← Architecture Decision Records
├── ARCHITECTURE.md        ← Este archivo
├── DOMAIN_MODEL.md        ← Modelo de dominio
├── PUBLIC_API.md          ← API pública
├── DEVELOPMENT_GUIDE.md   ← Guía de desarrollo
├── CONTRIBUTING.md        ← Guía de contribución
├── QUALITY_GATES.md       ← Gates de calidad
├── RELEASE_PROCESS.md     ← Proceso de release
├── ROADMAP.md             ← Roadmap técnico
├── TESTING_STRATEGY.md    ← Estrategia de testing
├── REGRESSION_SAFETY_GUIDE.md
├── INTEGRATION_TESTING_GUIDE.md
├── TEST_ARCHITECTURE.md
├── package.json
└── vite.config.js
```

---

## 8. Referencias

- [Domain Model](DOMAIN_MODEL.md)
- [Public API](PUBLIC_API.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)
- [Testing Strategy](TESTING_STRATEGY.md)
- [Architecture Decision Records](docs/adr/)
