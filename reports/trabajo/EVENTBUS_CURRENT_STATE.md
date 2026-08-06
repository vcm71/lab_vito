2026-08-02T15:48:41-04:00
# EVENTBUS_CURRENT_STATE

## Estado actual
El EventBus existe como infraestructura activa de bajo nivel, pero el dominio aún no publica emisiones propias.

## Implementación
Ubicación: `src/core/EventBus.js`

Capacidades actuales:
- `on(event, handler)`
- `once(event, handler)`
- `off(event, handler)`
- `emit(event, detail)`
- `removeAll()`

## Wiring observado
- `src/core/Bootstrap.js:65-69` inyecta `eventBus` en `domainTracker`
- `src/core/Bootstrap.js:82-110` registra listeners `update` para renderers
- `tests/integration/bootstrap.integration.test.js` verifica esa inyección y el cableado de listeners

## Eventos observados
- `update` es el evento visible en el wiring actual
- no se observan emisiones de dominio desde `RouletteTracker`
- no se observan emisiones desde `SpinManager`, `SessionManager` o `HistoryManager`

## Listeners observados
- `LabRenderer.update()`
- `LabCon1Renderer.update()`
- `AtRepRenderer.update()`

## Payloads
- El bus acepta `detail` arbitrario en `emit()`
- El contrato actual usa `CustomEvent` y entrega `event.detail` al listener

## Clasificación contractual
- Infraestructura: activa
- Emisión de dominio: ausente / no adoptada todavía
- Integración UI: presente en Bootstrap
- Arquitectura futura: pendiente de decisión en fase posterior

## Relación con fase futura
- La fase actual congela el bus como soporte de sincronización
- No debe interpretarse como autorización para construir una nueva arquitectura de eventos completa
- El uso futuro debe decidir si los managers publican `update` u otra semántica

## Riesgo residual
- El bus existe, pero sin un protocolo de emisión del dominio puede seguir funcionando solo como capa de cableado
- Cualquier migración futura debe preservar el cableado actual de renderers hasta que exista sustituto validado
