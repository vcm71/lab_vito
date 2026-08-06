# 📎 Arnés de contexto para el proyecto Orion

**Regla de sesión:** este es el primer archivo que debe leerse al comenzar una sesión.  
Después de este archivo, leer `contexto_orion.md`.

## 1️⃣ Hacia dónde vamos
- **Objetivo principal:** Reparar *Roulette Tracker Pro* para que sea totalmente funcional en el host local y ofrecer una experiencia de simulación de ruleta premium y visualmente impactante.
- **Metas intermedias:**
  - Configurar el entorno de desarrollo con Vite.
  - Garantizar que la UI cargue sin errores.
  - Validar la lógica de los motores (`LogicEngine`, `WinWinEngine`, `DAEngine`, etc.) y la persistencia de datos.
  - Añadir mejoras de usabilidad y estética premium (tema oscuro, micro‑animaciones, tipografía moderna).
  - **Refactorizar umbrales de alerta:** Se migró de umbrales planos globales a umbrales independientes por módulo (`moduleThresholds` con 6 módulos), pero **`maxWindow` se revirtió a global** (`atrasosMaxWindow` en raíz de settings) — único valor para todos los módulos, situado arriba del acordeón. `limit` y `critical` permanecen por módulo. Persistencia en IndexedDB.
  - **Módulo AtRep (Atracción/Repulsión):** pestaña independiente con análisis PCI (Par Correlation Index). Filtros: PCI > 1.05 = atracción, PCI < 0.95 = repulsión. Excluye 0 y 00. TopN configurable via `atRepTopK` (default 5, slider 1–20 en Ajustes_vito). PCI renderizado en gris para diferenciarlo del número.
  - Mantener un respaldo previo al trabajo con rotación automática de 3 copias en `backup_orion/`.

## 2️⃣ Dónde estamos
- **Estado actual del proyecto** (a 03 ago 2026):
  - **Fase_6_cerrada.md registrada — cierre de Fase 5 y preparación de Fase 6:**
    - Se certificó el cierre de la Fase 5 sobre una plataforma consolidada en Domain Tracker.
    - No existen dependencias funcionales activas del Legacy.
    - Fases revisadas: 5.1, 5.1.5, 5.2.1, 5.2.2, 5.3, 5.4 y 5.5.
    - La siguiente etapa propuesta es la Fase 6: arquitectura orientada a eventos / plataforma reactiva.
    - Reporte: `reports/Fase_6_cerrada .md`.
  - **Fase2.3.1.1 completada — Hardening de la capa de evidencia histórica:**
    - **16 archivos en `src/historical-evidence/`** — dominio hardened con immutabilidad profunda (`deepFreeze`), validación canónica de números (`RouletteNumber`), tipos extensibles (`PredictionTarget`), temporalidad estricta (`validateChronology`), copias defensivas en repositorio.
    - **5 archivos nuevos:** `RouletteNumber.js`, `PredictionTarget.js`, `immutable.js`, `metadata.js`, `chronology.js`.
    - **Records:** `PredictionRecord` (rawConsensusScore obligatorio, target, calibration anidada), `SpinOutcomeRecord` (winningNumber, sin observedOutcome). Backward compat `createOutcomeRecord`.
    - **Estados:** `PENDING_OUTCOME` / `COMPLETED` / `EMPTY`. Deprecados `PENDING`/`RESOLVED`/`CONFLICT`.
    - **8 errores:** InvalidConsensusScoreError, InvalidPredictionTargetError, InvalidWinningNumberError, TemporalEvidenceLeakageError, DuplicateOutcomeError, SpinNotFoundError + 2 legacy.
  - **Fase2.3.2 completada — Observaciones de calibración (jul 31):**
    - `CalibrationObservation` (schemaVersion '1', deep-frozen): predictionId + outcomeId como identidad lógica (sin Math.random/timestamps).
    - Evaluador de outcomes función pura → 0|1 (NUMBER estricto, "0" ≠ "00"); PENDING_OUTCOME → 0 observaciones.
    - `ObservationBuilder` valida spinId, cronología, target, score; 1 observación por predicción; orden createdAt+predictionId asc; all-or-nothing.
    - `ConsensusToPredictionMapper` sin persistir: `{ probability, strategyName, modelId, modelHash: undefined }`.
    - `InMemoryCalibrationObservationRepository` idempotente (nunca sobrescribe).
    - Reporte: `reports/Fase2.3.2_calibration_observations_reporte.md`.
  - **Fase2.3.3 completada — Ensamblaje del dataset de calibración histórica (jul 31):**
    - `HistoricalCalibrationDataset` — snapshot científico inmutable (deep-frozen, orden canónico `predictionCreatedAt → spinId → predictionId → outcomeId → observationId`, contentHash (SHA-256 canónico P2.2 vía `hashFn` inyectable) + manifestHash).
    - `DatasetBuilder` — pipeline puro de 10 pasos (validar→filtrar→dedupe→ordenar→estadísticas→manifiesto→hashes→freeze), all-or-nothing; solo evalúa filtros ACTIVOS.
    - `DatasetAssemblyOptions` (filtros temporales inclusivos, duplicatePolicy 'REJECT', invalid/unsupportedSchema 'REJECT_DATASET'), `DatasetManifest` (procedencia), `DatasetStatistics` (agregaciones puras).
    - `BuildHistoricalDatasetUseCase` — lee del repo (`findAll` añadido al puerto + InMemory); `datasetId`/`createdAt` inyectados por el llamador, nunca reloj/aleatoriedad.
    - **7 errores nuevos** sobre `DatasetError` → `EvidenceError`.
    - Sin persistencia, sin entrenamiento, sin side effects (auditado).
    - Reporte: `reports/Fase2.3.3_historical_dataset_assembly_reporte.md`.
  - **Fase2.3.5.2 completada — Split temporal agrupado de historical-evidence (ago 01):**
    - `GroupedTemporalSplitConfiguration` y `GroupedTemporalDatasetSplitter` en `src/historical-evidence/application/`.
    - Contrato explícito con `sourceDatasetIdentity`, `trainUntil` y `validationUntil`, validación de integridad previa y particionado determinista por `spinId`.
    - Particiones `TRAIN` / `VALIDATION` / `TEST` con periodos inclusivos derivados de timestamps reales; rechazo de configuraciones inválidas, timestamps ambiguos y particiones vacías.
    - Tests nuevos: `tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js`.
    - Reporte: `reports/trabajo/Fase2.3.5.2_reporte.md`.
  - **Fase4.4 completada — Engineering Documentation & Governance:**
    - **10 documentos técnicos creados:** `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `PUBLIC_API.md`, `DOMAIN_FLOW.md`, `DEVELOPMENT_GUIDE.md`, `CONTRIBUTING.md`, `QUALITY_GATES.md`, `RELEASE_PROCESS.md`, `ROADMAP.md`, `docs/adr/README.md`.
  - **Legacy eliminado** (`rouletteTracker.js`, `TrackerSyncAdapter.js`, `stress_test_orion.js`). Domain Tracker es el único tracker.
  - **Refactorización de umbrales completada:** `moduleThresholds` con 6 módulos, `atrasosMaxWindow` global.
  - **Muestra Activa en todas las pestañas** (Atrasos, Lab_Con, Lab_Con1, St_win) limitada a `atrasosMaxWindow`.
  - **Módulo AtRep consolidado (jul 30):**
    - Pestaña independiente con análisis PCI (Par Correlation Index).
    - `atRepEngine.js` — motor de procesamiento espacial.
    - `atRepViewModel.js` — viewmodel con filtrado PCI > 1.05 / < 0.95, exclusión 0/00, topK configurable.
    - `atRepRenderer.js` — renderizador con tarjetas de resumen, grilla de scores, detalles de conjuntos.
    - `src/consensus/adapters/AtRepAdapter.js` — adaptador al contrato `ConsensusSignal`.
    - Configuración: `atRepTopK` en settings (default 5), slider 1–20 en Ajustes_vito → módulo AtRep.
    - PCI en tarjetas renderizado en gris `#64748b`.
  - **Fase6.B.7 completada — Laboratory Orchestrator & Application Layer:**
    - `LaboratoryOrchestrator` creado como coordinador de capa de aplicación para crear/iniciar/ejecutar/comparar/generar evidencia/actualizar/finalizar experimentos.
    - Exportado desde `src/laboratory/index.js` y cubierto con tests en `tests/laboratory/LaboratoryOrchestrator.test.js`.
    - Validación fresca: `npm run test`, `npm run lint` y `npm run build` en exit 0; el build solo reporta el warning habitual de chunks grandes de Vite.
    - Reporte/log: `reports/Fase6.B.7B.log`.
  - **Fase6.C.5 completada — Laboratory UI binding-driven:**
    - `controlador_de_la_vista_lab.js` ya renderiza Overview, Experiments y Sessions con ViewModels reales del binding en lugar de placeholders.
    - Se añadió cobertura específica en `tests/laboratory/LabRenderer.test.js` para las tres vistas funcionales.
    - Reporte/log: `reports/Fase6.C.5.v1.log`.
  - **FaseD.3 completada — Replay workspace binding-driven:**
    - `controlador_de_la_vista_lab.js` renderiza Replay desde `bindingViewModel` con timeline, detalle y controles de reproducción.
    - `src/laboratory/application/LaboratoryBindingLayer.js` expone acciones de replay (`loadReplay`, `refreshReplay`, `selectReplay`, `playReplay`, `pauseReplay`, `stopReplay`, `stepForward`, `stepBackward`, `seekReplay`) sobre eventos capturados.
    - Cobertura añadida en `tests/laboratory/LaboratoryBindingLayer.test.js` y `tests/laboratory/LabRenderer.test.js`.
    - Documentación/logs: `reports/FaseD.3.2.log`, `reports/FASE_D3_REPLAY_WORKSPACE_IMPLEMENTATION.md`, `reports/Fase_D3_cerrada.md`.
  - **FaseD.3.5 completada — Timeline unificado para Laboratory:**
    - `LaboratoryBindingLayer` ahora incluye un timeline model unificado con `timelineSelection`, `buildTimelineViewModel()` y helpers `loadTimeline()`, `refreshTimeline()`, `selectTimelineEvent()`, `searchTimeline()`, `filterTimeline()` y `publishTimelineEvent()`.
    - Replay reutiliza ese timeline unificado y AI Research queda enlazado al contexto de timeline activo y sus estadísticas.
    - Cobertura ampliada en `tests/laboratory/LaboratoryBindingLayer.test.js` para validar timeline, búsqueda, filtro, selección, carga/refresco y publicación de eventos.
    - Reporte/log: `reports/FaseD.3.5.log`.
  - **Validación vigente:** 1000 tests, lint 0, build OK (ago 05 11:37 UTC). La build emite solo el warning no bloqueante de chunks grandes de Vite.
## 3️⃣ Cómo podemos seguir avanzando
- **Próximos pasos inmediatos:**
  1. Fase 6: definir la arquitectura orientada a eventos y la infraestructura reactiva.
  2. Fase 2.3.4: consumo del dataset (splits temporales grupales con `GroupedTemporalSplit`, bootstrap pareado `PairedBootstrap`, leakage detector group-aware — ya disponibles en P2.2).
  3. MonteCarloValidator: migrar dependencia Legacy (crea su propio Legacy tracker).
  4. Probar la aplicación en navegador (`http://localhost:3000`) para verificar que no hay regresiones.
- **Documentación:**
  - La documentación técnica completa está en `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `PUBLIC_API.md`, `DOMAIN_FLOW.md` y `docs/adr/README.md`.
  - La guía de contribución y gates de calidad en `CONTRIBUTING.md` y `QUALITY_GATES.md`.
- **Mantenimiento continuo:**
  - Mantener actualizado `package.json` y ejecutar `npm audit fix` regularmente.
  - Ejecutar `tar czf` directo para backups; rotar a 3 copias en `backup_orion/`.
  - Guardar este arnés actualizado en `arnes_orion.md` y referenciarlo en cada sesión.
  - Considerar `contexto_orion.md` como la segunda lectura obligatoria de la sesión.
- **Regla de confirmación**: antes de cualquier cambio destructivo, refactorización, escritura de archivos o acción irreversible, **pedir confirmación al usuario**. No ejecutar sin consentimiento explícito.

---
**Nota:** Cada vez que avances, actualiza este archivo con la información más reciente para que siempre tengas a mano respuestas claras a las tres preguntas clave.
