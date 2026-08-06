# PROMPT MAESTRO — FASE 2.3.1

## Infraestructura base del Historical Evidence Pipeline

### Proyecto

**Roulette Tracker**

Nombre anterior del proyecto:

* ORION
* ORION_v2

### Fase

**Fase 2.3.1 — Infraestructura de captura de evidencia histórica**

---

# 1. Rol del agente

Actúa como:

* Arquitecto principal de software.
* Ingeniero senior TypeScript/Node.js.
* Especialista en Clean Architecture.
* Especialista en sistemas estadísticos reproducibles.
* Revisor de contratos públicos.
* Ingeniero de pruebas.
* Auditor de integridad de datos.
* Responsable de documentación técnica.

Debes analizar e implementar esta fase directamente en el repositorio de Roulette Tracker.

No actúes como un simple generador de código.

Antes de modificar archivos:

1. Inspecciona la arquitectura real.
2. Localiza los módulos existentes.
3. Identifica los patrones de diseño utilizados.
4. Revisa los contratos públicos actuales.
5. Revisa la configuración TypeScript.
6. Revisa el sistema de pruebas.
7. Revisa las convenciones de nombres.
8. Revisa los scripts disponibles en `package.json`.
9. Revisa la estructura de informes.
10. Detecta posibles incompatibilidades con las decisiones arquitectónicas vigentes.

No inventes rutas, comandos, módulos ni convenciones sin comprobar primero que existen.

---

# 2. Contexto arquitectónico obligatorio

Roulette Tracker es una plataforma modular para analizar ruleta americana mecánica mediante motores independientes.

La arquitectura actual incluye, entre otros:

* `SignalCollector`
* `SignalNormalizer`
* `ConsensusEngine`
* `ProbabilityCalibrator`
* infraestructura de benchmark;
* estrategias de calibración;
* bootstrap pareado;
* grouped temporal split;
* detección de leakage;
* serialización canónica;
* SHA-256;
* políticas de promoción;
* reproducibilidad científica.

El `ProbabilityCalibrator` se encuentra técnicamente validado.

Estado actual:

```text
PIPELINE: GREEN
ESTADO TÉCNICO: GO
PRODUCCIÓN: NOT_READY
EVIDENCIA: INSUFFICIENT_EVIDENCE
ESTRATEGIA DEFAULT: IdentityCalibration
```

La causa de `INSUFFICIENT_EVIDENCE` es la ausencia de observaciones históricas reales que relacionen, como mínimo:

```text
rawConsensusScore
observedOutcome
```

La Fase 2.3 debe construir la infraestructura necesaria para comenzar a capturar esta evidencia.

---

# 3. Decisiones arquitectónicas que no pueden violarse

Debes mantener las siguientes decisiones:

## ADR-001

`IdentityCalibration` continúa como estrategia por defecto hasta que exista evidencia histórica suficiente.

## ADR-002

Nunca promover estrategias de calibración utilizando únicamente datos sintéticos.

## ADR-003

Los hashes de modelos y artefactos reproducibles utilizan SHA-256.

## ADR-004

La serialización utilizada para hashing debe ser canónica.

## ADR-005

Las observaciones pertenecientes a una misma tirada no pueden dividirse incorrectamente entre conjuntos de entrenamiento, validación o prueba.

## ADR-006

Los procesos científicos deben ser reproducibles.

## ADR-007

Debe mantenerse la separación entre entrenamiento e inferencia.

## ADR-008

Los módulos experimentales no pueden modificar el comportamiento de producción.

## Restricción adicional

Esta fase no puede:

* cambiar `IdentityCalibration`;
* promover calibradores;
* entrenar modelos;
* ejecutar model selection;
* modificar `calibratedProbability`;
* modificar la matemática de `ConsensusEngine`;
* integrar todavía el entrenamiento con datos reales;
* implementar todavía exportadores definitivos;
* implementar todavía una interfaz gráfica;
* introducir dependencia directa entre el pipeline histórico y una estrategia concreta de calibración.

---

# 4. Objetivo principal de la Fase 2.3.1

Implementar la infraestructura base para registrar:

1. Una predicción generada antes de una tirada.
2. El resultado real observado después de la tirada.
3. La relación inequívoca entre ambos registros.
4. El estado de una observación pendiente o completada.
5. La trazabilidad mínima necesaria para futuras fases.

Esta fase debe entregar una base limpia, desacoplada y extensible para que las siguientes subfases puedan construir:

```text
PredictionRecord
+
OutcomeRecord
↓
CalibrationObservation
↓
HistoricalDataset
↓
Benchmark con evidencia real
```

En esta fase solamente debe implementarse la infraestructura de captura y asociación básica.

---

# 5. Alcance funcional

## 5.1 Contrato `PredictionRecord`

Crear o adaptar un contrato público que represente una predicción emitida antes de conocer el resultado real.

Debe evaluar, como mínimo, los siguientes campos conceptuales:

```typescript
interface PredictionRecord {
  readonly predictionId: string;
  readonly spinId: string;
  readonly sessionId?: string;
  readonly createdAt: string;
  readonly rawConsensusScore: number;
  readonly predictedProbability?: number;
  readonly target: PredictionTarget;
  readonly source: PredictionSource;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

Este ejemplo es conceptual.

Debes adaptar nombres, tipos y ubicación a las convenciones reales del repositorio.

### Requisitos

* `predictionId` debe identificar inequívocamente la predicción.
* `spinId` debe identificar la tirada a la cual corresponde.
* `createdAt` debe ser explícito y serializable.
* `rawConsensusScore` debe conservar el valor emitido por el consenso antes de calibración.
* El contrato debe ser inmutable.
* No debe depender de una implementación concreta del calibrador.
* No debe contener el resultado real.
* No debe permitir campos ambiguos que mezclen predicción y observación.
* Debe permitir extender targets futuros sin romper el contrato.

---

## 5.2 Contrato `OutcomeRecord`

Crear o adaptar un contrato público que represente el resultado real de una tirada.

Ejemplo conceptual:

```typescript
interface OutcomeRecord {
  readonly outcomeId: string;
  readonly spinId: string;
  readonly recordedAt: string;
  readonly winningNumber: number;
  readonly observedOutcome: boolean | number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

Debes determinar, mediante análisis del repositorio, cuál es la representación correcta de `observedOutcome`.

### Requisitos

* Debe validar correctamente los números admitidos por la ruleta americana.
* Debe considerar explícitamente `0` y `00`.
* No debes representar `00` de forma ambigua.
* No debes asumir que `00` equivale numéricamente a `0`.
* `spinId` debe asociar el resultado con las predicciones generadas para esa tirada.
* El contrato debe ser inmutable.
* El resultado no debe incluir datos internos del calibrador.
* Debe poder soportar más de un target derivado del mismo resultado físico.

### Decisión obligatoria sobre `00`

Inspecciona primero cómo representa actualmente Roulette Tracker el doble cero.

Si ya existe un tipo de dominio para números de ruleta:

* reutilízalo;
* no crees una representación paralela.

Si no existe:

* diseña un tipo de dominio explícito;
* documenta la decisión;
* evita conversiones implícitas;
* añade pruebas específicas para `0` y `00`.

---

## 5.3 Estado de captura

Definir una representación explícita para el ciclo de vida de una evidencia.

Estados mínimos sugeridos:

```text
PENDING_OUTCOME
COMPLETED
INVALID
```

No agregues estados innecesarios.

El sistema debe distinguir claramente:

* una predicción válida que todavía no tiene resultado;
* una predicción asociada correctamente con un resultado;
* un registro rechazado por inconsistencia.

No utilices `null`, `undefined` o ausencia silenciosa como única representación del estado del proceso.

---

## 5.4 Repositorio de evidencia

Diseñar una abstracción similar a:

```typescript
interface EvidenceRepository {
  savePrediction(record: PredictionRecord): Promise<void>;
  saveOutcome(record: OutcomeRecord): Promise<void>;

  findPredictionById(
    predictionId: string
  ): Promise<PredictionRecord | undefined>;

  findPredictionsBySpinId(
    spinId: string
  ): Promise<readonly PredictionRecord[]>;

  findOutcomeBySpinId(
    spinId: string
  ): Promise<OutcomeRecord | undefined>;
}
```

El ejemplo es conceptual.

Adapta la interfaz al estilo existente del proyecto.

### Requisitos arquitectónicos

* La interfaz debe pertenecer a una capa de dominio o aplicación, no a infraestructura concreta.
* La lógica principal no debe depender directamente del sistema de archivos.
* La lógica principal no debe depender directamente de SQLite, DuckDB, PostgreSQL ni otro motor.
* No debe existir acceso directo a archivos desde los casos de uso.
* La abstracción debe permitir implementar distintos adaptadores posteriormente.
* No introduzcas un ORM en esta fase.
* No introduzcas una base de datos externa en esta fase.
* No agregues una dependencia pesada sin justificación.

---

## 5.5 Implementación inicial en memoria

Implementar un adaptador inicial:

```text
InMemoryEvidenceRepository
```

El nombre puede adaptarse a las convenciones reales.

Debe permitir:

* guardar predicciones;
* recuperar predicciones;
* buscar predicciones por `spinId`;
* registrar resultados;
* recuperar resultados;
* rechazar identificadores duplicados;
* evitar resultados contradictorios para la misma tirada;
* conservar inmutabilidad;
* utilizarse en pruebas unitarias;
* garantizar comportamiento determinista.

No debe presentarse como almacenamiento persistente de producción.

Debe documentarse explícitamente como adaptador inicial para pruebas y desarrollo.

---

# 6. Casos de uso

Implementar casos de uso separados.

## 6.1 `RecordPrediction`

Responsabilidad:

Registrar una predicción antes de conocer el resultado.

Debe validar:

* identificadores obligatorios;
* fecha válida;
* score finito;
* rango del score, solo si el contrato real del sistema define un rango;
* target válido;
* ausencia de duplicados;
* consistencia entre `predictionId` y `spinId`;
* que el resultado no sea incorporado accidentalmente en el registro.

No debes imponer arbitrariamente `[0,1]` a `rawConsensusScore` sin comprobar antes el contrato existente.

Si el sistema ya garantiza `[0,1]`, reutiliza esa regla.

Si no lo garantiza, documenta el rango real.

---

## 6.2 `RecordOutcome`

Responsabilidad:

Registrar el resultado real de una tirada.

Debe validar:

* identificadores obligatorios;
* fecha válida;
* número de ruleta válido;
* soporte correcto de `0` y `00`;
* ausencia de resultados contradictorios;
* idempotencia cuando se intenta guardar exactamente el mismo resultado;
* error explícito cuando se intenta reemplazar un resultado por otro distinto.

No debe entrenar ningún modelo.

No debe calcular métricas.

No debe promover calibradores.

---

## 6.3 `GetEvidenceBySpin`

Responsabilidad:

Consultar la evidencia disponible para una tirada.

Resultado conceptual:

```typescript
interface SpinEvidence {
  readonly spinId: string;
  readonly predictions: readonly PredictionRecord[];
  readonly outcome?: OutcomeRecord;
  readonly status: EvidenceStatus;
}
```

Debe devolver:

* todas las predicciones asociadas;
* el resultado, cuando exista;
* el estado de la evidencia;
* una estructura inmutable.

No debe construir todavía un dataset de entrenamiento definitivo.

---

# 7. Invariantes obligatorias

Implementar y probar estas invariantes:

## Identidad

* `predictionId` no puede duplicarse.
* `outcomeId` no puede duplicarse.
* Cada resultado físico pertenece a un `spinId`.
* Una tirada no puede tener dos resultados físicos contradictorios.

## Temporalidad

* La predicción debe representar una decisión generada antes de conocer el resultado.
* Si existen timestamps comparables, debe rechazarse o marcarse una predicción creada después del resultado.
* No introduzcas validaciones temporales incorrectas si los relojes o zonas horarias no están definidos.
* Utiliza UTC y formato ISO 8601 cuando sea compatible con la arquitectura existente.

## Inmutabilidad

* Los objetos almacenados no deben poder modificarse externamente.
* Los arrays devueltos deben ser `readonly` o copias defensivas.
* Los metadatos no deben permitir mutación accidental.

## Determinismo

* Consultas equivalentes deben devolver resultados con orden estable.
* Define y documenta el criterio de orden.
* No dependas del orden incidental de estructuras internas.

## Asociación

* `spinId` es el vínculo primario entre predicción y resultado.
* No utilices timestamps como mecanismo principal de asociación.
* No relaciones predicción y resultado por posición en un array.
* No relaciones predicción y resultado por proximidad temporal.

---

# 8. Modelo de errores

No utilices mensajes de error dispersos sin estructura.

Revisa primero el patrón de errores existente.

Si el proyecto ya tiene errores de dominio:

* reutilízalos;
* extiéndelos de manera coherente.

Si no existe un patrón suficiente, crea errores específicos y mínimos, por ejemplo:

```text
DuplicatePredictionError
DuplicateOutcomeError
ConflictingOutcomeError
PredictionNotFoundError
InvalidRouletteNumberError
InvalidEvidenceTimestampError
```

No es obligatorio usar exactamente estos nombres.

Los errores deben:

* tener tipo identificable;
* incluir contexto suficiente;
* no filtrar información sensible;
* ser cubiertos por pruebas;
* mantener mensajes deterministas.

---

# 9. Estructura de módulos

Antes de crear carpetas, analiza la estructura real.

La organización conceptual esperada puede ser similar a:

```text
src/
└── historical-evidence/
    ├── domain/
    │   ├── PredictionRecord.ts
    │   ├── OutcomeRecord.ts
    │   ├── EvidenceStatus.ts
    │   └── errors/
    │
    ├── application/
    │   ├── ports/
    │   │   └── EvidenceRepository.ts
    │   └── use-cases/
    │       ├── RecordPrediction.ts
    │       ├── RecordOutcome.ts
    │       └── GetEvidenceBySpin.ts
    │
    ├── infrastructure/
    │   └── InMemoryEvidenceRepository.ts
    │
    └── index.ts
```

Esta estructura es orientativa.

No debes imponerla si el proyecto utiliza otra organización.

Prioriza:

* coherencia;
* aislamiento;
* contratos explícitos;
* dependencias dirigidas hacia el dominio;
* facilidad de prueba;
* ausencia de ciclos.

---

# 10. Integración con el sistema actual

La integración debe ser mínima y controlada.

## Permitido

* reutilizar tipos públicos existentes;
* reutilizar `ConsensusOutput`;
* extraer de él los datos necesarios para construir `PredictionRecord`;
* añadir un mapper explícito cuando sea necesario;
* exportar los nuevos contratos desde los barrels correspondientes;
* incorporar nuevos tests y documentación.

## No permitido

* modificar la fórmula del consenso;
* modificar la probabilidad calibrada;
* cambiar el calibrador por defecto;
* añadir escritura histórica automática dentro de `ConsensusEngine`;
* añadir dependencias de infraestructura dentro de `ConsensusEngine`;
* acoplar la captura de evidencia al flujo principal sin una frontera clara;
* introducir side effects ocultos al calcular consenso.

Si se necesita conectar `ConsensusOutput` con `PredictionRecord`, crea un mapper o factory explícito, por ejemplo:

```text
ConsensusOutput
↓
PredictionRecordFactory
↓
RecordPrediction
```

La creación del registro no debe producir escritura automática por sorpresa.

---

# 11. Pruebas obligatorias

Debes implementar pruebas unitarias y, cuando corresponda, pruebas de integración interna.

Como mínimo, cubrir:

## `PredictionRecord`

* creación válida;
* identificadores vacíos;
* timestamp inválido;
* score `NaN`;
* score `Infinity`;
* score `-Infinity`;
* inmutabilidad;
* metadatos inmutables;
* target inválido.

## `OutcomeRecord`

* número ordinario válido;
* cero válido;
* doble cero válido;
* número negativo inválido;
* número mayor que 36 inválido;
* representación ambigua de `00`;
* timestamp inválido;
* inmutabilidad.

## Repositorio

* guardar una predicción;
* recuperar una predicción;
* recuperar predicciones por `spinId`;
* orden determinista;
* duplicado de `predictionId`;
* guardar un resultado;
* recuperar un resultado;
* idempotencia del mismo resultado;
* rechazo de resultado contradictorio;
* aislamiento entre diferentes tiradas;
* copia defensiva;
* mutación externa no afecta almacenamiento interno.

## `RecordPrediction`

* registro válido;
* duplicado;
* entrada inválida;
* no incorpora resultado;
* no modifica el consenso original.

## `RecordOutcome`

* registro válido;
* `0`;
* `00`;
* resultado duplicado idéntico;
* resultado contradictorio;
* entrada inválida.

## `GetEvidenceBySpin`

* tirada sin datos;
* tirada con predicciones pendientes;
* tirada con resultado;
* evidencia completada;
* múltiples predicciones de la misma tirada;
* orden estable;
* resultado inmutable.

## Temporalidad

Si la arquitectura permite comparar timestamps:

* predicción anterior al resultado;
* predicción posterior al resultado;
* igualdad de timestamps;
* timestamps con zonas horarias distintas pero equivalentes.

No fuerces una política temporal no acordada.

Si aparece una decisión ambigua, documenta la política elegida.

---

# 12. Pruebas de regresión

Ejecuta toda la suite existente.

La implementación no puede romper:

* los 634 tests existentes;
* el build;
* el lint;
* la arquitectura;
* los contratos públicos;
* los benchmarks;
* la reproducibilidad;
* la serialización canónica;
* SHA-256;
* grouped temporal split;
* paired bootstrap;
* leakage detection.

El número exacto de tests podrá aumentar.

Ningún test existente puede eliminarse o debilitarse para conseguir estado verde.

Está prohibido:

* usar `.skip`;
* usar `.only`;
* comentar tests fallidos;
* reducir assertions;
* capturar excepciones para ocultar errores;
* modificar expectativas científicas sin justificación.

---

# 13. Validaciones técnicas

Ejecuta los comandos reales disponibles en el repositorio.

Como mínimo, busca equivalentes a:

```bash
npm test
npm run lint
npm run build
npm run check:architecture
```

No asumas que todos existen.

Inspecciona `package.json` y utiliza los scripts reales.

También ejecuta, cuando existan:

* typecheck;
* pruebas de arquitectura;
* pruebas anti-legacy;
* pruebas de contratos;
* validaciones de dependencias;
* benchmark smoke tests;
* controles de formato.

Registra cada comando y su resultado.

---

# 14. Compatibilidad y disciplina de dependencias

Antes de instalar cualquier paquete:

1. Demuestra que la funcionalidad no puede implementarse razonablemente con herramientas existentes.
2. Revisa las dependencias ya instaladas.
3. Evalúa impacto en seguridad.
4. Evalúa impacto en tamaño.
5. Evalúa impacto en reproducibilidad.
6. Documenta la justificación.

Preferencia:

```text
0 dependencias nuevas
```

No instalar:

* ORM;
* base de datos;
* framework de eventos;
* biblioteca de UUID, salvo que sea estrictamente necesaria;
* biblioteca de fechas, salvo necesidad demostrada;
* librerías de validación redundantes;
* herramientas experimentales.

Utiliza capacidades estándar de Node.js cuando sea razonable.

---

# 15. Identificadores

No generes identificadores de forma no determinista dentro del dominio si eso dificulta las pruebas.

Separa:

```text
generación de ID
```

de:

```text
registro de evidencia
```

Preferentemente, los casos de uso reciben IDs ya generados o dependen de un puerto explícito:

```typescript
interface IdGenerator {
  generate(): string;
}
```

Si el proyecto ya tiene una solución para IDs, reutilízala.

No uses:

* `Math.random()`;
* timestamps como único identificador;
* índices de arrays;
* concatenaciones ambiguas.

Si utilizas UUID:

* emplea una implementación estándar;
* mantén la generación inyectable para pruebas.

---

# 16. Fechas y relojes

Evita llamadas directas a `new Date()` dentro de lógica que deba probarse de forma determinista.

Si el proyecto ya tiene un `Clock`, reutilízalo.

Si no existe y es necesario, define un puerto mínimo:

```typescript
interface Clock {
  now(): Date;
}
```

o una abstracción equivalente.

Debe existir una implementación de producción y una forma determinista de prueba.

No agregues abstracciones innecesarias si los timestamps siempre ingresan como parte del comando.

Documenta la decisión.

---

# 17. Seguridad e integridad

Aunque esta fase no implemente persistencia definitiva, debe considerar:

* rechazo de objetos malformados;
* protección frente a mutación;
* límites razonables para metadatos;
* ausencia de prototipos peligrosos en metadata;
* serialización segura;
* no ejecutar contenido recibido;
* no confiar en campos derivados enviados por consumidores;
* evitar colisiones silenciosas;
* no sobrescribir evidencia existente.

No implementes cifrado si no existe un requisito.

No registres información sensible en logs.

---

# 18. Documentación obligatoria

Crear un informe final en la carpeta de reportes existente.

Nombre sugerido:

```text
FASE_2_3_1_HISTORICAL_EVIDENCE_CAPTURE_REPORT.md
```

Adapta la ruta y el nombre a las convenciones reales.

El informe debe incluir:

## Resumen ejecutivo

* qué se implementó;
* resultado de la fase;
* estado técnico;
* restricciones mantenidas.

## Arquitectura encontrada

* estructura relevante del repositorio;
* módulos reutilizados;
* contratos existentes relacionados.

## Decisiones tomadas

* representación de `0`;
* representación de `00`;
* tipo de `observedOutcome`;
* política de timestamps;
* política de duplicados;
* política de idempotencia;
* política de inmutabilidad;
* criterio de orden determinista.

## Archivos creados

Tabla con:

* archivo;
* propósito;
* capa;
* estado.

## Archivos modificados

Tabla con:

* archivo;
* cambio;
* justificación;
* compatibilidad.

## Contratos públicos

Documentar:

* `PredictionRecord`;
* `OutcomeRecord`;
* `EvidenceStatus`;
* `EvidenceRepository`;
* casos de uso;
* errores públicos.

## Pruebas

Incluir:

* tests nuevos;
* tests totales;
* resultado;
* cobertura relevante;
* casos límite.

## Validaciones

Incluir:

* test;
* lint;
* build;
* arquitectura;
* typecheck;
* anti-legacy;
* cualquier otra validación existente.

## Riesgos pendientes

Como mínimo:

* almacenamiento persistente no implementado;
* datasets históricos todavía no construidos;
* exportación todavía no implementada;
* selección de modelos todavía bloqueada;
* evidencia real todavía insuficiente.

## Recomendación para la siguiente subfase

Proponer alcance concreto para:

```text
Fase 2.3.2 — Construction of Calibration Observations
```

No implementarla en esta ejecución.

---

# 19. ADR de la fase

Crear un ADR cuando la estructura del proyecto utilice ADR o cuando la decisión sobre representación de tiradas lo justifique.

Tema sugerido:

```text
ADR — Historical Evidence Identity and Spin Association
```

Debe formalizar:

* `spinId` como identidad primaria de asociación;
* predicción registrada antes del resultado;
* resultado físico único por tirada;
* múltiples predicciones posibles por tirada;
* representación inequívoca de `0` y `00`;
* separación entre captura y construcción de datasets;
* adaptadores intercambiables mediante `EvidenceRepository`;
* ausencia de entrenamiento en la capa de captura.

Si el repositorio no usa ADR, documenta estas decisiones en el informe sin crear una convención paralela innecesaria.

---

# 20. Criterios de aceptación

La fase se considera aprobada solamente si se cumplen todos estos puntos:

## Arquitectura

* Existe un módulo de evidencia histórica desacoplado.
* Existe un contrato de predicción.
* Existe un contrato de resultado.
* Existe una abstracción de repositorio.
* Existe una implementación en memoria.
* Existen casos de uso separados.
* No hay dependencia del dominio hacia infraestructura.
* No hay ciclos nuevos.

## Datos

* `spinId` relaciona predicción y resultado.
* `predictionId` es único.
* `outcomeId` es único.
* `0` y `00` son inequívocos.
* No se sobrescribe evidencia silenciosamente.
* Los resultados contradictorios son rechazados.
* La evidencia es inmutable.
* Las consultas son deterministas.

## Ciencia

* No se entrena ningún calibrador.
* No se ejecuta model selection.
* No se cambia `IdentityCalibration`.
* No se promueve ninguna estrategia.
* No se utilizan datos sintéticos como evidencia productiva.
* No se modifica el benchmark científico existente.

## Calidad

* Todos los tests anteriores continúan aprobados.
* Todos los tests nuevos están aprobados.
* Build aprobado.
* Lint aprobado.
* Typecheck aprobado, si existe.
* Arquitectura aprobada, si existe el control.
* No hay tests omitidos.
* No se redujo cobertura deliberadamente.
* No se agregaron dependencias injustificadas.

## Documentación

* Informe final creado.
* Decisiones documentadas.
* Riesgos documentados.
* Próxima subfase delimitada.
* Archivos y contratos inventariados.

---

# 21. Fuera de alcance

No implementar en esta fase:

* persistencia SQLite;
* persistencia DuckDB;
* persistencia PostgreSQL;
* persistencia Parquet;
* exportación CSV;
* exportación JSONL;
* exportación Arrow;
* versionado final de datasets;
* hashing de datasets;
* snapshots históricos;
* entrenamiento del calibrador;
* selección de modelos;
* PromotionPolicy con datos reales;
* dashboards;
* pestañas de interfaz;
* captura automática desde la UI;
* migraciones;
* sincronización remota;
* ingestión masiva;
* reparación de históricos;
* Motor de Amplitud de Señal.

Estos elementos corresponden a fases posteriores.

---

# 22. Estrategia de ejecución

Ejecuta el trabajo en este orden:

## Paso 1 — Inspección

* Verifica la raíz del repositorio.
* Revisa `package.json`.
* Revisa `tsconfig`.
* Revisa estructura de `src`.
* Revisa tests.
* Revisa barrel exports.
* Revisa ADR.
* Revisa informes.
* Revisa errores de dominio.
* Revisa cómo se representa una tirada.
* Revisa cómo se representa `00`.
* Revisa `ConsensusOutput`.
* Revisa el calibrador.
* Revisa reglas de arquitectura.

## Paso 2 — Diseño

Antes de programar, define internamente:

* contratos;
* capas;
* dependencias;
* invariantes;
* errores;
* política de ID;
* política de tiempo;
* política de doble cero;
* criterio de orden;
* estrategia de pruebas.

## Paso 3 — Implementación incremental

Implementa en incrementos pequeños:

1. tipos de dominio;
2. validaciones;
3. errores;
4. puerto del repositorio;
5. adaptador en memoria;
6. casos de uso;
7. mapper opcional desde `ConsensusOutput`;
8. exports públicos;
9. pruebas;
10. documentación.

## Paso 4 — Validación

Ejecuta primero pruebas focalizadas y luego la suite completa.

Corrige errores sin debilitar pruebas.

## Paso 5 — Auditoría

Revisa:

* dependencias;
* ciclos;
* mutabilidad;
* duplicados;
* determinismo;
* timestamps;
* doble cero;
* side effects;
* compatibilidad pública.

## Paso 6 — Informe

Genera el informe final con evidencia verificable.

---

# 23. Manejo de ambigüedades

No detengas la ejecución por decisiones menores.

Cuando exista una ambigüedad:

1. inspecciona el código;
2. busca una convención existente;
3. elige la alternativa más conservadora;
4. evita romper contratos;
5. documenta la decisión;
6. añade pruebas que la congelen.

Solamente considera bloqueante una ambigüedad que pueda:

* corromper datos;
* cambiar semántica científica;
* romper contratos públicos;
* mezclar `0` y `00`;
* modificar producción;
* invalidar reproducibilidad.

Si aparece un bloqueo real, no ocultes el problema.

Documenta:

* evidencia;
* impacto;
* alternativas;
* recomendación.

---

# 24. Reglas de modificación

* No reformatees archivos ajenos sin necesidad.
* No renombres módulos existentes sin justificación.
* No realices refactors amplios fuera del alcance.
* No modifiques configuraciones globales innecesariamente.
* No elimines código existente funcional.
* No uses `any` salvo justificación excepcional.
* No uses type assertions para esconder errores.
* No uses `@ts-ignore`.
* No uses `eslint-disable` salvo justificación documentada.
* No uses valores mágicos.
* No agregues comentarios redundantes.
* No dupliques tipos existentes.
* No expongas implementaciones internas como contratos públicos.
* No crees dependencias circulares.
* No mezcles lógica de dominio con persistencia.

---

# 25. Estado final esperado

Al finalizar, el sistema debe quedar conceptualmente así:

```text
ConsensusOutput
      │
      │ explicit mapping
      ▼
PredictionRecord
      │
      │ RecordPrediction
      ▼
EvidenceRepository
      ▲
      │ RecordOutcome
      │
OutcomeRecord
```

Y debe ser posible consultar:

```text
spinId
  ├── PredictionRecord A
  ├── PredictionRecord B
  └── OutcomeRecord
```

sin entrenar todavía ningún modelo.

---

# 26. Formato de respuesta final del agente

Al terminar la implementación, entrega un resumen con este formato:

```text
FASE 2.3.1 — RESULTADO

Estado:
PASS | PASS_WITH_OBSERVATIONS | BLOCKED

Arquitectura:
- ...

Contratos implementados:
- ...

Casos de uso:
- ...

Adaptadores:
- ...

Pruebas:
- Nuevas:
- Totales:
- Resultado:

Validaciones:
- Test:
- Lint:
- Build:
- Typecheck:
- Arquitectura:
- Anti-legacy:

Decisiones principales:
- ...

Archivos creados:
- ...

Archivos modificados:
- ...

Dependencias nuevas:
- Ninguna | detalle justificado

Riesgos pendientes:
- ...

Informe:
- ruta exacta

Siguiente fase recomendada:
- Fase 2.3.2
```

No declares éxito si no ejecutaste las validaciones.

No inventes resultados.

No digas que una prueba pasó si no fue ejecutada.

No ocultes errores.

---

# 27. Instrucción final

Comienza inspeccionando el repositorio completo y su estado Git.

Después implementa únicamente la **Fase 2.3.1 — Infraestructura de captura de evidencia histórica**, respetando estrictamente el alcance, las decisiones arquitectónicas y los criterios de aceptación definidos en este documento.

La prioridad es:

```text
INTEGRIDAD DE EVIDENCIA
>
REPRODUCIBILIDAD
>
CORRECCIÓN ARQUITECTÓNICA
>
COMPATIBILIDAD
>
EXTENSIBILIDAD
>
VELOCIDAD DE IMPLEMENTACIÓN
```

La fase debe finalizar con código probado, arquitectura validada, documentación verificable y sin activar todavía entrenamiento, calibración automática ni promoción de modelos.
