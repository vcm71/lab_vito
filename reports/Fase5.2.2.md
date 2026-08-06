# PROMPT MAESTRO — FASE 5.2.2

## Public Collection Mutability Safety Audit

### Proyecto: Roulette Tracker Pro

---

# 1. ROL

Actúa como:

* Arquitecto Principal de Software.
* Ingeniero Senior de JavaScript.
* Especialista en gestión de estado mutable.
* Auditor de contratos de dominio.
* Especialista en pruebas de regresión.
* Responsable de continuidad arquitectónica de **Roulette Tracker Pro**.

Trabaja directamente en:

```text
/home/shared/lab_vito
```

Debes continuar desde el estado alcanzado al finalizar:

```text
Fase 5.1.5 — Contract Freeze & Stabilization
Fase 5.2.1 — Session Finalization Flow Gap Fix
```

La Fase 5.2.1 descartó mediante evidencia la supuesta duplicación del flujo de cierre de sesión. No debes volver a investigar ni modificar ese flujo.

---

# 2. IDENTIFICACIÓN

```text
Fase 5.2.2 — Public Collection Mutability Safety Audit
```

Esta subfase pertenece a:

```text
Fase 5.2.x — Gap Fixes
```

Su objetivo no es ejecutar una normalización masiva de APIs.

Su objetivo es determinar si las referencias vivas expuestas por el Domain Tracker producen brechas funcionales reales en los consumidores actuales.

---

# 3. CONTEXTO CONFIRMADO

La Fase 5.1.5 congeló los siguientes contratos observados:

```text
SpinManager.getSpins()
→ referencia viva mutable

HistoryManager.getHistory()
→ referencia viva mutable

SessionManager.getSession()
→ referencia viva mutable

SettingsManager.get()
→ referencia viva mutable

RouletteTracker.getSpins()
→ referencia viva mutable

RouletteTracker.getHistory()
→ referencia viva mutable

RouletteTracker.getSession()
→ referencia viva mutable

RouletteTracker.getSettings()
→ referencia viva mutable

RouletteTracker.getHitMap()
→ objeto derivado nuevo

RouletteTracker.getHitRanking()
→ array derivado nuevo
```

Las referencias vivas forman parte del comportamiento actual y ya cuentan con pruebas de caracterización.

No debes reemplazarlas automáticamente por copias.

Un cambio global de mutabilidad podría romper:

* consumidores que mutan referencias deliberadamente;
* renderers;
* motores;
* persistencia;
* caches;
* comparaciones por identidad;
* sincronización implícita;
* tests existentes;
* integraciones no evidentes.

---

# 4. OBJETIVO PRINCIPAL

Auditar todos los consumidores de APIs públicas que exponen arrays u objetos mutables y determinar:

1. cuáles solo leen;
2. cuáles mutan directamente;
3. cuáles dependen de identidad referencial;
4. cuáles conservan referencias durante largos periodos;
5. cuáles realizan mutaciones fuera de los métodos oficiales;
6. cuáles pueden corromper invariantes;
7. cuáles representan una brecha funcional real;
8. cuáles requieren una corrección puntual en una futura subfase;
9. cuáles son seguros bajo el contrato actual.

La fase debe terminar con una matriz completa de consumidores y un veredicto fundamentado.

---

# 5. PRINCIPIO OBLIGATORIO

```text
NO CONFUNDIR MUTABILIDAD CON DEFECTO
```

Que una API devuelva una referencia viva no implica automáticamente que exista un bug.

Solo debe declararse una brecha cuando exista evidencia de al menos uno de estos escenarios:

* mutación externa accidental;
* bypass de validaciones;
* estado inconsistente;
* persistencia omitida;
* caches desactualizadas;
* invariantes violados;
* historial alterado retrospectivamente;
* settings modificados sin validación;
* sesiones modificadas fuera de su manager;
* UI y dominio observando estados divergentes;
* comportamiento no determinista;
* error reproducible.

---

# 6. ALCANCE

Auditar prioritariamente:

```text
getSpins()
getHistory()
getSession()
getSettings()
getSeries()
getLastSpin()
getLastSession()
```

Extender el alcance a cualquier API pública que devuelva:

* arrays;
* objetos;
* mapas;
* sets;
* colecciones;
* configuraciones;
* sesiones;
* registros históricos;
* elementos internos por referencia.

No limitarse a la lista inicial si el repositorio contiene otras superficies equivalentes.

---

# 7. COMPONENTES PRINCIPALES

Inspeccionar al menos:

```text
src/tracker/RouletteTracker.js
src/tracker/SpinManager.js
src/tracker/HistoryManager.js
src/tracker/SessionManager.js
src/tracker/SettingsManager.js
src/core/Bootstrap.js
main.js
orionRenderer.js
src/analytics/
src/engines/
src/renderers/
tests/
```

Adaptar las rutas a la estructura real del repositorio.

No asumir que todos los consumidores están bajo una única carpeta.

---

# 8. BÚSQUEDA REPO-WIDE

Localizar todas las invocaciones de:

```text
.getSpins(
.getHistory(
.getSession(
.getSettings(
.getSeries(
.getLastSpin(
.getLastSession(
```

Además, buscar patrones de alias:

```javascript
const spins = tracker.getSpins();
const history = tracker.getHistory();
const session = tracker.getSession();
const settings = tracker.getSettings();
```

Seguir cada alias para determinar su uso posterior.

Buscar operaciones mutantes como:

```text
.push(
.pop(
.shift(
.unshift(
.splice(
.sort(
.reverse(
.fill(
.copyWithin(
Object.assign(
delete
=
+=
-=
++
--
```

También buscar mutaciones anidadas:

```javascript
tracker.getSession().propiedad = valor;
tracker.getSettings().opcion = valor;
tracker.getHistory()[0].spins.push(valor);
tracker.getSpins()[0].number = valor;
```

No depender únicamente de búsquedas textuales simples. Seguir referencias locales cuando sea necesario.

---

# 9. CLASIFICACIÓN DE CONSUMIDORES

Clasificar cada consumidor como:

```text
READ_ONLY
INTENTIONAL_MUTATION
ACCIDENTAL_MUTATION
IDENTITY_DEPENDENT
SNAPSHOT_EXPECTATION
LONG_LIVED_REFERENCE
SERIALIZATION_ONLY
UNKNOWN
```

Definiciones:

## READ_ONLY

Solo consulta, itera, filtra, transforma o renderiza sin modificar la referencia original.

## INTENTIONAL_MUTATION

Modifica deliberadamente el estado obtenido y el sistema depende del efecto sobre el tracker.

## ACCIDENTAL_MUTATION

Modifica la referencia sin que el contrato o el flujo justifiquen el cambio.

## IDENTITY_DEPENDENT

Compara referencias o depende de que sucesivas llamadas devuelvan el mismo objeto o array.

## SNAPSHOT_EXPECTATION

El consumidor parece tratar el resultado como una copia histórica, aunque recibe una referencia viva.

## LONG_LIVED_REFERENCE

Conserva la referencia entre ciclos, eventos, renders o mutaciones posteriores.

## SERIALIZATION_ONLY

Utiliza la referencia exclusivamente para serializar, persistir o transmitir.

## UNKNOWN

La evidencia no permite determinar la expectativa.

---

# 10. MATRIZ OBLIGATORIA

Generar una matriz con al menos estas columnas:

| API | Consumidor | Archivo y línea | Uso | Clasificación | Mutación | Depende de identidad | Riesgo | Evidencia | Acción |
| --- | ---------- | --------------- | --- | ------------- | -------: | -------------------: | ------ | --------- | ------ |

La acción debe ser una de:

```text
KEEP_CURRENT_CONTRACT
ADD_REGRESSION_TEST
DOCUMENT_ONLY
FIX_CONSUMER
ADD_EXPLICIT_COMMAND_API
DEPRECATE_MUTABLE_ACCESS
DEFER_TO_LATER_PHASE
HUMAN_DECISION_REQUIRED
```

---

# 11. INVARIANTES A VERIFICAR

## 11.1 Spins

Determinar si una mutación externa puede:

* insertar spins inválidos;
* alterar números ya registrados;
* omitir normalización;
* omitir timestamp;
* omitir identificadores;
* alterar el orden;
* evitar persistencia;
* evitar invalidación de delays;
* evitar actualizaciones estadísticas;
* romper historial;
* introducir duplicados;
* dejar caches obsoletos.

## 11.2 Historial

Determinar si una mutación externa puede:

* modificar sesiones históricas;
* alterar spins de sesiones cerradas;
* borrar registros sin persistencia;
* cambiar fechas;
* romper conteos;
* modificar retrospectivamente estadísticas;
* compartir objetos con la sesión activa;
* producir referencias cruzadas inesperadas.

## 11.3 Sesión

Determinar si una mutación externa puede:

* cambiar estado activo/inactivo;
* alterar fecha de inicio;
* modificar conteo de spins;
* evitar métodos de ciclo de vida;
* producir estados imposibles;
* divergir del estado de spins.

## 11.4 Settings

Determinar si una mutación externa puede:

* evitar validaciones;
* introducir claves desconocidas;
* cambiar tipos;
* evitar persistencia;
* omitir eventos o refresco;
* divergir de defaults;
* afectar motores sin pasar por `setSetting()` o `updateSettings()`.

---

# 12. TESTS DE CARACTERIZACIÓN

Antes de cualquier corrección, verificar y ampliar las pruebas existentes.

Los tests deben demostrar:

* si sucesivas llamadas devuelven la misma referencia;
* si la mutación del array afecta el estado interno;
* si la mutación de un objeto anidado afecta el estado interno;
* si una colección obtenida antes refleja mutaciones posteriores;
* si los managers y la fachada exponen la misma referencia;
* si la mutación externa activa persistencia;
* si la mutación externa invalida caches;
* si la mutación externa pasa por validación;
* si una mutación histórica altera cálculos posteriores;
* si los settings pueden cambiar sin métodos oficiales.

No escribir tests basados en el contrato deseado.

Los tests deben reflejar primero el comportamiento real.

---

# 13. TESTS DE CONSUMIDORES

Para cada consumidor de riesgo alto o crítico, agregar una prueba que reproduzca su uso real.

Priorizar pruebas que respondan:

* ¿el consumidor modifica la referencia?
* ¿esa modificación es necesaria?
* ¿el estado del tracker cambia?
* ¿la persistencia queda sincronizada?
* ¿los delays quedan invalidados?
* ¿las estadísticas quedan actualizadas?
* ¿la UI depende de la misma referencia?
* ¿una copia rompería el flujo?
* ¿el consumidor esperaba realmente un snapshot?

No crear pruebas artificiales sin relación con consumidores existentes.

---

# 14. DECISIÓN POR API

Para cada API mutable, emitir exactamente una recomendación:

## A. KEEP_LIVE_REFERENCE

La referencia viva es intencional, está controlada y debe conservarse.

## B. KEEP_WITH_DOCUMENTATION

Debe conservarse por compatibilidad, pero requiere documentación y advertencias.

## C. KEEP_WITH_GUARDRAILS

Debe conservarse, pero necesita validaciones o APIs explícitas complementarias.

## D. MIGRATE_CONSUMERS_FIRST

La referencia viva no debe cambiar hasta migrar consumidores concretos.

## E. RETURN_COPY_IN_FUTURE

La API debería devolver una copia, pero el cambio requiere una fase de migración.

## F. CRITICAL_FIX_REQUIRED

Existe una brecha reproducible que necesita una corrección mínima inmediata.

## G. HUMAN_DECISION_REQUIRED

La evidencia técnica no permite definir el contrato objetivo.

---

# 15. POLÍTICA DE CAMBIOS

## Permitido

* agregar pruebas de caracterización;
* agregar pruebas de regresión;
* crear fixtures y helpers de tests;
* documentar consumidores;
* generar matrices;
* agregar comentarios o JSDoc que reflejen comportamiento real;
* crear un reporte técnico;
* corregir una mutación accidental exclusivamente en el consumidor, si existe evidencia sólida;
* reemplazar una mutación accidental por una llamada pública existente, si mantiene comportamiento.

## Prohibido

* cambiar globalmente getters para devolver copias;
* aplicar `Object.freeze()` global;
* realizar deep clone general;
* introducir librerías de inmutabilidad;
* reescribir managers;
* cambiar APIs públicas;
* eliminar getters;
* cambiar firmas;
* crear un nuevo store;
* introducir Redux, MobX u otro gestor;
* modificar EventBus;
* anticipar la Fase 6;
* modificar `historical-evidence`;
* migrar motores de manera general;
* refactorizar código no relacionado;
* corregir supuestos defects sin reproducción.

---

# 16. CORRECCIÓN FUNCIONAL EXCEPCIONAL

Solo se podrá corregir código durante esta fase cuando:

1. exista una mutación externa concreta;
2. exista un consumidor identificado;
3. la mutación produzca un defecto reproducible;
4. se agregue primero un test rojo;
5. exista una API pública actual que permita realizar correctamente la operación;
6. la corrección pueda limitarse al consumidor;
7. no cambie la API pública;
8. no modifique el contrato global de mutabilidad;
9. toda la suite quede verde;
10. la corrección quede documentada.

Si estas diez condiciones no se cumplen, documentar la brecha y aplazar su implementación.

---

# 17. SEVERIDAD

Clasificar cada hallazgo como:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFORMATIONAL
```

## CRITICAL

Corrupción de estado, pérdida de datos o violación grave de invariantes.

## HIGH

Bypass de validaciones, persistencia incoherente o historial alterable incorrectamente.

## MEDIUM

Acoplamiento peligroso, dependencia de identidad o referencia de larga vida.

## LOW

Riesgo limitado o localizado sin defecto demostrado.

## INFORMATIONAL

Comportamiento mutable intencional y correctamente usado.

---

# 18. EVENTBUS FUERA DE ALCANCE

No modificar:

```text
src/core/EventBus.js
```

No agregar emisiones automáticas.

No definir eventos de dominio.

No utilizar el EventBus como solución indirecta a la mutabilidad.

La Fase 5.1.5 determinó que el EventBus es infraestructura preparatoria y que el tracker no emite eventos automáticamente.

La arquitectura de eventos corresponde a la Fase 6.

---

# 19. SESSION FINALIZATION FUERA DE ALCANCE

No modificar:

```text
recordAndClearSession()
clearSession()
saveSpins()
invalidateDelays()
```

salvo que sea estrictamente necesario para ejecutar tests no funcionales.

La Fase 5.2.1 determinó que:

* no existe duplicación funcional;
* `recordAndClearSession()` registra historial y limpia memoria;
* `main.js` completa persistencia e invalidación;
* no se requiere corrección.

No reabrir ese análisis.

---

# 20. HISTORICAL-EVIDENCE CONGELADO

No modificar:

```text
src/historical-evidence/
```

Mantener intactos:

* contratos de dominio;
* determinismo;
* inmutabilidad;
* splitting agrupado por `spinId`;
* clave temporal `predictionCreatedAt`;
* detector de leakage;
* verificación de integridad;
* forwarding de descriptor;
* separación domain/application/infrastructure.

---

# 21. BASELINE

Antes de modificar:

1. registrar fecha;
2. registrar rama;
3. registrar commit;
4. ejecutar `git status`;
5. identificar suciedad preexistente;
6. ejecutar suite completa;
7. ejecutar lint;
8. ejecutar build;
9. registrar cantidad de archivos de test;
10. registrar cantidad total de tests;
11. registrar warnings;
12. no atribuir cambios preexistentes a esta fase.

El baseline mínimo esperado desde la fase anterior es:

```text
68 archivos de test
970 tests
lint PASS
build PASS
```

Si el baseline actual es superior, usar el actual.

Si es inferior o falla, investigar antes de editar y marcar la anomalía.

---

# 22. VALIDACIONES

Usar los scripts reales definidos en `package.json`.

Ejecutar al menos:

```bash
npm test
npm run lint
npm run build
```

Ejecutar también cualquier script existente de:

```text
architecture
coverage
regression
typecheck
anti-legacy
```

No inventar comandos inexistentes.

Registrar expresamente los scripts no disponibles.

---

# 23. CONTROL GIT

No ejecutar:

```text
git reset --hard
git clean -fd
git checkout .
git restore .
git rebase
git push
git merge
```

No eliminar cambios preexistentes.

No realizar commits ni tags sin autorización.

Al finalizar:

* mostrar estado Git;
* listar archivos nuevos;
* listar archivos modificados;
* separar cambios de esta fase de cambios preexistentes;
* mostrar diff estadístico;
* advertir si el repositorio sigue sucio.

---

# 24. ENTREGABLES

Generar en una ubicación consistente con el repositorio, preferentemente:

```text
reports/trabajo/
```

## 24.1 Informe principal

```text
Fase5.2.2_public_collection_mutability_safety_audit_reporte.md
```

Debe incluir:

* baseline;
* superficie auditada;
* consumidores;
* hallazgos;
* tests;
* severidades;
* decisiones;
* riesgos;
* cambios realizados;
* elementos aplazados;
* veredicto.

## 24.2 Matriz de consumidores

```text
PUBLIC_MUTABILITY_CONSUMER_MATRIX.md
```

Debe contener la matriz completa de consumidores.

## 24.3 Análisis de invariantes

```text
PUBLIC_MUTABILITY_INVARIANT_ANALYSIS.md
```

Debe analizar:

* spins;
* historial;
* sesión;
* settings;
* colecciones adicionales.

## 24.4 Plan de migración

```text
PUBLIC_MUTABILITY_MIGRATION_PLAN.md
```

Debe incluir únicamente las APIs que requieran migración.

Para cada una:

* consumidores;
* orden recomendado;
* compatibilidad;
* tests necesarios;
* estrategia de deprecación;
* riesgo.

No generar una migración ficticia si no es necesaria.

## 24.5 Gap fixes candidatos

```text
PHASE_5_2_MUTABILITY_GAP_CANDIDATES.md
```

Debe ordenar los gaps reales por prioridad y proponer subfases pequeñas.

## 24.6 Documento de cierre

```text
Fase_5.2.2_cerrada.md
```

Crearlo solo si se cumplen los criterios de cierre.

---

# 25. CRITERIOS DE ACEPTACIÓN

La fase se considera aprobada únicamente si:

* se documenta el baseline;
* se localizan todos los consumidores relevantes;
* se siguen los aliases locales necesarios;
* se clasifica cada consumidor;
* se identifican mutaciones directas;
* se identifican dependencias de identidad;
* se identifican referencias de larga vida;
* se analizan spins, historial, sesión y settings;
* se prueban invariantes relevantes;
* cada API recibe una decisión contractual;
* los gaps reales quedan separados de riesgos teóricos;
* no se modifica globalmente la mutabilidad;
* no se modifica EventBus;
* no se reabre el flujo de cierre;
* no se modifica `historical-evidence`;
* no cambia la API pública;
* tests, lint y build quedan verdes;
* los riesgos residuales quedan documentados;
* se define si existe una siguiente subfase concreta.

---

# 26. CONDICIONES DE BLOQUEO

Marcar la fase como bloqueada si:

* no puede seguirse el uso de referencias;
* existen consumidores dinámicos imposibles de localizar;
* el baseline falla;
* el contrato depende del Legacy ausente;
* los tests contradicen la implementación;
* una corrección requiere cambiar la API pública;
* el problema exige un refactor transversal;
* la decisión requiere una definición funcional del propietario;
* el cambio corresponde a una fase futura.

No inventar un Gap para justificar modificaciones.

---

# 27. VEREDICTO FINAL

Emitir exactamente uno:

```text
PASS — NO UNSAFE MUTATION FOUND
```

No se encontraron mutaciones peligrosas; no se requiere Gap Fix.

```text
PASS — TARGETED GAP IDENTIFIED
```

Se identificó una brecha concreta y puede diseñarse una subfase puntual.

```text
PASS WITH CONDITIONS
```

No existe un defecto inmediato, pero deben respetarse condiciones antes de modificar las APIs.

```text
BLOCKED — CONTRACT DECISION REQUIRED
```

La evidencia no permite decidir sin intervención humana.

```text
FAIL — BASELINE OR REGRESSION FAILURE
```

La fase no puede cerrarse por fallos técnicos.

---

# 28. SALIDA FINAL EN CONSOLA

Mostrar:

```text
FASE: 5.2.2 — Public Collection Mutability Safety Audit

ESTADO:
VEREDICTO:

Baseline:
- Rama:
- Commit:
- Working tree:
- Archivos de test:
- Tests:
- Lint:
- Build:

APIs auditadas:
- ...

Consumidores encontrados:
- Total:
- Solo lectura:
- Mutación intencional:
- Mutación accidental:
- Dependencia de identidad:
- Referencia de larga vida:
- Desconocidos:

Hallazgos:
- Critical:
- High:
- Medium:
- Low:
- Informational:

Tests agregados:
- ...

Correcciones aplicadas:
- Sí/No
- Detalle:

API pública modificada:
- Sí/No

Contratos preservados:
- Session clearing:
- EventBus:
- Historical evidence:

Riesgos residuales:
- ...

Documentos generados:
- ...

Siguiente Gap recomendado:
- ...

Preparado para siguiente subfase:
- YES / CONDITIONAL / NO
```

---

# 29. RESTRICCIÓN FINAL

Esta fase no tiene autorización para convertir el proyecto a inmutabilidad.

No cambiar referencias vivas por copias solo porque resulte arquitectónicamente más limpio.

No aplicar soluciones preventivas sin consumidores y defectos demostrables.

La misión es:

```text
LOCALIZAR
SEGUIR REFERENCIAS
CLASIFICAR
REPRODUCIR
PROBAR
DISTINGUIR RIESGO DE DEFECTO
DOCUMENTAR
PRIORIZAR
```

Solo después de identificar una mutación insegura reproducible podrá proponerse una subfase de corrección específica.

No iniciar esa subfase dentro de esta ejecución.
