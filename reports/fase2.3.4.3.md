# PROMPT MAESTRO — FASE 2.3.4.3

## Dataset Integrity Verification

Actúa como **arquitecto principal de software, ingeniero senior de dominio, auditor de integridad y revisor científico** del proyecto **Roulette Tracker Pro**.

Tu tarea es inspeccionar el repositorio, diseñar, implementar, probar y documentar exclusivamente la:

> **Fase 2.3.4.3 — Dataset Integrity Verification**

El objetivo es implementar una infraestructura determinista, inmutable y auditable capaz de verificar la integridad de datasets históricos, identidades y descriptores de snapshot.

Esta fase debe detectar inconsistencias y manipulación.

No debe reparar, migrar, persistir, exportar, entrenar ni promover modelos.

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

Puntos de control y documentos obligatorios:

```text
Fase_2.3.3_cerrada.md
Fase_2.3.4.1_cerrada.md
Fase_2.3.4.2_cerrada.md
```

Si `Fase_2.3.4.2_cerrada.md` todavía no existe, utiliza como fuentes de cierre:

```text
reports/trabajo/Fase2.3.4.2_canonical_serialization_reporte.md
reports/trabajo/Fase2.3.4.2_nota_tecnica_diseno.md
```

Antes de modificar código:

1. lee completamente los puntos de control disponibles;
2. lee el informe final de la Fase 2.3.4.2;
3. lee la nota técnica de la Fase 2.3.4.2;
4. inspecciona el código real;
5. confirma que las APIs documentadas existen;
6. no asumas paths o firmas sin verificarlos.

No repitas fases anteriores.

No reviertas decisiones ya cerradas.

---

# 2. Baseline esperado

El cierre informado de la Fase 2.3.4.2 es:

```text
FASE 2.3.4.2: COMPLETADA
TESTS: 925/925 PASS
TESTS FOCALIZADOS: 42/42 PASS
LINT: OK
BUILD: OK
PIPELINE: GREEN
```

Componentes y APIs existentes:

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

Componentes anteriores también disponibles:

```text
DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory
HistoricalCalibrationDataset
DatasetManifest
DatasetStatistics
```

No asumas que el baseline sigue válido.

Debes comprobarlo antes de implementar.

---

# 3. Arquitectura científica vigente

La cadena actual es:

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
      │
      ├──────────────► DatasetIdentity
      │
      ├──────────────► DatasetSnapshotDescriptor
      │
      └──────────────► Canonical Serialization
```

La Fase 2.3.4.3 debe añadir:

```text
HistoricalCalibrationDataset
DatasetIdentity
DatasetSnapshotDescriptor
        │
        ▼
DatasetIntegrityVerifier
        │
        ▼
DatasetIntegrityReport
```

La verificación debe ser completamente observacional.

No debe modificar ninguno de los inputs.

---

# 4. Objetivo general

Implementar una infraestructura capaz de verificar:

1. integridad del contenido científico;
2. integridad del manifiesto;
3. coherencia de identidad;
4. coherencia entre dataset y descriptor;
5. versiones y schemas;
6. orden canónico;
7. duplicados;
8. estadísticas declaradas;
9. periodo;
10. estructura;
11. manipulación;
12. corrupción lógica detectable.

La fase debe responder de forma determinista:

```text
¿El snapshot sigue siendo coherente con sus contratos,
hashes, identidad, manifiesto y contenido?
```

---

# 5. Principios obligatorios

Toda la implementación debe respetar:

1. determinismo;
2. reproducibilidad;
3. inmutabilidad profunda;
4. cero efectos secundarios;
5. errores tipados;
6. separación entre verificación y reparación;
7. separación entre contenido científico e identidad operativa;
8. reutilización de serialización canónica;
9. reutilización del SHA-256 oficial;
10. ausencia de lógica duplicada;
11. ausencia de reloj global;
12. ausencia de `Math.random()`;
13. ausencia de persistencia;
14. ausencia de exportación;
15. ausencia de entrenamiento;
16. ausencia de promoción;
17. ausencia de migración automática;
18. ausencia de tolerancia silenciosa ante corrupción.

---

# 6. Alcance obligatorio

Implementa como mínimo los siguientes contratos conceptuales.

Los nombres pueden ajustarse a las convenciones reales del repositorio, pero toda desviación debe justificarse.

---

## 6.1 `DatasetIntegrityVerifier`

Crear un servicio o componente de aplicación cuya responsabilidad sea:

```text
dataset
+
identity opcional
+
descriptor opcional
+
opciones explícitas
        ↓
DatasetIntegrityReport
```

Debe aceptar diferentes niveles de verificación.

Ejemplo conceptual:

```javascript
verifyDataset(dataset)
verifyDatasetWithIdentity(dataset, identity)
verifySnapshot(dataset, descriptor)
```

o una única API explícita:

```javascript
verify({
  dataset,
  identity,
  descriptor,
  options
})
```

No utilices parámetros booleanos ambiguos.

Evita APIs como:

```javascript
verify(dataset, true, false, true)
```

---

## 6.2 `DatasetIntegrityReport`

Crear un Value Object profundamente inmutable.

Debe representar el resultado completo de una verificación.

Debe contener, como mínimo:

```text
valid
status
checks
errors
warnings
summary
```

Cada check debe tener una estructura explícita, por ejemplo:

```text
checkId
category
status
expected
actual
message
path
severity
```

No es obligatorio exponer todos esos campos si el diseño real demuestra una estructura mejor, pero el reporte debe permitir identificar con precisión:

* qué se verificó;
* qué falló;
* dónde falló;
* qué se esperaba;
* qué se encontró;
* si el fallo invalida el snapshot.

---

## 6.3 Estados de verificación

Implementar estados explícitos.

Ejemplo:

```text
PASS
FAIL
SKIPPED
NOT_APPLICABLE
```

Estado global sugerido:

```text
VALID
INVALID
INCOMPLETE
```

No inventes nombres si el repositorio ya tiene una convención.

El significado debe quedar documentado.

### Regla recomendada

```text
VALID:
  todos los checks obligatorios pasan

INVALID:
  al menos un check obligatorio falla

INCOMPLETE:
  faltan inputs necesarios para una verificación solicitada
```

No utilices excepciones para representar un dataset simplemente inválido.

Las excepciones deben reservarse para:

* inputs mal formados;
* errores de programación;
* opciones inválidas;
* tipos no soportados;
* imposibilidad técnica de ejecutar la verificación.

Un hash incorrecto debe producir un reporte inválido, no necesariamente lanzar una excepción.

---

# 7. Checks obligatorios

La fase debe implementar, como mínimo, los siguientes checks.

---

## 7.1 Verificación de `contentHash`

Recalcular el hash científico usando exclusivamente:

```text
projectScientificDataset
canonicalSerialize
canonicalHashSync
```

o las APIs oficiales equivalentes reales.

Comparar contra:

```text
dataset.contentHash
```

y, cuando exista:

```text
identity.contentHash
descriptor.identity.contentHash
```

Debe comprobar:

```text
recalculatedContentHash === declaredContentHash
```

No debes modificar el dataset.

No debes actualizar el hash incorrecto.

No debes reparar automáticamente.

### Casos a detectar

* contenido alterado;
* observación alterada;
* periodo alterado;
* schema alterado;
* hash declarado alterado;
* identidad con hash distinto;
* descriptor con hash distinto.

---

## 7.2 Verificación de `manifestHash`

Usar la representación canónica oficial del manifiesto.

Debe comparar el hash recalculado contra:

```text
dataset.manifestHash
identity.manifestHash
descriptor.identity.manifestHash
```

según los inputs presentes.

Debe detectar:

* manifest alterado;
* políticas alteradas;
* filtros alterados;
* metadata alterada;
* procedencia alterada;
* conteos alterados;
* manifestHash declarado incorrecto.

No cambies la semántica actual de `manifestHash`.

Antes de implementar, confirma exactamente qué payload utiliza actualmente `DatasetBuilder`.

---

## 7.3 Coherencia entre dataset e identidad

Cuando se proporcione `DatasetIdentity`, verificar:

```text
datasetId
schemaVersion
observationSchemaVersion
contentHash
manifestHash
datasetVersion
```

según lo que realmente exista en ambos contratos.

Debe diferenciar:

* equivalencia científica;
* equivalencia operativa;
* incompatibilidad;
* ausencia de campos;
* datos contradictorios.

No exijas igualdad de campos que no pertenezcan al dataset real.

Inspecciona primero las APIs.

---

## 7.4 Coherencia entre dataset y descriptor

Cuando se proporcione `DatasetSnapshotDescriptor`, verificar:

* identidad;
* periodo;
* manifiesto;
* estadísticas;
* políticas;
* filtros;
* metadata;
* procedencia;
* lineage básico;
* createdAt, si corresponde;
* schema versions;
* hashes.

El descriptor no contiene observaciones completas.

No intentes reconstruir el dataset desde el descriptor.

Solo verifica coherencia de los campos compartidos.

---

## 7.5 Verificación de schema

Validar:

```text
schemaVersion
observationSchemaVersion
```

Debe detectar:

* schema faltante;
* schema no soportado;
* schemas inconsistentes;
* observaciones con schema diferente;
* identity con schema contradictorio;
* descriptor con schema contradictorio.

Reutiliza políticas existentes.

No migres schemas.

No reinterpretar datos.

---

## 7.6 Verificación de orden canónico

El orden científico vigente es:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

Verificar que el array de observaciones cumple el orden oficial.

Reutiliza el comparador existente.

No implementes un segundo algoritmo.

No ordenar el array para “hacerlo válido”.

Un dataset fuera de orden debe reportarse como inválido.

La verificación no debe mutar ni normalizar el input.

---

## 7.7 Verificación de duplicados

Reutiliza la política vigente:

```text
duplicatePolicy = REJECT
```

Debe detectar:

* `observationId` duplicado;
* mismo ID con contenido distinto;
* misma pareja `predictionId + outcomeId`;
* `predictionId` repetido;
* duplicados no adyacentes;
* duplicados lógicos.

No dupliques la lógica del `DatasetBuilder` si existe una primitiva reutilizable.

Si la lógica está embebida, evalúa extraerla conservadoramente.

Toda extracción debe preservar el comportamiento actual.

---

## 7.8 Verificación cronológica

Debe comprobar:

```text
predictionCreatedAt <= outcomeRecordedAt
```

También verificar que:

* timestamps sean válidos;
* periodo sea coherente;
* observaciones estén dentro del periodo declarado si ese contrato así lo exige;
* filtros temporales se mantengan inclusivos:

```text
from <= timestamp <= to
```

No reparar timestamps.

No inferir fechas.

---

## 7.9 Verificación de estadísticas

Recalcular estadísticas descriptivas usando la implementación oficial de:

```text
DatasetStatistics
```

y compararlas con las estadísticas declaradas.

Debe incluir, según el contrato existente:

```text
observationCount
positiveOutcomeCount
negativeOutcomeCount
positiveRate
rawScore.min
rawScore.max
rawScore.mean
effectiveProbability.min
effectiveProbability.max
effectiveProbability.mean
calibratedCount
uncalibratedCount
targetTypeCounts
calibrationStrategyCounts
spinCount
predictionCount
```

No implementes nuevas métricas.

No implementes:

* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* intervalos de confianza.

Comparaciones numéricas deben usar una política explícita.

Antes de usar tolerancias, revisa si las estadísticas actuales son deterministas y exactas.

No introduzcas tolerancias arbitrarias.

---

## 7.10 Verificación de inmutabilidad estructural

Evaluar si el snapshot cumple los contratos de congelamiento esperados:

* objeto raíz;
* observaciones;
* arrays;
* manifest;
* statistics;
* metadata;
* identity;
* descriptor;
* provenance;
* lineage.

Este check debe distinguir entre:

```text
integridad científica
```

y:

```text
garantía de inmutabilidad runtime
```

Un objeto no congelado puede tener contenido correcto, pero romper el contrato del dominio.

Documenta si eso produce `FAIL` o `WARNING`.

La política debe ser explícita.

---

## 7.11 Verificación de identidad científica

Debe confirmar que la identidad científica declarada corresponde al contenido.

Regla:

```text
mismo contenido científico
→ mismo contentHash
```

No asumir:

```text
mismo datasetId
→ misma evidencia científica
```

Debe detectar:

* mismo `datasetId` con contenido distinto;
* mismo `contentHash` con distinto contenido;
* identity desacoplada del dataset;
* descriptor desacoplado de identity.

---

## 7.12 Verificación de identidad operativa

Debe verificar coherencia entre:

```text
datasetId
manifestHash
createdAt
datasetVersion
descriptor
```

sin confundirla con equivalencia científica.

Un snapshot puede ser científicamente equivalente y operativamente distinto.

El reporte debe representar esa diferencia.

---

# 8. Niveles de verificación

Implementa opciones explícitas o perfiles.

Ejemplo conceptual:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

### `SCIENTIFIC`

Incluye:

* contentHash;
* schemas;
* orden;
* duplicados;
* cronología;
* estadísticas;
* estructura científica.

### `OPERATIONAL`

Incluye:

* manifestHash;
* identidad;
* descriptor;
* metadata;
* políticas;
* filtros;
* procedencia.

### `FULL`

Incluye todos los checks disponibles.

No implementes perfiles adicionales sin necesidad.

No uses strings libres sin validación.

---

# 9. Checks y reporte

Cada check debe ser independiente y determinista.

Ejemplo conceptual:

```text
CONTENT_HASH
MANIFEST_HASH
DATASET_SCHEMA
OBSERVATION_SCHEMA
CANONICAL_ORDER
DUPLICATES
CHRONOLOGY
STATISTICS
DATASET_IDENTITY
SNAPSHOT_DESCRIPTOR
IMMUTABILITY
PERIOD
```

El reporte final debe permitir:

```javascript
report.isValid()
report.hasFailures()
report.getFailures()
report.getWarnings()
report.getCheck("CONTENT_HASH")
report.toJSON()
```

Estos métodos son orientativos.

No crees una API excesiva.

---

# 10. Errores tipados

Reutiliza el sistema de errores existente.

Crea errores nuevos solo cuando sean necesarios.

Ejemplos orientativos:

```text
DatasetIntegrityVerificationError
InvalidIntegrityVerificationInputError
InvalidIntegrityVerificationOptionsError
UnsupportedIntegrityCheckError
IncompleteIntegrityVerificationError
```

No utilices excepciones para cada hash incorrecto.

Un hash incorrecto pertenece al reporte.

Las excepciones deben representar imposibilidad de ejecutar correctamente el proceso.

---

# 11. Inmutabilidad

El verificador debe ser completamente observacional.

Está prohibido:

* ordenar arrays in-place;
* reemplazar hashes;
* normalizar inputs;
* agregar propiedades;
* corregir metadata;
* recalcular y guardar estadísticas;
* congelar inputs como side effect;
* reparar schemas;
* eliminar duplicados;
* reescribir timestamps.

Las pruebas deben comparar inputs antes y después.

También deben usar objetos profundamente congelados.

---

# 12. Relación con serialización canónica

La Fase 2.3.4.2 estableció una única fuente de verdad.

El verificador debe reutilizar:

```text
canonicalSerialize
canonicalHashSync
projectScientificDataset
projectObservation
serializeDatasetManifest
serializeDatasetIdentity
serializeDatasetSnapshotDescriptor
```

según corresponda.

No debes crear:

* otro ordenamiento de claves;
* otro serializador;
* otro SHA-256;
* otro payload de contentHash;
* otro payload de manifestHash.

Si necesitas una proyección adicional, debe estar claramente justificada y ser coherente con las existentes.

---

# 13. Decisiones cerradas que deben preservarse

Mantener:

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

Semántica de `contentHash`:

```text
incluye:
- schemaVersion
- observationSchemaVersion
- period
- observations

excluye:
- datasetId
- createdAt
```

Semántica de `manifestHash`:

```text
representa el manifiesto operativo completo
```

No cambiar estas reglas.

---

# 14. Fuera de alcance

Está estrictamente prohibido implementar:

* reparación automática;
* modificación de snapshots;
* migración de schemas;
* deserialización;
* importación;
* persistencia;
* filesystem snapshots;
* SQLite;
* DuckDB;
* PostgreSQL;
* almacenamiento remoto;
* CSV;
* JSONL;
* Parquet;
* Arrow;
* compresión;
* cifrado;
* firma digital;
* comparación avanzada entre datasets;
* grafo completo de lineage;
* entrenamiento;
* selección de modelos;
* ranking;
* PromotionPolicy;
* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* UI;
* captura productiva;
* integración automática con `SpinManager`;
* cambios productivos en `ConsensusEngine`;
* cambios productivos en `ProbabilityCalibrator`.

Si detectas una necesidad, documéntala.

No la implementes.

---

# 15. Inspección inicial obligatoria

Antes de modificar código ejecuta:

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
HistoricalCalibrationDataset
DatasetBuilder
DatasetManifest
DatasetStatistics
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory
DatasetVersion
DatasetVersionPolicy
canonicalSerialize
canonicalHashSync
projectScientificDataset
projectObservation
serializeDatasetManifest
serializeDatasetSnapshotDescriptor
deepFreeze
canonical comparator
chronology utilities
duplicate detection
schema validation
```

Usa búsquedas como:

```bash
grep -R "canonicalHashSync" -n src tests
grep -R "projectScientificDataset" -n src tests
grep -R "projectObservation" -n src tests
grep -R "DatasetStatistics" -n src/historical-evidence tests/historical-evidence
grep -R "duplicatePolicy" -n src/historical-evidence tests/historical-evidence
grep -R "predictionCreatedAt" -n src/historical-evidence tests/historical-evidence
grep -R "manifestHash" -n src/historical-evidence tests/historical-evidence
grep -R "contentHash" -n src/historical-evidence tests/historical-evidence
```

No asumas rutas o firmas.

---

# 16. Verificación del baseline

Antes de modificar código ejecuta:

```bash
npm run test
npm run lint
npm run build
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
```

Registra resultados reales.

El baseline esperado es:

```text
925/925 PASS o superior
lint: OK
build: OK
```

Si hay diferencias:

1. documéntalas;
2. determina si son preexistentes;
3. no las ocultes;
4. no fuerces verde;
5. no debilites pruebas.

---

# 17. Nota técnica previa

Antes de modificar archivos productivos, crea:

```text
reports/trabajo/Fase2.3.4.3_nota_tecnica_diseno.md
```

Debe incluir:

```text
1. Arquitectura encontrada
2. Baseline real
3. Contratos existentes
4. Semántica real de contentHash
5. Semántica real de manifestHash
6. Política real de duplicados
7. Comparador canónico existente
8. Estrategia de verificación
9. Checks propuestos
10. Modelo de reporte
11. Estados globales
12. Estados de checks
13. Estrategia de errores
14. Estrategia de inmutabilidad
15. Estrategia de pruebas
16. Archivos a crear
17. Archivos a modificar
18. Riesgos
19. Fuera de alcance
20. Criterios de aceptación
```

No modifiques producción antes de completar esta nota.

---

# 18. Arquitectura recomendada

Arquitectura conceptual:

```text
src/historical-evidence/
├── domain/
│   ├── DatasetIntegrityReport.js
│   ├── IntegrityCheckResult.js
│   ├── IntegrityCheckStatus.js
│   ├── DatasetIntegrityStatus.js
│   └── errors.js
│
└── application/
    ├── DatasetIntegrityVerifier.js
    ├── IntegrityVerificationMode.js
    └── checks/
        ├── verifyContentHash.js
        ├── verifyManifestHash.js
        ├── verifySchemas.js
        ├── verifyCanonicalOrder.js
        ├── verifyDuplicates.js
        ├── verifyChronology.js
        ├── verifyStatistics.js
        ├── verifyIdentity.js
        └── verifyDescriptor.js
```

Esta estructura es conceptual.

No la impongas si crea fragmentación innecesaria.

Evita una clase por cada función si el repositorio usa módulos funcionales.

Mantén dependencias:

```text
application → domain
application → canonical serialization compartida
```

Evita:

```text
domain → application
shared → historical-evidence
```

---

# 19. Estrategia de pruebas

Crear pruebas focalizadas exhaustivas.

---

## 19.1 Dataset válido

Construir un dataset real usando APIs oficiales.

Verificar:

```text
status = VALID
valid = true
sin errores
todos los checks obligatorios PASS
```

---

## 19.2 Corrupción de `contentHash`

Casos:

* cambiar un carácter del hash;
* reemplazarlo por otro hash válido;
* alterar observación sin actualizar hash;
* alterar periodo sin actualizar hash;
* alterar schema sin actualizar hash.

Debe producir:

```text
CONTENT_HASH = FAIL
status = INVALID
```

---

## 19.3 Corrupción de `manifestHash`

Casos:

* modificar manifest;
* modificar metadata;
* modificar filtros;
* modificar políticas;
* modificar conteos;
* modificar el hash declarado.

Debe producir fallo del check correspondiente.

---

## 19.4 Identity inconsistente

Casos:

* identity con `contentHash` distinto;
* identity con `manifestHash` distinto;
* identity con `datasetId` distinto;
* identity con schema distinto;
* identity con observation schema distinto;
* identity científicamente equivalente pero operativamente distinta.

El reporte debe diferenciar correctamente.

---

## 19.5 Descriptor inconsistente

Casos:

* periodo distinto;
* estadísticas distintas;
* manifest distinto;
* identity distinta;
* createdAt distinto cuando deba coincidir;
* metadata distinta;
* policies distintas;
* filters distintos;
* provenance distinta.

---

## 19.6 Orden canónico alterado

Crear un dataset o fixture alterado con observaciones fuera de orden.

No ordenar para validar.

Debe detectar el fallo.

---

## 19.7 Duplicados

Cubrir:

* observationId duplicado idéntico;
* observationId duplicado conflictivo;
* predictionId duplicado;
* predictionId + outcomeId duplicado;
* duplicado no adyacente;
* duplicado lógico.

---

## 19.8 Cronología

Cubrir:

* predicción anterior al outcome;
* igualdad permitida;
* predicción posterior al outcome;
* timestamp inválido;
* periodo incoherente;
* bordes inclusivos.

---

## 19.9 Estadísticas

Cubrir:

* estadísticas correctas;
* observationCount incorrecto;
* positiveRate incorrecto;
* medias incorrectas;
* targetTypeCounts incorrecto;
* calibrationStrategyCounts incorrecto;
* spinCount incorrecto;
* predictionCount incorrecto.

No generar las estadísticas esperadas usando exactamente la misma función bajo prueba sin fixtures independientes.

---

## 19.10 Inmutabilidad

Cubrir:

* dataset congelado;
* dataset no congelado;
* descriptor congelado;
* descriptor no congelado;
* arrays mutables;
* metadata mutable;
* observations mutables.

Verificar también que el verificador no muta nada.

---

## 19.11 Modos de verificación

Cubrir:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

Comprobar:

* checks incluidos;
* checks omitidos;
* estado `SKIPPED`;
* inputs insuficientes;
* modo inválido.

---

## 19.12 Reporte

Cubrir:

* serialización del reporte;
* inmutabilidad;
* orden estable de checks;
* filtros de errores;
* filtros de warnings;
* determinismo;
* mismo input produce mismo reporte.

No incluir timestamps generados automáticamente en el reporte.

---

## 19.13 Errores

Cubrir:

* dataset ausente;
* dataset inválido;
* identity inválida;
* descriptor inválido;
* opciones inválidas;
* modo desconocido;
* tipos no soportados;
* fallo interno de hashing inyectado, si se permite inyección.

---

## 19.14 Anti-side-effects

Comprobar:

* imports sin side effects;
* sin acceso a filesystem;
* sin logs;
* sin reloj;
* sin IDs;
* sin random;
* sin mutación;
* sin reparación.

---

# 20. Fixtures de corrupción

Crear fixtures o helpers de tests que permitan simular corrupción sin modificar objetos congelados directamente.

Preferir:

```text
serialización controlada
→ copia alterada
→ reconstrucción de input de prueba
```

No debilites la inmutabilidad productiva para facilitar tests.

No agregues métodos productivos de corrupción.

---

# 21. Validación durante la implementación

Ejecuta frecuentemente:

```bash
npx vitest run tests/historical-evidence/
```

También:

```bash
npm exec vitest run tests/calibration/CanonicalHash.test.js
```

Al finalizar:

```bash
npm run test
npm run lint
npm run build
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
```

Resultado requerido:

```text
tests anteriores: todos PASS
tests nuevos: todos PASS
hashes históricos: preservados
lint: OK
build: OK
pipeline: GREEN
```

No establezcas una cifra arbitraria.

El total debe ser superior a 925.

No elimines tests.

No uses `.skip`.

No uses `.only`.

No debilites assertions.

---

# 22. Calidad de implementación

La solución debe cumplir:

* APIs mínimas;
* responsabilidades únicas;
* funciones pequeñas;
* contratos explícitos;
* errores tipados;
* cero duplicación;
* cero dependencias circulares;
* cero side effects;
* cero dependencias nuevas salvo necesidad crítica;
* estilo consistente;
* exports controlados;
* no exposición de helpers internos;
* compatibilidad con módulos actuales;
* documentación precisa.

No introduzcas TypeScript si el proyecto sigue en JavaScript.

No reformatees el repositorio completo.

No migres módulos no relacionados.

---

# 23. Barrel exports

Actualizar únicamente los barrels necesarios:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

No exportes:

* helpers internos de checks;
* walkers;
* comparadores privados;
* detalles de implementación;
* fixtures.

Agregar pruebas de exports públicos si el proyecto las utiliza.

---

# 24. Documentación técnica

Documentar:

1. definición de integridad científica;
2. definición de integridad operativa;
3. diferencia entre invalidación y excepción;
4. checks disponibles;
5. niveles de verificación;
6. significado de `VALID`;
7. significado de `INVALID`;
8. significado de `INCOMPLETE`;
9. semántica de `contentHash`;
10. semántica de `manifestHash`;
11. verificación de identidad;
12. verificación de descriptor;
13. verificación de orden;
14. verificación de duplicados;
15. verificación cronológica;
16. verificación de estadísticas;
17. verificación de inmutabilidad;
18. limitaciones;
19. fuera de alcance;
20. preparación para comparación y lineage.

---

# 25. Informe final

Crear:

```text
reports/trabajo/Fase2.3.4.3_dataset_integrity_verification_reporte.md
```

Debe incluir:

```text
1. Resumen ejecutivo
2. Estado inicial
3. Baseline real
4. Arquitectura inspeccionada
5. Decisiones de diseño
6. Componentes implementados
7. Archivos creados
8. Archivos modificados
9. APIs públicas
10. Estados de integridad
11. Checks implementados
12. Modos de verificación
13. Content hash verification
14. Manifest hash verification
15. Schema verification
16. Canonical order verification
17. Duplicate verification
18. Chronology verification
19. Statistics verification
20. Identity verification
21. Descriptor verification
22. Immutability verification
23. Errores tipados
24. Estrategia de no mutación
25. Tests agregados
26. Fixtures de corrupción
27. Tests focalizados
28. Suite completa
29. Lint
30. Build
31. Git diff summary
32. Riesgos
33. Pendientes
34. Fuera de alcance
35. Recomendación para Fase 2.3.4.4
36. Veredicto final
```

No inventes resultados.

Incluye resultados reales.

---

# 26. Punto de control

Si todo queda verde, crear:

```text
Fase_2.3.4.3_cerrada.md
```

Debe incluir:

* timestamp;
* estado;
* baseline;
* componentes;
* checks;
* modos;
* APIs;
* tests;
* lint;
* build;
* invariantes;
* riesgos;
* pendientes;
* siguiente fase;
* prompt de reanudación.

Si no queda verde:

```text
Fase_2.3.4.3_pendiente.md
```

No declares cierre si:

* falla una prueba;
* falla un hash válido;
* un dataset corrupto pasa como válido;
* se modifica un input;
* lint falla;
* build falla;
* existen regresiones.

---

# 27. Git y seguridad

No ejecutar automáticamente:

```bash
git commit
git push
git tag
git reset --hard
git clean -fd
git checkout -- .
```

No borrar archivos ajenos.

No instalar dependencias sin justificación crítica.

Al finalizar mostrar:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence src/calibration tests/calibration
```

Guardar el diff completo en reportes si es demasiado extenso.

---

# 28. Criterios de aceptación

La Fase 2.3.4.3 solo puede cerrarse si:

* [ ] se verificó el baseline;
* [ ] se inspeccionó el hashing real;
* [ ] se inspeccionó la serialización real;
* [ ] existe `DatasetIntegrityVerifier`;
* [ ] existe `DatasetIntegrityReport`;
* [ ] existe verificación de `contentHash`;
* [ ] existe verificación de `manifestHash`;
* [ ] existe verificación de schemas;
* [ ] existe verificación de orden canónico;
* [ ] existe verificación de duplicados;
* [ ] existe verificación cronológica;
* [ ] existe verificación de estadísticas;
* [ ] existe verificación de identidad;
* [ ] existe verificación de descriptor;
* [ ] existe política explícita de inmutabilidad;
* [ ] existen modos de verificación;
* [ ] hashes incorrectos producen reporte inválido;
* [ ] inputs inválidos producen errores tipados;
* [ ] no se repara automáticamente;
* [ ] no se mutan inputs;
* [ ] no se duplicó serialización;
* [ ] no se duplicó SHA-256;
* [ ] no cambió el orden canónico;
* [ ] no cambió la semántica de hashes;
* [ ] no hay persistencia;
* [ ] no hay exportadores;
* [ ] no hay deserialización;
* [ ] no hay migración;
* [ ] no hay entrenamiento;
* [ ] no hay promoción;
* [ ] tests focalizados PASS;
* [ ] suite completa PASS;
* [ ] lint limpio;
* [ ] build OK;
* [ ] informe creado;
* [ ] punto de control creado;
* [ ] pipeline GREEN.

---

# 29. Veredicto esperado

Si todos los criterios se cumplen:

```text
FASE 2.3.4.3: COMPLETADA
DATASET INTEGRITY VERIFIER: IMPLEMENTADO
DATASET INTEGRITY REPORT: IMPLEMENTADO
CONTENT HASH VERIFICATION: IMPLEMENTADA
MANIFEST HASH VERIFICATION: IMPLEMENTADA
SCHEMA VERIFICATION: IMPLEMENTADA
CANONICAL ORDER VERIFICATION: IMPLEMENTADA
DUPLICATE VERIFICATION: IMPLEMENTADA
CHRONOLOGY VERIFICATION: IMPLEMENTADA
STATISTICS VERIFICATION: IMPLEMENTADA
IDENTITY VERIFICATION: IMPLEMENTADA
SNAPSHOT DESCRIPTOR VERIFICATION: IMPLEMENTADA
AUTOMATIC REPAIR: NO IMPLEMENTADA
PERSISTENCIA: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
DESERIALIZACIÓN: NO IMPLEMENTADA
ENTRENAMIENTO: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA
PIPELINE: GREEN
```

Si algún criterio falla:

```text
FASE 2.3.4.3: PENDIENTE
```

Debe indicar:

* qué falló;
* qué checks están afectados;
* qué pruebas fallan;
* qué riesgo existe;
* qué falta para cerrar.

---

# 30. Secuencia de ejecución

Trabaja en este orden:

```text
1. Leer puntos de control.
2. Leer informe y nota técnica de 2.3.4.2.
3. Inspeccionar Git.
4. Inspeccionar arquitectura.
5. Verificar APIs canónicas.
6. Ejecutar baseline.
7. Crear nota técnica.
8. Diseñar estados y reporte.
9. Diseñar modos de verificación.
10. Implementar checks de hashes.
11. Implementar checks de schemas.
12. Implementar check de orden.
13. Implementar check de duplicados.
14. Implementar check cronológico.
15. Implementar check de estadísticas.
16. Implementar check de identidad.
17. Implementar check de descriptor.
18. Implementar política de inmutabilidad.
19. Implementar verificador.
20. Actualizar exports.
21. Crear fixtures de corrupción.
22. Crear tests unitarios.
23. Crear tests de integración.
24. Ejecutar tests focalizados.
25. Corregir defectos.
26. Ejecutar suite completa.
27. Ejecutar lint.
28. Ejecutar build.
29. Revisar diff.
30. Crear informe final.
31. Crear punto de control.
32. Mostrar veredicto.
```

---

# 31. Instrucción final

Trabaja de manera autónoma, conservadora y verificable.

No pidas confirmación para decisiones menores que puedan resolverse inspeccionando el repositorio.

Ante ambigüedad:

1. reutiliza contratos existentes;
2. preserva hashes;
3. preserva schemas;
4. no repares;
5. no mutar;
6. minimiza cambios;
7. documenta decisiones;
8. no amplíes alcance.

No declares éxito solo porque un dataset válido pasa.

También debes demostrar que datasets manipulados o incoherentes son detectados correctamente.

La condición de cierre es:

```text
datasets válidos aceptados
+
datasets corruptos rechazados
+
inputs intactos
+
hashes preservados
+
suite completa en verde
```

Comienza ahora.
