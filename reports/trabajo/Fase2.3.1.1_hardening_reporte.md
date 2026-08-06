# Fase 2.3.1.1 — Hardening de la Capa de Evidencia Histórica

**Fecha**: 2026-07-30T22:50:00Z
**Rama**: main
**Build**: 708 tests (45 archivos), lint 0, build OK

---

## Resumen Ejecutivo

Implementación de las 10 mejoras de hardening sobre la capa `historical-evidence`
según el prompt `Fase2.3.1.1_gpt.md`. Se fortaleció immutabilidad profunda,
validación canónica de números de ruleta, tipos extensibles, temporalidad
estricta, y contratos de repositorio con copias defensivas y anti-leakage.

**Resultado**: +27 tests nuevos (74 total en la capa), 708 tests globales,
lint 0 warnings, build limpio.

---

## 1. Auditoría Inicial

### 1.1 Contratos inspeccionados

| Archivo | Estado previo | Vulnerabilidad |
|---|---|---|
| `PredictionRecord.js` | `Object.freeze` superficial, `number` como string crudo, `rawConsensusScore` opcional (null), `calibratedProbability` en plano | Sin validación canónica del número, score no validado, immutabilidad parcial |
| `OutcomeRecord.js` | `observedOutcome` (booleano derivado), `number` crudo | Dominio mezclado: derivado + físico |
| `EvidenceStatus.js` | `PENDING`, `RESOLVED`, `CONFLICT` | `CONFLICT` nunca retornado (dead state), nombres ambiguos |
| `errors.js` | `DuplicatePredictionError`, `ContradictoryOutcomeError` | Sin errores de target inválido, score inválido, o fuga temporal |
| `InMemoryEvidenceRepository.js` | Sin checks temporales, sin copias defensivas, IDs incrementales automáticos | Posible race condition temporal, mutabilidad de arrays retornados |

### 1.2 Descubrimientos clave

- `AMERICAN_ROULETTE_NUMBERS` (38 strings) en `consensusConstants.js` — fuente canónica reutilizable
- `rawConsensusScore` en consenso: [0, 1] finito, producido por `ConsensusEngine._aggregateEngines`
- `CONFLICT` solo existe como símbolo; el repositorio lanza `ContradictoryOutcomeError` antes de alcanzarlo
- Sin consumidores en producción — seguro romper compatibilidad hacia atrás

---

## 2. Cambios Implementados

### 2.1 RouletteNumber — Validador Canónico
**Archivo**: `domain/RouletteNumber.js` (nuevo)

- `isValidAmericanRouletteNumber(value)` — validación estricta contra `AMERICAN_ROULETTE_NUMBERS`
- Solo strings; sin coerciones (ej: `0` numérico rechazado)
- Set O(1): `VALID_ROULETTE_NUMBER_SET` precomputado

### 2.2 PredictionTarget — Tipo Extensible
**Archivo**: `domain/PredictionTarget.js` (nuevo)

- `createNumberTarget(value)` — construye `{ type: 'NUMBER', value }` validado
- Lanza `InvalidPredictionTargetError` en números inválidos
- Deep-frozen; extensible a futuros tipos (COLOR, PARITY, etc.)

### 2.3 PredictionRecord — Hardening
**Archivo**: `domain/PredictionRecord.js` (reescrito)

| Campo | Antes | Ahora |
|---|---|---|
| `number` | string crudo | Eliminado → `target: PredictionTarget` |
| `rawConsensusScore` | opcional (null) | **Obligatorio**, [0, 1] finito |
| `calibratedProbability` | flat number | `calibration: { probability, strategyName, modelId?, modelHash? } \| null` |
| Immutabilidad | `Object.freeze` superficial | `deepFreeze` (incluye target, calibration, metadata) |

### 2.4 OutcomeRecord → SpinOutcomeRecord
**Archivo**: `domain/OutcomeRecord.js` (reescrito)

- `createSpinOutcomeRecord(...)` — constructor principal
- `createOutcomeRecord(...)` — wrapper de compatibilidad (`number → winningNumber`, `observedOutcome` descartado)
- `winningNumber` validado contra `AMERICAN_ROULETTE_NUMBERS`
- Sin `observedOutcome` (dominio de spin físico)

### 2.5 EvidenceStatus
**Archivo**: `domain/EvidenceStatus.js` (reescrito)

| Antes (deprecado) | Ahora (activo) |
|---|---|
| `PENDING` → `PENDING_OUTCOME` | Prediction(s) registradas, sin outcome físico |
| `RESOLVED` → `COMPLETED` | Outcome físico registrado |
| — `EMPTY` (nuevo) | Sin predicciones ni outcome |
| `CONFLICT` | Deprecado (nunca retornado; el repositorio lanza error) |

- `determineStatus(predictions, outcome)` — función pura
- Enum `Object.freeze`'d

### 2.6 Deep Immutability
**Archivo**: `domain/immutable.js` (nuevo)

- `deepFreeze(value)` recursivo con detección de ciclos (Set)
- Rechaza: funciones, símbolos, BigInt, Map, Set, Date, class instances
- Rechaza: keys `__proto__`, `constructor`, `prototype`
- Rechaza: `{ __proto__: {} }` detectado vía prototype check
- Idempotente sobre objetos ya congelados

### 2.7 Metadata Normalization
**Archivo**: `domain/metadata.js` (nuevo)

- `normaliseMetadata(value)` — null o deep-frozen plain object
- Rechaza arrays, funciones, no-plain objects
- Usado por PredictionRecord y SpinOutcomeRecord

### 2.8 Temporal Anti-Leakage
**Archivo**: `domain/chronology.js` (nuevo)

- `validateChronology({ spinId, predictionCreatedAt, outcomeRecordedAt })`
- Lanza `TemporalEvidenceLeakageError` si `predictionCreatedAt > outcomeRecordedAt`
- Permite igualdad (mismo milisegundo — legítimo)
- Validación invocada por el repositorio en `savePrediction` y `saveOutcome`

### 2.9 Errores Expandidos
**Archivo**: `domain/errors.js` (expandido)

| Error | Código | Cuándo |
|---|---|---|
| `InvalidConsensusScoreError` | `INVALID_CONSENSUS_SCORE` | Score null, NaN, Infinity, fuera de [0,1] |
| `InvalidPredictionTargetError` | `INVALID_PREDICTION_TARGET` | Target type/value inválido |
| `InvalidWinningNumberError` | `INVALID_WINNING_NUMBER` | Número de ruleta inválido en outcome |
| `TemporalEvidenceLeakageError` | `TEMPORAL_LEAKAGE` | Cronología violada |
| `DuplicateOutcomeError` | `DUPLICATE_OUTCOME` | Outcome duplicado para misma tirada |
| `SpinNotFoundError` | `SPIN_NOT_FOUND` | Tirada no encontrada (GetEvidenceBySpin) |
| `DuplicatePredictionError` | `DUPLICATE_PREDICTION` | (existente, mantenido) |
| `ContradictoryOutcomeError` | `CONTRADICTORY_OUTCOME` | (existente, mantenido) |

### 2.10 Repositorio Hardened
**Archivo**: `infrastructure/InMemoryEvidenceRepository.js` (reescrito)

- Métodos renombrados: `predictionsBySpin → getPredictionsBySpinId`, `outcomeBySpin → getOutcomeBySpinId`
- Eliminados: `statusBySpin`, `allSpinIds` (ahora en capa de aplicación)
- **Copias defensivas**: `getPredictionsBySpinId` retorna shallow copies de cada entry
- **Temporal check**: `savePrediction` rechaza si la predicción es posterior a un outcome existente
- **Temporal check**: `saveOutcome` rechaza si el outcome es anterior a predicciones existentes
- **Idempotencia**: outcome duplicado con mismo `outcomeId` es silenciado
- **Deduplicación**: mismo spin+winningNumber con distinto outcomeId → `DuplicateOutcomeError`

### 2.11 Use Cases Actualizados
**Archivos**: `application/RecordPredictionUseCase.js`, `RecordOutcomeUseCase.js`, `GetEvidenceBySpinUseCase.js`

- IDs explícitos (caller-provided), sin generador automático
- `RecordPredictionUseCase`: backward compat — acepta `{ number }` y lo transforma a `createNumberTarget`
- `RecordOutcomeUseCase`: acepta solo `winningNumber`, no `observedOutcome`
- `GetEvidenceBySpinUseCase`: lanza `SpinNotFoundError` para tiradas desconocidas

---

## 3. Tests

### Suite de hardening: 74 tests (3 archivos)

| Archivo | Tests | Cobertura |
|---|---|---|
| `Domain.test.js` | 44 | RouletteNumber, PredictionTarget, PredictionRecord, SpinOutcomeRecord, EvidenceStatus, deepFreeze, metadata, chronology |
| `Repository.test.js` | 18 | save/get, duplicados, contradicciones, idempotencia, ordenamiento, temporal anti-leakage |
| `UseCases.test.js` | 12 | Flujos completos, backward compat, temporal integrity end-to-end |

---

## 4. Verificación

```
npm test   → 708 tests passed (45 files), 0 failures
npm run lint → 0 warnings, 0 errors
npm run build → OK (chunk warning preexistente, no relacionado)
```

---

## 5. Archivos Modificados / Creados

### Nuevos (5)
- `src/historical-evidence/domain/RouletteNumber.js`
- `src/historical-evidence/domain/PredictionTarget.js`
- `src/historical-evidence/domain/immutable.js`
- `src/historical-evidence/domain/metadata.js`
- `src/historical-evidence/domain/chronology.js`

### Reescribidos (11)
- `src/historical-evidence/domain/PredictionRecord.js`
- `src/historical-evidence/domain/OutcomeRecord.js`
- `src/historical-evidence/domain/EvidenceStatus.js`
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/index.js`
- `src/historical-evidence/application/EvidenceRepository.js`
- `src/historical-evidence/application/RecordPredictionUseCase.js`
- `src/historical-evidence/application/RecordOutcomeUseCase.js`
- `src/historical-evidence/application/GetEvidenceBySpinUseCase.js`
- `src/historical-evidence/infrastructure/InMemoryEvidenceRepository.js`
- `src/historical-evidence/index.js`

### Reescribidos (tests)
- `tests/historical-evidence/Domain.test.js`
- `tests/historical-evidence/Repository.test.js`
- `tests/historical-evidence/UseCases.test.js`

---

## 6. Principios Aplicados

- **Seguridad**: Sin `Math.random()`, timestamps inyectados, IDs caller-provided
- **Inmutabilidad**: `deepFreeze` recursivo con detección de ciclos
- **Temporalidad**: `validateChronology` previene fugas (predicción no puede ser posterior al outcome)
- **Validación canónica**: Números validados contra `AMERICAN_ROULETTE_NUMBERS` (fuente única de verdad)
- **Extensibilidad**: `PredictionTarget` diseñado para nuevos tipos sin romper contratos
- **Backward compat**: `createOutcomeRecord` wrapper y `{ number }` shortcut en use case mantienen compatibilidad
- **Explicit contracts**: Todos los campos requeridos son validados; nada es opcional sin justificación
