2026-08-02T16:58:33-04:00

ENGINE DEPENDENCY GRAPH — FASE 5.4
===================================

Domain Tracker
- TrackerState
  - spins
  - settings
  - history
  - session

Managers
- SpinManager -> TrackerState.spins
- SettingsManager -> TrackerState.settings
- HistoryManager -> TrackerState.history
- SessionManager -> TrackerState.session
- DelayManager -> spins del Domain Tracker

Motores y consumidores
- DAEngine -> getSpins() / getSettings()
- ChiAnalysisEngine -> getSpins() / getSettings()
- LogicEngine (Orion) -> getSpins() / getSettings()
- Sesgo97Logic -> getSpins() / getSettings()
- KellyManager -> getSpins()
- WinWinEngine -> getSpins() / getSettings()
- AtRepAdapter -> getSpins()
- LabConAdapter -> getSpins()
- LabCon1Adapter -> getSpins()
- atRepEngine / labEngine / labCon1Engine / tomadorRenderer / orionRenderer / ataqueRenderer / atrasosRenderer / stWinRenderer -> getSpins() y/o getSettings()

Compatibilidad pública
- tracker.settings -> getter de compatibilidad que delega a getSettings()
- No se consideró legacy residual porque no rompe el contrato público.
