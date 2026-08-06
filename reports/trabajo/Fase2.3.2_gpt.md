# PROMPT MAESTRO — FASE 2.3.2

## Construcción de CalibrationObservation y mappers explícitos

### Proyecto

**Roulette Tracker Pro — lab_vito**

Nombres anteriores:

* ORION
* ORION_v2

### Fase

**Fase 2.3.2 — Construction of Calibration Observations**

---

# 1. Rol del agente

Actúa como:

* Arquitecto principal de software.
* Ingeniero senior JavaScript/Node.js.
* Especialista en Clean Architecture.
* Especialista en calibración probabilística.
* Especialista en integridad de evidencia científica.
* Especialista en prevención de leakage.
* Ingeniero de pruebas.
* Auditor de contratos públicos.
* Responsable de documentación técnica.

Debes inspeccionar e implementar directamente esta fase en el repositorio actual de Roulette Tracker Pro.

No actúes como un simple generador de código.

Antes de modificar cualquier archivo:

1. Verifica la raíz real del repositorio.
2. Revisa el estado Git.
3. Lee el informe de la Fase 2.3.1.
4. Lee el informe de la Fase 2.3.1.1.
5. Inspecciona completamente `src/historical-evidence/`.
6. Inspecciona las 74 pruebas actuales de esa capa.
7. Revisa `ConsensusEngine`.
8. Revisa `ConsensusOutput`.
9. Revisa `ProbabilityCalibrator`.
10. Revisa las estrategias de calibración existentes.
11. Revisa los contratos de benchmark y datasets.
12. Revisa cómo se representa `observedOutcome` en la infraestructura científica actual.
13. Revisa cómo se identifican sesiones, tiradas, predicciones y modelos.
14. Revisa las reglas de arquitectura.
15. Revisa los exports públicos.
16. Revisa `package.json` y sus scripts reales.
17. Busca consumidores actuales de `historical-evidence`.
18. Confirma que la capa todavía no se encuentra integrada automáticamente con producción.

No inventes rutas, tipos, comandos ni contratos sin inspeccionar primero el código real.

---

# 2. Contexto confirmado

La Fase 2.3.1 implementó la infraestructura inicial de evidencia histórica.

La Fase 2.3.1.1 endureció sus contratos e invariantes.

Estado actual informado:

```text
Tests globales: 708/708 PASS
Archivos de test: 45
Tests de historical-evidence: 74
Lint: 0 warnings, 0 errors
Build: OK
Dependencias nuevas: ninguna
```

La arquitectura actual incluye:

```text
src/historical-evidence/
├── domain/
├── application/
├── infrastructure/
└── index.js
```

Componentes disponibles:

* `RouletteNumber`
* `PredictionTarget`
* `PredictionRecord`
* `SpinOutcomeRecord`
* `EvidenceStatus`
* `EvidenceRepository`
* `InMemoryEvidenceRepository`
* `RecordPredictionUseCase`
* `RecordOutcomeUseCase`
* `GetEvidenceBySpinUseCase`
* validación de metadata;
* inmutabilidad profunda;
* validación cronológica;
* errores de dominio;
* control anti-leakage.

Semántica actual:

```text
PredictionRecord
├── predictionId
├── spinId
├── target
├── rawConsensusScore
├── calibration
├── createdAt
└── metadata

SpinOutcomeRecord
├── outcomeId
├── spinId
├── winningNumber
├── recordedAt
└── metadata
```

`observedOutcome` fue eliminado correctamente de `SpinOutcomeRecord`, porque no pertenece al resultado físico.

Debe ser derivado posteriormente al evaluar:

```text
PredictionTarget
contra
SpinOutcomeRecord.winningNumber
```

---

# 3. Objetivo principal

Implementar una capa determinista que transforme:

```text
PredictionRecord
+
SpinOutcomeRecord
↓
CalibrationObservation
```

Una `CalibrationObservation` debe representar una observación científica lista para ser utilizada, en fases posteriores, por:

* datasets históricos;
* benchmarks;
* métricas de calibración;
* entrenamiento;
* validación;
* selección de estrategias;
* PromotionPolicy.

Esta fase no debe construir todavía datasets persistentes ni activar entrenamiento.

El objetivo es producir observaciones individuales correctas, trazables, inmutables y reproducibles.

---

# 4. Principio científico central

Una observación de calibración debe conservar, como mínimo:

```text
qué se predijo;
qué score se emitió;
qué calibración se aplicó;
qué resultado físico ocurrió;
si el target se cumplió;
cuándo se emitió la predicción;
cuándo ocurrió o se registró el resultado;
qué IDs permiten rastrear su procedencia.
```

El valor:

```text
observedOutcome
```

no puede ser recibido arbitrariamente desde una capa externa.

Debe calcularse determinísticamente a partir de:

```text
PredictionTarget
+
winningNumber
```

Para un target `NUMBER`:

```text
target.value === winningNumber
    → observedOutcome = 1

target.value !== winningNumber
    → observedOutcome = 0
```

Esta regla debe estar centralizada, probada y preparada para extenderse a otros targets.

---

# 5. Restricciones obligatorias

Esta fase no puede:

* activar persistencia histórica definitiva;
* crear SQLite;
* crear DuckDB;
* crear PostgreSQL;
* exportar CSV;
* exportar JSONL;
* exportar Parquet;
* exportar Arrow;
* construir versiones de datasets;
* calcular hashes de datasets;
* entrenar calibradores;
* ejecutar model selection;
* promover estrategias;
* modificar `IdentityCalibration`;
* modificar `PromotionPolicy`;
* modificar algoritmos de calibración;
* modificar la fórmula de `ConsensusEngine`;
* registrar automáticamente predicciones dentro de `ConsensusEngine`;
* registrar automáticamente outcomes dentro de `SpinManager`;
* añadir side effects ocultos;
* usar datos sintéticos como evidencia productiva;
* crear una UI;
* crear dashboards;
* realizar migraciones de datos;
* modificar módulos no relacionados;
* debilitar tests.

La fase debe mantenerse dentro de la capa de evidencia histórica y sus adaptadores explícitos.

---

# 6. Entregables principales

Implementar, como mínimo:

1. `CalibrationObservation`
2. `PredictionTargetEvaluator`
3. `ObservationBuilder`
4. Política de identidad de observaciones.
5. Validación de compatibilidad prediction–outcome.
6. Construcción individual de observaciones.
7. Construcción por tirada.
8. Prevención de duplicados.
9. Mapper explícito desde `ConsensusOutput`.
10. Tests unitarios e integración interna.
11. Documentación técnica.
12. Informe final.

---

# 7. Contrato `CalibrationObservation`

Diseña un contrato público, inmutable y serializable.

Ejemplo conceptual:

```javascript
{
  observationId,
  predictionId,
  outcomeId,
  spinId,
  target,
  rawConsensusScore,
  calibratedProbability,
  calibrationStrategy,
  calibrationModelId,
  calibrationModelHash,
  observedOutcome,
  predictionCreatedAt,
  outcomeRecordedAt,
  observationCreatedAt,
  metadata
}
```

El ejemplo es orientativo.

Debes adaptar el diseño a los contratos reales del proyecto.

## 7.1 Campos obligatorios mínimos

La observación debe incluir inequívocamente:

```text
observationId
predictionId
outcomeId
spinId
target
rawConsensusScore
observedOutcome
predictionCreatedAt
outcomeRecordedAt
```

## 7.2 Calibración

Debe conservarse de manera explícita si existió calibración.

Posible representación:

```javascript
calibration: null
```

o:

```javascript
calibration: {
  probability,
  strategyName,
  modelId,
  modelHash
}
```

No conviertas ausencia de calibración en valores falsos ambiguos.

No supongas que:

```text
rawConsensusScore === calibratedProbability
```

aunque actualmente `IdentityCalibration` pueda producir valores equivalentes.

## 7.3 `observedOutcome`

Debe ser:

```text
0
o
1
```

No usar:

* boolean;
* string;
* `null`;
* `undefined`;
* probabilidad;
* resultado físico directamente.

Debe derivarse exclusivamente mediante el evaluador del target.

## 7.4 Inmutabilidad

La observación debe ser profundamente inmutable.

Debe reutilizar las utilidades endurecidas en la Fase 2.3.1.1.

No crear otra implementación paralela de deep freeze.

## 7.5 Metadata

La metadata debe:

* ser opcional o explícitamente nula;
* respetar la política JSON segura existente;
* ser profundamente inmutable;
* no contener funciones;
* no contener instancias de clases;
* no contener referencias circulares;
* no contener claves peligrosas;
* ser reproducible.

---

# 8. Identidad de la observación

Define una política explícita para `observationId`.

No utilizar:

* `Math.random()`;
* posición en un array;
* timestamp como único ID;
* concatenación ambigua;
* ID generado dentro del dominio sin inyección;
* proximidad temporal.

## Estrategias aceptables

### Alternativa A — ID proporcionado por el caller

```javascript
build({
  observationId,
  prediction,
  outcome
})
```

### Alternativa B — Generador inyectado

```javascript
new ObservationBuilder({
  observationIdGenerator
})
```

### Alternativa C — Identidad determinista

Derivada de:

```text
predictionId
+
outcomeId
+
target
+
versión del esquema
```

mediante serialización canónica y SHA-256, únicamente si el proyecto ya dispone de utilidades adecuadas y la decisión se justifica.

## Recomendación

Preferir en esta fase un ID proporcionado o un generador inyectado.

No introducir hashing nuevo si no es necesario.

## Regla de unicidad científica

Una predicción concreta evaluada contra un resultado físico concreto debe producir una única observación lógica.

Como mínimo, debe ser posible detectar duplicados mediante:

```text
predictionId + outcomeId
```

Si una predicción puede producir más de una observación, justificar explícitamente el discriminante adicional.

---

# 9. `PredictionTargetEvaluator`

Implementar un componente de dominio responsable de evaluar targets.

Nombre conceptual:

```text
PredictionTargetEvaluator
```

o:

```text
evaluatePredictionTarget
```

Debe mantenerse puro y determinista.

Firma conceptual:

```javascript
evaluatePredictionTarget(target, winningNumber)
```

Resultado:

```text
0 | 1
```

## 9.1 Target soportado en esta fase

Implementar completamente:

```text
NUMBER
```

Regla:

```javascript
target.type === "NUMBER"
target.value === winningNumber
```

## 9.2 Casos obligatorios

```text
target NUMBER "0"  + winningNumber "0"  → 1
target NUMBER "0"  + winningNumber "00" → 0
target NUMBER "00" + winningNumber "00" → 1
target NUMBER "00" + winningNumber "0"  → 0
target NUMBER "23" + winningNumber "23" → 1
target NUMBER "23" + winningNumber "5"  → 0
```

## 9.3 Targets futuros

El diseño debe permitir agregar posteriormente:

* COLOR
* PARITY
* RANGE
* DOZEN
* COLUMN
* SECTOR
* SERIES

No implementar estos targets todavía, salvo que ya existan contratos oficiales que deban reutilizarse.

Para tipos no soportados:

* lanzar error específico;
* no devolver `0` silenciosamente;
* no asumir que un target desconocido falló;
* no permitir evaluaciones parciales.

Error sugerido:

```text
UnsupportedPredictionTargetError
```

Debe incluir:

* tipo recibido;
* lista o contexto de tipos soportados;
* código estable;
* mensaje determinista.

---

# 10. `ObservationBuilder`

Implementar un constructor o servicio de dominio/aplicación que reciba:

```text
PredictionRecord
SpinOutcomeRecord
```

y produzca:

```text
CalibrationObservation
```

Firma conceptual:

```javascript
buildObservation({
  observationId,
  prediction,
  outcome,
  createdAt,
  metadata
})
```

Adapta el diseño a las convenciones del proyecto.

## 10.1 Validaciones obligatorias

### Identidad de tirada

Debe cumplirse:

```text
prediction.spinId === outcome.spinId
```

Si no coincide:

* rechazar;
* lanzar error específico;
* no construir observación parcial.

Error sugerido:

```text
EvidenceSpinMismatchError
```

### Cronología

Reutilizar la validación anti-leakage existente.

Debe cumplirse:

```text
prediction.createdAt <= outcome.recordedAt
```

según la política ya establecida.

No duplicar lógica temporal.

### Target

Debe ser un `PredictionTarget` válido.

### Resultado físico

`winningNumber` debe ser válido.

### Score

`rawConsensusScore` debe ser finito y respetar `[0,1]`, conforme al contrato actual.

### Calibración

Si existe:

* probabilidad finita;
* rango `[0,1]`;
* estrategia no vacía;
* IDs/hash válidos conforme al contrato actual.

### IDs

* `predictionId` válido;
* `outcomeId` válido;
* `observationId` válido;
* no vacíos;
* no coerción silenciosa.

---

# 11. Trazabilidad

Toda observación debe permitir rastrear:

```text
CalibrationObservation
├── predictionId → PredictionRecord
├── outcomeId    → SpinOutcomeRecord
└── spinId       → tirada física
```

No copies metadata completa indiscriminadamente si puede provocar:

* duplicación;
* conflictos;
* pérdida de procedencia;
* contaminación;
* campos ambiguos.

Define una política explícita.

Opciones:

### Metadata separada

```javascript
metadata: {
  observation: {},
  prediction: {},
  outcome: {}
}
```

### Metadata mínima

Conservar únicamente metadata propia de la observación y depender de IDs para acceder a los registros originales.

## Recomendación

Mantener la observación autocontenida en los campos científicos esenciales y conservar IDs para auditoría.

No duplicar metadata arbitraria de prediction y outcome sin una razón clara.

---

# 12. Separación entre resultado físico y evaluación

Mantener la distinción:

```text
SpinOutcomeRecord.winningNumber
```

es un hecho físico.

```text
CalibrationObservation.observedOutcome
```

es una evaluación binaria de un target.

Ejemplo:

```text
winningNumber = "23"

Prediction A:
target = NUMBER "23"
observedOutcome = 1

Prediction B:
target = NUMBER "5"
observedOutcome = 0
```

El mismo `SpinOutcomeRecord` puede generar múltiples observaciones, una por cada predicción válida asociada a la tirada.

No modificar el outcome físico para guardar outcomes derivados.

---

# 13. Construcción por tirada

Implementar un caso de uso o servicio que permita construir todas las observaciones completas de una tirada.

Nombre conceptual:

```text
BuildObservationsBySpinUseCase
```

Entrada conceptual:

```javascript
{
  spinId
}
```

Dependencias:

```text
EvidenceRepository
ObservationBuilder
ObservationRepository opcional
ID generator explícito
Clock opcional
```

## Comportamiento esperado

### Tirada con predicciones y outcome

Construir una observación por cada predicción.

### Tirada con predicciones, sin outcome

No construir observaciones.

Debe:

* devolver estado explícito;
* o lanzar error específico;
* o devolver una colección vacía acompañada de diagnóstico.

No debe interpretar la ausencia de outcome como `observedOutcome = 0`.

### Tirada sin predicciones

No construir observaciones.

### Tirada desconocida

Mantener coherencia con `SpinNotFoundError` o con la política actual.

### Múltiples predicciones

Construir en orden determinista:

```text
prediction.createdAt ascendente
predictionId ascendente
```

### Fallo parcial

No producir un lote parcial silencioso si una predicción es inválida.

Elegir y documentar una política:

* all-or-nothing;
* resultado con errores explícitos por elemento.

## Recomendación

Usar política all-or-nothing para proteger integridad científica.

---

# 14. Repositorio de observaciones

Evalúa si esta fase necesita un puerto separado:

```text
CalibrationObservationRepository
```

Como mínimo, se necesita una forma de detectar duplicados y consultar observaciones construidas durante tests.

## Alternativa A — Repositorio en memoria separado

```javascript
save(observation)
findById(observationId)
findByPredictionId(predictionId)
findBySpinId(spinId)
```

## Alternativa B — Construcción sin almacenamiento

El builder devuelve observaciones y la persistencia se posterga.

## Decisión recomendada

Implementar un puerto mínimo y un adaptador en memoria solo si es necesario para garantizar:

* no duplicación;
* idempotencia;
* construcción por tirada;
* trazabilidad;
* tests de integración.

No crear persistencia duradera.

No mezclar `EvidenceRepository` y `CalibrationObservationRepository` si representan responsabilidades distintas.

## Invariantes mínimas

* una observación no se sobrescribe;
* mismo `observationId` y contenido idéntico puede ser idempotente;
* mismo `observationId` y contenido diferente debe rechazarse;
* misma pareja `predictionId + outcomeId` no debe duplicarse;
* orden determinista;
* copias defensivas o records profundamente inmutables.

---

# 15. Prevención de duplicados

Detectar duplicados lógicos.

Casos:

### Mismo `observationId`, mismo contenido

Puede tratarse como idempotente.

### Mismo `observationId`, contenido distinto

Debe rechazarse.

### Distinto `observationId`, misma pareja prediction–outcome

Debe rechazarse como duplicado lógico.

### Misma prediction contra outcome diferente

Debe rechazarse si los outcomes pertenecen a la misma tirada y se contradicen.

### Predicciones distintas contra el mismo outcome

Debe permitirse.

Error sugerido:

```text
DuplicateCalibrationObservationError
```

Debe incluir contexto mínimo y código estable.

---

# 16. Mapper explícito desde `ConsensusOutput`

Implementar un mapper independiente:

```text
ConsensusOutput
↓
ConsensusToPredictionMapper
↓
PredictionRecord
```

Este mapper no debe persistir nada.

No debe invocar automáticamente `RecordPredictionUseCase`.

No debe modificar `ConsensusEngine`.

No debe crear side effects.

## 16.1 Responsabilidad

Convertir una salida real de consenso en un comando o record válido de predicción histórica.

Debe mapear, según los contratos reales:

* número objetivo;
* `rawConsensusScore`;
* probabilidad calibrada;
* estrategia;
* model metadata disponible;
* `spinId`;
* timestamp;
* metadata mínima;
* predictionId proporcionado o generado externamente.

## 16.2 Inspección obligatoria

Antes de implementar:

* confirma la forma real de `ConsensusOutput`;
* confirma qué campo es el score bruto;
* confirma qué campo es la probabilidad calibrada;
* confirma cómo se identifica la estrategia;
* confirma si existe model hash;
* confirma si existe model ID;
* confirma qué timestamps existen;
* confirma si `spinId` forma parte del output o debe proporcionarse por contexto.

No inventes datos que `ConsensusOutput` no contiene.

## 16.3 Campos faltantes

Si el mapper necesita campos no presentes en `ConsensusOutput`, debe recibirlos explícitamente:

```javascript
map({
  consensusOutput,
  predictionId,
  spinId,
  createdAt,
  target
})
```

No usar valores implícitos.

## 16.4 Compatibilidad

La ruta temporal:

```javascript
{ number: "23" }
```

puede mantenerse solamente si ya existe por compatibilidad.

El mapper nuevo debe producir el contrato oficial:

```javascript
target: {
  type: "NUMBER",
  value: "23"
}
```

---

# 17. Mapper desde resultado real

Evalúa implementar un mapper explícito:

```text
SpinManager output
↓
SpinToOutcomeMapper
↓
SpinOutcomeRecord
```

Solo debe implementarse si:

* existe un contrato claro de salida de `SpinManager`;
* puede hacerse sin integrar side effects;
* el alcance permanece controlado.

El mapper:

* no debe registrar automáticamente;
* no debe modificar `SpinManager`;
* no debe derivar `observedOutcome`;
* solo debe convertir el resultado físico.

Si el contrato de `SpinManager` es ambiguo o no está estabilizado, documenta la decisión y posterga el mapper.

No inventes integración.

---

# 18. Contrato científico de la observación

La observación debe estar preparada para convertirse en una fila de dataset futuro.

Ejemplo conceptual:

```javascript
{
  schemaVersion: "1",
  observationId: "obs-001",
  predictionId: "pred-001",
  outcomeId: "out-001",
  spinId: "spin-001",
  target: {
    type: "NUMBER",
    value: "23"
  },
  rawConsensusScore: 0.71,
  calibration: {
    probability: 0.69,
    strategyName: "IdentityCalibration",
    modelId: null,
    modelHash: null
  },
  observedOutcome: 1,
  predictionCreatedAt: "2026-07-30T20:00:00.000Z",
  outcomeRecordedAt: "2026-07-30T20:00:05.000Z"
}
```

No es obligatorio usar exactamente esta forma.

Debe existir una versión de esquema si el proyecto ya usa versionado de contratos o si puede incorporarse sin complejidad innecesaria.

Si se añade:

```text
schemaVersion
```

debe:

* ser explícita;
* ser estable;
* no depender del package version;
* documentarse;
* ser probada.

---

# 19. Derivación de probabilidad utilizable

Determina qué probabilidad utilizará una futura métrica de calibración.

La observación puede necesitar distinguir:

```text
rawConsensusScore
calibratedProbability
```

No crear un campo ambiguo como:

```text
probability
```

sin indicar su origen.

Opciones:

### Mantener ambos campos

```javascript
rawConsensusScore
calibration
```

### Añadir una función derivada

```javascript
getEffectiveProbability(observation)
```

que:

* use `calibration.probability` si existe;
* use `rawConsensusScore` en ausencia de calibración;
* documente esa semántica.

No consolidar ni borrar información original.

La futura comparación de calibradores requiere conservar ambos valores.

---

# 20. Errores de dominio

Reutiliza la jerarquía `EvidenceError`.

Añade únicamente los errores necesarios.

Posibles errores:

```text
UnsupportedPredictionTargetError
EvidenceSpinMismatchError
InvalidObservationIdError
DuplicateCalibrationObservationError
IncompleteSpinEvidenceError
InvalidCalibrationObservationError
ObservationBuildError
```

No es obligatorio usar exactamente esos nombres.

Cada error debe tener:

* clase específica;
* herencia coherente;
* código estable;
* mensaje determinista;
* contexto mínimo;
* pruebas unitarias.

No utilizar errores genéricos para invariantes científicas.

---

# 21. Inmutabilidad y copias defensivas

Reutiliza:

* `deepFreeze`;
* `normaliseMetadata`;
* validadores existentes.

No implementar versiones duplicadas.

Prueba:

* mutación del target original;
* mutación de calibration original;
* mutación de metadata original;
* mutación del objeto observation;
* mutación de campos anidados;
* mutación de arrays recuperados;
* mutación del prediction después del build;
* mutación del outcome después del build.

La observación no debe cambiar.

---

# 22. Determinismo

Toda operación debe ser determinista.

## El evaluador

Misma entrada:

```text
target + winningNumber
```

produce siempre el mismo resultado.

## El builder

Mismos records e IDs:

```text
prediction + outcome + observationId
```

producen la misma observación.

## El lote

Misma evidencia:

```text
spinId
```

produce observaciones en el mismo orden.

## No permitido

* `Math.random()`;
* `Date.now()` interno;
* `new Date()` no inyectado para datos científicos;
* orden incidental de `Map`;
* IDs implícitos;
* metadata no normalizada.

---

# 23. Atomicidad de construcción

Al construir observaciones por tirada:

1. cargar predicciones;
2. cargar outcome;
3. validar integridad completa;
4. construir todas las observaciones;
5. validar duplicados;
6. persistir, si se implementó repositorio;
7. devolver resultado.

No persistir observaciones una a una antes de validar el conjunto completo, salvo que exista rollback real.

La recomendación es:

```text
validate all
then save all
```

Si el repositorio no soporta transacciones, implementar:

* validación previa completa;
* comprobación previa de duplicados;
* persistencia solamente después del preflight.

---

# 24. Estado del proceso de construcción

Si se crea un resultado de aplicación para construcción por tirada, puede incluir:

```javascript
{
  spinId,
  evidenceStatus,
  observationCount,
  observations
}
```

No reutilizar `EvidenceStatus` para representar conceptos diferentes.

Diferenciar:

```text
estado de evidencia
```

de:

```text
estado del proceso de construcción
```

No añadir enums innecesarios.

---

# 25. Pruebas obligatorias

Mantener los 708 tests existentes y agregar pruebas nuevas.

No eliminar cobertura válida.

## 25.1 Evaluación de target NUMBER

Probar:

```text
"0" vs "0"   → 1
"0" vs "00"  → 0
"00" vs "00" → 1
"00" vs "0"  → 0
"1" vs "1"   → 1
"36" vs "36" → 1
"23" vs "5"  → 0
```

## 25.2 Target inválido

Probar:

* tipo desconocido;
* target nulo;
* target string;
* value inválido;
* winning number inválido;
* target manipulado;
* objeto no plano;
* target no congelado recibido desde fuera, si corresponde.

## 25.3 Construcción válida

Probar observación con:

* score bruto;
* calibración presente;
* calibración ausente;
* target NUMBER;
* acierto;
* fallo;
* cero;
* doble cero;
* timestamps válidos;
* metadata válida.

## 25.4 Incompatibilidad de spin

```text
prediction.spinId !== outcome.spinId
```

Debe rechazarse.

## 25.5 Cronología

Probar:

* predicción anterior;
* predicción posterior;
* igualdad;
* zonas horarias equivalentes;
* milisegundos;
* timestamps inválidos;
* validación reutilizada, no duplicada.

## 25.6 `observedOutcome`

Probar:

* siempre `0` o `1`;
* nunca boolean;
* nunca recibido desde input;
* input externo con `observedOutcome` debe ignorarse o rechazarse según política;
* no puede sobrescribirse;
* coincide con evaluación del target.

## 25.7 Trazabilidad

Probar conservación exacta de:

* observationId;
* predictionId;
* outcomeId;
* spinId;
* target;
* timestamps;
* estrategia;
* modelId;
* modelHash.

## 25.8 Inmutabilidad

Probar mutación:

* superficial;
* profunda;
* target;
* calibration;
* metadata;
* arrays;
* objetos de entrada después del build;
* objetos recuperados desde repositorio.

## 25.9 Duplicados

Probar:

* mismo observationId y mismo contenido;
* mismo observationId y contenido distinto;
* distinta ID con misma prediction–outcome;
* predicciones distintas con mismo outcome;
* una prediction con outcome incompatible;
* construcción repetida de la misma tirada.

## 25.10 Construcción por tirada

Probar:

* una predicción;
* varias predicciones;
* orden determinista;
* sin outcome;
* sin predictions;
* spin desconocido;
* todas aciertan;
* todas fallan;
* mezcla de aciertos y fallos;
* `0`;
* `00`;
* fallo parcial;
* atomicidad.

## 25.11 Mapper de consenso

Probar:

* mapeo de target;
* score bruto;
* probabilidad calibrada;
* estrategia;
* IDs;
* timestamp;
* campos faltantes;
* output inválido;
* no persistencia;
* no side effects;
* no modificación del objeto `ConsensusOutput`.

---

# 26. Pruebas de regresión

Ejecutar toda la suite.

La fase no puede romper:

* 708 tests existentes;
* calibradores;
* benchmark;
* bootstrap;
* grouped temporal split;
* leakage detection existente;
* hashing SHA-256;
* serialización canónica;
* build;
* lint;
* arquitectura;
* UI;
* módulos legacy aislados.

Está prohibido:

* `.skip`;
* `.only`;
* eliminar assertions;
* comentar tests;
* capturar errores para ocultarlos;
* modificar expectativas científicas sin evidencia;
* reducir cobertura deliberadamente.

---

# 27. Validaciones técnicas

Inspecciona `package.json` y ejecuta comandos reales.

Como mínimo, equivalentes disponibles a:

```bash
npm test
npm run lint
npm run build
```

También ejecutar cuando existan:

* `npm run check:architecture`
* typecheck;
* anti-legacy;
* format check;
* dependency checks;
* contract tests;
* benchmark smoke tests.

Registrar:

* comando;
* resultado;
* duración;
* tests;
* warnings;
* errores.

No declarar PASS si no se ejecutó una validación requerida.

---

# 28. Disciplina de dependencias

Preferencia:

```text
0 dependencias nuevas
```

No instalar:

* librerías de matching;
* librerías de schemas;
* ORM;
* bases de datos;
* serializadores;
* UUID packages;
* date libraries;
* event buses.

Reutilizar utilidades del proyecto y JavaScript estándar.

Cualquier dependencia nueva requiere justificación explícita en el informe.

---

# 29. Estructura sugerida

Adapta la estructura real.

Posibles archivos:

```text
src/historical-evidence/
├── domain/
│   ├── CalibrationObservation.js
│   ├── PredictionTargetEvaluator.js
│   ├── ObservationIdentity.js
│   └── errors.js
│
├── application/
│   ├── ObservationBuilder.js
│   ├── BuildObservationsBySpinUseCase.js
│   ├── CalibrationObservationRepository.js
│   └── mappers/
│       ├── ConsensusToPredictionMapper.js
│       └── SpinToOutcomeMapper.js
│
├── infrastructure/
│   └── InMemoryCalibrationObservationRepository.js
│
└── index.js
```

Esta estructura es conceptual.

No crear capas artificiales.

No ubicar lógica pura de evaluación en infraestructura.

No ubicar persistencia dentro del dominio.

No mezclar mapper con casos de uso.

---

# 30. Integración permitida

Permitido:

* importar contratos existentes;
* mapear `ConsensusOutput`;
* reutilizar tipos de ruleta;
* reutilizar chronology;
* reutilizar metadata;
* reutilizar deep freeze;
* agregar exports públicos;
* crear tests de integración interna;
* utilizar `InMemoryEvidenceRepository`;
* crear un repositorio en memoria para observaciones.

No permitido:

* modificar `ConsensusEngine` para escribir evidencia;
* modificar `ProbabilityCalibrator` para escribir evidencia;
* modificar `SpinManager` para escribir outcome;
* activar captura automática;
* agregar listeners globales;
* agregar eventos ocultos;
* modificar producción.

Los mappers deben poder usarse explícitamente en una fase posterior.

---

# 31. Decisiones arquitectónicas que deben documentarse

El informe debe responder:

1. ¿Qué representa exactamente `CalibrationObservation`?
2. ¿Cómo se calcula `observedOutcome`?
3. ¿Quién genera `observationId`?
4. ¿Cuál es la identidad lógica de una observación?
5. ¿Se almacena la observación en esta fase?
6. ¿Cuál es la política de idempotencia?
7. ¿Qué ocurre con spins incompletos?
8. ¿Qué ocurre con targets no soportados?
9. ¿Qué probabilidad se usará en métricas futuras?
10. ¿Cómo se conserva la calibración original?
11. ¿Cómo se evita leakage?
12. ¿Cómo se garantiza atomicidad?
13. ¿Cómo se ordenan observaciones?
14. ¿Qué metadata se conserva?
15. ¿Qué compatibilidad se mantiene?
16. ¿Qué componentes productivos continúan sin integración?

---

# 32. Informe obligatorio

Crear:

```text
reports/Fase2.3.2_calibration_observations_reporte.md
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
* ausencia de activación productiva.

## Arquitectura encontrada

* componentes reutilizados;
* contratos reales;
* `ConsensusOutput`;
* estado de `historical-evidence`.

## Decisiones

* contrato de observación;
* identidad;
* target evaluator;
* outcome derivado;
* calibración;
* metadata;
* temporalidad;
* duplicados;
* atomicidad;
* persistencia en memoria;
* compatibilidad.

## Archivos creados

| Archivo | Propósito | Capa |
| ------- | --------- | ---- |

## Archivos modificados

| Archivo | Cambio | Justificación |
| ------- | ------ | ------------- |

## Contratos públicos

Documentar:

* `CalibrationObservation`;
* evaluator;
* builder;
* repositorio, si existe;
* caso de uso;
* mapper;
* errores.

## Pruebas

* baseline: 708;
* nuevas;
* total;
* resultado;
* archivos;
* casos límite.

## Validaciones

* test;
* lint;
* build;
* arquitectura;
* anti-legacy;
* otras.

## Cambios incompatibles

Indicar:

* exports;
* contratos;
* wrappers;
* deprecaciones;
* consumidores afectados.

## Riesgos pendientes

Como mínimo:

* no existe persistencia duradera;
* no existe HistoricalDataset;
* no existe versionado;
* no existe exportación;
* no existe captura automática;
* no existe evidencia real suficiente;
* model selection continúa bloqueado;
* PromotionPolicy continúa sin activarse.

## Próxima fase

Recomendar:

```text
Fase 2.3.3 — Historical Dataset Assembly
```

No implementarla.

---

# 33. Criterios de aceptación

La fase se aprueba solamente si:

## Observación

* Existe `CalibrationObservation`.
* Es profundamente inmutable.
* Es serializable.
* Tiene trazabilidad completa.
* Conserva score bruto.
* Conserva calibración.
* Contiene `observedOutcome` binario.
* No mezcla resultado físico con evaluación.

## Evaluación

* NUMBER está soportado.
* `0` y `00` se distinguen.
* Acierto produce `1`.
* Fallo produce `0`.
* Targets no soportados generan error.
* No existe fallback silencioso.

## Integridad

* prediction y outcome comparten `spinId`.
* cronología válida.
* IDs válidos.
* resultado físico válido.
* score válido.
* calibración válida.
* metadata válida.

## Duplicados

* no se duplican observaciones;
* idempotencia documentada;
* mismo ID con contenido diferente se rechaza;
* misma pareja prediction–outcome no se repite.

## Construcción por tirada

* una observación por predicción;
* orden determinista;
* spins incompletos no producen outcomes falsos;
* atomicidad;
* múltiples predicciones funcionan.

## Mapper

* existe mapper explícito desde `ConsensusOutput`;
* no persiste;
* no tiene side effects;
* no modifica producción;
* no inventa campos;
* exige contexto faltante.

## Ciencia

* no se entrena;
* no se promueve;
* no se modifica IdentityCalibration;
* no se modifica benchmark;
* no se usan datos sintéticos como evidencia productiva;
* no se activa captura automática.

## Calidad

* todos los tests pasan;
* no hay regresiones;
* lint aprobado;
* build aprobado;
* arquitectura aprobada;
* sin tests omitidos;
* sin dependencias injustificadas.

## Documentación

* informe creado;
* decisiones registradas;
* archivos inventariados;
* riesgos pendientes;
* siguiente fase delimitada.

---

# 34. Fuera de alcance

No implementar:

* HistoricalDataset;
* DatasetVersioning;
* DatasetMetadata definitivo;
* DatasetSnapshot;
* SHA-256 de datasets;
* CSV exporter;
* JSONL exporter;
* Parquet exporter;
* Arrow exporter;
* SQLite;
* DuckDB;
* PostgreSQL;
* entrenamiento;
* benchmark con evidencia real;
* model selection;
* PromotionPolicy activa;
* UI;
* dashboard;
* captura productiva;
* procesos automáticos;
* Motor de Amplitud de Señal.

---

# 35. Secuencia de ejecución

## Paso 1 — Auditoría

Inspeccionar:

* reportes anteriores;
* contratos;
* tests;
* outputs de consenso;
* calibradores;
* repositorios;
* exports;
* consumidores.

## Paso 2 — Diseño

Definir:

* observación;
* identidad;
* evaluator;
* builder;
* repositorio;
* duplicados;
* atomicidad;
* mapper;
* errores.

## Paso 3 — Dominio

Implementar:

1. evaluator;
2. observation;
3. validaciones;
4. errores.

## Paso 4 — Aplicación

Implementar:

1. builder;
2. construcción por spin;
3. mapper de consenso;
4. repositorio o puerto cuando corresponda.

## Paso 5 — Infraestructura

Implementar solamente adaptadores en memoria necesarios.

## Paso 6 — Tests focalizados

Ejecutar:

* evaluator;
* observation;
* builder;
* mapper;
* repositorio;
* caso de uso.

## Paso 7 — Suite completa

Ejecutar todos los tests.

## Paso 8 — Auditoría final

Confirmar:

* no side effects;
* no integración productiva;
* no leakage;
* no mutabilidad;
* no duplicados;
* no dependencias nuevas;
* no ciclos.

## Paso 9 — Informe

Generar reporte verificable.

---

# 36. Reglas de trabajo

* No reformatear archivos ajenos.
* No hacer refactors amplios.
* No cambiar módulos estadísticos.
* No modificar producción.
* No duplicar validadores.
* No duplicar `deepFreeze`.
* No duplicar chronology.
* No aceptar `observedOutcome` externo.
* No usar boolean para outcome científico.
* No coercionar targets.
* No inferir `spinId`.
* No inferir IDs.
* No generar timestamps internamente sin inyección.
* No usar `Math.random()`.
* No usar orden incidental.
* No ocultar errores.
* No debilitar tests.
* No usar `.skip`.
* No usar `.only`.
* No instalar dependencias sin justificación.
* No declarar PASS sin ejecutar validaciones.

---

# 37. Estado final esperado

```text
ConsensusOutput
      │
      │ mapper explícito
      ▼
PredictionRecord
      │
      │
      ├───────────────┐
      │               │
      ▼               ▼
PredictionTarget   rawConsensusScore
      │
      │ evaluate
      ▼
SpinOutcomeRecord.winningNumber
      │
      ▼
observedOutcome
      │
      ▼
CalibrationObservation
```

Por cada tirada:

```text
spinId
├── PredictionRecord A
├── PredictionRecord B
├── PredictionRecord C
└── SpinOutcomeRecord
        ↓
CalibrationObservation A
CalibrationObservation B
CalibrationObservation C
```

Todavía no debe existir:

```text
HistoricalDataset persistente
entrenamiento
model selection
promoción
captura automática
```

---

# 38. Formato de respuesta final del agente

Entregar:

```text
FASE 2.3.2 — RESULTADO

Estado:
PASS | PASS_WITH_OBSERVATIONS | BLOCKED

Arquitectura:
- ...

CalibrationObservation:
- ...

PredictionTargetEvaluator:
- ...

ObservationBuilder:
- ...

Construcción por spin:
- ...

Repositorio de observaciones:
- ...

Mapper ConsensusOutput:
- ...

Mapper SpinOutcome:
- ...

Integridad:
- ...

Temporalidad:
- ...

Duplicados:
- ...

Atomicidad:
- ...

Compatibilidad:
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
Fase 2.3.3 — Historical Dataset Assembly
```

No inventar cifras.

No declarar resultados de comandos que no fueron ejecutados.

---

# 39. Instrucción final

Comienza inspeccionando el repositorio, los reportes de las fases 2.3.1 y 2.3.1.1, la capa `historical-evidence`, `ConsensusOutput` y las interfaces actuales del calibrador.

Luego implementa únicamente:

```text
FASE 2.3.2
Construction of Calibration Observations
```

Prioridad:

```text
INTEGRIDAD CIENTÍFICA
>
TRAZABILIDAD
>
PREVENCIÓN DE LEAKAGE
>
DETERMINISMO
>
INMUTABILIDAD
>
ATOMICIDAD
>
COMPATIBILIDAD
>
EXTENSIBILIDAD
>
VELOCIDAD
```

La fase debe finalizar con observaciones científicas individuales, correctas, reproducibles y trazables, sin construir todavía datasets ni activar integración productiva.
