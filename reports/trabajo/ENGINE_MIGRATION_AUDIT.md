2026-08-02T16:58:33-04:00

ENGINE MIGRATION AUDIT — FASE 5.4
=================================

Alcance:
- Auditoría de motores, managers, adapters y consumidores relevantes del runtime.
- Criterio: demostrar si aún existían migraciones pendientes antes de tocar código.

Resultado resumido:
- FULLY_MIGRATED: 21
- PARTIALLY_MIGRATED: 0
- LEGACY_DEPENDENCY: 0
- DOMAIN_ONLY: 18
- UNKNOWN: 0

FULLY_MIGRATED
- ./src/engines/DA/DAEngine.js
- ./src/engines/Chi/ChiAnalysisEngine.js
- ./src/engines/Orion/LogicEngine.js
- ./src/engines/Sesgo97/Sesgo97Logic.js
- ./src/engines/Kelly/KellyManager.js
- ./src/engines/WinWin/WinWinEngine.js
- ./src/tracker/SpinManager.js
- ./src/tracker/DelayManager.js
- ./src/consensus/adapters/AtRepAdapter.js
- ./src/consensus/adapters/LabConAdapter.js
- ./src/consensus/adapters/LabCon1Adapter.js
- ./atRepEngine.js
- ./labCon1Engine.js
- ./labEngine.js
- ./orionRenderer.js
- ./ataqueRenderer.js
- ./atrasosRenderer.js
- ./stWinRenderer.js
- ./tomadorRenderer.js
- ./core/MotorEstadistica_daEngine.js
- ./src/engines/Tomador/TomadorEngine.js

DOMAIN_ONLY
- ./src/core/BaseEngine.js
- ./src/tracker/TrackerState.js
- ./src/tracker/SettingsManager.js
- ./src/tracker/HistoryManager.js
- ./src/tracker/SessionManager.js
- ./src/consensus/engine/ConsensusEngine.js
- ./src/engines/Ataque/AtaqueEngine.js
- ./src/engines/Lab/LabEngine.js
- ./src/engines/Tomador/TomadorEngine.js
- ./main.js
- ./src/viewmodels/atRepViewModel.js
- ./src/analytics/RouletteAnalytics.js
- ./controlador_de_la_vista_lab.js

Observaciones:
- Los accesos al runtime pasan por getSpins() y getSettings().
- El getter settings del Domain Tracker sigue existiendo como compatibilidad pública.
- No se detectó una dependencia legacy que justificara migración funcional en esta fase.
