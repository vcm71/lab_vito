# PROMPT MAESTRO — FASE 2.3.3

## Historical Dataset Assembly

### Proyecto

**Roulette Tracker Pro — lab_vito**

Nombres anteriores:

* ORION
* ORION_v2

### Fase

**Fase 2.3.3 — Ensamblaje del Dataset Histórico de Calibración**

---

# 1. Rol del agente

Actúa como:

* Arquitecto principal de software.
* Ingeniero senior JavaScript/Node.js.
* Especialista en Clean Architecture.
* Especialista en datasets científicos reproducibles.
* Especialista en calibración probabilística.
* Especialista en trazabilidad y procedencia de datos.
* Especialista en prevención de data leakage.
* Especialista en serialización determinista.
* Ingeniero de pruebas.
* Auditor de contratos públicos.
* Responsable de documentación técnica.

Debes inspeccionar e implementar directamente esta fase en el repositorio actual de Roulette Tracker Pro.

No actúes como un simple generador de código.

Antes de modificar cualquier archivo:

1. Verifica la raíz real del repositorio.
2. Revisa el estado Git.
3. Lee los informes de las fases:

   * 2.3.1
   * 2.3.1.1
   * 2.3.2
4. Inspecciona completamente `src/historical-evidence/`.
5. Inspecciona las 133 pruebas actuales de `historical-evidence`.
6. Inspecciona `CalibrationObservation`.
7. Inspecciona `ObservationBuilder`.
8. Inspecciona `BuildObservationsBySpinUseCase`.
9. Inspecciona `CalibrationObservationRepository`.
10. Inspecciona `InMemoryCalibrationObservationRepository`.
11. Inspecciona `getEffectiveProbability`.
12. Inspecciona el esquema y versionado actuales.
13. Inspecciona las utilidades existentes de:

    * serialización canónica;
    * hashing SHA-256;
    * manifests;
    * snapshots;
    * benchmark;
    * temporal splits.
14. Revisa los contratos actuales de datasets utilizados por:

    * calibradores;
    * benchmark;
    * validación;
    * entrenamiento;
    * PromotionPolicy.
15. Revisa las reglas de arquitectura.
16. Revisa los exports públicos.
17. Revisa los scripts reales de `package.json`.
18. Busca consumidores actuales de los componentes de evidencia.
19. Confirma que todavía no existe captura automática productiva.
20. Confirma que todavía no existe un dataset histórico persistente oficial.

No inventes rutas, estructuras, scripts ni contratos sin verificar primero el repositorio real.

---

# 2. Contexto confirmado

La Fase 2.3.2 construyó la cadena:

```text
PredictionRecord
+
SpinOutcomeRecord
↓
CalibrationObservation
```

Estado informado:

```text
Tests globales: 767/767 PASS
Archivos de test: 49
Tests de historical-evidence: 133
Lint: 0 warnings
Build: OK
Dependencias nuevas: ninguna
```

Componentes disponibles:

* `CalibrationObservation`
* `PredictionTargetEvaluator`
* `ObservationIdentity`
* `ObservationBuilder`
* `BuildObservationsBySpinUseCase`
* `ConsensusToPredictionMapper`
* `CalibrationObservationRepository`
* `InMemoryCalibrationObservationRepository`
* errores tipados;
* inmutabilidad profunda;
* prevención de leakage temporal;
* orden determinista;
* atomicidad all-or-nothing;
* deduplicación lógica.

Cada observación representa una fila científica individual:

```text
CalibrationObservation
├── schemaVersion
├── observationId
├── predictionId
├── outcomeId
├── spinId
├── target
├── rawConsensusScore
├── calibration
├── observedOutcome
├── predictionCreatedAt
├── outcomeRecordedAt
├── observationCreatedAt
└── metadata
```

Todavía no existe:

* dataset agregado oficial;
* snapshot histórico;
* versión de dataset;
* persistencia duradera;
* exportación;
* entrenamiento;
* model selection;
* promoción.

---

# 3. Objetivo principal

Implementar una capa que transforme una colección válida de:

```text
CalibrationObservation[]
```

en un:

```text
HistoricalCalibrationDataset
```

El dataset debe ser:

* inmutable;
* reproducible;
* ordenado canónicamente;
* trazable;
* validado;
* deduplicado;
* científicamente coherente;
* preparado para versionado;
* preparado para hashing posterior o actual si ya existe infraestructura reutilizable;
* independiente de almacenamiento;
* independiente de entrenamiento;
* independiente de promoción.

Esta fase debe producir un snapshot lógico del conjunto de observaciones.

No debe activar todavía:

* exportadores;
* persistencia productiva;
* entrenamiento;
* model selection;
* PromotionPolicy.

---

# 4. Principio científico central

Un dataset histórico no es simplemente un array de observaciones.

Debe representar un conjunto científico identificado y auditable, con:

```text
qué observaciones contiene;
en qué orden;
qué esquema utilizan;
qué periodo cubren;
qué estrategias aparecen;
qué targets aparecen;
qué reglas de filtrado se aplicaron;
qué observaciones fueron excluidas;
quién o qué construyó el snapshot;
cuándo fue construido;
qué versión de contrato utiliza.
```

La misma entrada, con las mismas opciones, debe producir el mismo contenido lógico.

Ningún orden accidental de repositorio, `Map`, sistema de archivos o ejecución debe modificar el dataset resultante.

---

# 5. Restricciones obligatorias

Esta fase no puede:

* crear SQLite;
* crear DuckDB;
* crear PostgreSQL;
* crear persistencia durable productiva;
* exportar CSV;
* exportar JSONL;
* exportar Parquet;
* exportar Arrow;
* entrenar calibradores;
* ejecutar model selection;
* modificar `IdentityCalibration`;
* modificar `ProbabilityCalibrator`;
* modificar `PromotionPolicy`;
* modificar fórmulas de consenso;
* modificar `ConsensusEngine`;
* modificar `SpinManager`;
* activar captura automática;
* agregar listeners;
* crear cron jobs;
* crear eventos ocultos;
* consumir datos sintéticos como evidencia real;
* crear UI;
* crear dashboard;
* hacer refactors fuera de alcance;
* debilitar pruebas;
* eliminar invariantes existentes.

Esta fase es exclusivamente de ensamblaje, validación, ordenación y resumen del dataset histórico.

---

# 6. Entregables principales

Implementar, como mínimo:

1. `HistoricalCalibrationDataset`
2. `DatasetBuilder`
3. `DatasetAssemblyOptions`
4. `DatasetManifest`
5. `DatasetStatistics`
6. validación homogénea de esquemas;
7. deduplicación global;
8. orden canónico;
9. filtrado explícito;
10. reporte de exclusiones;
11. trazabilidad de procedencia;
12. construcción desde repositorio;
13. snapshot inmutable;
14. pruebas exhaustivas;
15. documentación técnica;
16. informe final.

---

# 7. Contrato `HistoricalCalibrationDataset`

Diseña un contrato público, profundamente inmutable y serializable.

Ejemplo conceptual:

```javascript
{
  datasetId,
  schemaVersion,
  observationSchemaVersion,
  createdAt,
  period: {
    predictionFrom,
    predictionTo,
    outcomeFrom,
    outcomeTo
  },
  manifest,
  statistics,
  observations
}
```

Este ejemplo es orientativo.

Debes adaptar el diseño a las convenciones reales del proyecto.

## 7.1 Campos obligatorios mínimos

El dataset debe conservar inequívocamente:

```text
datasetId
schemaVersion
observationSchemaVersion
createdAt
observations
manifest
statistics
```

## 7.2 `datasetId`

Debe ser:

* proporcionado explícitamente;
* o generado mediante dependencia inyectada;
* o derivado determinísticamente si ya existe infraestructura segura y apropiada.

No utilizar:

* `Math.random()`;
* timestamp como única identidad;
* posición en una lista;
* contador global oculto;
* ID implícito;
* UUID generado dentro del dominio sin inyección.

## 7.3 Versión de esquema

Debe existir una versión explícita del contrato del dataset, por ejemplo:

```text
HISTORICAL_CALIBRATION_DATASET_SCHEMA_VERSION = "1"
```

Debe distinguirse de:

```text
CALIBRATION_OBSERVATION_SCHEMA_VERSION
```

No usar la versión de `package.json` como versión de esquema.

---

# 8. Contrato del manifiesto

Implementar un manifiesto que describa cómo se construyó el dataset.

Nombre conceptual:

```text
DatasetManifest
```

Debe incluir, según corresponda:

```text
datasetId
datasetSchemaVersion
observationSchemaVersion
createdAt
sourceType
sourceRepository
selectionPolicy
filters
sortPolicy
duplicatePolicy
exclusionPolicy
observationCount
excludedCount
builderVersion
metadata
```

No es obligatorio usar exactamente todos los campos.

## Reglas

El manifiesto debe:

* ser profundamente inmutable;
* ser serializable;
* contener únicamente datos reproducibles;
* no incluir funciones;
* no incluir objetos de infraestructura;
* no incluir referencias a instancias;
* no incluir secretos;
* no incluir rutas absolutas de máquina;
* no incluir timestamps implícitos.

## Procedencia

Debe indicar de dónde provienen las observaciones:

```text
IN_MEMORY_REPOSITORY
PROVIDED_COLLECTION
```

o una representación equivalente.

No inventar fuentes futuras.

---

# 9. `DatasetAssemblyOptions`

Implementar opciones explícitas de construcción.

Ejemplo conceptual:

```javascript
{
  includeCalibrationStrategies,
  excludeCalibrationStrategies,
  includeTargetTypes,
  predictionCreatedFrom,
  predictionCreatedTo,
  outcomeRecordedFrom,
  outcomeRecordedTo,
  requireCalibration,
  requireModelIdentity,
  unsupportedSchemaPolicy,
  duplicatePolicy,
  invalidObservationPolicy
}
```

No implementar opciones innecesarias.

## Reglas

Las opciones deben:

* validarse;
* normalizarse;
* ser inmutables;
* estar documentadas;
* formar parte del manifiesto;
* no depender de defaults ocultos;
* producir resultados deterministas.

## Defaults recomendados

Cuando no se proporcionen filtros:

```text
incluir todas las observaciones válidas;
rechazar esquemas incompatibles;
rechazar duplicados lógicos;
rechazar observaciones inválidas;
ordenar canónicamente.
```

---

# 10. Selección de observaciones

El builder debe poder seleccionar observaciones mediante criterios explícitos.

Como mínimo, evalúa soporte para:

* rango temporal de predicción;
* rango temporal de outcome;
* estrategia de calibración;
* presencia o ausencia de calibración;
* tipo de target;
* modelId;
* modelHash.

No es obligatorio implementar todos si el proyecto todavía no los necesita.

Prioriza:

1. rango temporal;
2. target type;
3. calibration strategy;
4. calibración presente/ausente.

## Política temporal

Debe ser inequívoca.

Para rangos:

```text
from inclusivo
to inclusivo
```

o:

```text
from inclusivo
to exclusivo
```

Selecciona una política, documenta y prueba.

No mezclar políticas entre prediction y outcome.

---

# 11. Reporte de exclusiones

Una observación excluida por filtro no debe desaparecer silenciosamente.

El resultado de ensamblaje debe poder informar:

```text
includedCount
excludedCount
exclusionsByReason
```

Ejemplo:

```javascript
{
  FILTERED_BY_DATE: 12,
  FILTERED_BY_TARGET_TYPE: 3,
  FILTERED_BY_STRATEGY: 8
}
```

Las exclusiones por filtro válido no son errores.

Las exclusiones por observación inválida sí deben seguir una política explícita.

## Políticas posibles

```text
REJECT_DATASET
EXCLUDE_AND_REPORT
```

## Recomendación

Para integridad científica:

```text
REJECT_DATASET
```

como default ante observaciones inválidas.

`EXCLUDE_AND_REPORT` solo debe existir si se justifica y se registra claramente en el manifiesto.

---

# 12. Validación homogénea de esquemas

Todas las observaciones del dataset deben utilizar una versión compatible.

Como mínimo:

```text
observation.schemaVersion
```

debe ser igual a la versión soportada.

No mezclar silenciosamente:

```text
schemaVersion "1"
schemaVersion "2"
```

## Política

Por defecto:

```text
unsupported schema → error
```

No migrar observaciones automáticamente en esta fase.

No inventar migradores.

Error sugerido:

```text
UnsupportedObservationSchemaError
```

Debe incluir:

* versión recibida;
* versión esperada;
* observationId;
* código estable.

---

# 13. Deduplicación global

El dataset debe impedir duplicados.

Debe detectar, como mínimo:

## Duplicado por `observationId`

Mismo ID y mismo contenido:

* puede aceptarse como idempotente;
* o puede rechazarse;
* documentar decisión.

Mismo ID y contenido diferente:

* siempre rechazar.

## Duplicado lógico

Misma pareja:

```text
predictionId + outcomeId
```

Debe considerarse una única observación lógica.

Dos IDs diferentes para la misma pareja deben rechazarse.

## Duplicado por predicción

La Fase 2.3.2 estableció una observación por predicción.

Verifica si el contrato real exige:

```text
predictionId único en el dataset
```

Si sí:

* rechazar múltiples observaciones para una misma predicción.

## Error sugerido

```text
DuplicateDatasetObservationError
```

Debe indicar:

* tipo de duplicado;
* IDs implicados;
* clave lógica;
* código estable.

---

# 14. Orden canónico

El dataset debe ordenar observaciones de forma determinista.

Orden recomendado:

```text
predictionCreatedAt ascendente
spinId ascendente
predictionId ascendente
outcomeId ascendente
observationId ascendente
```

Debes revisar si el proyecto ya dispone de un orden oficial.

## Reglas

* no depender del orden de entrada;
* no depender del orden de `Map`;
* no depender del repositorio;
* no usar `localeCompare` sin política estable;
* no mutar el array original;
* documentar desempates;
* probar entradas en orden inverso y aleatorio.

La misma colección debe producir exactamente el mismo orden.

---

# 15. Inmutabilidad del snapshot

El dataset debe ser un snapshot.

Después de construirlo:

* modificar el array original no debe cambiar el dataset;
* modificar una observación original no debe cambiar el dataset;
* intentar modificar `dataset.observations` no debe cambiarlo;
* intentar modificar `manifest` no debe cambiarlo;
* intentar modificar `statistics` no debe cambiarlo;
* intentar modificar metadata no debe cambiarlo.

Reutiliza las utilidades existentes:

* `deepFreeze`;
* `normaliseMetadata`.

No crear otra implementación.

---

# 16. `DatasetBuilder`

Implementar un servicio puro o de aplicación.

Firma conceptual:

```javascript
buildDataset({
  datasetId,
  observations,
  createdAt,
  options,
  metadata
})
```

Debe:

1. validar input;
2. validar ID;
3. validar timestamp;
4. validar opciones;
5. copiar defensivamente;
6. validar observaciones;
7. validar esquema;
8. aplicar filtros;
9. registrar exclusiones;
10. detectar duplicados;
11. ordenar canónicamente;
12. calcular estadísticas;
13. construir manifiesto;
14. crear snapshot;
15. devolver dataset inmutable.

## Determinismo

El builder no debe:

* leer reloj global;
* generar IDs internos;
* usar aleatoriedad;
* depender de variables globales;
* mutar repositorios;
* persistir;
* entrenar;
* emitir eventos.

---

# 17. Construcción desde repositorio

Implementar un caso de uso explícito:

```text
BuildHistoricalDatasetUseCase
```

Entrada conceptual:

```javascript
{
  datasetId,
  createdAt,
  options,
  metadata
}
```

Dependencias:

```text
CalibrationObservationRepository
DatasetBuilder
```

## Comportamiento

Debe:

1. consultar observaciones;
2. no modificar repositorio;
3. construir dataset;
4. devolver snapshot;
5. no persistirlo automáticamente.

Si el repositorio no dispone de:

```text
findAll
```

evalúa añadir un método mínimo y coherente.

No romper contratos sin revisar consumidores.

## Dataset vacío

Define política explícita.

Opciones:

```text
permitir dataset vacío
```

o:

```text
rechazar dataset vacío
```

## Recomendación

Rechazar por defecto un dataset vacío para uso científico, con opción explícita de permitirlo solo para tests o flujos preparatorios.

Error sugerido:

```text
EmptyHistoricalDatasetError
```

---

# 18. Estadísticas descriptivas mínimas

Implementar `DatasetStatistics`.

Debe calcular únicamente métricas descriptivas seguras.

Como mínimo:

```text
observationCount
positiveOutcomeCount
negativeOutcomeCount
positiveRate
rawScore:
  min
  max
  mean
effectiveProbability:
  min
  max
  mean
calibratedCount
uncalibratedCount
targetTypeCounts
calibrationStrategyCounts
spinCount
predictionCount
```

No implementar todavía:

* Brier Score;
* Log Loss;
* ECE;
* MCE;
* reliability diagrams;
* bootstrap;
* confianza estadística;
* model ranking.

Esas métricas pertenecen a fases posteriores de evaluación.

## Reglas numéricas

* evitar división por cero;
* usar números finitos;
* no redondear internamente;
* no perder precisión arbitrariamente;
* documentar dataset vacío;
* conservar valores exactos cuando sea posible.

---

# 19. Periodo cubierto

El dataset debe poder describir el periodo temporal real de sus observaciones.

Ejemplo:

```javascript
period: {
  predictionCreatedFrom,
  predictionCreatedTo,
  outcomeRecordedFrom,
  outcomeRecordedTo
}
```

Debe derivarse del contenido incluido, no de los filtros solicitados.

Distinguir:

```text
requestedRange
```

de:

```text
actualCoveredRange
```

Los filtros pertenecen al manifiesto.

El periodo real pertenece al dataset o estadísticas.

---

# 20. Separación por estrategia

No dividir físicamente el dataset todavía, salvo que el proyecto lo exija.

El dataset puede contener observaciones:

* sin calibración;
* con IdentityCalibration;
* con otras estrategias futuras.

Debe conservar:

```text
calibrationStrategyCounts
```

No mezclar ni sobrescribir:

```text
rawConsensusScore
calibration.probability
```

No transformar todas las observaciones a una única probabilidad.

---

# 21. Probabilidad efectiva

Puede reutilizarse:

```text
getEffectiveProbability
```

para estadísticas descriptivas.

Debe mantenerse la semántica:

```text
si calibration existe:
    effectiveProbability = calibration.probability
si no:
    effectiveProbability = rawConsensusScore
```

No eliminar los valores originales.

No añadir un campo persistido redundante en cada observación.

---

# 22. Procedencia y trazabilidad

El dataset debe permitir rastrear todas sus observaciones.

Como mínimo, mantener:

* observationId;
* predictionId;
* outcomeId;
* spinId.

El manifiesto debe indicar:

* número de observaciones de entrada;
* número de observaciones incluidas;
* número excluido;
* filtros;
* orden;
* política de duplicados;
* política de esquemas;
* política de invalidación.

No duplicar metadata arbitraria del repositorio.

No incluir referencias vivas a objetos externos.

---

# 23. Hashing y serialización canónica

Primero inspecciona si el proyecto ya posee:

* canonical serializer;
* stable stringify;
* SHA-256;
* dataset hash;
* manifest hash.

## Si existe infraestructura reutilizable y estable

Puedes incorporar:

```text
contentHash
manifestHash
```

siempre que:

* la serialización sea canónica;
* el hash sea determinista;
* no incluya campos volátiles;
* la decisión esté probada;
* no duplique infraestructura.

## Si no existe infraestructura adecuada

No implementes hashing improvisado.

Deja el dataset preparado y documenta:

```text
hashing postergado a Fase 2.3.4
```

No usar `JSON.stringify` simple como garantía de identidad científica sin revisar orden de claves y normalización.

---

# 24. Igualdad lógica de datasets

Implementa o evalúa una utilidad como:

```text
isSameDatasetContent
```

o:

```text
compareDatasetContent
```

solo si es necesaria para pruebas o idempotencia.

La igualdad de contenido no debe depender de:

* `createdAt`;
* datasetId;
* metadata operativa;

si el objetivo es comparar contenido científico.

Distinguir:

```text
same dataset identity
```

de:

```text
same scientific content
```

Documentar la diferencia.

---

# 25. Errores de dominio

Reutiliza `EvidenceError` o crea una jerarquía específica de dataset si el proyecto lo justifica.

Errores posibles:

```text
DatasetError
InvalidDatasetIdError
InvalidDatasetOptionsError
InvalidDatasetObservationError
UnsupportedObservationSchemaError
DuplicateDatasetObservationError
EmptyHistoricalDatasetError
DatasetAssemblyError
InvalidDatasetTimestampError
```

No es obligatorio usar exactamente esos nombres.

Cada error debe tener:

* clase específica;
* código estable;
* mensaje determinista;
* contexto mínimo;
* pruebas;
* herencia coherente.

No usar únicamente errores genéricos.

---

# 26. Puerto de dataset

Evalúa crear:

```text
HistoricalDatasetRepository
```

pero no implementes persistencia durable.

## Recomendación

En esta fase, el builder y el caso de uso pueden devolver el dataset sin almacenarlo.

Solo crea un puerto si es necesario para:

* idempotencia;
* tests;
* contratos futuros;
* separación arquitectónica clara.

No crear un repositorio en memoria por simetría si no aporta valor.

Evita sobrearquitectura.

---

# 27. Atomicidad

La construcción del dataset debe ser all-or-nothing.

No debe devolver:

* dataset parcial;
* estadísticas parciales;
* manifiesto parcial;
* observaciones silenciosamente descartadas, salvo política explícita.

Secuencia:

```text
load
validate
filter
report exclusions
deduplicate
sort
calculate
build
freeze
return
```

Si ocurre un error antes de finalizar:

```text
no dataset
```

---

# 28. Pruebas obligatorias

Mantener los 767 tests existentes y agregar pruebas nuevas.

## 28.1 Dataset válido

Probar:

* una observación;
* varias observaciones;
* calibradas;
* no calibradas;
* aciertos;
* fallos;
* `0`;
* `00`;
* múltiples spins;
* múltiples estrategias.

## 28.2 Orden canónico

Probar:

* entrada ordenada;
* entrada inversa;
* entrada aleatoria;
* timestamps iguales;
* desempate por spinId;
* desempate por predictionId;
* desempate por outcomeId;
* desempate por observationId;
* resultado idéntico.

## 28.3 Inmutabilidad

Probar:

* mutación del array de entrada;
* mutación posterior de observaciones;
* mutación del dataset;
* mutación de `observations`;
* mutación de `manifest`;
* mutación de `statistics`;
* mutación de metadata;
* arrays devueltos.

## 28.4 Esquemas

Probar:

* versión soportada;
* versión desconocida;
* mezcla de versiones;
* schemaVersion faltante;
* error con observationId correcto.

## 28.5 Duplicados

Probar:

* mismo observationId, mismo contenido;
* mismo observationId, distinto contenido;
* distinta ID, misma pareja prediction–outcome;
* misma prediction repetida;
* duplicado entre entradas no adyacentes;
* duplicados después de aplicar filtros.

## 28.6 Filtros temporales

Probar:

* límite inferior;
* límite superior;
* igualdad;
* fuera de rango;
* zona horaria equivalente;
* timestamp inválido;
* filtro por prediction time;
* filtro por outcome time.

## 28.7 Filtros de target

Probar:

* NUMBER incluido;
* target no incluido;
* tipo desconocido en opción;
* lista vacía;
* opciones duplicadas;
* opciones mutables.

## 28.8 Filtros de calibración

Probar:

* requireCalibration true;
* requireCalibration false;
* estrategia incluida;
* estrategia excluida;
* sin calibración;
* modelId;
* modelHash, si se implementa.

## 28.9 Exclusiones

Probar:

* contador total;
* conteo por razón;
* observaciones incluidas;
* observaciones excluidas;
* filtros combinados;
* ninguna exclusión;
* todas excluidas.

## 28.10 Dataset vacío

Probar:

* input vacío;
* todos filtrados;
* política default;
* opción explícita para permitir vacío, si existe;
* estadísticas del vacío, si se permite.

## 28.11 Estadísticas

Probar:

* observationCount;
* positivos;
* negativos;
* positiveRate;
* rawScore min/max/mean;
* effectiveProbability min/max/mean;
* calibratedCount;
* uncalibratedCount;
* target counts;
* strategy counts;
* spinCount;
* predictionCount;
* precisión numérica;
* sin redondeo arbitrario.

## 28.12 Periodo cubierto

Probar:

* una observación;
* varias;
* timestamps iguales;
* rango real;
* diferencia entre filtro solicitado y periodo cubierto.

## 28.13 Manifiesto

Probar:

* datasetId;
* versiones;
* filtros;
* orden;
* políticas;
* conteos;
* metadata;
* inmutabilidad;
* ausencia de rutas absolutas;
* ausencia de objetos vivos.

## 28.14 Builder

Probar:

* determinismo;
* no mutación;
* no side effects;
* no persistencia;
* no reloj global;
* no IDs implícitos;
* error all-or-nothing.

## 28.15 Caso de uso

Probar:

* lectura desde repo;
* repo vacío;
* opciones;
* dataset resultante;
* repo no mutado;
* ejecución repetida;
* orden independiente del repo.

## 28.16 Hashing, si se implementa

Probar:

* mismo contenido → mismo hash;
* distinto orden de entrada → mismo hash;
* distinto contenido → distinto hash;
* createdAt operativo no afecta hash científico, si esa es la política;
* metadata relevante sí afecta cuando corresponde;
* serialización canónica.

---

# 29. Pruebas de regresión

Ejecutar toda la suite.

La fase no puede romper:

* 767 tests existentes;
* `CalibrationObservation`;
* `ObservationBuilder`;
* `BuildObservationsBySpinUseCase`;
* repositorio de observaciones;
* mapper de consenso;
* validación temporal;
* benchmark;
* bootstrap;
* temporal split;
* hashing existente;
* serialización canónica;
* build;
* lint;
* arquitectura;
* UI;
* módulos legacy aislados.

Está prohibido:

* `.skip`;
* `.only`;
* comentar pruebas;
* eliminar assertions;
* modificar expectativas científicas sin evidencia;
* ocultar errores;
* reducir cobertura deliberadamente.

---

# 30. Validaciones técnicas

Inspecciona `package.json` y ejecuta comandos reales.

Como mínimo, equivalentes disponibles a:

```bash
npm test
npm run lint
npm run build
```

También ejecutar cuando existan:

* `npm run check:architecture`
* anti-legacy;
* typecheck;
* format check;
* dependency checks;
* contract tests;
* benchmark smoke tests;
* reproducibility tests.

Registrar:

* comando;
* resultado;
* duración;
* tests;
* warnings;
* errores.

No declarar PASS si no se ejecutó una validación requerida.

---

# 31. Disciplina de dependencias

Preferencia:

```text
0 dependencias nuevas
```

No instalar:

* librerías de schemas;
* dataframe libraries;
* Arrow;
* Parquet;
* SQLite;
* DuckDB;
* ORM;
* date libraries;
* UUID packages;
* hashing packages si Node estándar es suficiente;
* serializadores externos.

Reutilizar JavaScript estándar y utilidades existentes.

Cualquier dependencia nueva requiere justificación explícita.

---

# 32. Estructura sugerida

Adapta la estructura real.

Posibles archivos:

```text
src/historical-evidence/
├── domain/
│   ├── HistoricalCalibrationDataset.js
│   ├── DatasetManifest.js
│   ├── DatasetStatistics.js
│   ├── DatasetAssemblyOptions.js
│   └── errors.js
│
├── application/
│   ├── DatasetBuilder.js
│   └── BuildHistoricalDatasetUseCase.js
│
└── index.js
```

Posibles tests:

```text
tests/historical-evidence/
├── HistoricalCalibrationDataset.test.js
├── DatasetBuilder.test.js
├── DatasetStatistics.test.js
└── BuildHistoricalDatasetUseCase.test.js
```

La estructura es conceptual.

No crear archivos innecesarios.

No ubicar reglas científicas en infraestructura.

No mezclar builder con persistencia.

---

# 33. Integración permitida

Permitido:

* reutilizar observaciones existentes;
* reutilizar `deepFreeze`;
* reutilizar metadata segura;
* reutilizar `getEffectiveProbability`;
* reutilizar serialización canónica;
* reutilizar SHA-256 si ya existe;
* agregar `findAll` al repositorio si es necesario;
* agregar exports públicos;
* crear tests de integración interna;
* construir datasets en memoria.

No permitido:

* exportar archivos;
* guardar datasets automáticamente;
* modificar producción;
* activar captura;
* entrenar;
* promover;
* modificar calibradores;
* modificar consenso.

---

# 34. Decisiones arquitectónicas obligatorias

El informe debe responder:

1. ¿Qué representa exactamente `HistoricalCalibrationDataset`?
2. ¿Cuál es su identidad?
3. ¿Qué diferencia existe entre datasetId y contenido científico?
4. ¿Cuál es la versión de esquema?
5. ¿Cómo se valida la versión de observación?
6. ¿Cuál es el orden canónico?
7. ¿Qué define un duplicado?
8. ¿Qué ocurre con observaciones inválidas?
9. ¿Qué ocurre con observaciones filtradas?
10. ¿Se permite dataset vacío?
11. ¿Qué filtros se implementaron?
12. ¿Cómo se registra la procedencia?
13. ¿Qué estadísticas se calculan?
14. ¿Cómo se determina el periodo real?
15. ¿Cómo se garantiza inmutabilidad?
16. ¿Cómo se garantiza determinismo?
17. ¿Se implementó hashing?
18. ¿Se reutilizó infraestructura existente?
19. ¿Se creó repositorio de dataset?
20. ¿Qué componentes productivos siguen sin integración?

---

# 35. Informe obligatorio

Crear:

```text
reports/Fase2.3.3_historical_dataset_assembly_reporte.md
```

Adapta el nombre a las convenciones reales.

Debe incluir:

## Estado

```text
PASS
PASS_WITH_OBSERVATIONS
BLOCKED
```

## Resumen ejecutivo

* objetivo;
* implementación;
* resultado;
* tests;
* validaciones;
* ausencia de integración productiva.

## Arquitectura encontrada

* observaciones;
* repositorios;
* hashing;
* serialización;
* benchmark;
* datasets existentes.

## Decisiones

* contrato del dataset;
* identidad;
* schemaVersion;
* manifiesto;
* opciones;
* filtros;
* exclusiones;
* esquemas;
* duplicados;
* orden;
* estadísticas;
* periodo;
* hashing;
* atomicidad;
* dataset vacío.

## Archivos creados

| Archivo | Propósito | Capa |
| ------- | --------- | ---- |

## Archivos modificados

| Archivo | Cambio | Justificación |
| ------- | ------ | ------------- |

## Contratos públicos

Documentar:

* `HistoricalCalibrationDataset`;
* `DatasetBuilder`;
* `DatasetAssemblyOptions`;
* `DatasetManifest`;
* `DatasetStatistics`;
* `BuildHistoricalDatasetUseCase`;
* errores;
* cambios al repositorio.

## Pruebas

* baseline: 767;
* nuevas;
* total;
* resultado;
* archivos;
* casos límite.

## Validaciones

* tests;
* lint;
* build;
* arquitectura;
* anti-legacy;
* otras.

## Dependencias

* nuevas;
* justificación;
* preferiblemente ninguna.

## Cambios incompatibles

* exports;
* firmas;
* repositorios;
* wrappers;
* consumidores.

## Riesgos pendientes

Como mínimo:

* no existe persistencia duradera;
* no existen exportadores;
* no existe versionado persistido;
* no existe firma criptográfica si se postergó;
* no existe captura automática;
* no existe dataset real suficiente;
* no existe temporal split aplicado al dataset;
* no existe model selection;
* PromotionPolicy continúa bloqueada.

## Próxima fase

Recomendar:

```text
Fase 2.3.4 — Dataset Versioning, Canonical Serialization and Integrity Hashing
```

Si hashing ya se implementó completamente en 2.3.3, recomendar alternativamente:

```text
Fase 2.3.4 — Dataset Persistence and Export Adapters
```

No implementar la siguiente fase.

---

# 36. Criterios de aceptación

La fase se aprueba solamente si:

## Dataset

* existe `HistoricalCalibrationDataset`;
* es profundamente inmutable;
* es serializable;
* tiene datasetId explícito;
* tiene schemaVersion;
* conserva observationSchemaVersion;
* contiene manifiesto;
* contiene estadísticas;
* contiene observaciones ordenadas.

## Integridad

* solo contiene observaciones válidas;
* no mezcla esquemas incompatibles;
* detecta duplicados;
* no sobrescribe;
* no muta inputs;
* no depende del orden de entrada;
* no produce resultados parciales.

## Filtros

* son explícitos;
* están validados;
* están registrados en manifiesto;
* producen exclusiones trazables;
* no descartan silenciosamente.

## Orden

* es canónico;
* está documentado;
* tiene desempates;
* es reproducible;
* se prueba con entrada desordenada.

## Estadísticas

* son correctas;
* no redondean arbitrariamente;
* no entrenan;
* no calculan todavía métricas avanzadas;
* distinguen calibradas y no calibradas.

## Procedencia

* identifica fuente;
* registra conteos;
* registra políticas;
* registra filtros;
* no incluye referencias vivas;
* no incluye rutas locales sensibles.

## Builder

* es determinista;
* no tiene side effects;
* no persiste;
* no usa reloj global;
* no usa aleatoriedad;
* no genera IDs implícitos.

## Calidad

* todos los tests pasan;
* no hay regresiones;
* lint aprobado;
* build aprobado;
* arquitectura aprobada;
* sin tests omitidos;
* sin dependencias injustificadas.

## Ciencia

* no se entrena;
* no se seleccionan modelos;
* no se promueven estrategias;
* no se modifica IdentityCalibration;
* no se usa evidencia sintética productiva;
* no se activa captura automática.

## Documentación

* informe creado;
* decisiones registradas;
* archivos inventariados;
* riesgos documentados;
* siguiente fase delimitada.

---

# 37. Fuera de alcance

No implementar:

* CSV exporter;
* JSONL exporter;
* Parquet exporter;
* Arrow exporter;
* SQLite;
* DuckDB;
* PostgreSQL;
* almacenamiento en filesystem;
* subida a nube;
* compresión;
* cifrado;
* firma digital;
* temporal train/validation/test split;
* bootstrap;
* métricas avanzadas;
* benchmark real;
* entrenamiento;
* model selection;
* PromotionPolicy;
* UI;
* dashboard;
* captura automática;
* Motor de Amplitud de Señal.

---

# 38. Secuencia de ejecución

## Paso 1 — Auditoría

Inspeccionar:

* reportes;
* observaciones;
* repositorios;
* contratos científicos;
* hashing;
* serialización;
* datasets previos;
* tests;
* exports.

## Paso 2 — Diseño

Definir:

* dataset;
* ID;
* esquema;
* manifiesto;
* opciones;
* filtros;
* duplicados;
* orden;
* estadísticas;
* periodo;
* hashing;
* errores.

## Paso 3 — Dominio

Implementar:

1. dataset;
2. manifiesto;
3. opciones;
4. estadísticas;
5. errores.

## Paso 4 — Aplicación

Implementar:

1. builder;
2. caso de uso;
3. selección;
4. exclusiones;
5. orden;
6. atomicidad.

## Paso 5 — Repositorio

Añadir únicamente operaciones mínimas necesarias.

## Paso 6 — Tests focalizados

Ejecutar:

* dataset;
* builder;
* filtros;
* duplicados;
* estadísticas;
* caso de uso;
* hashing, si aplica.

## Paso 7 — Suite completa

Ejecutar todos los tests.

## Paso 8 — Auditoría final

Confirmar:

* no side effects;
* no persistencia;
* no entrenamiento;
* no promoción;
* no dependencia nueva;
* no mutación;
* no orden accidental;
* no duplicados;
* no datasets parciales.

## Paso 9 — Informe

Generar reporte verificable.

---

# 39. Reglas de trabajo

* No reformatear archivos ajenos.
* No hacer refactors amplios.
* No modificar algoritmos estadísticos.
* No modificar producción.
* No duplicar `deepFreeze`.
* No duplicar metadata normalizer.
* No duplicar canonical serializer.
* No duplicar SHA-256.
* No usar `JSON.stringify` ingenuo como identidad científica.
* No usar `Math.random()`.
* No usar `Date.now()` interno.
* No usar orden incidental.
* No silenciar exclusiones.
* No aceptar esquemas incompatibles.
* No permitir duplicados.
* No producir datasets parciales.
* No entrenar.
* No promover.
* No usar `.skip`.
* No usar `.only`.
* No instalar dependencias sin justificación.
* No declarar PASS sin ejecutar validaciones.

---

# 40. Estado final esperado

```text
CalibrationObservationRepository
              │
              ▼
CalibrationObservation[]
              │
              ▼
DatasetBuilder
├── validate schemas
├── apply filters
├── report exclusions
├── detect duplicates
├── canonical sort
├── calculate statistics
├── build manifest
└── deep freeze
              │
              ▼
HistoricalCalibrationDataset
```

El dataset final debe incluir:

```text
HistoricalCalibrationDataset
├── datasetId
├── schemaVersion
├── observationSchemaVersion
├── createdAt
├── period
├── manifest
├── statistics
└── observations[]
```

Todavía no debe existir:

```text
persistencia durable
exportadores
entrenamiento
model selection
promoción
captura automática
```

---

# 41. Formato de respuesta final del agente

Entregar:

```text
FASE 2.3.3 — RESULTADO

Estado:
PASS | PASS_WITH_OBSERVATIONS | BLOCKED

Arquitectura encontrada:
- ...

HistoricalCalibrationDataset:
- ...

DatasetBuilder:
- ...

DatasetAssemblyOptions:
- ...

DatasetManifest:
- ...

DatasetStatistics:
- ...

Filtros:
- ...

Exclusiones:
- ...

Esquemas:
- ...

Duplicados:
- ...

Orden canónico:
- ...

Periodo cubierto:
- ...

Hashing:
- ...

Construcción desde repositorio:
- ...

Atomicidad:
- ...

Inmutabilidad:
- ...

Pruebas:
- Baseline:
- Nuevas:
- Totales:
- Resultado:

Validaciones:
- Test:
- Lint:
- Build:
- Arquitectura:
- Anti-legacy:

Archivos creados:
- ...

Archivos modificados:
- ...

Dependencias nuevas:
- ...

Cambios incompatibles:
- ...

Riesgos pendientes:
- ...

Informe:
- ruta exacta

Siguiente fase:
Fase 2.3.4 — Dataset Versioning, Canonical Serialization and Integrity Hashing
```

No inventar cifras.

No declarar comandos que no fueron ejecutados.

---

# 42. Instrucción final

Comienza inspeccionando el repositorio, los informes de las fases anteriores, `CalibrationObservation`, sus repositorios y las utilidades existentes de serialización e integridad.

Luego implementa únicamente:

```text
FASE 2.3.3
Historical Dataset Assembly
```

Prioridad:

```text
INTEGRIDAD CIENTÍFICA
>
REPRODUCIBILIDAD
>
TRAZABILIDAD
>
DETERMINISMO
>
INMUTABILIDAD
>
HOMOGENEIDAD DE ESQUEMA
>
DEDUPLICACIÓN
>
COMPATIBILIDAD
>
EXTENSIBILIDAD
>
VELOCIDAD
```

La fase debe finalizar con un dataset histórico lógico, inmutable, reproducible, auditable y preparado para versionado, sin exportar, persistir, entrenar ni promover modelos.
