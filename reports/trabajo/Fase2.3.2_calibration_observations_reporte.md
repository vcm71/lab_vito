# Fase 2.3.2 — Construction of Calibration Observations (Informe)

**Fecha (UTC):** 2026-07-31T05:45:22Z
**Prompt fuente:** `reports/Fase2.3.2_gpt.md` (39 secciones; s01 rol, s03 objetivo, s06 entregables, s14/s15 repo, s16 errores, s17 SpinToOutcomeMapper, s18/s21 contrato CalibrationObservation, s25 tests focalizados)
**Estado:** COMPLETADA — 9 pasos ejecutados, 767/767 tests, lint 0 warnings, build OK.

---

## 1. Resumen ejecutivo

Se construyó la cadena completa de **observaciones de calibración**: una fila científica inmutable que une **una** predicción con **un** resultado físico real (winning number), incluyendo la evaluación binaria de si el target aterrizó o no. La capa `historical-evidence` queda autocontenida (0 consumidores en `src/`), sin side effects sobre la aplicación productiva.

**Verificación final:**
- Suite completa: **767 tests / 49 archivos** — todos pasan (antes de la fase: 708/45; **+59 tests nuevos** en 4 archivos).
- `npm run lint` (eslint tests --max-warnings 0): **0 warnings**.
- `npm run build`: **OK** (solo warning preexistente de chunk > 500 kB, no relacionado).
- Auditoría: **0 imports** de los módulos nuevos fuera de `src/historical-evidence/`; **0 usos** de `Math.random`/`Date.now` en IDs; `main.js`/`index.html` intactos.

---

## 2. Diseño (Paso 2) — respuestas a las 4 preguntas por componente

| Componente | Qué representa en negocio | Propietario | Quién modifica | Quién solo lee |
|---|---|---|---|---|
| `CalibrationObservation` | Fila científica: 1 predicción + 1 resultado físico + evaluación binaria del target | Dominio historical-evidence | Nadie (**deep-frozen**) | Builder, repo, use case, fases futuras (dataset de calibración) |
| `PredictionTargetEvaluator` | Función pura: target vs winningNumber → **0\|1** (NUMBER estricto, `"0" ≠ "00"`) | Dominio | Nadie | Builder |
| `ObservationIdentity` | Política de IDs: caller-provided o generador inyectado; **prohibido `Math.random`/timestamp**; clave lógica = `predictionId + outcomeId` | Dominio | Nadie | Builder, use case, repo |
| `ObservationBuilder` | Servicio que compone 1 observación desde prediction + outcome | Aplicación | Nadie (fase) | Use case, tests |
| `BuildObservationsBySpinUseCase` | Materializa 1 obs por predicción de una tirada; all-or-nothing | Aplicación | Nadie (fase) | Fases futuras |
| `ConsensusToPredictionMapper` | `CalibrationOutput → PredictionRecord` **sin persistir**; `createdAt ← appliedAt`; `modelHash: undefined` | Aplicación | Nadie (fase) | Fases futuras |
| `CalibrationObservationRepository` | Puerto de persistencia (síncrono, mínimo) | Aplicación | Implementaciones | Use case |
| `InMemoryCalibrationObservationRepository` | Adaptador en memoria; invariantes s14/s15 | Infraestructura | Fase | Tests, fases futuras |
| 6 errores nuevos sobre `EvidenceError` | Fallos tipados de la construcción de observaciones | Dominio | Nadie | Toda la capa |

**Decisiones de diseño clave:**
- **s16 (errores):** `UnsupportedPredictionTargetError`, `EvidenceSpinMismatchError`, `InvalidObservationIdError`, `DuplicateCalibrationObservationError`, `InvalidCalibrationObservationError`, `InvalidConsensusOutputError` — todos sobre `EvidenceError` (códigos estables: `UNSUPPORTED_TARGET`, `SPIN_MISMATCH`, `INVALID_OBSERVATION_ID`, `DUPLICATE_OBSERVATION`, `TARGET_REQUIRED`/`NUMBER_NOT_IN_OUTPUT`/`INVALID_ENTRY`/`PREDICTION_ID_REQUIRED`/`SPIN_REQUIRED`/`TIMESTAMP_REQUIRED` para el mapper).
- **s14/s15 (repo):** nunca sobrescribe; idempotente si el contenido es idéntico; rechaza un ID con contenido distinto; rechaza la pareja lógica repetida; orden determinista (`predictionCreatedAt` asc + `predictionId` asc).
- **Atomicidad:** `validate all → save all` — si una observación del lote colisiona, **ninguna** se persiste (`assertCanSave` en preflight).
- **PENDING_OUTCOME → 0 observaciones**: sin resultado físico jamás se fabrica un falso 0 (una predicción fallida no se puede afirmar como fallida sin el número ganador real).
- **s17 (SpinToOutcomeMapper): POSTERGADO** — SpinManager usa id numérico reindexable y `new Date()` interno (no inyectado); el contrato `SpinOutcomeRecord` requiere timestamps ISO explícitos. Se documenta para una fase futura; el mapper de consenso cubre el lado predicción.

---

## 3. Implementación (Pasos 3–5)

**Archivos creados (9):**

| Archivo | Rol |
|---|---|
| `src/historical-evidence/domain/PredictionTargetEvaluator.js` | Evaluador puro: `evaluatePredictionTarget(target, winningNumber)` → 0\|1; valida target (soporta `NUMBER`, rechaza otros con `UnsupportedPredictionTargetError`) y winningNumber (`InvalidWinningNumberError`); `SUPPORTED_PREDICTION_TARGETS` frozen. |
| `src/historical-evidence/domain/CalibrationObservation.js` | Factory `createCalibrationObservation` + `CALIBRATION_OBSERVATION_SCHEMA_VERSION='1'` + `getEffectiveProbability`; validaciones de contrato (schemaVersion, IDs, target, rawConsensusScore `[0,1]` finito, observedOutcome 0\|1, timestamps ISO); deep-freeze total. |
| `src/historical-evidence/domain/ObservationIdentity.js` | `OBSERVATION_ID_PATTERN`, `isValidObservationId`, `assertValidObservationId`, `createSequentialObservationId(spinId, index)` → `obs-{spinId}-{index+1}`. |
| `src/historical-evidence/application/ObservationBuilder.js` | Valida spinId igual (`EvidenceSpinMismatchError`), cronología (**reusa `validateChronology`** — sin lógica temporal duplicada), rechaza `observedOutcome` externo (política: derivado, nunca confiado), deriva el outcome vía evaluator. |
| `src/historical-evidence/application/BuildObservationsBySpinUseCase.js` | `execute({ spinId, predictionRepository, outcomeRepository, observationRepository? })`; `PENDING_OUTCOME → 0 obs`; `EMPTY → SpinNotFoundError`; orden determinista; **all-or-nothing**; sin repo → build-only (no persiste). |
| `src/historical-evidence/application/CalibrationObservationRepository.js` | Puerto: `save`, `assertCanSave`, `findById`, `findByPredictionId`, `findBySpinId`, `count`, `clear`. |
| `src/historical-evidence/application/mappers/ConsensusToPredictionMapper.js` | Mapper explícito: predice/shape → `PREDICTION_ID_REQUIRED`/`SPIN_REQUIRED` → target (`TARGET_REQUIRED` si falta, `NUMBER_NOT_IN_OUTPUT` si no está, `INVALID_ENTRY` si `valid!==true`) → `TIMESTAMP_REQUIRED` → calibración (`probability`, `strategyName`, `modelId ← modelVersion`, **`modelHash: undefined`**). |
| `src/historical-evidence/infrastructure/InMemoryCalibrationObservationRepository.js` | Adaptador en memoria con invariantes s14/s15 (mapas `_byId`, `_byPrediction`, `_byLogical`). |
| `tests/historical-evidence/CalibrationObservationDomain.test.js` | Tests de dominio (evaluator 0/00 estricto, observación inmutable, identidad, errores). |

**Archivos creados (tests, 3 más):** `CalibrationObservationBuilder.test.js` (builder + use case), `ConsensusToPredictionMapper.test.js`, `CalibrationObservationRepository.test.js`.

**Archivos modificados (5):**
- `src/historical-evidence/domain/errors.js` — +6 errores.
- `src/historical-evidence/domain/index.js`, `application/index.js`, `infrastructure/index.js`, `index.js` (barrel raíz) — exports de los nuevos módulos.

**Total fase:** 9 archivos nuevos + 5 modificados. La capa pasa de 18 a **27 archivos .js**.

---

## 4. Errores encontrados y corregidos durante la implementación

1. **Ruta de import del mapper** (`application/mappers/`): `../domain/` → `../../domain/` — el barrel de aplicación rompía la carga de TODOS los tests (Cannot find module). Corregido.
2. **Fixture BASE del test del mapper** sin `number`/`target`: el mapper (correctamente) exige target explícito → `createNumberTarget(undefined)` lanzaba antes de validar. Añadido `number: '17'` al fixture.
3. **Test "explicit target wins"**: usaba un target (`'5'`) ausente del output — el contrato exige que el target también exista en `numbers`. Rediseñado: `number: '5'` + `target: '17'` para probar la precedencia real.

---

## 5. Verificación (Pasos 6–8)

- **Tests focalizados:** 133/133 en `tests/historical-evidence/` (7 archivos; +59 tests).
  - Evaluator: 0/00 estrictos, aciertos/fallos (1/36/23), targets no soportados, números inválidos.
  - Observación: contrato completo, deep-freeze (mutación intentada no efectiva), `getEffectiveProbability` con/sin calibración, errores de validación.
  - Builder: spin mismatch, cronología (leakage temporal), `observedOutcome` externo rechazado, derivación correcta.
  - Use case: 1 obs por predicción, orden determinista, PENDING_OUTCOME → 0 obs, SpinNotFound, all-or-nothing con colisión preexistente, idempotencia (2ª ejecución sin duplicados), build-only sin repo.
  - Mapper: mapeo completo, precedencia de `createdAt`, calibración null, target explícito vs shortcut, 5 códigos de error de contexto, **no muta el output**.
  - Repo: invariantes s14/s15 completas (no sobrescribir, idempotencia, pareja lógica, 1 obs por predicción, orden determinista, count/clear, preflight sin mutación).
- **Suite completa:** 767/767 (49 archivos) — incluye los 708 previos sin regresiones.
- **Lint:** 0 warnings (`eslint tests --max-warnings 0`).
- **Build:** OK.
- **Auditoría final:** 0 leakage fuera de la capa; sin `Math.random`/`Date.now` en IDs (solo menciones documentales); `main.js`/`index.html` sin cambios; el mapper no persiste; el use case solo persiste con repo inyectado.

---

## 6. Entregables s06 (12 ítems del prompt)

1. ✅ Política de identidad de observaciones (`ObservationIdentity`: patrón, secuencia, prohibición de aleatoriedad).
2. ✅ Compatibilidad predicción–outcome (mismo spin + cronología vía `validateChronology`).
3. ✅ Prevención de duplicados (clave lógica + 1 obs por predicción; invariantes de repo probadas).
4. ✅ Mapper explícito `ConsensusOutput → PredictionRecord` sin ambigüedad de target.
5. ✅ Evaluación binaria estricta del target (0/00 separados; nunca falso 0 sin resultado).
6. ✅ Inmutabilidad profunda de la observación (schemaVersion '1').
7. ✅ Orden determinista de materialización y consulta.
8. ✅ Atomicidad all-or-nothing.
9. ✅ 6 errores tipados sobre `EvidenceError` con códigos estables.
10. ✅ Puerto + adaptador en memoria con invariantes s14/s15.
11. ✅ Tests focalizados (evaluator, observación, builder, mapper, repo, caso de uso).
12. ✅ Este informe + registro de decisión s17 (SpinToOutcomeMapper postergado).

---

## 7. Pendientes para fases futuras (no bloqueantes)

- **SpinToOutcomeMapper (s17)**: requiere decidir la fuente de `SpinOutcomeRecord` (el SpinManager actual usa id numérico reindexable y timestamp interno no inyectado). No bloquea la construcción de observaciones.
- Consumo productivo de las observaciones (dataset de calibración) — fuera del alcance de 2.3.2 (s03: sin datasets persistentes).
