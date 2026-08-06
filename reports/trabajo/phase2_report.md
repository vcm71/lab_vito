# Phase 2 Report — ORION Refactor: Ciclo de Vida y Registro de Motores

## Fecha
2026-07-23

## Resumen
Fase 2 completa el núcleo del sistema agregando ciclo de vida (initialize → start → stop → dispose), registro automático de motores (EngineRegistry) y reubicación de la creación de motores desde `main.js` a `Bootstrap.js`.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/core/EngineRegistry.js` | Añadido: `unregister(name)`, `has(name)`, `clear()`. Mantiene orden de inserción. |
| `src/core/ServiceContainer.js` | Añadido: `registerSingleton(name, factoryFn)`, `registerFactory(name, factoryFn)`, `registerInstance(name, instance)` como alias semántico de `register()`, `remove(name)` |
| `src/core/EventBus.js` | Añadido: `once(event, handler)` (auto-desuscripción tras primera emisión), `removeAll()` (reemplaza EventTarget) |
| `src/core/Bootstrap.js` | Ahora crea los 6 motores del sistema (WinWin, DA, Orion, Sesgo97, Chi, Kelly). Retorna `{ tracker, services, engines }`. No registra motores en EngineRegistry — solo los construye. |
| `src/core/OrionKernel.js` | Añadido: `initialize()`, `start()`, `stop()`, `dispose()`. `bootstrap()` ahora itera `result.engines` y los registra automáticamente en `engineRegistry`. |
| `main.js` | Eliminados imports de las 6 clases de motores. Construcción reemplazada por resolución desde `kernel.engineRegistry.get(...)`. El resto del archivo (DOM, eventos, renders, syncSettingsForm, readyState) no se modifica. |

## Archivos creados

| Ruta | Propósito |
|---|---|
| `src/core/BaseEngine.js` | Clase base abstracta con métodos async: `initialize()`, `start()`, `stop()`, `dispose()`. Propiedades: `name`, `initialized`, `started`. Sin lógica estadística. |

## Diagrama de flujo (después de Fase 2)

```
OrionKernel.bootstrap()
  ├── Crea ServiceContainer, EventBus, EngineRegistry
  ├── Bootstrap.init(container)
  │     ├── new RouletteTracker()
  │     ├── stores (settings, tomador)
  │     ├── LabRenderer()
  │     └── Engines (WinWin, DA, Orion, Sesgo97, Chi, Kelly)
  └── for each engine: engineRegistry.register(name, instance)

main.js DOMContentLoaded
  ├── kernel.bootstrap()
  ├── kernel.engineRegistry.get('winWin') → winWinEngine
  ├── kernel.engineRegistry.get('da')     → daEngine
  ├── … (orion, sesgo97, chi, kelly)
  └── (resto de inicialización: readyState, TomadorRenderer, eventos DOM)
```

## Simplificaciones aplicadas

1. **ServiceContainer**: `register()` ahora es alias de `registerInstance()` — compatibilidad total hacia atrás. Se añadieron los nuevos métodos como sugar semántico sin cambiar el comportamiento existente. **Justificación**: reduce acoplamiento al permitir inyección lazy (singletons y factories) sin que el consumidor sepa cómo se construye el servicio.

2. **EngineRegistry**: `getAll()` cambió a `Array.from(this._engines.values())` desde un spread implícito. **Justificación**: más explícito, misma semántica. Compatibilidad total.

3. **Bootstrap.js**: La creación de motores ya no está duplicada entre `main.js` y Bootstrap. **Justificación**: centraliza la inicialización y elimina dependencias directas de `main.js` a las clases de motores.

## Riesgos y mitigaciones

- **Riesgo**: `main.js` referencia `kernel` en el ámbito del closure de `DOMContentLoaded`. Si `kernel` no está disponible donde se necesita (e.g., en callbacks fuera del closure), fallará. **Mitigación**: todas las referencias están dentro del mismo `async () => {}`.
- **Riesgo**: Los motores existentes (`WinWinEngine`, `DAEngine`, etc.) no heredan de `BaseEngine`. **Mitigación**: Fase 2 no los modifica. La interfaz BaseEngine está lista para Fase 3.
- **Riesgo**: `KellyManager()` no recibe `tracker` en su constructor — se creaba sin argumentos en el original. Bootstrap lo replica exactamente. Sin cambio de comportamiento.

## Próximos pasos (Fase 3, no automática)
- Hacer que los motores existentes extiendan `BaseEngine`
- Mover `syncSettingsForm` y `readyState` a Bootstrap
- Extraer `updateUI()` a un orquestador separado
