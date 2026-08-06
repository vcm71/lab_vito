2026-08-02T16:58:33-04:00

ENGINE MIGRATION MATRIX — FASE 5.4
===================================

| Componente | Ubicación | Estado | Evidencia |
|---|---|---:|---|
| DAEngine | ./src/engines/DA/DAEngine.js | FULLY_MIGRATED | usa tracker.getSpins() y getSettings() |
| ChiAnalysisEngine | ./src/engines/Chi/ChiAnalysisEngine.js | FULLY_MIGRATED | usa tracker.getSpins() y getSettings() |
| LogicEngine (Orion) | ./src/engines/Orion/LogicEngine.js | FULLY_MIGRATED | usa tracker.getSpins() y getSettings() |
| Sesgo97Logic | ./src/engines/Sesgo97/Sesgo97Logic.js | FULLY_MIGRATED | usa tracker.getSpins() y getSettings() |
| KellyManager | ./src/engines/Kelly/KellyManager.js | FULLY_MIGRATED | usa tracker.getSpins() |
| WinWinEngine | ./src/engines/WinWin/WinWinEngine.js | FULLY_MIGRATED | usa getSpins() vía Domain Tracker en rescan |
| SpinManager | ./src/tracker/SpinManager.js | FULLY_MIGRATED | único dueño de spins en TrackerState |
| DelayManager | ./src/tracker/DelayManager.js | FULLY_MIGRATED | consume getSpins() |
| AtRepAdapter | ./src/consensus/adapters/AtRepAdapter.js | FULLY_MIGRATED | consume getSpins() |
| LabConAdapter | ./src/consensus/adapters/LabConAdapter.js | FULLY_MIGRATED | consume getSpins() |
| LabCon1Adapter | ./src/consensus/adapters/LabCon1Adapter.js | FULLY_MIGRATED | consume getSpins() |
| BaseEngine | ./src/core/BaseEngine.js | DOMAIN_ONLY | clase base sin lógica de dominio |
| TrackerState | ./src/tracker/TrackerState.js | DOMAIN_ONLY | contenedor de estado |
| SettingsManager | ./src/tracker/SettingsManager.js | DOMAIN_ONLY | persistencia/mutación de settings |
| HistoryManager | ./src/tracker/HistoryManager.js | DOMAIN_ONLY | persistencia/historial |
| SessionManager | ./src/tracker/SessionManager.js | DOMAIN_ONLY | ciclo de sesión |
| AtaqueEngine | ./src/engines/Ataque/AtaqueEngine.js | DOMAIN_ONLY | wrapper de render |
| LabEngine | ./src/engines/Lab/LabEngine.js | DOMAIN_ONLY | wrapper de renderer |
| TomadorEngine | ./src/engines/Tomador/TomadorEngine.js | DOMAIN_ONLY | wrapper de renderer |
| main.js | ./main.js | DOMAIN_ONLY | orquestación de UI |
| RouletteAnalytics | ./src/analytics/RouletteAnalytics.js | FULLY_MIGRATED | consume getSpins()/getSettings() |
| Controlador lab | ./controlador_de_la_vista_lab.js | DOMAIN_ONLY | consumidor UI |

Conclusión de la matriz:
- PARTIALLY_MIGRATED: 0
- LEGACY_DEPENDENCY: 0
- UNKNOWN: 0
