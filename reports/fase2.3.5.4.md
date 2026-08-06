# PROMPT DE EJECUCIÓN — FASE 2.3.5.4

## Roulette Tracker Pro

### Split Integrity, Coverage and Scientific Consistency Audit

Actúa como arquitecto principal de software, ingeniero senior de JavaScript/Node.js y auditor técnico especializado en:

* Clean Architecture;
* Domain-Driven Design;
* auditoría de sistemas científicos;
* validación de datasets;
* prevención de data leakage;
* consistencia temporal;
* reproducibilidad;
* trazabilidad científica y operativa;
* inmutabilidad;
* pruebas deterministas;
* hardening de pipelines de machine learning.

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

La Fase 2.3.5.3 está cerrada.

Se implementaron y exportaron:

```text
DatasetSplitLeakageDetector
DATASET_SPLIT_VALIDATION_MODE
DatasetSplitLeakageStatus
DatasetSplitLeakageSeverity
DatasetSplitLeakageFindingType
DatasetSplitLeakageFinding
DatasetSplitLeakageReport
```

El detector actualmente cubre:

```text
- validación opcional de integridad del dataset fuente;
- comparación de identidad científica y operativa;
- cobertura de spinId;
- cobertura de observationId;
- particiones duplicadas;
- periodos solapados;
- orden temporal inválido;
- observaciones fuera de periodo;
- spins inesperados;
- observaciones inesperadas;
- duplicados entre particiones;
- conflictos temporales por spin;
- clasificación VALID, INVALID o INCOMPLETE.
```

La verificación informada fue:

```text
tests: OK
lint: OK
build: OK
```

El cierre no cuantifica el total final de tests ni el número de archivos de prueba.

Por tanto, debes obtener el baseline real antes de modificar código.

---

# 2. Documentos obligatorios

Antes de modificar cualquier archivo, localiza y lee completamente:

```text
Fase_2.3.4_cerrada.md
Fase_2.3.5.1_cerrada.md
Fase_2.3.5.2_cerrada.md
Fase_2.3.5.3_cerrada.md

Fase2.3.5.1_grouped_temporal_split_domain_reporte.md
Fase2.3.5.1_nota_tecnica_diseno.md
Fase2.3.5.2_reporte.md
Fase2.3.5.3_reporte.md
```

Busca en:

```text
/
reports/
reports/trabajo/
```

Si algún documento no existe:

1. registra su ausencia;
2. no inventes su contenido;
3. usa los documentos disponibles;
4. confirma el estado real mediante código, tests y Git.

---

# 3. Objetivo exacto

Ejecutar exclusivamente:

```text
Fase 2.3.5.4 —
Split Integrity, Coverage and Scientific Consistency Audit
```

Esta subfase no debe introducir un nuevo algoritmo principal.

Su objetivo es auditar integralmente la cadena de splitting temporal agrupado:

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

Debes verificar que todos los contratos y componentes implementados entre las fases 2.3.5.1 y 2.3.5.3 funcionan de forma coherente, determinista, trazable e inmutable.

---

# 4. Alcance de la auditoría

La auditoría debe cubrir, como mínimo:

```text
1. contratos de dominio;
2. configuración del splitter;
3. algoritmo de agrupamiento;
4. asignación temporal;
5. construcción de particiones;
6. metadata del split;
7. identidad del dataset fuente;
8. integridad del dataset;
9. cobertura de observaciones;
10. cobertura de spins;
11. periodos temporales;
12. orden TRAIN → VALIDATION → TEST;
13. prevención estructural de leakage;
14. findings del detector;
15. clasificación del reporte;
16. inmutabilidad;
17. determinismo;
18. errores tipados;
19. exports públicos;
20. dirección de dependencias;
21. compatibilidad hacia atrás;
22. tests y documentación.
```

---

# 5. Componentes obligatorios a inspeccionar

Debes inspeccionar, si existen:

## Dominio

```text
DatasetPartitionType
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit

DatasetSplitLeakageStatus
DatasetSplitLeakageSeverity
DatasetSplitLeakageFindingType
DatasetSplitLeakageFinding
DatasetSplitLeakageReport
```

## Aplicación

```text
GroupedTemporalSplitConfiguration
createGroupedTemporalSplitConfiguration
GroupedTemporalDatasetSplitter
DatasetSplitLeakageDetector
DatasetIntegrityVerifier
```

## Dataset e identidad

```text
HistoricalCalibrationDataset
DatasetIdentity
DatasetSnapshotDescriptor
DatasetVersion
DatasetVersionPolicy
DatasetStatistics
DatasetManifest
DatasetBuilder
```

## Utilidades

```text
compareIso
deepFreeze
canonicalSerialize
canonicalHashSync
canonicalHash
```

## Integración

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

---

# 6. Principios obligatorios

Toda la auditoría debe comprobar la preservación de:

```text
modularidad
separación domain/application/infrastructure
determinismo
reproducibilidad
inmutabilidad profunda
IDs inyectados
timestamps inyectados
ausencia de reloj global
ausencia de aleatoriedad
asociación por spinId
orden temporal científico
serialización canónica única
SHA-256 oficial
errores tipados
datasets all-or-nothing
trazabilidad científica
trazabilidad operativa
no reparación automática
no mutación del dataset fuente
```

Debes buscar activamente violaciones de estos principios.

---

# 7. Auditoría de contratos de dominio

## 7.1 DatasetPartitionType

Verifica:

```text
TRAIN
VALIDATION
TEST
```

Debe ser un conjunto cerrado.

Debe rechazar valores arbitrarios.

No deben existir aliases ambiguos.

---

## 7.2 SplitPeriod

Verifica:

```text
from <= to
```

Comprueba:

* timestamps ISO válidos;
* semántica inclusiva;
* comparación determinista;
* ausencia de conversión local;
* ausencia de reloj global;
* inmutabilidad;
* periodos compartidos por referencia no mutable.

---

## 7.3 DatasetPartition

Comprueba:

```text
partitionType
period
observationIds
spinIds
observationCount
spinCount
sourceDatasetIdentity
metadata
```

Verifica que:

* no duplica observaciones completas;
* no permite IDs vacíos;
* no permite duplicados internos;
* los conteos coinciden con las colecciones;
* la identidad fuente es coherente;
* las colecciones son inmutables;
* no existe mutación externa.

---

## 7.4 GroupedTemporalSplit

Verifica:

* tipos de partición únicos;
* periodos ordenados;
* ausencia de solapamiento;
* ausencia de bordes compartidos;
* `spinId` indivisible;
* `observationId` única;
* misma identidad fuente;
* totales derivados coherentes;
* metadata consistente;
* inmutabilidad del agregado;
* orden determinista de particiones.

Revisa específicamente la decisión de freeze superficial informada en la Fase 2.3.5.1.

Debes comprobar que no permita mutación indirecta.

No aceptes la justificación documental sin verificar el comportamiento real.

---

# 8. Auditoría del splitter

Inspecciona:

```text
GroupedTemporalDatasetSplitter
createGroupedTemporalSplitConfiguration
```

Verifica:

## Entrada

* acepta el tipo correcto de dataset;
* valida configuración;
* rechaza dataset ausente;
* rechaza identidad ausente;
* rechaza configuración inconsistente;
* no usa valores implícitos peligrosos.

## Integridad

* ejecuta `DatasetIntegrityVerifier` cuando corresponde;
* no duplica su lógica;
* no continúa con dataset inválido;
* diferencia error de integridad y error de splitting.

## Agrupamiento

* agrupa exclusivamente por `spinId`;
* no agrupa por posición;
* no agrupa por proximidad temporal;
* no divide un spin;
* conserva todas las observaciones del grupo;
* resuelve grupos en forma determinista.

## Clave temporal

Confirma cuál es la clave temporal real.

Debe ser consistente con:

```text
predictionCreatedAt
```

o con la decisión explícita registrada en código.

No aceptes divergencias silenciosas entre splitter, dataset y detector.

## Orden

Verifica el desempate canónico:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

El splitter no debe depender del orden de entrada.

## Cortes

Comprueba:

```text
trainUntil
validationUntil opcional
```

Verifica:

* cortes válidos;
* cortes ordenados;
* cortes dentro del rango;
* particiones no vacías;
* ausencia de grupos sin asignar;
* ausencia de asignación doble;
* timestamps de periodos derivados de grupos reales;
* ausencia de sumas artificiales de milisegundos.

## Salida

Verifica que construye:

```text
SplitMetadata
DatasetPartition
GroupedTemporalSplit
```

sin saltarse validaciones de dominio.

---

# 9. Auditoría del detector de leakage

Inspecciona:

```text
DatasetSplitLeakageDetector
DatasetSplitLeakageReport
DatasetSplitLeakageFinding
```

Verifica:

## Modos

```text
FULL
STRUCTURAL
```

Comprueba que:

* el modo se valida;
* el modo modifica realmente los checks ejecutados;
* `STRUCTURAL` no pretende validar cobertura fuente;
* `FULL` incluye checks estructurales y contra fuente;
* un modo inválido produce error tipado.

## Integridad de fuente

Comprueba:

* integración real con `DatasetIntegrityVerifier`;
* comportamiento ante dataset inválido;
* clasificación `INVALID` o `INCOMPLETE`;
* ausencia de falso `VALID`.

## Identidad

Verifica comparación de:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

Debe distinguir:

```text
identidad científica
identidad operativa
```

Una discrepancia de `contentHash` debe ser crítica.

No todas las diferencias operativas tienen necesariamente la misma gravedad.

## Cobertura

Verifica comparación por identidad lógica de:

```text
observationId
spinId
```

Debe detectar:

* faltantes;
* inesperados;
* duplicados;
* compartidos;
* no asignados.

No debe comparar por posición.

## Periodos

Comprueba:

* observaciones dentro del periodo;
* spins dentro del periodo;
* bordes inclusivos;
* periodos solapados;
* periodos fuera de orden;
* conflictos temporales por spin.

## Findings

Comprueba:

* tipo cerrado;
* severidad válida;
* contexto mínimo suficiente;
* ausencia de objetos gigantes;
* orden determinista;
* inmutabilidad;
* serializabilidad;
* ausencia de datos sensibles o irrelevantes.

## Estado final

Verifica la derivación de:

```text
VALID
INVALID
INCOMPLETE
```

Debe ser determinista.

No puede depender del orden de findings.

Un finding crítico no puede producir `VALID`.

La evidencia insuficiente no puede producir `VALID`.

---

# 10. Matriz de consistencia científica

Debes construir durante la auditoría una matriz equivalente a:

| Área             | Fuente de verdad             | Productor        | Verificador                     |
| ---------------- | ---------------------------- | ---------------- | ------------------------------- |
| Identidad fuente | DatasetIdentity              | DatasetBuilder   | LeakageDetector                 |
| Orden temporal   | chronology/canonical order   | Splitter         | LeakageDetector                 |
| Agrupamiento     | spinId                       | Splitter         | GroupedTemporalSplit + Detector |
| Periodos         | SplitPeriod                  | Splitter         | GroupedTemporalSplit + Detector |
| Cobertura        | HistoricalCalibrationDataset | Splitter         | LeakageDetector                 |
| Conteos          | IDs de particiones           | DatasetPartition | Detector                        |
| Integridad       | DatasetIntegrityVerifier     | DatasetBuilder   | Splitter + Detector             |
| Metadata         | SplitMetadata                | Splitter         | Detector                        |

Adapta la matriz a la implementación real.

Inclúyela en la nota técnica.

---

# 11. Auditoría de determinismo

Ejecuta escenarios repetidos con las mismas entradas.

Comprueba que sean idénticos:

```text
GroupedTemporalSplit
DatasetSplitLeakageReport
findings
orden de particiones
orden de IDs
periodos
conteos
metadata
```

Busca:

```text
Math.random()
Date.now()
new Date()
crypto.randomUUID()
localeCompare sin criterio controlado
orden accidental de Object.keys
orden accidental de Map
orden accidental de Set
sort sin comparator
estado global mutable
```

No basta con que los tests actuales pasen.

Realiza búsquedas estáticas explícitas.

---

# 12. Auditoría de inmutabilidad

Intenta mutar:

```text
SplitPeriod
SplitMetadata
DatasetPartition
GroupedTemporalSplit
DatasetSplitLeakageFinding
DatasetSplitLeakageReport
arrays de observationIds
arrays de spinIds
arrays de partitions
arrays de findings
sourceDatasetIdentity
summary
statistics
details
```

Debes comprobar mutación directa e indirecta.

Presta especial atención a:

```text
freeze superficial
referencias compartidas
objetos anidados
arrays anidados
metadata opcional
finding.details
```

Si descubres una mutabilidad real:

1. agrega un test de regresión;
2. corrige mínimamente;
3. reutiliza `deepFreeze`;
4. evita ciclos;
5. documenta el hallazgo.

---

# 13. Auditoría de errores

Revisa todos los errores agregados en las fases 2.3.5.1, 2.3.5.2 y 2.3.5.3.

Comprueba:

* herencia correcta;
* nombres coherentes;
* mensajes claros;
* ausencia de datasets completos en mensajes;
* contexto mínimo;
* exports públicos necesarios;
* ausencia de duplicación semántica;
* diferencia entre error de ejecución y finding.

No renombres errores públicos sin necesidad demostrable.

---

# 14. Auditoría de dependencias

Comprueba mediante búsquedas:

```text
domain → application
domain → infrastructure
application → infrastructure
```

Estas dependencias están prohibidas.

Comprueba también:

* imports circulares;
* barrels que introduzcan ciclos;
* imports desde root cuando debería usarse archivo directo;
* dependencia indebida con `src/calibration`;
* duplicación entre `historical-evidence` y `calibration`.

El splitter y el detector pueden inspeccionar conceptos paralelos de calibration, pero no deben quedar acoplados sin una decisión arquitectónica explícita.

---

# 15. Auditoría de exports

Revisa:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

Comprueba:

* todos los contratos públicos necesarios están exportados;
* helpers internos no están exportados;
* no hay nombres duplicados;
* no hay export roto;
* no existen imports circulares por barrels;
* la API pública coincide con documentación y tests.

Incluye una prueba de importación pública si no existe.

---

# 16. Auditoría de serialización y representación

No debes implementar exportadores.

Pero debes verificar que los nuevos contratos:

* sean representables de forma determinista;
* no contengan funciones;
* no contengan ciclos;
* no dependan de tipos no soportados;
* sean compatibles con la serialización canónica cuando corresponda;
* no usen `JSON.stringify` como fuente científica paralela.

No modifiques `contentHash` ni `manifestHash`.

No agregues hashes de split en esta fase salvo que ya exista un contrato explícito.

---

# 17. Escenarios end-to-end obligatorios

Crea o amplía tests de integración para cubrir:

## Escenario 1 — TRAIN + TEST válido

```text
dataset íntegro
split determinista
cobertura completa
sin leakage
reporte VALID
```

## Escenario 2 — TRAIN + VALIDATION + TEST válido

```text
orden temporal correcto
spins indivisibles
cobertura total
reporte VALID
```

## Escenario 3 — Datos de entrada desordenados

```text
mismo resultado final
mismo orden de particiones
mismos IDs
mismos periodos
```

## Escenario 4 — Múltiples observaciones por spin

```text
todas permanecen juntas
sin duplicación
sin pérdida
```

## Escenario 5 — Split alterado

Construye una representación analizable alterada con:

```text
spin compartido
observation compartida
conteo incorrecto
periodo inválido
```

El detector debe generar findings y no reparar.

## Escenario 6 — Dataset fuente inválido

El detector no debe producir falso `VALID`.

## Escenario 7 — Cobertura incompleta

Debe producir `INVALID` o `INCOMPLETE` según la política real.

## Escenario 8 — Determinismo repetido

Ejecuta splitter y detector varias veces con entradas iguales.

## Escenario 9 — Inmutabilidad

Intenta mutar todos los niveles relevantes.

---

# 18. Hardening permitido

Esta subfase puede corregir únicamente defectos demostrados en:

```text
contratos 2.3.5.1
splitter 2.3.5.2
detector 2.3.5.3
exports relacionados
tests relacionados
documentación relacionada
```

Toda corrección debe:

1. estar respaldada por un test de regresión;
2. ser mínima;
3. preservar compatibilidad;
4. documentarse;
5. no ampliar el alcance.

No realices refactors cosméticos masivos.

---

# 19. Fuera de alcance

No implementes:

```text
entrenamiento
calibración
Brier Score
Log Loss
ECE
MCE
bootstrap
PairedBootstrap
model selection
ranking de calibradores
PromotionPolicy
persistencia
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
migración
reparación automática
merge automático
UI
captura productiva
feature leakage avanzado
preprocessing leakage
hyperparameter leakage
```

No avances a evaluación de modelos.

---

# 20. Proceso obligatorio

## Paso 1 — Estado Git

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

## Paso 2 — Baseline real

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
total de tests
archivos de test
duración
lint
build
warnings
fallos preexistentes
```

No reutilices cifras antiguas sin confirmación.

---

## Paso 3 — Inspección estática

Ejecuta búsquedas para:

```text
Math.random
Date.now
new Date
randomUUID
JSON.stringify
localeCompare
.sort(
Object.keys
Map
Set
deepFreeze
Object.freeze
```

Limita la interpretación al alcance de `historical-evidence`.

No modifiques usos legítimos fuera de la fase.

---

## Paso 4 — Mapa arquitectónico

Documenta:

```text
componentes
dependencias
flujo de datos
fuentes de verdad
invariantes
errores
exports
tests existentes
riesgos
```

---

## Paso 5 — Auditoría focalizada

Ejecuta tests existentes de:

```text
GroupedTemporalSplit
GroupedTemporalDatasetSplitter
DatasetSplitLeakageDetector
DatasetIntegrityVerifier
DatasetComparator
DatasetLineageResolver
```

---

## Paso 6 — Tests integrados

Crea un archivo equivalente a:

```text
tests/historical-evidence/GroupedTemporalSplitIntegratedAudit.test.js
```

El nombre puede ajustarse a las convenciones reales.

Debe cubrir los escenarios end-to-end obligatorios.

---

## Paso 7 — Correcciones mínimas

Corrige solo defectos demostrados.

No cambies API pública sin una razón crítica.

---

## Paso 8 — Suite completa

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

## Paso 9 — Revisión del diff

Ejecuta:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence reports
```

Separa:

```text
cambios preexistentes
cambios 2.3.5.1
cambios 2.3.5.2
cambios 2.3.5.3
cambios 2.3.5.4
```

No atribuyas todo el árbol sucio a esta fase.

---

# 21. Documentación obligatoria

Genera:

```text
reports/trabajo/Fase2.3.5.4_split_integrity_coverage_scientific_consistency_audit_reporte.md
```

Genera también:

```text
reports/trabajo/Fase2.3.5.4_nota_tecnica_auditoria.md
```

## El reporte debe incluir

```text
resumen ejecutivo
objetivo
alcance
baseline inicial
baseline final
documentos leídos
archivos inspeccionados
mapa arquitectónico
componentes auditados
matriz de consistencia
auditoría de dominio
auditoría del splitter
auditoría del detector
auditoría de integridad
auditoría de cobertura
auditoría temporal
auditoría de identidad
auditoría de determinismo
auditoría de inmutabilidad
auditoría de errores
auditoría de dependencias
auditoría de exports
tests integrados
defectos encontrados
correcciones realizadas
archivos creados
archivos modificados
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
fuentes de verdad de cada contrato
flujo completo del dataset al reporte
unidad científica spinId
clave temporal
periodos inclusivos
cobertura de observaciones
cobertura de spins
identidad científica
identidad operativa
determinismo
inmutabilidad
clasificación de findings
derivación de status
límites del detector
riesgos residuales de leakage
matriz de consistencia científica
```

---

# 22. Punto de control obligatorio

Genera:

```text
Fase_2.3.5.4_cerrada.md
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
componentes auditados
matriz de consistencia
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
próxima fase
prompt de reanudación
veredicto final
```

La próxima subfase recomendada será:

```text
Fase 2.3.5.5 —
Grouped Temporal Splitting Hardening and Formal Closure
```

No implementes esa subfase ahora.

---

# 23. Criterios de aceptación

La Fase 2.3.5.4 solo puede cerrarse si:

```text
[ ] se leyeron los documentos anteriores
[ ] se obtuvo baseline real cuantificado
[ ] se auditó DatasetPartitionType
[ ] se auditó SplitPeriod
[ ] se auditó SplitMetadata
[ ] se auditó DatasetPartition
[ ] se auditó GroupedTemporalSplit
[ ] se auditó la configuración
[ ] se auditó GroupedTemporalDatasetSplitter
[ ] se auditó DatasetSplitLeakageDetector
[ ] se auditó DatasetSplitLeakageReport
[ ] se verificó spinId indivisible
[ ] se verificó observationId única
[ ] se verificaron periodos inclusivos
[ ] se verificó orden temporal
[ ] se verificó cobertura completa
[ ] se verificó identidad fuente
[ ] se verificaron conteos
[ ] se verificó determinismo
[ ] se verificó inmutabilidad directa
[ ] se verificó inmutabilidad indirecta
[ ] se verificaron errores tipados
[ ] se verificaron exports
[ ] se verificó dirección de dependencias
[ ] se buscaron ciclos
[ ] se ejecutaron escenarios end-to-end
[ ] todo defecto corregido tiene test
[ ] no se introdujo aleatoriedad
[ ] no se introdujo reloj global
[ ] no se modificaron hashes científicos
[ ] no se implementó reparación
[ ] no se implementó entrenamiento
[ ] no se implementó persistencia
[ ] los tests focalizados pasan
[ ] la suite completa pasa
[ ] lint pasa
[ ] build pasa
[ ] se generó el reporte
[ ] se generó la nota técnica
[ ] se generó el punto de control
```

---

# 24. Condiciones de detención

Detén la implementación y documenta el bloqueo si:

```text
el splitter y el detector usan claves temporales incompatibles
la identidad fuente no puede verificarse
el split no permite validar cobertura
la inmutabilidad requiere romper API pública
se requiere modificar contentHash
se requiere modificar manifestHash
se requiere cambiar schemas
se requiere cambiar el orden canónico
se requiere reescribir HistoricalCalibrationDataset
se requiere introducir persistencia
se requiere entrenar modelos
el baseline está roto y no es seguro continuar
```

No ocultes hallazgos.

No declares PASS si existe una inconsistencia científica crítica.

---

# 25. Formato de salida final

Al finalizar, responde:

```text
FASE 2.3.5.4 — RESULTADO

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

Matriz de consistencia:
- ...

Hallazgos:
- ...

Correcciones:
- ...

Tests integrados:
- ...

Determinismo:
- ...

Inmutabilidad:
- ...

Integridad:
- ...

Cobertura:
- ...

Consistencia temporal:
- ...

Identidad:
- ...

Dependencias:
- ...

Exports:
- ...

Compatibilidad:
- ...

Warnings:
- ...

Estado Git:
- ...

Documentos:
- reports/trabajo/Fase2.3.5.4_split_integrity_coverage_scientific_consistency_audit_reporte.md
- reports/trabajo/Fase2.3.5.4_nota_tecnica_auditoria.md
- Fase_2.3.5.4_cerrada.md

Próxima fase recomendada:
Fase 2.3.5.5 — Grouped Temporal Splitting Hardening and Formal Closure
```

---

# 26. Orden final de ejecución

```text
1. leer documentos anteriores
2. inspeccionar Git
3. obtener baseline cuantificado
4. auditar estructura del repositorio
5. mapear componentes y dependencias
6. auditar contratos de dominio
7. auditar splitter
8. auditar detector
9. auditar integridad
10. auditar cobertura
11. auditar temporalidad
12. auditar identidad
13. auditar determinismo
14. auditar inmutabilidad
15. auditar errores
16. auditar exports
17. auditar dependencias y ciclos
18. crear tests integrados
19. ejecutar tests focalizados
20. corregir defectos demostrados
21. ejecutar suite completa
22. ejecutar lint
23. ejecutar build
24. ejecutar checks arquitectónicos disponibles
25. revisar diff
26. generar reporte
27. generar nota técnica
28. generar punto de control
29. emitir veredicto
```

Comienza ahora.

No solicites confirmación adicional.

No avances a la Fase 2.3.5.5.

No entrenes modelos.

No promociones calibradores.

No implementes persistencia.

No repares automáticamente splits.

No uses aleatoriedad.

No uses reloj global.

No reviertas cambios ajenos.
