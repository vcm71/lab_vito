# Punto de control — Fase 2.3.4 cerrada

## Proyecto

**Roulette Tracker Pro**  
Nombre anterior: **ORION / ORION_v2**  
Repositorio de trabajo: `/home/shared/lab_vito`

## Fecha del punto de control

2026-08-01

## Estado

```text
FASE 2.3.4: CERRADA
ESTADO TÉCNICO: APROBADO
PIPELINE: GREEN
```

## Propósito

Este documento consolida el estado del proyecto al cierre completo de la:

> **Fase 2.3.4 — Dataset Versioning, Canonical Serialization and Integrity Verification**

Debe utilizarse como documento principal de reanudación para preservar el contexto arquitectónico y científico, evitar repetir auditorías, mantener las decisiones técnicas vigentes, impedir regresiones y continuar directamente con la Fase 2.3.5.

---

# 1. Resumen ejecutivo

La Fase 2.3.4 cerró la infraestructura de identidad, representación, verificación, comparación y trazabilidad lógica de los datasets históricos de Roulette Tracker Pro.

El bloque implementado permite:

1. representar versiones explícitas de datasets;
2. distinguir identidad científica e identidad operativa;
3. describir snapshots históricos sin duplicar observaciones;
4. serializar datasets y descriptores de forma canónica;
5. preservar y verificar `contentHash` y `manifestHash`;
6. detectar corrupción o inconsistencias mediante reportes de integridad;
7. comparar datasets de forma determinista;
8. distinguir igualdad exacta, equivalencia científica, equivalencia operativa, evolución compatible, divergencia e incompatibilidad;
9. resolver relaciones lógicas de lineage utilizando integridad, comparación, versiones y provenance;
10. auditar toda la arquitectura y cerrar formalmente la fase.

No se implementaron persistencia durable, exportadores, deserialización, migración de schemas, reparación automática, merge automático, grafo persistente de lineage, entrenamiento, selección de modelos, promoción de calibradores ni integración productiva automática.

---

# 2. Estado técnico consolidado

El último baseline cuantificado antes de la auditoría final fue:

```text
SUITE COMPLETA: 940/940 PASS
ARCHIVOS DE TEST: 63
LINT: OK
BUILD: OK
PIPELINE: GREEN
```

La Fase 2.3.4.6 volvió a ejecutar y aprobar:

```text
npm run test
npm run lint
npm run build
```

El informe final de hardening no registró un nuevo número total de tests. Por ello:

```text
BASELINE CUANTIFICADO OFICIAL: 940/940 PASS
VALIDACIÓN FINAL DE CIERRE: PASS
```

Warnings conocidos y no bloqueantes:

```text
AtRepRenderer: contenedor ausente en test de stub
P2.2 Synthetic Benchmark: INSUFFICIENT_EVIDENCE
Vite: chunk mayor a 500 kB
```

---

# 3. Cadena científica vigente

```text
ConsensusOutput
      │
      ▼
ConsensusToPredictionMapper
      │
      ▼
PredictionRecord
      │
      ▼
SpinOutcomeRecord
      │
      ▼
CalibrationObservation
      │
      ▼
HistoricalCalibrationDataset
```

La Fase 2.3.4 agregó:

```text
HistoricalCalibrationDataset
      │
      ├──► DatasetVersion
      ├──► DatasetIdentity
      ├──► DatasetSnapshotDescriptor
      ├──► Canonical Serialization
      ├──► DatasetIntegrityVerifier
      ├──► DatasetComparator
      └──► DatasetLineageResolver
```

---

# 4. Principios arquitectónicos vigentes

Toda fase posterior debe preservar:

1. modularidad;
2. separación entre dominio, aplicación e infraestructura;
3. reproducibilidad;
4. determinismo;
5. inmutabilidad profunda;
6. prevención explícita de data leakage;
7. separación entre captura, dataset, entrenamiento e inferencia;
8. asociación por `spinId`, nunca por posición o proximidad temporal;
9. IDs inyectados;
10. timestamps inyectados;
11. ausencia de `Math.random()` en contratos científicos;
12. ausencia de reloj global en dominio científico;
13. serialización canónica como única fuente de representación;
14. SHA-256 oficial sin implementaciones paralelas;
15. ausencia de efectos secundarios ocultos;
16. separación entre identidad científica e identidad operativa;
17. no promoción con datos sintéticos;
18. `IdentityCalibration` como default;
19. datasets all-or-nothing;
20. evolución explícita de schemas y versiones.

---

# 5. Subfases cerradas

## 5.1 Fase 2.3.4.1 — Dataset Version, Scientific Identity and Snapshot Descriptor

Se implementó:

```text
DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory
```

Resultado informado:

```text
TESTS FOCALIZADOS: 87/87 PASS
SUITE COMPLETA: 919/919 PASS
ARCHIVOS DE TEST: 59
LINT: 0 problemas
BUILD: OK
```

Decisiones principales:

- `DatasetVersion` usa formato `major.minor.patch`.
- `datasetVersion`, `schemaVersion` y `observationSchemaVersion` son conceptos diferentes.
- `DatasetIdentity` no recalcula hashes.
- `contentHash` representa identidad científica.
- `datasetId` y `manifestHash` participan en identidad operativa.
- Dos snapshots operativamente distintos pueden ser científicamente equivalentes.
- `DatasetSnapshotDescriptor` no duplica observaciones.
- La factory arrastra hashes, periodo, manifest y estadísticas.

## 5.2 Fase 2.3.4.2 — Canonical Dataset Serialization

APIs consolidadas:

```text
canonicalSerialize
canonicalHashSync
canonicalHash
serializeScientificDataset
serializeDatasetIdentity
serializeDatasetManifest
serializeDatasetStatistics
serializeDatasetSnapshotDescriptor
projectScientificDataset
projectObservation
```

Resultado informado:

```text
TESTS FOCALIZADOS: 42/42 PASS
SUITE COMPLETA: 925/925 PASS
LINT: OK
BUILD: OK
```

La serialización canónica admite strings, booleanos, números finitos, `null`, arrays y objetos planos. Rechaza `undefined`, funciones, símbolos, `bigint`, números no finitos, ciclos, tipos no soportados y huecos inválidos en arrays.

Errores tipados:

```text
UnsupportedCanonicalTypeError
InvalidCanonicalNumberError
CircularCanonicalReferenceError
```

La proyección científica incluye:

```text
schemaVersion
observationSchemaVersion
period
observations
```

Excluye:

```text
datasetId
createdAt
```

`DatasetBuilder` reutiliza la proyección oficial para `contentHash` y comparación de duplicados.

## 5.3 Fase 2.3.4.3 — Dataset Integrity Verification

Se implementó:

```text
DatasetIntegrityVerifier
DatasetIntegrityReport
DatasetIntegrityStatus
IntegrityVerificationMode
```

Modos:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

Checks:

```text
CONTENT_HASH
DATASET_SCHEMA
OBSERVATION_SCHEMA
CANONICAL_ORDER
DUPLICATES
CHRONOLOGY
STATISTICS
SCIENTIFIC_STRUCTURE
MANIFEST_HASH
DATASET_IDENTITY
SNAPSHOT_DESCRIPTOR
IMMUTABILITY
```

Resultado validado:

```text
HISTORICAL-EVIDENCE: 296/296 PASS
CANONICAL HASH: 8/8 PASS
SUITE COMPLETA: 931/931 PASS
ARCHIVOS DE TEST: 61
LINT: OK
BUILD: OK
```

Un dataset corrupto produce un reporte inválido; no se repara ni se muta.

## 5.4 Fase 2.3.4.4 — Deterministic Dataset Comparison and Scientific Equivalence

Se implementó:

```text
DatasetComparator
DatasetComparisonReport
DatasetComparisonClassification
DatasetDifference
DatasetDifferenceCategory
DatasetComparisonMode
```

Clasificaciones:

```text
EXACT_MATCH
SCIENTIFICALLY_EQUIVALENT
OPERATIONALLY_EQUIVALENT
COMPATIBLE_EVOLUTION
DIVERGENT
INCOMPATIBLE
INDETERMINATE
```

Resultado informado:

```text
SUITE COMPLETA: 936/936 PASS
ARCHIVOS DE TEST: 62
LINT: OK
BUILD: OK
```

La comparación pre-valida integridad, usa identidades lógicas y no compara por posición.

## 5.5 Fase 2.3.4.5 — Dataset Lineage and Version Relationships

Se implementó:

```text
DatasetLineageRelation
DatasetLineageRelationType
DatasetLineageResolution
DatasetLineageResolver
```

Reutiliza:

```text
DatasetComparator
DatasetIntegrityVerifier
DatasetVersionPolicy
provenance
```

Escenarios documentados:

```text
datasets idénticos → equivalencia científica y operacional
parentaje declarado con reemplazo → PARENT_OF + SUPERSEDES
siblings divergentes con fuente compartida → MERGE_CANDIDATE
incompatibilidad no reconciliable → INCOMPATIBLE
```

Resultado informado:

```text
SUITE COMPLETA: 940/940 PASS
ARCHIVOS DE TEST: 63
LINT: OK
BUILD: OK
```

Lineage no se deduce solo por similitud, extensión o versión mayor.

Corrección documental:

```text
Nombre canónico:
reports/trabajo/Fase2.3.4.5_dataset_lineage_reporte.md

Alias conservado:
reports/trabajo/Fase5.6.1_lineage_resolution_reporte.md
```

## 5.6 Fase 2.3.4.6 — Hardening, Integrated Audit and Formal Closure

Se auditó:

- versionado;
- identidad;
- descriptor;
- serialización canónica;
- hashing;
- integridad;
- comparación;
- lineage;
- provenance;
- inmutabilidad;
- errores tipados;
- exports;
- dependencias.

Puertas ejecutadas:

```text
npm run test     PASS
npm run lint     PASS
npm run build    PASS
```

Hallazgos consolidados:

- dirección de dependencias correcta: `application → domain`;
- sin imports inversos críticos;
- lineage reutiliza comparator, integrity verifier y version policy;
- sin serializadores paralelos con semántica divergente;
- integración coherente entre subfases;
- discrepancia documental de lineage normalizada;
- Fase 2.3.4 formalmente cerrada.

---

# 6. Arquitectura actual de historical-evidence

Estructura conceptual consolidada:

```text
src/historical-evidence/
├── domain/
│   ├── RouletteNumber
│   ├── PredictionTarget
│   ├── PredictionRecord
│   ├── SpinOutcomeRecord
│   ├── EvidenceStatus
│   ├── CalibrationObservation
│   ├── PredictionTargetEvaluator
│   ├── ObservationIdentity
│   ├── DatasetAssemblyOptions
│   ├── DatasetManifest
│   ├── DatasetStatistics
│   ├── HistoricalCalibrationDataset
│   ├── DatasetVersion
│   ├── DatasetVersionPolicy
│   ├── DatasetIdentity
│   ├── DatasetSnapshotDescriptor
│   ├── DatasetIntegrityReport
│   ├── DatasetComparisonReport
│   ├── DatasetComparisonClassification
│   ├── DatasetDifference
│   ├── DatasetLineageRelation
│   ├── DatasetLineageRelationType
│   ├── DatasetLineageResolution
│   ├── immutable
│   ├── metadata
│   ├── chronology
│   └── errors
│
├── application/
│   ├── EvidenceRepository
│   ├── CalibrationObservationRepository
│   ├── RecordPredictionUseCase
│   ├── RecordOutcomeUseCase
│   ├── GetEvidenceBySpinUseCase
│   ├── ObservationBuilder
│   ├── BuildObservationsBySpinUseCase
│   ├── DatasetBuilder
│   ├── BuildHistoricalDatasetUseCase
│   ├── DatasetSnapshotDescriptorFactory
│   ├── CanonicalDatasetSerializer
│   ├── DatasetIntegrityVerifier
│   ├── DatasetComparator
│   ├── DatasetLineageResolver
│   └── mappers/
│       └── ConsensusToPredictionMapper
│
├── infrastructure/
│   ├── InMemoryEvidenceRepository
│   └── InMemoryCalibrationObservationRepository
│
└── index.js
```

La estructura exacta debe confirmarse en el repositorio antes de modificar archivos.

---

# 7. Contratos principales

## `DatasetVersion`

Representa la versión del artefacto dataset:

```text
major.minor.patch
```

No representa `schemaVersion` ni `observationSchemaVersion`.

## `DatasetIdentity`

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

## `DatasetSnapshotDescriptor`

Describe el snapshot sin duplicar observaciones.

## `DatasetIntegrityReport`

Estados:

```text
VALID
INVALID
INCOMPLETE
```

## `DatasetComparisonReport`

Clasificaciones:

```text
EXACT_MATCH
SCIENTIFICALLY_EQUIVALENT
OPERATIONALLY_EQUIVALENT
COMPATIBLE_EVOLUTION
DIVERGENT
INCOMPATIBLE
INDETERMINATE
```

## `DatasetLineageResolution`

Representa relaciones de procedencia o evolución demostrables.

---

# 8. Orden canónico vigente

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

No debe modificarse sin versión, pruebas, documentación y análisis de hashes.

---

# 9. Políticas vigentes

```text
duplicatePolicy = REJECT
invalidObservationPolicy = REJECT_DATASET
unsupportedSchemaPolicy = REJECT_DATASET
```

Política temporal:

```text
from <= timestamp <= to
```

Cronología:

```text
predictionCreatedAt <= outcomeRecordedAt
```

---

# 10. Hashing e integridad

## `contentHash`

Incluye:

```text
schemaVersion
observationSchemaVersion
period
observations ordenadas
```

Excluye:

```text
datasetId
createdAt
```

## `manifestHash`

Representa el manifiesto operativo completo.

Fuente única:

```text
canonicalSerialize
canonicalHashSync
canonicalHash
```

---

# 11. Lineage y provenance

Lineage debe basarse en:

```text
integridad válida
+
comparación coherente
+
versiones compatibles
+
provenance validada
```

No debe basarse únicamente en similitud, orden temporal, versión mayor, inclusión de observaciones o proximidad de timestamps.

---

# 12. Decisiones que no deben revertirse

1. `IdentityCalibration` permanece como default.
2. No promover con datos sintéticos.
3. No modificar probabilidades calibradas automáticamente.
4. No aceptar `observedOutcome` externo.
5. No relacionar evidencia por posición o proximidad temporal.
6. No usar `Math.random()` en contratos científicos.
7. No usar timestamps como identidad única.
8. No introducir reloj global en dominio.
9. No duplicar serialización canónica ni SHA-256.
10. No permitir schemas incompatibles ni datasets parciales.
11. No reparar corrupción automáticamente.
12. No comparar sin prevalidación de integridad.
13. No inferir lineage sin evidencia suficiente.
14. No inferir parent directo solo por extensión compatible.
15. No inferir `SUPERSEDES` solo por versión mayor.
16. No implementar merge automático dentro de lineage.
17. No crear un grafo persistente antes de una fase explícita.

---

# 13. Fuera de alcance actual

Todavía no existen:

- persistencia durable;
- repositorios de snapshots;
- SQLite, DuckDB o PostgreSQL;
- filesystem snapshots;
- storage remoto;
- exportadores CSV, JSONL, Parquet o Arrow;
- deserialización;
- importación;
- migración automática;
- reparación automática;
- merge automático;
- grafo persistente de lineage;
- búsqueda global de ancestros o descendientes;
- entrenamiento;
- Brier Score, Log Loss, ECE o MCE;
- bootstrap o intervalos de confianza;
- model selection;
- ranking de calibradores;
- `PromotionPolicy`;
- captura productiva automática;
- UI para estas capacidades.

---

# 14. Estado Git

Durante las subfases se informó:

```text
WORKSPACE DIRTY
```

El pipeline verde valida funcionamiento, pero el diff global no puede atribuirse completamente a una sola subfase.

Antes de continuar:

```bash
cd /home/shared/lab_vito
git status --short
git branch --show-current
git log -1 --oneline
git diff --stat
```

No ejecutar `git add .`, `git reset --hard` ni `git clean -fd` sin aislar alcance.

---

# 15. Archivos de referencia

```text
Fase_2.3.3_cerrada.md
Fase_2.3.4.1_cerrada.md
Fase_2.3.4.2_cerrada.md
Fase_2.3.4.3_cerrada.md
Fase_2.3.4.4_cerrada.md
Fase_2.3.4.5_cerrada.md
Fase_2.3.4.6_cerrada.md

reports/trabajo/Fase2.3.4.1_dataset_version_identity_snapshot_reporte.md
reports/trabajo/Fase2.3.4.1_nota_tecnica_diseno.md
reports/trabajo/Fase2.3.4.2_canonical_serialization_reporte.md
reports/trabajo/Fase2.3.4.2_nota_tecnica_diseno.md
reports/trabajo/Fase2.3.4.3_dataset_integrity_verification_reporte.md
reports/trabajo/Fase2.3.4.3_nota_tecnica_diseno.md
reports/trabajo/Fase2.3.4.4_dataset_comparison_reporte.md
reports/trabajo/Fase2.3.4.5_dataset_lineage_reporte.md
reports/trabajo/Fase5.6.1_lineage_resolution_reporte.md
reports/trabajo/Fase2.3.4.6_hardening_integrated_audit_formal_closure_reporte.md
```

---

# 16. Validación recomendada al reanudar

```bash
cd /home/shared/lab_vito

git status --short
git branch --show-current
git log -1 --oneline

npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

Revisar `package.json` y ejecutar, solo si existen:

```bash
npm run check:architecture
npm run test:architecture
npm run check:anti-legacy
```

---

# 17. Próxima fase recomendada

> **Fase 2.3.5 — Grouped Temporal Dataset Splitting**

Debe reutilizar, si existen realmente:

```text
GroupedTemporalSplit
leakage detector
PairedBootstrap
agrupación por spin
separación temporal
reproducibilidad
```

Objetivos esperados:

- dividir datasets por tiempo;
- mantener juntas las observaciones de una misma tirada;
- evitar data leakage;
- impedir que una tirada aparezca en train y test;
- definir splits deterministas;
- separar selección de modelos del conjunto final de test;
- mantener trazabilidad entre dataset fuente y particiones.

No implementar todavía entrenamiento, promoción, persistencia, exportadores, UI ni captura productiva.

---

# 18. Prompt de reanudación recomendado

```text
Continuemos Roulette Tracker Pro desde el punto de control
"Fase_2.3.4_cerrada.md".

Repositorio:
`/home/shared/lab_vito`

Estado validado:
- Fase 2.3.4 CERRADA
- último baseline cuantificado: 940/940 tests PASS
- 63 archivos de test
- lint OK
- build OK
- pipeline GREEN
- DatasetVersion implementado
- DatasetIdentity implementado
- DatasetSnapshotDescriptor implementado
- serialización canónica pública implementada
- contentHash y manifestHash preservados
- DatasetIntegrityVerifier implementado
- DatasetComparator implementado
- DatasetLineageResolver implementado
- hardening y auditoría integrada completados
- sin persistencia
- sin exportadores
- sin deserialización
- sin migración
- sin entrenamiento
- sin promoción
- IdentityCalibration continúa como default

Objetivo:
Diseñar y ejecutar la Fase 2.3.5 —
Grouped Temporal Dataset Splitting.

Primero:
1. lee este punto de control;
2. inspecciona el repositorio;
3. confirma el baseline;
4. revisa los contratos existentes de splitting y leakage;
5. no repitas la Fase 2.3.4;
6. no entrenes ni promociones modelos;
7. no modifiques producción sin una fase explícita.
```

---

# 19. Veredicto final

```text
FASE 2.3.4: CERRADA
ESTADO TÉCNICO: PASS
PIPELINE: GREEN

DATASET VERSIONING: IMPLEMENTADO Y VALIDADO
SCIENTIFIC IDENTITY: IMPLEMENTADA Y VALIDADA
OPERATIONAL IDENTITY: IMPLEMENTADA Y VALIDADA
SNAPSHOT DESCRIPTOR: IMPLEMENTADO Y VALIDADO
CANONICAL SERIALIZATION: IMPLEMENTADA Y VALIDADA
CONTENT HASH: PRESERVADO Y VERIFICABLE
MANIFEST HASH: PRESERVADO Y VERIFICABLE
DATASET INTEGRITY: IMPLEMENTADA Y VALIDADA
DATASET COMPARISON: IMPLEMENTADA Y VALIDADA
SCIENTIFIC EQUIVALENCE: IMPLEMENTADA Y VALIDADA
DATASET LINEAGE: IMPLEMENTADO Y VALIDADO
PROVENANCE: AUDITADA
INMUTABILIDAD: VALIDADA
DEPENDENCIAS: AUDITADAS
DOCUMENTACIÓN: NORMALIZADA

ÚLTIMO BASELINE CUANTIFICADO: 940/940 PASS
ARCHIVOS DE TEST: 63
LINT: OK
BUILD: OK

PERSISTENCIA DURABLE: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
DESERIALIZACIÓN: NO IMPLEMENTADA
MIGRACIÓN: NO IMPLEMENTADA
AUTOMATIC MERGE: NO IMPLEMENTADO
AUTOMATIC REPAIR: NO IMPLEMENTADA
ENTRENAMIENTO: NO AUTORIZADO
MODEL SELECTION: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA
IDENTITYCALIBRATION: DEFAULT
```

Roulette Tracker Pro dispone ahora de infraestructura lógica y científica para versionar, identificar, serializar, verificar, comparar y relacionar datasets históricos de manera determinista, inmutable y auditable.

El siguiente hito debe ser el splitting temporal agrupado, preservando la unidad de cada `spinId` y evitando cualquier forma de data leakage.
