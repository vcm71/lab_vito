# PROMPT DE EJECUCIÓN — FASE 2.3.5.5

## Roulette Tracker Pro

### Grouped Temporal Splitting Hardening and Formal Closure

Actúa como arquitecto principal de software, ingeniero senior de JavaScript/Node.js, auditor de arquitectura y responsable del cierre técnico de un sistema científico reproducible.

Debes aplicar experiencia avanzada en:

* Clean Architecture;
* Domain-Driven Design;
* diseño de datasets científicos;
* particionado temporal agrupado;
* prevención de data leakage;
* integridad y trazabilidad;
* inmutabilidad;
* determinismo;
* pruebas de regresión;
* hardening de software;
* auditoría de dependencias;
* documentación técnica;
* cierre formal de fases.

Debes trabajar directamente sobre:

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

# 1. Subfase que debes ejecutar

Ejecuta exclusivamente:

```text
Fase 2.3.5.5 —
Grouped Temporal Splitting Hardening and Formal Closure
```

Esta subfase debe realizar el hardening final, la auditoría integrada y el cierre formal de toda la Fase 2.3.5.

No debe introducir una nueva capacidad científica principal.

No debe avanzar hacia entrenamiento, métricas, selección de modelos ni promoción.

---

# 2. Estado técnico de partida

La Fase 2.3.5.4 está cerrada.

El baseline final informado es:

```text
SUITE COMPLETA: 963/963 PASS
ARCHIVOS DE TEST: 67
LINT: OK
BUILD: OK
```

Warning conocido y no bloqueante:

```text
Vite: chunk principal mayor a 500 kB
```

Durante la Fase 2.3.5.4 se corrigió:

```text
DatasetSplitLeakageDetector
```

para reenviar el:

```text
descriptor
```

del dataset hacia:

```text
DatasetIntegrityVerifier
```

cuando se ejecuta la validación en modo:

```text
FULL
```

También se agregó:

```text
tests/historical-evidence/GroupedTemporalSplitIntegration.test.js
```

que cubre el flujo:

```text
GroupedTemporalDatasetSplitter
        │
        ▼
GroupedTemporalSplit
        │
        ▼
DatasetSplitLeakageDetector
        │
        ▼
DatasetSplitLeakageReport
```

No reviertas esta corrección.

---

# 3. Documentos obligatorios

Antes de modificar código, localiza y lee completamente:

```text
Fase_2.3.4_cerrada.md

Fase_2.3.5.1_cerrada.md
Fase_2.3.5.2_cerrada.md
Fase_2.3.5.3_cerrada.md
Fase_2.3.5.4_cerrada.md
```

También revisa:

```text
Fase2.3.5.1_grouped_temporal_split_domain_reporte.md
Fase2.3.5.1_nota_tecnica_diseno.md

Fase2.3.5.2_reporte.md

Fase2.3.5.3_reporte.md

Fase2.3.5.4_reporte.md
```

Busca en:

```text
/
reports/
reports/trabajo/
```

No inventes documentos ausentes.

Si algún documento no existe:

1. registra la ausencia;
2. usa el código y los tests como fuente de verdad;
3. no reconstruyas contenido especulativo.

---

# 4. Objetivo del cierre

Debes confirmar que la Fase 2.3.5 dispone de una cadena coherente, estable y formalmente cerrable:

```text
HistoricalCalibrationDataset
        │
        ▼
GroupedTemporalDatasetSplitter
        │
        ▼
GroupedTemporalSplit
        │
        ▼
DatasetSplitLeakageDetector
        │
        ▼
DatasetSplitLeakageReport
```

El bloque completo debe garantizar:

```text
particionado temporal determinista
agrupamiento indivisible por spinId
ausencia de cruces entre particiones
periodos temporales coherentes
cobertura verificable
integridad de la fuente
trazabilidad científica
trazabilidad operativa
reportes de leakage tipados
inmutabilidad
reproducibilidad
compatibilidad hacia atrás
```

---

# 5. Componentes consolidados que debes auditar

## Dominio de splitting

```text
DatasetPartitionType
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit
```

## Configuración y splitter

```text
GroupedTemporalSplitConfiguration
createGroupedTemporalSplitConfiguration
GroupedTemporalDatasetSplitter
```

## Leakage

```text
DATASET_SPLIT_VALIDATION_MODE
DatasetSplitLeakageStatus
DatasetSplitLeakageSeverity
DatasetSplitLeakageFindingType
DatasetSplitLeakageFinding
DatasetSplitLeakageReport
DatasetSplitLeakageDetector
```

## Infraestructura científica reutilizada

```text
HistoricalCalibrationDataset
DatasetIdentity
DatasetSnapshotDescriptor
DatasetIntegrityVerifier
DatasetIntegrityReport
DatasetComparator
DatasetLineageResolver
DatasetVersion
DatasetVersionPolicy
canonicalSerialize
canonicalHashSync
canonicalHash
compareIso
deepFreeze
```

## Exports

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

---

# 6. Alcance exacto del hardening

Debes ejecutar:

```text
1. auditoría final de contratos;
2. auditoría de integración;
3. auditoría de API pública;
4. revisión de errores;
5. revisión de determinismo;
6. revisión de inmutabilidad;
7. revisión de cobertura;
8. revisión de dependencia entre capas;
9. revisión de duplicaciones;
10. búsqueda de código muerto;
11. búsqueda de helpers paralelos;
12. revisión de tests;
13. revisión de documentación;
14. corrección mínima de defectos demostrados;
15. ejecución de todas las puertas;
16. cierre formal de la Fase 2.3.5.
```

No amplíes el alcance hacia nuevas estrategias de splitting.

---

# 7. Principios que no deben romperse

Preserva obligatoriamente:

```text
modularidad
domain/application/infrastructure
determinismo
reproducibilidad
inmutabilidad
IDs inyectados
timestamps inyectados
ausencia de Math.random()
ausencia de reloj global
asociación por spinId
orden temporal canónico
serialización canónica única
SHA-256 oficial
errores tipados
datasets all-or-nothing
identidad científica separada de identidad operativa
no reparación automática
no mutación de datasets
no promoción con datos sintéticos
IdentityCalibration como default
```

---

# 8. Auditoría final de invariantes

Verifica expresamente:

## 8.1 Unidad indivisible

```text
spinId
```

nunca puede aparecer en más de una partición.

Todas sus observaciones deben permanecer juntas.

---

## 8.2 Observaciones

```text
observationId
```

no puede repetirse entre particiones.

La unión de observaciones de las particiones debe coincidir con la fuente en validación `FULL`.

---

## 8.3 Orden temporal

Debe mantenerse:

```text
TRAIN
→ VALIDATION opcional
→ TEST
```

No debe existir inversión temporal.

---

## 8.4 Periodos inclusivos

La política vigente es:

```text
from <= timestamp <= to
```

Dos particiones no pueden compartir el mismo borde temporal.

---

## 8.5 Clave temporal

Confirma que splitter y detector utilizan la misma clave científica.

La referencia esperada es:

```text
predictionCreatedAt
```

No permitas divergencias silenciosas.

---

## 8.6 Orden canónico

Debe preservarse:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

No debe existir un `.sort()` sin comparador en rutas científicas relevantes.

---

## 8.7 Identidad

Verifica coherencia de:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

No recalcules hashes en contratos que deben transportarlos.

---

## 8.8 Integridad

La validación `FULL` debe pasar correctamente el:

```text
descriptor
```

a `DatasetIntegrityVerifier`.

Incluye un test de regresión explícito si la cobertura actual no demuestra directamente esta corrección.

---

# 9. Hardening de DatasetSplitLeakageDetector

Revisa especialmente:

```text
src/historical-evidence/application/DatasetSplitLeakageDetector.js
```

Comprueba:

* diferencia real entre `STRUCTURAL` y `FULL`;
* forwarding correcto de dataset y descriptor;
* integración correcta con `DatasetIntegrityVerifier`;
* estado ante dataset inválido;
* estado ante evidencia incompleta;
* orden determinista de findings;
* comparación correcta de identidades;
* cobertura completa de IDs;
* ausencia de falso `VALID`;
* ausencia de reparación;
* ausencia de mutación.

No rediseñes la API salvo defecto crítico.

---

# 10. Hardening del splitter

Revisa:

```text
GroupedTemporalDatasetSplitter
createGroupedTemporalSplitConfiguration
```

Comprueba:

* configuración obligatoria y explícita;
* `trainUntil` válido;
* `validationUntil` opcional;
* orden correcto de cortes;
* cortes dentro del dataset;
* particiones no vacías;
* grupos no divididos;
* grupos no omitidos;
* grupos no asignados dos veces;
* resultado independiente del orden de entrada;
* IDs y timestamps inyectados;
* ausencia de valores generados internamente;
* dataset fuente no mutado.

---

# 11. Hardening de inmutabilidad

Prueba mutación directa e indirecta de:

```text
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit
DatasetSplitLeakageFinding
DatasetSplitLeakageReport
```

Incluye:

```text
arrays
objetos anidados
metadata
details
summary
statistics
sourceDatasetIdentity
partitions
findings
observationIds
spinIds
```

Revisa especialmente la decisión previa de freeze superficial en:

```text
GroupedTemporalSplit
```

Confirma que todas las referencias internas ya estén correctamente congeladas.

Si existe una vía real de mutación:

1. crea test de regresión;
2. aplica corrección mínima;
3. evita ciclos;
4. no introduzcas otro sistema de freezing.

---

# 12. Hardening de determinismo

Busca dentro de `src/historical-evidence`:

```text
Math.random
Date.now
new Date(
crypto.randomUUID
localeCompare
.sort(
JSON.stringify
Object.keys
Map
Set
```

Analiza cada resultado.

No modifiques usos legítimos fuera del alcance.

Verifica que ejecuciones repetidas con las mismas entradas produzcan:

```text
mismas particiones
mismo orden
mismos periodos
mismos IDs
mismos conteos
mismos findings
mismo status
misma representación lógica
```

---

# 13. Auditoría de errores

Revisa todos los errores de las subfases:

```text
InvalidPartitionTypeError
InvalidSplitPeriodError
InvalidSplitMetadataError
InvalidDatasetPartitionError
InvalidGroupedTemporalSplitError
```

Además de los errores asociados a:

```text
GroupedTemporalSplitConfiguration
GroupedTemporalDatasetSplitter
DatasetSplitLeakageDetector
validation mode
leakage detection
```

Comprueba:

* herencia;
* nombres;
* mensajes;
* contexto;
* serializabilidad;
* exports;
* ausencia de duplicación;
* separación entre error y finding.

No incluyas datasets completos en errores.

---

# 14. Auditoría de findings

Comprueba todos los tipos existentes.

Verifica que cada finding:

```text
tenga un tipo cerrado
tenga severidad válida
sea inmutable
tenga contexto mínimo
no contenga el dataset completo
no dependa del orden accidental
sea determinista
```

Revisa que la derivación de estado:

```text
VALID
INVALID
INCOMPLETE
```

sea coherente.

Un finding bloqueante nunca debe producir `VALID`.

---

# 15. Auditoría de dependencias

Verifica que no existan imports:

```text
domain → application
domain → infrastructure
application → infrastructure
```

Revisa además:

```text
imports circulares
barrels circulares
imports desde root dentro del mismo submódulo
acoplamiento indebido con src/calibration
duplicación de lógica
```

No introduzcas dependencias npm.

---

# 16. Auditoría de API pública

Comprueba que la API pública exporte lo necesario y solo lo necesario.

Revisa:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

Verifica importación pública de:

```text
DatasetPartitionType
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit
GroupedTemporalDatasetSplitter
createGroupedTemporalSplitConfiguration
DatasetSplitLeakageDetector
DatasetSplitLeakageReport
DatasetSplitLeakageFinding
DatasetSplitLeakageStatus
DatasetSplitLeakageSeverity
DatasetSplitLeakageFindingType
DATASET_SPLIT_VALIDATION_MODE
```

No exportes helpers internos.

Agrega o mejora una prueba de API pública si es necesario.

---

# 17. Auditoría de serialización

Verifica que los contratos puedan representarse sin:

```text
funciones
símbolos
bigint
números no finitos
ciclos
clases no serializables accidentalmente
```

No implementes exportadores.

No crees un nuevo serializador.

No uses `JSON.stringify` como fuente científica.

No agregues un hash de split en esta fase.

---

# 18. Tests obligatorios

Debes revisar y ejecutar como mínimo:

```text
GroupedTemporalSplit.test.js
GroupedTemporalDatasetSplitter.test.js
DatasetSplitLeakageDetector.test.js
GroupedTemporalSplitIntegration.test.js
```

También los tests relacionados con:

```text
HistoricalCalibrationDataset
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
CanonicalHash
```

---

# 19. Tests de cierre recomendados

Crea o amplía un archivo equivalente a:

```text
tests/historical-evidence/GroupedTemporalSplittingHardening.test.js
```

Solo si agrega cobertura real no duplicada.

Debe cubrir, según necesidad:

```text
1. flujo TRAIN + TEST válido;
2. flujo TRAIN + VALIDATION + TEST válido;
3. inputs desordenados producen salida idéntica;
4. múltiples observaciones de un spin permanecen juntas;
5. FULL entrega descriptor al integrity verifier;
6. STRUCTURAL no exige cobertura fuente;
7. FULL detecta observación faltante;
8. FULL detecta identidad divergente;
9. findings tienen orden determinista;
10. reportes son inmutables;
11. split es inmutable;
12. API pública importa todos los contratos;
13. dataset original no cambia;
14. ejecuciones repetidas son equivalentes.
```

No agregues tests redundantes solo para aumentar la cifra.

---

# 20. Correcciones permitidas

Puedes corregir únicamente defectos demostrados dentro de:

```text
Fase 2.3.5.1
Fase 2.3.5.2
Fase 2.3.5.3
Fase 2.3.5.4
```

Toda corrección debe:

```text
tener test de regresión
ser mínima
preservar API pública
preservar hashes
preservar schemas
quedar documentada
```

No hagas refactors cosméticos extensos.

No cambies nombres públicos sin una incompatibilidad crítica.

---

# 21. Fuera de alcance

No implementes:

```text
entrenamiento
calibradores nuevos
Brier Score
Log Loss
ECE
MCE
bootstrap
PairedBootstrap
intervalos de confianza
model selection
ranking
PromotionPolicy
persistencia
repositorios de snapshots
SQLite
DuckDB
PostgreSQL
filesystem storage
storage remoto
CSV
JSONL
Parquet
Arrow
deserialización
migración
merge automático
reparación automática
UI
captura productiva
random split
stratified split
k-fold
group k-fold
walk-forward
rolling windows
expanding windows
feature leakage detector
preprocessing leakage detector
```

---

# 22. Proceso obligatorio

## Paso 1 — Git

Ejecuta:

```bash
cd /home/shared/lab_vito

git status --short
git branch --show-current
git log -1 --oneline
git diff --stat
```

El working tree ha sido reportado como sucio.

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

## Paso 2 — Baseline inicial real

Ejecuta:

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
tests totales
archivos de test
duración
lint
build
warnings
fallos preexistentes
```

Baseline esperado, pero no asumido:

```text
963/963 PASS
67 archivos de test
lint OK
build OK
```

---

## Paso 3 — Auditoría estática

Busca:

```bash
rg "Math\.random|Date\.now|new Date\(|randomUUID|JSON\.stringify|localeCompare|\.sort\(" src/historical-evidence
```

Busca dependencias:

```bash
rg "historical-evidence/application|historical-evidence/infrastructure" src/historical-evidence/domain
rg "historical-evidence/infrastructure" src/historical-evidence/application
```

Adapta patrones a imports relativos reales.

---

## Paso 4 — Tests focalizados

Ejecuta:

```bash
npx vitest run \
  tests/historical-evidence/GroupedTemporalSplit.test.js \
  tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js \
  tests/historical-evidence/DatasetSplitLeakageDetector.test.js \
  tests/historical-evidence/GroupedTemporalSplitIntegration.test.js
```

Ajusta rutas solo si la estructura real difiere.

---

## Paso 5 — Inspección manual

Revisa:

```text
contratos
constructores
factories
configuración
comparadores
errores
findings
reports
barrels
exports
tests
```

---

## Paso 6 — Correcciones mínimas

Aplica únicamente correcciones demostradas.

Cada defecto debe quedar asociado a:

```text
test
archivo
causa
impacto
corrección
resultado
```

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

## Paso 8 — Revisión del diff

Ejecuta:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence reports
```

Distingue cambios de esta subfase de cambios preexistentes.

---

# 23. Reporte obligatorio

Genera:

```text
reports/trabajo/Fase2.3.5.5_grouped_temporal_splitting_hardening_closure_reporte.md
```

Debe incluir:

```text
resumen ejecutivo
objetivo
alcance
documentos leídos
baseline inicial
baseline final
componentes auditados
arquitectura consolidada
invariantes verificadas
auditoría del dominio
auditoría del splitter
auditoría del detector
auditoría del reporte
auditoría de integración
auditoría de determinismo
auditoría de inmutabilidad
auditoría de errores
auditoría de findings
auditoría de dependencias
auditoría de API pública
auditoría de serialización
hallazgos
correcciones
tests agregados
tests modificados
resultados focalizados
suite completa
lint
build
checks arquitectónicos
warnings
estado Git
riesgos
deuda técnica
fuera de alcance
veredicto
```

---

# 24. Nota técnica de cierre

Genera:

```text
reports/trabajo/Fase2.3.5.5_nota_tecnica_cierre.md
```

Debe explicar:

```text
flujo científico consolidado
responsabilidad de cada componente
spinId como unidad indivisible
clave temporal
orden canónico
periodos inclusivos
configuración del splitter
trazabilidad de fuente
identidad científica
identidad operativa
integridad FULL
validación STRUCTURAL
cobertura
findings
status
determinismo
inmutabilidad
límites de leakage
riesgos residuales
qué queda habilitado para fases posteriores
qué sigue prohibido
```

---

# 25. Punto de control de subfase

Genera:

```text
Fase_2.3.5.5_cerrada.md
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
arquitectura consolidada
componentes
invariantes
hallazgos
correcciones
tests
archivos creados
archivos modificados
decisiones vigentes
warnings
estado Git
riesgos
deuda técnica
fuera de alcance
veredicto
```

---

# 26. Cierre global obligatorio de Fase 2.3.5

Además, genera:

```text
Fase_2.3.5_cerrada.md
```

Este documento debe consolidar toda la fase:

```text
2.3.5.1 — contratos de dominio
2.3.5.2 — splitter determinista
2.3.5.3 — detector de leakage
2.3.5.4 — auditoría de integridad y consistencia
2.3.5.5 — hardening y cierre formal
```

Debe convertirse en el documento principal de reanudación.

---

# 27. Contenido de Fase_2.3.5_cerrada.md

Incluye obligatoriamente:

## Encabezado

```text
proyecto
nombre anterior
repositorio
fecha
estado
pipeline
```

## Resumen ejecutivo

Describe qué quedó implementado.

## Baseline final

Incluye cifras reales:

```text
tests
archivos de test
lint
build
warnings
```

## Cadena consolidada

```text
HistoricalCalibrationDataset
→ GroupedTemporalDatasetSplitter
→ GroupedTemporalSplit
→ DatasetSplitLeakageDetector
→ DatasetSplitLeakageReport
```

## Contratos implementados

Lista completa de dominio y aplicación.

## Estrategia de splitting

Explica:

```text
GROUPED_TEMPORAL
groupingKey = spinId
temporalKey
trainUntil
validationUntil opcional
TRAIN + TEST
TRAIN + VALIDATION + TEST
```

## Invariantes

Incluye:

```text
spinId indivisible
observationId única
periodos no solapados
orden temporal
particiones no vacías
cobertura
identidad fuente
determinismo
inmutabilidad
```

## Leakage cubierto

Documenta:

```text
duplicados entre particiones
solapamiento temporal
orden
cobertura
identidad
timestamps
conteos
grupos inesperados
grupos omitidos
```

## Leakage no cubierto

Mantén explícitamente fuera:

```text
feature leakage
target leakage en features
preprocessing leakage
hyperparameter leakage
model-state leakage
leakage operacional
```

## Archivos relevantes

Lista archivos de dominio, aplicación, tests y reportes.

## Estado Git

Aclara si el working tree continúa sucio.

## Decisiones que no deben revertirse

Incluye todas las decisiones científicas vigentes.

## Fuera de alcance

Incluye:

```text
entrenamiento
métricas
bootstrap
selección
promoción
persistencia
exportadores
deserialización
migración
UI
captura productiva
```

## Próxima fase recomendada

La próxima fase no debe seleccionarse automáticamente sin revisar el roadmap real.

Debes inspeccionar los documentos existentes y determinar cuál es el siguiente hito autorizado.

Posibles áreas futuras, solo como referencia:

```text
training dataset preparation
evaluation metrics
calibration experiment infrastructure
paired bootstrap
model selection
```

No implementes ninguna.

## Prompt de reanudación

Incluye un prompt breve para comenzar la próxima sesión.

## Veredicto final

Debe expresar claramente:

```text
FASE 2.3.5: CERRADA
ESTADO TÉCNICO: PASS
PIPELINE: GREEN
```

solo si todas las puertas pasan.

---

# 28. Criterios de aceptación

La Fase 2.3.5.5 puede cerrarse únicamente si:

```text
[ ] se leyeron todos los documentos disponibles
[ ] se obtuvo baseline real
[ ] se auditaron contratos de dominio
[ ] se auditó configuración
[ ] se auditó splitter
[ ] se auditó detector
[ ] se auditó reporte
[ ] se auditó integración FULL
[ ] se verificó forwarding de descriptor
[ ] se verificó STRUCTURAL
[ ] se verificó cobertura
[ ] se verificó identidad
[ ] se verificaron periodos
[ ] se verificó spinId indivisible
[ ] se verificó observationId única
[ ] se verificó determinismo
[ ] se verificó inmutabilidad
[ ] se verificaron errores
[ ] se verificaron findings
[ ] se verificaron exports
[ ] se verificaron dependencias
[ ] se verificó serialización
[ ] todo defecto tiene test
[ ] no se introdujo aleatoriedad
[ ] no se introdujo reloj global
[ ] no se cambiaron hashes
[ ] no se cambiaron schemas
[ ] no se implementó reparación
[ ] no se implementó entrenamiento
[ ] no se implementó promoción
[ ] no se implementó persistencia
[ ] tests focalizados pasan
[ ] suite completa pasa
[ ] lint pasa
[ ] build pasa
[ ] checks arquitectónicos disponibles pasan
[ ] reporte generado
[ ] nota técnica generada
[ ] Fase_2.3.5.5_cerrada.md generado
[ ] Fase_2.3.5_cerrada.md generado
```

---

# 29. Condiciones de detención

Detén el cierre y documenta el bloqueo si:

```text
existe data leakage estructural no resuelto
splitter y detector usan claves temporales distintas
FULL no verifica integridad correctamente
la identidad fuente no puede validarse
existe una vía real de mutación
el resultado no es determinista
la API pública está rota
existe dependencia inversa crítica
se requiere modificar contentHash
se requiere modificar manifestHash
se requiere cambiar schemas
se requiere romper compatibilidad pública
la suite falla por cambios de esta fase
lint falla
build falla
```

No declares cierre formal con un defecto científico crítico.

---

# 30. Formato de salida final

Al terminar, responde:

```text
FASE 2.3.5.5 — RESULTADO

Estado:
PASS | PASS_WITH_FIXES | PARTIAL | BLOCKED | FAIL

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

Componentes auditados:
- ...

Invariantes verificadas:
- ...

Hallazgos:
- ...

Correcciones:
- ...

Tests:
- ...

Determinismo:
- ...

Inmutabilidad:
- ...

Integridad FULL:
- ...

Validación STRUCTURAL:
- ...

Cobertura:
- ...

Identidad:
- ...

Dependencias:
- ...

API pública:
- ...

Warnings:
- ...

Estado Git:
- ...

Documentos:
- reports/trabajo/Fase2.3.5.5_grouped_temporal_splitting_hardening_closure_reporte.md
- reports/trabajo/Fase2.3.5.5_nota_tecnica_cierre.md
- Fase_2.3.5.5_cerrada.md
- Fase_2.3.5_cerrada.md

Veredicto global:
FASE 2.3.5: CERRADA | NO CERRADA

Próxima fase:
- determinada desde el roadmap real
```

---

# 31. Orden final de ejecución

```text
1. leer documentos disponibles
2. inspeccionar Git
3. obtener baseline real
4. auditar contratos
5. auditar configuración
6. auditar splitter
7. auditar detector
8. auditar integración FULL
9. auditar STRUCTURAL
10. auditar integridad
11. auditar cobertura
12. auditar identidad
13. auditar temporalidad
14. auditar determinismo
15. auditar inmutabilidad
16. auditar errores
17. auditar findings
18. auditar dependencias
19. auditar exports
20. auditar serialización
21. ejecutar tests focalizados
22. crear tests de regresión necesarios
23. aplicar correcciones mínimas
24. ejecutar suite completa
25. ejecutar lint
26. ejecutar build
27. ejecutar checks arquitectónicos
28. revisar diff
29. generar reporte
30. generar nota técnica
31. generar cierre 2.3.5.5
32. generar cierre global 2.3.5
33. emitir veredicto
```

Comienza ahora.

No solicites confirmación adicional.

No avances a una nueva fase funcional.

No entrenes modelos.

No selecciones calibradores.

No promociones modelos.

No implementes persistencia.

No repares splits automáticamente.

No uses aleatoriedad.

No uses reloj global.

No reviertas cambios ajenos.
