# Transición de Arquitectura Final

**Proyecto:** Roulette Tracker (Orion)
**Fecha:** 2026-07-24
**Fase completada:** 3.5 — Eliminación de TrackerCompat

---

## Estado final de la arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     main.js                                  │
│  Crea instancias de dominio y las inyecta en renderers       │
└──────┬──────────┬──────────────┬────────────────┬───────────┘
       │          │              │                │
       ▼          ▼              ▼                ▼
  ┌────────┐ ┌─────────┐ ┌──────────────┐ ┌──────────────────┐
  │Domain  │ │Roulette │ │Roulette      │ │Interfaz de       │
  │Tracker │ │Analytics│ │State (Store) │ │Usuario (UI)      │
  │        │ │         │ │              │ │                  │
  │ Spin   │ │ Stats   │ │ IndexedDB    │ │ TomadorRenderer  │
  │ Session│ │ Prob    │ │ Persistencia │ │ OrionRenderer    │
  │ History│ │ Alerts  │ │              │ │ AtaqueRenderer   │
  │ Settings│ │ Window  │ │              │ │ AtrasosRenderer  │
  │ Delays │ │ Distance│ │              │ │ Wheel/WinWinTab  │
  └────────┘ └─────────┘ └──────────────┘ └──────────────────┘
       │
       ▼
  ┌──────────────┐
  │  DelayManager │ ← Fase 3.4 — Caché de atrasos
  │               │
  │ getDozenDelay │
  │ getColumnDelay│
  │ getNumberDelay│
  └──────────────┘
```

## Capas eliminadas

| Capa | Fase | Razón |
|---|---|---|
| `Legacy tracker` (old `RouletteTracker.js` en raíz) | 3.0-3.2 | Código heredado no mantenible |
| `TrackerCompat` (wrapper) | 3.5 | Ya no necesario: todos los métodos migrados al dominio |

## Métodos añadidos a RouletteTracker durante Fase 3.5

- `get settings()` — getter de compatibilidad
- `get _freq()` — getter de frecuencia (compatibilidad con orionRenderer)
- `getDozenDelay(dozen)`, `getDozenMaxDelay(dozen)`
- `getColumnDelay(column)`, `getColumnMaxDelay(column)`
- `getNumberDelay(num)`, `getNumberMaxDelay(num)`
- `invalidateDelays()`
- `clearSession()`
- `setDelayManager(delayManager)`
- Constructor acepta `delayManager` como 6º parámetro

## Inyección de dependencias (Bootstrap)

```
Bootstrap.js:
  1. Crea TrackerState, SpinManager, SessionManager, etc.
  2. Crea DomainTracker (RouletteTracker)
  3. Crea DelayManager(getSpinsCallback)
  4. domainTracker.setDelayManager(delayManager)
  5. Crea WinWinEngine, OrionEngine, KellyManager
  6. Exporta kernel con engines y domainTracker

main.js:
  1. Importa domainTracker desde kernel
  2. Crea RouletteAnalytics(domainTracker.getSpins())
  3. Pasa domainTracker directamente a renderers
  4. Pasa RouletteAnalytics directamente para stats
```

## Consumidores de RouletteTracker (post-Fase 3.5)

| Consumidor | Métodos usados | Rol |
|---|---|---|
| `main.js` | getSpins, addSpin, clearSession, invalidateDelays, settings | Orquestación |
| `TomadorRenderer` | getSpins, getDozenDelay, getColumnDelay, getNumberDelay, getDozenMaxDelay, getColumnMaxDelay, getNumberMaxDelay, settings, deleteSpin, updateSpin, updateSettings | Interfaz de entrada |
| `OrionRenderer` | getSpins, _freq, clearSession, addSpin | Visualización ORION |
| `AtaqueRenderer` | getSpins | Tabla de ataque |
| `AtrasosRenderer` | getSpins | Tabla de atrasos |
| `WinWinEngine` | getSpins, settings | Motor Win-Win |
| `RouletteAnalytics` | getSpins, getSettings | Análisis estadístico |
| `DelayManager` | getSpins (callback) | Caché de atrasos |
| `SessionManager` | load, save, clear | Gestión de sesiones |
| `HistoryManager` | load, save, addEntry | Historial de sesiones |
