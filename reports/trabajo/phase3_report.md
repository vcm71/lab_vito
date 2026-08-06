# Fase 3 — Normalización de Motores

**Fecha:** 2026-07-24
**Estado:** ✅ COMPLETADO
**Build:** 70 módulos, 0 errores (363ms)

---

## Resumen

Todos los motores del sistema ORION han sido normalizados como wrappers de `BaseEngine`,
organizados en `src/engines/<Name>/` con estructura uniforme:

```
src/engines/<Name>/
├── <Name>Engine.js  → extends BaseEngine
├── <Name>Config.js   → { DEFAULT_CONFIG, getConfig() }
├── <Name>Store.js    → { <Name>Store (getState, setState, reset) }
├── <Name>Metadata.js → { id, name, version, description }
└── index.js          → re-export
```

## Motores normalizados (9)

| Motor   | Engine Class        | Archivo original               | Líneas | Registrado en Bootstrap |
|---------|---------------------|--------------------------------|--------|------------------------|
| DA      | `DAEngine`          | `daEngine.js` (re-export)      | 143    | ✅ |
| Chi     | `ChiAnalysisEngine` | `chiLogic.js` (re-export)      | 203    | ✅ |
| Kelly   | `KellyManager`      | `kellyManager.js` (re-export)  | 257    | ✅ |
| WinWin  | `WinWinEngine`      | `3_WinWin_*....js` (re-export) | 502    | ✅ |
| Sesgo97 | `Sesgo97Logic`      | `sesgo97Logic.js` (re-export)  | 239    | ✅ |
| Orion   | `LogicEngine`       | `ORION_logicEngine.js` (re-export) | 404 | ✅ |
| Ataque  | `AtaqueEngine`      | `ataqueRenderer.js` (ref)      | 30     | ❌ (main.js) |
| Tomador | `TomadorEngine`     | `tomadorRenderer.js` (ref)     | 38     | ❌ (main.js) |
| Lab     | `LabEngine`         | `controlador_*.js` (ref)       | 47     | ✅ (Bootstrap) |

> **Nota:** Ataque, Tomador y Lab son envoltorios estructurales. La lógica renderizadora real
> permanece en sus archivos originales (NO mover Renderers). Bootstrap crea `LabRenderer` directamente.

## Cambios realizados

### 1. Archivos originales en raíz → re-export
Los 6 archivos originales (`daEngine.js`, `chiLogic.js`, `kellyManager.js`,
`3_WinWin_Atrasos_CHI_Estrategias.js`, `sesgo97Logic.js`, `ORION_logicEngine.js`)
ahora son re-exports desde `src/engines/<Name>/index.js`, garantizando compatibilidad
hacia atrás con cualquier import existente.

### 2. Bootstrap (`src/core/Bootstrap.js`)
Los imports de motores apuntan ahora a `src/engines/<Name>/index.js` en lugar de
los archivos en raíz. La lógica de creación (constructores, parámetros) no cambió.

### 3. Nuevas carpetas de motor
Cada motor tiene su propio directorio con 5 archivos. Los motores "compuestos" (WinWin, Sesgo97, Orion)
mantienen toda su lógica algorítmica intacta — solo se añadió el `extends BaseEngine` y el ciclo
de vida (`initialize/start/stop/dispose`).

### 4. Archivos NO modificados
- `main.js` (solo init, nav, syncSettingsForm)
- `rouletteTracker.js`
- `rouletteSettingsStore.js`
- `atrasosRenderer.js`
- `controlador_de_la_vista_lab.js`
- `labEngine.js`
- Todos los renderers (permanecen en raíz)

## Verificación

- **Build:** `npm run build` → 70 módulos transformados, 0 errores, 363ms
- **Compatibilidad hacia atrás:** Todos los imports originales funcionan via re-export
- **Warnings:** Ninguno nuevo. El warning de chunk size (530.97 kB) es pre-existente.

## Estructura final de `src/engines/`

```
src/engines/
├── Ataque/     { AtaqueEngine, AtaqueConfig, AtaqueStore, AtaqueMetadata, index.js }
├── Chi/        { ChiAnalysisEngine, ChiConfig, ChiStore, ChiMetadata, index.js }
├── DA/         { DAEngine, DAConfig, DAStore, DAMetadata, index.js }
├── Kelly/      { KellyManager, KellyConfig, KellyStore, KellyMetadata, index.js }
├── Lab/        { LabEngine, LabConfig, LabStore, LabMetadata, index.js }
├── Orion/      { LogicEngine, OrionConfig, OrionStore, OrionMetadata, index.js }
├── Sesgo97/    { Sesgo97Logic, Sesgo97Config, Sesgo97Store, Sesgo97Metadata, index.js }
├── Tomador/    { TomadorEngine, TomadorConfig, TomadorStore, TomadorMetadata, index.js }
└── WinWin/     { WinWinEngine, WinWinConfig, WinWinStore, WinWinMetadata, index.js }
```
