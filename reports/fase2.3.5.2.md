# PROMPT DE EJECUCIÓN — FASE 2.3.5.2

## Roulette Tracker Pro

### Deterministic Grouped Temporal Dataset Splitter

Actúa como arquitecto principal de software, ingeniero senior de JavaScript/Node.js y especialista en:

* Clean Architecture;
* Domain-Driven Design;
* diseño de sistemas científicos reproducibles;
* validación temporal;
* particionado de datasets;
* prevención de data leakage;
* pruebas deterministas;
* inmutabilidad;
* trazabilidad científica y operativa.

Debes trabajar directamente sobre el repositorio:

```text
/home/shared/lab_vito
```

Proyecto:

```text
Roulette Tracker Pro
```

Nombre anterior:

```text
ORION / ORION_v2
```

---

# 1. Punto de partida obligatorio

La Fase 2.3.5.1 está formalmente cerrada y aprobada.

Estado técnico consolidado:

```text
FASE 2.3.5.1: CERRADA
ESTADO: APROBADO

TESTS FOCALIZADOS:
10/10 PASS

SUITE COMPLETA:
950/950 PASS

ARCHIVOS DE TEST:
64

LINT:
OK

BUILD:
OK
```

La subfase anterior implementó:

```text
DatasetPartitionType
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit
```

Errores tipados implementados:

```text
InvalidPartitionTypeError
InvalidSplitPeriodError
InvalidSplitMetadataError
InvalidDatasetPartitionError
InvalidGroupedTemporalSplitError
```

No debes repetir, reemplazar ni rediseñar estos contratos sin una incompatibilidad demostrable.

---

# 2. Documentos obligatorios

Antes de modificar código, debes localizar y leer completamente:

```text
Fase_2.3.5.1_cerrada.md
Fase2.3.5.1_grouped_temporal_split_domain_reporte.md
Fase2.3.5.1_nota_tecnica_diseno.md
Fase_2.3.4_cerrada.md
```

Busca los archivos tanto en la raíz como en:

```text
reports/
reports/trabajo/
```

No asumas rutas exactas sin inspeccionar el repositorio.

También revisa los informes anteriores relevantes de:

```text
Fase 2.3.3
Fase 2.3.4
Fase 2.3.5.1
```

---

# 3. Objetivo exacto

Ejecutar exclusivamente:

```text
Fase 2.3.5.2 —
Deterministic Grouped Temporal Dataset Splitter
```

El objetivo es implementar un servicio o caso de uso de aplicación capaz de construir un `GroupedTemporalSplit` válido desde un `HistoricalCalibrationDataset`.

El splitter debe:

1. trabajar sobre observaciones históricas existentes;
2. agrupar indivisiblemente por `spinId`;
3. respetar orden temporal;
4. producir particiones deterministas;
5. evitar que una tirada aparezca en más de una partición;
6. preservar trazabilidad hacia el dataset fuente;
7. reutilizar los contratos de la Fase 2.3.5.1;
8. no mutar el dataset original;
9. no usar aleatoriedad;
10. no usar reloj global;
11. no entrenar modelos;
12. no implementar todavía un detector semántico completo de leakage.

---

# 4. Resultado arquitectónico esperado

El flujo conceptual esperado es:

```text
HistoricalCalibrationDataset
                │
                ▼
GroupedTemporalDatasetSplitter
                │
                ▼
GroupedTemporalSplit
                │
                ├── TRAIN
                ├── VALIDATION
                └── TEST
```

El nombre definitivo puede adaptarse a las convenciones reales del repositorio.

Nombre recomendado:

```text
GroupedTemporalDatasetSplitter
```

Ubicación preferente:

```text
src/historical-evidence/application/
```

No lo ubiques en dominio si coordina:

* lectura de observaciones;
* configuración de cortes;
* agrupamiento;
* construcción de particiones;
* creación de metadata;
* orquestación de value objects.

---

# 5. Inspección previa obligatoria

Busca exhaustivamente:

```text
GroupedTemporalDatasetSplitter
GroupedTemporalSplit
DatasetPartition
SplitMetadata
SplitPeriod
TemporalSplit
DatasetSplit
splitter
partition
train
validation
test
holdout
leakage
spinId
predictionCreatedAt
HistoricalCalibrationDataset
DatasetSnapshotDescriptor
DatasetIdentity
DatasetStatistics
DatasetBuilder
DatasetIntegrityVerifier
DatasetComparator
canonical order
compareIso
PairedBootstrap
```

Usa:

```bash
find
rg
grep
git grep
```

Determina:

1. si ya existe algún splitter en otra carpeta;
2. si existe una implementación paralela en `src/calibration`;
3. si puede reutilizarse sin acoplar dominios incorrectamente;
4. cómo expone observaciones `HistoricalCalibrationDataset`;
5. qué timestamp define el orden científico;
6. cómo se obtiene `DatasetIdentity`;
7. cómo se inyectan IDs;
8. cómo se inyectan timestamps;
9. cómo se representan configuraciones;
10. cómo se ejecutan validaciones de integridad;
11. cómo se implementan errores de aplicación;
12. qué convenciones usan los casos de uso existentes.

No copies automáticamente implementaciones paralelas.

No crees dependencia entre dominios incompatibles.

---

# 6. Decisiones vigentes que debes preservar

## 6.1 Unidad indivisible

```text
spinId
```

es la unidad científica indivisible.

Todas las observaciones asociadas a un mismo `spinId` deben quedar en una única partición.

Está prohibido que un mismo `spinId` aparezca en:

```text
TRAIN y VALIDATION
TRAIN y TEST
VALIDATION y TEST
```

---

## 6.2 Orden temporal

El orden canónico vigente comienza por:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

No modifiques este orden.

El agrupamiento debe ordenar grupos de tiradas de manera determinista utilizando el timestamp científico real.

No relaciones observaciones por proximidad temporal.

No uses el índice del array como identidad.

---

## 6.3 Periodos inclusivos

`SplitPeriod` utiliza intervalos inclusivos:

```text
from <= timestamp <= to
```

Como los periodos son inclusivos, dos particiones no pueden compartir exactamente el mismo timestamp de frontera.

El splitter debe construir periodos compatibles con esta semántica.

---

## 6.4 Trazabilidad

Cada partición debe conservar la misma identidad fuente:

```text
DatasetIdentity
```

El split completo debe contener:

```text
splitId inyectado
createdAt inyectado
sourceDatasetIdentity
strategy
groupingKey
temporalKey
```

No recalcules la identidad fuente.

No falsifiques el `contentHash` del dataset completo como identidad de una partición.

---

# 7. Configuración del splitter

Debes diseñar un contrato de configuración explícito.

Evalúa un concepto equivalente a:

```text
GroupedTemporalSplitConfiguration
```

o:

```text
GroupedTemporalSplitOptions
```

Antes de crearlo, revisa las convenciones existentes.

La configuración mínima debe permitir expresar cortes temporales o asignaciones de grupos sin aleatoriedad.

Evalúa cuidadosamente dos estrategias posibles:

## Estrategia A — Cortes temporales explícitos

Ejemplo conceptual:

```text
trainUntil
validationUntil
testUntil
```

## Estrategia B — Conteos o proporciones deterministas

Ejemplo conceptual:

```text
trainRatio
validationRatio
testRatio
```

La prioridad de esta subfase debe ser una política inequívoca y auditable.

Se recomienda preferir cortes temporales explícitos si el dominio y los contratos existentes lo permiten.

No implementes múltiples estrategias si una sola basta para cerrar correctamente la fase.

Toda decisión debe documentarse.

---

# 8. Política recomendada

La implementación preferente debe aceptar periodos explícitos para:

```text
TRAIN
VALIDATION
TEST
```

Debe poder representar al menos:

```text
TRAIN + TEST
TRAIN + VALIDATION + TEST
```

Cada observación debe asignarse mediante el timestamp científico de su grupo.

Una configuración conceptual válida podría ser:

```text
TRAIN:
from = inicio del dataset
to = corteTrain

VALIDATION:
from = siguiente timestamp de grupo
to = corteValidation

TEST:
from = siguiente timestamp de grupo
to = fin del dataset
```

No debes sumar milisegundos artificialmente a timestamps.

Los periodos deben derivarse de timestamps reales de grupos existentes.

---

# 9. Agrupamiento temporal

Antes de particionar:

1. valida el dataset de entrada;
2. obtiene sus observaciones;
3. agrupa las observaciones por `spinId`;
4. verifica que cada grupo sea internamente coherente;
5. determina el timestamp temporal del grupo;
6. ordena grupos determinísticamente;
7. asigna cada grupo completo a una partición;
8. construye los value objects existentes.

Debes determinar qué timestamp representa el grupo cuando varias observaciones del mismo `spinId` tienen timestamps diferentes.

Política recomendada:

```text
todas las observaciones del mismo spinId deben compartir el timestamp temporal relevante
```

Si el dominio permite timestamps diferentes para un mismo spin, debes:

* investigar la semántica real;
* elegir una política explícita;
* documentarla;
* agregar tests.

No uses silenciosamente el primer elemento del array.

---

# 10. Dataset de entrada

El splitter debe aceptar únicamente un dataset válido del tipo esperado.

Evalúa ejecutar antes:

```text
DatasetIntegrityVerifier
```

No dupliques toda la lógica de integridad.

El splitter debe rechazar:

```text
dataset ausente
dataset de tipo inválido
dataset corrupto
dataset incompleto
schema no soportado
observaciones sin spinId
observaciones sin timestamp científico
dataset sin identidad fuente
```

Debes diferenciar:

```text
error de entrada
error de configuración
error de asignación
error de construcción
```

No repitas errores de dominio cuando ya existen.

---

# 11. Dataset vacío

Debes confirmar la política vigente de `HistoricalCalibrationDataset`.

No inventes una nueva política.

Si datasets vacíos están prohibidos:

```text
rechazar antes de particionar
```

Si están permitidos:

```text
definir explícitamente si un split vacío es válido
```

La decisión debe documentarse y probarse.

---

# 12. Particiones vacías

Define una política explícita.

Recomendación:

```text
las particiones declaradas no pueden quedar vacías
```

Una configuración que produzca:

```text
TRAIN con observaciones
VALIDATION vacía
TEST con observaciones
```

debe rechazarse si `VALIDATION` fue solicitada.

No elimines silenciosamente particiones vacías.

No cambies automáticamente una configuración de tres particiones a dos.

---

# 13. Límites temporales

El splitter debe rechazar configuraciones con:

```text
periodos invertidos
periodos solapados
huecos no autorizados
cortes fuera del dataset
grupos no asignados
grupos asignados más de una vez
```

Debes decidir si los huecos temporales están permitidos.

Recomendación:

```text
no permitir huecos si producen observaciones sin partición
```

Un hueco sin observaciones puede ser aceptable únicamente si no contradice los contratos existentes y queda documentado.

---

# 14. Determinismo

Dadas las mismas entradas:

```text
dataset
configuración
splitId
createdAt
```

el resultado debe ser lógicamente idéntico.

No debe depender de:

```text
Math.random()
Date.now()
new Date() sin inyección
crypto.randomUUID() interno
locale
zona horaria local
orden accidental de Map
orden accidental del objeto
estado global
orden original no canónico
```

Los IDs y timestamps operativos deben inyectarse.

---

# 15. API propuesta

Evalúa una API equivalente a:

```javascript
const splitter = new GroupedTemporalDatasetSplitter({
  integrityVerifier,
});

const split = splitter.split({
  dataset,
  configuration,
  splitId,
  createdAt,
});
```

También puede utilizarse una API estática o funcional si coincide mejor con el repositorio.

La API final debe:

* ser clara;
* ser pequeña;
* ser explícita;
* no ocultar dependencias;
* no usar estado mutable;
* no depender de infraestructura.

---

# 16. Reutilización obligatoria

Debes reutilizar, cuando corresponda:

```text
GroupedTemporalSplit
DatasetPartition
DatasetPartitionType
SplitPeriod
SplitMetadata
DatasetIdentity
HistoricalCalibrationDataset
DatasetIntegrityVerifier
compareIso
deepFreeze
errores existentes
serialización canónica existente
```

No dupliques:

```text
validación de DatasetIdentity
comparación ISO
freeze
hashing
serialización
validaciones ya incluidas en los value objects
```

---

# 17. Errores nuevos

Evalúa errores equivalentes a:

```text
InvalidGroupedTemporalSplitConfigurationError
DatasetSplitInputError
UnassignedSpinGroupError
AmbiguousSpinTimestampError
EmptyDatasetPartitionError
GroupedTemporalSplitExecutionError
```

No agregues todos automáticamente.

Crea únicamente errores necesarios y coherentes con la jerarquía existente.

Los errores deben incluir contexto suficiente, pero no datasets completos ni información innecesariamente grande.

---

# 18. Separación de responsabilidades

## Dominio

Debe continuar validando:

```text
tipos de partición
periodos
IDs
duplicados
solapamiento estructural
identidad fuente
inmutabilidad
```

## Aplicación

Debe encargarse de:

```text
leer el dataset
validar precondiciones
agrupar por spinId
ordenar grupos
asignar grupos
crear metadata
construir particiones
construir GroupedTemporalSplit
```

## Infraestructura

No debe intervenir en esta subfase.

No implementes:

```text
repositorios
filesystem
SQLite
DuckDB
PostgreSQL
storage remoto
```

---

# 19. Leakage

Esta subfase debe prevenir leakage estructural básico mediante:

```text
un spinId en una sola partición
una observationId en una sola partición
orden temporal
particiones no solapadas
asignación única
```

No debe implementar todavía:

```text
DatasetLeakageDetector completo
análisis de features
leakage por variables derivadas
leakage por estados del modelo
leakage entre experimentos
leakage semántico avanzado
```

No declares que todo leakage está resuelto.

Describe el resultado como:

```text
structurally leakage-safe split
```

o equivalente en la terminología del proyecto.

---

# 20. Tests obligatorios

Crea pruebas focalizadas para el splitter.

## Casos válidos

Incluye al menos:

```text
TRAIN + TEST
TRAIN + VALIDATION + TEST
múltiples observaciones del mismo spinId
grupos ordenados aunque las observaciones entren desordenadas
timestamps iguales con desempate canónico
splitId inyectado
createdAt inyectado
identidad fuente preservada
dataset original no mutado
resultado inmutable
ejecuciones repetidas deterministas
```

## Casos inválidos

Incluye:

```text
dataset ausente
dataset inválido
configuración ausente
periodos solapados
partición solicitada vacía
spin sin timestamp
spin sin spinId
grupo ambiguo
cortes fuera de rango
observaciones no asignadas
dataset corrupto
splitId vacío
createdAt inválido
```

## Casos de frontera

Incluye:

```text
una sola tirada
dos tiradas
varias observaciones de una tirada
todos los grupos con timestamps diferentes
varios grupos con el mismo predictionCreatedAt
TRAIN + TEST sin VALIDATION
primer grupo exactamente en from
último grupo exactamente en to
```

No escribas tests que dependan del reloj.

No uses aleatoriedad.

---

# 21. Tests de regresión

Debes garantizar que continúen verdes:

```text
GroupedTemporalSplit.test.js
HistoricalCalibrationDataset
DatasetBuilder
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
CanonicalHash
```

Ejecuta tests focalizados y luego la suite completa.

---

# 22. Compatibilidad hacia atrás

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
GroupedTemporalSplit
DatasetPartition
SplitMetadata
SplitPeriod
```

No cambies exports existentes salvo necesidad demostrable.

Agrega el nuevo componente a:

```text
src/historical-evidence/application/index.js
```

si ese barrel existe.

También actualiza:

```text
src/historical-evidence/index.js
```

solo si el componente debe ser parte de la API pública.

No expongas helpers internos.

---

# 23. Fuera de alcance

No implementes:

```text
DatasetLeakageDetector avanzado
random split
stratified split
k-fold
group k-fold
walk-forward
rolling windows
expanding windows
nested validation
bootstrap
PairedBootstrap
entrenamiento
calibración
Brier Score
Log Loss
ECE
MCE
model selection
ranking
PromotionPolicy
persistencia
exportadores
deserialización
migración
merge
reparación automática
UI
captura productiva
```

No modifiques módulos de producción ajenos.

---

# 24. Proceso de trabajo obligatorio

## Paso 1 — Git

Ejecuta:

```bash
cd /home/shared/lab_vito

git status --short
git branch --show-current
git log -1 --oneline
git diff --stat
```

El árbol ya estaba sucio en la fase anterior.

No ejecutes:

```bash
git add .
git reset --hard
git clean -fd
git checkout .
```

No reviertas cambios ajenos.

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

Ejecuta solo si existen:

```bash
npm run check:architecture
npm run test:architecture
npm run check:anti-legacy
```

Registra:

```text
tests
archivos de test
lint
build
warnings
fallos preexistentes
```

El baseline esperado es:

```text
950/950 tests PASS
64 archivos de test
lint OK
build OK
```

No falsifiques resultados si la rama cambió.

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

Genera un mapa de componentes reutilizables antes de codificar.

---

## Paso 4 — Diseño

Documenta previamente:

```text
API
configuración
clave temporal
política de agrupamiento
orden
asignación
errores
dependencias
invariantes
trazabilidad
casos inválidos
```

---

## Paso 5 — Implementación mínima

Implementa únicamente el splitter determinista y contratos auxiliares indispensables.

Evita:

```text
factories especulativas
builders redundantes
repositorios
estrategias múltiples innecesarias
abstracciones vacías
frameworks nuevos
dependencias npm adicionales
```

---

## Paso 6 — Tests focalizados

Ejecuta el nuevo archivo de tests y los tests de los contratos de split.

Ejemplo:

```bash
npx vitest run \
  tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js \
  tests/historical-evidence/GroupedTemporalSplit.test.js
```

Ajusta rutas a la estructura real.

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

---

## Paso 8 — Diff final

Ejecuta:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence reports
```

No atribuyas cambios preexistentes a esta subfase.

---

# 25. Documentación obligatoria

Genera:

```text
reports/trabajo/Fase2.3.5.2_deterministic_grouped_temporal_splitter_reporte.md
```

Genera también:

```text
reports/trabajo/Fase2.3.5.2_nota_tecnica_diseno.md
```

## El reporte debe incluir

```text
resumen ejecutivo
alcance
baseline inicial
archivos inspeccionados
componentes reutilizados
diseño elegido
configuración
algoritmo
clave temporal
política de agrupamiento
política de asignación
archivos creados
archivos modificados
errores
tests
resultados focalizados
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
por qué el splitter pertenece a aplicación
cómo se agrupa por spinId
cómo se determina el timestamp del grupo
cómo se resuelven empates temporales
cómo se asignan grupos
cómo se construyen periodos inclusivos sin solapamiento
cómo se preserva la identidad fuente
cómo se inyectan splitId y createdAt
cómo se garantiza determinismo
cómo se evita leakage estructural
qué leakage queda pendiente
por qué el dataset original no se muta
```

---

# 26. Punto de control obligatorio

Genera:

```text
Fase_2.3.5.2_cerrada.md
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
API implementada
algoritmo
configuración
invariantes
errores
tests
archivos creados
archivos modificados
decisiones vigentes
warnings
estado Git
riesgos
fuera de alcance
próxima fase
prompt de reanudación
veredicto
```

La próxima subfase recomendada será:

```text
Fase 2.3.5.3 —
Dataset Split Leakage Detection and Validation
```

No implementes esa subfase ahora.

---

# 27. Criterios de aceptación

La Fase 2.3.5.2 puede cerrarse únicamente si:

```text
[ ] se leyó el punto de control anterior
[ ] se inspeccionó el repositorio real
[ ] se confirmó el baseline
[ ] se reutilizaron los contratos de 2.3.5.1
[ ] existe un splitter de aplicación
[ ] el splitter acepta HistoricalCalibrationDataset
[ ] agrupa todas las observaciones por spinId
[ ] ningún spinId cruza particiones
[ ] ningún observationId cruza particiones
[ ] el orden es temporal y determinista
[ ] los empates se resuelven canónicamente
[ ] no se utiliza la posición accidental
[ ] no se utiliza proximidad temporal
[ ] no se utiliza Math.random()
[ ] no se utiliza reloj global
[ ] splitId es inyectado
[ ] createdAt es inyectado
[ ] el dataset original no se muta
[ ] las particiones son no vacías
[ ] los periodos son válidos
[ ] no existen observaciones sin asignar
[ ] la identidad fuente se conserva
[ ] se construye GroupedTemporalSplit
[ ] los tests focalizados pasan
[ ] la suite completa pasa
[ ] lint pasa
[ ] build pasa
[ ] se generaron los reportes
[ ] se generó el punto de control
[ ] no se implementó entrenamiento
[ ] no se implementó promoción
[ ] no se implementó persistencia
[ ] no se implementó leakage semántico avanzado
```

---

# 28. Condiciones de detención

Detén la implementación y documenta el bloqueo si:

```text
no puede identificarse el timestamp científico
un mismo spinId contiene timestamps temporalmente incompatibles
HistoricalCalibrationDataset no permite acceder a observaciones
se requiere modificar contentHash
se requiere modificar manifestHash
se requiere cambiar el orden canónico
se requiere cambiar schemas
se requiere romper GroupedTemporalSplit
se requiere introducir aleatoriedad
se requiere persistencia
el baseline está roto por cambios ajenos y no es seguro continuar
```

No improvises cambios destructivos.

---

# 29. Formato de salida final

Al terminar, responde:

```text
FASE 2.3.5.2 — RESULTADO

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

Componente implementado:
- ...

Configuración:
- ...

Algoritmo:
- ...

Clave temporal:
- ...

Política de agrupamiento:
- ...

Política de asignación:
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

Prevención estructural de leakage:
- ...

Compatibilidad:
- ...

Warnings:
- ...

Estado Git:
- ...

Documentos:
- reports/trabajo/Fase2.3.5.2_deterministic_grouped_temporal_splitter_reporte.md
- reports/trabajo/Fase2.3.5.2_nota_tecnica_diseno.md
- Fase_2.3.5.2_cerrada.md

Próxima fase recomendada:
Fase 2.3.5.3 — Dataset Split Leakage Detection and Validation
```

---

# 30. Orden final de ejecución

```text
1. leer documentos de cierre
2. inspeccionar Git
3. ejecutar baseline
4. buscar splitters existentes
5. auditar contratos de dominio
6. identificar timestamp científico
7. definir configuración
8. definir política de agrupamiento
9. definir política de asignación
10. implementar splitter
11. agregar errores mínimos
12. agregar exports
13. crear tests focalizados
14. ejecutar tests focalizados
15. ejecutar suite completa
16. ejecutar lint
17. ejecutar build
18. ejecutar checks arquitectónicos disponibles
19. revisar diff
20. generar reporte
21. generar nota técnica
22. generar punto de control
23. emitir veredicto
```

Comienza ahora.

No solicites confirmación adicional.

No avances a la Fase 2.3.5.3.

No entrenes modelos.

No promociones calibradores.

No implementes persistencia.

No reviertas cambios ajenos.

No uses aleatoriedad.

No uses reloj global.
