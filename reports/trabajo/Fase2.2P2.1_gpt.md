# PROMPT MAESTRO — FASE 2.2.1

## Auditoría Científica, Benchmark y Selección Controlada de Modelos de Calibración

**Proyecto:** Roulette Tracker
**Nombre anterior:** ORION / Orion_v2
**Subsistema:** MotorConsensoCalibrado
**Componente auditado:** ProbabilityCalibrator
**Entorno esperado:** Linux Ubuntu
**Agente ejecutor:** Hermes con DeepSeek CLI
**Tipo de intervención:** auditoría científica, endurecimiento contractual y benchmark reproducible
**Fecha de referencia:** 2026-07-30

---

# 0. INSTRUCCIÓN PRINCIPAL

Actúa como:

* arquitecto principal de software;
* científico de datos senior;
* especialista en calibración probabilística;
* auditor estadístico;
* ingeniero de Machine Learning;
* especialista en validación experimental;
* especialista en reproducibilidad;
* revisor de contratos;
* ingeniero de calidad;
* responsable de gobernanza de modelos.

Debes auditar, probar y reforzar la infraestructura de calibración probabilística implementada en las fases:

* Fase 2.2 Parte I — Arquitectura del ProbabilityCalibrator;
* Fase 2.2 Parte II — Entrenamiento, estrategias y métricas.

No debes asumir que una implementación es científicamente válida solo porque sus pruebas pasan.

Debes verificar:

1. que las fórmulas son correctas;
2. que las métricas representan lo que afirman representar;
3. que los algoritmos de entrenamiento convergen;
4. que no existe fuga de información;
5. que los resultados son reproducibles;
6. que las estrategias se comparan bajo condiciones equivalentes;
7. que ninguna estrategia sea promovida por defecto sin evidencia;
8. que los modelos no degraden la línea base;
9. que el benchmark no favorezca artificialmente a una estrategia;
10. que el sistema pueda explicar por qué un modelo fue aceptado o rechazado.

Esta fase no debe convertirse en una ampliación funcional indiscriminada.

El objetivo principal es crear una capa confiable de:

* auditoría;
* benchmarking;
* evaluación comparativa;
* reproducibilidad;
* clasificación de modelos;
* criterios cuantitativos de promoción.

---

# 1. ESTADO DE PARTIDA

La implementación existente declara disponer de:

## 1.1 Infraestructura base

* `ProbabilityCalibrator`
* `CalibrationStrategy`
* `CalibrationStrategyRegistry`
* `IdentityCalibration`
* `CalibrationInputValidator`
* `CalibrationResultFactory`
* `CalibrationVersion`
* `CalibrationMetadata`

## 1.2 Infraestructura de entrenamiento

* `CalibrationModel`
* `CalibrationContext`
* `CalibrationDataset`
* `CalibrationDatasetBuilder`
* `CalibrationDatasetValidator`
* `CalibrationTrainer`
* `CalibrationModelFactory`
* `CalibrationRepository`
* `CalibrationReport`
* `ReliabilityDiagram`

## 1.3 Estrategias

* `IdentityCalibration`
* `HistogramCalibration`
* `IsotonicCalibration`
* `PlattScaling`
* `BetaCalibration`

## 1.4 Métricas

* Brier Score
* Log Loss
* Expected Calibration Error
* Maximum Calibration Error
* Sharpness
* Resolution
* Uncertainty
* Accuracy

## 1.5 Validación experimental

* `TrainTestSplit`
* `CrossValidator`
* `BootstrapSampler`

## 1.6 Estado reportado

* 548 pruebas aprobadas;
* 30 archivos de prueba;
* lint sin advertencias;
* build correcto;
* separación entre entrenamiento e inferencia;
* modelos inmutables;
* hash SHA-256;
* repositorio en memoria;
* cuatro estrategias de calibración reales.

Todo lo anterior debe verificarse directamente en el repositorio.

No confiar únicamente en el informe.

---

# 2. OBJETIVO GENERAL

Construir un marco científico reproducible que permita responder, con evidencia:

* ¿Cuál estrategia calibra mejor?
* ¿Cuál estrategia generaliza mejor?
* ¿Cuál estrategia es más estable?
* ¿Cuál estrategia degrada menos ante cambios de distribución?
* ¿Cuál estrategia supera a `IdentityCalibration`?
* ¿La mejora es estadísticamente consistente?
* ¿La mejora se mantiene fuera de la muestra de entrenamiento?
* ¿Qué modelo puede ser promovido a candidato de producción?
* ¿Qué modelo debe permanecer en estado experimental?
* ¿Qué modelo debe rechazarse?

El resultado de esta fase no debe ser simplemente una tabla de métricas.

Debe ser un sistema reutilizable de evaluación y gobernanza de modelos.

---

# 3. REGLA CIENTÍFICA FUNDAMENTAL

Ninguna estrategia podrá considerarse mejor por mostrar una métrica favorable sobre los datos utilizados para entrenarla.

Toda comparación debe hacerse sobre datos no utilizados durante el ajuste.

La secuencia obligatoria es:

```text
Datos históricos
    │
    ├── Training
    │      └── ajuste de parámetros
    │
    ├── Validation
    │      └── selección de hiperparámetros
    │
    └── Test
           └── evaluación final
```

El conjunto de prueba no puede influir en:

* entrenamiento;
* selección de estrategia;
* selección de hiperparámetros;
* número de buckets;
* umbrales;
* regularización;
* elección de semilla;
* elección de modelo;
* ajustes manuales.

---

# 4. ALCANCE DE LA FASE

Esta fase debe implementar o endurecer:

1. auditoría matemática de estrategias;
2. auditoría matemática de métricas;
3. contratos de evaluación;
4. benchmark común;
5. comparación contra baseline;
6. validación cruzada reproducible;
7. bootstrap reproducible;
8. intervalos de confianza;
9. análisis de estabilidad;
10. detección de fuga de información;
11. leaderboard de modelos;
12. políticas de promoción;
13. trazabilidad del experimento;
14. serialización de resultados;
15. reportes científicos;
16. pruebas unitarias;
17. pruebas de integración;
18. pruebas estadísticas;
19. pruebas de determinismo;
20. criterios GO / NO-GO.

---

# 5. FUERA DE ALCANCE

No implementar en esta fase:

* integración con la interfaz de usuario;
* recomendaciones de apuesta;
* tamaño de apuesta;
* gestión monetaria;
* selección automática en producción;
* aprendizaje en línea;
* reentrenamiento automático;
* persistencia en base de datos;
* conexión con servicios externos;
* WeightOptimizer;
* MetaModel;
* RecommendationPolicy;
* AutoML;
* redes neuronales;
* modelos no relacionados con calibración;
* modificación de motores estadísticos;
* modificación de `ConsensusEngine`;
* modificación de `SignalNormalizer`;
* modificación de `SignalCollector`;
* modificación de adaptadores;
* alteración retroactiva de datos históricos.

---

# 6. PRINCIPIO DE BASELINE

`IdentityCalibration` es la línea base obligatoria.

Debe representar:

```text
calibratedProbability = rawConsensusScore
```

Toda estrategia debe compararse contra ella utilizando exactamente:

* el mismo dataset;
* los mismos folds;
* la misma partición temporal;
* la misma semilla;
* las mismas métricas;
* el mismo protocolo;
* los mismos filtros;
* las mismas reglas de exclusión.

Una estrategia no podrá promoverse si no supera a `IdentityCalibration` bajo criterios previamente definidos.

No se permite cambiar los criterios después de observar los resultados.

---

# 7. AUDITORÍA PREVIA OBLIGATORIA

Antes de crear componentes nuevos, inspeccionar:

```text
src/calibration/
tests/calibration/
reports/calibration/
package.json
eslint.config.*
vite.config.*
```

Localizar todas las implementaciones relacionadas con:

* estrategias;
* métricas;
* dataset;
* entrenamiento;
* validación cruzada;
* bootstrap;
* serialización;
* hashing;
* versionado;
* repositorio;
* reportes.

Generar un mapa de dependencias real.

Identificar:

* imports directos;
* imports circulares;
* dependencias ocultas;
* mutaciones;
* uso del reloj;
* uso de aleatoriedad;
* semillas inexistentes;
* operaciones no deterministas;
* datos compartidos por referencia;
* lógica duplicada;
* cálculos repetidos;
* pruebas demasiado superficiales.

---

# 8. PROHIBICIÓN DE REESCRITURA MASIVA

No reescribir el subsistema completo.

Aplicar cambios mínimos y controlados.

Antes de modificar una API pública:

1. documentar el problema;
2. justificar el cambio;
3. evaluar compatibilidad;
4. crear pruebas de regresión;
5. registrar una ADR cuando corresponda.

No renombrar archivos o clases sin necesidad demostrable.

---

# 9. AUDITORÍA DE IDENTITY CALIBRATION

Verificar que:

```text
p_calibrada = score_original
```

para cualquier valor válido dentro de `[0,1]`.

Casos obligatorios:

* `0`
* `1`
* `0.5`
* valores muy próximos a cero;
* valores muy próximos a uno;
* múltiples valores repetidos;
* arrays vacíos;
* entradas inválidas;
* `null`;
* `undefined`;
* `NaN`;
* `Infinity`;
* `-Infinity`.

En modo estricto:

* entradas inválidas deben producir error contractual claro.

En modo tolerante:

* aplicar la política existente;
* producir warnings;
* no inventar probabilidades.

---

# 10. AUDITORÍA DE HISTOGRAM CALIBRATION

Verificar matemáticamente:

1. cómo se definen los límites de cada bucket;
2. si los intervalos son abiertos o cerrados;
3. cómo se trata exactamente `0`;
4. cómo se trata exactamente `1`;
5. qué ocurre en buckets vacíos;
6. si existe smoothing;
7. si hay interpolación;
8. cómo se manejan valores fuera del rango;
9. si la inferencia es determinista;
10. si el número de buckets es configurable;
11. si el número de buckets puede provocar sobreajuste;
12. si el modelo conserva todos sus parámetros al serializarse.

Definir explícitamente la convención de intervalos.

Ejemplo permitido:

```text
[0.0, 0.1)
[0.1, 0.2)
...
[0.9, 1.0]
```

No permitir que un score pertenezca a más de un bucket.

No permitir que un score válido quede fuera de todos.

Para buckets vacíos, definir una política científica explícita:

* usar baseline;
* interpolar;
* usar frecuencia global;
* smoothing configurable.

No usar una solución silenciosa.

---

# 11. AUDITORÍA DE ISOTONIC CALIBRATION

Verificar la implementación de PAV:

```text
Pool Adjacent Violators
```

Debe garantizar:

* ordenamiento correcto;
* manejo de scores duplicados;
* agregación ponderada;
* monotonía no decreciente;
* probabilidades dentro de `[0,1]`;
* ausencia de saltos inválidos;
* inferencia definida entre puntos;
* inferencia definida en extremos;
* serialización reversible.

Invariante obligatorio:

```text
si x₁ ≤ x₂, entonces f(x₁) ≤ f(x₂)
```

Crear pruebas basadas en propiedades para verificar monotonía sobre múltiples datasets.

No asumir que una lista de puntos ordenada implica que el algoritmo sea correcto.

Comparar casos pequeños contra soluciones calculables manualmente.

---

# 12. AUDITORÍA DE PLATT SCALING

La transformación debe documentarse con precisión.

Ejemplo habitual:

```text
p = 1 / (1 + exp(Ax + B))
```

o:

```text
p = sigmoid(Ax + B)
```

Identificar cuál convención utiliza el código.

No aceptar ambigüedad de signo.

Verificar:

* función objetivo;
* gradiente;
* Hessiano;
* actualización Newton-Raphson;
* condición de convergencia;
* máximo de iteraciones;
* tolerancia;
* regularización;
* estabilidad numérica;
* overflow de `exp`;
* datasets degenerados;
* outcomes de una sola clase;
* scores constantes;
* inicialización;
* salida en `[0,1]`.

Usar una implementación numéricamente estable de la sigmoide.

Evitar directamente:

```javascript
Math.exp(valor_enorme)
```

cuando pueda producir overflow.

Implementar o verificar clipping apropiado.

No ocultar fallos de convergencia.

El modelo debe registrar:

* convergió o no;
* iteraciones utilizadas;
* tolerancia;
* función objetivo final;
* warnings.

---

# 13. AUDITORÍA DE BETA CALIBRATION

La fase anterior declara una implementación basada en estimación por momentos.

Auditar si esa implementación corresponde realmente a calibración Beta probabilística o solamente a un ajuste de distribución Beta.

No asumir equivalencia.

Determinar con precisión:

* fórmula implementada;
* parámetros;
* supuestos;
* función de inferencia;
* relación con outcomes positivos y negativos;
* tratamiento de `p=0`;
* tratamiento de `p=1`;
* estabilidad de logaritmos;
* comportamiento con datasets pequeños;
* comportamiento con varianza cero;
* comportamiento con una sola clase.

Si la estrategia existente no corresponde formalmente a Beta Calibration estándar:

1. no ocultarlo;
2. no renombrarla silenciosamente;
3. documentar la discrepancia;
4. decidir entre:

   * corregir la implementación;
   * renombrar la estrategia;
   * declararla experimental;
   * marcarla NO-GO.

Cualquier cambio debe preservar compatibilidad cuando sea razonable.

---

# 14. AUDITORÍA DE BRIER SCORE

Verificar la fórmula:

```text
BS = (1/N) × Σ(pᵢ - yᵢ)²
```

Validar:

* `pᵢ ∈ [0,1]`;
* `yᵢ ∈ {0,1}`;
* dataset no vacío;
* manejo de pesos;
* determinismo;
* tipo de retorno;
* ausencia de NaN.

Aclarar que menor es mejor.

Agregar pruebas con casos manuales.

Ejemplo:

```text
p = [0, 1]
y = [0, 1]
Brier = 0
```

---

# 15. AUDITORÍA DE LOG LOSS

Verificar la fórmula binaria:

```text
LL = -(1/N) × Σ[yᵢ log(pᵢ) + (1-yᵢ) log(1-pᵢ)]
```

Aplicar clipping configurable:

```text
ε ≤ p ≤ 1-ε
```

El epsilon debe ser:

* explícito;
* versionado;
* incluido en metadata;
* común entre estrategias durante el benchmark.

Aclarar que menor es mejor.

No permitir `Infinity`.

---

# 16. AUDITORÍA DE ECE

Verificar:

```text
ECE = Σ (n_b / N) × |accuracy_b - confidence_b|
```

En calibración binaria, definir claramente qué significa:

* `accuracy_b`;
* frecuencia observada;
* confianza media.

No confundir accuracy de clasificación con frecuencia del evento.

Preferir terminología:

```text
observedFrequency
meanPredictedProbability
```

Auditar:

* número de buckets;
* política de límites;
* buckets vacíos;
* ponderación;
* determinismo;
* parámetros configurables.

ECE depende del esquema de binning.

La salida debe registrar:

* cantidad de buckets;
* límites;
* estrategia de binning;
* buckets vacíos;
* tamaño por bucket.

---

# 17. AUDITORÍA DE MCE

Verificar:

```text
MCE = max_b |observedFrequency_b - meanPrediction_b|
```

Definir comportamiento para:

* dataset vacío;
* bucket vacío;
* un solo bucket;
* todos los scores iguales.

Aclarar que MCE puede ser sensible a buckets con pocos datos.

Registrar conteos.

---

# 18. AUDITORÍA DE SHARPNESS

La sharpness debe evaluarse independientemente de los outcomes.

Determinar la definición exacta utilizada.

No asumir que varianza de predicciones es la única definición posible.

Documentar:

* fórmula;
* interpretación;
* dirección deseable;
* limitaciones.

No utilizarla como criterio único de promoción.

Una estrategia puede ser sharp pero estar mal calibrada.

---

# 19. AUDITORÍA DE RESOLUTION Y UNCERTAINTY

Verificar si la implementación corresponde a la descomposición de Murphy del Brier Score:

```text
Brier = Reliability - Resolution + Uncertainty
```

Si la implementación no corresponde exactamente:

* documentarlo;
* no afirmar que existe una descomposición completa;
* corregir nombres o fórmulas cuando sea necesario.

Crear pruebas de consistencia numérica con tolerancia explícita.

---

# 20. AUDITORÍA DE ACCURACY

La accuracy no es una métrica principal de calibración.

Verificar:

* umbral usado;
* configuración;
* tratamiento de empates;
* balance de clases.

Debe quedar clasificada como métrica secundaria.

No permitir que un modelo sea promovido únicamente por accuracy.

---

# 21. CREAR CALIBRATION EXPERIMENT CONTRACT

Crear un contrato inmutable para representar un experimento.

Nombre recomendado:

```text
CalibrationExperiment
```

Debe incluir como mínimo:

```javascript
{
  experimentId,
  experimentVersion,
  createdAt,
  codeVersion,
  datasetVersion,
  datasetHash,
  strategyName,
  strategyVersion,
  modelVersion,
  configuration,
  configurationHash,
  seed,
  splitPolicy,
  trainIndicesHash,
  validationIndicesHash,
  testIndicesHash,
  metricsConfiguration,
  status,
  warnings,
  metadata
}
```

No incluir funciones.

Debe ser JSON serializable.

---

# 22. EXPERIMENT ID

El identificador del experimento debe ser reproducible o claramente diferenciarse de un ID de ejecución.

Separar:

* `experimentId`: identidad lógica de la configuración;
* `runId`: identidad de una ejecución concreta.

El hash lógico debe depender de:

* dataset;
* estrategia;
* configuración;
* semilla;
* protocolo;
* versión del código.

No debe depender de:

* hora actual;
* orden no determinista de propiedades;
* memoria;
* ID aleatorio no controlado.

---

# 23. CODE VERSION

Capturar, cuando esté disponible:

* commit Git;
* tag Git;
* estado limpio o dirty;
* hash de archivos relevantes;
* versión de Node.js;
* versión del proyecto.

Si Git no está disponible:

* registrar `null`;
* producir warning;
* no inventar un valor.

Si el repositorio está dirty:

* marcarlo explícitamente;
* no impedir necesariamente la auditoría;
* impedir promoción a producción salvo decisión documentada.

---

# 24. DATASET PROVENANCE

Cada dataset debe registrar:

* versión;
* hash;
* número de registros;
* rango temporal;
* origen;
* política de filtrado;
* campos utilizados;
* registros descartados;
* razones de descarte;
* distribución de outcomes;
* distribución de scores;
* cantidad de scores únicos;
* posibles duplicados;
* metadata de rueda o sesión, cuando exista.

No almacenar datos sensibles innecesarios.

---

# 25. DETECCIÓN DE FUGA DE INFORMACIÓN

Crear componente recomendado:

```text
CalibrationLeakageDetector
```

Debe verificar, según la información disponible:

* registros idénticos presentes en más de una partición;
* IDs duplicados;
* timestamps inconsistentes;
* sesiones compartidas;
* eventos posteriores usados para predecir eventos anteriores;
* muestras derivadas del mismo evento en train y test;
* transforms ajustadas usando todo el dataset;
* buckets definidos con información del conjunto test;
* selección de hiperparámetros usando test;
* normalizaciones globales indebidas.

Cuando no exista información suficiente para verificar una forma de fuga:

* informar `UNKNOWN`;
* no marcar falsamente como seguro.

Salida recomendada:

```javascript
{
  status: "PASS" | "FAIL" | "UNKNOWN",
  checks: [],
  warnings: [],
  evidence: {}
}
```

---

# 26. PARTICIÓN TEMPORAL

Cuando los datos tengan orden temporal, preferir evaluación temporal sobre partición aleatoria.

Implementar o verificar:

```text
TemporalTrainValidationTestSplit
```

Ejemplo:

```text
pasado remoto       → training
pasado reciente     → validation
periodo posterior   → test
```

No usar datos futuros para calibrar datos pasados.

La partición aleatoria podrá mantenerse como herramienta diagnóstica, pero no deberá ser la única evidencia para producción.

---

# 27. VALIDACIÓN CRUZADA

Auditar `CrossValidator`.

Debe verificar:

* separación completa de folds;
* cada muestra aparece una vez como validación por ciclo;
* ausencia de duplicaciones indebidas;
* semilla reproducible;
* shuffle opcional;
* soporte para no mezclar orden temporal;
* entrenamiento desde cero en cada fold;
* ausencia de estado residual de la estrategia;
* métricas por fold;
* métricas agregadas;
* desviación estándar;
* intervalos cuando corresponda.

No reutilizar un modelo entrenado entre folds.

No reutilizar parámetros mutados.

---

# 28. BOOTSTRAP

Completar y auditar `BootstrapSampler`.

Debe permitir:

* número configurable de réplicas;
* seed;
* muestreo con reemplazo;
* tamaño configurable;
* índices reproducibles;
* estimación de intervalo de confianza;
* conteo de réplicas inválidas;
* warnings.

No usar bootstrap sin documentar qué población se está aproximando.

---

# 29. GENERADOR ALEATORIO CONTROLADO

No depender directamente de `Math.random()` para experimentos reproducibles.

Crear o reutilizar un PRNG determinista con seed explícita.

Nombre recomendado:

```text
SeededRandom
```

Debe ofrecer como mínimo:

* `next()`;
* `nextInt(max)`;
* `shuffle(array)`;
* `sampleWithReplacement(array, count)`;
* clonación o reinicio con la misma semilla.

La semilla debe registrarse en el experimento.

---

# 30. CALIBRATION BENCHMARK

Crear el componente principal:

```text
CalibrationBenchmark
```

Responsabilidades:

1. recibir dataset;
2. validar dataset;
3. generar particiones;
4. detectar leakage;
5. resolver estrategias;
6. entrenar cada estrategia;
7. inferir sobre validation y test;
8. calcular métricas;
9. medir tiempos;
10. comparar con baseline;
11. construir resultados;
12. registrar warnings;
13. producir leaderboard;
14. producir reporte serializable.

No debe contener lógica matemática específica de cada estrategia.

---

# 31. CONTRATO DEL BENCHMARK

Entrada recomendada:

```javascript
{
  dataset,
  strategies,
  splitConfiguration,
  crossValidationConfiguration,
  bootstrapConfiguration,
  metricsConfiguration,
  promotionPolicy,
  seed,
  metadata
}
```

Salida recomendada:

```javascript
{
  benchmarkId,
  baseline,
  candidates,
  leaderboard,
  promotionDecision,
  datasetSummary,
  splitSummary,
  leakageReport,
  reproducibility,
  warnings,
  errors,
  configuration,
  createdAt
}
```

---

# 32. EJECUCIÓN EQUITATIVA

Todas las estrategias deben evaluarse bajo condiciones equivalentes.

La infraestructura debe garantizar:

* mismos registros de entrenamiento;
* mismos registros de validación;
* mismos registros de prueba;
* mismas métricas;
* mismo clipping;
* mismos buckets de evaluación;
* mismas semillas;
* mismo protocolo de tiempos;
* mismo número de ejecuciones;
* mismo hardware lógico cuando sea posible.

No permitir que cada estrategia defina su propio conjunto test.

---

# 33. HIPERPARÁMETROS

Definir configuración explícita por estrategia.

Ejemplos:

```javascript
{
  IdentityCalibration: {},
  HistogramCalibration: {
    bucketCountCandidates: [5, 10, 15, 20],
    emptyBucketPolicy: "baseline"
  },
  IsotonicCalibration: {
    interpolation: "step"
  },
  PlattScaling: {
    maxIterations: 100,
    tolerance: 1e-8,
    regularization: 0
  },
  BetaCalibration: {
    epsilon: 1e-12
  }
}
```

Los valores anteriores son ejemplos, no órdenes rígidas.

Inspeccionar primero la implementación real.

No añadir opciones no soportadas sin implementar y probar sus contratos.

La selección de hiperparámetros debe usar validation, nunca test.

---

# 34. MÉTRICAS PRINCIPALES

La política base debe considerar como métricas principales:

1. Brier Score;
2. Log Loss;
3. ECE.

Métricas secundarias:

* MCE;
* Sharpness;
* Resolution;
* Uncertainty;
* Accuracy;
* tiempo de entrenamiento;
* tiempo de inferencia;
* tamaño del modelo;
* estabilidad entre folds.

No reducir la decisión a una sola métrica salvo política expresamente documentada.

---

# 35. DIRECCIÓN DE LAS MÉTRICAS

Registrar explícitamente:

```text
Brier Score    → menor es mejor
Log Loss       → menor es mejor
ECE            → menor es mejor
MCE            → menor es mejor
Sharpness      → depende del contexto
Resolution     → mayor suele ser mejor
Accuracy       → mayor es mejor, pero secundaria
Training Time  → menor es mejor
Inference Time → menor es mejor
```

El leaderboard debe conocer la dirección de cada métrica.

No ordenar todas las métricas de la misma manera.

---

# 36. COMPARACIÓN CONTRA BASELINE

Crear componente recomendado:

```text
BaselineComparator
```

Por cada candidato calcular:

```text
deltaBrier
relativeBrierImprovement
deltaLogLoss
relativeLogLossImprovement
deltaECE
relativeECEImprovement
deltaMCE
```

Convención recomendada:

```text
mejora positiva = candidato mejor que baseline
```

Documentar claramente el signo.

Evitar resultados ambiguos.

---

# 37. INTERVALOS DE CONFIANZA

Para métricas principales, calcular cuando sea posible:

* media;
* desviación estándar;
* percentil 2.5%;
* percentil 97.5%;
* intervalo de confianza bootstrap;
* número de muestras válidas.

No afirmar significancia estadística solo porque una media sea menor.

La política de promoción debe considerar incertidumbre.

---

# 38. PRUEBAS PAREADAS

Cuando dos modelos se evalúan sobre las mismas observaciones, usar comparaciones pareadas.

Por ejemplo:

* diferencia de pérdida por registro;
* bootstrap de diferencias;
* intervalo de la mejora;
* proporción de réplicas donde el candidato supera al baseline.

No comparar únicamente promedios independientes.

---

# 39. ESTABILIDAD ENTRE FOLDS

Calcular por estrategia:

* media por métrica;
* desviación;
* mínimo;
* máximo;
* coeficiente de variación cuando sea matemáticamente apropiado;
* fold peor;
* fold mejor.

No usar coeficiente de variación cuando la media sea cero o cercana a cero sin protección.

Registrar comportamiento inestable.

---

# 40. ESTABILIDAD POR SUBGRUPOS

Cuando los datos lo permitan, evaluar por:

* rango de score;
* versión de configuración;
* versión de rueda;
* periodo temporal;
* fuente;
* sesión;
* régimen estadístico;
* nivel de confianza;
* nivel de coverage;
* nivel de agreement.

No inventar dimensiones ausentes.

El benchmark debe aceptar agrupaciones configurables.

---

# 41. ANALYSIS BY SCORE RANGE

Crear análisis por intervalos de score.

Ejemplo:

```text
[0.00, 0.10)
[0.10, 0.20)
...
[0.90, 1.00]
```

Por rango reportar:

* cantidad;
* score medio;
* probabilidad calibrada media;
* frecuencia observada;
* error;
* baseline;
* candidato;
* diferencia.

Este análisis debe compartir una política de buckets común.

---

# 42. RELIABILITY DIAGRAM COMPARATIVO

Extender el contrato de `ReliabilityDiagram` para comparar:

* baseline;
* candidato;
* frecuencia observada.

No implementar UI.

Producir datos serializables.

Ejemplo:

```javascript
{
  buckets: [
    {
      lowerBound,
      upperBound,
      count,
      observedFrequency,
      baselineMeanPrediction,
      candidateMeanPrediction,
      baselineGap,
      candidateGap
    }
  ]
}
```

---

# 43. MODEL LEADERBOARD

Crear:

```text
ModelLeaderboard
```

Debe clasificar modelos sin perder métricas originales.

Campos mínimos:

```javascript
{
  rank,
  strategy,
  modelId,
  modelVersion,
  datasetVersion,
  status,
  primaryScore,
  brierScore,
  logLoss,
  ece,
  mce,
  sharpness,
  stabilityScore,
  trainingTimeMs,
  inferenceTimeMs,
  relativeImprovementVsBaseline,
  warnings,
  promotionEligibility
}
```

No convertir el leaderboard en fuente de verdad única.

Debe ser una vista derivada del benchmark.

---

# 44. COMPOSITE SCORE

No crear un score compuesto arbitrario sin justificación.

Si se necesita un `primaryScore`:

1. documentar fórmula;
2. normalizar métricas;
3. definir pesos;
4. registrar dirección;
5. versionar la política;
6. probar sensibilidad a pesos.

Preferencia:

* usar política por reglas;
* evitar ocultar decisiones bajo un número único.

---

# 45. MODEL STATUS

Definir estados explícitos:

```text
BASELINE
EXPERIMENTAL
CANDIDATE
APPROVED
REJECTED
DEPRECATED
INVALID
```

Esta fase no debe promover automáticamente un modelo a producción real.

Puede declarar:

```text
CANDIDATE
```

o:

```text
APPROVED_FOR_INTEGRATION_TESTING
```

si se define como estado adicional.

No confundir aprobación científica con despliegue.

---

# 46. PROMOTION POLICY

Crear:

```text
CalibrationPromotionPolicy
```

Debe ser:

* configurable;
* serializable;
* versionada;
* determinista;
* auditable.

Ejemplo conceptual:

```javascript
{
  policyVersion: "1.0.0",
  minimumTestSamples: 1000,
  requireLeakagePass: true,
  requireDeterminismPass: true,
  requireSerializationPass: true,
  requireConvergence: true,
  maximumEce: 0.05,
  maximumLogLossDegradation: 0,
  minimumRelativeBrierImprovement: 0.01,
  minimumBootstrapWinRate: 0.90,
  maximumFoldInstability: 0.10
}
```

Los umbrales concretos deben justificarse o dejarse configurables.

No inventar umbrales como verdades científicas universales.

---

# 47. DECISIÓN DE PROMOCIÓN

Salida recomendada:

```javascript
{
  strategy,
  eligible,
  decision,
  reasonsPassed,
  reasonsFailed,
  warnings,
  evidence,
  policyVersion
}
```

Decisiones posibles:

```text
PROMOTE_AS_CANDIDATE
RETAIN_AS_EXPERIMENTAL
REJECT
INSUFFICIENT_EVIDENCE
INVALID_EXPERIMENT
```

No promover si faltan datos.

Usar `INSUFFICIENT_EVIDENCE`.

---

# 48. CALIBRATION BENCHMARK RESULT

Crear un value object inmutable:

```text
CalibrationBenchmarkResult
```

Debe contener:

* configuración completa;
* hashes;
* métricas;
* resultados por fold;
* resultados bootstrap;
* leaderboard;
* decisión;
* warnings;
* limitaciones;
* referencias de modelos;
* trazabilidad.

Aplicar copia defensiva.

Debe serializarse y deserializarse sin pérdida.

---

# 49. REPRODUCIBILITY MANIFEST

Crear:

```text
CalibrationReproducibilityManifest
```

Campos mínimos:

```javascript
{
  manifestVersion,
  seed,
  codeVersion,
  nodeVersion,
  platform,
  datasetHash,
  configurationHash,
  strategyVersions,
  modelHashes,
  splitHashes,
  metricVersions,
  benchmarkVersion,
  generatedAt
}
```

`generatedAt` no debe entrar en hashes lógicos que pretendan reproducibilidad.

---

# 50. HASHING CANÓNICO

Verificar que los hashes no dependan del orden de inserción de propiedades.

Crear o reutilizar serialización canónica.

Ejemplo conceptual:

```text
canonicalJson(value)
```

Debe:

* ordenar claves;
* preservar arrays;
* rechazar referencias circulares;
* rechazar funciones;
* rechazar `NaN`;
* rechazar `Infinity`;
* normalizar valores permitidos de forma documentada.

No confiar en `JSON.stringify()` simple para hashes cuando el orden de claves pueda variar.

---

# 51. MODEL HASH

Verificar que el hash de `CalibrationModel` incluya:

* estrategia;
* versión de estrategia;
* versión de modelo;
* parámetros;
* versión de dataset;
* configuración relevante.

No debe depender de:

* fecha de creación;
* ubicación en memoria;
* orden accidental de claves.

Dos modelos lógicamente idénticos deben tener el mismo hash.

Dos modelos con parámetros distintos deben tener hashes distintos.

---

# 52. BENCHMARK TIMING

Medir:

* tiempo de entrenamiento;
* tiempo de inferencia total;
* tiempo de inferencia por muestra;
* tiempo del benchmark.

No usar tiempos como criterio científico principal.

Evitar pruebas temporales frágiles.

Para tests:

* verificar que sean números finitos y no negativos;
* no exigir milisegundos exactos.

---

# 53. MEMORY FOOTPRINT

Cuando sea razonable, registrar:

* tamaño serializado del modelo;
* número de parámetros;
* número de puntos isotónicos;
* número de buckets;
* tamaño aproximado del resultado.

No introducir dependencias pesadas solo para medir memoria.

---

# 54. MODELOS DEGENERADOS

Probar estrategias con datasets:

* vacíos;
* de una muestra;
* todos outcomes cero;
* todos outcomes uno;
* todos scores iguales;
* todos scores cero;
* todos scores uno;
* scores muy próximos;
* outcomes alternantes;
* dataset perfectamente calibrado;
* dataset inversamente calibrado;
* dataset sobreconfiado;
* dataset subconfiante;
* dataset altamente desbalanceado.

Cada estrategia debe:

* entrenar válidamente;
* rechazar con error claro;
* o devolver estado degenerado explícito.

Nunca producir silenciosamente parámetros inválidos.

---

# 55. DATASETS SINTÉTICOS

Crear generadores de datasets sintéticos solamente para pruebas y benchmark interno.

Casos mínimos:

## 55.1 PerfectlyCalibratedDataset

La frecuencia observada debe aproximar el score.

## 55.2 OverconfidentDataset

Predicciones extremas con outcomes menos extremos.

## 55.3 UnderconfidentDataset

Predicciones centrales con outcomes más separados.

## 55.4 InvertedDataset

Scores altos asociados a menor frecuencia observada.

## 55.5 ConstantScoreDataset

Todos los scores iguales.

## 55.6 ImbalancedDataset

Muy baja o muy alta prevalencia.

Los generadores deben ser deterministas con seed.

No mezclarlos con datos reales.

---

# 56. EXPECTATIVAS DE LOS DATASETS SINTÉTICOS

Crear assertions razonables:

* Identity debe funcionar bien en datos perfectamente calibrados;
* Isotonic debe conservar monotonía;
* Histogram puede sobreajustar con demasiados buckets;
* Platt debe manejar relaciones sigmoidales;
* modelos deben comportarse de forma controlada en datasets degenerados;
* ninguna prueba debe depender de una mejora exacta imposible de garantizar por ruido.

Usar tolerancias explícitas.

---

# 57. TESTS DE PROPIEDADES

Agregar property-based tests o bucles generativos deterministas para verificar:

* probabilidades dentro de `[0,1]`;
* outputs finitos;
* monotonía isotónica;
* determinismo;
* serialización reversible;
* hash estable;
* input no mutado;
* misma cantidad de predicciones que entradas;
* scores ordenados correctamente cuando corresponda.

Evitar una dependencia externa si no es necesaria.

---

# 58. SERIALIZACIÓN

Para cada estrategia:

```text
train
  ↓
serialize
  ↓
deserialize
  ↓
infer
```

Las predicciones deben coincidir dentro de una tolerancia explícita.

Verificar:

* nombre;
* versión;
* parámetros;
* metadata;
* hash;
* configuración;
* campos opcionales;
* errores ante formatos incompatibles.

---

# 59. COMPATIBILIDAD DE VERSIONES

Definir reglas:

* misma major version: potencialmente compatible;
* major diferente: requiere migración o rechazo;
* estrategia desconocida: error claro;
* modelo con versión futura: no asumir compatibilidad;
* campos adicionales: política explícita;
* campos obligatorios ausentes: rechazo.

No ignorar silenciosamente incompatibilidades.

---

# 60. DATASET HASH Y SPLIT HASH

Calcular:

* hash completo del dataset;
* hash de índices train;
* hash de índices validation;
* hash de índices test.

Esto debe permitir comprobar que dos estrategias usaron exactamente las mismas particiones.

---

# 61. DUPLICADOS

Distinguir:

* duplicado exacto de registro;
* mismo evento repetido;
* mismo timestamp;
* mismo score y outcome;
* mismo ID con contenido distinto.

No tratar automáticamente cada repetición de score como duplicado inválido.

Los scores repetidos son normales.

---

# 62. ORDEN TEMPORAL

No ordenar datasets silenciosamente sin registrar la operación.

Si el benchmark necesita ordenar por timestamp:

* no mutar el original;
* crear copia;
* registrar política;
* validar fechas;
* definir manejo de empates.

---

# 63. MISSING DATA POLICY

Definir comportamiento para:

* score ausente;
* outcome ausente;
* timestamp ausente;
* metadata ausente;
* versión ausente.

Distinguir campos obligatorios y opcionales.

En modo tolerante:

* registrar descartes;
* contabilizar muestras;
* producir reporte.

No permitir que el número real de registros utilizados quede oculto.

---

# 64. CLASS BALANCE

El benchmark debe reportar:

```text
positiveCount
negativeCount
positiveRate
negativeRate
```

Por partición.

Si una partición contiene una sola clase:

* marcar warning o error;
* impedir estrategias que requieran ambas clases;
* no ocultar el problema.

---

# 65. MINIMUM SAMPLE SIZE

No imponer un único tamaño universal.

Crear chequeos configurables:

* total mínimo;
* mínimo por partición;
* mínimo por clase;
* mínimo por bucket;
* mínimo por fold.

Cuando no se cumplan:

```text
INSUFFICIENT_EVIDENCE
```

No confundir con modelo inválido.

---

# 66. MODEL COMPARISON TABLE

El reporte Markdown debe incluir una tabla como:

| Rank | Estrategia | Brier | Δ Brier | Log Loss | Δ Log Loss | ECE | Δ ECE | Estabilidad | Estado |
| ---: | ---------- | ----: | ------: | -------: | ---------: | --: | ----: | ----------: | ------ |

También debe incluir:

* intervalos de confianza;
* cantidad de muestras;
* número de folds;
* seed;
* dataset hash;
* policy version.

---

# 67. BASELINE RETENTION RULE

Si ninguna estrategia supera de forma convincente a `IdentityCalibration`:

```text
IdentityCalibration permanece como default.
```

Esto debe considerarse un resultado válido, no un fracaso.

No forzar la selección de una estrategia compleja.

---

# 68. COMPLEXITY PENALTY

Cuando dos estrategias tengan resultados estadísticamente equivalentes, preferir:

1. menor complejidad;
2. menor tamaño de modelo;
3. mayor estabilidad;
4. inferencia más simple;
5. mayor interpretabilidad.

Documentar esta regla.

No afirmar superioridad por diferencias irrelevantes.

---

# 69. OVERFITTING INDICATORS

Detectar:

* mejora alta en training y degradación en test;
* alta variación entre folds;
* buckets con muy pocas muestras;
* modelo isotónico con demasiados puntos;
* probabilidades extremas sin soporte;
* parámetros muy grandes;
* convergencia inestable;
* mejora no reproducible entre seeds.

Generar warnings estructurados.

---

# 70. DISTRIBUTION SHIFT

Implementar una evaluación básica, cuando sea posible, entre train y test:

* diferencia de media de scores;
* diferencia de varianza;
* diferencia de prevalencia;
* histogramas comparables;
* PSI opcional si se implementa correctamente;
* diferencias temporales.

No presentar estas métricas como prueba concluyente de shift.

Clasificar como señal diagnóstica.

---

# 71. CALIBRATION DRIFT CONTRACT

Preparar un contrato, sin monitoreo en línea:

```text
CalibrationDriftSnapshot
```

Debe poder contener:

* datasetVersion;
* period;
* metrics;
* scoreDistribution;
* observedRate;
* modelVersion;
* warnings.

No implementar automatización ni alertas.

Solo dejar preparado el contrato si encaja limpiamente.

---

# 72. EXPLANATIONS

Cada resultado debe explicar:

* por qué una estrategia quedó en determinada posición;
* qué métricas mejoró;
* qué métricas empeoró;
* qué warnings tiene;
* si convergió;
* si superó baseline;
* por qué es o no elegible.

No generar explicaciones vagas como:

```text
“modelo mejor”
```

Usar evidencia cuantitativa.

---

# 73. WARNINGS ESTRUCTURADOS

Formato recomendado:

```javascript
{
  code,
  severity,
  component,
  message,
  evidence,
  recommendation
}
```

Severidades:

```text
INFO
WARNING
ERROR
CRITICAL
```

No depender únicamente de strings libres.

---

# 74. ERROR HANDLING

Errores contractuales deben incluir:

* código;
* componente;
* campo;
* valor recibido cuando sea seguro;
* expectativa;
* causa.

No usar `console.log`.

No ocultar excepciones científicas bajo valores neutros.

---

# 75. LOGGING

Usar el sistema oficial del proyecto, si existe.

Si no existe:

* no introducir un framework de logging pesado;
* acumular warnings en resultados;
* documentar la limitación.

No imprimir miles de líneas durante tests.

---

# 76. API PÚBLICA

Mantener una API clara.

Ejemplo conceptual:

```javascript
const benchmark = new CalibrationBenchmark({
  strategies,
  metrics,
  promotionPolicy,
  seed
});

const result = benchmark.run(dataset);
```

No obligar al consumidor a coordinar manualmente cada componente interno.

---

# 77. ARCHIVOS RECOMENDADOS

Adaptar los nombres al estilo real del repositorio.

Propuesta:

```text
src/calibration/benchmark/
├── CalibrationBenchmark.js
├── CalibrationBenchmarkResult.js
├── BaselineComparator.js
├── ModelLeaderboard.js
├── CalibrationPromotionPolicy.js
├── CalibrationExperiment.js
├── CalibrationReproducibilityManifest.js
├── CalibrationLeakageDetector.js
├── SeededRandom.js
├── SyntheticCalibrationDatasetFactory.js
├── BenchmarkConfigurationValidator.js
└── index.js
```

Posibles extensiones:

```text
src/calibration/metrics/
├── MetricDescriptor.js
├── MetricRegistry.js
└── MetricComparison.js
```

Pruebas:

```text
tests/calibration/benchmark/
├── CalibrationBenchmark.test.js
├── BaselineComparator.test.js
├── ModelLeaderboard.test.js
├── PromotionPolicy.test.js
├── LeakageDetector.test.js
├── Reproducibility.test.js
├── SyntheticDatasets.test.js
├── StrategyScientificAudit.test.js
└── MetricsScientificAudit.test.js
```

No crear archivos vacíos.

No crear abstracciones sin uso.

---

# 78. ACTUALIZACIÓN DEL BARREL

Actualizar exports únicamente cuando el componente sea parte de la API pública.

No exponer utilidades internas innecesarias.

Revisar:

```text
src/calibration/index.js
src/calibration/benchmark/index.js
```

Evitar colisiones de nombres.

---

# 79. TESTS OBLIGATORIOS DEL BENCHMARK

Cubrir:

1. ejecución baseline;
2. ejecución con todas las estrategias;
3. mismos splits para todos;
4. hash reproducible;
5. seed reproducible;
6. leaderboard determinista;
7. política de promoción;
8. insufficient evidence;
9. leakage detectado;
10. estrategia inválida;
11. dataset inválido;
12. modelo no convergente;
13. serialización;
14. deserialización;
15. input no mutado;
16. warnings estructurados;
17. datos degenerados;
18. dataset temporal;
19. cross-validation;
20. bootstrap.

---

# 80. TESTS MATEMÁTICOS OBLIGATORIOS

Agregar casos manualmente verificables para:

* Brier Score;
* Log Loss;
* ECE;
* MCE;
* Uncertainty;
* Resolution, si corresponde;
* Reliability Diagram;
* Histogram bucket assignment;
* Isotonic PAV;
* Platt sigmoid;
* Beta transform.

Cada prueba debe documentar el resultado esperado.

---

# 81. TOLERANCIAS NUMÉRICAS

Crear constantes o configuración central para comparaciones flotantes.

Ejemplo:

```text
ABSOLUTE_TOLERANCE
RELATIVE_TOLERANCE
PROBABILITY_EPSILON
CONVERGENCE_TOLERANCE
```

No comparar flotantes con igualdad estricta salvo casos exactos como Identity y valores seguros.

---

# 82. CLIPPING

Centralizar política de clipping.

No permitir que:

* Log Loss use un epsilon;
* Platt use otro no documentado;
* Beta use otro oculto;
* Reliability Diagram modifique scores.

Separar:

* clipping de estabilidad numérica;
* transformación real del modelo.

Registrar ambos.

---

# 83. MODELO INMUTABLE

Verificar que `CalibrationModel` sea profundamente inmutable o defensivamente seguro.

`Object.freeze()` superficial no basta para objetos anidados.

Probar:

* mutación de parámetros;
* mutación de métricas;
* mutación de metadata;
* mutación de arrays;
* mutación posterior del objeto usado para construir el modelo.

El hash no debe quedar desincronizado del contenido.

---

# 84. DATASET INMUTABLE

Aplicar pruebas equivalentes a `CalibrationDataset`.

Verificar que:

* registros originales no cambien;
* slices no expongan referencias mutables;
* shuffle no modifique el original;
* iteración no permita alterar datos internos;
* builder no comparta referencias.

---

# 85. REPOSITORY

No implementar persistencia física.

Endurecer `CalibrationRepository` en memoria para soportar:

* guardar modelo;
* obtener por ID;
* obtener por hash;
* listar por estrategia;
* listar por versión;
* evitar sobrescritura silenciosa;
* validar integridad;
* copia defensiva.

No convertirlo en fuente global mutable.

---

# 86. REGISTRY

Verificar que `CalibrationStrategyRegistry`:

* no comparta instancias entrenadas entre experimentos;
* no permita estado residual;
* resuelva factories o clones cuando sea necesario;
* mantenga Identity protegida;
* rechace nombres duplicados;
* liste versiones.

Una estrategia con estado mutable no debe contaminar otras ejecuciones.

---

# 87. TRAINER

Auditar `CalibrationTrainer`:

* no debe inferir;
* no debe seleccionar modelo;
* no debe modificar dataset;
* debe registrar configuración;
* debe validar resultado de `fit`;
* debe producir modelo mediante factory;
* debe incluir convergencia y warnings;
* debe mantener determinismo.

---

# 88. PROBABILITY CALIBRATOR

Verificar integración con modelos entrenados.

Debe:

* recibir modelo válido;
* validar compatibilidad estrategia/modelo;
* inferir sin entrenamiento;
* no mutar modelo;
* no mutar entrada;
* preservar `rawConsensusScore`;
* añadir `calibratedProbability`;
* incluir metadata del modelo;
* mantener serialización.

No modificar la semántica del `ConsensusEngine`.

---

# 89. CONFIDENCE DEL CONSENSUS

No usar automáticamente `confidence`, `agreement`, `coverage` o `participation` como features del calibrador unidimensional.

La fase actual calibra principalmente:

```text
rawConsensusScore → probability
```

Si la implementación existente utiliza otros campos:

* documentarlo;
* justificarlo;
* clasificarlo como calibración multivariable;
* no mezclarlo silenciosamente.

La ampliación multivariable requiere una fase separada.

---

# 90. UNIDAD DE OBSERVACIÓN

Definir qué representa cada registro:

* número candidato;
* evento;
* tirada;
* sesión;
* predicción;
* resultado.

Evitar que múltiples candidatos derivados de la misma tirada se traten como observaciones independientes sin analizar dependencia.

Si el dataset contiene varias filas por evento:

* agrupar particiones por evento;
* evitar repartir filas del mismo evento entre train y test;
* documentar dependencia.

Este punto es crítico.

---

# 91. AMERICAN ROULETTE CONTEXT

Roulette Tracker trabaja con ruleta americana mecánica.

No asumir independencia perfecta entre observaciones sin evaluar la estructura real de los datos.

No afirmar capacidad predictiva causal.

La calibración mide correspondencia histórica entre:

```text
score emitido
```

y:

```text
frecuencia observada
```

No elimina la ventaja matemática del casino ni garantiza resultados futuros.

Mantener esta limitación en el informe científico.

---

# 92. MULTIPLE CANDIDATES PER SPIN

Investigar el contrato real del dataset.

Si cada tirada genera probabilidades para múltiples números, considerar que:

* los outcomes están relacionados;
* solo uno de 38 resultados puede ocurrir;
* 0 y 00 son distintos;
* las filas no son independientes dentro de la misma tirada;
* una partición por filas puede causar leakage.

La política de split debe agrupar por identificador de tirada cuando exista.

Si no existe identificador:

* marcar limitación crítica;
* no afirmar ausencia de leakage.

---

# 93. PROBABILITY SEMANTICS

Determinar qué evento calibra cada `rawConsensusScore`.

Ejemplos posibles:

* probabilidad de que salga un número específico;
* probabilidad de pertenecer a una selección;
* score relativo de ranking;
* propensión no normalizada.

No asumir que un valor `[0,1]` es automáticamente una probabilidad binaria calibrable.

El benchmark debe documentar la semántica del target.

Si el score no representa un evento binario bien definido:

```text
NO-GO científico
```

hasta aclararlo.

---

# 94. NORMALIZATION ACROSS NUMBERS

Verificar si las probabilidades calibradas por número:

* deben sumar 1;
* no deben sumar 1;
* representan eventos binarios independientes;
* representan scores marginales.

No imponer suma 1 sin contrato.

No afirmar distribución multinomial si el calibrador es binario por número.

Registrar esta limitación para futuras fases.

---

# 95. DATASET REAL VS SINTÉTICO

Distinguir claramente:

* pruebas unitarias con datasets sintéticos;
* benchmark científico con datos históricos reales.

Los datasets sintéticos verifican comportamiento algorítmico.

No demuestran efectividad real.

Si no existen datos históricos suficientes:

* completar infraestructura;
* ejecutar pruebas sintéticas;
* emitir `INSUFFICIENT_EVIDENCE`;
* no declarar una estrategia ganadora real.

---

# 96. DEFAULT STRATEGY

No cambiar la estrategia por defecto durante esta fase salvo evidencia sólida y decisión documentada.

Por defecto:

```text
IdentityCalibration
```

debe permanecer activa hasta que:

1. un candidato supere la política;
2. exista dataset real suficiente;
3. no haya leakage;
4. la mejora sea estable;
5. el modelo sea reproducible;
6. exista aprobación explícita de integración.

---

# 97. ADR OBLIGATORIAS

Crear ADR cuando se tomen decisiones sobre:

* definición de BetaCalibration;
* estrategia de split;
* política de promoción;
* definición de métricas;
* hashing canónico;
* semilla y PRNG;
* unidad de observación;
* agrupamiento por tirada;
* estrategia default.

Ubicación adaptada al repositorio, por ejemplo:

```text
docs/adr/
```

No crear ADR para cambios triviales.

---

# 98. INFORME PRINCIPAL

Generar:

```text
reports/calibration/PHASE_2_2_1_SCIENTIFIC_VALIDATION.md
```

Debe incluir:

1. resumen ejecutivo;
2. alcance;
3. estado inicial;
4. auditoría de arquitectura;
5. auditoría de contratos;
6. auditoría por estrategia;
7. auditoría por métrica;
8. problemas matemáticos encontrados;
9. correcciones aplicadas;
10. benchmark implementado;
11. metodología;
12. datasets;
13. unidad de observación;
14. prevención de leakage;
15. reproducibilidad;
16. comparación baseline;
17. leaderboard;
18. intervalos de confianza;
19. análisis de estabilidad;
20. análisis por subgrupos;
21. limitaciones;
22. tests;
23. lint;
24. build;
25. archivos creados;
26. archivos modificados;
27. deuda técnica;
28. riesgos;
29. decisión GO / NO-GO;
30. recomendación de estrategia por defecto.

---

# 99. INFORME DE RESULTADOS JSON

Generar también, cuando exista benchmark ejecutable:

```text
reports/calibration/PHASE_2_2_1_BENCHMARK_RESULT.json
```

Debe ser JSON válido.

No incluir:

* `NaN`;
* `Infinity`;
* funciones;
* referencias circulares;
* comentarios.

Si no hay dataset real:

* producir resultado sintético claramente etiquetado;
* o un manifiesto de evidencia insuficiente;
* nunca presentarlo como validación real.

---

# 100. MANIFIESTO DE REPRODUCIBILIDAD

Generar:

```text
reports/calibration/PHASE_2_2_1_REPRODUCIBILITY.json
```

Debe contener:

* commit;
* dirty state;
* Node version;
* platform;
* dataset hash;
* configuration hash;
* seed;
* split hashes;
* strategy versions;
* model hashes;
* metric versions;
* timestamp informativo;
* benchmark version.

---

# 101. MATRIZ DE CUMPLIMIENTO

Incluir una tabla:

| Requisito | Estado | Evidencia | Archivo/Test |
| --------- | ------ | --------- | ------------ |

Estados permitidos:

```text
PASS
FAIL
PARTIAL
NOT_APPLICABLE
UNKNOWN
```

No usar `PASS` sin evidencia.

---

# 102. COMANDOS DE VERIFICACIÓN

Ejecutar los comandos reales definidos por el proyecto.

Como mínimo, cuando existan:

```bash
npm test
npm run lint
npm run build
npm run check:architecture
```

No inventar scripts inexistentes.

Primero inspeccionar `package.json`.

Si un comando no existe:

* registrarlo;
* utilizar el equivalente real;
* no modificar `package.json` solo para simular cumplimiento.

---

# 103. TESTS COMPLETOS

Ejecutar:

* tests nuevos;
* suite completa;
* tests de regresión;
* lint;
* build;
* verificación arquitectónica disponible.

No reportar únicamente los tests de la fase.

Registrar:

* archivos de test;
* tests totales;
* tests aprobados;
* tests fallidos;
* tests omitidos;
* duración aproximada;
* warnings.

---

# 104. NO BORRAR TESTS

No eliminar ni debilitar pruebas existentes para conseguir verde.

No cambiar expectativas correctas para adaptarlas a una implementación incorrecta.

Si una prueba revela un defecto:

* corregir el código;
* o justificar científicamente el cambio del contrato.

---

# 105. COBERTURA

Si el proyecto ya tiene medición de cobertura, ejecutarla.

No introducir una herramienta nueva únicamente por esta fase salvo que sea ligera y coherente.

Reportar:

* statements;
* branches;
* functions;
* lines.

No confundir número de tests con cobertura científica.

---

# 106. CRITERIOS GO ARQUITECTÓNICOS

GO arquitectónico solamente si:

* benchmark desacoplado;
* contratos estables;
* modelos inmutables;
* datasets inmutables;
* seeds controladas;
* hashes reproducibles;
* serialización reversible;
* no regresiones;
* no imports indebidos;
* separación entrenamiento/inferencia;
* leaderboard derivado;
* política configurable.

---

# 107. CRITERIOS GO MATEMÁTICOS

GO matemático solamente si:

* fórmulas auditadas;
* métricas correctas;
* clipping documentado;
* isotonic monotónico;
* histogram sin huecos ni solapamientos;
* Platt estable y con convergencia controlada;
* Beta formalmente correcta o reclasificada;
* probabilities finitas dentro de `[0,1]`;
* casos degenerados controlados;
* tests manuales y de propiedades.

---

# 108. CRITERIOS GO CIENTÍFICOS

GO científico para infraestructura si:

* evaluación fuera de muestra;
* baseline obligatorio;
* splits reproducibles;
* leakage checks;
* intervalos o estabilidad;
* resultados trazables;
* metodología documentada.

GO científico para promover un candidato solamente si, además:

* existe dataset real suficiente;
* unidad de observación clara;
* mejora respecto a baseline;
* mejora estable;
* ausencia de degradación grave en métricas principales;
* política de promoción satisfecha;
* limitaciones aceptables.

---

# 109. CRITERIOS NO-GO

Declarar NO-GO si ocurre cualquiera de los siguientes problemas críticos:

* test utilizado para seleccionar hiperparámetros;
* leakage confirmado;
* score sin semántica de evento;
* unidad de observación incorrecta;
* filas de una misma tirada divididas entre train/test;
* métrica implementada incorrectamente;
* BetaCalibration mal nombrada y no corregida;
* modelo no determinista sin justificación;
* hash inestable;
* serialización con pérdida;
* mutación de dataset;
* mutación de modelo;
* probabilidades fuera de rango;
* NaN o Infinity;
* selección sin baseline;
* promoción sin datos reales;
* degradación significativa ignorada;
* tests completos fallando.

---

# 110. RESULTADOS POSIBLES

El veredicto final debe separar:

## 110.1 Infraestructura

```text
GO
GO_WITH_OBSERVATIONS
NO_GO
```

## 110.2 Validez científica del benchmark

```text
VALIDATED
PARTIALLY_VALIDATED
INSUFFICIENT_EVIDENCE
INVALID
```

## 110.3 Estrategia recomendada

```text
IDENTITY_RETAINS_DEFAULT
CANDIDATE_IDENTIFIED
NO_CANDIDATE
INVALID_COMPARISON
```

No reducir todo a una sola palabra.

---

# 111. RECOMENDACIÓN FINAL

El informe debe terminar con una recomendación explícita:

* estrategia default;
* candidato experimental;
* estrategias rechazadas;
* motivos;
* siguiente fase recomendada;
* bloqueadores;
* deuda técnica;
* condiciones necesarias para integración.

---

# 112. DISCIPLINA DE CAMBIOS

Antes de modificar código:

1. inspeccionar;
2. documentar hallazgo;
3. crear prueba que reproduzca;
4. aplicar corrección mínima;
5. ejecutar prueba específica;
6. ejecutar suite de calibración;
7. ejecutar suite total;
8. actualizar reporte.

No aplicar correcciones especulativas.

---

# 113. GIT

Antes de comenzar:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
```

No ejecutar operaciones destructivas.

No usar:

```bash
git reset --hard
git clean -fd
git checkout -- .
```

No borrar cambios del usuario.

Si el repositorio está dirty:

* continuar con precaución;
* registrar archivos;
* evitar sobrescribir trabajo ajeno.

---

# 114. COMMIT Y TAG

No realizar commit o tag salvo que el flujo autorizado del proyecto ya lo contemple explícitamente.

Al final, sugerir:

```text
commit:
feat(calibration): add scientific benchmark and model promotion framework

tag:
phase-2.2.1-scientific-validation
```

Adaptar nombres al estándar real del repositorio.

---

# 115. FORMATO DEL RESUMEN FINAL EN TERMINAL

Al terminar, mostrar:

```text
============================================================
ROULETTE TRACKER — FASE 2.2.1
SCIENTIFIC VALIDATION & BENCHMARK
============================================================

Estado arquitectura:
Estado matemático:
Estado científico:
Baseline:
Mejor candidato:
Estrategia default:
Dataset real disponible:
Leakage:
Reproducibilidad:
Tests:
Lint:
Build:
Informe:
Benchmark JSON:
Manifest:

VEREDICTO:
============================================================
```

---

# 116. REGLA DE HONESTIDAD

No declarar:

* “científicamente validado”;
* “mejor modelo”;
* “probabilidad confiable”;
* “estrategia de producción”;

si no existe evidencia suficiente.

Distinguir siempre entre:

* infraestructura correcta;
* algoritmo correcto;
* benchmark sintético;
* benchmark histórico;
* mejora estadística;
* aptitud para producción.

---

# 117. REGLA DE CONSERVACIÓN DEL SCORE

El calibrador no debe sobrescribir:

```text
rawConsensusScore
```

Debe conservar:

```javascript
{
  rawConsensusScore,
  calibratedProbability
}
```

No destruir trazabilidad.

---

# 118. REGLA DE IDENTIDAD

`IdentityCalibration` debe seguir funcionando aunque todas las demás estrategias fallen.

Debe ser posible ejecutar el sistema con baseline solamente.

No convertir estrategias avanzadas en dependencias obligatorias del pipeline.

---

# 119. REGLA DE PRODUCCIÓN

Esta fase no activa automáticamente una estrategia nueva en producción.

El resultado máximo permitido es:

```text
CANDIDATE_IDENTIFIED
```

La promoción efectiva debe ocurrir en una fase de integración posterior y bajo configuración explícita.

---

# 120. DEFINICIÓN DE TERMINADO

La fase se considera terminada únicamente cuando:

* se auditó el código real;
* se verificaron fórmulas;
* se corrigieron defectos críticos encontrados;
* se implementó benchmark común;
* se implementó baseline comparator;
* se implementó leaderboard;
* se implementó política de promoción;
* se controló aleatoriedad;
* se documentó unidad de observación;
* se analizaron riesgos de leakage;
* se probaron datasets degenerados;
* se probaron datasets sintéticos;
* se verificó serialización;
* se verificaron hashes;
* pasaron tests;
* pasó lint;
* pasó build;
* se generaron informes;
* se emitió veredicto honesto.

---

# ORDEN DE EJECUCIÓN OBLIGATORIO

Ejecuta la fase en este orden:

```text
1. Inspección del repositorio
2. Verificación del estado Git
3. Mapa arquitectónico
4. Auditoría de contratos
5. Auditoría de estrategias
6. Auditoría de métricas
7. Identificación de defectos
8. Tests que reproduzcan defectos
9. Correcciones mínimas
10. SeededRandom y reproducibilidad
11. LeakageDetector
12. CalibrationExperiment
13. CalibrationBenchmark
14. BaselineComparator
15. ModelLeaderboard
16. PromotionPolicy
17. Synthetic datasets
18. Cross-validation y bootstrap
19. Pruebas matemáticas
20. Pruebas de integración
21. Suite completa
22. Lint
23. Build
24. Reportes
25. Veredicto
```

No saltar directamente a crear archivos sin inspeccionar el código existente.

---

# ENTREGA FINAL OBLIGATORIA

Al finalizar debes entregar:

1. implementación completa de la fase;
2. tests nuevos;
3. suite total aprobada;
4. reporte Markdown;
5. resultado JSON;
6. manifiesto de reproducibilidad;
7. lista de archivos creados;
8. lista de archivos modificados;
9. hallazgos científicos;
10. defectos corregidos;
11. limitaciones;
12. deuda técnica;
13. veredicto separado;
14. recomendación para la próxima fase.

---

# INSTRUCCIÓN FINAL AL AGENTE

Comienza inspeccionando el repositorio real.

No confíes ciegamente en los informes anteriores.

No cambies la estrategia por defecto sin evidencia.

No confundas pruebas sintéticas con validación histórica.

No uses el conjunto de prueba para ajustar modelos.

No ocultes incertidumbre.

No declares ganador si las diferencias no son robustas.

Preserva `IdentityCalibration` como baseline seguro.

Trabaja hasta completar la auditoría, los cambios necesarios, las pruebas y los informes de esta fase.

Cuando exista ambigüedad científica, documenta la ambigüedad y adopta la alternativa más conservadora.
