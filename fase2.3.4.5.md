# PROMPT MAESTRO — FASE 2.3.4.5

## Dataset Lineage and Version Relationships

Actúa como **arquitecto principal de software, ingeniero senior de dominio, auditor científico y diseñador de trazabilidad** del proyecto **Roulette Tracker Pro**.

Tu tarea es inspeccionar el repositorio, diseñar, implementar, probar y documentar exclusivamente la:

> **Fase 2.3.4.5 — Dataset Lineage and Version Relationships**

El objetivo es modelar de forma explícita, determinista, inmutable y auditable las relaciones de procedencia y evolución entre datasets históricos y snapshots.

Esta fase debe representar lineage lógico y relaciones de versión.

No debe implementar persistencia, un grafo almacenado, merge automático, migración de schemas, reparación, exportadores, entrenamiento ni promoción de calibradores.

---

# 1. Contexto del proyecto

## Proyecto

```text
Roulette Tracker Pro
```

Nombre anterior:

```text
ORION / ORION_v2
```

Repositorio:

```bash
/home/shared/lab_vito
```

Documentos obligatorios de reanudación:

```text
Fase_2.3.3_cerrada.md
Fase_2.3.4.1_cerrada.md
Fase_2.3.4.2_cerrada.md
Fase_2.3.4.3_cerrada.md
Fase_2.3.4.4_cerrada.md
```

Si alguno de los puntos de control recientes no existe, utiliza los informes y notas técnicas disponibles en:

```text
reports/trabajo/
```

Como mínimo, revisa:

```text
Fase2.3.4.2_canonical_serialization_reporte.md
Fase2.3.4.2_nota_tecnica_diseno.md
Fase2.3.4.3_dataset_integrity_verification_reporte.md
Fase2.3.4.3_nota_tecnica_diseno.md
Fase2.3.4.4_dataset_comparison_reporte.md
```

Antes de modificar código:

1. lee los puntos de control disponibles;
2. lee los informes y notas técnicas de las subfases anteriores;
3. inspecciona el código real;
4. confirma las APIs existentes;
5. registra discrepancias documentales;
6. no supongas nombres, rutas o firmas sin verificarlos.

No repitas fases anteriores.

No reviertas decisiones cerradas.

---

# 2. Baseline esperado

El baseline validado al cierre de la Fase 2.3.4.4 es:

```text
FASE 2.3.4.4: COMPLETADA
SUITE COMPLETA: 936/936 PASS
ARCHIVOS DE TEST: 62
LINT: OK
BUILD: OK
PIPELINE: GREEN
```

Componentes existentes que deben reutilizarse:

```text
HistoricalCalibrationDataset
DatasetManifest
DatasetStatistics

DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory

canonicalSerialize
canonicalHashSync
canonicalHash

projectScientificDataset
projectObservation
serializeScientificDataset
serializeDatasetIdentity
serializeDatasetManifest
serializeDatasetStatistics
serializeDatasetSnapshotDescriptor

DatasetIntegrityVerifier
DatasetIntegrityReport
DatasetIntegrityStatus
IntegrityVerificationMode

DatasetComparator
DatasetComparisonReport
DatasetComparisonClassification
DatasetDifference
DatasetDifferenceCategory
DatasetComparisonMode
```

No asumas que el baseline sigue vigente.

Debes comprobarlo antes de implementar.

---

# 3. Objetivo general

Implementar una infraestructura capaz de responder:

```text
¿De qué dataset proviene este snapshot?
¿Qué relación tiene con otros snapshots?
¿Qué versión lo antecede?
¿Qué transformación declaró su creación?
¿Qué datasets son padres, hijos, equivalentes o sustituidos?
```

La solución debe representar lineage lógico, no persistente.

Debe distinguir como mínimo:

```text
PARENT_OF
CHILD_OF
DERIVED_FROM
SUPERSEDES
SUPERSEDED_BY
SCIENTIFICALLY_EQUIVALENT_TO
OPERATIONALLY_EQUIVALENT_TO
BRANCH_OF
MERGE_CANDIDATE
UNRELATED
INCOMPATIBLE
INDETERMINATE
```

Los nombres pueden adaptarse a las convenciones reales del repositorio, pero las diferencias semánticas deben mantenerse.

---

# 4. Principios obligatorios

Toda implementación debe preservar:

1. determinismo;
2. reproducibilidad;
3. inmutabilidad profunda;
4. cero efectos secundarios;
5. IDs y timestamps inyectados;
6. ausencia de `Math.random()`;
7. ausencia de reloj global;
8. separación entre lineage y persistencia;
9. separación entre lineage y comparación;
10. separación entre lineage y migración;
11. reutilización de integridad;
12. reutilización de comparación;
13. reutilización de serialización canónica;
14. ausencia de reparación automática;
15. ausencia de merge automático;
16. ausencia de interpretación silenciosa;
17. schemas explícitos;
18. trazabilidad verificable;
19. no promoción con datos sintéticos;
20. `IdentityCalibration` como default.

---

# 5. Alcance obligatorio

Implementa como mínimo los siguientes contratos conceptuales.

---

## 5.1 `DatasetLineageRelation`

Crear un Value Object profundamente inmutable que represente una relación dirigida entre dos artefactos.

Debe contener conceptualmente:

```text
relationId
relationType
source
target
createdAt
reason
transformation
metadata
```

Sin embargo, todos los campos deben justificarse contra la arquitectura real.

### Reglas mínimas

* `relationId` debe recibirse por inyección.
* `createdAt` debe recibirse por inyección.
* No generar IDs internamente.
* No generar timestamps internamente.
* `source` y `target` deben representar identidades de dataset o snapshot.
* No deben contener datasets completos.
* La relación debe ser profundamente inmutable.
* No debe persistir.
* No debe ejecutar comparación automáticamente durante construcción.
* No debe reparar inconsistencias.
* No debe inferir una relación no declarada sin evidencia.

---

## 5.2 `DatasetLineageRelationType`

Implementar un enum o contrato inmutable.

Como mínimo evaluar:

```text
PARENT_OF
CHILD_OF
DERIVED_FROM
SUPERSEDES
SUPERSEDED_BY
SCIENTIFICALLY_EQUIVALENT_TO
OPERATIONALLY_EQUIVALENT_TO
BRANCH_OF
MERGE_CANDIDATE
UNRELATED
INCOMPATIBLE
INDETERMINATE
```

No todas las relaciones tienen que almacenarse en ambas direcciones.

Preferir un conjunto mínimo con relaciones inversas derivables.

Ejemplo:

```text
PARENT_OF ↔ CHILD_OF
SUPERSEDES ↔ SUPERSEDED_BY
```

No dupliques relaciones inversas si una función puede derivarlas de forma segura.

Documenta cuáles son:

* dirigidas;
* simétricas;
* antisimétricas;
* transitivas;
* no transitivas.

No asumas transitividad sin justificarla.

---

## 5.3 `DatasetLineageNode`

Evaluar crear un Value Object liviano que represente un nodo lógico.

Debe incluir únicamente identidad y metadatos mínimos:

```text
datasetId
datasetVersion
contentHash
manifestHash
schemaVersion
observationSchemaVersion
createdAt
```

No debe contener observaciones.

No debe duplicar `DatasetIdentity` si este ya cubre el contrato necesario.

Preferencia:

```text
reutilizar DatasetIdentity
```

y crear un nodo adicional solo si aporta semántica real.

La decisión debe justificarse en la nota técnica.

---

## 5.4 `DatasetLineageRecord`

Crear, si aporta valor, un agregado inmutable que represente:

```text
node
incomingRelations[]
outgoingRelations[]
```

No debe convertirse en un grafo persistente.

No debe buscar automáticamente otros datasets.

No debe consultar filesystem, base de datos o red.

Puede servir para modelar un snapshot con sus relaciones conocidas.

No crear esta abstracción si solo duplica arrays sin semántica.

---

## 5.5 `DatasetLineageResolver`

Crear un servicio de aplicación responsable de derivar una relación lógica entre dos artefactos usando contratos existentes.

Entrada conceptual:

```javascript
resolve({
  left: {
    dataset,
    identity,
    descriptor
  },
  right: {
    dataset,
    identity,
    descriptor
  },
  options
})
```

Salida:

```text
DatasetLineageResolution
```

o:

```text
DatasetLineageRelation[]
```

El resolver debe reutilizar:

```text
DatasetIntegrityVerifier
DatasetComparator
DatasetVersionPolicy
```

No debe duplicar:

* verificación;
* comparación;
* hashing;
* serialización;
* reglas de compatibilidad.

---

## 5.6 `DatasetLineageResolution`

Crear un reporte o Value Object inmutable que contenga:

```text
resolved
primaryRelation
relations
evidence
warnings
classification
summary
```

Debe explicar:

* qué relación se determinó;
* qué evidencia la soporta;
* qué comparación se utilizó;
* si ambos lados eran íntegros;
* qué versiones se compararon;
* qué limitaciones existen;
* si la relación es declarada, derivada o indeterminada.

No incluir timestamps generados automáticamente.

---

# 6. Relaciones y semántica

---

## 6.1 `PARENT_OF`

Debe significar:

```text
el target se deriva directamente del source
```

Requisitos recomendados:

* relación explícitamente declarada en provenance o descriptor;
* identidad del parent coincide;
* no existe conflicto con hashes o versiones;
* el target puede extender, transformar o reemplazar al parent según el tipo de transformación.

No inferir `PARENT_OF` únicamente porque un dataset contiene más observaciones.

Eso solo demuestra posible extensión, no procedencia directa.

---

## 6.2 `DERIVED_FROM`

Relación más general que `PARENT_OF`.

Debe significar:

```text
el target declara o demuestra procedencia científica u operacional desde el source
```

Puede aplicar cuando:

* existe provenance explícita;
* el contenido es una transformación;
* el dataset target es una extensión compatible;
* existe cambio de versión compatible;
* no se puede afirmar parent directo.

No declarar derivación si solo hay similitud parcial.

---

## 6.3 `SUPERSEDES`

Debe significar:

```text
el source reemplaza operativamente al target
```

Requiere evidencia más fuerte que una versión mayor.

Evaluar:

* relación explícita en metadata/provenance;
* compatibilidad de versión;
* integridad válida;
* ausencia de contradicciones científicas;
* comparación de contenido;
* políticas declaradas.

No inferir `SUPERSEDES` solo por orden temporal.

---

## 6.4 `SCIENTIFICALLY_EQUIVALENT_TO`

Debe reutilizar la clasificación:

```text
SCIENTIFICALLY_EQUIVALENT
```

del `DatasetComparator`.

Es una relación simétrica.

No crear una segunda implementación de equivalencia.

---

## 6.5 `OPERATIONALLY_EQUIVALENT_TO`

Debe reutilizar la clasificación operativa existente.

Es una relación simétrica si el contrato actual realmente la define así.

Documenta los riesgos semánticos.

No usar esta relación como sustituto de equivalencia científica.

---

## 6.6 `BRANCH_OF`

Debe representar una evolución paralela desde un origen compartido.

No debe inferirse sin evidencia de un ancestro común o provenance explícita.

En esta fase puede limitarse a relaciones declaradas.

No implementar búsqueda transitiva de ancestros en un grafo global.

---

## 6.7 `MERGE_CANDIDATE`

Debe significar solamente:

```text
dos datasets podrían evaluarse para una futura reconciliación
```

No debe significar:

* merge seguro;
* merge automático;
* ausencia de conflictos;
* compatibilidad garantizada.

Criterios posibles:

* ambos íntegros;
* schemas compatibles;
* procedencia relacionada;
* datasets divergentes o ramas;
* sin incompatibilidad estructural.

No ejecutar merge.

No producir dataset combinado.

---

## 6.8 `UNRELATED`

Debe usarse cuando:

* ambos artefactos son válidos;
* no existe equivalencia;
* no existe procedencia compartida demostrable;
* no existe relación de versión útil;
* no hay evidencia suficiente de derivación.

No confundir con `INDETERMINATE`.

---

## 6.9 `INCOMPATIBLE`

Debe usarse cuando:

* schemas incompatibles;
* versiones incompatibles;
* integridad inválida;
* contradicciones de identidad;
* relaciones declaradas imposibles;
* provenance conflictiva.

---

## 6.10 `INDETERMINATE`

Debe usarse cuando:

* faltan identity o descriptor requeridos;
* provenance insuficiente;
* información parcial;
* verificación incompleta;
* la comparación no permite concluir relación.

No inventar relaciones.

---

# 7. Provenance

Inspecciona el contrato real de:

```text
DatasetSnapshotDescriptor.provenance
```

y campos relacionados.

Posibles campos existentes:

```text
sourceDatasetId
sourceContentHash
parentDatasetVersion
assemblyReason
transformationType
```

No asumas que todos existen.

Debes definir una proyección o parser seguro para provenance.

La fase debe distinguir:

```text
DECLARED_RELATION
DERIVED_RELATION
```

Una relación declarada viene de metadata o provenance.

Una relación derivada viene de:

* integridad;
* comparación;
* versiones;
* contenido.

El reporte debe indicar la fuente de evidencia.

No confiar ciegamente en provenance declarada.

Debe validarse contra identidades, hashes y versiones.

---

# 8. Transformaciones

Implementar un contrato explícito para transformación si la arquitectura lo justifica.

Ejemplo:

```text
APPEND_OBSERVATIONS
FILTER_PERIOD
REASSEMBLE
RECALCULATE_MANIFEST
SCHEMA_MIGRATION_DECLARED
MANUAL_SNAPSHOT
UNKNOWN
```

Sin embargo:

* no implementar migraciones;
* no ejecutar transformaciones;
* no reinterpretar contenido;
* no inferir transformación compleja sin evidencia.

Si `transformationType` ya existe como string, evalúa formalizarlo sin romper compatibilidad.

---

# 9. Dirección y relaciones inversas

Definir funciones como:

```javascript
invertLineageRelation(relation)
```

solo si aportan claridad.

Ejemplos:

```text
PARENT_OF → CHILD_OF
CHILD_OF → PARENT_OF
SUPERSEDES → SUPERSEDED_BY
```

Relaciones simétricas:

```text
SCIENTIFICALLY_EQUIVALENT_TO
OPERATIONALLY_EQUIVALENT_TO
MERGE_CANDIDATE
UNRELATED
INCOMPATIBLE
```

Evalúa cuidadosamente `MERGE_CANDIDATE`, porque puede ser simétrica pero contextual.

No inventes inversas para relaciones sin semántica clara.

---

# 10. Validación de relaciones declaradas

Cuando provenance declare:

```text
sourceDatasetId
sourceContentHash
parentDatasetVersion
```

validar contra el artefacto source proporcionado.

Debe detectar:

* datasetId incorrecto;
* contentHash incorrecto;
* versión parent incorrecta;
* source inexistente;
* relación contradictoria;
* relationType incompatible con comparación;
* target anterior al source cuando el contrato lo prohíba.

Una relación declarada incoherente debe producir:

```text
INCOMPATIBLE
```

o un reporte inválido.

No corregir provenance.

---

# 11. Relación con comparación

Reutiliza `DatasetComparator`.

Ejemplo conceptual:

```text
EXACT_MATCH
→ SCIENTIFICALLY_EQUIVALENT_TO
  y posiblemente OPERATIONALLY_EQUIVALENT_TO

SCIENTIFICALLY_EQUIVALENT
→ SCIENTIFICALLY_EQUIVALENT_TO

COMPATIBLE_EVOLUTION
→ posible DERIVED_FROM o PARENT_OF,
  solo si provenance lo respalda

DIVERGENT
→ posible BRANCH_OF o MERGE_CANDIDATE,
  solo con evidencia de origen común

INCOMPATIBLE
→ INCOMPATIBLE

INDETERMINATE
→ INDETERMINATE
```

No convertir automáticamente toda `COMPATIBLE_EVOLUTION` en `PARENT_OF`.

La comparación muestra estructura.

El lineage requiere procedencia.

---

# 12. Relación con integridad

Antes de resolver lineage:

```text
verificar ambos lados
```

Reutilizar:

```text
DatasetIntegrityVerifier
```

Preferencia:

```text
FULL
```

cuando existan dataset, identity y descriptor.

Si solo existe dataset:

```text
SCIENTIFIC
```

No declarar lineage definitivo con artefactos corruptos.

Si un lado es inválido:

```text
resolved = false
primaryRelation = INCOMPATIBLE o INDETERMINATE
```

La política debe documentarse.

---

# 13. Relación con versiones

Reutilizar:

```text
DatasetVersion
DatasetVersionPolicy
```

No mezclar:

```text
datasetVersion
schemaVersion
observationSchemaVersion
```

Debe distinguir:

* evolución del artefacto;
* evolución del schema del dataset;
* evolución del schema de observación.

Una versión superior no prueba derivación.

Una versión compatible solo habilita una relación posible.

---

# 14. Identidad de relaciones

Si existe `relationId`, debe recibirse.

No derivarlo de timestamps.

Evalúa derivarlo opcionalmente mediante hash canónico de:

```text
relationType
source identity
target identity
reason
transformation
```

pero solo si:

* reutiliza hashing oficial;
* la semántica es estable;
* no reemplaza IDs operativos inyectados;
* no crea confusión entre identidad científica y operativa.

Preferencia conservadora:

```text
relationId inyectado
```

---

# 15. Serialización canónica

Crear serialización canónica pública solo si el contrato lo requiere.

Ejemplos:

```javascript
serializeDatasetLineageRelation(relation)
serializeDatasetLineageResolution(resolution)
```

Debe reutilizar:

```text
canonicalSerialize
```

No crear otro serializador.

No incluir campos no deterministas.

No incluir datasets completos.

---

# 16. Determinismo

El mismo input debe producir:

* misma relación primaria;
* mismas relaciones secundarias;
* mismo orden;
* misma evidencia;
* mismos warnings;
* misma serialización.

No incluir automáticamente:

* timestamp actual;
* ID generado;
* duración;
* entorno;
* hostname;
* orden accidental de `Map`.

---

# 17. Orden canónico de relaciones

Definir un orden estable.

Ejemplo:

```text
PARENT_OF
CHILD_OF
DERIVED_FROM
SUPERSEDES
SUPERSEDED_BY
SCIENTIFICALLY_EQUIVALENT_TO
OPERATIONALLY_EQUIVALENT_TO
BRANCH_OF
MERGE_CANDIDATE
UNRELATED
INCOMPATIBLE
INDETERMINATE
```

Dentro de una misma categoría, ordenar por:

```text
source.datasetId
target.datasetId
source.contentHash
target.contentHash
relationId
```

No usar locale.

Documenta el orden real elegido.

---

# 18. Ciclos lógicos

Aunque no existe todavía un grafo persistente, debes impedir relaciones triviales inválidas.

Ejemplos:

```text
dataset A PARENT_OF dataset A
dataset A SUPERSEDES dataset A
dataset A BRANCH_OF dataset A
```

Estas deben rechazarse.

Relaciones simétricas consigo mismo pueden ser:

```text
SCIENTIFICALLY_EQUIVALENT_TO
```

pero evalúa si aportan valor.

Preferencia:

```text
self-relations no permitidas
```

salvo una justificación explícita.

No implementar detección de ciclos transitivos globales.

---

# 19. Errores tipados

Reutiliza el sistema existente.

Crear errores solo si son necesarios.

Ejemplos:

```text
DatasetLineageError
InvalidDatasetLineageRelationError
InvalidDatasetLineageResolutionInputError
InvalidDatasetLineageOptionsError
UnsupportedDatasetLineageRelationTypeError
ContradictoryDatasetLineageError
```

Reglas:

* input mal formado → excepción tipada;
* provenance contradictoria → reporte incompatible o error tipado según contexto;
* relación no demostrable → `INDETERMINATE`;
* artefactos sin vínculo → `UNRELATED`;
* corrupción → no lineage definitivo.

---

# 20. Inmutabilidad

Está prohibido:

* modificar identity;
* modificar descriptor;
* completar provenance;
* agregar lineage al descriptor;
* actualizar metadata;
* corregir hashes;
* ordenar arrays in-place;
* persistir relaciones;
* cachear estado global;
* reparar relaciones.

Las pruebas deben verificar no mutación.

---

# 21. Fuera de alcance

Está estrictamente prohibido implementar:

* grafo persistente;
* base de datos de lineage;
* repositorio de lineage;
* traversal global;
* búsqueda de ancestros;
* búsqueda de descendientes;
* detección transitiva de ciclos;
* visualización de grafo;
* merge automático;
* creación de dataset fusionado;
* resolución automática de conflictos;
* reparación;
* migración;
* persistencia;
* filesystem snapshots;
* SQLite;
* DuckDB;
* PostgreSQL;
* almacenamiento remoto;
* exportadores;
* CSV;
* JSONL;
* Parquet;
* Arrow;
* importación;
* deserialización;
* entrenamiento;
* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* model selection;
* ranking;
* `PromotionPolicy`;
* UI;
* captura productiva;
* integración automática con `SpinManager`;
* cambios productivos en `ConsensusEngine`;
* cambios productivos en `ProbabilityCalibrator`.

Si detectas una necesidad futura, documéntala.

No la implementes.

---

# 22. Inspección inicial obligatoria

Antes de modificar código:

```bash
cd /home/shared/lab_vito

pwd
git status --short
git branch --show-current
git log -1 --oneline
git tag --list | tail -n 20
```

Inspecciona:

```bash
find src/historical-evidence -maxdepth 5 -type f | sort
find tests/historical-evidence -maxdepth 5 -type f | sort
find reports/trabajo -maxdepth 2 -type f | sort
```

Localiza:

```text
DatasetComparator
DatasetComparisonReport
DatasetComparisonClassification
DatasetDifference
DatasetIntegrityVerifier
DatasetIdentity
DatasetSnapshotDescriptor
DatasetVersion
DatasetVersionPolicy
provenance
lineage
sourceDatasetId
sourceContentHash
parentDatasetVersion
transformationType
canonicalSerialize
```

Usa búsquedas como:

```bash
grep -R "DatasetComparator" -n src tests
grep -R "DatasetComparisonClassification" -n src tests
grep -R "DatasetIntegrityVerifier" -n src tests
grep -R "provenance" -n src/historical-evidence tests/historical-evidence
grep -R "lineage" -n src/historical-evidence tests/historical-evidence
grep -R "sourceDatasetId" -n src tests
grep -R "sourceContentHash" -n src tests
grep -R "parentDatasetVersion" -n src tests
grep -R "transformationType" -n src tests
```

No asumas rutas ni firmas.

---

# 23. Validación del baseline

Antes de modificar código ejecutar:

```bash
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

Baseline esperado:

```text
suite completa: 936/936 PASS o superior
archivos de test: 62 o superior
lint: exit 0
build: exit 0
```

Registra warnings conocidos:

```text
AtRepRenderer stub
P2.2 INSUFFICIENT_EVIDENCE
Vite chunk grande
```

Si el baseline falla:

1. documenta;
2. determina si es preexistente;
3. no ocultes;
4. no fuerces verde;
5. no debilites pruebas.

---

# 24. Nota técnica previa

Antes de modificar producción crear:

```text
reports/trabajo/Fase2.3.4.5_nota_tecnica_diseno.md
```

Debe incluir:

```text
1. Estado Git
2. Baseline real
3. Arquitectura inspeccionada
4. Contratos de comparison disponibles
5. Contratos de integrity disponibles
6. Contrato real de provenance
7. Contrato real de lineage
8. Relación entre identity y descriptor
9. Tipos de relación propuestos
10. Relaciones dirigidas
11. Relaciones simétricas
12. Relaciones inversas
13. Política de inferencia
14. Política de evidencia declarada
15. Política de evidencia derivada
16. Matriz comparison → lineage
17. Estrategia de validación
18. Modelo de reporte
19. Estrategia de serialización
20. Estrategia de errores
21. Estrategia de inmutabilidad
22. Archivos a crear
23. Archivos a modificar
24. Riesgos
25. Fuera de alcance
26. Criterios de aceptación
```

No modifiques producción antes de completar esta nota.

---

# 25. Arquitectura recomendada

Arquitectura conceptual:

```text
src/historical-evidence/
├── domain/
│   ├── DatasetLineageRelation.js
│   ├── DatasetLineageRelationType.js
│   ├── DatasetLineageResolution.js
│   ├── DatasetLineageEvidence.js
│   └── errors.js
│
└── application/
    ├── DatasetLineageResolver.js
    ├── DatasetLineageOptions.js
    └── lineage/
        ├── validateDeclaredProvenance.js
        ├── deriveRelationFromComparison.js
        ├── deriveVersionRelationship.js
        └── invertLineageRelation.js
```

Esta estructura es conceptual.

No crees fragmentación innecesaria.

Mantén:

```text
application → domain
application → DatasetComparator
application → DatasetIntegrityVerifier
application → DatasetVersionPolicy
application → canonical serialization
```

Evita:

```text
domain → application
calibration → historical-evidence
shared → historical-evidence
```

---

# 26. Estrategia de pruebas

Crear pruebas focalizadas exhaustivas.

---

## 26.1 Relación válida parent-child

Un target declara correctamente:

```text
sourceDatasetId
sourceContentHash
parentDatasetVersion
```

y la comparación es compatible.

Resultado esperado:

```text
PARENT_OF / CHILD_OF
resolved = true
```

---

## 26.2 Derived-from sin parent directo

Provenance válida, pero sin evidencia suficiente de parent directo.

Resultado:

```text
DERIVED_FROM
```

---

## 26.3 Equivalencia científica

Dos datasets científicamente equivalentes y operativamente distintos.

Resultado:

```text
SCIENTIFICALLY_EQUIVALENT_TO
```

---

## 26.4 Equivalencia exacta

Dos snapshots exactos.

Evalúa si el lineage debe devolver:

```text
SCIENTIFICALLY_EQUIVALENT_TO
OPERATIONALLY_EQUIVALENT_TO
```

o una relación específica.

No inventes `IDENTICAL_TO` salvo que aporte valor.

---

## 26.5 Supersedes válido

Un snapshot declara reemplazar a otro.

Debe comprobar:

* provenance;
* versiones;
* integridad;
* ausencia de contradicción científica;
* temporalidad cuando corresponda.

---

## 26.6 Supersedes inválido

Casos:

* versión menor reemplaza una mayor sin explicación;
* contentHash contradictorio;
* sourceDatasetId incorrecto;
* provenance no coincide;
* schemas incompatibles.

Resultado:

```text
INCOMPATIBLE
```

---

## 26.7 Branch

Dos datasets derivados del mismo source declarado.

No implementar búsqueda global.

Construir el caso con evidencia explícita.

Resultado:

```text
BRANCH_OF
```

o relaciones de derivación equivalentes.

---

## 26.8 Merge candidate

Dos ramas compatibles estructuralmente pero divergentes.

Resultado:

```text
MERGE_CANDIDATE
```

Debe quedar claro:

```text
no significa merge seguro
```

---

## 26.9 Unrelated

Dos datasets válidos sin procedencia compartida.

Resultado:

```text
UNRELATED
```

---

## 26.10 Indeterminate

Casos:

* descriptor ausente;
* provenance ausente;
* identity parcial;
* comparación inconclusa;
* versión faltante.

Resultado:

```text
INDETERMINATE
```

---

## 26.11 Provenance contradictoria

Casos:

* sourceDatasetId no coincide;
* sourceContentHash no coincide;
* parentDatasetVersion no coincide;
* transformationType incompatible;
* target se declara parent de sí mismo.

Debe detectarse.

---

## 26.12 Integridad inválida

Un lado corrupto.

El resolver no debe emitir lineage definitivo.

---

## 26.13 Relaciones inversas

Verificar:

```text
PARENT_OF ↔ CHILD_OF
SUPERSEDES ↔ SUPERSEDED_BY
```

No modificar la relación original.

---

## 26.14 Relaciones simétricas

Verificar:

```text
SCIENTIFICALLY_EQUIVALENT_TO
OPERATIONALLY_EQUIVALENT_TO
UNRELATED
INCOMPATIBLE
```

según la semántica final.

---

## 26.15 Self-relations

Rechazar:

```text
PARENT_OF self
SUPERSEDES self
BRANCH_OF self
DERIVED_FROM self
```

---

## 26.16 Determinismo

Mismo input produce:

* misma relación;
* misma evidencia;
* mismo orden;
* mismo reporte;
* misma serialización.

---

## 26.17 Inmutabilidad

Comprobar:

* relation congelada;
* resolution congelada;
* evidence congelada;
* arrays congelados;
* metadata congelada;
* inputs intactos.

---

## 26.18 Errores

Cubrir:

* input ausente;
* relationType inválido;
* identity inválida;
* descriptor inválido;
* options inválidas;
* provenance mal formada;
* relationId inválido;
* timestamp inválido.

---

## 26.19 Barrel exports

Comprobar exports públicos desde:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

No exportar helpers privados.

---

## 26.20 Anti-side-effects

Comprobar:

* imports sin logs;
* sin filesystem;
* sin red;
* sin reloj;
* sin random;
* sin persistencia;
* sin merge;
* sin mutación.

---

# 27. Validación durante la implementación

Ejecutar frecuentemente:

```bash
npx vitest run tests/historical-evidence/
```

También:

```bash
npm exec vitest run tests/calibration/CanonicalHash.test.js
```

Al finalizar:

```bash
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

Resultado requerido:

```text
tests anteriores: PASS
tests nuevos: PASS
comparison: sin regresiones
integrity: sin regresiones
hashes: preservados
lint: exit 0
build: exit 0
pipeline: GREEN
```

El total debe ser superior a 936.

No fijes una cifra artificial.

No elimines tests.

No uses `.skip`.

No uses `.only`.

No debilites assertions.

---

# 28. Barrel exports

Actualizar solo lo necesario:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

No exportar:

* parsers internos;
* validadores privados;
* helpers de inversion;
* matrices de decisión;
* walkers;
* fixtures.

---

# 29. Documentación técnica

Documentar:

1. definición de lineage;
2. diferencia entre comparison y lineage;
3. diferencia entre declared y derived;
4. tipos de relación;
5. relaciones dirigidas;
6. relaciones simétricas;
7. relaciones inversas;
8. parent-child;
9. derived-from;
10. supersedes;
11. equivalencia científica;
12. equivalencia operativa;
13. branch;
14. merge candidate;
15. unrelated;
16. incompatible;
17. indeterminate;
18. validación de provenance;
19. relación con versiones;
20. relación con integrity;
21. relación con comparison;
22. determinismo;
23. inmutabilidad;
24. limitaciones;
25. fuera de alcance.

---

# 30. Informe final

Crear:

```text
reports/trabajo/Fase2.3.4.5_dataset_lineage_reporte.md
```

Debe incluir:

```text
1. Resumen ejecutivo
2. Estado Git
3. Baseline inicial
4. Arquitectura inspeccionada
5. Contrato real de provenance
6. Decisiones de diseño
7. Componentes implementados
8. Archivos creados
9. Archivos modificados
10. APIs públicas
11. Tipos de relación
12. Relaciones dirigidas
13. Relaciones simétricas
14. Relaciones inversas
15. Lineage declarado
16. Lineage derivado
17. Parent-child
18. Derived-from
19. Supersedes
20. Equivalencia científica
21. Equivalencia operativa
22. Branch
23. Merge candidate
24. Unrelated
25. Incompatible
26. Indeterminate
27. Validación de provenance
28. Relación con comparison
29. Relación con integrity
30. Relación con version policy
31. Serialización
32. Determinismo
33. Inmutabilidad
34. Errores tipados
35. Tests agregados
36. Tests focalizados
37. Suite completa
38. Lint
39. Build
40. Warnings
41. Git diff summary
42. Riesgos
43. Pendientes
44. Fuera de alcance
45. Recomendación para Fase 2.3.4.6
46. Veredicto final
```

No inventes resultados.

Incluye resultados reales.

Registra el workspace sucio si continúa.

---

# 31. Punto de control

Si todo queda verde crear:

```text
Fase_2.3.4.5_cerrada.md
```

Debe incluir:

* timestamp;
* estado;
* baseline;
* componentes;
* tipos de relación;
* APIs;
* invariantes;
* tests;
* lint;
* build;
* warnings;
* estado Git;
* riesgos;
* pendientes;
* siguiente fase;
* prompt de reanudación.

Si no queda verde crear:

```text
Fase_2.3.4.5_pendiente.md
```

No declarar cierre si:

* una relación contradictoria se acepta;
* provenance inválida produce lineage válido;
* datasets corruptos reciben relación definitiva;
* se duplican reglas de comparación;
* se mutan inputs;
* falla una prueba;
* lint falla;
* build falla.

---

# 32. Git y seguridad operacional

No ejecutar automáticamente:

```bash
git commit
git push
git tag
git reset --hard
git clean -fd
git checkout -- .
git add .
```

No borrar archivos ajenos.

No instalar dependencias sin justificación crítica.

Debido al workspace sucio, al finalizar mostrar:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence
```

Crear además un inventario explícito de archivos tocados por esta fase.

No atribuir el diff global completo a esta implementación.

---

# 33. Criterios de aceptación

La Fase 2.3.4.5 solo puede cerrarse si:

* [ ] se verificó el baseline;
* [ ] se inspeccionó provenance real;
* [ ] se reutiliza `DatasetComparator`;
* [ ] se reutiliza `DatasetIntegrityVerifier`;
* [ ] se reutiliza `DatasetVersionPolicy`;
* [ ] existe `DatasetLineageRelation`;
* [ ] existe `DatasetLineageResolution`;
* [ ] existe `DatasetLineageResolver`;
* [ ] existen tipos explícitos de relación;
* [ ] parent-child está modelado;
* [ ] derived-from está modelado;
* [ ] supersedes está modelado;
* [ ] equivalencia científica está modelada;
* [ ] equivalencia operativa está modelada;
* [ ] branch está modelado;
* [ ] merge candidate está modelado sin merge;
* [ ] unrelated está modelado;
* [ ] incompatible está modelado;
* [ ] indeterminate está modelado;
* [ ] declared y derived están separados;
* [ ] provenance se valida;
* [ ] relaciones contradictorias se detectan;
* [ ] artefactos corruptos no reciben lineage definitivo;
* [ ] no se infiere parent solo por extensión;
* [ ] no se infiere supersedes solo por versión;
* [ ] relaciones son deterministas;
* [ ] relaciones son inmutables;
* [ ] inputs no se mutan;
* [ ] no se duplicó comparison;
* [ ] no se duplicó integrity;
* [ ] no se duplicó hashing;
* [ ] no se duplicó serialización;
* [ ] no se implementó grafo persistente;
* [ ] no se implementó traversal;
* [ ] no se implementó merge;
* [ ] no se implementó migración;
* [ ] no se implementó persistencia;
* [ ] no se implementaron exportadores;
* [ ] no se implementó entrenamiento;
* [ ] no se implementó promoción;
* [ ] tests focalizados PASS;
* [ ] suite completa PASS;
* [ ] lint limpio;
* [ ] build OK;
* [ ] informe creado;
* [ ] punto de control creado;
* [ ] pipeline GREEN.

---

# 34. Veredicto esperado

Si todos los criterios se cumplen:

```text
FASE 2.3.4.5: COMPLETADA
DATASET LINEAGE RELATION: IMPLEMENTADA
DATASET LINEAGE RESOLUTION: IMPLEMENTADA
DATASET LINEAGE RESOLVER: IMPLEMENTADO
PARENT-CHILD: IMPLEMENTADO
DERIVED-FROM: IMPLEMENTADO
SUPERSEDES: IMPLEMENTADO
SCIENTIFIC EQUIVALENCE RELATION: IMPLEMENTADA
OPERATIONAL EQUIVALENCE RELATION: IMPLEMENTADA
BRANCH RELATION: IMPLEMENTADA
MERGE CANDIDATE: IMPLEMENTADO
PROVENANCE VALIDATION: IMPLEMENTADA
INTEGRITY PREVALIDATION: IMPLEMENTADA
COMPARISON REUSE: VALIDADA
PERSISTENT GRAPH: NO IMPLEMENTADO
AUTOMATIC MERGE: NO IMPLEMENTADO
AUTOMATIC REPAIR: NO IMPLEMENTADA
MIGRATION: NO IMPLEMENTADA
PERSISTENCIA: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
ENTRENAMIENTO: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA
PIPELINE: GREEN
```

Si algún criterio falla:

```text
FASE 2.3.4.5: PENDIENTE
```

Debe indicar:

* qué relación está afectada;
* qué evidencia falta;
* qué prueba falla;
* qué riesgo existe;
* qué falta para cerrar.

---

# 35. Secuencia de ejecución

Trabaja en este orden:

```text
1. Leer puntos de control e informes.
2. Inspeccionar Git.
3. Inspeccionar arquitectura.
4. Confirmar APIs de comparison.
5. Confirmar APIs de integrity.
6. Inspeccionar provenance real.
7. Ejecutar baseline.
8. Crear nota técnica.
9. Definir tipos de relación.
10. Definir relaciones dirigidas e inversas.
11. Definir política declared/derived.
12. Implementar contratos de dominio.
13. Implementar validación de provenance.
14. Implementar integración con integrity.
15. Implementar integración con comparison.
16. Implementar resolución de versiones.
17. Implementar resolver.
18. Implementar serialización si es necesaria.
19. Actualizar exports.
20. Crear fixtures.
21. Crear tests unitarios.
22. Crear tests de integración.
23. Ejecutar tests focalizados.
24. Corregir defectos.
25. Ejecutar suite completa.
26. Ejecutar lint.
27. Ejecutar build.
28. Revisar inventario de archivos.
29. Revisar diff acotado.
30. Crear informe final.
31. Crear punto de control.
32. Mostrar veredicto.
```

---

# 36. Instrucción final

Trabaja de manera autónoma, conservadora y verificable.

No pidas confirmación para decisiones menores que puedan resolverse inspeccionando el repositorio.

Ante una ambigüedad:

1. verifica integridad;
2. reutiliza comparison;
3. valida provenance;
4. no infieras procedencia sin evidencia;
5. no confundas similitud con lineage;
6. no confundas versión mayor con supersedes;
7. no confundas extensión con parent directo;
8. separa declared de derived;
9. no mutar;
10. no persistir;
11. documenta la decisión;
12. minimiza cambios.

No declares éxito solo porque dos datasets son similares.

Debes demostrar:

```text
provenance válida
+
integridad válida
+
comparación coherente
+
relación demostrable
=
lineage resuelto
```

La condición final de cierre es:

```text
relaciones correctas
+
evidencia explícita
+
resolución determinista
+
inputs intactos
+
suite completa en verde
```

Comienza ahora.
