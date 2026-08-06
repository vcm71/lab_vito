# NOTA TÉCNICA PROVISIONAL — FASE 2.3.4.1

Dataset Version, Scientific Identity and Snapshot Descriptor

Fecha: 2026-08-01
Estado: DISEÑO PREVIO (previo a implementación)
Autor: agente de arquitectura (Fase 2.3.4.1)

---

## 0. Punto de control

- `Fase_2.3.3_cerrada.md`: NO EXISTE en el repositorio (búsquedas `*cerrada*` y
  `*Fase_2.3*` en todo `/home/shared/lab_vito` → 0 resultados, verificadas dos veces).
- Sustituto usado como referencia de la fase anterior:
  `reports/trabajo/Fase2.3.3_historical_dataset_assembly_reporte.md`.
- No se revierte ninguna decisión de Fase 2.3.3; esta subfase solo añade contratos nuevos.

## 1. Arquitectura encontrada

- Capa `src/historical-evidence/` con tres subcapas y barrels:
  - `domain/` — VOs funcionales (factories puras que devuelven objetos planos
    congelados con `deepFreeze`), errores tipados, utilidades de inmutabilidad.
  - `application/` — servicios/clases (DatasetBuilder, BuildHistoricalDatasetUseCase).
  - `infrastructure/` — repositorios en memoria.
  - Barrels: `domain/index.js`, `application/index.js`, `src/historical-evidence/index.js`.
- `HistoricalCalibrationDataset` (domain) — dataset profundo congelado con
  `schemaVersion='1'`, `observationSchemaVersion='1'`, `contentHash` (contenido
  científico excluyendo datasetId/createdAt/manifest/statistics) y `manifestHash`
  (manifiesto completo).
- `DatasetManifest` — procedencia de ensamblado (filters normalizados, políticas,
  exclusiones). `DatasetStatistics` — estadísticas descriptivas puras.
- `DatasetAssemblyOptions` — opciones normalizadas con políticas:
  duplicatePolicy='REJECT', unsupportedSchemaPolicy='REJECT_DATASET',
  invalidObservationPolicy='REJECT_DATASET'|'EXCLUDE_AND_REPORT'; ventanas
  temporales INCLUSIVAS (from <= x <= to).
- `DatasetBuilder` (application) — 10 pasos, SHA-256 canónico vía
  `src/calibration/CanonicalHash.js` (`canonicalHashSync` + `canonicalSerialize`).
- `deepFreeze` (domain/immutable.js) — rechaza class instances, Map/Set/Date,
  funciones, símbolos, ciclos, claves peligrosas.
- Errores tipados: base `EvidenceError`; dataset: `DatasetError` + 8 subclases
  (InvalidDatasetIdError, InvalidDatasetTimestampError, InvalidDatasetOptionsError,
  InvalidDatasetObservationError, UnsupportedObservationSchemaError,
  DuplicateDatasetObservationError, EmptyHistoricalDatasetError, ...).
- `metadata.js` → `normaliseMetadata()` — utilidad segura de metadata (plain object
  congelado o null).

## 2. Convenciones de Value Objects

- Funcionales: `createX(contract)` → objeto plano congelado con `deepFreeze`.
- Sin clases para VOs de dominio (deepFreeze rechaza instancias de clase).
- Validaciones estrictas, errores tipados deterministas con `code` máquina-legible.
- Timestamps ISO 8601 UTC inyectados; sin reloj global; sin Math.random().

## 3. Estrategia de errores

Reutilizar `DatasetError`. Nuevos errores en `domain/errors.js`:

- `InvalidDatasetVersionError` — code `INVALID_DATASET_VERSION`
- `IncompatibleDatasetVersionError` — code `INCOMPATIBLE_DATASET_VERSION`
- `InvalidDatasetIdentityError` — code `INVALID_DATASET_IDENTITY`
- `InvalidSnapshotDescriptorError` — code `INVALID_SNAPSHOT_DESCRIPTOR`

Todos: mensajes deterministas, contexto seguro, tests exactos.

## 4. Estrategia de inmutabilidad

- Única implementación de deepFreeze existente (domain/immutable.js). Sin segunda copia.
- `DatasetVersion` → objeto plano congelado `{ major, minor, patch }`.
- `DatasetIdentity` → objeto plano congelado; `datasetVersion` dentro es un objeto
  plano congelado (compatible con deepFreeze).
- `DatasetSnapshotDescriptor` → objeto plano congelado; metadata vía
  `normaliseMetadata`; provenance/lineage/filters congelados.
- Namespaces de API (`DatasetVersion`, `DatasetIdentity`) congelados con
  `Object.freeze` (contienen funciones; deepFreeze las rechazaría).

## 5. Formato actual de versiones

- `schemaVersion` (dataset): string '1' — `HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION`.
- `observationSchemaVersion` (observación): string '1' — `CALIBRATION_OBSERVATION_SCHEMA_VERSION`.
- `DATASET_MANIFEST_SCHEMA_VERSION` = '1', `DATASET_STATISTICS_SCHEMA_VERSION` = '1',
  `DATASET_ASSEMBLY_OPTIONS_SCHEMA_VERSION` = '1', `DATASET_BUILDER_VERSION` = '1'.
- NO existe hoy `datasetVersion` (major.minor.patch). Es el concepto nuevo de esta fase.
- Los schema versions actuales son contratos estructurales de igualdad exacta:
  el builder REJECTA cualquier schemaVersion != '1' (unsupportedSchemaPolicy=REJECT_DATASET).

## 6. Formato actual de hashes

- SHA-256 hex lowercase de 64 chars (`/^[0-9a-f]{64}$/`, constante HEX64 en
  HistoricalCalibrationDataset.js).
- Serialización canónica: `canonicalSerialize` (claves ordenadas) en
  src/calibration/CanonicalHash.js. Se REUTILIZA, no se duplica.
- `contentHash`: contenido científico (schema versions, periodo, observaciones);
  excluye datasetId, createdAt, manifest, statistics.
- `manifestHash`: manifiesto operativo completo.

## 7. Relación datasetVersion ↔ schemaVersion ↔ observationSchemaVersion

- `schemaVersion` = contrato estructural del dataset (igualdad exacta, string '1').
- `observationSchemaVersion` = contrato estructural de cada observación (igualdad exacta, string '1').
- `datasetVersion` (NUEVO, major.minor.patch) = versión del artefacto dataset/snapshot
  (evolución controlada). NO sustituye a schemaVersion; conviven en `DatasetIdentity`.
- Política de compatibilidad (direccional, documentada):
  - major distinto → INCOMPATIBLE (por defecto).
  - mismo major: comparación (minor, patch) — current > other → BACKWARD_COMPATIBLE;
    current < other → FORWARD_COMPATIBLE; idénticos → IDENTICAL.
  - La política NO migra datos, NO reinterpreta observaciones, NO modifica nada.
  - schemaVersion/observationSchemaVersion siguen exigiendo igualdad exacta
    (contratos estructurales); la política de DatasetVersion es para el artefacto.
- No se combinan las tres versiones en un único string sin semántica.

## 8. Archivos que se crearán

- src/historical-evidence/domain/DatasetVersion.js
- src/historical-evidence/domain/DatasetVersionPolicy.js
- src/historical-evidence/domain/DatasetIdentity.js
- src/historical-evidence/domain/DatasetSnapshotDescriptor.js
- src/historical-evidence/application/DatasetSnapshotDescriptorFactory.js
- tests/historical-evidence/DatasetVersion.test.js
- tests/historical-evidence/DatasetVersionPolicy.test.js
- tests/historical-evidence/DatasetIdentity.test.js
- tests/historical-evidence/DatasetSnapshotDescriptor.test.js
- tests/historical-evidence/DatasetSnapshotDescriptorFactory.test.js
- reports/trabajo/FASE_2.3.4.1_DATASET_VERSION_IDENTITY_SNAPSHOT_REPORT.md (informe final)
- Fase_2.3.4.1_cerrada.md (punto de control, en reports/ raíz; no existe convención previa)

## 9. Archivos que se modificarán

- src/historical-evidence/domain/errors.js (4 errores nuevos)
- src/historical-evidence/domain/HistoricalCalibrationDataset.js (exportar HEX64 para reuso)
- src/historical-evidence/domain/index.js (exports nuevos)
- src/historical-evidence/application/index.js (factory)
- src/historical-evidence/index.js (barrel raíz)

## 10. Riesgos de compatibilidad

- Añadir exports a barrels: sin test de superficie exacta (verificado), riesgo bajo.
- deepFreeze rechaza instancias de clase → DatasetVersion DEBE ser objeto plano.
- `DatasetIdentity` contiene `datasetVersion` (objeto plano) → deepFreeze OK.
- Factory recibe datasetVersion/createdAt/provenance/lineage por inyección
  (sin reloj global, sin IDs propios, sin hashes calculados).
- No se toca el orden canónico, políticas de dataset, ni IdentityCalibration.

## 11. Criterios de aceptación

Ver checklist del prompt (§23): baseline comprobado; DatasetVersion, política,
DatasetIdentity (científica vs operativa), DatasetSnapshotDescriptor, factory,
timestamps/IDs inyectados; sin Math.random(); sin reloj global; sin SHA-256 duplicado;
sin serialización canónica duplicada; sin persistencia/exportadores/entrenamiento/promoción;
tests focalizados PASS; suite completa PASS; lint 0; build OK; informe y checkpoint generados;
sin regresiones.
