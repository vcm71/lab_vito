# FASE 2.1.1 — AUDITORÍA MATEMÁTICA Y CONTRACTUAL DEL CONSENSUS ENGINE

## Proyecto

**Roulette Tracker**
Nombre anterior: **ORION / Orion_v2**

## Módulo

```text
MotorConsensoCalibrado
```

## Componente auditado

```text
ConsensusEngine
```

## Tipo de fase

```text
Microfase de auditoría y endurecimiento
```

---

# 1. Rol

Actúa como:

* arquitecto principal de software;
* auditor técnico senior;
* especialista en agregación estadística;
* revisor de contratos de datos;
* especialista en pruebas matemáticas;
* auditor de sesgos, redundancias y dobles conteos.

Tu misión es auditar y endurecer la implementación existente de:

```text
FASE 2.1 — ConsensusEngine
```

No debes implementar nuevas funcionalidades de negocio.

No debes avanzar a:

```text
ProbabilityCalibrator
BacktestEvaluator
RecommendationPolicy
```

Esta fase debe determinar si el `ConsensusEngine` es una base matemática y contractual confiable para comenzar la calibración.

---

# 2. Estado de partida confirmado

La Fase 2.1 reporta:

```text
ConsensusEngine implementado
Agregación jerárquica ponderada
Pesos neutrales 1:1:1
7 señales seleccionadas
42 tests nuevos
186/186 tests aprobados
Lint limpio
Build exitoso
```

Arquitectura reportada:

```text
SignalNormalizer output
  → ConsensusEngine.compute()
    → _extractValidSignals
    → _aggregateEngineScores
    → _aggregateGlobalScore
    → _computeAgreement
    → _detectConflicts
    → _evaluateConfidence
    → _buildExplanation
    → structuralClone
```

Archivos principales reportados:

```text
src/consensus/engine/consensusConfiguration.js
src/consensus/engine/ConsensusEngine.js
src/consensus/engine/index.js
tests/consensus/ConsensusEngine.test.js
```

El archivo principal tiene aproximadamente:

```text
724 líneas
```

La auditoría debe comprobar el código real y no asumir que el informe es suficiente.

---

# 3. Objetivo principal

Verificar formalmente que el `ConsensusEngine`:

* sea matemáticamente estable;
* no duplique evidencia;
* no mezcle conceptos contractuales;
* no produzca confianza artificial;
* no interprete ausencia como señal negativa;
* no transforme consenso en probabilidad;
* conserve trazabilidad;
* sea determinístico;
* sea mantenible;
* entregue un contrato apto para `ProbabilityCalibrator`.

Al finalizar debes emitir:

```text
GO
```

o:

```text
NO-GO
```

respecto a iniciar:

```text
FASE 2.2 — ProbabilityCalibrator
```

---

# 4. Alcance estricto

Esta fase puede:

* inspeccionar;
* medir;
* documentar;
* añadir pruebas;
* corregir errores demostrables;
* realizar refactorización interna mínima;
* aclarar configuración y contratos;
* corregir fórmulas inestables;
* mejorar determinismo;
* corregir metadatos inconsistentes.

Esta fase no puede:

* añadir nuevos motores;
* cambiar el significado estadístico de motores existentes;
* optimizar pesos con datos históricos;
* implementar calibración;
* crear recomendaciones;
* crear ranking;
* modificar UI;
* modificar stores;
* modificar trackers;
* introducir machine learning;
* incorporar dependencias externas sin necesidad crítica.

---

# 5. Inspección obligatoria inicial

Antes de modificar código:

## 5.1 Revisar archivos

```text
src/consensus/engine/ConsensusEngine.js
src/consensus/engine/consensusConfiguration.js
src/consensus/engine/index.js
src/consensus/index.js
tests/consensus/ConsensusEngine.test.js
tests/consensus/consensusExports.test.js
```

## 5.2 Revisar dependencias

```text
SignalNormalizer
fieldConfiguration
ConsensusSignal
consensusSignalFactory
consensus validators
consensus constants
structuralClone
AMERICAN_ROULETTE_NUMBERS
```

## 5.3 Ejecutar línea base

```bash
npm run test
npm run lint
npm run build
```

Si existe:

```bash
npm run check:architecture
```

Registrar:

* comando;
* código de salida;
* tests aprobados;
* tests fallidos;
* warnings;
* errores;
* duración.

No inventar resultados.

---

# 6. Punto 1 — Auditoría de la métrica de acuerdo

La implementación reporta:

```text
agreement = 1 - (σ / μ)
```

donde:

```text
σ = desviación estándar de engineScores
μ = media de engineScores
```

Debes localizar la fórmula exacta y comprobar:

* tratamiento de `μ = 0`;
* tratamiento de `μ` cercano a cero;
* valores negativos;
* `NaN`;
* `Infinity`;
* clamp;
* uno, dos y tres motores;
* estabilidad numérica;
* interpretación conceptual.

---

# 7. Casos obligatorios para acuerdo

Crear pruebas explícitas para:

## Caso A — Todos en cero

```text
0.00
0.00
0.00
```

Esperado:

* sin división por cero;
* sin `NaN`;
* sin `Infinity`;
* acuerdo definido explícitamente.

## Caso B — Valores bajos y cercanos

```text
0.01
0.02
0.01
```

Comprobar si el CV penaliza de forma desproporcionada.

## Caso C — Valores medios y cercanos

```text
0.50
0.51
0.49
```

## Caso D — Valores altos y cercanos

```text
0.98
0.99
0.97
```

## Caso E — Divergencia fuerte

```text
0.90
0.85
0.10
```

## Caso F — Divergencia simétrica

```text
0.10
0.50
0.90
```

## Caso G — Dos motores

```text
0.20
0.80
```

## Caso H — Un motor

```text
0.75
```

Debe producir:

```text
calculable = false
```

No debe fingir acuerdo.

---

# 8. Comparación de métricas de acuerdo

Comparar mediante tests y tabla al menos:

## Métrica actual

```text
1 - coefficientOfVariation
```

## Alternativa A

```text
1 - (maxScore - minScore)
```

## Alternativa B

Desviación estándar normalizada para variables acotadas en `[0,1]`.

Por ejemplo:

```text
agreement = 1 - clamp(stdDev / MAX_STD_DEV, 0, 1)
```

No adoptar automáticamente una alternativa.

Debes seleccionar la métrica que cumpla mejor:

* estabilidad cerca de cero;
* explicabilidad;
* monotonía;
* rango `[0,1]`;
* simplicidad;
* comportamiento consistente en todo el dominio.

Si la fórmula actual es inestable, corregirla.

Toda corrección debe ser:

* documentada;
* probada;
* determinística;
* retrocompatible en el contrato, aunque cambien valores calculados.

---

# 9. Punto 2 — Separación entre modo y política de ausencia

El informe reporta:

```text
Missing policy: TOLERANT
```

Esto puede mezclar dos conceptos diferentes.

Debes verificar si el código distingue:

```text
mode
```

de:

```text
missingPolicy
```

## Mode

Debe referirse a manejo de errores:

```text
strict
tolerant
```

## Missing policy

Debe referirse al tratamiento matemático de señales ausentes:

```text
RENORMALIZE_AVAILABLE
KEEP_CONFIGURED_DENOMINATOR
REQUIRE_MINIMUM_COVERAGE
```

---

# 10. Requisito contractual de política de ausencia

La configuración debe declarar explícitamente:

```javascript
mode: "tolerant",
missingPolicy: "RENORMALIZE_AVAILABLE"
```

No usar:

```text
TOLERANT
```

como política matemática.

Si actualmente la lógica renormaliza entre señales presentes, documentar y nombrar correctamente:

```text
RENORMALIZE_AVAILABLE
```

Añadir tests que demuestren la fórmula.

---

# 11. Casos obligatorios de ausencia

## Caso A — Cobertura completa

Todas las señales disponibles.

## Caso B — Una señal ausente

Los pesos válidos se renormalizan.

## Caso C — Un motor ausente

Los pesos de motores válidos se renormalizan.

## Caso D — Señal con `null`

No debe convertirse en cero.

## Caso E — Señal con cero

```text
normalizedValue = 0
```

Debe considerarse válida.

## Caso F — Sin señales válidas

```text
rawConsensusScore = null
valid = false
```

## Caso G — Cobertura bajo mínimo

Debe aplicar la política configurada.

---

# 12. Punto 3 — Independencia entre cobertura y participación

Verificar que:

```text
coverage
```

y:

```text
participation
```

representen dimensiones distintas.

## Coverage

Debe medir:

```text
peso de señales válidas / peso de señales configuradas
```

## Participation

Debe medir:

```text
motores participantes / motores configurados
```

No deben incluirse mutuamente.

---

# 13. Prueba de doble penalización

Construir casos donde:

## Caso A

Tres motores presentes, cada uno con cobertura parcial.

## Caso B

Dos motores completos, uno ausente.

## Caso C

Un solo motor con cobertura completa.

## Caso D

Tres motores, uno con una señal válida de varias.

Comprobar que:

* coverage cambia por señales;
* participation cambia por motores;
* no existe doble penalización accidental;
* la fórmula está documentada.

---

# 14. Punto 4 — Auditoría de confianza estructural

La fórmula reportada es:

```text
confidence =
0.30 × coverage
+ 0.35 × participation
+ 0.25 × agreement
+ 0.10 × conflictPenalty
```

Debes comprobar:

* suma de pesos;
* valores por defecto;
* tratamiento de `agreement = null`;
* conflictos bloqueantes;
* severidades;
* acotación;
* compensaciones indebidas.

---

# 15. Casos obligatorios de confianza

## Caso A — Cobertura alta, acuerdo alto

Esperado: confianza alta.

## Caso B — Cobertura alta, acuerdo muy bajo

La cobertura no debe ocultar completamente el desacuerdo.

## Caso C — Cobertura baja, acuerdo alto

No debe producir confianza excesiva.

## Caso D — Un único motor

Debe reducirse la confianza.

## Caso E — Conflicto alto

Debe reducir significativamente la confianza.

## Caso F — Conflicto bloqueante

Debe invalidar o limitar severamente la confianza.

## Caso G — Agreement no calculable

Debe usar una política explícita.

---

# 16. Tratamiento de agreement no calculable

Determinar cuál de estas políticas usa el código:

```text
usar 0
usar null
usar valor neutral
omitir componente
renormalizar pesos restantes
```

Documentar la decisión.

No permitir:

```text
agreement = 1
```

cuando participa un solo motor.

La política debe quedar en configuración o en constante centralizada.

---

# 17. Límite de confianza por participación

Evaluar una regla de techo.

Ejemplo conceptual:

```text
1 motor  → confidence máxima 0.40
2 motores → confidence máxima 0.75
3 motores → confidence máxima 1.00
```

No implementar exactamente estos valores sin justificar.

El objetivo es impedir que un solo motor con cobertura completa produzca confianza alta.

Si la fórmula existente ya lo impide suficientemente, demostrarlo con tests.

---

# 18. Punto 5 — Auditoría de conflictos

La implementación reporta:

```text
ENGINE_DIVERGENCE
SIGNAL_CONFLICT
MISSING_ENGINE
LOW_COVERAGE
```

Debes verificar:

* condiciones exactas;
* severidades;
* thresholds;
* blocking;
* interacción con confianza;
* interacción con validez;
* ausencia de duplicados.

---

# 19. Umbral de divergencia

El informe indica un umbral aproximado:

```text
0.7
```

Analizar si es demasiado alto.

Crear pruebas para:

```text
0.80 / 0.20
0.75 / 0.10
0.70 / 0.30
0.90 / 0.85 / 0.15
0.65 / 0.60 / 0.20
```

Determinar:

* si existe conflicto;
* severidad;
* penalty;
* resultado final.

Los thresholds deben estar centralizados.

---

# 20. Severidades graduales

Preferir umbrales explícitos:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Ejemplo conceptual:

```text
spread >= 0.25 → LOW
spread >= 0.40 → MEDIUM
spread >= 0.60 → HIGH
spread >= 0.80 → CRITICAL
```

No adoptar estos valores sin análisis.

Evitar un único threshold binario si el código ya maneja severidades.

---

# 21. Conflicto intramotor

Auditar:

```text
SIGNAL_CONFLICT
```

No asumir que todas las señales de un motor deben coincidir.

Debes revisar la semántica de:

```text
delay.delayRatio
delay.delayScore
delay.pressure
```

y demás señales configuradas.

Determinar si la dispersión entre señales significa:

* contradicción real;
* dimensiones distintas;
* comportamiento esperado;
* redundancia;
* mala normalización.

Si no existe base formal para llamarlo “conflict”, considerar un nombre más neutral:

```text
INTRA_ENGINE_DISPERSION
```

No cambiar el contrato sin documentar compatibilidad.

---

# 22. Punto 6 — Análisis de redundancia y doble conteo

Las señales seleccionadas reportadas son:

## Lab_Con

```text
delay.delayRatio
delay.delayScore
delay.pressure
```

## Lab_Con1

```text
winWin.isActive
winWin.winWinScore
```

## AtRep

```text
pci.occurrences
pci.meanDist
```

Debes inspeccionar cómo se calcula cada señal.

---

# 23. Matriz de dependencia obligatoria

Crear una tabla como:

| Señal       | Fuente primaria | Derivada de | Comparte variables con | Riesgo |
| ----------- | --------------- | ----------- | ---------------------- | ------ |
| delayRatio  | ...             | ...         | ...                    | ...    |
| delayScore  | ...             | ...         | ...                    | ...    |
| pressure    | ...             | ...         | ...                    | ...    |
| isActive    | ...             | ...         | ...                    | ...    |
| winWinScore | ...             | ...         | ...                    | ...    |
| occurrences | ...             | ...         | ...                    | ...    |
| meanDist    | ...             | ...         | ...                    | ...    |

Clasificar:

```text
INDEPENDENT
PARTIALLY_REDUNDANT
DIRECTLY_DERIVED
UNKNOWN
```

No afirmar independencia sin evidencia en código.

---

# 24. Regla de peso por grupo

Verificar si `consensusConfiguration.js` implementa realmente grupos de señales.

Si tres señales de Lab_Con pertenecen al mismo fenómeno:

```text
delay
```

el peso total del grupo debe permanecer controlado.

No debe ocurrir:

```text
más señales correlacionadas = más influencia interna injustificada
```

Debido a la agregación jerárquica, el motor no gana peso global, pero su score interno puede sesgarse hacia evidencia duplicada.

---

# 25. WinWin isActive vs winWinScore

Determinar si:

```text
winWin.isActive
```

ya está codificado dentro de:

```text
winWin.winWinScore
```

Si `winWinScore = 0` cuando `isActive = false`, existe redundancia parcial o total.

No eliminar automáticamente.

Documentar y, si corresponde:

* reducir peso;
* agrupar;
* mantener solo una;
* marcar deuda técnica.

---

# 26. Punto 7 — Semántica de pci.meanDist

La implementación aplica:

```text
effectiveValue = 1 - normalizedValue
```

porque una menor distancia se interpreta como mayor intensidad.

Debes revisar:

* cálculo de `meanDist`;
* significado estadístico;
* normalización aplicada;
* relación con atracción;
* relación con repulsión;
* comportamiento ante muestra pequeña;
* comportamiento ante ausencia de ocurrencias.

No asumir capacidad predictiva.

---

# 27. Tests obligatorios para meanDist

Crear escenarios donde:

```text
meanDist bajo
meanDist medio
meanDist alto
occurrences bajo
occurrences alto
```

Comprobar que:

* la inversión es matemáticamente correcta;
* no se invierte dos veces;
* el normalizador ya no cambió la dirección;
* `0` y `1` se manejan correctamente;
* `null` se excluye;
* la explicación indica la dirección aplicada.

---

# 28. Punto 8 — Conservación contractual de datos

El resultado del `ConsensusEngine` debe permitir auditar:

```text
signals
normalizedSignals
consensus
metadata
```

Verificar si la salida:

* enriquece el objeto;
* crea una colección paralela;
* elimina datos previos;
* comparte referencias;
* conserva evidence;
* conserva warnings;
* conserva provenance.

---

# 29. Copias defensivas

Crear tests explícitos:

```javascript
output !== input
output.numbers !== input.numbers
output.metadata !== input.metadata
```

Para un número:

```javascript
output.numbers["17"] !== input.numbers["17"]
```

Y para estructuras internas:

```text
signals
normalizedSignals
evidence
warnings
params
provenance
consensus
conflicts
explanation
```

Mutar el output no debe afectar el input.

Mutar el input después del cálculo no debe afectar el output.

---

# 30. Punto 9 — Contrato para ProbabilityCalibrator

La salida mínima requerida debe incluir por número:

```text
number
rawConsensusScore
valid
confidence.score
coverage
participation
agreement.score
engineScores
configurationVersion
appliedAt
```

Verificar que:

* los nombres sean estables;
* los tipos sean consistentes;
* no sea necesario reinterpretar señales;
* exista trazabilidad suficiente;
* no se use un timestamp no determinístico en tests;
* exista versión de configuración.

---

# 31. Serialización

Comprobar:

```javascript
JSON.stringify(output)
```

sin errores.

No deben existir:

* funciones;
* clases;
* `Map`;
* `Set`;
* referencias circulares;
* `undefined` en campos contractuales críticos;
* `NaN`;
* `Infinity`.

---

# 32. Punto 10 — Complejidad y responsabilidades

Auditar `ConsensusEngine.js`.

Medir o estimar:

* líneas;
* métodos;
* ramas;
* responsabilidades;
* complejidad ciclomática;
* tamaño de métodos;
* acoplamiento;
* cohesión.

No refactorizar solamente porque el archivo sea largo.

Refactorizar únicamente si existen problemas objetivos:

* métodos difíciles de probar;
* lógica repetida;
* múltiples responsabilidades;
* fórmulas mezcladas con serialización;
* configuración dispersa;
* dificultad real para incorporar calibración.

---

# 33. Refactorización permitida

Si es necesaria, puede extraerse internamente:

```text
AgreementAnalyzer
ConflictDetector
ConfidenceEvaluator
ConsensusResultFactory
```

Pero:

* no cambiar API pública;
* no cambiar contrato de salida sin versión;
* no crear abstracciones innecesarias;
* no modificar resultados salvo corrección documentada;
* mantener tests de regresión.

---

# 34. Punto 11 — Preservación de 0 y 00

Crear o confirmar tests para:

```text
"0"
"00"
```

Comprobar:

* claves distintas;
* scores independientes;
* engineScores independientes;
* explicaciones independientes;
* no conversión a número;
* no colisión en serialización;
* universo de 38 números.

---

# 35. Punto 12 — Determinismo

Con:

```javascript
clock: () => "2026-07-30T00:00:00.000Z"
```

y misma entrada/configuración:

```javascript
deepEqual(output1, output2)
```

Debe cumplirse.

Comprobar orden estable en:

* números;
* motores;
* señales;
* exclusiones;
* conflictos;
* dominantSignals;
* warnings.

No depender accidentalmente del orden de objetos externos.

---

# 36. Strict y tolerant

Auditar diferencias reales.

## Strict

Debe fallar ante:

* estructura inválida;
* pesos inválidos;
* estrategia desconocida;
* política desconocida;
* número inconsistente;
* valor configurado fuera de rango;
* contrato roto.

## Tolerant

Debe:

* excluir;
* advertir;
* continuar;
* no convertir errores en cero;
* no ocultar fallos críticos;
* aislar por número cuando corresponda.

---

# 37. Señales requeridas y opcionales

Revisar si la configuración distingue:

```text
required: true
required: false
```

Si no existe, determinar si es necesario.

No toda señal configurada debe necesariamente ser obligatoria.

En `strict`, una señal opcional ausente no debería causar el mismo comportamiento que una señal requerida ausente.

No añadir esta característica salvo que resuelva una ambigüedad contractual real.

---

# 38. Tests de regresión obligatorios

Mantener:

```text
186 tests originales
```

Todos deben seguir pasando, salvo que un test anterior consolide un bug demostrado.

En ese caso:

* explicar por qué cambia;
* sustituirlo por una expectativa correcta;
* documentar impacto.

---

# 39. Nuevos tests mínimos

Añadir pruebas focalizadas para:

1. acuerdo con media cero;
2. acuerdo con media cercana a cero;
3. acuerdo con valores altos;
4. acuerdo con divergencia;
5. acuerdo no calculable;
6. separación mode/missingPolicy;
7. renormalización de señales disponibles;
8. separación coverage/participation;
9. confianza con un motor;
10. confianza con acuerdo bajo;
11. conflicto con spread 0.6;
12. conflicto con spread 0.7;
13. redundancia documentada;
14. `pci.meanDist` invertido;
15. conservación de contrato;
16. serialización;
17. copias defensivas;
18. determinismo;
19. `"0"` y `"00"`;
20. integración:

```text
SignalCollector
→ SignalNormalizer
→ ConsensusEngine
```

---

# 40. Archivos permitidos

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

---

# 41. Archivos prohibidos

No modificar:

```text
LabConAdapter
LabCon1Adapter
AtRepAdapter
SignalCollector
SignalNormalizer
fieldConfiguration
normalization strategies
Lab_Con
Lab_Con1
AtRep
UI
renderers
ViewModels
stores
tracker
```

Salvo incompatibilidad crítica demostrable.

En caso de incompatibilidad:

1. crear test;
2. documentar;
3. aplicar cambio mínimo;
4. justificarlo en el informe.

---

# 42. Funcionalidades prohibidas

No implementar:

* ProbabilityCalibrator;
* calibración isotónica;
* Platt scaling;
* regresión;
* backtesting;
* optimización de pesos;
* ranking;
* recomendaciones;
* apuestas;
* ROI;
* Kelly;
* machine learning;
* persistencia;
* UI;
* gráficos;
* commit;
* push.

---

# 43. Informe obligatorio

Generar:

```text
reports/consensus/PHASE_2_1_1_CONSENSUS_ENGINE_AUDIT.md
```

Debe incluir:

1. resumen ejecutivo;
2. objetivo;
3. alcance;
4. línea base;
5. arquitectura encontrada;
6. métrica de acuerdo encontrada;
7. pruebas comparativas de acuerdo;
8. decisión sobre CV;
9. política de ausencia;
10. separación entre mode y missingPolicy;
11. cobertura;
12. participación;
13. confianza;
14. tratamiento de agreement no calculable;
15. conflictos;
16. thresholds;
17. redundancia de señales;
18. matriz de dependencia;
19. análisis de `pci.meanDist`;
20. contrato de salida;
21. compatibilidad con ProbabilityCalibrator;
22. serialización;
23. copias defensivas;
24. determinismo;
25. preservación `"0"` y `"00"`;
26. complejidad del archivo principal;
27. refactorizaciones;
28. errores encontrados;
29. correcciones aplicadas;
30. archivos creados;
31. archivos modificados;
32. tests añadidos;
33. tests totales;
34. lint;
35. build;
36. arquitectura;
37. regresiones;
38. riesgos pendientes;
39. deuda técnica;
40. conclusión;
41. decisión `GO` o `NO-GO`.

---

# 44. Criterios de GO

Declarar:

```text
GO
```

solamente si:

* acuerdo estable en todo `[0,1]`;
* no existe división por cero;
* no existe `NaN`;
* no existe `Infinity`;
* mode y missingPolicy están separados;
* ausencia no se interpreta como cero;
* coverage y participation son independientes;
* confianza no se infla con un solo motor;
* conflictos afectan coherentemente la confianza;
* thresholds están documentados;
* señales redundantes están controladas o documentadas;
* `pci.meanDist` tiene dirección justificada;
* contrato conserva trazabilidad;
* salida es serializable;
* salida es determinística;
* copias defensivas correctas;
* `"0"` y `"00"` preservados;
* API pública estable;
* todos los tests pasan;
* lint limpio;
* build exitoso;
* no hay regresiones críticas;
* contrato es apto para `ProbabilityCalibrator`.

---

# 45. Criterios de NO-GO

Declarar:

```text
NO-GO
```

si ocurre cualquiera de estos casos:

* agreement produce `NaN` o `Infinity`;
* confianza alta con evidencia mínima;
* ausencia tratada como cero;
* doble penalización no controlada;
* conflictos críticos no afectan el resultado;
* contrato pierde señales normalizadas;
* salida no serializable;
* mutación del input;
* colisión `"0"`/`"00"`;
* tests fallidos;
* regresión;
* fórmula no reproducible;
* contrato insuficiente para calibración.

---

# 46. Validaciones finales

Ejecutar:

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

Registrar resultados reales.

---

# 47. Salida final en consola

Mostrar:

```text
FASE 2.1.1 — AUDITORÍA CONSENSUS ENGINE

Estado:
GO / NO-GO

Métrica de acuerdo:
- Original:
- Final:
- Motivo:

Mode:
- ...

Missing policy:
- ...

Coverage:
- ...

Participation:
- ...

Confianza:
- ...

Conflictos:
- ...

Redundancias:
- ...

pci.meanDist:
- ...

Contrato para ProbabilityCalibrator:
- Apto / No apto

Errores encontrados:
- ...

Correcciones aplicadas:
- ...

Archivos creados:
- ...

Archivos modificados:
- ...

Tests añadidos:
- ...

Resultados:
- Tests focalizados:
- Suite completa:
- Lint:
- Build:
- Arquitectura:

Regresiones:
- Ninguna / detallar

Informe:
reports/consensus/PHASE_2_1_1_CONSENSUS_ENGINE_AUDIT.md

Próxima fase autorizada:
FASE 2.2 — ProbabilityCalibrator
o
BLOQUEADA
```

---

# 48. Regla de mínima intervención

No realizar refactorizaciones cosméticas.

No cambiar nombres públicos sin necesidad.

No alterar motores.

No cambiar UI.

No modificar pesos con criterios predictivos.

No añadir complejidad sin una prueba que la justifique.

---

# 49. Regla de honestidad estadística

El informe debe indicar expresamente:

```text
El rawConsensusScore no representa una probabilidad calibrada.
La confianza es estructural.
El acuerdo mide proximidad entre scores de motores.
Los pesos siguen siendo provisionales hasta backtesting.
```

No afirmar:

* ventaja predictiva;
* patrón explotable;
* probabilidad real;
* rentabilidad;
* certeza.

---

# 50. Regla final

Prioriza:

```text
estabilidad matemática
claridad contractual
ausencia de doble conteo
reproducibilidad
trazabilidad
mínima intervención
tests
honestidad estadística
```

No avanzar a la Fase 2.2 dentro de esta ejecución.

Finaliza únicamente con evidencia objetiva para declarar:

```text
GO
```

o:

```text
NO-GO
```
