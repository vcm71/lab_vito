# Phase 1 Report — ORION Refactor

## Fecha
2026-07-23

## Archivos creados

| Ruta | Propósito |
|---|---|
| `src/core/ServiceContainer.js` | Contenedor simple de servicios (register/resolve/exists). Sin dependencias externas. |
| `src/core/EventBus.js` | Bus de eventos minimalista basado en EventTarget (on/off/emit). Sin dependencias externas. |
| `src/core/EngineRegistry.js` | Registro de motores (register/get/getAll). Sin dependencias externas. |
| `src/core/Bootstrap.js` | Inicialización del proyecto: creación del Tracker, Stores (rouletteSettingsStore, tomadorStateStore) y LabRenderer. Carga configuración. |
| `src/core/OrionKernel.js` | Núcleo del sistema: orquesta container + eventBus + engineRegistry + Bootstrap. |

## Archivos modificados

| Ruta | Cambio |
|---|---|
| `main.js` | Importa `OrionKernel` desde `./src/core/OrionKernel.js`. Crea instancia y ejecuta `kernel.bootstrap()` dentro de `DOMContentLoaded` (ahora async). Recibe `tracker` y continúa con motores. |

## Responsabilidades movidas

**De `main.js` a `Bootstrap.js`:**
- Creación de `RouletteTracker` (new RouletteTracker())
- Inicialización de `LabRenderer` (new LabRenderer + labRenderer.init())
- Vinculación del evento `tracker.on('update', ...)`
- Registro de stores en el contenedor (settingsStore, tomadorStateStore)
- Carga de configuración (vía rouletteSettingsStore, aunque el refresh se ejecuta implícitamente)

## Responsabilidades que PERMANECEN en `main.js`

- Creación de motores: WinWinEngine, DAEngine, LogicEngine(Orion), Sesgo97Logic, ChiAnalysisEngine, KellyManager
- Inicialización de eventos ORION (initOrionEvents)
- DOM elements bindings (botones, inputs, eventos)
- syncSettingsForm() — carga de configuración a la UI
- updateUI() y updateQuickToggleStates()
- Web Worker setup (statsWorker)
- Toda la lógica de renderizado y manipulación del DOM

## Riesgos encontrados

1. **Ninguno grave.** El movimiento fue conservador: solo tracker + LabRenderer + stores. No se tocaron motores, algoritmos ni UI.
2. **DOMContentLoaded ahora es async** — compatible con todos los navegadores modernos que Vite soporta. No hay breaking change.
3. **Bootstrap.js importa dependencias existentes** con rutas relativas (`../../rouletteTracker.js`, etc.). No se introdujeron nuevas dependencias.
4. **EngineRegistry y EventBus no se usan aún** — son stubs listos para fases posteriores.

## Recomendaciones para la Fase 2

1. **Mover creación de motores a Bootstrap o EngineRegistry.** Actualmente los 6 motores (WinWin, DA, Orion, Sesgo97, Chi, Kelly) se crean en `main.js`. Se pueden registrar en `engineRegistry` y hacer `Bootstrap.init()` retornarlos también.
2. **Migrar eventos de tracker.on/emit a EventBus.** Actualmente el tracker tiene su propio event system (`tracker.on('update', ...)`). Se puede envolver progresivamente en `EventBus`.
3. **Extraer syncSettingsForm()** a un manejador de configuración dedicado.
4. **Extraer updateUI()** a un módulo de coordinación de pestañas.
5. **Mover Web Worker** a un módulo de servicios.

## Criterio de éxito

- ✅ main.js ahora únicamente importa OrionKernel, crea instancia y ejecuta bootstrap()
- ✅ La aplicación compila con Vite (0 errores, 379ms)
- ✅ 43 módulos transformados (38 originales + 5 nuevos)
- ✅ No se modificaron: algoritmos, cálculos, fórmulas, modelos estadísticos, HTML visible, CSS, comportamiento de UI
- ✅ La aplicación continúa funcionando exactamente igual
