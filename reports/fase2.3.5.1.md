# PROMPT DE EJECUCIÓN — FASE 2.3.5.1

## Roulette Tracker Pro

### Diseño del dominio de Grouped Temporal Dataset Splitting

Actúa como arquitecto principal de software, ingeniero senior de JavaScript/Node.js, especialista en Clean Architecture, Domain-Driven Design, sistemas científicos reproducibles, validación estadística y prevención de data leakage.

Debes trabajar directamente sobre el repositorio:

```text
/home/shared/lab_vito
```

El proyecto se llama:

```text
Roulette Tracker Pro
```

Nombres anteriores del proyecto:

```text
ORION
ORION_v2
```

---

# 1. Punto de partida obligatorio

La Fase 2.3.4 está formalmente cerrada.

Estado técnico consolidado:

```text
FASE 2.3.4: CERRADA
ESTADO TÉCNICO: APROBADO
PIPELINE: GREEN

BASELINE CUANTIFICADO OFICIAL:
940/940 tests PASS
63 archivos de test
lint OK
build OK
```

Durante la Fase 2.3.4 se implementaron y validaron:

```text
DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory

canonicalSerialize
canonicalHashSync
canonicalHash

serializeScientificDataset
serializeDatasetIdentity
serializeDatasetManifest
serializeDatasetStatistics
serializeDatasetSnapshotDescriptor

DatasetIntegrityVerifier
DatasetIntegrityReport
DatasetIntegrityStatus

DatasetComparator
DatasetComparisonReport
DatasetComparisonClassification
DatasetDifference

DatasetLineageResolver
DatasetLineageResolution
DatasetLineageRelation
DatasetLineageRelationType
```

No debes repetir ni reemplazar estas implementaciones.

Debes reutilizar los contratos existentes siempre que sean compatibles con el objetivo de la fase.

---

# 2. Documento obligatorio de reanudación

Antes de modificar código, debes localizar y leer completamente:

```text
Fase_2.3.4_cerrada.md
```

También debes revisar, si existen:

```text
Fase_2.3.3_cerrada.md
Fase_2.3.4.1_cerrada.md
Fase_2.3.4.2_cerrada.md
Fase_2.3.4.3_cerrada.md
Fase_2.3.4.4_cerrada.md
Fase_2.3.4.5_cerrada.md
Fase_2.3.4.6_cerrada.md
```

Y los informes relevantes dentro de:

```text
reports/trabajo/
```

No asumas que la estructura indicada en los documentos coincide exactamente con el repositorio actual.

Confirma siempre la estructura real antes de crear o modificar archivos.

---

# 3. Objetivo de esta subfase

Ejecutar exclusivamente:

```text
Fase 2.3.5.1 —
Diseño del dominio de Grouped Temporal Dataset Splitting
```

El objetivo es definir los contratos de dominio necesarios para representar particiones temporales agrupadas de un `HistoricalCalibrationDataset`.

Esta subfase debe construir únicamente el lenguaje y los invariantes del dominio.

No debe implementar todavía el algoritmo completo de particionado.

No debe implementar todavía detección integral de leakage.

No debe implementar entrenamiento, evaluación de modelos ni promoción.

---

# 4. Problema científico

Las observaciones históricas deben dividirse posteriormente en conjuntos como:

```text
TRAIN
VALIDATION
TEST
```

La división debe respetar simultáneamente:

1. orden temporal;
2. agrupación completa por `spinId`;
3. reproducibilidad;
4. determinismo;
5. inmutabilidad;
6. trazabilidad hacia el dataset fuente;
7. ausencia de data leakage;
8. separación del conjunto final de test respecto de selección y ajuste de modelos.

Una misma tirada puede producir más de una observación.

Todas las observaciones asociadas a un mismo `spinId` constituyen una unidad científica indivisible para efectos del splitting.

Por tanto:

```text
un spinId nunca puede aparecer en más de una partición
```

No se permite dividir observaciones de una misma tirada entre:

```text
TRAIN y VALIDATION
TRAIN y TEST
VALIDATION y TEST
```

---

# 5. Alcance exacto

Debes inspeccionar el repositorio y diseñar, adaptar o implementar contratos equivalentes a los siguientes conceptos:

```text
GroupedTemporalSplit
DatasetPartition
DatasetPartitionType
SplitPeriod
SplitMetadata
```

Los nombres definitivos pueden ajustarse únicamente si ya existen convenciones más apropiadas en el repositorio.

Toda desviación de nombres debe justificarse en el informe final.

También debes evaluar si hacen falta errores de dominio tipados, por ejemplo:

```text
InvalidDatasetPartitionError
InvalidPartitionTypeError
InvalidSplitPeriodError
OverlappingSplitPeriodError
DuplicatePartitionTypeError
SpinGroupBoundaryViolationError
InvalidSplitMetadataError
```

No crees errores innecesarios.

Reutiliza la jerarquía de errores existente cuando corresponda.

---

# 6. Inspección previa obligatoria

Antes de diseñar los contratos, busca exhaustivamente términos relacionados con:

```text
GroupedTemporalSplit
TemporalSplit
DatasetSplit
SplitDataset
Partition
Train
Validation
Test
Holdout
Leakage
LeakageDetector
PairedBootstrap
spinId
groupBySpin
HistoricalCalibrationDataset
DatasetSnapshotDescriptor
DatasetIdentity
DatasetIntegrityVerifier
DatasetComparator
DatasetVersionPolicy
provenance
```

Usa herramientas como:

```bash
find
grep
rg
git grep
```

Debes determinar:

1. si ya existe algún contrato de splitting;
2. si existe un detector de leakage;
3. si existe `PairedBootstrap`;
4. si existen tipos de particiones;
5. si hay convenciones para periodos temporales;
6. si las observaciones de un mismo `spinId` pueden repetirse legítimamente;
7. qué timestamp define actualmente el orden científico;
8. cómo se representa la identidad del dataset fuente;
9. cómo se preservan hashes, versiones y provenance;
10. cómo se implementa la inmutabilidad profunda.

No dupliques contratos existentes.

---

# 7. Arquitectura obligatoria

Debes respetar la separación:

```text
domain
application
infrastructure
```

Los contratos de esta subfase deben residir preferentemente en:

```text
src/historical-evidence/domain/
```

No introduzcas dependencias desde dominio hacia aplicación o infraestructura.

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

La ubicación exacta debe seguir las convenciones reales del repositorio.

---

# 8. Principios que no deben romperse

Debes preservar obligatoriamente:

```text
modularidad
determinismo
reproducibilidad
inmutabilidad profunda
ausencia de efectos secundarios ocultos
IDs inyectados
timestamps inyectados
separación de responsabilidades
data leakage explícitamente prevenido
separación entre dataset, entrenamiento e inferencia
asociación mediante spinId
serialización canónica única
SHA-256 oficial
schemas explícitos
versiones explícitas
errores tipados
datasets all-or-nothing
```

Está prohibido:

```text
Math.random()
Date.now() dentro del dominio científico
new Date() como reloj implícito
UUID generado dentro del dominio
mutar datasets existentes
mutar observaciones existentes
comparar observaciones por posición accidental
asociar observaciones por proximidad temporal
crear hashes alternativos
duplicar canonicalSerialize
duplicar SHA-256
usar JSON.stringify como serialización científica paralela
```

---

# 9. Modelo conceptual esperado

## 9.1 DatasetPartitionType

Debe representar tipos explícitos de partición.

Como mínimo, evalúa:

```text
TRAIN
VALIDATION
TEST
```

No agregues tipos especulativos sin evidencia arquitectónica.

El tipo debe ser validable y cerrado.

No aceptes strings arbitrarios silenciosamente.

---

## 9.2 SplitPeriod

Debe representar el intervalo temporal cubierto por una partición.

Evalúa reutilizar la política temporal existente:

```text
from <= timestamp <= to
```

Debe aclararse qué timestamp de las observaciones define la pertenencia temporal.

El orden canónico actual comienza por:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

No cambies ese orden en esta subfase.

`SplitPeriod` debe:

```text
validar from
validar to
rechazar periodos invertidos
preservar timestamps originales
ser profundamente inmutable
tener representación determinista
```

No debe consultar el reloj global.

---

## 9.3 DatasetPartition

Debe representar una partición lógica derivada de un dataset histórico.

Debe evaluarse incluir únicamente información como:

```text
partitionType
period
observationCount
spinCount
observationIds
spinIds
sourceDatasetIdentity
metadata
```

Sin embargo, no copies automáticamente toda esta lista.

Primero revisa cómo se representan:

```text
HistoricalCalibrationDataset
DatasetIdentity
DatasetSnapshotDescriptor
DatasetStatistics
provenance
```

Evita duplicar observaciones si el contrato puede describir una vista lógica o descriptor.

La decisión entre:

```text
partición con observaciones
descriptor de partición
referencias por identidad
```

debe tomarse tras inspeccionar el diseño existente.

La prioridad es:

```text
coherencia con HistoricalCalibrationDataset
inmutabilidad
trazabilidad
no duplicación innecesaria
claridad científica
```

---

## 9.4 SplitMetadata

Debe representar metadatos del procedimiento de splitting.

Evalúa incluir:

```text
strategy
groupingKey
temporalKey
sourceDatasetId
sourceContentHash
sourceManifestHash
sourceDatasetVersion
createdAt inyectado
splitId inyectado
```

No incluyas campos porque “podrían servir”.

Cada campo debe tener una justificación científica u operativa.

La estrategia de esta fase debe quedar explícita como equivalente a:

```text
GROUPED_TEMPORAL
```

El agrupamiento debe quedar explícito como:

```text
spinId
```

La clave temporal debe corresponder al contrato real del dataset.

---

## 9.5 GroupedTemporalSplit

Debe representar el resultado lógico completo del proceso de particionado.

Como mínimo, debe poder expresar:

```text
dataset fuente
particiones
metadatos
periodos
conteos
trazabilidad
```

Debe garantizar invariantes como:

```text
cada tipo de partición aparece como máximo una vez
las particiones no se solapan temporalmente
un spinId aparece en una sola partición
los periodos mantienen orden temporal
las particiones pertenecen al mismo dataset fuente
los identificadores son consistentes
```

Debes decidir si la ausencia de `VALIDATION` puede ser válida.

Por ejemplo, podrían existir configuraciones futuras:

```text
TRAIN + TEST
TRAIN + VALIDATION + TEST
```

No implementes configuraciones arbitrarias sin documentar sus invariantes.

---

# 10. Límites de esta subfase

En esta subfase no debes implementar:

```text
GroupedTemporalDatasetSplitter completo
cálculo automático de porcentajes
selección automática de fechas de corte
random split
stratified random split
k-fold
time-series cross-validation completa
walk-forward validation
rolling windows
expanding windows
PairedBootstrap
entrenamiento
Brier Score
Log Loss
ECE
MCE
model selection
ranking de calibradores
PromotionPolicy
persistencia durable
SQLite
DuckDB
PostgreSQL
filesystem snapshots
storage remoto
CSV
JSONL
Parquet
Arrow
deserialización
migración automática
reparación automática
merge automático
UI
captura productiva
```

Tampoco debes crear todavía un detector integral de leakage.

Solo puedes implementar validaciones estructurales estrictamente necesarias para garantizar que los contratos de dominio no representen un split evidentemente inválido.

---

# 11. Trazabilidad con el dataset fuente

Toda representación de split debe conservar trazabilidad suficiente hacia el dataset original.

Evalúa reutilizar:

```text
DatasetIdentity
DatasetSnapshotDescriptor
contentHash
manifestHash
datasetVersion
schemaVersion
observationSchemaVersion
```

No recalcules hashes existentes dentro de entidades que solo deben transportarlos.

No confundas:

```text
identidad científica
```

con:

```text
identidad operativa
```

Recuerda:

```text
contentHash = identidad científica
datasetId + manifestHash = identidad operativa
```

Una partición derivada no debe falsificar que posee la misma identidad científica que el dataset completo.

Debes documentar claramente:

1. qué identidad conserva;
2. qué identidad deriva;
3. qué campos son referencias al dataset fuente;
4. cuáles describen la partición;
5. cuáles deberán calcularse en fases posteriores.

---

# 12. Inmutabilidad

Todos los nuevos contratos de dominio deben ser profundamente inmutables.

Debes reutilizar las utilidades existentes de inmutabilidad.

No implementes una segunda estrategia incompatible.

Verifica que no puedan mutarse externamente:

```text
arrays
objetos anidados
periodos
metadatos
identidades
colecciones de spinIds
colecciones de observationIds
particiones
```

Incluye pruebas que intenten mutar estos valores.

---

# 13. Validaciones mínimas

Los contratos deben rechazar de forma tipada y determinista:

```text
partitionType ausente
partitionType desconocido
periodo ausente
from inválido
to inválido
from posterior a to
particiones duplicadas por tipo
particiones con periodos solapados
particiones en orden temporal inválido
spinId presente en más de una partición
observationId presente en más de una partición
dataset fuente inconsistente
metadata incompleta cuando sea obligatoria
conteos negativos
conteos no enteros
IDs vacíos
```

No agregues validaciones que dependan de información que el contrato no posea.

No simules una verificación de leakage completa si todavía no existe el detector correspondiente.

---

# 14. Determinismo

Dos instancias construidas con las mismas entradas deben producir representaciones lógicamente equivalentes.

El resultado no debe depender de:

```text
orden accidental de objetos
orden de inserción no documentado
locale
zona horaria local
reloj del sistema
aleatoriedad
estado global
```

Cuando se reciban colecciones de IDs, define y documenta si:

```text
se conserva el orden canónico de entrada
```

o si:

```text
se normalizan mediante un criterio determinista
```

No ordenes arbitrariamente sin considerar el orden científico vigente.

---

# 15. Tests obligatorios

Debes crear tests focalizados para todos los contratos nuevos.

Incluye, cuando corresponda:

## Casos válidos

```text
crear TRAIN
crear VALIDATION
crear TEST
crear split TRAIN + TEST
crear split TRAIN + VALIDATION + TEST
periodos temporales consecutivos
múltiples observaciones del mismo spin dentro de una partición
identidad del dataset fuente preservada
inmutabilidad profunda
representación determinista
```

## Casos inválidos

```text
tipo desconocido
periodo invertido
periodos solapados
tipo de partición duplicado
spinId compartido entre particiones
observationId compartido entre particiones
fuentes incompatibles
colecciones mutables
metadata inválida
conteos inconsistentes
```

## Casos de frontera

```text
una sola observación
una sola tirada
varias observaciones con el mismo spinId
periodos que se tocan exactamente en un límite
timestamps iguales
TRAIN + TEST sin VALIDATION
dataset vacío, según política vigente
```

Debes revisar cuidadosamente la semántica de intervalos inclusivos:

```text
from <= timestamp <= to
```

Si dos periodos inclusivos comparten exactamente el mismo timestamp de frontera, existe posible solapamiento.

No cambies la política temporal sin una decisión explícita y documentada.

---

# 16. Compatibilidad hacia atrás

No debes romper:

```text
HistoricalCalibrationDataset
DatasetBuilder
BuildHistoricalDatasetUseCase
DatasetSnapshotDescriptorFactory
CanonicalDatasetSerializer
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
```

La suite existente debe continuar verde.

No cambies exports públicos existentes salvo necesidad demostrable.

Si agregas exports públicos, hazlo siguiendo la convención real de:

```text
src/historical-evidence/index.js
```

No expongas componentes internos innecesarios.

---

# 17. Proceso de trabajo obligatorio

## Paso 1 — Estado Git

Ejecuta:

```bash
cd /home/shared/lab_vito

git status --short
git branch --show-current
git log -1 --oneline
git diff --stat
```

No debes asumir que el workspace está limpio.

No ejecutes:

```bash
git add .
git reset --hard
git clean -fd
```

No reviertas cambios ajenos.

No mezcles modificaciones de otras fases.

---

## Paso 2 — Baseline

Ejecuta antes de modificar:

```bash
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

Ejecuta también, solo si existen en `package.json`:

```bash
npm run check:architecture
npm run test:architecture
npm run check:anti-legacy
```

Registra:

```text
cantidad de tests
cantidad de archivos de test
resultado de lint
resultado de build
warnings
fallos preexistentes
```

Si el baseline falla:

1. no ocultes el fallo;
2. determina si es preexistente;
3. no corrijas problemas fuera del alcance sin justificación;
4. documenta el estado;
5. continúa únicamente si es técnicamente seguro.

---

## Paso 3 — Auditoría

Inspecciona:

```text
src/historical-evidence/
tests/historical-evidence/
src/calibration/
tests/calibration/
package.json
exports públicos
errores
utilidades de inmutabilidad
utilidades de metadata
contratos temporales
```

Genera un mapa breve de componentes reutilizables.

---

## Paso 4 — Diseño previo

Antes de codificar, define:

```text
entidades
value objects
enums o constantes
invariantes
errores
dependencias
exports
estrategia de inmutabilidad
trazabilidad
```

No escribas código hasta comprender los contratos existentes.

---

## Paso 5 — Implementación mínima

Implementa solo lo necesario para cerrar la Fase 2.3.5.1.

Evita:

```text
sobreingeniería
abstracciones prematuras
factories innecesarias
repositorios sin uso
servicios vacíos
configuraciones especulativas
compatibilidad ficticia
```

---

## Paso 6 — Tests focalizados

Ejecuta primero los tests nuevos y los directamente relacionados.

Por ejemplo:

```bash
npx vitest run tests/historical-evidence/
```

Ajusta la ruta a la estructura real.

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

No declares cierre si alguna puerta obligatoria falla por cambios de esta subfase.

---

# 18. Documentación obligatoria

Debes generar:

```text
reports/trabajo/Fase2.3.5.1_grouped_temporal_split_domain_reporte.md
```

Y una nota técnica:

```text
reports/trabajo/Fase2.3.5.1_nota_tecnica_diseno.md
```

## El reporte debe incluir

```text
resumen ejecutivo
alcance ejecutado
estado inicial
baseline inicial
archivos inspeccionados
componentes existentes reutilizados
archivos creados
archivos modificados
contratos implementados
invariantes
errores tipados
tests agregados
resultados de tests focalizados
resultado de suite completa
resultado de lint
resultado de build
warnings
estado Git
riesgos
deuda técnica
fuera de alcance
veredicto
```

## La nota técnica debe explicar

```text
por qué spinId es la unidad indivisible
cómo se representa una partición
cómo se representan los periodos
cómo se evita el solapamiento estructural
cómo se conserva la trazabilidad
cómo se diferencia identidad fuente e identidad derivada
cómo se preserva la inmutabilidad
qué validaciones pertenecen al dominio
qué validaciones quedan para LeakageDetector
qué decisiones quedan para GroupedTemporalDatasetSplitter
```

---

# 19. Punto de control obligatorio

Al finalizar, genera:

```text
Fase_2.3.5.1_cerrada.md
```

Debe permitir continuar en una sesión nueva sin repetir la auditoría.

Debe contener:

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
invariantes
errores
tests
decisiones vigentes
archivos creados
archivos modificados
estado Git
warnings
fuera de alcance
próxima subfase
prompt de reanudación
veredicto final
```

La próxima subfase sugerida será:

```text
Fase 2.3.5.2 —
Deterministic Grouped Temporal Dataset Splitter
```

No debes implementar esa subfase ahora.

---

# 20. Criterios de aceptación

La subfase puede declararse cerrada únicamente si:

```text
[ ] se inspeccionó el repositorio real
[ ] se leyó Fase_2.3.4_cerrada.md
[ ] se confirmó el baseline
[ ] no se duplicaron contratos existentes
[ ] DatasetPartitionType está definido
[ ] SplitPeriod está definido
[ ] DatasetPartition está definido
[ ] SplitMetadata está definido o su omisión está justificada
[ ] GroupedTemporalSplit está definido
[ ] spinId es indivisible entre particiones
[ ] se impiden tipos duplicados
[ ] se impiden periodos solapados
[ ] se impiden IDs compartidos entre particiones
[ ] se preserva trazabilidad al dataset fuente
[ ] existe inmutabilidad profunda
[ ] no existe aleatoriedad
[ ] no existe reloj global
[ ] no se implementó entrenamiento
[ ] no se implementó promoción
[ ] no se implementó persistencia
[ ] no se implementó el splitter completo
[ ] no se implementó un LeakageDetector integral
[ ] los tests focalizados pasan
[ ] la suite completa pasa
[ ] lint pasa
[ ] build pasa
[ ] la documentación fue generada
[ ] el punto de control fue generado
```

---

# 21. Condiciones de detención

Detén la implementación y documenta el bloqueo si ocurre alguno de estos casos:

```text
el baseline está roto por cambios no atribuibles
los contratos existentes contradicen el diseño propuesto
no puede identificarse la clave temporal científica
no puede determinarse la semántica de spinId
se requiere cambiar el schema científico existente
se requiere modificar contentHash
se requiere modificar el orden canónico
se requiere introducir persistencia
se requiere implementar entrenamiento
se requiere romper compatibilidad pública
```

No improvises una solución destructiva.

---

# 22. Formato de salida final

Al terminar, muestra un resumen con este formato:

```text
FASE 2.3.5.1 — RESULTADO

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

Contratos implementados:
- ...

Errores agregados:
- ...

Archivos creados:
- ...

Archivos modificados:
- ...

Invariantes principales:
- ...

Compatibilidad:
- ...

Warnings:
- ...

Documentos:
- reports/trabajo/Fase2.3.5.1_grouped_temporal_split_domain_reporte.md
- reports/trabajo/Fase2.3.5.1_nota_tecnica_diseno.md
- Fase_2.3.5.1_cerrada.md

Estado Git:
- ...

Próxima fase recomendada:
Fase 2.3.5.2 — Deterministic Grouped Temporal Dataset Splitter
```

---

# 23. Orden final de ejecución

Ejecuta en este orden:

```text
1. leer punto de control
2. inspeccionar Git
3. confirmar baseline
4. buscar contratos existentes
5. auditar dominio y utilidades
6. diseñar contratos
7. implementar dominio mínimo
8. agregar tests focalizados
9. ejecutar tests focalizados
10. ejecutar suite completa
11. ejecutar lint
12. ejecutar build
13. ejecutar checks arquitectónicos disponibles
14. revisar diff
15. generar reportes
16. generar punto de control
17. emitir veredicto
```

Comienza ahora.

No solicites confirmación adicional.

No avances a la Fase 2.3.5.2.

No entrenes modelos.

No promociones calibradores.

No modifiques producción.

No reviertas cambios ajenos.
