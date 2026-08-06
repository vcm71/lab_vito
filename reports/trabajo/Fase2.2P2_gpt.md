# FASE 2.2 — PROBABILITY CALIBRATOR
## PARTE II — Modelos de Calibración, Entrenamiento y Métricas

Proyecto:
Roulette Tracker

Dependencia obligatoria:

FASE 2.2 — PARTE I
(Arquitectura aprobada)

NO modificar la arquitectura existente.

Únicamente extenderla.

---

# OBJETIVO

Transformar la infraestructura creada en la Parte I en una plataforma capaz de entrenar y ejecutar modelos de calibración probabilística.

El resultado NO debe romper la compatibilidad con IdentityCalibration.

Todas las estrategias deberán implementar exactamente la misma interfaz.

---

# 1. Principio fundamental

Separar completamente:

ENTRENAMIENTO

de

INFERENCIA

Nunca entrenar durante una evaluación.

Nunca modificar un modelo durante una predicción.

---

# 2. Crear CalibrationModel

Diseñar un objeto inmutable.

Debe representar un modelo entrenado.

Debe contener como mínimo:

id

strategy

strategyVersion

modelVersion

datasetVersion

trainedAt

trainingSamples

parameters

metrics

hash

metadata

No almacenar lógica.

Solo datos.

---

# 3. CalibrationContext

Crear un contrato único.

Debe contener:

configuration

strategy

model

datasetVersion

evaluationMode

consensusVersion

engineVersion

metadata

futureExtensions

Todas las estrategias recibirán exactamente este objeto.

Nunca parámetros sueltos.

---

# 4. CalibrationDataset

Crear un Dataset Builder.

Debe aceptar únicamente datos históricos.

Cada registro deberá contener:

rawConsensusScore

observedOutcome

timestamp

wheelVersion

configurationVersion

metadata

No modificar registros históricos.

---

# 5. Dataset Validation

Validar:

rangos

duplicados

NaN

Infinity

scores fuera de [0,1]

eventos inválidos

fechas

versiones

hash

Generar reporte.

---

# 6. Dataset Version

Versionar datasets.

Ejemplo:

Dataset_2026_07_v1

Dataset_Backtest500K

Dataset_Live_2027Q1

---

# 7. CalibrationTrainer

Crear componente independiente.

Responsable únicamente de entrenar modelos.

Nunca realizar inferencia.

---

# 8. CalibrationStrategy

Extender la interfaz.

Agregar:

fit(dataset)

calibrate(score)

serialize()

deserialize()

validateModel()

getMetadata()

---

# 9. IdentityCalibration

Actualizar para soportar:

fit()

serialize()

deserialize()

Aunque no requiera entrenamiento.

Debe comportarse como cualquier otra estrategia.

---

# 10. HistogramCalibration

Implementar primera estrategia real.

Debe:

crear buckets

calcular frecuencia observada

construir tabla

interpolar

No optimizar todavía.

---

# 11. IsotonicRegression

Preparar estructura.

Implementar algoritmo PAV.

Debe garantizar:

monotonía

sin decrecimiento

modelo serializable

---

# 12. PlattScaling

Preparar infraestructura.

Implementar entrenamiento mediante regresión logística.

Separar parámetros:

A

B

---

# 13. BetaCalibration

Preparar infraestructura.

Modelo basado en distribución Beta.

Separar parámetros.

---

# 14. CalibrationModelFactory

Crear fábrica.

Construye modelos entrenados.

Nunca crear modelos manualmente.

---

# 15. Model Repository

Diseñar repositorio.

Guardar:

modelo

versión

hash

dataset

métricas

fecha

No persistencia física todavía.

Solo interfaz.

---

# 16. Calibration Metrics

Implementar:

Brier Score

Log Loss

Expected Calibration Error

Maximum Calibration Error

Accuracy

Sharpness

Resolution

Uncertainty

Cada métrica debe ser independiente.

---

# 17. Reliability Diagram

Generar estructura de datos.

No UI.

Debe producir:

bucket

predicción media

frecuencia observada

cantidad

error

---

# 18. Calibration Report

Crear objeto.

Debe contener:

modelo

dataset

métricas

curvas

warnings

limitaciones

fecha

---

# 19. Cross Validation

Preparar infraestructura.

K-Fold configurable.

Sin acoplar a estrategias.

---

# 20. Bootstrap

Preparar soporte.

No obligatorio ejecutar.

Solo arquitectura.

---

# 21. Train/Test Split

Separar:

Training

Validation

Testing

Nunca mezclar.

---

# 22. Determinismo

Entrenando con:

mismo dataset

misma versión

misma configuración

↓

mismo modelo

Siempre.

---

# 23. Hash

Todo modelo entrenado debe generar hash reproducible.

---

# 24. Serialización

Todo modelo debe poder:

serialize()

deserialize()

Sin pérdida.

---

# 25. Versionado

Separar:

strategyVersion

modelVersion

datasetVersion

Nunca mezclarlos.

---

# 26. Compatibilidad

ProbabilityCalibrator no debe conocer detalles internos de:

Histogram

Platt

Isotonic

Beta

Solo la interfaz.

---

# 27. Tests

Agregar pruebas para:

Training

Serialization

Deserialization

Hash

Dataset

Metrics

Identity

Histogram

Isotonic

Registry

ModelFactory

Context

Versionado

---

# 28. Performance

Entrenamiento:

priorizar claridad.

Inferencia:

O(1)

cuando sea posible.

---

# 29. Archivos esperados

src/calibration/

CalibrationModel.js

CalibrationContext.js

CalibrationDataset.js

CalibrationDatasetBuilder.js

CalibrationTrainer.js

CalibrationModelFactory.js

CalibrationRepository.js

metrics/

BrierScore.js

LogLoss.js

ECE.js

MCE.js

Sharpness.js

Resolution.js

Uncertainty.js

strategies/

HistogramCalibration.js

IsotonicCalibration.js

PlattScaling.js

BetaCalibration.js

tests/

training/

metrics/

strategies/

---

# 30. Informe obligatorio

Generar:

reports/calibration/

PHASE_2_2_PART2_TRAINING.md

Debe incluir:

Arquitectura

Modelos

Dataset

Entrenamiento

Métricas

Curvas

Tests

Cobertura

Rendimiento

Problemas encontrados

Preparación Parte III

---

# 31. GO

GO únicamente si:

✓ modelos entrenables

✓ datasets versionados

✓ métricas independientes

✓ serialización correcta

✓ hash reproducible

✓ inferencia desacoplada

✓ Identity sigue funcionando

✓ sin regresiones

---

# 32. NO-GO

NO aprobar si:

el entrenamiento ocurre durante inferencia

las estrategias rompen la interfaz

el calibrador conoce implementaciones concretas

los modelos mutan

los datasets se modifican

se pierde determinismo

la serialización no es reversible

---

# REGLA FINAL

No implementar todavía:

Persistencia física

Optimización automática

Selección automática de modelos

AutoML

Backtesting avanzado

WeightOptimizer

MetaModel

Eso pertenece exclusivamente a las siguientes fases del proyecto.

La arquitectura debe quedar completamente preparada para incorporar nuevas estrategias de calibración durante los próximos años sin modificar el núcleo del ProbabilityCalibrator.
