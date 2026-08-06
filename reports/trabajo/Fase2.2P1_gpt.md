# FASE 2.2 — PROBABILITY CALIBRATOR
## PARTE I — Arquitectura y Fundamentos

Proyecto:
Roulette Tracker
(Anteriormente ORION / Orion_v2)

Componente:

MotorConsensoCalibrado
    ↓
ProbabilityCalibrator

Tipo de fase:

Arquitectura científica
Diseño probabilístico
Infraestructura de calibración

---

# 1. Rol

Actúa como:

• Arquitecto Principal de Software
• Arquitecto Estadístico Senior
• Especialista en Probabilidad
• Especialista en Calibración de Modelos
• Arquitecto Clean Architecture
• Auditor Matemático
• Diseñador de Frameworks reutilizables

No eres un generador de código.

Debes actuar como el diseñador del sistema de calibración probabilística que será utilizado por Roulette Tracker durante toda su vida útil.

Todas las decisiones deben privilegiar:

- rigor matemático
- estabilidad
- reproducibilidad
- mantenibilidad
- extensibilidad
- trazabilidad

No implementar soluciones rápidas.

Toda decisión debe poder mantenerse durante años.

---

# 2. Contexto

Las fases anteriores ya implementaron:

SignalCollector

↓

SignalNormalizer

↓

ConsensusEngine

↓

rawConsensusScore

La auditoría Fase 2.1.1 concluyó:

GO

El ConsensusEngine entrega un contrato estable y matemáticamente válido.

NO debe modificarse.

ProbabilityCalibrator debe trabajar únicamente sobre su contrato público.

Nunca acceder directamente a motores internos.

---

# 3. Objetivo

Construir un componente capaz de transformar:

rawConsensusScore

en

calibratedProbability

utilizando estrategias intercambiables.

El objetivo NO es mejorar el score.

El objetivo es que:

si el sistema dice

0.80

históricamente ocurra aproximadamente el 80%.

La calibración debe aproximar:

P(evento | rawConsensusScore)

No modificar el score original.

---

# 4. Principios fundamentales

El calibrador nunca debe:

• inventar evidencia
• modificar datos históricos
• alterar consenso
• reinterpretar motores
• cambiar pesos
• corregir señales

El calibrador solamente aprende una transformación probabilística.

---

# 5. Definición formal

Debe distinguir explícitamente:

rawConsensusScore

≠

Probability

Ejemplo:

rawConsensusScore = 0.84

No significa

84%

Hasta que exista calibración.

---

# 6. Responsabilidades

ProbabilityCalibrator será responsable de:

✓ recibir consenso

✓ validar contrato

✓ aplicar estrategia

✓ devolver probabilidad calibrada

✓ adjuntar metadata

✓ conservar trazabilidad

No será responsable de:

Backtesting

Optimización

Predicción

Recomendaciones

Apuestas

Machine Learning general

---

# 7. Arquitectura objetivo

ProbabilityCalibrator/

    contracts/

    validators/

    strategies/

    factories/

    metrics/

    serialization/

    versioning/

    calibration/

    tests/

---

# 8. Componentes

Diseñar:

CalibrationInputValidator

CalibrationContract

CalibrationResultFactory

CalibrationStrategy

CalibrationVersion

CalibrationMetadata

ProbabilityCalibrator

IdentityCalibration

No implementar todavía:

Isotonic

Platt

Beta

Histogram

Solo preparar la infraestructura.

---

# 9. Strategy Pattern

Toda calibración debe implementarse mediante:

CalibrationStrategy

Cada estrategia deberá exponer exactamente la misma interfaz.

No permitir lógica condicional gigante.

Nunca:

if(strategy == ...)

La selección debe hacerse mediante registro.

---

# 10. Registry

Crear:

CalibrationStrategyRegistry

Debe permitir:

register()

unregister()

get()

list()

default()

---

# 11. Estrategia inicial

Implementar únicamente:

IdentityCalibration

Su comportamiento será:

calibratedProbability = rawConsensusScore

Esta estrategia será la línea base.

Toda la infraestructura debe funcionar con ella.

---

# 12. Contrato de entrada

Recibir únicamente el contrato público emitido por ConsensusEngine.

Nunca acceder a:

Lab_Con

Lab_Con1

AtRep

Adapters

SignalNormalizer

SignalCollector

---

# 13. Contrato mínimo esperado

Debe existir:

rawConsensusScore

confidence

agreement

coverage

participation

engineScores

conflicts

explanation

configurationVersion

---

# 14. Contrato de salida

Agregar:

calibratedProbability

calibration

metadata

strategy

version

No eliminar ningún campo existente.

---

# 15. Metadata

Toda salida debe incluir:

strategy

strategyVersion

trainingDataset

trainedAt

modelVersion

calibrationVersion

confidence

explanation

Sin inventar valores.

Cuando no existan:

null

---

# 16. Versionado

Diseñar desde ahora:

CalibrationVersion

Debe permitir futuras versiones.

Ejemplo:

1.0.0

1.1.0

2.0.0

---

# 17. Inmutabilidad

Nunca modificar:

input

Siempre devolver:

nuevo objeto

Deep Clone obligatorio.

---

# 18. Determinismo

Con la misma entrada:

↓

misma configuración

↓

misma estrategia

↓

misma salida

Siempre.

---

# 19. Serialización

Todo resultado debe ser serializable.

JSON.stringify()

Sin:

NaN

Infinity

Map

Set

Funciones

Referencias circulares

---

# 20. Performance

No introducir:

O(n²)

innecesario.

Objetivo:

O(n)

por evaluación.

---

# 21. Validaciones

Crear validadores para:

contract

configuration

strategy

version

metadata

---

# 22. Manejo de errores

strict

↓

error

tolerant

↓

warning

Nunca:

fallos silenciosos.

---

# 23. Logging

No imprimir console.log.

Toda advertencia debe registrarse mediante el sistema oficial.

---

# 24. Tests

Crear pruebas para:

IdentityCalibration

Deep Clone

Determinismo

Registro de estrategias

Versionado

Contratos

Serialización

Errores

Strict

Tolerant

---

# 25. Restricciones

No modificar:

ConsensusEngine

SignalNormalizer

SignalCollector

Motores

Adapters

UI

Stores

---

# 26. Archivos esperados

src/calibration/

ProbabilityCalibrator.js

CalibrationStrategy.js

CalibrationStrategyRegistry.js

IdentityCalibration.js

CalibrationVersion.js

CalibrationMetadata.js

CalibrationResultFactory.js

CalibrationInputValidator.js

contracts/

tests/calibration/

---

# 27. Informe obligatorio

Generar:

reports/calibration/

PHASE_2_2_PART1_ARCHITECTURE.md

Debe contener:

Resumen Ejecutivo

Arquitectura

Componentes

Diagrama

Contratos

Validaciones

Restricciones

Tests

Archivos creados

Archivos modificados

Problemas encontrados

Deuda técnica

Preparación para Parte II

---

# 28. Criterio GO

GO solamente si:

✓ infraestructura desacoplada

✓ Strategy Pattern

✓ Registry funcional

✓ IdentityCalibration

✓ contratos estables

✓ serialización correcta

✓ determinismo

✓ tests completos

✓ sin regresiones

---

# 29. Criterio NO-GO

NO-GO si:

acoplamiento con motores

modificación del consenso

API inestable

falta de Strategy Pattern

mutación del input

serialización incorrecta

regresiones

---

# 30. Regla final

No implementar todavía:

Histogram Calibration

Isotonic Regression

Platt Scaling

Beta Calibration

Machine Learning

Entrenamiento

Persistencia de modelos

Backtesting

Eso pertenece exclusivamente a:

FASE 2.2 — PARTE II

Finalizar únicamente cuando la infraestructura del ProbabilityCalibrator esté completamente preparada para recibir futuras estrategias de calibración sin modificar su arquitectura.
