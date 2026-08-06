# ADR-001: Estado único centralizado (Single Source of Truth)

**Fecha:** 2026-07-26  
**Estado:** Aceptado  
**Contexto:** Fase 4.1 — Domain Test Foundation

## Decisión

Todo el estado del dominio Roulette Tracker reside en una única instancia de
`TrackerState`. Los managers reciben una referencia a este estado y operan
directamente sobre él, sin copias ni estados redundantes.

## Consecuencias

- **Positivas:** No hay riesgo de desincronización entre copias. Los tests pueden
  inspeccionar el estado directamente. El flujo de datos es predecible.
- **Negativas:** Los managers que retornan datos mutables (ej. `getSpins()`
  retorna referencia directa) permiten mutación externa inadvertida.
  Mitigación: `getHistory()` en `HistoryManager` retorna copia
  (`[...state.history]`).

## Alternativas consideradas

- **Redux/Store centralizado con reducers:** Descartado por sobreingeniería para
  el alcance del proyecto.
- **Estado distribuido (cada manager con su propio estado):** Descartado por
  riesgo de inconsistencias y tests más complejos.

---

# ADR-002: Managers con responsabilidad única

**Fecha:** 2026-07-26  
**Estado:** Aceptado  
**Contexto:** Fase 4.1 — Domain Test Foundation

## Decisión

Cada manager (`SpinManager`, `SessionManager`, `HistoryManager`, `SettingsManager`)
es responsable de exactamente una sección del estado. Ningún manager cruza
responsabilidades.

## Consecuencias

- **Positivas:** Fácil de testear (cada manager se prueba de forma aislada).
  Fácil de modificar (los cambios en un área no afectan otras).
- **Negativas:** La coordinación entre managers recae en `RouletteTracker`
  (ej. `addSpin()` llama a `spinManager.addSpin()` y luego
  `incrementSessionSpinCount()`). Esto es explícito, no automático.

## Alternativas consideradas

- **Manager monolítico:** Descartado — viola SRP, dificulta tests.
- **Eventos automáticos entre managers:** Posible en el futuro vía EventBus,
  pero no necesario todavía.

---

# ADR-003: Clase de análisis pura (sin efectos secundarios)

**Fecha:** 2026-07-26  
**Estado:** Aceptado  
**Contexto:** Fase 5.5.3 — Analítica como clase pura

## Decisión

`RouletteAnalytics` es una clase sin estado mutable de dominio. Recibe
`(spins, settings)` en el constructor y produce resultados. No persiste,
no emite eventos, no altera el estado del tracker.

## Consecuencias

- **Positivas:** Totalmente determinística. Fácil de testear (no requiere
  infraestructura). Puede ser recreada en cualquier momento con los mismos
  datos y produce los mismos resultados.
- **Negativas:** El consumidor debe refrescar manualmente (`analytics.refresh()`)
  tras cambios en los datos fuente.

## Alternativas consideradas

- **Analytics como métodos de RouletteTracker:** Descartado — acopla análisis
  al dominio, dificulta testear análisis sin todo el tracker.
- **Analytics como servicio con suscripción a eventos:** Posible evolución,
  no necesario en esta fase.

---

# ADR-004: Persistencia delegada a stores externos

**Fecha:** 2026-07-26  
**Estado:** Aceptado  
**Contexto:** Fase 5.2 — Gap Resolution

## Decisión

El dominio no sabe de IndexedDB, ni de localStorage. Los managers del dominio
operan solo sobre `TrackerState`. La persistencia es orquestada por
`RouletteTracker` que llama a stores externos (`rouletteSpinsStore`,
`rouletteSettingsStore`) para cargar/salvar.

## Consecuencias

- **Positivas:** Los managers se prueban sin infraestructura de persistencia.
  Se puede cambiar el backend de persistencia sin tocar el dominio.
- **Negativas:** El tracker expone múltiples métodos `saveX()`/`loadX()` —
  uno por área. Esto es intencional (cada área se persiste independientemente).

## Alternativas consideradas

- **Persistencia automática en cada mutación:** Descartado — efectos
  secundarios ocultos en setters. Dificulta tests y debugging.
- **Transaccional (todo o nada):** Descartado — cada store tiene su propia
  lógica de persistencia independiente.

---

# ADR-005: Inicialización con Bootstrap y ServiceContainer

**Fecha:** 2026-07-26  
**Estado:** Aceptado  
**Contexto:** Fase 3 — Refactor de inicialización

## Decisión

`Bootstrap.init(container)` construye todo el grafo de objetos (tracker,
managers, engines, renderers) y los registra en `ServiceContainer`.
Ningún módulo externo instancia dependencias directamente.

## Consecuencias

- **Positivas:** Punto único de inicialización. Fácil de mockear para tests
  de integración. Contenedor permite resolución controlada de dependencias.
- **Negativas:** Bootstrap es un punto de acoplamiento — cambio en firma de
  cualquier constructor requiere cambio en Bootstrap. Mitigación: Tests de
  integración validan que Bootstrap produce un grafo funcional.

## Alternativas consideradas

- **Inicialización dispersa en main.js:** Descartado — difícil de mantener,
  acopla inicialización a UI.
- **Inversión de control automática (DI framework):** Descartado — innecesario
  para el tamaño del proyecto.

---

# ADR-006: Cache lazy con dirty flag en DelayManager

**Fecha:** 2026-07-26  
**Estado:** Aceptado  
**Contexto:** Fase 3.4 — Extracción de DelayManager

## Decisión

`DelayManager` mantiene un cache interno con un flag `_delaysDirty`.
Los cálculos de atrasos se ejecutan solo en el primer acceso tras una
invalidación. `invalidateCache()` debe llamarse explícitamente tras mutar
spins.

## Consecuencias

- **Positivas:** O(1) en acceso a atrasos tras el primer cómputo. Recorrido
  único O(N × 44) para todos los números, docenas y columnas.
- **Negativas:** Cache puede quedar stale si se mutan spins sin invalidar.
  Esto es intencional (el consumidor es responsable de llamar a
  `invalidateCache()` tras `addSpin`, `deleteSpin`, `clearSpins`, etc.).

## Alternativas consideradas

- **Cálculo en cada acceso:** Descartado — O(N × 44) repetido, costoso en
  cada render.
- **Recomputación automática vía Proxy/observer:** Descartado — sobreingeniería,
  efectos secundarios ocultos.
