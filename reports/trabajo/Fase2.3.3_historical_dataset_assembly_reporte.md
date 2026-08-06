# Fase 2.3.3 — Ensamblaje del Dataset de Calibración Histórica (Reporte)

**Fecha/hora (ISO):** 2026-07-31T02:25:00Z
**Proyecto:** Roulette Tracker Pro — `/home/shared/lab_vito`
**Prompt fuente:** `reports/Fase2.3.3_gpt.md` (2,165 líneas / 42 secciones — leído completo)
**Patrón aplicado:** Fase 2.3.2 (cerrada 9/9)
**Estado:** ✅ COMPLETADA (9/9 pasos)

---

## 1. Resumen ejecutivo

Se implementó el ensamblaje del **dataset de calibración histórica**: un snapshot
científico, inmutable y auditable de las observaciones de calibración
(`CalibrationObservation`, Fase 2.3.2), construido a partir del repositorio
`CalibrationObservationRepository` o de una colección provista.

La capa es **100% pura** (sin side effects): sin persistencia, sin
entrenamiento/calibración de modelos, sin reloj global, sin aleatoriedad.
`datasetId` y `createdAt` son siempre inyectados por el llamador; el hashing
reutiliza el SHA-256 canónico de la Fase P2.2 (`canonicalHashSync`) vía
`hashFn` inyectable.

**Verificación fresca (2026-07-31):**
- Suite completa: **832/832** (54 archivos) — +65 tests nuevos
- Focal `tests/historical-evidence/`: **198/198**
- Lint: **0 warnings** (`eslint tests --max-warnings 0`)
- Build: **✓ 306ms** (warning de chunk >500kB preexistente, no bloqueante)

---

## 2. Respuestas de diseño (4 preguntas por componente)

| Componente | ¿Qué representa en negocio? | Propietario | ¿Quién modifica? | ¿Quién solo lee? |
|---|---|---|---|---|
| `HistoricalCalibrationDataset` | Snapshot científico de observaciones de calibración para evaluación/benchmark | Dominio historical-evidence | Nadie (deep-frozen; solo `DatasetBuilder` lo construye) | Fases futuras (2.3.4, evaluación, benchmark) |
| `DatasetBuilder` | Orquestador puro del ensamblaje (validar→filtrar→dedupe→ordenar→estadísticas→manifiesto→hashes→freeze) | Aplicación | Solo `BuildHistoricalDatasetUseCase` | Tests y fases futuras |
| `DatasetAssemblyOptions` | Contrato inmutable de filtros/políticas de selección | Dominio | Nadie (deep-frozen; normalizado por su factory) | Builder, manifiesto, tests |
| `DatasetManifest` | Procedencia del dataset (origen, filtros activos, exclusiones, versiones) | Dominio | Nadie (construido por el builder) | Auditoría y fases futuras |
| `DatasetStatistics` | Estadísticas descriptivas puras del contenido | Dominio | Nadie (derivado por el builder) | Fases futuras |
| `BuildHistoricalDatasetUseCase` | Servicio de aplicación: lee del repo y delega en el builder | Aplicación | Nadie (sin estado) | UI / fases futuras |

---

## 3. Decisiones clave (documentadas)

1. **Política temporal INCLUSIVA** (`from <= x <= to`) — misma política para
   `predictionCreated` y `outcomeRecorded`.
2. **`duplicatePolicy: 'REJECT'` siempre** — 1 fila = 1 identidad; ni siquiera
   un ID idéntico se fusiona (la idempotencia es responsabilidad del repo).
   `predictionId` es único en el dataset (1 observación por predicción).
3. **`invalidObservationPolicy: 'REJECT_DATASET'` por defecto** (all-or-nothing);
   `EXCLUDE_AND_REPORT` opcional — las filas inválidas se descartan y se
   cuentan en el manifiesto, nunca en silencio.
4. **`unsupportedSchemaPolicy: 'REJECT_DATASET'`** — los schemas nunca se
   mezclan ni migran silenciosamente.
5. **Dataset vacío → `EmptyHistoricalDatasetError`** por defecto; `allowEmpty`
   solo para tests (estadísticas/periodo nulos).
6. **Hashing**: `hashFn` inyectable, default `canonicalHashSync`
   (`src/calibration/CanonicalHash.js`, Fase P2.2). Sin duplicar SHA-256.
   `contentHash` = contenido científico (schemaVersion, observationSchemaVersion,
   periodo, observaciones ordenadas — excluye `datasetId`/`createdAt`);
   `manifestHash` = hash del manifiesto completo.
7. **Orden canónico**: `predictionCreatedAt → spinId → predictionId →
   outcomeId → observationId` (lexicográfico sobre ISO fijo).
8. **Sin `HistoricalDatasetRepository`** — se evitó sobrearquitectura; el
   dataset es un snapshot que las fases futuras consumen en memoria.
9. **IDs y timestamps sin aleatoriedad/reloj**: `datasetId` y `createdAt` son
   inyectados; `datasetIdGenerator` opcional propiedad del llamador.
10. **Errores sobre `DatasetError` → `EvidenceError`** (7 nuevos).

---

## 4. Componentes entregados

### Dominio (`src/historical-evidence/domain/`)
- `DatasetAssemblyOptions.js` — **NUEVO** (220L): opciones normalizadas
  (arrays ordenados+dedupe+freeze), políticas, `isIsoTimestamp`,
  `CANONICAL_SORT_ORDER`, `DATASET_BUILDER_VERSION`.
- `DatasetStatistics.js` — **NUEVO** (101L): agregaciones puras
  (positiveRate, rawScore min/max/mean, effectiveProbability, conteos por
  estrategia/tipo de target, spinCount/predictionCount).
- `DatasetManifest.js` — **NUEVO** (80L): procedencia (origen, filtros,
  exclusiones, sortOrder, versiones, metadata).
- `HistoricalCalibrationDataset.js` — **NUEVO** (216L): contrato central
  (deep-frozen, orden canónico, contentHash/manifestHash, `isSameDatasetContent`,
  `deriveDatasetPeriod`, `canonicalSortObservations`).
- `errors.js` — ampliado: `DatasetError`, `InvalidDatasetIdError`,
  `InvalidDatasetTimestampError`, `InvalidDatasetOptionsError`,
  `InvalidDatasetObservationError`, `UnsupportedObservationSchemaError`,
  `DuplicateDatasetObservationError`, `EmptyHistoricalDatasetError`.
- `index.js` — barrel actualizado (14 exports nuevos).

### Aplicación (`src/historical-evidence/application/`)
- `DatasetBuilder.js` — **NUEVO** (363L): pipeline estricto en 10 pasos,
  all-or-nothing; copia defensiva (nunca muta la entrada); exclusiones
  contadas por razón (primera razón excluyente, orden fijo).
- `BuildHistoricalDatasetUseCase.js` — **NUEVO** (65L): lee del repo
  (`findAll`), delega en el builder, `sourceType: 'IN_MEMORY_REPOSITORY'`.
- `CalibrationObservationRepository.js` — puerto ampliado con `findAll()`.
- `index.js` — exports nuevos.

### Infraestructura (`src/historical-evidence/infrastructure/`)
- `InMemoryCalibrationObservationRepository.js` — implementación de
  `findAll()` (copia defensiva, nunca expone el estado interno).

### Tests (`tests/historical-evidence/`) — 65 tests nuevos
- `DatasetAssemblyOptions.test.js` (10)
- `HistoricalCalibrationDataset.test.js` (12)
- `DatasetStatistics.test.js` (7)
- `DatasetBuilder.test.js` (31)
- `BuildHistoricalDatasetUseCase.test.js` (5)

---

## 5. Bugs encontrados y corregidos durante los tests

1. **Bug raíz de filtros**: los predicados de `applyFilters` se evaluaban
   aunque el filtro estuviera inactivo (`o.predictionCreatedAt >= null` →
   `NaN >= 0` → false) — **todas** las observaciones se excluían. Corregido:
   solo se evalúan filtros activos (null = sin filtro). Causó 28 fallos.
2. **Validación de inmutabilidad**: `createHistoricalCalibrationDataset` no
   exigía observaciones deep-frozen. Añadido el chequeo (invariante del
   snapshot científico).
3. **`isSameDatasetContent`** crasheaba con entradas no-dataset (null).
   Añadido guard de tipos.
4. **`hashFn` no validado** en el builder → `InvalidDatasetOptionsError`.
5. Tests: hashes fake no hex ('h'), `unsupportedSchemaPolicy` faltante en
   defaults, campo `receivedSchema` vs `received`.

---

## 6. Auditoría final (Paso 8)

| Requisito | Verificación | Resultado |
|---|---|---|
| Sin side effects | `DatasetBuilder` copia defensiva `[...observations]`; test "does not mutate the input array" | ✅ |
| Sin persistencia | `BuildHistoricalDatasetUseCase` solo llama `findAll()`; 0 matches de write/save/fs en la capa nueva | ✅ |
| Sin entrenamiento | 0 matches de `calibrate()/fit/train/learn` en la capa | ✅ |
| Sin leakage | Snapshot puro ordenado; los filtros temporales son de selección, no splits (GroupedTemporalSplit/PairedBootstrap quedan en fases de evaluación) | ✅ |
| Sin aleatoriedad/reloj | 0 usos reales de `Math.random/Date.now/new Date()` (3 matches = JSDoc documentando la prohibición) | ✅ |
| Deep-frozen | Entidades de dominio congeladas; validación de frozen en el dataset | ✅ |

---

## 7. Próximos pasos sugeridos

- **Fase 2.3.4**: consumo del dataset (splits grupales temporales con
  `GroupedTemporalSplit`, bootstrap pareado `PairedBootstrap`, leakage
  detector group-aware de la Fase P2.2).
- **Fase 5.1**: Sync Audit de la capa historical-evidence.
- **Fase 5.2.x**: gap fixes derivados del Sync Audit.
- `MonteCarloValidator` sin legacy path.

---

## 8. Comandos de verificación

```bash
npm run test      # 832/832 (54 archivos)
npm run lint      # 0 warnings
npm run build     # ✓ 306ms
npx vitest run tests/historical-evidence/  # 198/198
```
