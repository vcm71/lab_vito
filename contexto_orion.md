# Archivos de contexto para el proyecto Orion

**Orden canónico de lectura de sesión:**
1. [arnes_orion.md](./arnes_orion.md)
2. [contexto_orion.md](./contexto_orion.md)

Los documentos `ORION_PROJECT_CONTEXT.md`, `ORION_SESSION_CONTEXT.md` y `orion_contexto_paraGPT` se consideran referencia heredada.

---

### Listado de referencia técnica

1. `package.json` – metadatos y scripts de Vite.
   [package.json](./package.json)

2. `index.html` – plantilla HTML principal. Incluye acordeón de Ajustes_vito con **8 módulos** (`moduleThresholds`): docenas, columnas, suertesSencillas, sixenas, ceros, seriesSectores, **winwin** (Rachas Cortas · St_win), **AtRep** (Atracción/Repulsión). **Arriba del acordeón** está el campo global `set-atrasos-maxwindow-global` para `atrasosMaxWindow`. Win-Win usa su propio input `set-module-winwin-dist` en lugar de limit/critical, porque su umbral es `distanceMax` (distancia máxima entre aciertos, default 5) en vez de retraso. AtRep usa `set-module-atrep-topk` (slider + input numérico 1–20).
   [index.html](./index.html)

3. `main.js` – punto de entrada JS. Inicializa motores. Ya no importa `TrackerSyncAdapter`.
   Crea `RouletteAnalytics` + `TrackerCompat` tras bootstrap. Define `MODULE_INPUTS` con refs
   a inputs de `limit` y `critical` por módulo. `inputAtrasosMaxWindow` referencia el campo global.
   `syncSettingsForm` y save handler trabajan con `moduleThresholds` + `atrasosMaxWindow` en raíz.
   Incluye wiring para `atRepTopK` (lectura en `syncSettingsForm`, envío en save, inclusión en `updateSettings`).
   [main.js](./main.js)

4. `src/tracker/TrackerCompat.js` – envoltura de compatibilidad que expone la API del Legacy
   (CRUD, atrasos, _freq, getStats) delegando al Domain Tracker + RouletteAnalytics + numberMeta.
   Creado en Fase5.5.3. En Fase5.5.4 es la única implementación de atrasos con cache O(N).
   [src/tracker/TrackerCompat.js](./src/tracker/TrackerCompat.js)

5. `vite.config.js` – configuración de Vite.
   [vite.config.js](./vite.config.js)

6. `atrasosRenderer.js` – renderiza la pestaña Atrasos. `buildWidgets(getDelayStats, thresholds)` recibe una sola función `getDelayStats` (factory ya resuelta con el `maxWindow` global) y `thresholds` desde `settings.moduleThresholds`. Todas las secciones (suertes, docenas, columnas, seisenas, ceros, series) comparten el mismo `maxWindow` global.
   [atrasosRenderer.js](./atrasosRenderer.js)

7. `rouletteSettingsStore.js` – almacén de configuración con persistencia IndexedDB. Define `DEFAULT_SETTINGS` con `atrasosMaxWindow:100` en raíz y `moduleThresholds` (6 módulos, cada uno con `{ limit:5, critical:9 }` — sin `maxWindow`). Migración inversa desde `moduleThresholds[module].maxWindow` a `atrasosMaxWindow` raíz en `normalizeSettings`.
   [rouletteSettingsStore.js](./rouletteSettingsStore.js)

8. `controlador_de_la_vista_lab.js` – interfaz ultra-compacta y estética premium (estilo ORION) para la pestaña Lab_Con (Teoría de Conjuntos). Ahora Overview, Experiments y Sessions consumen ViewModels del binding del laboratorio.
   [controlador_de_la_vista_lab.js](./controlador_de_la_vista_lab.js)

9. `labEngine.js` – motor matemático del Laboratorio Analítico. Incluye `SET_TO_MODULE` (mapping de nombre de conjunto a clave de módulo). `_getSetStats` lee `maxWindow` desde `settings.atrasosMaxWindow` (global) en vez del campo plano o `moduleThresholds[moduleKey]`.
   [labEngine.js](./labEngine.js)

10. `labCon1Engine.js` – motor analítico Win-Win para la pestaña Lab_Con1. Reemplaza cálculo de atrasos por métricas Win-Win (`isActive`, `streakLength`, `recencyBonus`) para ponderar conjuntos. Lee `atrasosMaxWindow` para limitar muestra.
    [labCon1Engine.js](./labCon1Engine.js)

11. `labCon1Renderer.js` – renderizador de la pestaña Lab_Con1. Muestra resumen global con Total Spins + Muestra Activa, análisis por conjunto con tabla de frecuencias y columna Win-Win. Tono visual naranja/violeta.
    [labCon1Renderer.js](./labCon1Renderer.js)

12. `monteCarloValidator.js` – framework de validación Monte Carlo autocontenido (sin dependencia Legacy). 
    [monteCarloValidator.js](./monteCarloValidator.js)

13. `atRepEngine.js` – motor de análisis espacial (Par Correlation Index). Procesa scores individuales, resúmenes globales, detalles de conjuntos e intersecciones descriptivas. Lee `atrasosMaxWindow` del settings.
    [atRepEngine.js](./atRepEngine.js)

14. `src/viewmodels/atRepViewModel.js` – viewmodel serializable para el módulo AtRep. Define `LABELS` (textos en español), `TONE` (enum de tonos), y `createAtRepViewModel()`. Filtra PCI > 1.05 (atracción) / < 0.95 (repulsión), excluye 0/00, respeta `topK` configurable.
    [src/viewmodels/atRepViewModel.js](./src/viewmodels/atRepViewModel.js)

15. `atRepRenderer.js` – renderizador de la pestaña AtRep. Mismo layout que Lab_Con1: header, disclaimer, resumen global con tarjetas, grilla de scores, detalles de conjuntos en tabla, intersecciones, selector de conjuntos. PCI en gris `#64748b` para diferenciarlo del número.
    [atRepRenderer.js](./atRepRenderer.js)

16. `src/consensus/adapters/AtRepAdapter.js` – adaptador de AtRep al contrato `ConsensusSignal`; se exporta desde `src/consensus/adapters/index.js` y `src/consensus/index.js`.
    [src/consensus/adapters/AtRepAdapter.js](./src/consensus/adapters/AtRepAdapter.js)

17. `reports/consensus/PHASE_1_3_ATREP_ADAPTER.md` – reporte final de la fase 1.3 con la integración y validación del adaptador AtRep.
    [reports/consensus/PHASE_1_3_ATREP_ADAPTER.md](./reports/consensus/PHASE_1_3_ATREP_ADAPTER.md)

### Capa de evidencia histórica — observaciones de calibración (Fase 2.3.2) y dataset (Fase 2.3.3)

18. `src/laboratory/LaboratoryOrchestrator.js` – coordinador de capa de aplicación para Laboratory; centraliza crear/iniciar/ejecutar/comparar/generar evidencia/actualizar/finalizar experimentos sin lógica estadística ni UI.
    [src/laboratory/LaboratoryOrchestrator.js](./src/laboratory/LaboratoryOrchestrator.js)

19. `tests/laboratory/LaboratoryOrchestrator.test.js` – cobertura del coordinador: flujo completo, ejecución por lotes y errores estructurados.
    [tests/laboratory/LaboratoryOrchestrator.test.js](./tests/laboratory/LaboratoryOrchestrator.test.js)

20. `reports/Fase6.B.7B.log` – log de la Fase 6.B.7 con timestamp visible al inicio.
    [reports/Fase6.B.7B.log](./reports/Fase6.B.7B.log)

21. `reports/Fase6.C.5.v1.log` – log de la Fase 6.C.5 con el cierre del binding-driven UI del laboratorio y timestamp visible al inicio.
    [reports/Fase6.C.5.v1.log](./reports/Fase6.C.5.v1.log)

22. `reports/FaseD.3.2.log` – log de cierre de la Fase D.3 con timestamp visible al inicio.
    [reports/FaseD.3.2.log](./reports/FaseD.3.2.log)

23. `reports/FASE_D3_REPLAY_WORKSPACE_IMPLEMENTATION.md` – reporte técnico de la integración Replay binding-driven.
    [reports/FASE_D3_REPLAY_WORKSPACE_IMPLEMENTATION.md](./reports/FASE_D3_REPLAY_WORKSPACE_IMPLEMENTATION.md)

24. `reports/Fase_D3_cerrada.md` – punto de cierre de la Fase D.3.
    [reports/Fase_D3_cerrada.md](./reports/Fase_D3_cerrada.md)

25. `src/historical-evidence/domain/CalibrationObservation.js` – observación de calibración (schemaVersion '1', deep-frozen); identidad lógica predictionId + outcomeId; `calibration: { probability, strategyName, modelId, modelHash: undefined }`.
    [src/historical-evidence/domain/CalibrationObservation.js](./src/historical-evidence/domain/CalibrationObservation.js)

26. `src/historical-evidence/domain/DatasetAssemblyOptions.js` – contrato inmutable de opciones del dataset: filtros temporales INCLUSIVOS (from ≤ x ≤ to), `duplicatePolicy: 'REJECT'`, `invalidObservationPolicy`/`unsupportedSchemaPolicy` ('REJECT_DATASET' por defecto, `EXCLUDE_AND_REPORT` opcional), `allowEmpty` (solo tests), `CANONICAL_SORT_ORDER`.
    [src/historical-evidence/domain/DatasetAssemblyOptions.js](./src/historical-evidence/domain/DatasetAssemblyOptions.js)

27. `src/historical-evidence/domain/HistoricalCalibrationDataset.js` – snapshot científico inmutable: deep-frozen, orden canónico `predictionCreatedAt → spinId → predictionId → outcomeId → observationId`, `contentHash` (excluye datasetId/createdAt) + `manifestHash`; `isSameDatasetContent` con guard de tipos.
    [src/historical-evidence/domain/HistoricalCalibrationDataset.js](./src/historical-evidence/domain/HistoricalCalibrationDataset.js)

28. `src/historical-evidence/application/DatasetBuilder.js` – pipeline puro de 10 pasos (validar→filtrar→dedupe→ordenar→estadísticas→manifiesto→hashes→freeze), all-or-nothing, copia defensiva; **solo evalúa filtros ACTIVOS** (null = sin filtro); `hashFn` inyectable (default `canonicalHashSync` de `src/calibration/CanonicalHash.js`, Fase P2.2).
    [src/historical-evidence/application/DatasetBuilder.js](./src/historical-evidence/application/DatasetBuilder.js)

29. `src/historical-evidence/application/BuildHistoricalDatasetUseCase.js` – lee del repo (`findAll`), delega en el builder; `datasetId`/`createdAt` inyectados por el llamador (nunca Math.random/Date.now).
    [src/historical-evidence/application/BuildHistoricalDatasetUseCase.js](./src/historical-evidence/application/BuildHistoricalDatasetUseCase.js)

30. `src/historical-evidence/application/GroupedTemporalSplitConfiguration.js` – contrato explícito para el split temporal agrupado: `sourceDatasetIdentity`, `trainUntil` y `validationUntil` opcional, con validación canónica de timestamps e identidad.
    [src/historical-evidence/application/GroupedTemporalSplitConfiguration.js](./src/historical-evidence/application/GroupedTemporalSplitConfiguration.js)

31. `src/historical-evidence/application/GroupedTemporalDatasetSplitter.js` – splitter temporal agrupado por `spinId`; valida integridad previa, rechaza grupos ambiguos, y construye particiones `TRAIN`/`VALIDATION`/`TEST` de forma determinista.
    [src/historical-evidence/application/GroupedTemporalDatasetSplitter.js](./src/historical-evidence/application/GroupedTemporalDatasetSplitter.js)

> **Fase2.3.5.2 — Split temporal agrupado de historical-evidence (ago 01):**
> `GroupedTemporalSplitConfiguration` + `GroupedTemporalDatasetSplitter` en aplicación; particionado determinista por `spinId`
> con validación de integridad previa, periodos inclusivos y rechazo de configuraciones inválidas o timestamps ambiguos.
> Reporte: `reports/trabajo/Fase2.3.5.2_reporte.md`.
>
> **Fase2.3.3 — Ensamblaje del dataset de calibración histórica (jul 31):**
> Snapshot inmutable del contenido del repo: `DatasetBuilder` (aplicación) + `HistoricalCalibrationDataset`,
> `DatasetManifest`, `DatasetStatistics`, `DatasetAssemblyOptions` (dominio) + `findAll()` en puerto e InMemory.
> 7 errores nuevos sobre `DatasetError` → `EvidenceError`. Sin persistencia/entrenamiento/side effects.
> 198 tests en la capa (2.3.2 + 2.3.3).
>
> **Fase2.3.2 — Observaciones de calibración (jul 31):**
> `CalibrationObservation` + `ObservationBuilder` (1 obs/predicción, orden createdAt+predictionId asc,
> all-or-nothing, PENDING_OUTCOME → 0) + evaluador puro → 0|1 ("0" ≠ "00") +
> `ConsensusToPredictionMapper` (sin persistir) + `InMemoryCalibrationObservationRepository` idempotente.
>
> **Fase5.5.4 — Legacy eliminado:** `rouletteTracker.js`, `TrackerSyncAdapter.js` y `stress_test_orion.js` 
> retirados del proyecto. `src/sync/` quedó vacío. Domain Tracker es el único tracker.
>
> **Fase2.3.1.1 — Hardening de la capa de evidencia histórica (jul 30):**
> Capa `src/historical-evidence/` hardened (16 archivos, 74 tests):
> - `domain/` — `RouletteNumber` (validación canónica), `PredictionTarget` (tipo extensible NUMBER),
>   `PredictionRecord` (rawConsensusScore obligatorio, calibration anidada, target),
>   `SpinOutcomeRecord` (winningNumber, sin observedOutcome; backward compat `createOutcomeRecord`),
>   `EvidenceStatus` (PENDING_OUTCOME/COMPLETED/EMPTY), `errors.js` (8 errores tipados),
>   `immutable.js` (deepFreeze recursivo), `metadata.js` (normalizador seguro),
>   `chronology.js` (validación anti-leakage temporal).
> - `application/` — `RecordPredictionUseCase`, `RecordOutcomeUseCase`, `GetEvidenceBySpinUseCase`.
> - `infrastructure/` — `InMemoryEvidenceRepository` (copias defensivas, checks temporales bidireccionales).
> - Reporte: `reports/Fase2.3.1.1_hardening_reporte.md`.
>
> **Archivos nuevos (jul 28):** `atRepEngine.js`, `atRepRenderer.js`, `src/viewmodels/atRepViewModel.js` — módulo AtRep completo.

---

### Estructura de settings (a partir de jul 22 — globalización de maxWindow)

```js
{
  atrasosMaxWindow: 100,  // ← global, único para todos los módulos
  atRepTopK: 5,           // ← top N para tarjetas AtRep (1–20)
  moduleThresholds: {
    docenas:          { limit: 5, critical: 9 },  // sin maxWindow
    columnas:         { limit: 5, critical: 9 },
    suertesSencillas: { limit: 5, critical: 9 },
    sixenas:          { limit: 5, critical: 9 },
    ceros:            { limit: 5, critical: 9 },
    seriesSectores:   { limit: 5, critical: 9 },
    winwin:           { distanceMax: 5 }           // sin limit/critical
  }
}
```

IDs en HTML:
- Por módulo (limit/critical): `set-atrasos-{modulo}-limit`, `set-atrasos-{modulo}-critical`
- Win-Win (distanceMax): `set-module-winwin-dist`
- AtRep (topK): `set-module-atrep-topk`
- Global: `set-atrasos-maxwindow-global` (arriba del acordeón)

---

### Documentación técnica (Fase 4.4 — Engineering Documentation & Governance)

11. `ARCHITECTURE.md` – Arquitectura de 5 capas (UI, Engine, Domain, Infrastructure, Core), estructura interna del Domain Tracker (managers, estado), motor de análisis, flujo Bootstrap y decisiones arquitectónicas documentadas.
    [ARCHITECTURE.md](./ARCHITECTURE.md)

12. `DOMAIN_MODEL.md` – 4 entidades del dominio (Spin, Session, SessionRecord, Settings) con invariantes, propietarios, permisos, agregado raíz RouletteTracker y diagrama de relaciones.
    [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)

13. `PUBLIC_API.md` – API pública completa de RouletteTracker, RouletteAnalytics y DelayManager: métodos, parámetros, retornos y ejemplos de uso.
    [PUBLIC_API.md](./PUBLIC_API.md)

14. `DOMAIN_FLOW.md` – 8 diagramas ASCII de flujos clave: addSpin, deleteSpin, session lifecycle, Bootstrap.init, DelayManager cache, runs test, persistencia y entidad-relación.
    [DOMAIN_FLOW.md](./DOMAIN_FLOW.md)

15. `DEVELOPMENT_GUIDE.md` – Setup, scripts disponibles, estructura del proyecto, convenciones, debugging y solución de problemas comunes.
    [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

16. `CONTRIBUTING.md` – Flujo de trabajo, estilo de código, Definition of Done, PR checklist, branches y versionado semántico.
    [CONTRIBUTING.md](./CONTRIBUTING.md)

17. `QUALITY_GATES.md` – 6 gates obligatorios pre-merge: build, tests, regresión, lint, cobertura y validación manual.
    [QUALITY_GATES.md](./QUALITY_GATES.md)

18. `RELEASE_PROCESS.md` – Versionado SemVer, flujo de release (pasos 1-5), estrategia de rollback y hotfixes.
    [RELEASE_PROCESS.md](./RELEASE_PROCESS.md)

19. `ROADMAP.md` – Roadmap técnico con Fase3-4 completadas, Fase5 en curso y Fases 6-7 futuras (EventBus, Persistencia Unificada).
    [ROADMAP.md](./ROADMAP.md)

20. `docs/adr/README.md` – 6 Architecture Decision Records (ADR-001 a ADR-006): estado único, managers SRP, clase analítica pura, persistencia delegada, Bootstrap+DI, cache lazy con dirty flag.
    [docs/adr/README.md](./docs/adr/README.md)

---

### Reportes

21. `reports/IMPLEMENTACION_ETAPA_4_4_ENGINEERING_DOCUMENTATION.md` – Reporte final de la Fase 4.4 con todos los deliverables y validación.
    [reports/IMPLEMENTACION_ETAPA_4_4_ENGINEERING_DOCUMENTATION.md](./reports/IMPLEMENTACION_ETAPA_4_4_ENGINEERING_DOCUMENTATION.md)

22. `reports/Fase2.3.1.1_hardening_reporte.md` – Reporte final del hardening de la capa de evidencia histórica (Fase 2.3.1.1).
    [reports/Fase2.3.1.1_hardening_reporte.md](./reports/Fase2.3.1.1_hardening_reporte.md)

23. `reports/Fase2.3.1_reporte.md` – Reporte de la capa base de evidencia histórica (pre-hardening, Fase 2.3.1).
    [reports/Fase2.3.1_reporte.md](./reports/Fase2.3.1_reporte.md)

24. `reports/Fase2.3.2_calibration_observations_reporte.md` – Reporte final de las observaciones de calibración (Fase 2.3.2).
    [reports/Fase2.3.2_calibration_observations_reporte.md](./reports/Fase2.3.2_calibration_observations_reporte.md)

25. `reports/Fase2.3.3_historical_dataset_assembly_reporte.md` – Reporte final del ensamblaje del dataset de calibración histórica (Fase 2.3.3).
    [reports/Fase2.3.3_historical_dataset_assembly_reporte.md](./reports/Fase2.3.3_historical_dataset_assembly_reporte.md)

26. `reports/trabajo/Fase2.3.5.2_reporte.md` – Reporte de ejecución del split temporal agrupado y su cierre de fase.
    [reports/trabajo/Fase2.3.5.2_reporte.md](./reports/trabajo/Fase2.3.5.2_reporte.md)

27. `reports/Fase_6_cerrada .md` – Punto de control de cierre de Fase 5 y preparación de Fase 6; certifica ausencia de dependencias funcionales Legacy y propone la arquitectura reactiva/Event Driven Domain Platform.
    [reports/Fase_6_cerrada .md](./reports/Fase_6_cerrada%20.md)

28. `reports/FaseD.3.5.log` – Log de la Fase D.3.5 con el timeline unificado de Laboratory, validación completa y timestamp visible al inicio.
    [reports/FaseD.3.5.log](./reports/FaseD.3.5.log)
