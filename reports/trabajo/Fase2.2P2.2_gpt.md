# PROMPT MAESTRO — FASE 2.2.2

## Validación Empírica Real, Semántica del Target y Promoción Controlada de Candidatos

**Proyecto:** Roulette Tracker
**Nombre anterior:** ORION / Orion_v2
**Subsistema:** MotorConsensoCalibrado
**Componente:** ProbabilityCalibrator
**Entorno:** Linux Ubuntu
**Agente ejecutor:** Hermes con DeepSeek CLI
**Tipo de trabajo:** auditoría científica correctiva, validación empírica y endurecimiento contractual
**Fecha de referencia:** 2026-07-30

---

# 0. MISIÓN

Actúa como:

* arquitecto principal de software;
* científico de datos senior;
* especialista en calibración probabilística;
* auditor estadístico;
* especialista en validación temporal;
* especialista en prevención de data leakage;
* ingeniero de reproducibilidad;
* ingeniero de calidad;
* responsable de gobernanza de modelos.

Debes completar la **Fase 2.2.2** del proyecto Roulette Tracker.

Esta fase continúa directamente desde:

* Fase 2.2 Parte I — Arquitectura del ProbabilityCalibrator;
* Fase 2.2 Parte II — Modelos, entrenamiento y métricas;
* Fase 2.2 Parte 2.1 — Auditoría y benchmark infrastructure.

No debes construir otra plataforma paralela.

Debes inspeccionar, corregir y completar la infraestructura existente.

El objetivo central es determinar si los modelos de calibración implementados pueden ser evaluados científicamente sobre datos históricos reales y si alguno puede ser declarado candidato de integración.

---

# 1. ESTADO ACTUAL DECLARADO

El repositorio declara disponer de:

## 1.1 Estrategias

* `IdentityCalibration`
* `HistogramCalibration`
* `IsotonicCalibration`
* `PlattScaling`
* `BetaCalibration`

## 1.2 Entrenamiento e inferencia

* `CalibrationTrainer`
* `CalibrationModel`
* `CalibrationModelFactory`
* `ProbabilityCalibrator`
* `CalibrationContext`
* `CalibrationDataset`
* `CalibrationDatasetBuilder`
* `CalibrationDatasetValidator`

## 1.3 Evaluación

* Brier Score
* Log Loss
* ECE
* MCE
* Sharpness
* Resolution
* Uncertainty
* Accuracy
* `ReliabilityDiagram`
* `CrossValidator`
* `TrainTestSplit`
* `BootstrapSampler`

## 1.4 Benchmark

* `SeededRandom`
* `MetricDescriptor`
* `MetricRegistry`
* `CalibrationLeakageDetector`
* `SyntheticCalibrationDatasetFactory`
* `CalibrationExperiment`
* `CalibrationBenchmark`
* `BaselineComparator`
* `ModelLeaderboard`
* `PromotionPolicy`

## 1.5 Estado reportado

* 598 pruebas aprobadas;
* lint sin errores ni advertencias;
* build correcto;
* 50 archivos dentro de `src/calibration/`;
* un defecto corregido en Histogram para `score = 1.0`;
* benchmark sobre datasets sintéticos;
* comparación contra Identity;
* PRNG determinista;
* leaderboard y política de promoción.

Debes verificar todo directamente en el código.

No asumas que el informe anterior es suficiente.

---

# 2. PROBLEMAS ABIERTOS QUE ESTA FASE DEBE RESOLVER

La fase debe resolver, o declarar explícitamente no resolubles, los siguientes problemas:

1. ausencia de validación con datos históricos reales;
2. semántica incompleta de `rawConsensusScore`;
3. unidad de observación no formalizada;
4. posible existencia de varias filas por una misma tirada;
5. ausencia de `spinId`, `eventId` o equivalente;
6. riesgo de dividir observaciones relacionadas entre train y test;
7. split temporal insuficientemente estricto;
8. hash `djb2` donde se esperaba SHA-256;
9. falta de serialización canónica;
10. falta de intervalos bootstrap pareados;
11. falta de leaderboard cuantitativo documentado;
12. auditoría incompleta de BetaCalibration;
13. documentación incompleta de convergencia de Platt;
14. política de score compuesto potencialmente opaca;
15. falta de evidencia suficiente para cambiar el default;
16. ausencia de criterio científico final sobre promoción.

---

# 3. OBJETIVO GENERAL

Construir y ejecutar un proceso empírico que permita responder:

* ¿Qué representa exactamente cada `rawConsensusScore`?
* ¿Cuál es el evento observado que se intenta calibrar?
* ¿Cuál es la unidad independiente de evaluación?
* ¿Cada tirada produce una o múltiples observaciones?
* ¿Cómo se evita que una misma tirada aparezca en distintas particiones?
* ¿Los datos históricos son suficientes?
* ¿Las estrategias avanzadas superan a Identity fuera de muestra?
* ¿La mejora es estable?
* ¿La mejora tiene intervalo favorable?
* ¿Existe leakage?
* ¿Existe drift temporal?
* ¿Algún modelo cumple la política de promoción?
* ¿Identity debe conservar el default?

---

# 4. RESULTADO MÁXIMO PERMITIDO

Esta fase puede declarar:

```text
CANDIDATE_IDENTIFIED
```

No debe cambiar automáticamente la estrategia por defecto.

No debe activar un modelo avanzado en producción.

No debe conectar todavía el calibrador con decisiones de apuesta o recomendaciones.

La integración efectiva corresponde a una fase posterior.

---

# 5. REGLA DE CONSERVACIÓN

Hasta que exista evidencia suficiente:

```text
IdentityCalibration sigue siendo la estrategia por defecto.
```

La ausencia de un candidato válido debe considerarse un resultado científico aceptable.

No forzar una estrategia ganadora.

---

# 6. ORDEN OBLIGATORIO DE EJECUCIÓN

Ejecuta en este orden:

```text
1. Inspección del repositorio
2. Estado Git
3. Localización de datasets históricos
4. Formalización de la semántica del target
5. Formalización de la unidad de observación
6. Auditoría de identificadores de tirada/evento
7. Auditoría de BetaCalibration
8. Auditoría de PlattScaling
9. Migración de hashing
10. Serialización canónica
11. Dataset histórico versionado
12. Split temporal agrupado
13. Leakage detection por grupo
14. Benchmark real
15. Bootstrap pareado
16. Intervalos de confianza
17. Leaderboard cuantitativo
18. Aplicación de PromotionPolicy
19. Tests específicos
20. Suite completa
21. Lint
22. Build
23. Reportes
24. Veredicto
```

No comenzar creando archivos sin inspeccionar la implementación y los datos disponibles.

---

# 7. INSPECCIÓN INICIAL

Inspeccionar como mínimo:

```text
src/calibration/
tests/calibration/
reports/calibration/
src/
data/
datasets/
fixtures/
public/
package.json
.gitignore
README*
docs/
```

Buscar archivos que contengan:

```text
rawConsensusScore
calibratedProbability
observedOutcome
spinId
eventId
roundId
timestamp
wheelVersion
configurationVersion
sessionId
roulette
history
muestra
consensus
```

Determinar si existe un dataset histórico real.

No confundir:

* fixtures;
* mocks;
* datasets sintéticos;
* ejemplos;
* resultados reales.

---

# 8. ESTADO GIT

Ejecutar:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git log -1 --oneline
```

No ejecutar operaciones destructivas.

Prohibido:

```bash
git reset --hard
git clean -fd
git checkout -- .
git restore .
```

Si el repositorio está dirty:

* registrar los archivos;
* conservar los cambios;
* evitar sobrescribir trabajo del usuario;
* incluir `dirtyState` en el manifiesto.

---

# 9. SEMÁNTICA DEL TARGET

Crear un documento contractual que defina exactamente qué se calibra.

Nombre recomendado:

```text
CalibrationTargetContract
```

Debe responder:

```javascript
{
  targetId,
  targetVersion,
  scoreField,
  outcomeField,
  eventDefinition,
  positiveOutcomeDefinition,
  negativeOutcomeDefinition,
  observationUnit,
  groupingField,
  timeField,
  scoreRange,
  probabilitySemantics,
  normalizationSemantics,
  limitations
}
```

Debes determinar si `rawConsensusScore` representa:

* probabilidad de un número específico;
* score relativo;
* ranking;
* nivel de consenso;
* propensión;
* probabilidad de una selección;
* otra magnitud.

No asumir que estar en `[0,1]` lo convierte en probabilidad.

---

# 10. CRITERIO DE NO-GO SEMÁNTICO

Declarar:

```text
NO_GO_SEMANTIC
```

si no es posible definir claramente:

* el evento;
* el outcome;
* el significado del score;
* la unidad de observación.

No entrenar estrategias reales sobre un target ambiguo.

Puede mantenerse la infraestructura y emitir evidencia insuficiente.

---

# 11. UNIDAD DE OBSERVACIÓN

Formalizar si una observación representa:

* una tirada completa;
* un número candidato dentro de una tirada;
* una predicción concreta;
* una sesión;
* una combinación;
* una categoría.

Incluir:

```javascript
{
  observationId,
  eventId,
  spinId,
  sessionId,
  candidateId,
  predictionTimestamp,
  outcomeTimestamp
}
```

No exigir todos los campos si el dominio no los tiene, pero definir cuáles son obligatorios.

---

# 12. MÚLTIPLES FILAS POR TIRADA

En ruleta americana puede existir una predicción para cada uno de los 38 resultados:

```text
0
00
1..36
```

Si una tirada genera varias filas:

* todas deben compartir `spinId`;
* todas deben permanecer en la misma partición;
* no pueden repartirse entre training, validation y test;
* deben considerarse dependientes.

El split por filas queda prohibido en este caso.

---

# 13. IDENTIFICADOR DE TIRADA

Buscar un identificador real existente.

Prioridad:

```text
spinId
roundId
eventId
tiradaId
sequenceId
```

Si no existe, evaluar si puede construirse de manera segura a partir de:

* timestamp;
* sesión;
* índice secuencial;
* versión de rueda;
* lote de predicciones.

No construir un ID heurístico silenciosamente.

Si el identificador es inferido:

```javascript
{
  inferred: true,
  inferenceMethod,
  collisionRisk,
  limitations
}
```

Si el riesgo de colisión es alto, declarar evidencia insuficiente.

---

# 14. DATASET CONTRACT

Extender o crear el contrato de registro histórico.

Campos mínimos recomendados:

```javascript
{
  observationId,
  spinId,
  sessionId,
  rawConsensusScore,
  observedOutcome,
  candidate,
  timestamp,
  wheelVersion,
  configurationVersion,
  consensusVersion,
  source,
  metadata
}
```

Campos obligatorios mínimos para benchmark real:

```text
spinId
rawConsensusScore
observedOutcome
timestamp
```

Si la unidad de observación es distinta, documentar la adaptación.

---

# 15. OUTCOME

El outcome debe estar claramente definido.

Para calibración binaria:

```text
observedOutcome ∈ {0,1}
```

Ejemplo por número:

```text
1 si ese número salió
0 si ese número no salió
```

Pero no asumir que esa es la semántica real sin verificar el contrato.

Validar:

* tipo;
* rango;
* consistencia;
* correspondencia con candidato;
* correspondencia con tirada.

---

# 16. NORMALIZACIÓN ENTRE NÚMEROS

Determinar si las predicciones de una tirada:

* deben sumar 1;
* pueden sumar más de 1;
* son marginales independientes;
* son scores no normalizados.

No imponer normalización multinomial sin contrato.

Registrar por tirada:

```text
sumRawScores
sumCalibratedProbabilities
candidateCount
```

Solo como diagnóstico.

No modificar scores durante esta fase salvo que el contrato lo requiera explícitamente.

---

# 17. DATASET HISTÓRICO

Crear un pipeline de importación o adaptación, no una carga ad hoc.

Nombre recomendado:

```text
HistoricalCalibrationDatasetAdapter
```

Responsabilidades:

1. leer la fuente disponible;
2. mapear campos;
3. validar esquema;
4. conservar trazabilidad;
5. producir registros normalizados;
6. registrar descartes;
7. calcular hash;
8. no mutar la fuente.

No introducir dependencias pesadas innecesarias.

---

# 18. PRIVACIDAD Y DATOS SENSIBLES

No incluir datos personales innecesarios en:

* datasets derivados;
* logs;
* reportes;
* hashes descriptivos.

Si existen identificadores sensibles:

* pseudonimizar;
* conservar vínculo lógico solo cuando sea necesario;
* documentar transformación.

---

# 19. DATASET VERSION

Asignar una versión reproducible.

Ejemplo:

```text
roulette-historical-2026-07-v1
```

Debe depender de:

* fuente;
* política de limpieza;
* contrato;
* filtros;
* versión del adaptador.

No usar solamente la fecha actual.

---

# 20. DATASET HASH

Implementar SHA-256 sobre representación canónica.

El hash debe cubrir:

* registros usados;
* orden documentado;
* contrato de target;
* versión del adaptador;
* filtros aplicados.

No incluir campos volátiles como:

* fecha de ejecución;
* path absoluto;
* memoria;
* runId.

---

# 21. SERIALIZACIÓN CANÓNICA

Crear o reutilizar:

```text
canonicalStringify
```

Requisitos:

* ordenar claves de objetos;
* preservar orden de arrays;
* tratar strings, números, booleanos y null;
* rechazar funciones;
* rechazar símbolos;
* rechazar referencias circulares;
* rechazar `NaN`;
* rechazar `Infinity`;
* rechazar `-Infinity`;
* documentar tratamiento de `undefined`;
* producir siempre el mismo resultado lógico.

Tests obligatorios:

```text
objetos con distinto orden de claves → misma serialización
objetos lógicamente diferentes → serialización diferente
arrays con distinto orden → serialización diferente
```

---

# 22. MIGRACIÓN DE HASH DE MODELO

El informe anterior declara que `CalibrationModel` usa `djb2`.

Migrar a SHA-256 canónico.

El hash debe incluir como mínimo:

```javascript
{
  strategy,
  strategyVersion,
  modelVersion,
  datasetVersion,
  parameters,
  trainingConfiguration,
  targetContractVersion
}
```

No debe incluir:

```text
trainedAt
createdAt
runId
```

si el objetivo es identidad lógica reproducible.

---

# 23. COMPATIBILIDAD DEL HASH

Si existe información persistida o tests que esperan `djb2`:

* no romper silenciosamente;
* agregar `hashAlgorithm`;
* considerar `legacyHash`;
* documentar migración.

Ejemplo:

```javascript
{
  hash,
  hashAlgorithm: "sha256",
  legacyHash: null
}
```

No llamar criptográfico a `djb2`.

---

# 24. AUDITORÍA FORMAL DE BETA CALIBRATION

Inspeccionar la implementación real.

Documentar exactamente:

* fórmula de entrenamiento;
* fórmula de inferencia;
* parámetros aprendidos;
* función objetivo;
* optimizador;
* regularización;
* clipping;
* convergencia;
* tratamiento de extremos;
* tratamiento de una sola clase.

La Beta Calibration estándar suele expresarse mediante una transformación logística basada en:

```text
log(p)
log(1-p)
```

Debes determinar si la implementación actual corresponde formalmente a ese modelo o si solamente ajusta distribuciones Beta.

No validar el nombre únicamente porque use gamma o beta.

---

# 25. DECISIONES POSIBLES PARA BETA

Tras la auditoría, elegir y documentar una:

```text
BETA_STANDARD_VALID
BETA_EQUIVALENT_PARAMETERIZATION
BETA_EXPERIMENTAL
MISNAMED_DISTRIBUTION_MODEL
INVALID_IMPLEMENTATION
```

Si está mal nombrada:

* no ocultarlo;
* crear prueba;
* corregir o renombrar con compatibilidad;
* actualizar metadata;
* emitir ADR.

No realizar un reemplazo matemático grande sin pruebas.

---

# 26. AUDITORÍA FORMAL DE PLATT SCALING

El informe previo menciona descenso de gradiente y unas 1000 épocas.

Documentar:

```javascript
{
  formula,
  signConvention,
  loss,
  learningRate,
  maxIterations,
  tolerance,
  regularization,
  initialization,
  converged,
  iterations,
  finalLoss
}
```

Verificar:

* sigmoide estable;
* clipping;
* gradientes finitos;
* datasets constantes;
* outcomes de una sola clase;
* scores extremos;
* parada temprana;
* determinismo.

---

# 27. CONVERGENCIA DE PLATT

El modelo entrenado debe registrar:

```javascript
{
  convergenceStatus,
  iterations,
  finalLoss,
  initialLoss,
  tolerance,
  maxIterations,
  warnings
}
```

Estados:

```text
CONVERGED
MAX_ITERATIONS
DEGENERATE_DATASET
NUMERICAL_FAILURE
```

Una estrategia que no converge no puede ser promovida.

---

# 28. HISTOGRAM EDGE CASE

Revisar la corrección aplicada para `score = 1.0`.

Evitar una constante mágica como:

```text
0.999999
```

cuando sea posible.

Preferir una asignación explícita:

```text
score === 1 → último bucket
```

o una función central de índice.

Verificar:

* score 0;
* score 1;
* límites internos;
* precisión;
* bucket count variable.

No cambiar si la implementación actual ya es robusta, pero documentar y probar.

---

# 29. SPLIT TEMPORAL AGRUPADO

Crear:

```text
GroupedTemporalSplit
```

o nombre equivalente.

Debe separar por grupo, no por fila.

Entrada:

```javascript
{
  records,
  groupBy: "spinId",
  timeBy: "timestamp",
  trainRatio,
  validationRatio,
  testRatio,
  embargoSize,
  minimumGroupsPerSplit
}
```

Salida:

```javascript
{
  train,
  validation,
  test,
  trainGroupIds,
  validationGroupIds,
  testGroupIds,
  diagnostics,
  hashes
}
```

---

# 30. INVARIANTES DEL SPLIT

Debe garantizar:

```text
trainGroupIds ∩ validationGroupIds = ∅
trainGroupIds ∩ testGroupIds = ∅
validationGroupIds ∩ testGroupIds = ∅
```

También:

```text
max(train.timestamp)
≤
min(validation.timestamp)
```

y:

```text
max(validation.timestamp)
≤
min(test.timestamp)
```

Cuando timestamps iguales pertenezcan a grupos distintos, aplicar política documentada.

---

# 31. EMBARGO TEMPORAL

Preparar embargo configurable entre particiones.

Objetivo:

* reducir contaminación por ventanas cercanas;
* evitar features o agregados que usen información contigua.

El embargo puede ser:

* cantidad de tiradas;
* duración temporal;
* grupos completos.

Default conservador:

```text
0
```

si no existe evidencia de necesidad.

No activarlo arbitrariamente.

---

# 32. SPLIT HASH

Calcular SHA-256 canónico de:

* grupos train;
* grupos validation;
* grupos test;
* configuración del split.

Todas las estrategias deben usar los mismos hashes.

---

# 33. LEAKAGE DETECTOR POR GRUPO

Extender `CalibrationLeakageDetector`.

Checks mínimos:

1. grupo repetido entre particiones;
2. observación repetida;
3. timestamp fuera de orden;
4. evento repetido;
5. candidato repetido dentro de evento de forma inválida;
6. fit de transforms sobre dataset completo;
7. hiperparámetros elegidos usando test;
8. modelos reutilizados entre folds;
9. registros derivados del mismo evento en particiones distintas.

Salida:

```javascript
{
  status,
  groupLeakage,
  recordLeakage,
  temporalLeakage,
  transformLeakage,
  checks,
  evidence,
  warnings
}
```

---

# 34. ESTADOS DE LEAKAGE

Usar:

```text
PASS
FAIL
UNKNOWN
```

No usar `PASS` si faltan identificadores necesarios.

Ejemplo:

```text
Sin spinId → groupLeakage = UNKNOWN
```

Un estado `UNKNOWN` crítico impide promoción.

---

# 35. TRAIN / VALIDATION / TEST

Uso obligatorio:

```text
Training
→ ajuste de parámetros

Validation
→ hiperparámetros y selección preliminar

Test
→ evaluación final una sola vez
```

Prohibido:

* elegir número de buckets con test;
* elegir learning rate con test;
* elegir estrategia con test y luego reportar el mismo test como evaluación imparcial;
* cambiar policy después de ver resultados.

---

# 36. NESTED EVALUATION

Si se seleccionan hiperparámetros entre varias configuraciones, usar una estructura válida:

```text
Training interno
Validation interno
Test externo
```

No es obligatorio implementar nested cross-validation completa si el dataset es pequeño, pero debes evitar optimismo.

Documentar la metodología elegida.

---

# 37. BENCHMARK REAL

Extender `CalibrationBenchmark` para aceptar:

```javascript
{
  datasetType: "historical",
  targetContract,
  groupedSplit,
  strategies,
  hyperparameters,
  metricRegistry,
  bootstrapConfiguration,
  promotionPolicy,
  seed
}
```

No mezclar resultados sintéticos y reales en un mismo ranking sin etiqueta.

---

# 38. BASELINE

Ejecutar siempre:

```text
IdentityCalibration
```

con exactamente:

* mismo test;
* mismos grupos;
* mismas observaciones;
* mismas métricas;
* misma política de clipping;
* mismos buckets de evaluación.

---

# 39. ESTRATEGIAS CANDIDATAS

Evaluar:

* HistogramCalibration
* IsotonicCalibration
* PlattScaling
* BetaCalibration

Solo si superan validaciones estructurales.

Si Beta queda experimental o inválida:

* excluir de promoción;
* puede mantenerse en benchmark diagnóstico;
* marcar claramente su estado.

---

# 40. MÉTRICAS PRINCIPALES

Mantener:

```text
Brier Score
Log Loss
ECE
```

Secundarias:

```text
MCE
Sharpness
Resolution
Uncertainty
Accuracy
Training time
Inference time
Model size
```

No promover por Accuracy.

---

# 41. BUCKETS DE EVALUACIÓN

ECE, MCE y Reliability Diagram deben compartir una política explícita.

Ejemplo:

```javascript
{
  method: "equal-width",
  bucketCount: 10,
  includeRightEdgeInLastBucket: true,
  emptyBucketPolicy: "ignore"
}
```

Versionar la configuración.

No permitir que cada estrategia use buckets distintos para su evaluación final.

---

# 42. BOOTSTRAP PAREADO

Implementar:

```text
PairedBootstrapComparator
```

Muestrear por unidad independiente.

Si la unidad es la tirada:

```text
muestrear spinIds con reemplazo
```

No muestrear filas individuales cuando existen varias por tirada.

Por réplica:

1. seleccionar grupos;
2. incluir todas sus observaciones;
3. calcular métrica del baseline;
4. calcular métrica del candidato;
5. calcular diferencia pareada.

---

# 43. BOOTSTRAP CONFIGURATION

Campos mínimos:

```javascript
{
  seed,
  replicas,
  confidenceLevel,
  groupBy,
  minimumValidReplicas
}
```

Valores por defecto razonables:

```text
replicas: configurable
confidenceLevel: 0.95
```

No imponer un número universal sin documentarlo.

Para ejecución real, usar suficientes réplicas según rendimiento.

---

# 44. DIFERENCIA PAREADA

Convención:

Para métricas donde menor es mejor:

```text
improvement = baselineMetric - candidateMetric
```

Por tanto:

```text
improvement > 0
```

significa que el candidato mejora.

Reportar:

* media;
* mediana;
* percentil inferior;
* percentil superior;
* proporción positiva;
* réplicas válidas;
* réplicas inválidas.

---

# 45. INTERVALO DE CONFIANZA

Para cada métrica principal:

```javascript
{
  baseline,
  candidate,
  absoluteImprovement,
  relativeImprovement,
  confidenceInterval,
  bootstrapWinRate
}
```

No afirmar mejora robusta si el intervalo incluye cero, salvo política explícita distinta.

---

# 46. RESULTADOS POR TIRADA Y POR FILA

Si existen múltiples candidatos por tirada, reportar:

* métricas sobre todas las observaciones;
* incertidumbre agrupada por tirada;
* cantidad de tiradas;
* cantidad de filas;
* candidatos promedio por tirada.

No presentar el número de filas como si fuera tamaño muestral independiente.

---

# 47. CLASS BALANCE

Reportar por split:

```text
spinCount
observationCount
positiveCount
negativeCount
positiveRate
```

Si existe un outcome positivo por tirada entre 38 candidatos, documentar el fuerte desbalance.

No usar accuracy como señal principal.

---

# 48. SAMPLE SIZE EFFECTIVE

Reportar:

```text
rawObservationCount
independentGroupCount
effectiveEvaluationUnit
```

La política de promoción debe usar grupos independientes, no solo filas.

---

# 49. LEADERBOARD CUANTITATIVO

Generar tabla real:

| Rank | Estrategia | Brier | Δ Brier | IC 95% | LogLoss | Δ LogLoss | ECE | Δ ECE | Win Rate | Estado |
| ---: | ---------- | ----: | ------: | ------ | ------: | --------: | --: | ----: | -------: | ------ |

También incluir:

* datasetVersion;
* datasetHash;
* spinCount;
* observationCount;
* split hashes;
* seed;
* model hash;
* convergence;
* warnings.

---

# 50. SCORE COMPUESTO

No usar el score compuesto como criterio principal.

Puede mantenerse como vista secundaria.

La promoción debe basarse en reglas transparentes.

Si `ModelLeaderboard` normaliza métricas usando el conjunto de candidatos:

* documentar sensibilidad;
* impedir que sea único criterio;
* añadir ranking por métricas originales.

---

# 51. POLÍTICA DE PROMOCIÓN

Extender `PromotionPolicy`.

Criterios mínimos configurables:

```javascript
{
  requireRealDataset: true,
  requireTargetContract: true,
  requireGroupLeakagePass: true,
  requireTemporalLeakagePass: true,
  requireDeterminismPass: true,
  requireSha256ModelHash: true,
  requireSerializationPass: true,
  requireConvergence: true,
  minimumIndependentGroups,
  minimumValidBootstrapReplicas,
  minimumBrierWinRate,
  minimumLogLossWinRate,
  maximumAllowedEceDegradation,
  requireBrierConfidenceIntervalAboveZero,
  maximumFoldInstability
}
```

No definir umbrales como verdades universales.

Documentar los valores usados.

---

# 52. DECISIONES

Por estrategia:

```text
PROMOTE_AS_CANDIDATE
RETAIN_AS_EXPERIMENTAL
REJECT
INSUFFICIENT_EVIDENCE
INVALID_MODEL
```

Veredicto global:

```text
IDENTITY_RETAINS_DEFAULT
CANDIDATE_IDENTIFIED
NO_VALID_CANDIDATE
INVALID_EMPIRICAL_EVALUATION
```

---

# 53. COMPLEXITY RULE

Si dos modelos tienen rendimiento equivalente:

preferir:

1. Identity;
2. modelo más simple;
3. modelo más estable;
4. modelo más interpretable;
5. modelo con menor tamaño;
6. modelo con inferencia más rápida.

No premiar complejidad sin mejora robusta.

---

# 54. OVERFITTING

Comparar por estrategia:

```text
training metrics
validation metrics
test metrics
```

Generar indicadores:

* train mucho mejor que test;
* hiperparámetros extremos;
* histogram con buckets escasos;
* isotonic con demasiados escalones;
* Platt con coeficientes enormes;
* Beta con parámetros degenerados;
* alta variación temporal.

---

# 55. TEMPORAL STABILITY

Dividir test, cuando el tamaño lo permita, en segmentos temporales diagnósticos.

Por segmento:

* Brier;
* Log Loss;
* ECE;
* prevalence;
* score mean;
* observation count;
* spin count.

No usar estos segmentos para ajustar el modelo.

Solo evaluación.

---

# 56. DISTRIBUTION SHIFT

Comparar train vs validation vs test:

* media del score;
* varianza;
* cuantiles;
* prevalencia;
* histograma;
* cantidad de candidatos;
* versión de configuración;
* versión de rueda;
* sesiones.

Emitir:

```text
NO_EVIDENT_SHIFT
POSSIBLE_SHIFT
SIGNIFICANT_DIAGNOSTIC_SHIFT
UNKNOWN
```

No presentar diagnóstico como prueba causal.

---

# 57. DETERMINISMO

Ejecutar el benchmark real al menos dos veces con:

* mismo dataset;
* misma configuración;
* misma seed;
* mismo commit;
* mismos splits.

Deben coincidir:

* split hashes;
* model hashes;
* métricas, dentro de tolerancia;
* leaderboard;
* decisiones.

Los tiempos pueden variar.

---

# 58. SERIALIZACIÓN

Para cada modelo evaluado:

```text
fit
serialize
deserialize
infer
```

Las predicciones deben coincidir dentro de tolerancia.

Verificar hash antes y después.

---

# 59. REPOSITORY

Guardar en `CalibrationRepository` únicamente modelos válidos.

No persistencia física.

Evitar:

* sobrescritura silenciosa;
* modelos con hash inválido;
* modelos no convergentes elegibles;
* objetos mutables compartidos.

---

# 60. REPORTES OBLIGATORIOS

Generar:

```text
reports/calibration/PHASE_2_2_2_EMPIRICAL_VALIDATION.md
```

Además:

```text
reports/calibration/PHASE_2_2_2_BENCHMARK_RESULT.json
reports/calibration/PHASE_2_2_2_REPRODUCIBILITY.json
reports/calibration/PHASE_2_2_2_TARGET_CONTRACT.json
reports/calibration/PHASE_2_2_2_DATASET_REPORT.json
```

Si no existe dataset real suficiente:

* generar igualmente los informes;
* declarar `INSUFFICIENT_EVIDENCE`;
* no fabricar resultados.

---

# 61. CONTENIDO DEL INFORME PRINCIPAL

Debe incluir:

1. resumen ejecutivo;
2. estado inicial;
3. alcance;
4. repositorio inspeccionado;
5. estado Git;
6. datasets encontrados;
7. clasificación real/sintético;
8. semántica del target;
9. unidad de observación;
10. identificador de tirada;
11. contrato;
12. limpieza de datos;
13. registros descartados;
14. dataset version;
15. dataset hash;
16. split temporal agrupado;
17. split hashes;
18. leakage checks;
19. auditoría Beta;
20. auditoría Platt;
21. migración SHA-256;
22. benchmark;
23. baseline;
24. métricas;
25. bootstrap pareado;
26. intervalos;
27. leaderboard;
28. estabilidad temporal;
29. shift;
30. promoción;
31. estrategia default;
32. limitaciones;
33. tests;
34. lint;
35. build;
36. archivos creados;
37. archivos modificados;
38. deuda técnica;
39. GO / NO-GO;
40. próxima fase.

---

# 62. DATASET REPORT

`PHASE_2_2_2_DATASET_REPORT.json` debe incluir:

```javascript
{
  datasetVersion,
  datasetHash,
  sourceType,
  sourceFiles,
  targetContractVersion,
  totalRows,
  acceptedRows,
  rejectedRows,
  rejectionReasons,
  independentGroups,
  sessions,
  timeRange,
  positiveCount,
  negativeCount,
  positiveRate,
  scoreSummary,
  candidatesPerSpin,
  missingFields,
  duplicateAnalysis,
  warnings,
  limitations
}
```

No incluir paths privados innecesarios.

---

# 63. TARGET CONTRACT REPORT

`PHASE_2_2_2_TARGET_CONTRACT.json` debe contener el contrato final y un estado:

```text
VALID
PARTIAL
INVALID
```

Si es parcial, especificar bloqueadores.

---

# 64. BENCHMARK RESULT JSON

Debe contener:

```javascript
{
  benchmarkVersion,
  benchmarkId,
  dataset,
  targetContract,
  split,
  leakage,
  baseline,
  candidates,
  pairedBootstrap,
  leaderboard,
  promotionDecisions,
  globalDecision,
  limitations,
  warnings
}
```

JSON válido.

Sin:

* `NaN`;
* `Infinity`;
* comentarios;
* funciones.

---

# 65. REPRODUCIBILITY REPORT

Debe contener:

```javascript
{
  manifestVersion,
  commit,
  dirtyState,
  nodeVersion,
  platform,
  seed,
  datasetHash,
  targetContractHash,
  splitHashes,
  strategyVersions,
  modelHashes,
  hashAlgorithm,
  canonicalSerializationVersion,
  benchmarkConfigurationHash,
  metricConfigurationHash,
  promotionPolicyVersion,
  generatedAt
}
```

`generatedAt` no entra en hashes lógicos.

---

# 66. ADR RECOMENDADAS

Crear ADR si se toman decisiones sobre:

* target;
* unidad de observación;
* `spinId`;
* split agrupado;
* SHA-256;
* BetaCalibration;
* Platt optimizer;
* política de promoción;
* estrategia default.

No crear ADR innecesarias.

---

# 67. ARCHIVOS RECOMENDADOS

Adaptar a la estructura real.

```text
src/calibration/contracts/
├── CalibrationTargetContract.js
└── HistoricalCalibrationRecordContract.js

src/calibration/datasets/
├── HistoricalCalibrationDatasetAdapter.js
├── GroupedTemporalSplit.js
└── DatasetProvenance.js

src/calibration/security/
├── CanonicalSerializer.js
└── Sha256Hasher.js

src/calibration/benchmark/
├── PairedBootstrapComparator.js
├── EmpiricalBenchmarkRunner.js
└── TemporalStabilityEvaluator.js
```

No mover módulos existentes sin necesidad.

No crear carpetas vacías.

---

# 68. TESTS NUEVOS RECOMENDADOS

```text
tests/calibration/contracts/
CalibrationTargetContract.test.js

tests/calibration/datasets/
HistoricalCalibrationDatasetAdapter.test.js
GroupedTemporalSplit.test.js
DatasetProvenance.test.js

tests/calibration/security/
CanonicalSerializer.test.js
Sha256Hasher.test.js
CalibrationModelHashMigration.test.js

tests/calibration/scientific/
BetaCalibrationAudit.test.js
PlattConvergence.test.js
GroupedLeakageDetection.test.js
PairedBootstrapComparator.test.js
EmpiricalBenchmark.test.js
PromotionDecision.test.js
```

---

# 69. TESTS DEL SPLIT

Casos obligatorios:

* grupos únicos;
* múltiples filas por grupo;
* timestamps ordenados;
* timestamps repetidos;
* ratios;
* dataset pequeño;
* grupos insuficientes;
* embargo;
* input no mutado;
* hashes deterministas;
* ningún grupo compartido.

---

# 70. TESTS DE HASH

Casos obligatorios:

* mismo objeto, mismo hash;
* distinto orden de claves, mismo hash;
* distinto parámetro, distinto hash;
* distinta versión, distinto hash;
* timestamp informativo no afecta identidad;
* modelo serializado/deserializado conserva hash;
* algoritmo reportado como SHA-256.

---

# 71. TESTS DE BETA

Crear casos que demuestren la ecuación implementada.

No limitarse a:

```text
output entre 0 y 1
```

Probar:

* parámetros;
* monotonicidad esperada cuando corresponda;
* extremos;
* serialización;
* dataset degenerado;
* fórmula calculada manualmente;
* metadata del tipo de modelo.

---

# 72. TESTS DE PLATT

Probar:

* dataset sigmoidal;
* pérdida disminuye;
* convergencia;
* max iterations;
* una sola clase;
* scores constantes;
* extremos;
* serialización;
* determinismo;
* parámetros finitos.

---

# 73. TESTS DEL BOOTSTRAP

Probar:

* misma seed;
* diferentes seeds;
* muestreo por `spinId`;
* conservación de todas las filas del grupo;
* intervalo conocido en caso simple;
* diferencia cero para Identity vs Identity;
* mejora positiva controlada;
* réplicas inválidas.

---

# 74. PRUEBAS DE REGRESIÓN

Mantener:

* 598 tests existentes;
* tests de Histogram score 1;
* pruebas de StrategyRegistry;
* entrenamiento/inferencia;
* métricas;
* synthetic benchmark.

No eliminar ni debilitar tests.

---

# 75. COMANDOS

Inspeccionar primero `package.json`.

Ejecutar los scripts reales.

Como mínimo, si existen:

```bash
npm test
npm run lint
npm run build
npm run check:architecture
```

Registrar comandos ausentes.

No inventarlos.

---

# 76. CRITERIOS GO TÉCNICOS

GO técnico solamente si:

* SHA-256 canónico;
* split agrupado;
* leakage por grupo;
* modelos serializables;
* determinismo;
* tests completos;
* lint;
* build;
* sin regresiones.

---

# 77. CRITERIOS GO SEMÁNTICOS

GO semántico solamente si:

* target definido;
* outcome definido;
* unidad de observación definida;
* `spinId` o agrupación equivalente confiable;
* score con interpretación calibrable.

---

# 78. CRITERIOS GO EMPÍRICOS

GO empírico solamente si:

* dataset histórico real;
* tamaño suficiente;
* partición temporal válida;
* no leakage;
* baseline comparable;
* intervalos pareados;
* resultados reproducibles.

---

# 79. CRITERIOS DE CANDIDATO

Declarar `CANDIDATE_IDENTIFIED` solamente si una estrategia:

1. usa dataset real;
2. supera validaciones matemáticas;
3. converge;
4. es reproducible;
5. supera Identity en evidencia fuera de muestra;
6. tiene intervalo favorable en Brier;
7. no degrada gravemente Log Loss;
8. mantiene ECE aceptable;
9. supera la política;
10. no presenta leakage;
11. tiene complejidad justificable.

---

# 80. NO-GO

Declarar NO-GO si:

* target ambiguo;
* dataset no real presentado como real;
* ausencia de unidad independiente;
* split por filas de una misma tirada;
* leakage;
* test usado para selección;
* hash no reproducible;
* Beta mal definida y promocionada;
* Platt no convergente y promocionado;
* intervalos omitidos;
* benchmark no reproducible;
* tests fallan;
* Identity reemplazada sin evidencia.

---

# 81. VEREDICTOS SEPARADOS

El cierre debe incluir:

```text
Estado técnico:
GO | GO_WITH_OBSERVATIONS | NO_GO

Estado semántico:
VALID | PARTIAL | INVALID

Estado del dataset:
SUFFICIENT | LIMITED | INSUFFICIENT | NOT_FOUND

Estado empírico:
VALIDATED | PARTIALLY_VALIDATED | INSUFFICIENT_EVIDENCE | INVALID

Estrategia:
IDENTITY_RETAINS_DEFAULT | CANDIDATE_IDENTIFIED | NO_VALID_CANDIDATE

Integración:
READY_FOR_INTEGRATION_TESTING | NOT_READY
```

---

# 82. ESCENARIO SIN DATASET REAL

Si no encuentras datos históricos reales:

No detener la fase inmediatamente.

Debes:

1. confirmar la ausencia;
2. documentar rutas inspeccionadas;
3. implementar contratos faltantes;
4. implementar split agrupado;
5. implementar SHA-256;
6. auditar Beta;
7. auditar Platt;
8. implementar bootstrap pareado;
9. probar con fixtures claramente sintéticos;
10. emitir:

```text
INSUFFICIENT_EVIDENCE
IDENTITY_RETAINS_DEFAULT
NOT_READY
```

No fabricar un candidato.

---

# 83. ESCENARIO CON DATASET INCOMPLETO

Si faltan `spinId` o timestamps:

* analizar posibilidad de recuperación;
* documentar inferencia;
* medir colisiones;
* no declarar PASS automático;
* usar `PARTIAL`;
* impedir promoción cuando el agrupamiento no sea confiable.

---

# 84. ESCENARIO CON CANDIDATO

Si un candidato supera la política:

No cambiar el default.

Registrar:

```text
CANDIDATE_IDENTIFIED
```

Generar configuración sugerida, no aplicada:

```javascript
{
  proposedStrategy,
  proposedModelId,
  proposedModelHash,
  requiredIntegrationPhase,
  rollbackStrategy: "IdentityCalibration"
}
```

---

# 85. ESCENARIO SIN MEJORA

Si ninguna estrategia supera Identity:

Registrar:

```text
IDENTITY_RETAINS_DEFAULT
```

Documentar:

* métricas;
* intervalos;
* estabilidad;
* razones.

No presentar la fase como fracaso.

---

# 86. DISCIPLINA DE CAMBIOS

Para cada defecto:

1. describir;
2. crear test;
3. corregir mínimamente;
4. ejecutar test específico;
5. ejecutar calibración;
6. ejecutar suite global;
7. registrar archivo;
8. actualizar informe.

No reescribir indiscriminadamente.

---

# 87. COMPATIBILIDAD

Mantener compatibilidad con:

* `ProbabilityCalibrator`;
* `CalibrationTrainer`;
* `IdentityCalibration`;
* Strategy Registry;
* modelos serializados razonables;
* tests previos.

Si una incompatibilidad es necesaria:

* versionar;
* documentar migración;
* crear prueba de compatibilidad.

---

# 88. API PÚBLICA

No ampliar `src/calibration/index.js` con utilidades internas innecesarias.

Exponer solamente contratos y runners que sean parte de la API estable.

---

# 89. LOGGING

No usar `console.log` dentro de la librería.

Utilizar:

* resultados estructurados;
* warnings;
* reportes;
* logger oficial si existe.

La salida final de terminal puede usar impresión controlada.

---

# 90. RESUMEN FINAL EN TERMINAL

Mostrar:

```text
============================================================
ROULETTE TRACKER — FASE 2.2.2
EMPIRICAL CALIBRATION VALIDATION
============================================================

Commit:
Dirty state:

Target status:
Observation unit:
Grouping field:
Historical dataset:
Dataset version:
Dataset hash:
Independent groups:
Observations:

Grouped split:
Leakage:
Hash algorithm:
Beta audit:
Platt convergence:

Baseline:
Best candidate:
Brier improvement:
Brier CI:
LogLoss improvement:
ECE improvement:
Bootstrap win rate:

Technical status:
Semantic status:
Dataset status:
Empirical status:
Default strategy:
Integration readiness:

Tests:
Lint:
Build:

Reports:
- Main:
- Benchmark:
- Reproducibility:
- Target:
- Dataset:

FINAL VERDICT:
============================================================
```

---

# 91. COMMIT Y TAG SUGERIDOS

No realizar commit o tag salvo autorización o flujo existente.

Sugerir:

```text
commit:
feat(calibration): validate historical calibration and candidate promotion

tag:
phase-2.2.2-empirical-validation
```

Adaptar al estándar real.

---

# 92. ENTREGA OBLIGATORIA

Debes entregar:

1. auditoría del repositorio real;
2. contrato de target;
3. definición de unidad de observación;
4. estrategia de agrupamiento;
5. dataset report;
6. SHA-256 canónico;
7. migración de hash;
8. auditoría Beta;
9. auditoría Platt;
10. split temporal agrupado;
11. leakage detector actualizado;
12. bootstrap pareado;
13. benchmark real o evidencia insuficiente;
14. leaderboard cuantitativo;
15. decisiones de promoción;
16. tests;
17. suite completa;
18. lint;
19. build;
20. informes;
21. veredicto separado;
22. recomendación de siguiente fase.

---

# 93. REGLA DE HONESTIDAD

No declarar:

* mejor estrategia;
* modelo validado;
* probabilidad confiable;
* candidato de producción;
* ausencia de leakage;

sin evidencia explícita.

Distinguir siempre:

```text
correctitud técnica
correctitud matemática
validez semántica
evidencia empírica
aptitud de integración
```

---

# 94. REGLA FINAL

Comienza inspeccionando el repositorio y los datasets.

No cambies IdentityCalibration como default.

No calibres un target ambiguo.

No dividas una tirada entre particiones.

No uses test para ajustar.

No uses filas dependientes como réplicas bootstrap independientes.

No promociones Beta sin validar su ecuación.

No promociones Platt sin convergencia.

No declares mejora si el intervalo incluye resultados incompatibles con la política.

Cuando falte evidencia, el resultado correcto es:

```text
INSUFFICIENT_EVIDENCE
IDENTITY_RETAINS_DEFAULT
NOT_READY
```

Trabaja hasta completar todas las tareas técnicamente posibles, ejecutar las verificaciones y generar los informes exigidos.
