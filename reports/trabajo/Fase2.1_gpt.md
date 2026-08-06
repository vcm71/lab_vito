# FASE 2.1 — IMPLEMENTACIÓN DEL CONSENSUS ENGINE EXPLICABLE

## Proyecto

**Roulette Tracker**
Nombre anterior: **ORION / Orion_v2**

## Módulo principal

```text
MotorConsensoCalibrado
```

## Componente de esta fase

```text
ConsensusEngine
```

## Clasificación

```text
FASE 2.1 — Núcleo de consenso explicable
```

---

# 1. Rol

Actúa como:

* arquitecto principal de software;
* ingeniero senior de JavaScript;
* especialista en sistemas estadísticos explicables;
* diseñador de contratos de datos;
* revisor de calidad;
* auditor de sesgos y dobles conteos.

Debes implementar exclusivamente la **Fase 2.1 — ConsensusEngine** dentro del proyecto **Roulette Tracker**.

No debes implementar todavía:

* calibración probabilística;
* backtesting;
* política de recomendaciones;
* aprendizaje automático;
* optimización automática de pesos;
* integración con interfaz gráfica.

La implementación debe consumir la salida del `SignalNormalizer` y producir un resultado de consenso trazable, determinístico, serializable y preparado para la futura fase `ProbabilityCalibrator`.

---

# 2. Estado confirmado del proyecto

Se consideran completadas y aceptadas las siguientes fases:

```text
Fase 0   — Auditoría arquitectónica
Fase 0.5 — Contrato ConsensusSignal
Fase 1.0 — Infraestructura base
Fase 1.1 — LabConAdapter
Fase 1.2 — LabCon1Adapter
Fase 1.3 — AtRepAdapter
Fase 1.4 — SignalCollector
Fase 2.0 — SignalNormalizer
Fase 2.0.1 — Auditoría y endurecimiento de SignalNormalizer
```

La Fase 2.0.1 terminó con:

```text
144 tests aprobados
0 errores de lint
0 warnings de lint
build exitoso
reloj inyectable
contadores corregidos
preservación explícita de "0" y "00"
```

Existe una observación no bloqueante:

```text
winWin.level continúa como categórico no numérico.
CATEGORICAL_LEVEL está registrado, pero no activo.
```

No corrijas esa observación dentro de esta fase salvo que una prueba demuestre que impide consumir el contrato.

---

# 3. Flujo arquitectónico vigente

El flujo actual es:

```text
Lab_Con
    ↓
LabConAdapter
         ┐
Lab_Con1 │
    ↓    │
LabCon1Adapter ├──► SignalCollector
         │
AtRep    │
    ↓    │
AtRepAdapter ┘
         ↓
SignalNormalizer
         ↓
ConsensusEngine
         ↓
ProbabilityCalibrator
         ↓
BacktestEvaluator
         ↓
RecommendationPolicy
```

Esta fase comienza exclusivamente en la salida del:

```text
SignalNormalizer
```

y termina en un resultado de consenso sin calibrar.

---

# 4. Objetivo principal

Implementar un motor de consenso explicable que combine señales normalizadas provenientes de varios motores sin ocultar:

* qué señales participaron;
* qué señales fueron descartadas;
* qué pesos se aplicaron;
* cuánto aportó cada señal;
* cuánto aportó cada motor;
* dónde hubo acuerdo;
* dónde hubo conflicto;
* cuánta evidencia estuvo disponible;
* qué limitaciones afectan al resultado.

El motor debe producir un:

```text
rawConsensusScore
```

pero no debe afirmar que dicho valor sea una probabilidad real.

---

# 5. Principio estadístico fundamental

El `ConsensusEngine` no predice por sí mismo.

El motor agrega evidencia producida por otros módulos.

Por lo tanto:

```text
rawConsensusScore ≠ probabilidad calibrada
```

El resultado solamente representa una medida interna de consenso bajo una configuración de pesos determinada.

No utilizar nombres como:

```text
winProbability
realProbability
predictionProbability
chanceOfWinning
sureBet
```

La futura Fase 2.2 será responsable de transformar, si la evidencia histórica lo permite, el consenso crudo en una probabilidad calibrada.

---

# 6. Objetivos específicos

La implementación debe:

1. recibir la colección enriquecida por `SignalNormalizer`;
2. validar su estructura;
3. seleccionar únicamente señales elegibles;
4. excluir señales inválidas o no numéricas;
5. resolver pesos configurables;
6. calcular aportes por señal;
7. calcular aportes por motor;
8. detectar acuerdos;
9. detectar conflictos;
10. calcular cobertura de evidencia;
11. generar un score de consenso crudo;
12. producir una confianza estructural separada;
13. producir explicaciones trazables;
14. conservar todos los datos originales;
15. soportar modo `strict`;
16. soportar modo `tolerant`;
17. preservar `"0"` y `"00"`;
18. evitar mutaciones;
19. ser determinístico;
20. permitir inyección de reloj;
21. preparar un contrato estable para `ProbabilityCalibrator`.

---

# 7. Inspección obligatoria antes de implementar

Antes de modificar código:

## 7.1 Inspeccionar directorios

```text
src/consensus/
tests/consensus/
reports/consensus/
```

## 7.2 Localizar y estudiar

```text
ConsensusSignal
consensusSignalFactory
validateConsensusSignal
cloneConsensusSignal
SignalCollector
SignalNormalizer
fieldConfiguration
normalization strategies
consensusConstants
src/consensus/index.js
```

## 7.3 Confirmar la forma real de salida

Determina la estructura exacta devuelta por:

```javascript
SignalNormalizer.normalize(...)
```

Confirma específicamente:

* `numbers`;
* `number`;
* `signals`;
* `normalizedSignals`;
* `metadata`;
* `warnings`;
* `normalization`;
* `valid`;
* `rawValue`;
* `normalizedValue`;
* `method`;
* `params`;
* estructura por motor;
* nombres reales de los motores.

## 7.4 Revisar pruebas

Lee los tests existentes para mantener:

* estilo;
* nomenclatura;
* patrones de fixtures;
* convenciones de assertions;
* imports;
* estructura de mocks;
* tratamiento de fechas;
* uso de `strict` y `tolerant`.

## 7.5 Ejecutar línea base

Antes de implementar:

```bash
npm run test
npm run lint
npm run build
```

Si existe:

```bash
npm run check:architecture
```

Ejecutarlo también.

Registra resultados reales.

No inventes resultados de comandos inexistentes.

---

# 8. Restricciones arquitectónicas obligatorias

La solución debe respetar:

* Clean Architecture;
* SOLID;
* Dependency Inversion;
* Open/Closed Principle;
* Single Responsibility Principle;
* separación entre consenso y calibración;
* separación entre cálculo y explicación;
* inyección de dependencias;
* contratos serializables;
* ausencia de dependencias del DOM;
* ausencia de dependencias de renderers;
* ausencia de dependencias de ViewModels;
* ausencia de dependencias de stores;
* determinismo;
* trazabilidad;
* copias defensivas;
* aislamiento de fallos;
* configuración explícita;
* mínimo estado mutable.

---

# 9. Arquitectura interna recomendada

Diseña el motor como una composición de responsabilidades pequeñas.

Arquitectura conceptual:

```text
ConsensusEngine
│
├── ConsensusInputValidator
├── ConsensusSignalSelector
├── ConsensusWeightResolver
├── ConsensusAggregator
├── ConsensusAgreementAnalyzer
├── ConsensusConflictDetector
├── ConsensusConfidenceEvaluator
├── ConsensusExplanationBuilder
└── ConsensusResultFactory
```

No es obligatorio crear exactamente ocho clases.

Puedes combinar componentes cuando:

* la responsabilidad siga siendo clara;
* no se genere una clase artificial;
* el diseño sea coherente con el proyecto.

No concentres toda la lógica en un único método de cientos de líneas.

---

# 10. Responsabilidades

## 10.1 ConsensusEngine

Debe orquestar el flujo.

No debe contener fórmulas específicas dispersas.

Responsabilidades:

1. validar entrada;
2. seleccionar señales;
3. resolver pesos;
4. agregar contribuciones;
5. analizar acuerdo;
6. detectar conflictos;
7. evaluar confianza;
8. construir explicación;
9. devolver resultado final.

## 10.2 SignalSelector

Debe decidir si una señal puede participar.

Debe excluir:

* `normalizedValue: null`;
* valores no finitos;
* booleanos no convertidos;
* strings categóricos sin mapeo numérico;
* objetos;
* arrays;
* campos no configurados para consenso;
* señales marcadas como inválidas;
* campos de metadata;
* evidencia descriptiva;
* `activeSets`;
* identificadores;
* versiones de esquema.

## 10.3 WeightResolver

Debe resolver pesos explícitos.

Debe soportar:

```text
peso por motor
peso por señal
peso efectivo
```

## 10.4 Aggregator

Debe calcular:

* contribución por señal;
* contribución por motor;
* score bruto;
* denominador efectivo;
* cobertura ponderada.

## 10.5 AgreementAnalyzer

Debe medir la coherencia entre motores sin afirmar causalidad.

## 10.6 ConflictDetector

Debe identificar discrepancias materiales entre motores.

## 10.7 ConfidenceEvaluator

Debe calcular confianza estructural, no probabilidad predictiva.

## 10.8 ExplanationBuilder

Debe producir una explicación estructurada y auditable.

## 10.9 ResultFactory

Debe construir el contrato final y aplicar copias defensivas.

---

# 11. Entrada del ConsensusEngine

La entrada debe ser la salida real del `SignalNormalizer`.

Ejemplo conceptual:

```javascript
{
  numbers: {
    "17": {
      number: "17",

      signals: {
        Lab_Con: {},
        Lab_Con1: {},
        AtRep: {}
      },

      normalizedSignals: {
        Lab_Con: {
          "delay.actualDelay": {
            rawValue: 12,
            normalizedValue: 0.72,
            method: "PERCENTILE",
            valid: true,
            params: {}
          }
        },

        Lab_Con1: {},

        AtRep: {}
      }
    }
  },

  metadata: {
    normalization: {}
  }
}
```

La estructura anterior es conceptual.

Usa la forma exacta del código real.

No crees adaptadores duplicados para convertir una salida que el motor ya puede consumir directamente.

---

# 12. Salida del ConsensusEngine

Diseña un contrato estable, versionado y serializable.

Ejemplo conceptual:

```javascript
{
  schemaVersion: "1.0.0",

  numbers: {
    "17": {
      number: "17",

      consensus: {
        rawConsensusScore: 0.7421,

        confidence: {
          score: 0.81,
          level: "HIGH",
          coverage: 0.92,
          agreement: 0.86,
          conflictPenalty: 0.04
        },

        contributions: {
          byEngine: {
            Lab_Con: {
              score: 0.71,
              effectiveWeight: 0.35,
              weightedContribution: 0.2485,
              validSignalCount: 3
            },

            Lab_Con1: {
              score: 0.77,
              effectiveWeight: 0.35,
              weightedContribution: 0.2695,
              validSignalCount: 4
            },

            AtRep: {
              score: 0.70,
              effectiveWeight: 0.30,
              weightedContribution: 0.21,
              validSignalCount: 2
            }
          },

          bySignal: {
            "Lab_Con.delay.actualDelay": {
              normalizedValue: 0.72,
              configuredWeight: 0.4,
              effectiveWeight: 0.14,
              weightedContribution: 0.1008,
              included: true
            }
          }
        },

        agreement: {
          score: 0.86,
          participatingEngines: 3,
          dispersion: 0.08
        },

        conflicts: [],

        exclusions: [],

        explanation: {
          summary: "Consenso alto con buena cobertura.",
          dominantEngines: ["Lab_Con1", "Lab_Con"],
          dominantSignals: [],
          warnings: []
        }
      },

      normalizedSignals: {}
    }
  },

  metadata: {
    consensus: {
      appliedAt: "2026-07-30T00:00:00.000Z",
      mode: "tolerant",
      strategy: "WEIGHTED_MEAN",
      processedNumbers: 38,
      validNumbers: 38,
      failedNumbers: 0,
      warnings: []
    }
  }
}
```

Adapta el diseño al contrato actual.

No elimines:

```text
signals
normalizedSignals
metadata previa
```

La salida debe enriquecer, no destruir.

---

# 13. Elegibilidad de señales

Define una configuración explícita de campos elegibles.

Ejemplo conceptual:

```javascript
const DEFAULT_CONSENSUS_CONFIGURATION = {
  Lab_Con: {
    engineWeight: 1,

    signals: {
      "delay.actualDelay": {
        weight: 1,
        direction: "POSITIVE"
      },

      "delay.delayRatio": {
        weight: 1,
        direction: "POSITIVE"
      }
    }
  }
};
```

No incluyas automáticamente todas las señales numéricas.

Una señal solamente puede participar cuando esté explícitamente configurada.

Esto evita que futuros campos añadidos entren silenciosamente en el consenso.

---

# 14. Configuración inicial conservadora

La configuración por defecto debe ser mínima y justificable.

Prioriza señales que:

* tengan valor normalizado numérico;
* tengan semántica estable;
* no dupliquen directamente otra señal;
* no sean metadata;
* no sean parámetros internos;
* no representen exactamente la misma transformación.

Antes de decidir qué campos entran, estudia su semántica real.

No incluyas campos solamente porque están disponibles.

---

# 15. Riesgo de doble conteo

Debes analizar relaciones como:

```text
actualDelay
maxDelay
delayRatio
delayScore
probabilityDelay
pressure
```

Es posible que varios campos provengan de la misma información base.

También:

```text
atraso
streakLength
streakBonus
recencyBonus
winWinScore
```

pueden estar matemáticamente relacionados.

Y:

```text
pciIndividual
pciCombined
```

pueden compartir componentes.

No debes asumir independencia estadística.

La configuración inicial debe evitar ponderar cinco veces la misma evidencia transformada.

## Regla

Cuando una señal sea derivada directamente de otra:

* documenta la dependencia;
* considera seleccionar únicamente la señal compuesta;
* o divide el peso dentro de un grupo;
* no asignes peso completo a todas.

---

# 16. Grupos de señales

Implementa soporte conceptual para grupos de señales correlacionadas.

Ejemplo:

```javascript
{
  group: "delay_intensity",
  groupWeight: 1,

  signals: {
    "delay.actualDelay": 0.3,
    "delay.delayRatio": 0.3,
    "delay.pressure": 0.4
  }
}
```

El peso total de un grupo no debe aumentar solo porque contiene más campos.

Esto evita:

```text
motor con más campos = motor con más influencia
```

La implementación puede usar:

* normalización de pesos dentro del grupo;
* peso máximo por grupo;
* promedio ponderado interno.

Documenta claramente la estrategia elegida.

---

# 17. Pesos por motor

Los pesos iniciales deben ser configurables.

No afirmar que un motor es predictivamente superior sin evidencia de backtesting.

La configuración por defecto recomendada es neutral:

```text
Lab_Con  = 1
Lab_Con1 = 1
AtRep    = 1
```

Los pesos efectivos pueden normalizarse entre los motores disponibles.

Ejemplo:

Con los tres motores disponibles:

```text
1/3
1/3
1/3
```

Con dos motores disponibles:

```text
1/2
1/2
```

Siempre que la política configurada sea renormalizar por disponibilidad.

---

# 18. Políticas de ausencia

Soporta explícitamente una política de señales ausentes.

Como mínimo, considera:

```text
RENORMALIZE_AVAILABLE
KEEP_CONFIGURED_DENOMINATOR
REQUIRE_MINIMUM_COVERAGE
```

## 18.1 RENORMALIZE_AVAILABLE

Los pesos se redistribuyen entre señales válidas.

Ventaja:

* evita penalizar automáticamente un número por falta de señal.

Riesgo:

* un número con poca evidencia puede obtener score extremo.

Debe combinarse con una confianza estructural baja.

## 18.2 KEEP_CONFIGURED_DENOMINATOR

Las señales ausentes aportan cero al numerador, pero conservan peso en el denominador.

Riesgo:

* confunde ausencia con evidencia negativa.

No usar como default salvo justificación.

## 18.3 REQUIRE_MINIMUM_COVERAGE

No producir score válido si la cobertura está bajo un umbral.

Debe producir:

```javascript
rawConsensusScore: null
```

y una exclusión estructurada.

## Default recomendado

```text
RENORMALIZE_AVAILABLE
```

junto con:

* cobertura reportada;
* confianza reducida;
* mínimo de motores participantes;
* mínimo de señales válidas.

---

# 19. Fórmula base de agregación

Implementa una media ponderada explícita.

Para señales válidas:

```text
score = Σ(valueᵢ × weightᵢ) / Σ(weightᵢ)
```

Condiciones:

* `valueᵢ` debe ser finito;
* `weightᵢ` debe ser finito;
* `weightᵢ >= 0`;
* la suma de pesos debe ser mayor que cero.

No permitas pesos negativos en esta fase.

La dirección de una señal debe tratarse separadamente.

---

# 20. Dirección de señales

Soporta:

```text
POSITIVE
NEGATIVE
NEUTRAL
```

## POSITIVE

Valor alto significa mayor intensidad para el consenso.

```text
effectiveValue = normalizedValue
```

## NEGATIVE

Valor bajo significa mayor intensidad.

Cuando el valor esté en `[0,1]`:

```text
effectiveValue = 1 - normalizedValue
```

No apliques esta fórmula a valores sin cota.

## NEUTRAL

No entra al score.

Puede conservarse como contexto o explicación.

## Regla

No asignes `NEGATIVE` por intuición.

La dirección debe quedar respaldada por:

* documentación;
* código;
* configuración explícita;
* tests.

---

# 21. Valores fuera de [0,1]

La auditoría determinó que existen campos `IDENTITY` en escala nativa:

```text
expectedDist
pciIndividual
pciCombined
```

Estos valores no deben entrar directamente en la media ponderada estándar si no están acotados a `[0,1]`.

Regla obligatoria:

```text
Una señal elegible para el score principal debe encontrarse en [0,1].
```

Si el valor está fuera del rango:

En modo `strict`:

```text
throw
```

cuando la configuración lo declare como señal ponderable.

En modo `tolerant`:

* excluir;
* registrar warning;
* registrar motivo;
* continuar.

Los valores nativos pueden permanecer en la explicación o en metadata contextual, pero no deben dominar el consenso.

---

# 22. Cálculo por motor

No combines todas las señales en un único plano.

Usa una jerarquía de dos niveles:

```text
Nivel 1: score interno por motor
Nivel 2: score global entre motores
```

## Nivel 1

Para cada motor:

```text
engineScore =
Σ(signalValue × signalWeight)
/
Σ(validSignalWeight)
```

## Nivel 2

```text
rawConsensusScore =
Σ(engineScore × engineWeight)
/
Σ(validEngineWeight)
```

Ventaja:

* evita que el motor con más señales tenga más influencia;
* permite medir acuerdo entre motores;
* mejora explicabilidad;
* permite incorporar nuevos motores.

---

# 23. Contribuciones por señal

Para cada señal incluida, registrar:

```javascript
{
  engine: "Lab_Con",
  field: "delay.delayRatio",
  rawValue: 0.8,
  normalizedValue: 0.8,
  effectiveValue: 0.8,
  direction: "POSITIVE",
  configuredWeight: 0.4,
  normalizedWeightWithinEngine: 0.35,
  weightedContribution: 0.28,
  included: true,
  reason: null
}
```

Para cada señal excluida:

```javascript
{
  engine: "AtRep",
  field: "pci.pciCombined",
  rawValue: 1.43,
  normalizedValue: 1.43,
  included: false,
  reason: "OUT_OF_CONSENSUS_RANGE"
}
```

---

# 24. Contribuciones por motor

Para cada motor registrar:

```javascript
{
  configuredWeight: 1,
  effectiveWeight: 0.333333,
  score: 0.72,
  weightedContribution: 0.24,
  availableSignalWeight: 0.8,
  configuredSignalWeight: 1,
  coverage: 0.8,
  validSignalCount: 3,
  excludedSignalCount: 2
}
```

---

# 25. Acuerdo entre motores

Implementa una medida simple, auditable y estable.

No uses modelos estadísticos complejos en esta fase.

Una opción recomendada:

```text
dispersion = desviación estándar de engineScores válidos
agreement = clamp(1 - normalizedDispersion, 0, 1)
```

Dado que los scores están en `[0,1]`, puede usarse una normalización explícita.

Otra opción aceptable:

```text
agreement = 1 - (maxScore - minScore)
```

La decisión debe:

* estar documentada;
* ser determinística;
* devolver `[0,1]`;
* manejar uno, dos o tres motores;
* no afirmar significancia estadística.

## Caso con un solo motor

No declarar acuerdo alto.

Debe diferenciarse:

```text
agreement calculable
```

de:

```text
solo hay una fuente
```

Recomendación:

```javascript
agreement: {
  score: null,
  calculable: false,
  reason: "INSUFFICIENT_ENGINES"
}
```

---

# 26. Detección de conflictos

Un conflicto representa discrepancia entre motores, no un error.

Ejemplo:

```text
Lab_Con  = 0.90
Lab_Con1 = 0.85
AtRep    = 0.15
```

El sistema debe detectar que AtRep contradice a los otros motores.

Implementa reglas configurables.

Ejemplo:

```text
CONFLICT_SPREAD_THRESHOLD = 0.5
```

Un conflicto puede registrarse como:

```javascript
{
  type: "ENGINE_DIVERGENCE",
  severity: "HIGH",
  engines: ["Lab_Con", "AtRep"],
  scoreDifference: 0.75,
  threshold: 0.5,
  messageCode: "ENGINE_SCORES_DIVERGE"
}
```

No generes textos excesivamente interpretativos dentro del núcleo matemático.

Prefiere códigos y datos estructurados.

---

# 27. Tipos de conflicto

Como mínimo, contempla:

```text
ENGINE_DIVERGENCE
INSUFFICIENT_COVERAGE
DOMINANT_SINGLE_ENGINE
INVALID_SIGNAL_RANGE
MISSING_REQUIRED_ENGINE
ZERO_EFFECTIVE_WEIGHT
```

No todos deben bloquear el score.

Cada conflicto debe contener:

* tipo;
* severidad;
* entidad afectada;
* valores observados;
* umbral;
* código;
* blocking.

---

# 28. Confianza estructural

La confianza no debe ser una probabilidad predictiva.

Debe representar la calidad estructural del consenso.

Puede depender de:

```text
coverage
agreement
engineParticipation
conflictPenalty
validSignalRatio
```

Ejemplo conceptual:

```text
confidence =
coverageComponent
× participationComponent
× agreementComponent
× conflictComponent
```

O una media ponderada.

Debe ser:

* explícita;
* configurable;
* auditable;
* acotada en `[0,1]`;
* separada de `rawConsensusScore`.

No ocultes la fórmula.

---

# 29. Componentes sugeridos de confianza

## 29.1 Coverage

```text
peso disponible / peso configurado
```

## 29.2 Participation

Ejemplo con tres motores configurados:

```text
3 motores válidos → 1.0
2 motores válidos → 0.67
1 motor válido    → 0.33
0 motores válidos → 0
```

## 29.3 Agreement

Usar solamente cuando sea calculable.

Con un solo motor, aplicar una política explícita, no `agreement = 1`.

## 29.4 Conflict penalty

Ejemplo:

```text
ningún conflicto       → 1.0
conflicto bajo         → 0.9
conflicto medio        → 0.75
conflicto alto         → 0.5
conflicto bloqueante   → 0
```

Estos valores deben ser configuración, no números mágicos dispersos.

---

# 30. Niveles de confianza

Transforma el score estructural en etiquetas solamente para explicación:

```text
VERY_LOW
LOW
MEDIUM
HIGH
VERY_HIGH
```

Umbrales configurables.

Ejemplo:

```text
[0.00, 0.20) → VERY_LOW
[0.20, 0.40) → LOW
[0.40, 0.60) → MEDIUM
[0.60, 0.80) → HIGH
[0.80, 1.00] → VERY_HIGH
```

No utilizar términos:

```text
seguro
ganador
garantizado
probable
apuesta recomendada
```

---

# 31. Cobertura

Registrar al menos:

```text
configuredEngines
participatingEngines
configuredSignals
validSignals
excludedSignals
configuredWeight
availableWeight
coverageRatio
```

La cobertura debe calcularse sobre pesos, no únicamente sobre cantidad de campos.

---

# 32. Explicabilidad

Cada resultado debe poder explicar:

1. qué motores participaron;
2. qué score produjo cada motor;
3. qué señales participaron;
4. qué señales fueron excluidas;
5. qué pesos fueron aplicados;
6. qué motor tuvo mayor aporte;
7. cuál fue el nivel de acuerdo;
8. si existieron conflictos;
9. cuánto dato faltó;
10. por qué el resultado es válido o inválido.

---

# 33. Explicación estructurada

Prioriza datos estructurados.

Ejemplo:

```javascript
{
  summaryCode: "HIGH_SCORE_HIGH_COVERAGE",

  dominantEngine: "Lab_Con1",

  dominantSignals: [
    {
      engine: "Lab_Con1",
      field: "winWin.winWinScore",
      contribution: 0.18
    }
  ],

  positiveFactors: [
    "MULTI_ENGINE_SUPPORT",
    "HIGH_SIGNAL_COVERAGE"
  ],

  limitingFactors: [
    "ATREP_PARTIAL_COVERAGE"
  ],

  warningCodes: []
}
```

Los textos humanos pueden generarse mediante un formatter separado.

No mezcles lógica matemática con traducciones o UI.

---

# 34. Resultado inválido

Cuando no exista suficiente evidencia:

```javascript
{
  rawConsensusScore: null,

  valid: false,

  invalidReason: "INSUFFICIENT_EVIDENCE",

  confidence: {
    score: 0,
    level: "VERY_LOW"
  }
}
```

No devolver automáticamente:

```text
0
0.5
```

porque esos valores podrían interpretarse como resultados reales.

---

# 35. Strict y tolerant

## Strict

Debe fallar ante:

* entrada estructuralmente inválida;
* número inválido;
* configuración desconocida;
* peso negativo;
* peso no finito;
* estrategia inexistente;
* señal configurada fuera de rango;
* duplicación estructural;
* contrato de salida inválido.

## Tolerant

Debe:

* aislar el número o señal afectada;
* registrar warnings;
* excluir valores inválidos;
* continuar con el resto;
* no convertir silenciosamente errores en cero;
* preservar información cruda.

---

# 36. Configuración

Diseña una configuración central.

Ejemplo conceptual:

```javascript
const DEFAULT_CONSENSUS_CONFIG = {
  mode: "tolerant",

  aggregation: {
    strategy: "HIERARCHICAL_WEIGHTED_MEAN",
    missingPolicy: "RENORMALIZE_AVAILABLE"
  },

  requirements: {
    minimumEngines: 2,
    minimumCoverage: 0.4,
    minimumValidSignals: 2
  },

  conflict: {
    spreadThresholds: {
      low: 0.25,
      medium: 0.40,
      high: 0.60
    }
  },

  engines: {
    Lab_Con: {
      weight: 1,
      signals: {}
    },

    Lab_Con1: {
      weight: 1,
      signals: {}
    },

    AtRep: {
      weight: 1,
      signals: {}
    }
  }
};
```

Los valores definitivos deben estar justificados en el informe.

---

# 37. No inventar superioridad predictiva

No establecer pesos como:

```text
Lab_Con  = 0.6
Lab_Con1 = 0.3
AtRep    = 0.1
```

sin evidencia histórica.

Antes del backtesting, los pesos por motor deben ser neutrales o claramente etiquetados como configuración inicial provisional.

---

# 38. Selección inicial de señales

Debes inspeccionar el código para decidir el conjunto mínimo.

Una propuesta conceptual que debe validarse es:

## Lab_Con

Posibles candidatos:

```text
delay.delayRatio
delay.delayScore
delay.pressure
```

Evitar usar todos simultáneamente si son derivados de la misma base.

## Lab_Con1

Posibles candidatos:

```text
winWin.isActive
winWin.streakLength
winWin.winWinScore
```

Evitar doble conteo entre `streakLength`, bonuses y `winWinScore`.

## AtRep

Posibles candidatos:

```text
pci.occurrences
pci.meanDist
```

Los campos:

```text
pci.expectedDist
pci.pciIndividual
pci.pciCombined
```

no deben participar directamente si permanecen fuera de `[0,1]`.

Esta lista no es una orden.

Debes confirmar la semántica real.

---

# 39. Señales binarias

`winWin.isActive` puede participar como `0` o `1`.

Sin embargo, evalúa si:

```text
isActive
```

ya está representado en:

```text
winWinScore
```

Si es derivado o redundante, evita darle peso completo adicional.

---

# 40. Señales categóricas

`winWin.level` permanece como string.

No debe entrar al score numérico.

Puede utilizarse para explicación:

```javascript
context: {
  level: "WIN-WIN(3)"
}
```

No parsees manualmente el string dentro del `ConsensusEngine`.

No actives `CATEGORICAL_LEVEL` en esta fase.

---

# 41. activeSets

`activeSets` debe conservarse como evidencia.

No convertir:

* cantidad de sets;
* nombres de sets;
* posición del set;

en una puntuación nueva dentro de esta fase.

---

# 42. Determinismo

Soporta reloj inyectable:

```javascript
new ConsensusEngine({
  clock: () => "2026-07-30T00:00:00.000Z"
});
```

Con la misma:

* entrada;
* configuración;
* reloj;

la salida debe ser profundamente igual.

Ordena claves o listas cuando el orden pueda depender de inserción incidental.

---

# 43. Precisión numérica

Define una política clara.

No redondees durante cálculos intermedios.

Puedes redondear únicamente en la salida, mediante una función centralizada y configurable.

Ejemplo:

```text
precision: 12
```

No usar `toFixed()` para almacenar números, porque devuelve strings.

Evita acumulación innecesaria de error flotante.

---

# 44. Empates

Dos números con la misma entrada y configuración deben obtener exactamente:

* mismo score;
* misma confianza;
* mismo acuerdo;
* mismas contribuciones;

excepto por el campo `number`.

No introduzcas desempates artificiales.

No ordenar por número para romper empate dentro del motor.

El ranking corresponde a una capa posterior.

---

# 45. Orden de números

La salida debe preservar el universo americano:

```text
"0"
"00"
"1"
...
"36"
```

cuando la entrada lo contenga.

Usa:

```text
AMERICAN_ROULETTE_NUMBERS
```

si existe como constante compartida.

No recrees otra lista manual.

No conviertas claves a números.

---

# 46. Copias defensivas

No modificar:

* entrada;
* `numbers`;
* `signals`;
* `normalizedSignals`;
* arrays;
* warnings;
* evidence;
* metadata;
* params;
* provenance.

La salida no debe compartir referencias mutables con la entrada, salvo que el contrato existente documente expresamente otra política.

Debido a que la auditoría de Fase 2.0.1 indicó referencias compartidas en `signals`, el `ConsensusEngine` debe evitar ampliar esa dependencia.

Preferencia:

```text
salida defensivamente clonada
```

Añade pruebas de mutación bidireccional:

```text
mutar output no afecta input
mutar input después no afecta output
```

---

# 47. API pública

Ejemplo conceptual:

```javascript
const engine = new ConsensusEngine({
  mode: "tolerant",
  config: DEFAULT_CONSENSUS_CONFIG,
  clock: () => new Date().toISOString()
});

const result = engine.compute(normalizedOutput);
```

También puede usarse:

```javascript
engine.evaluate(...)
engine.calculate(...)
```

Elige el verbo más coherente con el proyecto.

No expongas múltiples métodos redundantes.

---

# 48. Registro de estrategias

La arquitectura debe permitir agregar futuros agregadores.

Ejemplo:

```text
HIERARCHICAL_WEIGHTED_MEAN
ROBUST_WEIGHTED_MEAN
MEDIAN_CONSENSUS
TRIMMED_MEAN
```

En esta fase implementa solamente:

```text
HIERARCHICAL_WEIGHTED_MEAN
```

No añadas algoritmos sin uso.

---

# 49. Archivos sugeridos

Adapta nombres a la estructura real.

Posibles archivos:

```text
src/consensus/engine/ConsensusEngine.js
src/consensus/engine/ConsensusAggregator.js
src/consensus/engine/ConsensusWeightResolver.js
src/consensus/engine/ConsensusAgreementAnalyzer.js
src/consensus/engine/ConsensusConflictDetector.js
src/consensus/engine/ConsensusConfidenceEvaluator.js
src/consensus/engine/ConsensusExplanationBuilder.js
src/consensus/engine/consensusConfiguration.js
src/consensus/engine/index.js
```

También:

```text
src/consensus/contracts/consensusResultValidator.js
```

solamente si la estructura actual de contratos lo justifica.

---

# 50. Archivos permitidos

Modificar o crear únicamente en:

```text
src/consensus/engine/
src/consensus/contracts/
src/consensus/constants/
src/consensus/validators/
src/consensus/index.js
tests/consensus/
reports/consensus/
```

Modificar `package.json` solamente si es imprescindible para agregar un comando de test legítimo.

---

# 51. Archivos prohibidos

No modificar:

```text
labEngine.js
labCon1Engine.js
atRepEngine.js
atRepRenderer.js
atRepViewModel.js
main.js
RouletteTracker.js
SpinManager.js
DelayManager.js
rouletteSettingsStore.js
rouletteSpinsStore.js
UI
renderers
ViewModels
stores
tracker
```

No modificar:

```text
LabConAdapter
LabCon1Adapter
AtRepAdapter
SignalCollector
SignalNormalizer
normalization strategies
fieldConfiguration
```

salvo incompatibilidad crítica demostrable.

Si existe una incompatibilidad:

1. documentarla;
2. crear un test que la demuestre;
3. no ampliar el cambio;
4. aplicar solamente la corrección mínima;
5. registrarla claramente en el informe.

---

# 52. Funcionalidades prohibidas

No implementar:

* ProbabilityCalibrator;
* probabilidad real;
* calibración isotónica;
* Platt scaling;
* regresión logística;
* backtesting;
* walk-forward;
* RecommendationPolicy;
* ranking de apuestas;
* selección automática de números;
* ROI;
* Kelly criterion;
* gestión de banca;
* aprendizaje de pesos;
* MetaModel;
* persistencia;
* UI;
* gráficos;
* almacenamiento histórico;
* modificación de motores estadísticos;
* commit automático;
* push remoto.

---

# 53. Validaciones estructurales

Valida:

* entrada objeto;
* propiedad `numbers`;
* claves de ruleta válidas;
* número interno consistente con la clave;
* `normalizedSignals` objeto;
* configuración conocida;
* pesos válidos;
* direcciones conocidas;
* políticas conocidas;
* rangos válidos;
* output serializable;
* ausencia de referencias circulares.

---

# 54. Contrato de warnings

Usa warnings estructurados.

Ejemplo:

```javascript
{
  code: "CONSENSUS_SIGNAL_EXCLUDED",
  number: "17",
  engine: "AtRep",
  field: "pci.pciCombined",
  reason: "VALUE_OUTSIDE_UNIT_INTERVAL",
  value: 1.42,
  severity: "WARNING"
}
```

No dependas únicamente de mensajes humanos.

---

# 55. Contrato de exclusiones

Cada exclusión debe registrar:

```text
number
engine
field
rawValue
normalizedValue
reason
blocking
```

Razones sugeridas:

```text
NOT_CONFIGURED
INVALID_NORMALIZED_VALUE
NON_NUMERIC_VALUE
VALUE_OUTSIDE_UNIT_INTERVAL
INVALID_WEIGHT
MISSING_SIGNAL
INSUFFICIENT_COVERAGE
ENGINE_UNAVAILABLE
CATEGORICAL_NOT_NUMERIC
```

---

# 56. Tests obligatorios

Crea pruebas unitarias e integración suficientes.

## 56.1 Constructor

* configuración por defecto;
* modo por defecto;
* `strict`;
* `tolerant`;
* reloj inyectable;
* configuración personalizada;
* rechazo de modo inválido;
* rechazo de configuración inválida.

## 56.2 Pesos

* pesos iguales;
* pesos personalizados;
* normalización de pesos;
* peso cero;
* peso negativo;
* peso `NaN`;
* peso infinito;
* motor sin peso;
* señal sin peso;
* suma cero.

## 56.3 Agregación por señal

* una señal;
* varias señales;
* señales con pesos distintos;
* señal ausente;
* señal inválida;
* señal fuera de rango;
* señal con valor cero;
* señal con valor uno;
* señales idénticas.

## 56.4 Agregación por motor

* un motor;
* dos motores;
* tres motores;
* motor ausente;
* motor sin señales válidas;
* motor con peso cero;
* motores con diferente número de señales;
* independencia respecto a cantidad de campos.

## 56.5 Jerarquía

Comprobar que un motor con diez señales no domina automáticamente a uno con dos señales cuando ambos tienen el mismo peso de motor.

## 56.6 Política de ausencia

* `RENORMALIZE_AVAILABLE`;
* cobertura completa;
* cobertura parcial;
* cobertura bajo mínimo;
* cero señales;
* un único motor;
* mínimo de motores incumplido.

## 56.7 Dirección

* `POSITIVE`;
* `NEGATIVE`;
* `NEUTRAL`;
* dirección inválida;
* inversión sobre `[0,1]`;
* rechazo de inversión fuera de rango.

## 56.8 Acuerdo

* tres motores idénticos;
* dos motores idénticos;
* motores cercanos;
* motores divergentes;
* un solo motor;
* cero motores;
* acuerdo acotado en `[0,1]`.

## 56.9 Conflictos

* sin conflicto;
* conflicto bajo;
* conflicto medio;
* conflicto alto;
* motor dominante;
* señal fuera de rango;
* cobertura insuficiente;
* conflicto bloqueante.

## 56.10 Confianza

* cobertura completa;
* cobertura parcial;
* acuerdo alto;
* acuerdo bajo;
* conflicto alto;
* un motor;
* tres motores;
* score acotado;
* nivel categórico correcto;
* diferencia entre confianza y consenso.

## 56.11 Explicaciones

* motor dominante;
* señal dominante;
* exclusiones;
* warnings;
* conflictos;
* resumen estructurado;
* ausencia de textos predictivos prohibidos.

## 56.12 Strict

* entrada inválida;
* peso negativo;
* campo configurado fuera de rango;
* dirección desconocida;
* política desconocida;
* número inválido;
* estructura inconsistente.

## 56.13 Tolerant

* excluye señal defectuosa;
* continúa con señales restantes;
* registra warning;
* no convierte `null` en cero;
* invalida solo el número cuando corresponde;
* continúa procesando otros números.

## 56.14 Ruleta americana

* `"0"` preservado;
* `"00"` preservado;
* claves independientes;
* ambos calculados;
* no colisión;
* 38 números cuando la entrada está completa.

## 56.15 Inmutabilidad

* no muta input;
* no muta signals;
* no muta normalizedSignals;
* no muta metadata;
* no comparte arrays;
* no comparte objetos;
* acepta entrada profundamente congelada;
* mutar output no afecta input;
* mutar input no afecta output.

## 56.16 Determinismo

Con misma entrada, configuración y reloj:

```text
deepEqual(output1, output2)
```

## 56.17 Precisión

* decimales repetidos;
* acumulación de pesos;
* resultados finitos;
* ausencia de `NaN`;
* ausencia de `Infinity`;
* score dentro de `[0,1]`.

## 56.18 Integración real

Crear test utilizando:

```text
adapters
→ SignalCollector
→ SignalNormalizer
→ ConsensusEngine
```

No usar los motores directamente si ya existen fixtures apropiados.

Comprobar que el flujo completo funciona sin UI.

---

# 57. Casos matemáticos mínimos

## Caso A — Consenso perfecto

```text
Lab_Con  = 0.8
Lab_Con1 = 0.8
AtRep    = 0.8
```

Esperado:

```text
rawConsensusScore = 0.8
agreement máximo
sin conflictos
confianza alta si cobertura completa
```

## Caso B — Conflicto

```text
Lab_Con  = 0.9
Lab_Con1 = 0.85
AtRep    = 0.1
```

Esperado:

```text
score intermedio
acuerdo bajo
conflicto registrado
confianza penalizada
```

## Caso C — Solo un motor

```text
Lab_Con = 0.9
```

Esperado:

```text
score calculable o inválido según configuración
agreement no calculable
confianza reducida
dominantSingleEngine
```

## Caso D — Señales ausentes

Dos de cuatro señales válidas.

Esperado:

```text
pesos renormalizados
coverage = peso válido / peso configurado
confianza reducida
```

## Caso E — Valor nativo fuera de rango

```text
pciCombined = 1.8
```

Esperado:

```text
excluido del score
warning
rawValue preservado
```

## Caso F — Cero válido

```text
normalizedValue = 0
```

Esperado:

```text
incluido
no tratado como ausencia
```

## Caso G — Null

```text
normalizedValue = null
```

Esperado:

```text
excluido
no convertido en 0
```

---

# 58. Metadatos globales

La salida debe incluir metadata similar a:

```javascript
{
  consensus: {
    appliedAt: "...",
    schemaVersion: "1.0.0",
    mode: "tolerant",
    aggregationStrategy: "HIERARCHICAL_WEIGHTED_MEAN",
    missingPolicy: "RENORMALIZE_AVAILABLE",
    processedNumbers: 38,
    validNumbers: 35,
    invalidNumbers: 3,
    warnings: [],
    configurationSummary: {}
  }
}
```

No incluir funciones o instancias de clases en la salida.

---

# 59. Validación del resultado

Crea un validador o assertions internas que comprueben:

```text
rawConsensusScore es null o finito en [0,1]
confidence.score es finito en [0,1]
agreement.score es null o finito en [0,1]
weights son finitos y no negativos
contributions son finitas
number es válido
salida es serializable
```

---

# 60. Compatibilidad futura con ProbabilityCalibrator

La salida debe facilitar la Fase 2.2.

Debe proveer claramente:

```text
number
rawConsensusScore
confidence.score
coverage
agreement
engineScores
timestamp
configurationVersion
valid
```

No debe requerir que `ProbabilityCalibrator` vuelva a interpretar todas las señales individuales.

Sin embargo, conserva contribuciones para auditoría.

---

# 61. Versionado de configuración

Incluye una versión explícita:

```text
configurationVersion
```

Ejemplo:

```text
consensus-default-v1
```

Esto será necesario para:

* backtesting;
* comparar configuraciones;
* reproducir resultados;
* evitar mezclar series históricas con pesos distintos.

---

# 62. Informe obligatorio

Genera:

```text
reports/consensus/PHASE_2_1_CONSENSUS_ENGINE.md
```

Debe contener:

1. resumen ejecutivo;
2. objetivo;
3. alcance;
4. estado inicial;
5. línea base de tests;
6. arquitectura seleccionada;
7. componentes creados;
8. contrato de entrada;
9. contrato de salida;
10. señales seleccionadas;
11. señales excluidas;
12. análisis de redundancias;
13. configuración de pesos;
14. justificación de pesos;
15. estrategia de agregación;
16. política de ausencia;
17. cálculo de cobertura;
18. cálculo de acuerdo;
19. detección de conflictos;
20. fórmula de confianza;
21. explicabilidad;
22. strict y tolerant;
23. determinismo;
24. copias defensivas;
25. preservación de `"0"` y `"00"`;
26. archivos creados;
27. archivos modificados;
28. tests añadidos;
29. resultados de tests;
30. resultados de lint;
31. resultado de build;
32. resultado de arquitectura;
33. riesgos;
34. limitaciones;
35. deuda técnica;
36. elementos expresamente no implementados;
37. compatibilidad con ProbabilityCalibrator;
38. decisión `GO` o `NO-GO`;
39. recomendación para Fase 2.2.

---

# 63. Criterios de aceptación

Declarar `GO` únicamente si:

* existe `ConsensusEngine`;
* consume la salida real de `SignalNormalizer`;
* no modifica motores;
* no modifica UI;
* usa agregación jerárquica;
* evita dominancia por número de señales;
* utiliza configuración explícita;
* conserva trazabilidad por señal;
* conserva trazabilidad por motor;
* calcula cobertura;
* calcula acuerdo;
* detecta conflictos;
* calcula confianza estructural;
* diferencia consenso de probabilidad;
* excluye señales fuera de `[0,1]`;
* no usa pesos negativos;
* maneja ausencia;
* soporta `strict`;
* soporta `tolerant`;
* no muta entradas;
* es determinístico;
* preserva `"0"` y `"00"`;
* produce salida serializable;
* todos los tests pasan;
* lint no presenta errores nuevos;
* build exitoso;
* no hay regresiones;
* informe completo.

Si falla cualquiera de los criterios críticos:

```text
NO-GO
```

---

# 64. Ejecución de validaciones

Antes:

```bash
npm run test
npm run lint
npm run build
```

Después:

```bash
npm test -- tests/consensus
npm run test
npm run lint
npm run build
```

Si existe:

```bash
npm run check:architecture
```

Ejecutarlo.

Registra:

* comando;
* código de salida;
* número de tests;
* errores;
* warnings;
* duración cuando esté disponible.

---

# 65. Salida final en consola

Al terminar, mostrar exactamente una síntesis con este formato:

```text
FASE 2.1 — CONSENSUS ENGINE EXPLICABLE

Estado:
GO / NO-GO

Estrategia:
HIERARCHICAL_WEIGHTED_MEAN

Política de ausencia:
RENORMALIZE_AVAILABLE

Motores configurados:
- Lab_Con
- Lab_Con1
- AtRep

Señales incluidas:
- ...

Señales excluidas:
- ...

Archivos creados:
- ...

Archivos modificados:
- ...

Tests añadidos:
- ...

Resultados:
- Tests focalizados: ...
- Suite completa: ...
- Lint: ...
- Build: ...
- Arquitectura: ...

Regresiones:
- Ninguna / detallar

Motores estadísticos modificados:
- Ninguno / incumplimiento

SignalCollector modificado:
- No / justificar

SignalNormalizer modificado:
- No / justificar

UI modificada:
- No / incumplimiento

Informe:
reports/consensus/PHASE_2_1_CONSENSUS_ENGINE.md

Próxima fase sugerida:
FASE 2.2 — ProbabilityCalibrator
```

---

# 66. Regla de mínima intervención

No realizar:

* refactorizaciones cosméticas;
* renombrados masivos;
* reordenamientos sin necesidad;
* cambios de formato ajenos;
* actualización de dependencias;
* correcciones incidentales;
* cambios en motores;
* cambios en UI.

Cada archivo modificado debe tener relación directa con esta fase.

---

# 67. Regla de honestidad estadística

No afirmar que el consenso demuestra:

* predicción;
* causalidad;
* ventaja de casino;
* probabilidad real;
* rentabilidad;
* patrón explotable;
* certeza.

El informe debe indicar que el score es una agregación interna pendiente de calibración y validación histórica.

---

# 68. Regla final

Implementa una solución:

```text
mínima
robusta
explicable
determinística
configurable
serializable
auditable
extensible
```

Prioriza:

```text
claridad matemática
separación de responsabilidades
evitar doble conteo
trazabilidad
compatibilidad
tests
mínimo cambio
```

No avances a `ProbabilityCalibrator`.

No generes recomendaciones.

No generes ranking.

No realices commits ni push.

Finaliza únicamente cuando exista evidencia objetiva para declarar:

```text
GO
```

o:

```text
NO-GO
```
