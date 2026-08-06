# INFORME FINAL — FASE 2.3.4.1

Dataset Version, Scientific Identity and Snapshot Descriptor

- Timestamp (ISO 8601): 2026-08-01T13:55:00.000Z
- Fase: 2.3.4.1 (subfase de 2.3.4 — versionado/identidad/snapshot del dataset)
- Prompt de origen: `reports/fase2.3.4.1.md`
- Nota técnica: `reports/trabajo/Fase2.3.4.1_nota_tecnica_diseno.md`
- Estado: COMPLETADA — veredicto APROBADO

---

## 1. Objetivo

Añadir a `src/historical-evidence/` tres contratos nuevos de dominio (sin
modificar el pipeline de ensamblado ni los hashes):

1. `DatasetVersion` — versión del artefacto dataset/snapshot en `major.minor.patch`
   (evolución controlada del artefacto, no sustituye a `schemaVersion`).
2. `DatasetIdentity` — identidad científica inmutable y auditable del dataset
   (datasetId + datasetVersion + schemaVersion + observationSchemaVersion +
   contentHash + manifestHash). Hashes SIEMPRE arrastrados, nunca recalculados.
3. `DatasetSnapshotDescriptor` — descriptor auditivo inmutable (identidad +
   createdAt + periodo + manifest/statistics por REFERENCIA, sin duplicar
   observaciones) + factory de aplicación que lo deriva de un dataset real.

## 2. Arquitectura encontrada (resumen)

- Capas: `domain/` (VOs funcionales congelados con `deepFreeze`), `application/`
  (DatasetBuilder, BuildHistoricalDatasetUseCase), `infrastructure/`.
- `HistoricalCalibrationDataset`: `schemaVersion='1'`, `observationSchemaVersion='1'`,
  `contentHash` (contenido científico), `manifestHash` (manifiesto completo).
- SHA-256 hex lowercase 64 chars (`HEX64`); serialización canónica vía
  `src/calibration/CanonicalHash.js` — reutilizada, no duplicada.
- `deepFreeze` rechaza class instances, Map/Set/Date, funciones, ciclos → los VOs
  de dominio son objetos planos congelados; los namespaces de API se congelan con
  `Object.freeze`.
- Errores tipados: base `EvidenceError` → `DatasetError` + subclases.

## 3. Contratos implementados

### 3.1 DatasetVersion (`src/historical-evidence/domain/DatasetVersion.js`)

- `createDatasetVersion(major, minor, patch)` → VO plano congelado
  `{ major, minor, patch }`; enteros >= 0 validados (`Number.isSafeInteger`).
- `parseDatasetVersion('1.2.3')`, `datasetVersionToString(v)`,
  `datasetVersionToJSON(v)`, `compareDatasetVersions(a, b)` (−1/0/+1),
  `datasetVersionsEqual(a, b)`, `isDatasetVersion(value)` (guard booleano puro).
- Namespace de API `DatasetVersion` congelado con `Object.freeze`.

### 3.2 Política de compatibilidad (`DatasetVersionPolicy.js`)

- `VERSION_COMPATIBILITY`: `IDENTICAL`, `BACKWARD_COMPATIBLE`, `FORWARD_COMPATIBLE`,
  `INCOMPATIBLE`.
- Direccional: major distinto → INCOMPATIBLE; mismo major → compara (minor, patch);
  current > other → BACKWARD_COMPATIBLE; current < other → FORWARD_COMPATIBLE.
- `assertDatasetVersionCompatible(current, other)` lanza
  `IncompatibleDatasetVersionError` (con `current`/`other` canónicos) salvo
  INCOMPATIBLE... (solo rechaza major distinto).
- La política NO migra datos, NO reinterpreta observaciones, NO modifica nada.

### 3.3 DatasetIdentity (`DatasetIdentity.js`)

- `createDatasetIdentity({ datasetId, datasetVersion, schemaVersion,
  observationSchemaVersion, contentHash, manifestHash })` → VO plano congelado.
- `datasetId` no vacío (trim); hashes validados contra `HEX64`
  (64 hex lowercase) — reutilizado vía export desde `HistoricalCalibrationDataset.js`.
- `isDatasetIdentityScientificallyEquivalent(a, b)`: compara el contenido
  científico (schemaVersion, observationSchemaVersion, contentHash, datasetVersion).
- `isDatasetIdentityOperationallyEquivalent(a, b)`: datasetId + manifestHash
  (identidad operativa).
- `datasetIdentityToJSON`, `isDatasetIdentity`, namespace `DatasetIdentity`
  congelado.

### 3.4 DatasetSnapshotDescriptor (`DatasetSnapshotDescriptor.js`)

- `createDatasetSnapshotDescriptor({ identity, createdAt, period, manifest,
  statistics, policies, filters, provenance, lineage, metadata })` → objeto plano
  congelado; validación all-or-nothing.
- `manifest`/`statistics` por REFERENCIA (sin copia de observaciones); `policies`
  y `filters` congelados como copias (sin aliasing mutable).
- `createdAt` ISO 8601 UTC validado; `metadata` vía `normaliseMetadata` con
  propagación de `InvalidMetadataError`; campos opcionales → `null`.

### 3.5 Factory de aplicación (`application/DatasetSnapshotDescriptorFactory.js`)

- `new DatasetSnapshotDescriptorFactory().create({ dataset, datasetVersion,
  createdAt, provenance, lineage, metadata })`.
- Valida que el input sea un dataset ensamblado real (8 claves requeridas);
  deriva la identidad ARRASTRANDO contentHash/manifestHash (nunca los recalcula);
  deriva `policies` del manifest.options (duplicatePolicy,
  invalidObservationPolicy, unsupportedSchemaPolicy + temporalPolicy
  `INCLUSIVE_FROM_TO`); copia filters aplicados; inyecta datasetVersion/createdAt/
  provenance/lineage/metadata por llamada (sin reloj global ni ids aleatorios).
- NO persiste, exporta, entrena ni promueve nada.

### 3.6 Errores tipados nuevos (`domain/errors.js`)

- `InvalidDatasetVersionError` — `INVALID_DATASET_VERSION`
- `IncompatibleDatasetVersionError` — `INCOMPATIBLE_DATASET_VERSION`
- `InvalidDatasetIdentityError` — `INVALID_DATASET_IDENTITY`
- `InvalidSnapshotDescriptorError` — `INVALID_SNAPSHOT_DESCRIPTOR`

### 3.7 Barrels actualizados

- `domain/index.js`: 4 errores + DatasetVersion (6 exports) + política (2) +
  DatasetIdentity (5) + descriptor (1).
- `application/index.js`: `DatasetSnapshotDescriptorFactory`,
  `SNAPSHOT_TEMPORAL_POLICY`.
- `src/historical-evidence/index.js`: re-export de todo lo anterior.

## 4. Tamaño del cambio

| Artefacto | Líneas |
|---|---|
| domain/DatasetVersion.js | 203 |
| domain/DatasetVersionPolicy.js | 81 |
| domain/DatasetIdentity.js | 211 |
| domain/DatasetSnapshotDescriptor.js | 228 |
| application/DatasetSnapshotDescriptorFactory.js | 102 |
| **Total implementación** | **825** |
| tests (5 archivos) | 990 |

## 5. Verificación

### 5.1 Tests focalizados (5 archivos, 87 tests)

| Archivo | Tests |
|---|---|
| DatasetVersion.test.js | 25 |
| DatasetVersionPolicy.test.js | 11 |
| DatasetIdentity.test.js | 21 |
| DatasetSnapshotDescriptor.test.js | 18 |
| DatasetSnapshotDescriptorFactory.test.js | 12 |
| **Total** | **87** |

`npx vitest run <5 archivos>` → **87 passed (87)** en 720 ms.

Correcciones aplicadas durante el ciclo (tarea 11):
1. `DatasetIdentity.js`: `assertNonEmptyString` ahora rechaza strings de solo
   espacios (blank) además de vacíos.
2. `DatasetSnapshotDescriptor.js`: `normaliseMetadata` envuelto → los errores de
   metadata se propagan como `InvalidMetadataError` (no TypeError interno de
   deepFreeze).
3. Tests corregidos: verificación imposible de prototipo congelado en VO plano;
   plain-object con forma válida no es "no-versión"; helper que lanzaba antes de
   `isDatasetIdentity`; mutación de objeto congelado en test; helper del
   descriptor reconstruía el dataset (referencias distintas).

### 5.2 Puertas de calidad globales

| Puerta | Resultado |
|---|---|
| `npm test` (suite completa) | **919 passed (919)** — 59 archivos, 5.81 s |
| `npm run lint` (eslint, max-warnings 0) | **0 problemas** |
| `npm run build` (vite build) | **✓ built in 304 ms** (solo warning de tamaño de chunk > 500 kB, preexistente) |

## 6. Decisiones clave (resumen)

- `datasetVersion` convive con `schemaVersion`/`observationSchemaVersion` (no los
  sustituye; son contratos estructurales de igualdad exacta).
- `HEX64` reutilizado exportándolo desde `HistoricalCalibrationDataset.js` (DRY,
  sin segunda copia de la constante).
- Hashes de identidad SIEMPRE arrastrados del dataset (nunca recalculados en la
  factory).
- `manifest`/`statistics` referenciados sin duplicación; `policies`/`filters`
  congelados como copias (sin aliasing mutable).
- Sin reloj global, sin `Math.random()`, sin persistencia, sin promoción.

## 7. Veredicto

**APROBADO.** Fase 2.3.4.1 completada: contratos implementados según la nota
técnica, 87 tests focalizados verdes, suite completa 919/919, lint 0, build OK.
No se modificó el pipeline de ensamblado, los hashes ni los schema versions
existentes.

---
*Generado por agente de arquitectura — Fase 2.3.4.1 — 2026-08-01T13:55:00.000Z*
