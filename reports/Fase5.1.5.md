# PROMPT MAESTRO — FASE 5.1.5

## Contract Freeze & Stabilization

### Proyecto: Roulette Tracker Pro

---

## 1. ROL

Actúa como:

* Arquitecto Principal de Software.
* Ingeniero Senior de JavaScript.
* Especialista en pruebas de regresión.
* Auditor de contratos de dominio.
* Revisor de Clean Architecture.
* Responsable de gobernanza técnica del proyecto **Roulette Tracker Pro**.

Debes trabajar directamente en el repositorio:

```text
/home/shared/lab_vito
```

La ejecución debe ser conservadora, verificable, documentada y basada exclusivamente en evidencia presente en el repositorio.

No debes asumir contratos que no estén demostrados por el código, los tests, los consumidores o la documentación existente.

---

# 2. CONTEXTO

La **Fase 5.1 — Sync Audit** finalizó con una limitación importante:

El archivo Legacy original `rouletteTracker.js` ya no existe en el árbol actual, por lo que no fue posible realizar una comparación directa completa entre Legacy Tracker y Domain Tracker.

La auditoría confirmó que:

* El Domain Tracker es actualmente el tracker operativo.
* Bootstrap crea y registra el Domain Tracker.
* `main.js` consume directamente `domainTracker`.
* No se encontraron imports directos activos de `rouletteTracker.js`.
* Los motores y renderers reciben directa o indirectamente el Domain Tracker.
* Existen contratos actuales que deben congelarse antes de implementar Gap Fixes.

La auditoría detectó tres áreas que requieren estabilización previa:

1. Contrato de `clearSession()` y `recordAndClearSession()`.
2. Contrato de mutabilidad de `getHistory()` y `getSpins()`.
3. Contrato y estado real de integración del `EventBus`.

Esta fase intermedia debe resolver la incertidumbre mediante pruebas, documentación y decisiones explícitas.

---

# 3. IDENTIFICACIÓN DE LA FASE

```text
Fase 5.1.5 — Contract Freeze & Stabilization
```

Esta fase se sitúa entre:

```text
Fase 5.1 — Sync Audit
```

y:

```text
Fase 5.2.x — Gap Fixes
```

No reemplaza ninguna etapa del roadmap.

Su función es proteger la transición desde la auditoría hacia las modificaciones funcionales.

---

# 4. OBJETIVO PRINCIPAL

Congelar y documentar los contratos actuales del Domain Tracker que presentan ambigüedad o riesgo, utilizando pruebas de caracterización y regresión.

Al finalizar esta fase debe quedar claramente establecido:

* qué hace actualmente cada operación;
* qué comportamiento está respaldado por consumidores reales;
* qué comportamiento constituye contrato oficial;
* qué comportamiento es accidental;
* qué cambios pueden realizarse posteriormente en la Fase 5.2;
* qué cambios requerirían migración, deprecación o modificación de API.

---

# 5. PRINCIPIO CENTRAL

## Primero caracterizar, después decidir y finalmente modificar

No debes cambiar inmediatamente el comportamiento detectado como inconsistente.

Primero debes:

1. Inspeccionar la implementación.
2. Inspeccionar consumidores.
3. Inspeccionar tests.
4. Crear pruebas de caracterización.
5. Ejecutar la suite completa.
6. Documentar el comportamiento real.
7. Proponer una decisión de contrato.
8. Implementar solamente correcciones mínimas autorizadas por este prompt.

---

# 6. ALCANCE

La fase se divide en tres workstreams obligatorios.

---

# WORKSTREAM A — SESSION CLEARING CONTRACT

## 6.1 Componentes principales

Auditar al menos:

```text
src/tracker/RouletteTracker.js
main.js
orionRenderer.js
src/tracker/HistoryManager.js
src/tracker/SpinManager.js
```

Además, localizar cualquier otro consumidor mediante búsquedas globales de:

```text
clearSession
recordAndClearSession
saveSpins
resetSession
clearSpins
addSessionToHistory
```

---

## 6.2 Preguntas que deben responderse

Determinar con evidencia:

* ¿Qué elimina exactamente `clearSession()`?
* ¿Guarda los spins antes de limpiar?
* ¿Registra la sesión en el historial?
* ¿Reinicia el estado de sesión?
* ¿Conserva settings?
* ¿Invalida caches o delays?
* ¿Actualiza estadísticas derivadas?
* ¿Es síncrono o asíncrono?
* ¿Retorna algún valor?
* ¿Propaga errores de persistencia?
* ¿Los consumidores esperan que termine la persistencia?
* ¿Qué diferencia funcional existe con `recordAndClearSession()`?
* ¿Cuál de ambos métodos representa el flujo canónico de cierre?
* ¿Existe algún flujo de depuración que dependa del comportamiento alternativo?

---

## 6.3 Pruebas obligatorias

Crear pruebas de caracterización para:

### `clearSession()`

* estado inicial con spins;
* estado inicial sin spins;
* limpieza de spins;
* efecto sobre sesión activa;
* efecto sobre historial;
* efecto sobre settings;
* efecto sobre caches o delays;
* llamada a persistencia;
* comportamiento cuando la persistencia se resuelve;
* comportamiento cuando la persistencia falla;
* valor retornado;
* orden de las operaciones;
* invocaciones repetidas;
* ausencia de efectos colaterales no relacionados.

### `recordAndClearSession()`

* registro correcto en historial;
* limpieza posterior;
* conservación del orden lógico;
* persistencia;
* comportamiento con sesión vacía;
* comportamiento con sesión activa;
* comportamiento con sesión detenida;
* manejo de errores;
* valor retornado;
* idempotencia o no idempotencia.

### Comparación contractual

Agregar tests que documenten explícitamente las diferencias entre:

```text
clearSession()
```

y:

```text
recordAndClearSession()
```

No deben considerarse equivalentes si el código actual no demuestra equivalencia.

---

## 6.4 Decisión requerida

Generar una recomendación explícita indicando uno de estos escenarios:

### Escenario A

`recordAndClearSession()` es el camino canónico de producción y `clearSession()` es una operación técnica o de depuración.

### Escenario B

Ambos métodos son públicos, pero poseen responsabilidades intencionalmente diferentes.

### Escenario C

Existe duplicación accidental y debe unificarse en la Fase 5.2.

### Escenario D

La evidencia no permite decidir y se requiere una decisión arquitectónica humana.

No seleccionar un escenario sin evidencia.

---

# WORKSTREAM B — COLLECTION MUTABILITY CONTRACT

## 7.1 Superficies principales

Auditar:

```text
RouletteTracker.getHistory()
HistoryManager.getHistory()
RouletteTracker.getSpins()
SpinManager.getSpins()
RouletteTracker.getSession()
RouletteTracker.getSettings()
RouletteTracker.getSeries()
```

Extender el análisis a cualquier otra API pública que retorne:

* arrays;
* objetos;
* mapas;
* sets;
* configuraciones;
* sesiones;
* historiales;
* estadísticas;
* colecciones internas.

---

## 7.2 Objetivo

Determinar si cada método devuelve:

```text
REFERENCE
SHALLOW_COPY
DEEP_COPY
FROZEN_COPY
IMMUTABLE_VALUE_OBJECT
UNKNOWN
```

---

## 7.3 Matriz obligatoria

Generar una tabla con estas columnas:

| API | Tipo retornado | Estrategia actual | Permite mutación externa | Estado interno afectado | Consumidores | Riesgo | Contrato recomendado |
| --- | -------------- | ----------------- | ------------------------ | ----------------------- | ------------ | ------ | -------------------- |

La tabla debe cubrir toda colección pública relevante, no solamente `getHistory()` y `getSpins()`.

---

## 7.4 Pruebas obligatorias

Crear pruebas que permitan determinar:

* si modificar el array retornado altera el estado interno;
* si modificar un elemento del array retornado altera el objeto interno;
* si múltiples llamadas retornan la misma referencia;
* si existen copias superficiales;
* si existen objetos anidados compartidos;
* si el valor está congelado;
* si el consumidor depende actualmente de mutar la colección;
* si la serialización modifica o conserva referencias;
* si existen diferencias entre managers y fachada.

Ejemplo conceptual:

```javascript
const result = tracker.getHistory();
result.push(fakeSession);
```

El test debe determinar si `tracker` quedó alterado.

También probar mutación anidada:

```javascript
result[0].spins.push(99);
```

No asumir que una copia superficial es suficiente.

---

## 7.5 Regla de esta fase

No cambiar globalmente referencias por copias ni copias por referencias sin analizar consumidores.

Un cambio de mutabilidad puede romper:

* renderers;
* motores;
* caches;
* comparaciones por identidad;
* sincronización de estado;
* pruebas existentes;
* rendimiento;
* persistencia.

En esta fase se permite:

* caracterizar;
* probar;
* documentar;
* congelar el comportamiento vigente;
* proponer el contrato objetivo.

La normalización global debe reservarse para la Fase 5.2, salvo que exista un defecto crítico reproducible y una corrección mínima sea indispensable para mantener integridad.

---

# WORKSTREAM C — EVENTBUS CONTRACT

## 8.1 Componentes principales

Auditar al menos:

```text
src/core/EventBus.js
src/core/Bootstrap.js
src/tracker/RouletteTracker.js
main.js
```

También inspeccionar:

* renderers;
* motores;
* managers;
* suscripciones;
* llamadas a `emit`;
* llamadas a `on`;
* llamadas a `off`;
* nombres de eventos;
* payloads;
* limpieza de suscripciones.

---

## 8.2 Preguntas obligatorias

Determinar:

* ¿El EventBus está realmente conectado al tracker?
* ¿Qué objeto mantiene la referencia?
* ¿Existen emisiones desde el Domain Tracker?
* ¿Existen emisiones desde managers?
* ¿Qué eventos tienen consumidores activos?
* ¿El evento `"update"` está definido formalmente?
* ¿Qué payload espera cada suscriptor?
* ¿Existen suscriptores que nunca reciben eventos?
* ¿Hay polling coexistiendo con eventos?
* ¿Hay listeners huérfanos?
* ¿Existe riesgo de registro duplicado?
* ¿Existe mecanismo de unsubscribe?
* ¿Bootstrap registra suscripciones más de una vez?
* ¿La UI depende realmente del EventBus?
* ¿El EventBus es infraestructura futura o contrato operativo actual?

---

## 8.3 Pruebas obligatorias

Agregar pruebas para:

* `setEventBus()`;
* `getEventBus()`;
* inyección correcta desde Bootstrap;
* registro de listeners;
* eliminación de listeners;
* múltiples listeners;
* errores en listeners;
* aislamiento entre eventos;
* payloads;
* listener duplicado;
* emisión sin listeners;
* suscripción y desuscripción;
* reinicialización de Bootstrap, cuando pueda probarse de forma aislada.

Si actualmente el tracker no emite eventos, crear un test de caracterización que lo demuestre.

No inventar emisiones nuevas durante esta fase solo para hacer pasar los tests.

---

## 8.4 Decisión requerida

Clasificar el estado del EventBus como:

```text
ACTIVE_CONTRACT
PARTIAL_CONTRACT
DORMANT_INFRASTRUCTURE
DEAD_CODE_CANDIDATE
FUTURE_PHASE_FOUNDATION
UNKNOWN
```

Documentar la evidencia que justifica la clasificación.

La Fase 6 del roadmap contempla una arquitectura de eventos futura. No anticipar esa fase implementando ahora un sistema completo de eventos.

---

# 9. BÚSQUEDA DE CONSUMIDORES

Realizar búsquedas repo-wide de:

```text
clearSession(
recordAndClearSession(
getHistory(
getSpins(
setEventBus(
getEventBus(
.emit(
.on(
.off(
"update"
```

Para cada consumidor, registrar:

* archivo;
* línea;
* método consumidor;
* expectativa observable;
* dependencia por referencia;
* dependencia por sincronía;
* dependencia del valor retornado;
* riesgo de cambio.

No limitar la revisión a los archivos mencionados por la auditoría previa.

---

# 10. POLÍTICA DE CAMBIOS

## 10.1 Permitido

Durante esta fase está permitido:

* agregar tests de caracterización;
* agregar tests de regresión;
* agregar fixtures;
* agregar helpers exclusivos de pruebas;
* mejorar comentarios contractuales;
* crear documentación;
* agregar JSDoc cuando refleje el comportamiento real;
* corregir errores en tests;
* realizar ajustes mínimos no funcionales necesarios para testabilidad;
* generar ADRs;
* crear matrices de contratos;
* agregar scripts de auditoría no destructivos.

---

## 10.2 Prohibido

No realizar:

* migración de motores;
* eliminación de métodos públicos;
* renombrado de APIs;
* unificación funcional extensa;
* arquitectura completa de eventos;
* refactor global;
* cambio masivo de referencias por copias;
* sustitución de managers;
* eliminación de EventBus;
* eliminación de Legacy residual sin auditoría;
* cambios de UI;
* cambios en `historical-evidence`;
* modificaciones ajenas a las tres áreas auditadas;
* cambios de comportamiento basados únicamente en preferencias arquitectónicas.

---

# 11. EXCEPCIÓN PARA CORRECCIONES MÍNIMAS

Una corrección funcional mínima solo podrá realizarse si se cumplen simultáneamente estas condiciones:

1. Existe un defecto reproducible.
2. Existe un test rojo que demuestra el defecto.
3. El comportamiento esperado está respaldado por consumidores o documentación.
4. La corrección no modifica la API pública.
5. La corrección no introduce una nueva arquitectura.
6. La corrección no corresponde claramente a la Fase 5.2 o Fase 6.
7. La suite completa permanece verde.
8. La corrección queda documentada por separado.

Si alguna condición no se cumple, documentar la propuesta y posponerla.

---

# 12. ARCHIVOS QUE NO DEBEN MODIFICARSE

No modificar componentes cerrados de `historical-evidence`, incluyendo, entre otros:

```text
src/historical-evidence/domain/
src/historical-evidence/application/
GroupedTemporalDatasetSplitter
GroupedTemporalSplit
DatasetSplitLeakageDetector
DatasetSplitLeakageReport
DatasetIntegrityVerifier
HistoricalCalibrationDataset
```

Mantener:

* determinismo;
* inmutabilidad;
* forwarding de descriptor;
* separación domain/application/infrastructure;
* splitting por `spinId`;
* clave temporal `predictionCreatedAt`.

Si una herramienta intenta modificar esta área, detener ese cambio y reportarlo.

---

# 13. ESTRATEGIA DE TESTS

## 13.1 Baseline inicial

Antes de editar:

1. Registrar rama actual.
2. Registrar commit actual.
3. Registrar estado del working tree.
4. Ejecutar suite completa.
5. Ejecutar lint.
6. Ejecutar build.
7. Registrar tests totales.
8. Registrar archivos de tests.
9. Registrar fallos y warnings.
10. No atribuir suciedad preexistente a esta fase.

---

## 13.2 Tests nuevos

Organizar los tests nuevos por contrato.

Nombre sugerido:

```text
tests/regression/session-clearing-contract.test.js
tests/regression/collection-mutability-contract.test.js
tests/regression/eventbus-contract.test.js
```

Adaptar rutas y convenciones a la estructura real del repositorio.

No crear archivos duplicados si ya existen suites adecuadas.

---

## 13.3 Calidad de los tests

Los tests deben ser:

* deterministas;
* independientes;
* reproducibles;
* legibles;
* orientados a comportamiento;
* sin dependencia de orden;
* sin timers reales innecesarios;
* sin acceso remoto;
* sin modificar estado global permanentemente;
* resistentes a falsos positivos;
* explícitos sobre referencias y asincronía.

---

## 13.4 Pruebas asíncronas

Para persistencia:

* usar mocks controlables;
* verificar llamadas;
* verificar orden cuando sea contractual;
* verificar promesas pendientes;
* verificar rechazo;
* evitar sleeps;
* usar promesas diferidas cuando sea necesario;
* restaurar mocks después de cada test.

---

# 14. DOCUMENTACIÓN OBLIGATORIA

Generar los siguientes documentos dentro de una ubicación coherente con el repositorio, preferentemente:

```text
reports/trabajo/
```

## 14.1 Informe principal

```text
Fase5.1.5_contract_freeze_stabilization_reporte.md
```

Debe incluir:

* baseline;
* archivos revisados;
* consumidores;
* tests agregados;
* resultados;
* contratos observados;
* contratos propuestos;
* riesgos;
* decisiones;
* elementos aplazados;
* veredicto.

---

## 14.2 Contrato de cierre de sesión

```text
SESSION_CLEARING_CONTRACT.md
```

Debe documentar:

* `clearSession()`;
* `recordAndClearSession()`;
* diferencias;
* efectos;
* persistencia;
* errores;
* consumidores;
* flujo canónico recomendado.

---

## 14.3 Contrato de mutabilidad

```text
COLLECTION_MUTABILITY_CONTRACT.md
```

Debe contener la matriz completa de APIs que exponen colecciones u objetos.

---

## 14.4 Contrato de EventBus

```text
EVENTBUS_CURRENT_STATE.md
```

Debe documentar:

* arquitectura actual;
* wiring;
* eventos;
* listeners;
* emisiones;
* payloads;
* clasificación contractual;
* relación con la futura Fase 6.

---

## 14.5 Matriz de autorización para Fase 5.2

```text
PHASE_5_2_READINESS_MATRIX.md
```

Formato mínimo:

| Área | Contrato congelado | Tests | Riesgo residual | Decisión requerida | Lista para 5.2 |
| ---- | -----------------: | ----: | --------------- | ------------------ | -------------: |

---

## 14.6 Nota de cierre

```text
Fase_5.1.5_cerrada.md
```

Crear este archivo solamente si todos los criterios de cierre se cumplen.

---

# 15. ADRS

Si se toma una decisión arquitectónica nueva, generar un ADR.

Ejemplos posibles:

```text
ADR-XXX-session-clearing-canonical-path.md
ADR-XXX-public-collection-mutability.md
ADR-XXX-eventbus-current-contract.md
```

No inventar numeración sin revisar la convención existente.

Un ADR debe incluir:

* contexto;
* problema;
* alternativas;
* decisión;
* consecuencias;
* compatibilidad;
* estrategia de migración;
* estado.

Si no existe evidencia suficiente para decidir, crear una nota de decisión pendiente en lugar de un ADR definitivo.

---

# 16. CRITERIOS DE ACEPTACIÓN

La fase solo podrá considerarse aprobada cuando:

* el baseline inicial esté documentado;
* todos los consumidores relevantes hayan sido localizados;
* `clearSession()` tenga pruebas de caracterización;
* `recordAndClearSession()` tenga pruebas de caracterización;
* sus diferencias estén documentadas;
* `getHistory()` tenga pruebas de mutabilidad;
* `getSpins()` tenga pruebas de mutabilidad;
* las demás colecciones públicas relevantes estén clasificadas;
* el EventBus tenga pruebas contractuales;
* el estado actual del EventBus esté clasificado;
* no se haya anticipado la Fase 6;
* no se haya modificado `historical-evidence`;
* la suite completa permanezca verde;
* lint permanezca verde;
* build permanezca verde;
* no se haya reducido cobertura;
* se haya generado la matriz de preparación para Fase 5.2;
* los riesgos residuales estén documentados;
* exista un veredicto claro sobre el inicio de la Fase 5.2.

---

# 17. CONDICIONES DE BLOQUEO

La fase deberá marcarse como `BLOCKED` si ocurre alguno de estos casos:

* no es posible determinar qué consumidores usan los contratos;
* los tests actuales son insuficientes para caracterizar el comportamiento;
* existe un fallo previo del baseline no relacionado con esta fase;
* la persistencia real no puede aislarse en tests;
* el contrato depende de un artefacto Legacy ausente;
* hay contradicciones entre código, tests y documentación;
* se requiere una decisión funcional del propietario del producto;
* la corrección necesaria corresponde a la Fase 5.2 o Fase 6.

Un bloqueo no autoriza a inventar el contrato.

---

# 18. VALIDACIONES FINALES

Ejecutar, usando los comandos reales definidos en `package.json`:

```bash
npm test
npm run lint
npm run build
```

Además, ejecutar cualquier comando existente de:

```text
architecture check
regression tests
coverage
anti-legacy
type checking
```

No inventar scripts inexistentes.

Si un comando no existe, registrarlo en el informe.

---

# 19. CONTROL GIT

Antes de trabajar:

* inspeccionar `git status`;
* registrar cambios preexistentes;
* no descartar trabajo del usuario;
* no ejecutar `git reset --hard`;
* no ejecutar `git clean -fd`;
* no sobrescribir archivos no relacionados;
* no hacer rebase;
* no hacer push;
* no hacer merge;
* no crear commits sin autorización;
* no crear tags sin autorización.

Al finalizar:

* mostrar archivos creados;
* mostrar archivos modificados;
* separar cambios propios de cambios preexistentes;
* mostrar diff estadístico;
* advertir si el working tree continúa sucio.

---

# 20. SECUENCIA OBLIGATORIA DE EJECUCIÓN

## Paso 1 — Preflight

* leer `ROADMAP.md`;
* leer documentación de arquitectura;
* leer informe de Fase 5.1;
* inspeccionar Git;
* inspeccionar `package.json`;
* ejecutar baseline.

## Paso 2 — Descubrimiento

* localizar implementaciones;
* localizar managers;
* localizar consumidores;
* localizar tests;
* localizar documentación;
* construir mapa de dependencias.

## Paso 3 — Caracterización

* escribir pruebas del contrato de sesión;
* escribir pruebas de mutabilidad;
* escribir pruebas de EventBus;
* ejecutar pruebas focalizadas.

## Paso 4 — Suite completa

* ejecutar tests completos;
* ejecutar lint;
* ejecutar arquitectura;
* ejecutar build;
* verificar cobertura.

## Paso 5 — Decisiones

* clasificar contratos;
* identificar ambigüedades;
* separar comportamiento intencional de accidental;
* identificar elementos de Fase 5.2;
* identificar elementos de Fase 6.

## Paso 6 — Documentación

* generar informe;
* generar contratos;
* generar matriz de preparación;
* generar ADRs cuando corresponda.

## Paso 7 — Cierre

* ejecutar validaciones finales;
* revisar Git;
* emitir veredicto;
* crear documento de cierre solo si corresponde.

---

# 21. VEREDICTO FINAL

Emitir exactamente uno de estos resultados:

```text
PASS — READY FOR PHASE 5.2
```

Significa que los contratos fueron congelados y la Fase 5.2 puede comenzar.

```text
PASS WITH CONDITIONS
```

Significa que la fase terminó, pero la Fase 5.2 debe respetar condiciones específicas.

```text
BLOCKED — CONTRACT DECISION REQUIRED
```

Significa que se necesita una decisión humana antes de continuar.

```text
FAIL — BASELINE OR REGRESSION FAILURE
```

Significa que la fase no puede cerrarse por fallos técnicos.

---

# 22. SALIDA FINAL EN CONSOLA

Al terminar, mostrar:

```text
FASE: 5.1.5 — Contract Freeze & Stabilization
ESTADO:
VEREDICTO:

Baseline:
- Tests:
- Archivos de test:
- Lint:
- Architecture:
- Build:
- Coverage:

Tests agregados:
- Session clearing:
- Collection mutability:
- EventBus:

Contratos:
- Session clearing:
- Mutability:
- EventBus:

Cambios funcionales:
- Sí/No
- Detalle:

Riesgos residuales:
- ...

Documentos generados:
- ...

Preparación para Fase 5.2:
- READY / CONDITIONAL / BLOCKED
```

---

# 23. RESTRICCIÓN FINAL

No comenzar la Fase 5.2 dentro de esta ejecución.

No implementar Gap Fixes generales.

No migrar motores.

No construir la arquitectura de eventos futura.

No interpretar una inconsistencia como autorización automática para modificarla.

El propósito exclusivo de esta fase es:

```text
OBSERVAR
CARACTERIZAR
PROBAR
CONGELAR
DOCUMENTAR
DECIDIR
```

La implementación funcional posterior pertenece a la **Fase 5.2.x — Gap Fixes**.
