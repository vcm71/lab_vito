# PROMPT MAESTRO — FASE 2.3.4.4

## Deterministic Dataset Comparison and Scientific Equivalence

Actúa como **arquitecto principal de software, ingeniero senior de dominio, auditor científico y revisor de compatibilidad** del proyecto **Roulette Tracker Pro**.

Tu tarea es inspeccionar el repositorio, diseñar, implementar, probar y documentar exclusivamente la:

> **Fase 2.3.4.4 — Deterministic Dataset Comparison and Scientific Equivalence**

El objetivo es implementar una infraestructura determinista, inmutable y auditable para comparar dos datasets históricos, sus identidades y sus descriptores, distinguiendo claramente:

* igualdad exacta;
* equivalencia científica;
* equivalencia operativa;
* compatibilidad;
* evolución;
* divergencia;
* incompatibilidad;
* imposibilidad de comparar por corrupción o evidencia insuficiente.

Esta fase no debe implementar lineage completo, persistencia, migraciones, reparación, exportación, entrenamiento ni promoción de calibradores.

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
```

Si alguno de los dos últimos puntos de control no existe, utiliza:

```text
reports/trabajo/Fase2.3.4.2_canonical_serialization_reporte.md
reports/trabajo/Fase2.3.4.2_nota_tecnica_diseno.md

reports/trabajo/Fase2.3.4.3_dataset_integrity_verification_reporte.md
reports/trabajo/Fase2.3.4.3_nota_tecnica_diseno.md
```

Antes de modificar código:

1. lee los puntos de control disponibles;
2. lee los informes y notas técnicas de 2.3.4.2 y 2.3.4.3;
3. inspecciona el código real;
4. confirma las APIs existentes;
5. registra cualquier discrepancia documental;
6. no supongas paths, firmas o nombres sin verificarlos.

No repitas las fases anteriores.

No reviertas decisiones cerradas.

---

# 2. Baseline esperado

El baseline validado al cierre técnico de la Fase 2.3.4.3 es:

```text
FASE 2.3.4.3: COMPLETADA
HISTORICAL-EVIDENCE: 296/296 PASS
CANONICAL HASH: 8/8 PASS
SUITE COMPLETA: 931/931 PASS
ARCHIVOS DE TEST: 61
LINT: OK
BUILD: OK
PIPELINE: GREEN
```

Warnings conocidos que no invalidan el baseline:

```text
AtRepRenderer:
contenedor ausente en test de stub

P2.2 Synthetic Benchmark:
INSUFFICIENT_EVIDENCE

Vite:
chunk mayor a 500 kB
```

Estado Git conocido:

```text
WORKSPACE DIRTY
```

El árbol contiene modificaciones y archivos sin seguimiento previos.

No atribuyas automáticamente todo el diff a esta fase.

No ejecutes limpieza destructiva.

---

# 3. Componentes existentes que deben reutilizarse

Confirma la existencia y API real de:

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
```

El verificador de integridad ya implementado dispone conceptualmente de:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

y checks como:

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

No dupliques esos checks dentro del comparador.

---

# 4. Objetivo general

Implementar una infraestructura capaz de responder de forma determinista:

```text
¿Cómo se relacionan científicamente y operativamente
el dataset A y el dataset B?
```

La comparación debe poder distinguir como mínimo:

```text
EXACT_MATCH
SCIENTIFICALLY_EQUIVALENT
OPERATIONALLY_EQUIVALENT
COMPATIBLE_EVOLUTION
DIVERGENT
INCOMPATIBLE
INVALID_INPUT
INDETERMINATE
```

Los nombres pueden ajustarse a las convenciones reales del repositorio, pero las diferencias semánticas deben mantenerse.

---

# 5. Separaciones conceptuales obligatorias

## 5.1 Igualdad exacta

Dos snapshots son exactamente iguales cuando todos los campos públicos relevantes coinciden de forma canónica.

Conceptualmente:

```text
misma representación científica
+
misma identidad operativa
+
mismo descriptor
+
mismo manifiesto
+
mismas estadísticas
=
EXACT_MATCH
```

No uses igualdad por referencia de objeto.

---

## 5.2 Equivalencia científica

Dos datasets son científicamente equivalentes cuando representan la misma evidencia científica.

El criterio principal debe ser coherente con:

```text
contentHash
```

y con la representación producida por:

```text
projectScientificDataset
serializeScientificDataset
```

Puede existir equivalencia científica aunque difieran:

```text
datasetId
createdAt
manifestHash
metadata operativa
datasetVersion
provenance
lineage
```

si esas diferencias no alteran el contenido científico.

---

## 5.3 Equivalencia operativa

Dos snapshots pueden considerarse operativamente equivalentes cuando coinciden sus contratos operativos relevantes.

Puede involucrar:

```text
datasetId
manifestHash
createdAt
datasetVersion
manifest
descriptor
policies
filters
provenance
metadata
```

No confundas equivalencia operativa con científica.

---

## 5.4 Evolución compatible

Dos datasets pueden ser diferentes, pero representar una evolución compatible.

Ejemplos conceptuales:

* mismo major de `DatasetVersion`;
* incremento minor o patch permitido;
* uno contiene todas las observaciones científicas del otro más nuevas observaciones válidas;
* schemas compatibles;
* periodo temporal extendido;
* no existe contradicción en observaciones compartidas.

No declares evolución compatible solo porque una versión numérica es mayor.

Debe existir evidencia estructural y científica.

---

## 5.5 Divergencia

Existe divergencia cuando:

* ambos datasets son válidos;
* comparten parte del contenido o procedencia;
* presentan diferencias científicas que no constituyen una simple extensión compatible.

Ejemplos:

* misma observación lógica con contenido diferente;
* mismo `predictionId` con resultado científico distinto;
* observaciones eliminadas y reemplazadas;
* periodo superpuesto con evidencia contradictoria;
* estadísticas incompatibles derivadas de contenido distinto.

---

## 5.6 Incompatibilidad

Debe reportarse incompatibilidad cuando no existe una comparación científicamente segura.

Ejemplos:

* major versions incompatibles;
* schemas no compatibles;
* observation schemas incompatibles;
* políticas científicas irreconciliables;
* contracts estructurales distintos;
* datos inválidos o corruptos que impiden una comparación confiable.

---

## 5.7 Resultado indeterminado

Usar un resultado como `INDETERMINATE` cuando:

* faltan inputs necesarios;
* no existe suficiente información para clasificar;
* la verificación solicitada no pudo completarse;
* la procedencia declarada es insuficiente;
* los artefactos no incluyen campos necesarios para una conclusión.

No inventes relaciones.

---

# 6. Alcance obligatorio

Implementa como mínimo los siguientes contratos conceptuales.

---

## 6.1 `DatasetComparator`

Crear un servicio de aplicación responsable de:

```text
dataset A
+
dataset B
+
identity A opcional
+
identity B opcional
+
descriptor A opcional
+
descriptor B opcional
+
opciones explícitas
        ↓
DatasetComparisonReport
```

API conceptual posible:

```javascript
compare({
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

También podría existir una API mínima:

```javascript
compareDatasets(leftDataset, rightDataset, options)
```

pero evita parámetros posicionales excesivos.

No utilices booleanos ambiguos.

---

## 6.2 `DatasetComparisonReport`

Crear un Value Object profundamente inmutable que incluya al menos:

```text
classification
comparable
scientificallyEquivalent
operationallyEquivalent
exactMatch
compatible
differences
warnings
summary
```

Debe permitir identificar:

* clasificación global;
* dimensiones comparadas;
* diferencias científicas;
* diferencias operativas;
* diferencias de versión;
* diferencias de schema;
* diferencias de periodo;
* diferencias de observaciones;
* diferencias de estadísticas;
* diferencias de manifiesto;
* integridad de cada lado;
* razón de incompatibilidad o indeterminación.

API conceptual posible:

```javascript
report.isExactMatch()
report.isScientificallyEquivalent()
report.isOperationallyEquivalent()
report.isCompatible()
report.getScientificDifferences()
report.getOperationalDifferences()
report.getDifference("OBSERVATIONS")
report.toJSON()
```

No crees métodos redundantes.

---

## 6.3 `DatasetComparisonClassification`

Implementar un enum o contrato inmutable con clasificaciones explícitas.

Mínimo conceptual:

```text
EXACT_MATCH
SCIENTIFICALLY_EQUIVALENT
OPERATIONALLY_EQUIVALENT
COMPATIBLE_EVOLUTION
DIVERGENT
INCOMPATIBLE
INVALID_INPUT
INDETERMINATE
```

Evalúa si `INVALID_INPUT` debe representarse mediante excepción en vez de clasificación.

Regla recomendada:

```text
input mal formado:
  error tipado

dataset correctamente formado pero corrupto:
  reporte no comparable o inválido

información insuficiente:
  INDETERMINATE
```

---

## 6.4 `DatasetDifference`

Crear una representación inmutable para cada diferencia.

Debe incluir conceptualmente:

```text
differenceId
category
path
left
right
severity
scientific
message
```

Categorías sugeridas:

```text
CONTENT_HASH
MANIFEST_HASH
DATASET_ID
DATASET_VERSION
DATASET_SCHEMA
OBSERVATION_SCHEMA
PERIOD
OBSERVATIONS
STATISTICS
MANIFEST
POLICIES
FILTERS
PROVENANCE
LINEAGE
METADATA
DESCRIPTOR
INTEGRITY
```

No incluyas objetos completos potencialmente grandes o sensibles en mensajes de error.

Los valores `left` y `right` deben ser seguros, acotados y serializables.

---

## 6.5 Modos de comparación

Implementar modos explícitos.

Como mínimo:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

### `SCIENTIFIC`

Compara:

* integridad científica;
* `contentHash`;
* schemas;
* periodo;
* observaciones;
* estadísticas;
* equivalencia y evolución científica.

### `OPERATIONAL`

Compara:

* `datasetId`;
* `manifestHash`;
* identidad;
* descriptor;
* versión del artefacto;
* políticas;
* filtros;
* procedencia;
* metadata.

### `FULL`

Combina ambas dimensiones.

No agregues modos adicionales sin necesidad.

---

# 7. Precondición de integridad

La comparación científica no debe confiar ciegamente en hashes declarados.

Antes de clasificar, debe reutilizar:

```text
DatasetIntegrityVerifier
```

Cada lado debe verificarse de acuerdo con el modo solicitado.

Ejemplo:

```text
comparación SCIENTIFIC
→ verificación SCIENTIFIC de ambos datasets

comparación OPERATIONAL
→ verificación OPERATIONAL de ambos artefactos

comparación FULL
→ verificación FULL de ambos artefactos
```

No dupliques el algoritmo de integridad.

---

## 7.1 Política recomendada ante integridad inválida

Si uno de los lados falla integridad:

```text
comparable = false
classification = INCOMPATIBLE o INDETERMINATE
```

La elección debe documentarse.

No declares equivalencia basándote únicamente en hashes declarados de un artefacto corrupto.

---

## 7.2 Política configurable

Evalúa una opción explícita:

```text
requireValidIntegrity = true
```

Preferencia:

```text
true por defecto
```

Si se permite comparar artefactos inválidos con fines diagnósticos, el resultado debe indicarlo claramente y nunca declarar equivalencia científica definitiva.

No implementes esta opción si añade ambigüedad innecesaria.

---

# 8. Comparación científica

## 8.1 Fast path por hash

Cuando ambos datasets pasan integridad:

```text
mismo contentHash
→ candidatos a equivalencia científica
```

Sin embargo, debe existir una política defensiva.

Evalúa confirmar también:

```text
serializeScientificDataset(left)
===
serializeScientificDataset(right)
```

Esto protege ante:

* hashes declarados incorrectos;
* colisiones teóricas;
* integración defectuosa;
* artefactos fabricados manualmente.

La comparación canónica completa puede ser obligatoria o configurable.

Documenta el tradeoff.

Para esta fase científica, preferir exactitud antes que microoptimización.

---

## 8.2 Comparación de schemas

Comparar:

```text
schemaVersion
observationSchemaVersion
```

Reutilizar:

```text
DatasetVersionPolicy
```

cuando corresponda a `datasetVersion`.

No mezclar:

```text
datasetVersion
schemaVersion
observationSchemaVersion
```

Cada una tiene semántica diferente.

---

## 8.3 Comparación de periodos

Distinguir:

```text
SAME_PERIOD
LEFT_CONTAINS_RIGHT
RIGHT_CONTAINS_LEFT
OVERLAPPING
DISJOINT
INVALID_PERIOD
```

Los nombres son orientativos.

La política temporal sigue siendo inclusiva:

```text
from <= timestamp <= to
```

No inferir periodos desde timestamps si el dataset ya declara uno, salvo como validación defensiva.

---

## 8.4 Comparación de observaciones

Comparar observaciones mediante identidad lógica estable.

No comparar por posición del array.

No comparar por proximidad temporal.

Usar los identificadores oficiales existentes.

Evaluar índices por:

```text
observationId
predictionId
predictionId + outcomeId
spinId
```

La identidad primaria debe respetar el contrato actual.

No inventes un nuevo identificador científico.

---

## 8.5 Tipos de diferencias de observación

Debe distinguir como mínimo:

```text
ONLY_IN_LEFT
ONLY_IN_RIGHT
SAME_ID_SAME_CONTENT
SAME_ID_DIFFERENT_CONTENT
SAME_PREDICTION_DIFFERENT_OUTCOME
LOGICAL_CONFLICT
```

Puede añadirse:

```text
ADDED
REMOVED
MODIFIED
CONFLICTING
```

si el reporte mantiene claridad semántica.

---

## 8.6 Extensión científica compatible

Un dataset derecho puede ser una extensión compatible del izquierdo cuando:

1. ambos son íntegros;
2. schemas son compatibles;
3. todas las observaciones del izquierdo existen sin cambios en el derecho;
4. el derecho contiene observaciones adicionales válidas;
5. no hay conflictos lógicos;
6. el periodo es igual o extendido coherentemente;
7. las estadísticas del derecho corresponden a su contenido;
8. la versión es compatible.

La dirección importa.

Debe poder distinguir:

```text
LEFT_EXTENDS_RIGHT
RIGHT_EXTENDS_LEFT
```

No fuerces simetría.

---

## 8.7 Subconjunto y superconjunto

La comparación debe indicar:

```text
leftObservationCount
rightObservationCount
sharedObservationCount
onlyLeftCount
onlyRightCount
conflictCount
```

No es obligatorio almacenar listas completas si son muy grandes.

Puedes permitir límites explícitos para detalles:

```text
maxDifferenceDetails
```

El conteo total nunca debe truncarse.

Si implementas truncamiento:

* debe ser determinista;
* debe quedar indicado;
* no debe alterar la clasificación;
* debe usar orden canónico.

---

# 9. Comparación operativa

## 9.1 Identidad

Comparar:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

Distinguir:

```text
misma identidad operativa
misma identidad científica
identidad contradictoria
identidad parcialmente coincidente
```

---

## 9.2 Manifiesto

Comparar mediante:

```text
serializeDatasetManifest
```

y/o proyección canónica oficial.

No usar `JSON.stringify` directo.

Debe identificar diferencias en:

* filtros;
* políticas;
* procedencia;
* conteos;
* metadata;
* configuración de ensamblaje.

---

## 9.3 Descriptor

Comparar mediante:

```text
serializeDatasetSnapshotDescriptor
```

y campos compartidos explícitos.

Debe distinguir diferencias en:

* identity;
* createdAt;
* period;
* manifest;
* statistics;
* policies;
* filters;
* provenance;
* lineage;
* metadata.

El descriptor no contiene observaciones completas.

No intentes reconstruirlas.

---

## 9.4 Versión del dataset

Reutilizar:

```text
DatasetVersion
DatasetVersionPolicy
```

Distinguir al menos:

```text
IDENTICAL
BACKWARD_COMPATIBLE
FORWARD_COMPATIBLE
INCOMPATIBLE
```

No implementar migración.

No modificar versiones.

---

# 10. Clasificación global

Diseñar una matriz de decisión explícita.

Ejemplo conceptual:

## `EXACT_MATCH`

```text
ambos válidos
+
representación científica igual
+
identidad operativa igual
+
descriptor igual
```

## `SCIENTIFICALLY_EQUIVALENT`

```text
ambos válidos
+
representación científica igual
+
diferencias operativas permitidas
```

## `OPERATIONALLY_EQUIVALENT`

```text
contratos operativos equivalentes
+
contenido científico diferente o no evaluado
```

Evalúa cuidadosamente si esta categoría tiene sentido científico.

No la conserves si resulta semánticamente peligrosa.

## `COMPATIBLE_EVOLUTION`

```text
ambos válidos
+
schemas/versiones compatibles
+
uno extiende al otro sin conflictos
```

## `DIVERGENT`

```text
ambos válidos
+
comparables
+
contenido científico diferente
+
sin relación de extensión compatible
```

## `INCOMPATIBLE`

```text
schemas/versiones incompatibles
o
contratos irreconciliables
o
integridad inválida que impide comparación
```

## `INDETERMINATE`

```text
información insuficiente
o
verificación incompleta
```

La precedencia entre clasificaciones debe estar documentada y probada.

---

# 11. Determinismo del reporte

El mismo par de inputs debe producir exactamente:

* la misma clasificación;
* el mismo orden de diferencias;
* los mismos conteos;
* el mismo resumen;
* la misma serialización del reporte.

No incluir automáticamente:

* timestamps actuales;
* IDs generados;
* duración de ejecución;
* hostname;
* entorno;
* orden accidental de mapas.

Si se necesita un `comparisonId`, debe ser inyectado explícitamente o quedar fuera de esta fase.

Preferir no incluirlo.

---

# 12. Orden de diferencias

Definir un orden canónico para el reporte.

Ejemplo:

```text
INTEGRITY
SCHEMA
VERSION
CONTENT_HASH
MANIFEST_HASH
PERIOD
OBSERVATIONS
STATISTICS
IDENTITY
DESCRIPTOR
POLICIES
FILTERS
PROVENANCE
LINEAGE
METADATA
```

Dentro de diferencias de observaciones:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

Reutiliza el comparador oficial.

No uses orden dependiente del locale.

---

# 13. Rendimiento y memoria

La fase debe ser correcta antes que prematuramente optimizada.

Sin embargo:

* evitar comparación cuadrática de observaciones;
* preferir índices `Map` locales;
* no mutar inputs;
* no conservar copias completas innecesarias;
* no serializar repetidamente el mismo dataset;
* no introducir caches globales;
* no ocultar estado mutable.

Toda optimización debe preservar determinismo.

No implementar streaming todavía.

---

# 14. Errores tipados

Reutiliza el sistema de errores del dominio.

Crear errores nuevos solo si son necesarios.

Ejemplos:

```text
DatasetComparisonError
InvalidDatasetComparisonInputError
InvalidDatasetComparisonOptionsError
UnsupportedDatasetComparisonModeError
DatasetComparisonIntegrityError
```

Reglas:

* input estructuralmente inválido → excepción tipada;
* artefacto corrupto correctamente recibido → reporte no comparable;
* diferencia científica → reporte, no excepción;
* incompatibilidad → reporte, no excepción;
* información insuficiente → reporte `INDETERMINATE`.

---

# 15. Inmutabilidad y ausencia de efectos secundarios

Está prohibido:

* ordenar observaciones in-place;
* agregar propiedades;
* congelar inputs como efecto secundario;
* recalcular y guardar hashes;
* actualizar estadísticas;
* modificar manifests;
* corregir descriptors;
* cambiar versiones;
* eliminar duplicados;
* reparar corrupción;
* persistir resultados.

El comparador debe ser observacional.

Las pruebas deben comparar inputs antes y después.

---

# 16. Invariantes científicas vigentes

Preservar:

1. modularidad absoluta;
2. determinismo;
3. reproducibilidad;
4. inmutabilidad profunda;
5. asociación por `spinId`;
6. identidad primaria explícita;
7. prevención de data leakage;
8. timestamps e IDs inyectados;
9. ausencia de `Math.random()`;
10. ausencia de reloj global;
11. serialización canónica única;
12. SHA-256 único;
13. separación científica y operativa;
14. datasets all-or-nothing;
15. schemas explícitos;
16. no promoción con datos sintéticos;
17. `IdentityCalibration` como default.

---

# 17. Decisiones cerradas que no deben cambiarse

```text
duplicatePolicy = REJECT
```

```text
invalidObservationPolicy = REJECT_DATASET
```

```text
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

Orden canónico:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

Contenido de `contentHash`:

```text
schemaVersion
observationSchemaVersion
period
observations
```

Exclusiones de `contentHash`:

```text
datasetId
createdAt
```

`manifestHash`:

```text
manifiesto operativo completo
```

No alteres estos contratos.

---

# 18. Fuera de alcance

Está estrictamente prohibido implementar:

* grafo completo de lineage;
* almacenamiento de relaciones;
* persistencia;
* repositorio de snapshots;
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
* deserialización;
* importación;
* reparación;
* migración;
* merge automático;
* reconciliación automática;
* resolución automática de conflictos;
* firma digital;
* cifrado;
* compresión;
* entrenamiento;
* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* model selection;
* ranking de calibradores;
* `PromotionPolicy`;
* UI;
* captura productiva;
* integración automática con `SpinManager`;
* cambios productivos en `ConsensusEngine`;
* cambios productivos en `ProbabilityCalibrator`.

Si detectas una necesidad futura, documéntala.

No la implementes.

---

# 19. Inspección inicial obligatoria

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
find src/calibration -maxdepth 4 -type f | sort
find tests/calibration -maxdepth 4 -type f | sort
```

Localiza:

```text
DatasetIntegrityVerifier
DatasetIntegrityReport
DatasetIntegrityStatus
IntegrityVerificationMode
HistoricalCalibrationDataset
DatasetBuilder
DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
canonicalSerialize
canonicalHashSync
projectScientificDataset
projectObservation
serializeScientificDataset
serializeDatasetIdentity
serializeDatasetManifest
serializeDatasetStatistics
serializeDatasetSnapshotDescriptor
canonical observation comparator
duplicate detection
schema policies
```

Usa búsquedas como:

```bash
grep -R "DatasetIntegrityVerifier" -n src tests
grep -R "DatasetIntegrityReport" -n src tests
grep -R "IntegrityVerificationMode" -n src tests
grep -R "projectScientificDataset" -n src tests
grep -R "serializeScientificDataset" -n src tests
grep -R "DatasetVersionPolicy" -n src tests
grep -R "contentHash" -n src/historical-evidence tests/historical-evidence
grep -R "manifestHash" -n src/historical-evidence tests/historical-evidence
grep -R "predictionId" -n src/historical-evidence tests/historical-evidence
```

No asumas rutas ni firmas.

---

# 20. Validación del baseline

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
historical-evidence: 296/296 PASS o superior
CanonicalHash: 8/8 PASS o superior
suite completa: 931/931 PASS o superior
lint: exit 0
build: exit 0
```

Registra warnings conocidos por separado.

Si el baseline falla:

1. no ocultes el fallo;
2. identifica si es preexistente;
3. no fuerces verde;
4. no debilites pruebas;
5. documenta el estado antes de continuar.

---

# 21. Nota técnica previa

Antes de modificar producción crear:

```text
reports/trabajo/Fase2.3.4.4_nota_tecnica_diseno.md
```

Debe incluir:

```text
1. Estado Git
2. Baseline real
3. Arquitectura inspeccionada
4. APIs de integridad disponibles
5. APIs canónicas disponibles
6. Identidad lógica de observaciones
7. Política real de versiones
8. Semántica de equivalencia científica
9. Semántica de equivalencia operativa
10. Matriz de clasificación
11. Estrategia de comparación
12. Estrategia de prevalidación
13. Modelo de diferencias
14. Orden canónico del reporte
15. Estrategia de rendimiento
16. Estrategia de errores
17. Estrategia de inmutabilidad
18. Archivos a crear
19. Archivos a modificar
20. Riesgos
21. Fuera de alcance
22. Criterios de aceptación
```

No modifiques producción antes de completar esta nota.

---

# 22. Arquitectura recomendada

Arquitectura conceptual:

```text
src/historical-evidence/
├── domain/
│   ├── DatasetComparisonReport.js
│   ├── DatasetComparisonClassification.js
│   ├── DatasetDifference.js
│   ├── DatasetDifferenceCategory.js
│   └── errors.js
│
└── application/
    ├── DatasetComparator.js
    ├── DatasetComparisonMode.js
    └── comparison/
        ├── compareScientificContent.js
        ├── compareObservations.js
        ├── comparePeriods.js
        ├── compareVersions.js
        ├── compareIdentity.js
        ├── compareManifest.js
        └── compareDescriptor.js
```

Esta estructura es conceptual.

No crees fragmentación innecesaria.

Mantén:

```text
application → domain
application → integrity verifier
application → canonical serialization
```

Evita:

```text
domain → application
calibration → historical-evidence
shared → historical-evidence
```

---

# 23. Estrategia de pruebas

Crear pruebas exhaustivas y focalizadas.

---

## 23.1 Igualdad exacta

Dos referencias distintas construidas con el mismo contenido y mismos datos operativos.

Resultado esperado:

```text
EXACT_MATCH
exactMatch = true
scientificallyEquivalent = true
operationallyEquivalent = true
```

---

## 23.2 Equivalencia científica

Datasets con:

```text
contentHash igual
evidencia científica igual
datasetId distinto
createdAt distinto
manifestHash distinto
```

Resultado esperado:

```text
SCIENTIFICALLY_EQUIVALENT
scientificallyEquivalent = true
exactMatch = false
```

---

## 23.3 Misma identidad declarada y contenido distinto

Casos:

* mismo `datasetId`, contenido distinto;
* mismo `contentHash` declarado, contenido distinto;
* mismo descriptor, observaciones distintas.

Debe detectarse como contradicción.

Nunca declarar equivalencia.

---

## 23.4 Extensión compatible

Dataset B contiene todas las observaciones de A sin cambios, más observaciones nuevas válidas.

Verificar:

```text
RIGHT_EXTENDS_LEFT
COMPATIBLE_EVOLUTION
sharedCount correcto
onlyRightCount correcto
conflictCount = 0
```

Crear también el caso inverso:

```text
LEFT_EXTENDS_RIGHT
```

---

## 23.5 Divergencia

Casos:

* misma observación con contenido distinto;
* mismo `predictionId` y resultado distinto;
* observación eliminada y otra agregada;
* periodos superpuestos con conflicto;
* datasets parcialmente coincidentes sin relación de extensión.

Resultado:

```text
DIVERGENT
```

---

## 23.6 Incompatibilidad de schema

Casos:

* `schemaVersion` incompatible;
* `observationSchemaVersion` incompatible;
* `DatasetVersion` major incompatible.

Resultado:

```text
INCOMPATIBLE
```

No intentar migración.

---

## 23.7 Periodos

Cubrir:

```text
iguales
left contiene right
right contiene left
superpuestos
disjuntos
bordes inclusivos
periodo inválido
```

---

## 23.8 Observaciones

Cubrir:

```text
ONLY_IN_LEFT
ONLY_IN_RIGHT
SAME_ID_SAME_CONTENT
SAME_ID_DIFFERENT_CONTENT
SAME_PREDICTION_DIFFERENT_OUTCOME
LOGICAL_CONFLICT
```

Incluir duplicados no adyacentes en artefactos diagnósticos.

---

## 23.9 Comparación operativa

Cubrir diferencias en:

* `datasetId`;
* `datasetVersion`;
* `manifestHash`;
* manifest;
* policies;
* filters;
* provenance;
* lineage;
* metadata;
* createdAt;
* descriptor.

---

## 23.10 Integridad inválida

Un lado válido y otro corrupto.

Casos:

* contentHash alterado;
* manifestHash alterado;
* observaciones fuera de orden;
* estadísticas corruptas;
* descriptor incoherente.

El comparador debe usar el verificador y no declarar equivalencia.

---

## 23.11 Información incompleta

Casos:

* comparación operacional sin identity;
* descriptor faltante;
* versión ausente;
* metadata opcional ausente;
* lineage ausente.

Distinguir:

```text
SKIPPED
NOT_APPLICABLE
INDETERMINATE
```

según el contrato final.

---

## 23.12 Modos

Cubrir:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

Comprobar:

* dimensiones ejecutadas;
* dimensiones omitidas;
* clasificación;
* warnings;
* opciones inválidas.

---

## 23.13 Reporte

Cubrir:

* deep freeze;
* serialización determinista;
* orden estable;
* diferencias científicas;
* diferencias operativas;
* filtros por categoría;
* conteos;
* truncamiento explícito si existe;
* resumen;
* ausencia de timestamps automáticos;
* mismo input produce misma salida.

---

## 23.14 Inmutabilidad

Congelar profundamente inputs.

Verificar:

* no ordenamiento in-place;
* no modificación de observaciones;
* no modificación de identity;
* no modificación de descriptor;
* no modificación de manifest;
* no modificación de statistics.

---

## 23.15 Rendimiento lógico

Crear dataset de tamaño moderado y comprobar que la comparación no realiza un algoritmo evidentemente cuadrático.

No agregues benchmarks frágiles basados en milisegundos.

Puedes probar instrumentando operaciones o inspeccionando la estrategia de índices.

---

## 23.16 Anti-side-effects

Comprobar:

* imports sin logs;
* sin filesystem;
* sin red;
* sin reloj;
* sin random;
* sin IDs;
* sin persistencia;
* sin reparación;
* sin mutación.

---

# 24. Fixtures

Crear helpers de tests para generar:

```text
exact match
scientific equivalent
operationally different
left extension
right extension
divergent
schema incompatible
content corrupted
descriptor drift
```

No modifiques contratos productivos para facilitar corrupción.

Construye copias controladas en tests.

---

# 25. Validación durante la implementación

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
hashes: preservados
integrity verifier: sin regresiones
lint: exit 0
build: exit 0
pipeline: GREEN
```

El total debe ser superior a 931.

No establezcas una cantidad artificial.

No elimines tests.

No uses `.skip`.

No uses `.only`.

No debilites assertions.

---

# 26. Barrel exports

Actualizar solo lo necesario:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

No exportar:

* índices internos;
* helpers de mapas;
* walkers;
* comparadores privados;
* fixtures;
* funciones de truncamiento;
* detalles de implementación.

Añadir pruebas de exports públicos.

---

# 27. Informe final

Crear:

```text
reports/trabajo/Fase2.3.4.4_dataset_comparison_reporte.md
```

Contenido obligatorio:

```text
1. Resumen ejecutivo
2. Estado Git
3. Baseline inicial
4. Arquitectura inspeccionada
5. Decisiones de diseño
6. Componentes implementados
7. Archivos creados
8. Archivos modificados
9. APIs públicas
10. Clasificaciones
11. Modos de comparación
12. Prevalidación de integridad
13. Igualdad exacta
14. Equivalencia científica
15. Equivalencia operativa
16. Evolución compatible
17. Divergencia
18. Incompatibilidad
19. Comparación de periodos
20. Comparación de observaciones
21. Comparación de versiones
22. Comparación de identity
23. Comparación de manifest
24. Comparación de descriptor
25. Modelo de diferencias
26. Determinismo
27. Inmutabilidad
28. Rendimiento
29. Errores tipados
30. Tests agregados
31. Tests focalizados
32. Suite completa
33. Lint
34. Build
35. Warnings
36. Git diff summary
37. Riesgos
38. Pendientes
39. Fuera de alcance
40. Recomendación para Fase 2.3.4.5
41. Veredicto final
```

No inventes resultados.

Incluye resultados reales.

Registra expresamente que el workspace estaba sucio antes de la fase si continúa así.

---

# 28. Punto de control

Si todo queda verde, crear:

```text
Fase_2.3.4.4_cerrada.md
```

Debe incluir:

* timestamp;
* estado;
* baseline actualizado;
* componentes;
* clasificaciones;
* modos;
* APIs;
* invariantes;
* tests;
* lint;
* build;
* warnings;
* estado Git;
* riesgos;
* pendientes;
* siguiente subfase;
* prompt de reanudación.

Si no queda verde:

```text
Fase_2.3.4.4_pendiente.md
```

No declarar cierre si:

* falla una prueba;
* artefactos equivalentes se clasifican como divergentes;
* artefactos divergentes se clasifican como equivalentes;
* artefactos corruptos se aceptan como comparables;
* se mutan inputs;
* se rompe integridad;
* lint falla;
* build falla.

---

# 29. Git y seguridad operacional

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
git diff -- src/historical-evidence tests/historical-evidence src/calibration tests/calibration
```

También crear un inventario explícito de archivos tocados por esta fase.

No atribuyas el diff global completo a esta implementación.

---

# 30. Criterios de aceptación

La Fase 2.3.4.4 solo puede cerrarse si:

* [ ] se verificó el baseline;
* [ ] se inspeccionó el verificador de integridad;
* [ ] se reutiliza el verificador;
* [ ] se reutiliza serialización canónica;
* [ ] existe `DatasetComparator`;
* [ ] existe `DatasetComparisonReport`;
* [ ] existen clasificaciones explícitas;
* [ ] existen modos explícitos;
* [ ] igualdad exacta está implementada;
* [ ] equivalencia científica está implementada;
* [ ] equivalencia operativa está documentada;
* [ ] evolución compatible es direccional;
* [ ] divergencia está implementada;
* [ ] incompatibilidad está implementada;
* [ ] comparación de periodos está implementada;
* [ ] comparación de observaciones está implementada;
* [ ] conflictos lógicos se detectan;
* [ ] schemas incompatibles se detectan;
* [ ] versions incompatibles se detectan;
* [ ] artefactos corruptos no se declaran equivalentes;
* [ ] el reporte es determinista;
* [ ] el reporte es inmutable;
* [ ] los inputs no se mutan;
* [ ] no se duplicó hashing;
* [ ] no se duplicó serialización;
* [ ] no se duplicó integridad;
* [ ] no se implementó reparación;
* [ ] no se implementó merge;
* [ ] no se implementó lineage completo;
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

# 31. Veredicto esperado

Si todos los criterios se cumplen:

```text
FASE 2.3.4.4: COMPLETADA
DATASET COMPARATOR: IMPLEMENTADO
DATASET COMPARISON REPORT: IMPLEMENTADO
EXACT MATCH: IMPLEMENTADO
SCIENTIFIC EQUIVALENCE: IMPLEMENTADA
OPERATIONAL COMPARISON: IMPLEMENTADA
COMPATIBLE EVOLUTION: IMPLEMENTADA
DIVERGENCE DETECTION: IMPLEMENTADA
SCHEMA COMPATIBILITY: IMPLEMENTADA
VERSION COMPATIBILITY: IMPLEMENTADA
PERIOD COMPARISON: IMPLEMENTADA
OBSERVATION DIFFERENCES: IMPLEMENTADAS
INTEGRITY PREVALIDATION: IMPLEMENTADA
AUTOMATIC MERGE: NO IMPLEMENTADO
AUTOMATIC REPAIR: NO IMPLEMENTADA
LINEAGE GRAPH: NO IMPLEMENTADO
PERSISTENCIA: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
ENTRENAMIENTO: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA
PIPELINE: GREEN
```

Si algún criterio falla:

```text
FASE 2.3.4.4: PENDIENTE
```

Debe indicar:

* qué falló;
* qué clasificación está afectada;
* qué pruebas fallan;
* qué riesgo existe;
* qué falta para cerrar.

---

# 32. Secuencia de ejecución

Trabaja en este orden:

```text
1. Leer puntos de control e informes.
2. Inspeccionar Git.
3. Inspeccionar arquitectura.
4. Confirmar APIs canónicas.
5. Confirmar APIs de integridad.
6. Ejecutar baseline.
7. Crear nota técnica.
8. Definir matriz de clasificación.
9. Definir modelo de diferencias.
10. Implementar modos.
11. Implementar comparación de integridad.
12. Implementar comparación científica.
13. Implementar comparación de periodos.
14. Implementar comparación de observaciones.
15. Implementar evolución direccional.
16. Implementar comparación operativa.
17. Implementar reporte.
18. Implementar comparador.
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

# 33. Instrucción final

Trabaja de manera autónoma, conservadora y verificable.

No pidas confirmación para decisiones menores que puedan resolverse inspeccionando el repositorio.

Ante una ambigüedad:

1. verifica integridad antes de comparar;
2. prioriza representación canónica;
3. separa ciencia de operación;
4. evita conclusiones no demostradas;
5. preserva hashes y schemas;
6. no repares;
7. no mezcles;
8. no migres;
9. minimiza cambios;
10. documenta la decisión.

No declares éxito únicamente porque dos hashes coinciden.

Debes demostrar también que:

```text
datasets iguales
→ exact match

datasets científicamente iguales y operativamente distintos
→ scientific equivalence

datasets extendidos sin conflictos
→ compatible evolution

datasets válidos con conflictos
→ divergent

datasets incompatibles o corruptos
→ no equivalentes
```

La condición final de cierre es:

```text
clasificación correcta
+
comparación determinista
+
integridad prevalidada
+
inputs intactos
+
suite completa en verde
```

Comienza ahora.
