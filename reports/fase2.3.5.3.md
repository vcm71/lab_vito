# PROMPT DE EJECUCIÓN — FASE 2.3.5.3

## Roulette Tracker Pro

### Dataset Split Leakage Detection and Validation

Actúa como arquitecto principal de software, ingeniero senior de JavaScript/Node.js y especialista en:

* Clean Architecture;
* Domain-Driven Design;
* validación científica de datasets;
* prevención de data leakage;
* evaluación temporal;
* sistemas reproducibles;
* diseño de contratos inmutables;
* trazabilidad científica;
* pruebas deterministas;
* auditoría de pipelines de machine learning.

Debes trabajar directamente sobre el repositorio:

```text
/home/shared/lab_vito
```

Proyecto:

```text
Roulette Tracker Pro
```

Nombres anteriores:

```text
ORION
ORION_v2
```

---

# 1. Punto de partida obligatorio

La Fase 2.3.5.2 está ejecutada y validada.

Se implementaron:

```text
GroupedTemporalDatasetSplitter
createGroupedTemporalSplitConfiguration
```

El splitter actual:

```text
- valida la configuración;
- valida la integridad del dataset fuente;
- agrupa observaciones por spinId;
- ordena observaciones y grupos de forma determinista;
- construye TRAIN, VALIDATION y TEST;
- usa periodos inclusivos derivados de timestamps reales;
- conserva la identidad del dataset fuente;
- rechaza timestamps ambiguos;
- rechaza particiones vacías;
- rechaza grupos sin asignación.
```

La verificación informada fue:

```text
tests: OK
lint: OK
build: OK
```

El reporte no contiene un total cuantificado de tests.

Por tanto, antes de implementar esta subfase debes obtener y registrar el baseline real actual.

---

# 2. Documentos obligatorios

Antes de modificar código, localiza y lee completamente:

```text
Fase_2.3.4_cerrada.md
Fase_2.3.5.1_cerrada.md
Fase_2.3.5.2_cerrada.md
Fase2.3.5.1_grouped_temporal_split_domain_reporte.md
Fase2.3.5.1_nota_tecnica_diseno.md
Fase2.3.5.2_reporte.md
```

Busca estos documentos en:

```text
/
reports/
reports/trabajo/
```

Si no existe `Fase_2.3.5.2_cerrada.md`, no lo inventes como preexistente.

En ese caso:

1. registra su ausencia;
2. usa `Fase2.3.5.2_reporte.md` como fuente de reanudación;
3. genera al final el punto de control correcto de la Fase 2.3.5.3.

No asumas que las rutas documentales coinciden exactamente con el repositorio.

---

# 3. Objetivo exacto

Ejecutar exclusivamente:

```text
Fase 2.3.5.3 —
Dataset Split Leakage Detection and Validation
```

El objetivo es implementar una capacidad explícita, determinista e inmutable para analizar un `GroupedTemporalSplit` y detectar evidencia de fuga o inconsistencia entre sus particiones.

Esta subfase debe validar el resultado del splitting.

No debe volver a construir el split.

No debe entrenar modelos.

No debe seleccionar calibradores.

No debe promover modelos.

No debe implementar persistencia.

---

# 4. Problema científico

Un split puede ser estructuralmente válido y aun contener riesgos de leakage no detectados durante su construcción.

La validación debe responder, como mínimo:

```text
¿Un spinId aparece en más de una partición?
¿Una observationId aparece en más de una partición?
¿Los periodos se solapan?
¿El orden TRAIN → VALIDATION → TEST es temporalmente válido?
¿Existen observaciones fuera del periodo declarado?
¿Todas las particiones provienen del mismo dataset fuente?
¿El split cubre correctamente el dataset fuente?
¿Existen observaciones omitidas?
¿Existen observaciones inesperadas?
¿La metadata coincide con el contenido real?
¿El split fue construido con una estrategia compatible?
```

El detector no debe modificar ni reparar el split.

Debe emitir un reporte.

---

# 5. Resultado arquitectónico esperado

Flujo conceptual:

```text
HistoricalCalibrationDataset
                │
                ├─────────────────────────────┐
                │                             │
                ▼                             ▼
GroupedTemporalDatasetSplitter       GroupedTemporalSplit
                                              │
                                              ▼
                              DatasetSplitLeakageDetector
                                              │
                                              ▼
                                  DatasetSplitLeakageReport
```

Nombre recomendado para el servicio:

```text
DatasetSplitLeakageDetector
```

Nombre recomendado para el reporte:

```text
DatasetSplitLeakageReport
```

También evalúa:

```text
DatasetSplitLeakageStatus
DatasetSplitLeakageFinding
DatasetSplitLeakageFindingType
DatasetSplitValidationMode
```

Los nombres pueden ajustarse a las convenciones reales del repositorio.

Toda desviación debe justificarse documentalmente.

---

# 6. Ubicación arquitectónica

Debes determinar la ubicación correcta tras inspeccionar el repositorio.

Recomendación:

```text
src/historical-evidence/application/
```

para:

```text
DatasetSplitLeakageDetector
```

Y preferentemente:

```text
src/historical-evidence/domain/
```

para value objects puros como:

```text
DatasetSplitLeakageReport
DatasetSplitLeakageFinding
DatasetSplitLeakageStatus
DatasetSplitLeakageFindingType
```

La decisión final debe respetar la arquitectura existente.

Dirección permitida:

```text
infrastructure → application → domain
```

Direcciones prohibidas:

```text
domain → application
domain → infrastructure
application → infrastructure
```

No introduzcas infraestructura en esta subfase.

---

# 7. Inspección previa obligatoria

Busca exhaustivamente:

```text
Leakage
LeakageDetector
DatasetLeakageDetector
SplitLeakage
DataLeakage
TemporalLeakage
GroupedTemporalSplit
GroupedTemporalDatasetSplitter
DatasetPartition
SplitPeriod
SplitMetadata
HistoricalCalibrationDataset
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
PairedBootstrap
TRAIN
VALIDATION
TEST
spinId
observationId
predictionCreatedAt
sourceDatasetIdentity
contentHash
manifestHash
```

Usa:

```bash
find
rg
grep
git grep
```

Debes determinar:

1. si ya existe un detector de leakage;
2. si existe uno en `src/calibration`;
3. si existe un reporte o clasificación reutilizable;
4. si existe un patrón para reportes de integridad;
5. si puede reutilizarse `DatasetIntegrityReport`;
6. si existe una jerarquía de findings;
7. cómo se accede a observaciones del dataset fuente;
8. cómo se representa cada partición;
9. si `DatasetPartition` contiene IDs o referencias suficientes;
10. cómo se comparan identidades de datasets;
11. cómo se validan periodos ISO;
12. cómo se preserva inmutabilidad;
13. qué errores base existen.

No dupliques una implementación compatible.

No copies ciegamente componentes de `src/calibration`.

---

# 8. Separación entre error y finding

Debes distinguir explícitamente:

## Error de ejecución

Impide ejecutar el detector.

Ejemplos:

```text
dataset fuente ausente
split ausente
tipo inválido
schema no soportado
configuración inválida
dependencia obligatoria ausente
```

## Finding de leakage o inconsistencia

La ejecución fue posible, pero se detectó una anomalía.

Ejemplos:

```text
spinId compartido
observationId compartida
periodos solapados
orden temporal inválido
observación omitida
observación inesperada
identidad fuente inconsistente
conteos incorrectos
metadata inconsistente
```

No lances una excepción por cada finding detectable.

El detector debe acumular findings cuando sea técnicamente seguro.

---

# 9. Estados del reporte

Evalúa un conjunto cerrado equivalente a:

```text
VALID
LEAKAGE_DETECTED
INVALID
INCOMPLETE
```

Semántica sugerida:

```text
VALID
No se detectaron findings bloqueantes.

LEAKAGE_DETECTED
Se detectó al menos una fuga entre particiones.

INVALID
El split contradice contratos fundamentales o no puede considerarse científicamente válido.

INCOMPLETE
No existe evidencia suficiente para completar todas las validaciones solicitadas.
```

No uses nombres ambiguos como:

```text
OK
BAD
ERROR
```

El estado debe derivarse determinísticamente de los findings.

---

# 10. Tipos de findings

Evalúa implementar tipos cerrados equivalentes a:

```text
DUPLICATE_SPIN_ACROSS_PARTITIONS
DUPLICATE_OBSERVATION_ACROSS_PARTITIONS
TEMPORAL_PERIOD_OVERLAP
TEMPORAL_ORDER_VIOLATION
OBSERVATION_OUTSIDE_DECLARED_PERIOD
SPIN_OUTSIDE_DECLARED_PERIOD
SOURCE_IDENTITY_MISMATCH
SOURCE_CONTENT_HASH_MISMATCH
SOURCE_MANIFEST_HASH_MISMATCH
MISSING_SOURCE_OBSERVATION
UNEXPECTED_PARTITION_OBSERVATION
PARTITION_COUNT_MISMATCH
SPLIT_COUNT_MISMATCH
EMPTY_PARTITION
INVALID_PARTITION_SEQUENCE
AMBIGUOUS_SPIN_TIMESTAMP
UNASSIGNED_SPIN
DUPLICATE_PARTITION_TYPE
UNSUPPORTED_SPLIT_STRATEGY
INCOMPLETE_VALIDATION_EVIDENCE
```

No implementes todos automáticamente.

Primero confirma qué datos existen realmente en los contratos.

Cada finding debe ser demostrable con la información disponible.

No simules validaciones sin evidencia.

---

# 11. Clasificación de severidad

Evalúa si cada finding debe incluir severidad:

```text
INFO
WARNING
ERROR
CRITICAL
```

Recomendación:

```text
WARNING
inconsistencia no concluyente o evidencia incompleta

ERROR
contrato científico inválido

CRITICAL
leakage directo entre TRAIN, VALIDATION o TEST
```

No uses severidad si no aporta una decisión clara.

No agregues complejidad decorativa.

---

# 12. Modos de validación

Evalúa un contrato equivalente a:

```text
STRUCTURAL
SOURCE_COVERAGE
FULL
```

## STRUCTURAL

Valida únicamente el `GroupedTemporalSplit`:

```text
duplicados entre particiones
solapamiento temporal
orden
tipos
conteos
identidad compartida
metadata
```

## SOURCE_COVERAGE

Compara el split con el dataset fuente:

```text
observaciones omitidas
observaciones inesperadas
spinIds omitidos
cobertura total
periodos respecto del dataset
identidad fuente
```

## FULL

Ejecuta ambas familias de validaciones.

Implementa modos únicamente si la arquitectura los justifica.

Una sola validación `FULL` puede ser suficiente para esta fase si reduce complejidad.

Documenta la decisión.

---

# 13. Validaciones estructurales obligatorias

El detector debe comprobar, como mínimo:

## 13.1 `spinId` compartido

Ningún `spinId` puede aparecer en más de una partición.

Esto constituye leakage directo.

Debe informarse:

```text
spinId
particiones afectadas
cantidad de apariciones
```

No incluyas objetos completos de observaciones en el finding.

---

## 13.2 `observationId` compartida

Ninguna `observationId` puede aparecer en más de una partición.

Debe considerarse leakage directo o corrupción estructural.

---

## 13.3 Solapamiento temporal

Los periodos inclusivos no pueden compartir límites ni intervalos.

Ejemplo inválido:

```text
TRAIN.to = 2026-01-01T10:00:00.000Z
TEST.from = 2026-01-01T10:00:00.000Z
```

Con semántica inclusiva, existe solapamiento.

---

## 13.4 Orden temporal

La secuencia válida debe respetar:

```text
TRAIN
→ VALIDATION opcional
→ TEST
```

No se permite:

```text
TEST antes de TRAIN
VALIDATION después de TEST
TRAIN posterior a TEST
```

La comparación debe usar las utilidades ISO existentes.

---

## 13.5 Tipos duplicados

No puede existir más de una partición del mismo tipo.

Aunque el contrato de dominio ya lo impida, el detector debe evaluar si recibe representaciones alteradas, deserializadas o incompatibles.

No confíes exclusivamente en el constructor si el objeto puede llegar de límites externos en el futuro.

---

## 13.6 Conteos

Comprueba:

```text
observationCount === observationIds.length
spinCount === spinIds.length
partitionCount === partitions.length
split.observationCount === suma de particiones
split.spinCount === suma de particiones
```

No recalcules ni alteres valores.

Solo compara y reporta.

---

# 14. Validaciones contra el dataset fuente

Cuando exista el dataset fuente, valida:

## 14.1 Identidad

Cada partición y el split deben referenciar el mismo:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

No confundas identidad científica y operativa.

Diferencias en `contentHash` son críticas.

Diferencias operativas deben clasificarse según las políticas vigentes.

---

## 14.2 Cobertura de observaciones

Compara:

```text
observationIds del dataset fuente
```

contra:

```text
unión de observationIds de las particiones
```

Detecta:

```text
observaciones omitidas
observaciones inesperadas
observaciones duplicadas
```

La comparación debe realizarse por identidad lógica.

No compares por posición.

---

## 14.3 Cobertura de spins

Compara:

```text
spinIds del dataset fuente
```

contra:

```text
unión de spinIds de las particiones
```

Detecta:

```text
spins omitidos
spins inesperados
spins compartidos
```

---

## 14.4 Pertenencia temporal

Para cada observación o grupo de spin:

```text
partition.period.from
<= timestamp científico
<= partition.period.to
```

El timestamp científico debe confirmarse en el repositorio.

No asumas una clave diferente a la usada por el splitter.

---

## 14.5 Coherencia de grupo

Todas las observaciones de un mismo `spinId` deben:

```text
estar en una sola partición
tener una política temporal coherente
corresponder al dataset fuente
```

Si el mismo spin contiene timestamps incompatibles, genera un finding explícito.

---

# 15. Integración con DatasetIntegrityVerifier

Debes evaluar si el detector debe ejecutar:

```text
DatasetIntegrityVerifier
```

sobre el dataset fuente antes de comparar cobertura.

Recomendación:

```text
sí, mediante dependencia inyectada o reutilización coherente
```

No dupliques checks de integridad del dataset.

Si el dataset fuente es inválido:

```text
no declares el split como libre de leakage
```

Puedes producir:

```text
INVALID
```

o:

```text
INCOMPLETE
```

según el contrato definido.

Documenta la decisión.

---

# 16. API propuesta

Evalúa una API equivalente a:

```javascript
const detector = new DatasetSplitLeakageDetector({
  integrityVerifier,
});

const report = detector.detect({
  dataset,
  split,
  mode: 'FULL',
});
```

También puede llamarse:

```javascript
validate
verify
analyze
```

El verbo elegido debe coincidir con el comportamiento.

Si devuelve findings y no lanza por anomalías detectables, `analyze` o `detect` son preferibles.

No ocultes dependencias.

No uses estado global.

---

# 17. Contrato del reporte

`DatasetSplitLeakageReport` debe ser profundamente inmutable.

Evalúa incluir:

```text
status
mode
isValid
hasLeakage
findings
checkedAt
sourceDatasetIdentity
splitId
summary
statistics
```

Sin embargo:

```text
checkedAt
```

solo puede existir si es inyectado.

No uses reloj global.

También puedes omitirlo si no es necesario.

El reporte debe permitir responder:

```text
¿la validación terminó?
¿se detectó leakage?
¿qué checks se ejecutaron?
¿qué findings se encontraron?
¿qué particiones están afectadas?
¿la evidencia fue suficiente?
```

No debe contener el dataset completo.

No debe contener todas las observaciones completas.

---

# 18. Contrato de finding

Cada finding debe ser determinista e inmutable.

Evalúa campos como:

```text
type
severity
message
partitionTypes
spinId
observationId
expected
actual
details
```

No todos los findings necesitan todos los campos.

Evita objetos de estructura libre excesiva.

Prefiere un contrato uniforme con contexto pequeño y serializable.

El orden de findings debe ser determinista.

Define un criterio estable, por ejemplo:

```text
severity
→ type
→ partitionType
→ spinId
→ observationId
```

No dependas del orden accidental de detección.

---

# 19. Determinismo

Dadas las mismas entradas, el reporte debe ser lógicamente idéntico.

No debe depender de:

```text
Math.random()
Date.now()
new Date()
crypto.randomUUID()
locale
zona horaria local
orden accidental de Map
orden accidental de Set
orden de propiedades
estado global
```

Si se incluye un identificador o timestamp de reporte, debe inyectarse.

Se recomienda no incluirlos si no son esenciales.

---

# 20. Inmutabilidad

Reutiliza las utilidades existentes.

Verifica que no puedan mutarse externamente:

```text
report
findings
summary
statistics
partitionTypes
details
identidad fuente
colecciones internas
```

No crees una segunda implementación de `deepFreeze`.

Incluye pruebas explícitas de mutación.

---

# 21. Manejo de objetos alterados

Los constructores actuales de dominio impiden varios estados inválidos.

Sin embargo, el detector debe ser capaz de analizar:

```text
objetos plain
snapshots
resultados deserializados futuros
objetos alterados en tests
representaciones incompletas
```

No es obligatorio aceptar cualquier objeto arbitrario.

Debes definir claramente:

```text
qué entrada es válida
qué entrada es analizable
qué entrada produce error de ejecución
qué entrada produce finding
```

No debilites los contratos de dominio.

---

# 22. Errores nuevos

Evalúa errores equivalentes a:

```text
InvalidDatasetSplitLeakageInputError
UnsupportedDatasetSplitValidationModeError
DatasetSplitLeakageDetectionError
IncompleteDatasetSplitEvidenceError
```

No agregues todos por defecto.

Reutiliza la jerarquía existente cuando corresponda.

Los errores deben ser tipados.

No incluyas datasets completos en mensajes de error.

---

# 23. Tests obligatorios

Crea pruebas focalizadas exhaustivas.

## 23.1 Split válido

Incluye:

```text
TRAIN + TEST válido
TRAIN + VALIDATION + TEST válido
múltiples observaciones por spin
cobertura completa
identidad fuente coherente
periodos correctos
conteos correctos
sin findings
status VALID
hasLeakage false
```

---

## 23.2 Leakage por spin

Incluye:

```text
spinId en TRAIN y TEST
spinId en TRAIN y VALIDATION
spinId en VALIDATION y TEST
```

Resultado esperado:

```text
finding explícito
hasLeakage true
estado bloqueante
```

---

## 23.3 Leakage por observación

Incluye:

```text
observationId compartida entre particiones
```

No dependas únicamente de spinId.

---

## 23.4 Solapamiento temporal

Incluye:

```text
solapamiento parcial
frontera inclusiva compartida
periodos invertidos
orden incorrecto
```

---

## 23.5 Cobertura

Incluye:

```text
observación fuente omitida
spin fuente omitido
observación inesperada
spin inesperado
duplicado
```

---

## 23.6 Identidad

Incluye diferencias en:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

Clasifica correctamente diferencias científicas y operativas.

---

## 23.7 Conteos

Incluye:

```text
observationCount incorrecto
spinCount incorrecto
partitionCount incorrecto
total del split incorrecto
```

---

## 23.8 Timestamp

Incluye:

```text
observación fuera del periodo
spin con timestamps ambiguos
timestamp ausente
timestamp inválido
```

---

## 23.9 Inmutabilidad

Intenta mutar:

```text
findings
finding
summary
statistics
identidad
colecciones internas
```

---

## 23.10 Determinismo

Ejecuta el detector varias veces con las mismas entradas.

Compara profundamente los reportes.

No uses timestamps generados.

---

# 24. Tests de regresión

Debes garantizar que continúen verdes:

```text
GroupedTemporalSplit.test.js
GroupedTemporalDatasetSplitter.test.js
HistoricalCalibrationDataset
DatasetBuilder
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
CanonicalHash
```

No modifiques pruebas existentes para ocultar regresiones.

---

# 25. Compatibilidad hacia atrás

No debes romper:

```text
DatasetPartitionType
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit
GroupedTemporalDatasetSplitter
createGroupedTemporalSplitConfiguration
HistoricalCalibrationDataset
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
```

No modifiques el splitter salvo que exista un defecto demostrado y directamente relacionado con esta fase.

Si debes corregirlo:

1. documenta el defecto;
2. agrega test de regresión;
3. limita el cambio;
4. no rediseñes la API sin necesidad.

---

# 26. Exports

Actualiza, según la estructura real:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

Solo exporta contratos públicos.

No exportes helpers internos de comparación, acumulación o normalización.

---

# 27. Fuera de alcance

No implementes:

```text
reparación automática del split
reconstrucción automática
reasignación de spins
modificación de periodos
merge automático
persistencia
exportadores
deserialización
migraciones
SQLite
DuckDB
PostgreSQL
Parquet
Arrow
CSV
JSONL
UI
entrenamiento
Brier Score
Log Loss
ECE
MCE
bootstrap
PairedBootstrap
model selection
ranking de calibradores
PromotionPolicy
captura productiva
```

No declares que el sistema evita todo leakage de machine learning.

Esta fase cubre:

```text
leakage detectable mediante estructura, identidad, cobertura y tiempo
```

No cubre todavía:

```text
feature leakage
target leakage dentro de features
preprocessing leakage
normalización global
leakage por selección de hiperparámetros
leakage por estados de modelos
leakage operacional entre experimentos
```

---

# 28. Proceso de trabajo obligatorio

## Paso 1 — Estado Git

Ejecuta:

```bash
cd /home/shared/lab_vito

git status --short
git branch --show-current
git log -1 --oneline
git diff --stat
```

El working tree ya ha sido reportado como sucio en fases anteriores.

No ejecutes:

```bash
git add .
git reset --hard
git clean -fd
git checkout .
git restore .
```

No reviertas cambios ajenos.

---

## Paso 2 — Baseline real

Ejecuta antes de modificar:

```bash
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

Ejecuta solo si existen:

```bash
npm run check:architecture
npm run test:architecture
npm run check:anti-legacy
```

Registra:

```text
total de tests
total de archivos de test
tests focalizados
lint
build
warnings
fallos preexistentes
```

No uses como baseline una cifra no confirmada.

---

## Paso 3 — Auditoría

Inspecciona:

```text
src/historical-evidence/domain/
src/historical-evidence/application/
src/historical-evidence/infrastructure/
tests/historical-evidence/
src/calibration/
tests/calibration/
package.json
```

Genera un mapa breve de componentes reutilizables.

---

## Paso 4 — Diseño previo

Antes de codificar, define:

```text
responsabilidad del detector
API
entradas
modos
estado del reporte
tipos de findings
severidad
orden determinista
integración con integrity verifier
validaciones estructurales
validaciones contra fuente
errores
inmutabilidad
exports
```

No comiences a implementar sin resolver estas decisiones.

---

## Paso 5 — Implementación mínima

Implementa únicamente:

```text
detector
reporte
findings
tipos y estados necesarios
errores mínimos
exports
tests
documentación
```

Evita:

```text
frameworks nuevos
dependencias npm nuevas
builders redundantes
factories especulativas
visitors
pipelines genéricos
sistemas de reglas extensibles prematuros
```

---

## Paso 6 — Tests focalizados

Ejecuta el nuevo archivo y los tests de splitting:

```bash
npx vitest run \
  tests/historical-evidence/DatasetSplitLeakageDetector.test.js \
  tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js \
  tests/historical-evidence/GroupedTemporalSplit.test.js
```

Adapta las rutas a la estructura real.

---

## Paso 7 — Suite completa

Ejecuta:

```bash
npm run test
npm run lint
npm run build
```

Y, si existen:

```bash
npm run check:architecture
npm run test:architecture
npm run check:anti-legacy
```

No declares cierre si alguna puerta obligatoria falla por cambios de esta fase.

---

## Paso 8 — Revisión del diff

Ejecuta:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence reports
```

Distingue claramente:

```text
cambios preexistentes
cambios de Fase 2.3.5.1
cambios de Fase 2.3.5.2
cambios de Fase 2.3.5.3
```

No atribuyas todo el working tree a esta fase.

---

# 29. Documentación obligatoria

Genera:

```text
reports/trabajo/Fase2.3.5.3_dataset_split_leakage_detection_reporte.md
```

Genera también:

```text
reports/trabajo/Fase2.3.5.3_nota_tecnica_diseno.md
```

## El reporte debe incluir

```text
resumen ejecutivo
objetivo
alcance
baseline inicial
baseline final
archivos inspeccionados
componentes reutilizados
arquitectura
API
modos
estados
findings
severidades
validaciones estructurales
validaciones contra fuente
integración con DatasetIntegrityVerifier
errores
archivos creados
archivos modificados
tests focalizados
suite completa
lint
build
warnings
estado Git
riesgos
deuda técnica
fuera de alcance
veredicto
```

## La nota técnica debe explicar

```text
diferencia entre error y finding
diferencia entre split estructuralmente válido y split libre de leakage detectable
cómo se detecta spinId compartido
cómo se detecta observationId compartida
cómo se validan periodos inclusivos
cómo se valida la cobertura
cómo se compara identidad científica y operativa
cómo se determina el estado del reporte
cómo se ordenan findings
cómo se garantiza determinismo
cómo se preserva inmutabilidad
qué tipos de leakage quedan pendientes
por qué el detector no repara
```

---

# 30. Punto de control obligatorio

Genera:

```text
Fase_2.3.5.3_cerrada.md
```

Debe incluir:

```text
proyecto
fecha
estado
propósito
resumen ejecutivo
baseline inicial
baseline final
arquitectura resultante
contratos nuevos
API
modos
estados
findings
invariantes
errores
tests
archivos creados
archivos modificados
decisiones vigentes
warnings
estado Git
riesgos
deuda técnica
fuera de alcance
próxima fase
prompt de reanudación
veredicto final
```

La próxima subfase recomendada será:

```text
Fase 2.3.5.4 —
Split Integrity, Coverage and Scientific Consistency Audit
```

No implementes esa subfase ahora.

---

# 31. Criterios de aceptación

La Fase 2.3.5.3 solo puede cerrarse si:

```text
[ ] se leyó el cierre anterior
[ ] se obtuvo el baseline real cuantificado
[ ] se inspeccionaron detectores existentes
[ ] no se duplicó una implementación compatible
[ ] existe DatasetSplitLeakageDetector o equivalente
[ ] existe un reporte inmutable
[ ] existen estados cerrados
[ ] existen findings tipados
[ ] se distingue error de finding
[ ] se detecta spinId compartido
[ ] se detecta observationId compartida
[ ] se detectan periodos solapados
[ ] se detecta orden temporal inválido
[ ] se detectan tipos duplicados
[ ] se validan conteos
[ ] se valida identidad fuente
[ ] se detectan observaciones omitidas
[ ] se detectan observaciones inesperadas
[ ] se valida cobertura de spins
[ ] se valida pertenencia temporal
[ ] se integra DatasetIntegrityVerifier cuando corresponde
[ ] no se muta el dataset
[ ] no se muta el split
[ ] no existe reparación automática
[ ] el resultado es determinista
[ ] no se utiliza Math.random()
[ ] no se utiliza reloj global
[ ] los tests focalizados pasan
[ ] la suite completa pasa
[ ] lint pasa
[ ] build pasa
[ ] se generó el reporte
[ ] se generó la nota técnica
[ ] se generó el punto de control
[ ] no se implementó entrenamiento
[ ] no se implementó promoción
[ ] no se implementó persistencia
```

---

# 32. Condiciones de detención

Detén la implementación y documenta el bloqueo si:

```text
el split no expone información suficiente para validación
el dataset no expone identidades de observaciones
no puede identificarse el timestamp científico
se requiere cambiar contentHash
se requiere cambiar manifestHash
se requiere cambiar schemas
se requiere alterar el orden canónico
se requiere romper GroupedTemporalDatasetSplitter
se requiere introducir persistencia
se requiere entrenar modelos
el baseline está roto por cambios ajenos y no es seguro continuar
```

No falsifiques validaciones.

No declares cobertura completa si faltan datos.

Usa `INCOMPLETE` cuando corresponda.

---

# 33. Formato de salida final

Al terminar, responde:

```text
FASE 2.3.5.3 — RESULTADO

Estado:
PASS | PARTIAL | BLOCKED | FAIL

Baseline inicial:
- tests:
- archivos de test:
- lint:
- build:

Baseline final:
- tests:
- archivos de test:
- lint:
- build:

Detector implementado:
- ...

Reporte implementado:
- ...

Estados:
- ...

Findings:
- ...

Modos:
- ...

Validaciones estructurales:
- ...

Validaciones contra fuente:
- ...

Integración con DatasetIntegrityVerifier:
- ...

Errores agregados:
- ...

Tests agregados:
- ...

Archivos creados:
- ...

Archivos modificados:
- ...

Determinismo:
- ...

Inmutabilidad:
- ...

Leakage cubierto:
- ...

Leakage pendiente:
- ...

Compatibilidad:
- ...

Warnings:
- ...

Estado Git:
- ...

Documentos:
- reports/trabajo/Fase2.3.5.3_dataset_split_leakage_detection_reporte.md
- reports/trabajo/Fase2.3.5.3_nota_tecnica_diseno.md
- Fase_2.3.5.3_cerrada.md

Próxima fase recomendada:
Fase 2.3.5.4 — Split Integrity, Coverage and Scientific Consistency Audit
```

---

# 34. Orden final de ejecución

```text
1. leer documentos anteriores
2. inspeccionar Git
3. obtener baseline cuantificado
4. buscar detectores existentes
5. auditar contratos de split
6. auditar DatasetIntegrityVerifier
7. definir API
8. definir estados
9. definir findings
10. definir severidad
11. definir modos
12. implementar contratos de reporte
13. implementar detector
14. agregar errores mínimos
15. agregar exports
16. crear tests focalizados
17. ejecutar tests focalizados
18. ejecutar suite completa
19. ejecutar lint
20. ejecutar build
21. ejecutar checks arquitectónicos disponibles
22. revisar diff
23. generar reporte
24. generar nota técnica
25. generar punto de control
26. emitir veredicto
```

Comienza ahora.

No solicites confirmación adicional.

No avances a la Fase 2.3.5.4.

No repares splits automáticamente.

No entrenes modelos.

No promociones calibradores.

No implementes persistencia.

No uses aleatoriedad.

No uses reloj global.

No reviertas cambios ajenos.
