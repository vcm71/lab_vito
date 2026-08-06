# Diagramas de Flujo del Dominio

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

---

## 1. Agregar un giro (addSpin)

```
Usuario               RouletteTracker          SpinManager        SessionManager
   │                       │                       │                   │
   │  addSpin("17")        │                       │                   │
   │──────────────────────►│                       │                   │
   │                       │  addSpin("17", meta)  │                   │
   │                       │──────────────────────►│                   │
   │                       │                       │  ¿válido?         │
   │                       │                       │  ──► sí           │
   │                       │                       │  Crea Spin {id,n} │
   │                       │                       │  state.spins.push │
   │                       │                       │──┐                │
   │                       │                       │  │ retorna Spin   │
   │                       │◄──────────────────────│  │                │
   │                       │                       │  │                │
   │                       │  if (spin)            │  │                │
   │                       │  incrementSession     │  │                │
   │                       │  SpinCount()          │  │                │
   │                       │──────────────────────────────────────────►│
   │                       │                       │                   │ spinCount++
   │                       │◄──────────────────────────────────────────│
   │ ◄─────────────────────│                       │                   │
   │  {id, number, ...}    │                       │                   │
```

---

## 2. Eliminar un giro (deleteSpin)

```
Usuario               RouletteTracker          SpinManager
   │                       │                       │
   │  deleteSpin(5)        │                       │
   │──────────────────────►│                       │
   │                       │  deleteSpin(5)        │
   │                       │──────────────────────►│
   │                       │                       │  findIndex s.id === 5
   │                       │                       │  ──► found
   │                       │                       │  splice(idx, 1)
   │                       │                       │  reindexar IDs > 5
   │                       │                       │──┐
   │                       │                       │  │ retorna true
   │                       │◄──────────────────────│  │
   │ ◄─────────────────────│                       │  │
   │  true                 │                       │  │
```

---

## 3. Ciclo de vida de sesión

```
Estado:          INACTIVE              ACTIVE              COMPLETED
                ──────────            ──────              ─────────
                    │                    │                    │
                    │  startSession()    │                    │
                    │───────────────────►│                    │
                    │  {active:true,     │                    │
                    │   startedAt:now}   │                    │
                    │                    │                    │
                    │         addSpin()  │                    │
                    │  spinCount++       │                    │
                    │         ...        │                    │
                    │                    │                    │
                    │         stopSession()                   │
                    │───────────────────────────────────────►│
                    │                    │  {active:false,    │
                    │                    │   endedAt:now}     │
                    │                    │                    │
                    │              addSessionToHistory()      │
                    │───────────────────────────────────────►│
                    │                    │    (archivado)     │
                    │                    │                    │
                    │  resetSession()    │                    │
                    │◄───────────────────│                    │
```

---

## 4. Inicialización del sistema (Bootstrap.init)

```
main.js
   │
   │  Bootstrap.init(container)
   ▼
┌──────────────────────────────────────┐
│            Bootstrap.init            │
│                                      │
│  1. TrackerState()                   │
│  2. SpinManager(state)               │
│  3. SessionManager(state)            │
│  4. HistoryManager(state)            │
│  5. SettingsManager(state)           │
│  6. RouletteTracker(                 │
│       state, spinMgr, sessMgr,       │
│       histMgr, settingsMgr           │
│     )                                │
│  7. setDelayManager(DelayManager)    │
│  8. setEventBus(eventBus)            │
│  9. container.register('tracker',..) │
│                                      │
│  10. Engines:                        │
│      WinWinEngine(tracker)           │
│      DAEngine(tracker)               │
│      LogicEngine(tracker, ww)        │
│      Sesgo97Logic(tracker)           │
│      ChiAnalysisEngine(tracker)      │
│      KellyManager()                  │
│                                      │
│  11. LabRenderer(tracker)            │
│      eventBus.on('update', update)   │
│                                      │
│  Retorna {tracker, services, engines}│
└──────────────────────────────────────┘
   │
   ▼
OrionKernel
│
├── Registra engines en EngineRegistry
├── tracker.initialize()
│   ├── settingsManager.load()
│   ├── historyManager.load()
│   └── rouletteSpinsStore.load()
│
└── main.js (render inicial)
```

---

## 5. Cálculo de atrasos (DelayManager)

```
getNumberDelay("17")  getDozenDelay(2)  getColumnDelay(3)
         │                   │                  │
         └───────────────────┼──────────────────┘
                             │
                             ▼
                    _recompute()
                         │
                    ┌─────┴─────┐
                    │           │
                 dirty?      not dirty?
                    │           │
                    ▼           ▼
              Recalcular    Retornar cache
              O(N×44)      O(1)
                    │
                    ▼
         Cache: {numbers, maxNumbers,
                 dozens, maxDozens,
                 columns, maxColumns}
                    │
         _delaysDirty = false
                    │
                    ▼
            Retorna valor del cache
```

---

## 6. Test de rachas (Runs Test)

```
runsTest("color")
   │
   ▼
Convertir spins → secuencia binaria
   │
   Por cada spin:
     red   → 1
     black → 0
     green → skip
   │
   ▼
secuencia: [1, 0, 1, 1, 0, 0, 0, 1, ...]
   │
   ▼
n < 20? ──► "Mínimo 20 tiradas"
   │
   ▼
Calcular:
  n1 = sum(seq)         (# de 1s)
  n2 = n - n1           (# de 0s)
  runs = transiciones + 1
  μR = (2·n1·n2)/n + 1
  σR = √(...)
  z  = (runs - μR) / σR
   │
   ▼
Interpretar |z|:
  < 1.645  → Aleatoria
  < -1.96  → Rachas largas (clustering)
  > 1.96   → Alternancia excesiva
  < -1.645 → Leve clustering
  > 1.645  → Leve alternancia
```

---

## 7. Flujo de persistencia

```
Domain Tracker                    Store                Navegador
     │                              │                     │
     │  saveSpins()                 │                     │
     │─────────────────────────────►│                     │
     │                              │  setSpins(data)     │
     │                              │────────────────────►│
     │                              │                     │ IndexedDB
     │                              │◄────────────────────│
     │◄─────────────────────────────│                     │
     │                              │                     │
     │  addSessionToHistory()       │                     │
     │                              │                     │
     │  ├─ HistoryManager.add()     │                     │
     │  └─ HistoryManager.save()    │                     │
     │       (localStorage)         │────────────────────►│
     │                              │                     │ localStorage
     │                              │◄────────────────────│
```

---

## 8. Diagrama de relación entre entidades

```
┌──────────────┐    1        1 ┌──────────────────┐
│  TrackerState│◄──────────────│ RouletteTracker  │
│              │    posee      │  (Agregado raíz) │
│  - spins[]   │               └──────────────────┘
│  - session{} │                      │
│  - history[] │               ┌──────┼──────┬──────┐
│  - settings{}│               │      │      │      │
└──────┬───────┘               │      │      │      │
       │                       ▼      ▼      ▼      ▼
       │                SpinMgr  SessMgr HistMgr  SetMgr
       │                 │        │       │        │
       └─────────────────┴────────┴───────┴────────┘
                          (todos operan sobre
                           TrackerState por referencia)
```
