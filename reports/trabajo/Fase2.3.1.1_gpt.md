# PROMPT MAESTRO — FASE 2.3.1.1

## Hardening de contratos de evidencia histórica

### Proyecto

**Roulette Tracker Pro — lab_vito**

Nombre anterior:

* ORION
* ORION_v2

### Fase

**Fase 2.3.1.1 — Endurecimiento de contratos e invariantes del Historical Evidence Pipeline**

---

# 1. Rol del agente

Actúa como:

* Arquitecto principal de software.
* Ingeniero senior JavaScript/Node.js.
* Especialista en Clean Architecture.
* Especialista en integridad de datos.
* Especialista en sistemas estadísticos reproducibles.
* Auditor de contratos públicos.
* Ingeniero de pruebas.
* Revisor de seguridad e inmutabilidad.
* Responsable de documentación técnica.

Debes inspeccionar e implementar directamente esta fase en el repositorio actual de Roulette Tracker.

No actúes como un simple generador de código.

Antes de modificar archivos:

1. Verifica la raíz del repositorio.
2. Revisa el estado Git.
3. Lee el informe de la Fase 2.3.1.
4. Inspecciona `src/historical-evidence/`.
5. Inspecciona las 47 pruebas incorporadas.
6. Revisa cómo el proyecto representa los números de ruleta americana.
7. Localiza `ROULETTE_NUMBERS`, `AMERICAN_ROULETTE_NUMBERS` o contratos equivalentes.
8. Revisa `ConsensusOutput`.
9. Revisa `ProbabilityCalibrator`.
10. Revisa cómo se representa `rawConsensusScore`.
11. Revisa cómo se representa `calibratedProbability`.
12. Revisa cómo se representa el resultado observado.
13. Revisa las convenciones de errores.
14. Revisa los scripts reales de validación en `package.json`.
15. Detecta cualquier incompatibilidad entre la implementación y los criterios originales de la Fase 2.3.1.

No inventes rutas, tipos, exports ni convenciones sin verificar primero el repositorio.

---

# 2. Contexto de la fase anterior

La Fase 2.3.1 fue implementada con resultado técnico positivo.

Estado informado:

```text
681/681 tests PASS
Lint: 0 warnings, 0 errors
Build: OK
Dependencias nuevas: ninguna
Arquitectura desacoplada
```

Se incorporó:

```text
src/historical-evidence/
├── domain/
├── application/
├── infrastructure/
└── index.js
```

Contratos y componentes existentes:

* `PredictionRecord`
* `OutcomeRecord`
* `EvidenceStatus`
* jerarquía de errores
* `EvidenceRepository`
* `RecordPredictionUseCase`
* `RecordOutcomeUseCase`
* `GetEvidenceBySpinUseCase`
* `InMemoryEvidenceRepository`

La implementación es válida como infraestructura base, pero quedaron observaciones que deben resolverse antes de integrar el módulo con:

* `ConsensusEngine`
* `ProbabilityCalibrator`
* `SpinManager`
* captura productiva;
* datasets históricos;
* entrenamiento;
* selección de calibradores.

---

# 3. Objetivo principal

Endurecer los contratos de evidencia histórica para impedir que datos ambiguos, inválidos, mutables o temporalmente contaminados ingresen al futuro dataset científico.

Esta fase debe resolver específicamente:

1. Validación estricta de números de ruleta americana.
2. Semántica obligatoria de `rawConsensusScore`.
3. Separación entre score bruto y probabilidad calibrada.
4. Introducción de un target de predicción extensible.
5. Revisión de los estados de evidencia.
6. Inmutabilidad profunda.
7. Validación temporal anti-leakage.
8. Pruebas exhaustivas de invariantes.
9. Compatibilidad con los 681 tests existentes.
10. Ausencia total de integración automática con producción.

---

# 4. Restricciones obligatorias

Esta fase no puede:

* integrar todavía `ConsensusEngine` con el repositorio;
* integrar todavía `ProbabilityCalibrator`;
* integrar todavía `SpinManager`;
* registrar automáticamente predicciones;
* registrar automáticamente resultados;
* crear persistencia en archivos;
* crear persistencia SQLite;
* crear persistencia DuckDB;
* crear persistencia PostgreSQL;
* construir datasets;
* exportar CSV;
* exportar JSONL;
* entrenar calibradores;
* ejecutar model selection;
* modificar `IdentityCalibration`;
* modificar PromotionPolicy;
* cambiar algoritmos estadísticos;
* modificar la matemática del consenso;
* introducir datos sintéticos como evidencia productiva;
* cambiar contratos públicos existentes sin estrategia de compatibilidad;
* eliminar pruebas para obtener verde.

La fase es exclusivamente correctiva y de hardening.

---

# 5. Inspección obligatoria

Antes de implementar, determina y documenta:

## 5.1 Representación actual de números

Confirma cómo representa el proyecto:

```text
0
00
1..36
```

Prioridad:

1. Reutilizar un tipo o conjunto existente.
2. Evitar duplicar `ROULETTE_NUMBERS`.
3. Mantener `"0"` y `"00"` como valores diferentes.
4. Evitar coerciones numéricas.
5. Evitar representar `"00"` como `0`.
6. Evitar crear otra lista paralela si ya existe una lista canónica.

## 5.2 Semántica del score

Confirma:

* rango de `rawConsensusScore`;
* origen del valor;
* si coincide o no con una probabilidad;
* si el score es siempre `[0,1]`;
* si puede ser negativo;
* si puede superar `1`;
* si existe un contrato público previo.

No impongas `[0,1]` arbitrariamente.

## 5.3 Semántica de probabilidad calibrada

Confirma:

* qué produce `ProbabilityCalibrator`;
* qué campo representa la salida calibrada;
* qué estrategia la produjo;
* qué metadata de modelo existe;
* si el valor es obligatorio en una predicción histórica;
* si en esta etapa debe permitirse ausencia de calibración.

## 5.4 Estado de evidencia

Confirma cómo utiliza actualmente:

```text
PENDING
RESOLVED
CONFLICT
```

Determina si `CONFLICT`:

* se persiste realmente;
* se devuelve en consultas;
* es alcanzable;
* duplica el uso de `ContradictoryOutcomeError`;
* debería eliminarse;
* debería mantenerse por compatibilidad, pero deprecado.

No conserves estados imposibles sin documentarlo.

---

# 6. Validación estricta de números

Implementa una única validación canónica para números de ruleta americana.

Debe aceptar exclusivamente:

```text
"0"
"00"
"1"
"2"
...
"36"
```

Debe rechazar:

```text
"37"
"-1"
"000"
"01"
" 23"
"23 "
"2.0"
"abc"
""
null
undefined
0
23
NaN
Infinity
{}
[]
```

No normalices silenciosamente entradas inválidas.

No conviertas:

```javascript
23
```

en:

```javascript
"23"
```

sin una decisión explícita de contrato.

La capa de dominio debe proteger esta invariante, incluso si posteriormente existe un mapper que también valide.

## Recomendación

Si ya existe un contrato reutilizable, úsalo.

Si no existe, crea un componente mínimo, por ejemplo:

```text
RouletteNumber
```

o:

```text
isValidAmericanRouletteNumber
```

Adapta el nombre a las convenciones reales.

Debe existir una única fuente canónica de verdad.

No dupliques arrays de números en varios módulos.

---

# 7. Rediseño controlado de `PredictionRecord`

Revisa el contrato actual.

El informe de la fase anterior indica que contiene:

```text
spinId
number
calibratedProbability
createdAt
rawConsensusScore opcional
strategyName opcional
```

Esta fase debe corregir la semántica.

## 7.1 `rawConsensusScore`

Para registros destinados a evidencia de calibración, debe ser obligatorio.

Debe:

* ser numérico;
* ser finito;
* respetar el rango real definido por el contrato existente;
* conservarse sin redondeos arbitrarios;
* representar el valor previo a calibración;
* no confundirse con `calibratedProbability`.

Debe rechazarse:

```text
undefined
null
NaN
Infinity
-Infinity
string
boolean
```

Si existen predicciones históricas que no pertenecen al calibrador, considera una separación explícita de contratos.

Alternativas posibles:

### Alternativa A

```text
PredictionRecord
```

exclusivo para calibración, con `rawConsensusScore` obligatorio.

### Alternativa B

```text
BasePredictionRecord
CalibrationPredictionRecord
```

### Alternativa C

Tipo discriminado por propósito:

```javascript
{
  purpose: "CALIBRATION_EVIDENCE",
  rawConsensusScore: ...
}
```

Elige la opción más coherente con el repositorio y con menor impacto.

Documenta la decisión.

---

## 7.2 Probabilidad calibrada

No trates `calibratedProbability` y `rawConsensusScore` como sinónimos.

La predicción histórica debe permitir distinguir:

```text
rawConsensusScore
calibratedProbability
calibrationStrategy
calibrationModelId
calibrationModelHash
```

No es obligatorio incluir todos esos campos ahora si el sistema todavía no los produce.

Pero el contrato debe definir claramente qué campos:

* son obligatorios;
* son opcionales;
* pertenecen a la captura base;
* pertenecen a una predicción calibrada;
* podrán agregarse en fases posteriores.

Recomendación conceptual:

```javascript
{
  rawConsensusScore: number,
  calibration: {
    probability: number,
    strategyName: string,
    modelId?: string,
    modelHash?: string
  } | null
}
```

Este diseño es orientativo.

No lo impongas si contradice los patrones del proyecto.

La ausencia de calibración debe ser explícita.

No uses:

```text
calibratedProbability: undefined
```

como única semántica si eso produce ambigüedad.

---

# 8. Introducción de `PredictionTarget`

La evidencia no debe quedar limitada permanentemente a números individuales.

Actualmente el campo `number` representa el target.

Introduce una representación extensible y discriminada.

Ejemplo conceptual:

```javascript
{
  type: "NUMBER",
  value: "23"
}
```

El contrato debe permitir en futuras fases:

```text
NUMBER
COLOR
PARITY
RANGE
DOZEN
COLUMN
SECTOR
SERIES
CUSTOM
```

No es necesario implementar toda la lógica de esos targets ahora.

En esta fase:

* implementa y valida completamente `NUMBER`;
* diseña el contrato para extensión futura;
* rechaza tipos desconocidos;
* evita objetos ambiguos;
* garantiza inmutabilidad;
* garantiza serialización determinista.

## Requisitos mínimos

Para target `NUMBER`:

```javascript
{
  type: "NUMBER",
  value: "0" | "00" | "1" ... "36"
}
```

Debe rechazarse:

```javascript
{ type: "NUMBER", value: "37" }
{ type: "NUMBER" }
{ value: "23" }
{ type: "UNKNOWN", value: "23" }
{ type: "", value: "23" }
null
[]
"23"
```

## Compatibilidad

Si el contrato público actual expone:

```javascript
number
```

no lo elimines sin evaluar impacto.

Opciones:

* mantener getter de compatibilidad;
* aceptar temporalmente `number` y transformarlo explícitamente;
* deprecar `number`;
* migrar tests y consumidores;
* publicar breaking change únicamente si no existen consumidores.

Documenta la decisión.

No mantengas dos fuentes de verdad divergentes.

---

# 9. Revisión de `OutcomeRecord`

`OutcomeRecord` debe representar el resultado físico de la tirada, no únicamente el éxito o fracaso de una predicción.

Debe diferenciar:

```text
winningNumber
```

de:

```text
observedOutcome
```

El resultado físico de la ruleta es único por `spinId`.

Sin embargo, `observedOutcome` depende del target evaluado.

Ejemplo:

```text
winningNumber = "23"

target NUMBER "23" → observedOutcome = 1
target NUMBER "5"  → observedOutcome = 0
target COLOR RED   → observedOutcome = 1
```

Por tanto, analiza si el `OutcomeRecord` actual mezcla:

* resultado físico;
* outcome derivado para un target.

## Diseño recomendado

Separar conceptualmente:

```text
SpinOutcomeRecord
```

del futuro:

```text
CalibrationObservation
```

El primero registra:

```javascript
{
  outcomeId,
  spinId,
  winningNumber,
  recordedAt,
  metadata
}
```

El segundo, en la futura Fase 2.3.2 o 2.3.3, derivará:

```javascript
{
  prediction,
  outcome,
  observedOutcome
}
```

No implementes todavía el constructor completo de `CalibrationObservation` si queda fuera del alcance.

Pero evita consolidar ahora un contrato científicamente incorrecto.

## Decisión obligatoria

Determina si `observedOutcome` debe:

* eliminarse de `OutcomeRecord`;
* mantenerse temporalmente por compatibilidad;
* marcarse como deprecado;
* trasladarse a una estructura derivada.

Documenta la decisión y protege compatibilidad cuando sea necesario.

---

# 10. Revisión de `EvidenceStatus`

Analiza los estados actuales.

Si el repositorio rechaza una contradicción y no la persiste, `CONFLICT` no debería aparecer como estado normal de una evidencia válida.

Estados recomendados:

```text
PENDING_OUTCOME
COMPLETED
```

Opcionalmente:

```text
INVALID
```

solo si existen registros inválidos persistidos deliberadamente.

No uses un estado `INVALID` si el dominio siempre rechaza entradas inválidas.

## Política recomendada

```text
PENDING_OUTCOME:
existen predicciones, pero todavía no existe resultado físico.

COMPLETED:
existe al menos una predicción y existe resultado físico.

EMPTY:
no existe evidencia para el spin, solo si el caso de uso decide devolver estado en lugar de lanzar error.
```

Debes decidir qué ocurre para una tirada sin datos:

* lanzar `SpinNotFoundError`;
* devolver `EMPTY`;
* devolver `null`.

Mantén consistencia con el comportamiento actual.

## Compatibilidad

Si `CONFLICT` ya está exportado públicamente:

* no lo elimines abruptamente sin inspección;
* considera deprecación;
* añade comentario JSDoc;
* evita devolverlo en nuevos flujos;
* documenta su futuro retiro.

---

# 11. Inmutabilidad profunda

`Object.freeze()` superficial no es suficiente cuando existen:

* `metadata`;
* targets;
* calibration details;
* arrays;
* objetos anidados.

Implementa una política segura de inmutabilidad profunda.

Alternativas aceptables:

## Alternativa A — Deep freeze seguro

Crear o reutilizar una función que:

* congele objetos planos;
* congele arrays;
* recorra objetos anidados;
* evite ciclos o los rechace;
* no modifique objetos externos;
* no ejecute getters;
* no procese prototipos peligrosos.

## Alternativa B — Clonación estructurada y freeze

```text
structuredClone
+
deepFreeze
```

Siempre que sea compatible con el runtime objetivo.

## Alternativa C — Metadata JSON segura

Aceptar únicamente:

```text
null
string
number finito
boolean
array
plain object
```

y rechazar:

* funciones;
* símbolos;
* BigInt;
* Date no serializada;
* Map;
* Set;
* class instances;
* getters;
* objetos con prototipo extraño;
* referencias circulares;
* `__proto__`;
* `constructor`;
* `prototype`.

## Requisitos

La política seleccionada debe:

* evitar mutación externa posterior;
* evitar mutación desde resultados de consulta;
* ser determinista;
* ser serializable;
* prepararse para futura serialización canónica;
* no aceptar valores que luego no puedan persistirse de forma reproducible.

Añade pruebas de mutación profunda.

Ejemplo:

```javascript
const metadata = {
  source: {
    version: "1.0"
  }
};

const record = createPredictionRecord({ metadata });

metadata.source.version = "MUTATED";

expect(record.metadata.source.version).toBe("1.0");
```

También prueba:

```javascript
record.metadata.source.version = "MUTATED";
```

y confirma que no altera el objeto.

---

# 12. Validación temporal anti-leakage

Implementa una política temporal explícita.

La evidencia científica debe impedir que una predicción registrada después de conocer el resultado sea considerada válida.

La asociación sigue realizándose por:

```text
spinId
```

Nunca por proximidad temporal.

## Política mínima

Cuando existe un resultado y se registra una predicción para el mismo `spinId`:

```text
prediction.createdAt <= outcome.recordedAt
```

o:

```text
prediction.createdAt < outcome.recordedAt
```

Debes elegir una de las dos.

## Criterio recomendado

Permitir igualdad:

```text
prediction.createdAt <= outcome.recordedAt
```

solo si el proyecto utiliza precisión de timestamps que puede producir igualdad legítima.

En caso contrario, exigir:

```text
prediction.createdAt < outcome.recordedAt
```

Documenta la decisión.

## Casos obligatorios

### Predicción registrada antes del resultado

Debe aceptarse.

### Predicción registrada después del resultado

Debe rechazarse con error explícito.

### Predicción existente y resultado posterior

Debe aceptarse.

### Resultado anterior a una predicción ya almacenada

Debe rechazarse o marcarse como inconsistente antes de persistir el resultado.

### Igualdad temporal

Debe seguir la política documentada.

### Zonas horarias equivalentes

Ejemplo:

```text
2026-07-30T10:00:00Z
2026-07-30T06:00:00-04:00
```

Deben compararse como el mismo instante.

### Timestamp inválido

Debe rechazarse antes de guardar.

## Error recomendado

Crear o reutilizar un error como:

```text
TemporalEvidenceLeakageError
```

o:

```text
InvalidEvidenceChronologyError
```

Debe contener:

* `spinId`;
* `predictionId`, si existe;
* timestamp de predicción;
* timestamp de resultado;
* código de error determinista.

No debe filtrar metadata innecesaria.

---

# 13. Reglas de repositorio

El `InMemoryEvidenceRepository` debe reforzar las invariantes, no depender solamente de los casos de uso.

Debe impedir:

* predicción duplicada;
* outcome duplicado contradictorio;
* número inválido;
* target inválido;
* mutación externa;
* cronología inválida;
* sobrescritura silenciosa;
* múltiples resultados físicos para el mismo `spinId`.

Debe mantener:

* consultas O(1) cuando sea razonable;
* orden determinista;
* idempotencia para outcomes idénticos;
* copias defensivas;
* comportamiento reproducible.

## Orden determinista

Mantener o documentar:

```text
createdAt ascendente
predictionId ascendente como desempate
```

Añadir pruebas para timestamps iguales.

## Idempotencia

Una escritura idéntica debe:

* no duplicar registros;
* no cambiar el estado;
* no alterar el orden;
* no generar un nuevo ID;
* devolver un resultado coherente.

Una escritura con mismo ID y contenido diferente debe rechazarse.

---

# 14. Errores de dominio

Reutiliza la jerarquía existente:

```text
EvidenceError
├── InvalidNumberError
├── DuplicatePredictionError
├── DuplicateOutcomeError
├── ContradictoryOutcomeError
└── SpinNotFoundError
```

Amplíala solamente cuando sea necesario.

Errores nuevos posibles:

```text
InvalidPredictionTargetError
InvalidConsensusScoreError
InvalidCalibrationProbabilityError
InvalidMetadataError
TemporalEvidenceLeakageError
UnsupportedEvidenceStatusError
```

No es obligatorio usar esos nombres exactos.

Cada error debe tener:

* clase específica;
* código estable;
* mensaje determinista;
* contexto mínimo;
* pruebas;
* herencia coherente.

No uses únicamente:

```javascript
throw new Error("invalid")
```

---

# 15. Estrategia de compatibilidad

Esta fase puede requerir modificar contratos creados en la Fase 2.3.1.

Antes de romperlos:

1. Busca consumidores.
2. Revisa imports.
3. Revisa exports.
4. Revisa tests.
5. Revisa reportes.
6. Determina si el módulo ya está conectado a producción.
7. Confirma si existe persistencia previa.

Como la fase anterior informó que no se modificaron módulos existentes y que el subsistema todavía no está integrado, prioriza corregir ahora los contratos aunque implique modificar los 47 tests nuevos.

No sacrifiques corrección científica solo para conservar un contrato recién creado y todavía no utilizado.

Sin embargo:

* no rompas módulos externos no inspeccionados;
* no elimines exports usados;
* no realices migraciones innecesarias;
* documenta cada cambio incompatible.

---

# 16. Pruebas obligatorias

Mantén los 681 tests anteriores y agrega pruebas nuevas.

No se exige conservar exactamente los mismos tests si alguno congela una semántica incorrecta.

Sí se exige conservar o mejorar su cobertura.

## 16.1 Números válidos

Probar:

```text
"0"
"00"
"1"
"18"
"36"
```

## 16.2 Números inválidos

Probar al menos:

```text
"37"
"-1"
"000"
"01"
" 23"
"23 "
"2.0"
"abc"
""
null
undefined
0
23
NaN
Infinity
{}
[]
```

## 16.3 `PredictionTarget`

Probar:

* target NUMBER válido;
* `"0"`;
* `"00"`;
* `"36"`;
* tipo desconocido;
* value inexistente;
* type inexistente;
* target string;
* target array;
* target mutable;
* mutación externa posterior;
* mutación desde el record.

## 16.4 `rawConsensusScore`

Probar:

* valor válido;
* cero;
* límites reales;
* `NaN`;
* `Infinity`;
* `-Infinity`;
* string;
* boolean;
* ausencia;
* no redondeo;
* conservación exacta.

## 16.5 Calibración opcional o explícita

Según el diseño elegido:

* ausencia explícita;
* probabilidad válida;
* `0`;
* `1`;
* menor que `0`;
* mayor que `1`;
* estrategia vacía;
* metadata de modelo;
* inmutabilidad;
* separación respecto al score bruto.

## 16.6 Outcome físico

Probar:

* winning number válido;
* `"0"`;
* `"00"`;
* número inválido;
* outcome duplicado idéntico;
* resultado contradictorio;
* mismo `spinId`;
* distinto `spinId`.

## 16.7 Inmutabilidad profunda

Probar:

* objetos anidados;
* arrays;
* metadata externa modificada después de crear record;
* target externo modificado;
* calibration externa modificada;
* objeto recuperado del repositorio modificado;
* arrays recuperados modificados;
* metadata circular;
* función en metadata;
* símbolo;
* BigInt;
* objeto con prototipo personalizado;
* claves peligrosas.

## 16.8 Temporalidad

Probar:

* prediction antes de outcome;
* prediction después de outcome;
* outcome después de prediction;
* outcome antes de prediction;
* igualdad;
* zonas horarias equivalentes;
* timestamp inválido;
* milliseconds;
* varios predictions de un mismo spin;
* una prediction contaminada entre varias válidas.

## 16.9 Estado

Probar:

* spin inexistente;
* prediction sin outcome;
* prediction con outcome;
* múltiples predictions;
* estado imposible;
* comportamiento de `CONFLICT`, si se mantiene;
* deprecación, si corresponde.

## 16.10 Repositorio

Probar:

* orden determinista;
* desempate por ID;
* idempotencia;
* contenido diferente con mismo ID;
* no sobrescritura;
* aislamiento entre spins;
* clear;
* consultas repetidas;
* copia defensiva.

---

# 17. Validaciones completas

Ejecuta los scripts reales del repositorio.

Como mínimo, busca equivalentes a:

```bash
npm test
npm run lint
npm run build
npm run check:architecture
```

También ejecuta, cuando existan:

* typecheck;
* anti-legacy;
* tests de contratos;
* tests de reproducibilidad;
* test de dependencias;
* smoke benchmark;
* format check.

No inventes comandos.

Registra:

* comando;
* resultado;
* duración;
* número de tests;
* warnings;
* errores.

No declares PASS si no ejecutaste los checks.

---

# 18. Revisión de dependencias

Preferencia obligatoria:

```text
0 dependencias nuevas
```

No instalar:

* librerías de validación;
* librerías de deep freeze;
* librerías de fechas;
* UUID packages;
* ORM;
* base de datos;
* serializers externos.

Utiliza JavaScript estándar cuando sea suficiente.

Si necesitas una utilidad de deep freeze o validación JSON segura, impleméntala de forma pequeña, auditada y probada.

Evita una función genérica excesivamente compleja.

---

# 19. Archivos esperados

Adapta según la estructura real.

Posibles archivos nuevos o modificados:

```text
src/historical-evidence/domain/
  RouletteNumber.js
  PredictionTarget.js
  PredictionRecord.js
  OutcomeRecord.js
  EvidenceStatus.js
  errors.js
  immutable.js

src/historical-evidence/application/
  RecordPredictionUseCase.js
  RecordOutcomeUseCase.js
  GetEvidenceBySpinUseCase.js

src/historical-evidence/infrastructure/
  InMemoryEvidenceRepository.js

tests/historical-evidence/
  Domain.test.js
  Repository.test.js
  UseCases.test.js
  Hardening.test.js
  TemporalIntegrity.test.js
```

No crees archivos vacíos ni divisiones innecesarias.

Mantén alta cohesión.

---

# 20. Informe obligatorio

Crear un informe final.

Nombre sugerido:

```text
reports/Fase2.3.1.1_hardening_reporte.md
```

El informe debe contener:

## Estado

```text
PASS
PASS_WITH_OBSERVATIONS
BLOCKED
```

## Resumen ejecutivo

* problema corregido;
* alcance;
* resultado;
* número de tests;
* ausencia o presencia de regresiones.

## Hallazgos iniciales

Documentar:

* validación de números previa;
* contrato anterior de `PredictionRecord`;
* contrato anterior de `OutcomeRecord`;
* uso previo de `CONFLICT`;
* profundidad real de `Object.freeze`;
* existencia o ausencia de control temporal.

## Decisiones tomadas

* representación de número;
* target;
* score bruto;
* calibración;
* resultado físico;
* observedOutcome;
* estados;
* metadata;
* inmutabilidad;
* cronología;
* compatibilidad.

## Cambios incompatibles

Indicar explícitamente:

* contratos modificados;
* exports modificados;
* tests migrados;
* consumidores afectados;
* razón científica.

## Archivos creados

Tabla:

| Archivo | Propósito | Capa |
| ------- | --------- | ---- |

## Archivos modificados

Tabla:

| Archivo | Cambio | Justificación |
| ------- | ------ | ------------- |

## Tests

* baseline anterior;
* tests nuevos;
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
* otros.

## Riesgos pendientes

Como mínimo:

* todavía no existe persistencia;
* todavía no existe mapper productivo;
* todavía no existe integración con SpinManager;
* todavía no existen CalibrationObservations;
* todavía no hay dataset histórico real;
* todavía no se autoriza model selection.

## Próxima fase

Recomendar:

```text
Fase 2.3.2 — Construcción de CalibrationObservation y mappers explícitos
```

No implementarla.

---

# 21. Criterios de aceptación

La fase solo se aprueba si:

## Números

* Solo se aceptan `"0"`, `"00"` y `"1"`–`"36"`.
* `"0"` y `"00"` permanecen diferenciados.
* El dominio rechaza números inválidos.
* No existe coerción silenciosa.

## Predicción

* `rawConsensusScore` tiene semántica inequívoca.
* Es obligatorio para evidencia de calibración.
* Se valida como número finito.
* No se confunde con probabilidad calibrada.
* Existe un target extensible.
* `NUMBER` está implementado y probado.

## Resultado

* El resultado físico se representa inequívocamente.
* `winningNumber` es válido.
* No existen dos resultados contradictorios por `spinId`.
* `observedOutcome` no se mezcla incorrectamente con el resultado físico.

## Inmutabilidad

* Records profundamente inmutables.
* Metadata profundamente inmutable.
* Targets inmutables.
* Calibration metadata inmutable.
* El repositorio devuelve copias o records seguros.
* No existen mutaciones externas observables.

## Temporalidad

* Se detectan predicciones posteriores al resultado.
* Se detectan outcomes anteriores a predicciones existentes.
* La política de igualdad está documentada.
* Las zonas horarias se comparan correctamente.
* Existe error específico anti-leakage.

## Estado

* Los estados son alcanzables y coherentes.
* `CONFLICT` se elimina, depreca o justifica.
* No existen estados muertos sin documentación.

## Repositorio

* No sobrescribe evidencia.
* Es idempotente para registros idénticos.
* Rechaza contenido diferente con el mismo ID.
* Mantiene orden determinista.
* Mantiene aislamiento por `spinId`.

## Calidad

* Todos los tests relevantes pasan.
* No hay regresiones.
* Lint aprobado.
* Build aprobado.
* Arquitectura aprobada.
* Sin tests omitidos.
* Sin dependencias injustificadas.
* Sin `Math.random()`.
* Sin `@ts-ignore`.
* Sin desactivaciones de lint injustificadas.

## Ciencia

* No se entrena.
* No se calibra automáticamente.
* No se promueve modelo.
* `IdentityCalibration` permanece igual.
* No se modifica benchmark.
* No se usan datos sintéticos como evidencia productiva.

---

# 22. Fuera de alcance

No implementar:

* `ConsensusToPredictionMapper`;
* integración automática con `ConsensusEngine`;
* integración automática con `ProbabilityCalibrator`;
* integración automática con `SpinManager`;
* `CalibrationObservation` completo;
* `HistoricalDataset`;
* versionado de datasets;
* SHA-256 de datasets;
* exportadores;
* almacenamiento persistente;
* UI;
* dashboards;
* model selection;
* retraining;
* promoción;
* Motor de Amplitud de Señal.

---

# 23. Secuencia de ejecución

## Paso 1 — Auditoría

Inspecciona:

* código;
* contratos;
* consumidores;
* tests;
* exports;
* números;
* timestamps;
* inmutabilidad;
* estados.

## Paso 2 — Diseño

Define:

* target;
* score;
* calibración;
* resultado físico;
* metadata;
* estados;
* temporalidad;
* compatibilidad.

## Paso 3 — Implementación

Orden recomendado:

1. validación canónica de números;
2. target;
3. metadata segura;
4. errores;
5. `PredictionRecord`;
6. `OutcomeRecord`;
7. estado;
8. repositorio;
9. casos de uso;
10. tests;
11. exports;
12. documentación.

## Paso 4 — Validación focalizada

Ejecuta primero tests de:

* dominio;
* metadata;
* temporalidad;
* repositorio;
* casos de uso.

## Paso 5 — Regresión total

Ejecuta toda la suite.

## Paso 6 — Auditoría final

Comprueba:

* no integración productiva;
* no side effects;
* no dependencia nueva;
* no ciclos;
* no contratos ambiguos;
* no leakage temporal.

## Paso 7 — Informe

Genera el informe final verificable.

---

# 24. Reglas de trabajo

* No reformatees el repositorio completo.
* No hagas refactors fuera de alcance.
* No cambies nombres por preferencia estética.
* No ocultes incompatibilidades.
* No debilites tests.
* No uses `.skip`.
* No uses `.only`.
* No uses `any`.
* No uses coerción silenciosa.
* No uses `JSON.parse(JSON.stringify(...))` sin analizar pérdidas.
* No aceptes metadata no reproducible.
* No ejecutes getters recibidos.
* No confíes en prototipos externos.
* No uses timestamps como IDs.
* No uses arrays como asociación entre prediction y outcome.
* No relaciones por proximidad temporal.
* No mezcles outcome físico con evaluación de target.
* No declares éxito sin evidencia.

---

# 25. Estado final esperado

Al finalizar:

```text
PredictionTarget(NUMBER)
          │
          ▼
PredictionRecord
  ├── spinId
  ├── target
  ├── rawConsensusScore
  ├── calibration explícita o ausente
  ├── createdAt
  └── metadata inmutable

SpinOutcomeRecord
  ├── spinId
  ├── winningNumber
  ├── recordedAt
  └── metadata inmutable
```

Asociación:

```text
spinId
├── PredictionRecord A
├── PredictionRecord B
└── SpinOutcomeRecord
```

Validación temporal:

```text
Prediction.createdAt <= Outcome.recordedAt
```

según la política finalmente adoptada.

Todavía no debe existir:

```text
CalibrationObservation persistida
HistoricalDataset
entrenamiento
promoción
integración automática
```

---

# 26. Formato de respuesta final

Entrega:

```text
FASE 2.3.1.1 — RESULTADO

Estado:
PASS | PASS_WITH_OBSERVATIONS | BLOCKED

Hallazgos iniciales:
- ...

Contratos endurecidos:
- ...

Validación de números:
- ...

PredictionTarget:
- ...

Score bruto:
- ...

Calibración:
- ...

Outcome físico:
- ...

Estados:
- ...

Inmutabilidad:
- ...

Temporalidad:
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
Fase 2.3.2 — Construcción de CalibrationObservation y mappers explícitos
```

No inventes cifras.

No declares PASS si algún check no fue ejecutado.

---

# 27. Instrucción final

Comienza inspeccionando el repositorio, el informe de la Fase 2.3.1 y los contratos existentes.

Luego implementa únicamente:

```text
FASE 2.3.1.1
Hardening de contratos e invariantes de evidencia histórica
```

Prioridad:

```text
INTEGRIDAD CIENTÍFICA
>
PREVENCIÓN DE LEAKAGE
>
INMUTABILIDAD
>
SEMÁNTICA DE CONTRATOS
>
COMPATIBILIDAD
>
EXTENSIBILIDAD
>
VELOCIDAD
```

La fase debe terminar con contratos inequívocos, datos profundamente inmutables, validación temporal, números de ruleta estrictos, pruebas completas y ninguna integración automática con producción.
