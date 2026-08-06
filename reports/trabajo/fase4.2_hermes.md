# ORION

# ETAPA 4 — QUALITY & EVOLUTION

# FASE 4.2 — INTEGRATION TESTING

---

## 1. MISIÓN

Ejecuta la **FASE 4.2 — Integration Testing** del proyecto ORION.

La Fase 4.1 ya dejó instalada y validada la infraestructura base de testing:

* Vitest configurado.
* Cobertura HTML y LCOV.
* ESLint aplicado al árbol de tests.
* Fixtures, builders, helpers y mocks reutilizables.
* Pruebas unitarias iniciales para:

  * `numberMeta`
  * `DelayManager`
  * `SpinManager`
* 13 tests pasando.
* Build, lint y cobertura operativos.

El objetivo de esta fase es crear pruebas de integración que validen la colaboración real entre los componentes del dominio consolidado.

No conviertas esta fase en una expansión de pruebas unitarias.

No agregues funcionalidades.

No cambies el comportamiento observable.

No refactorices código productivo salvo que sea estrictamente necesario para habilitar testing, y únicamente si el cambio es mínimo, seguro, documentado y no altera contratos.

---

# 2. CONTEXTO ARQUITECTÓNICO

La ETAPA 3 — Domain Hardening está finalizada.

La arquitectura oficial es:

```text
Bootstrap
    |
    v
RouletteTracker
    |
    +-- SpinManager
    +-- SessionManager
    +-- HistoryManager
    +-- SettingsManager
    +-- DelayManager
    |
    +-- RouletteAnalytics

Utilities:
    - numberMeta
```

`RouletteTracker` continúa siendo:

* la entrada principal del dominio;
* el coordinador de los managers;
* el expositor de la API pública;
* el único owner del estado agregado.

La Fase 4.2 debe verificar esta arquitectura, no rediseñarla.

---

# 3. OBJETIVO PRINCIPAL

Crear una capa profesional de pruebas de integración para validar:

* inicialización del dominio;
* coordinación entre managers;
* flujo completo de registro de spins;
* estado de sesión;
* persistencia e historial;
* importación y exportación;
* cálculo e invalidación de delays;
* sincronización de analytics;
* comportamiento observable de `RouletteTracker`;
* aislamiento entre instancias y escenarios de prueba.

Al finalizar, los componentes principales deberán estar verificados funcionando en conjunto, no solo de manera aislada.

---

# 4. PRINCIPIOS OBLIGATORIOS

1. No introducir funcionalidades nuevas.
2. No modificar la arquitectura base.
3. No cambiar APIs públicas.
4. No cambiar comportamiento observable.
5. No ocultar errores mediante mocks excesivos.
6. No duplicar pruebas unitarias existentes.
7. No depender de orden de ejecución entre tests.
8. No usar aleatoriedad sin semilla.
9. No depender del estado real del navegador o del equipo.
10. No escribir datos persistentes fuera del entorno controlado de tests.
11. Cada test debe ser determinista.
12. Cada escenario debe poder ejecutarse de forma aislada.
13. Toda dependencia externa debe limpiarse después de cada prueba.
14. Los tests deben validar resultados públicos y efectos observables.
15. Los detalles internos privados solo deben verificarse cuando no exista una alternativa pública razonable.

---

# 5. ANÁLISIS PREVIO OBLIGATORIO

Antes de modificar archivos:

## 5.1 Inspeccionar el repositorio

Identificar:

* estructura actual de `src/`;
* ubicación real de `Bootstrap`;
* ubicación real de `RouletteTracker`;
* constructores y dependencias;
* API pública disponible;
* mecanismos de inicialización;
* persistencia utilizada;
* uso de `localStorage`, almacenamiento propio o adaptadores;
* flujo de importación y exportación;
* inicialización de `RouletteAnalytics`;
* relación entre historial, sesiones y spins;
* invalidación de caches;
* scripts existentes en `package.json`;
* configuración actual de Vitest;
* helpers, fixtures y builders creados en la Fase 4.1.

No asumas nombres de métodos ni rutas.

Adapta los tests al código real.

## 5.2 Revisar documentación

Leer antes de implementar:

* `TESTING_STRATEGY.md`
* `TEST_ARCHITECTURE.md`
* `reports/IMPLEMENTACION_ETAPA_4_1_DOMAIN_TEST_FOUNDATION.md`
* documentación arquitectónica existente;
* contrato público de `RouletteTracker`, si está disponible;
* reportes de las fases 3.x relevantes.

## 5.3 Establecer línea base

Antes de realizar cambios, ejecutar:

```bash
npm install
npm test
npm run test:coverage
npm run lint
npm run build
```

Registrar:

* cantidad inicial de suites;
* cantidad inicial de tests;
* cobertura inicial;
* warnings existentes;
* estado del build;
* duración aproximada de los tests;
* estado de Git.

Si la línea base falla, no ocultar el problema.

Documentarlo y determinar si es preexistente o causado por el entorno.

---

# 6. ALCANCE DE LAS PRUEBAS DE INTEGRACIÓN

Implementar pruebas para los siguientes bloques.

---

## 6.1 Inicialización de RouletteTracker

Validar el flujo de creación e inicialización del tracker.

Comprobar, según la API real:

* creación de una instancia válida;
* estado inicial consistente;
* sesión inicial válida;
* historial inicial válido;
* configuración inicial válida;
* analytics inicializados;
* delays inicializados;
* ausencia de datos residuales de otras instancias;
* exposición de la API pública esperada.

No validar detalles privados si la misma garantía puede verificarse mediante métodos públicos.

Archivo sugerido:

```text
tests/integration/RouletteTracker.initialization.integration.test.js
```

---

## 6.2 Flujo completo de registro de spins

Crear escenarios que atraviesen el sistema completo:

```text
RouletteTracker
    -> SpinManager
    -> SessionManager
    -> HistoryManager
    -> DelayManager
    -> RouletteAnalytics
```

Validar:

* registro de un spin válido;
* registro secuencial de varios spins;
* actualización del historial;
* actualización de `spinCount`;
* actualización de sesión;
* actualización o invalidación de delays;
* actualización de estadísticas;
* actualización de analytics;
* orden correcto de los spins;
* coherencia del estado agregado.

Escenarios mínimos:

* cero spins;
* un spin;
* diez spins;
* secuencia con números repetidos;
* secuencia con `0`;
* secuencia con `00`, si el dominio lo soporta;
* secuencia representativa de ruleta americana;
* secuencia larga determinista.

Archivo sugerido:

```text
tests/integration/spin-flow.integration.test.js
```

---

## 6.3 Sincronización de SessionManager

Validar la interacción entre sesiones y registro de spins.

Comprobar:

* creación de sesión;
* sesión activa;
* incremento correcto de `spinCount`;
* reinicio de sesión;
* creación de una nueva sesión;
* aislamiento entre sesiones;
* restauración de sesión, si existe esa funcionalidad;
* coherencia entre sesión, historial y tracker.

No inventar comportamiento.

Solo probar operaciones realmente expuestas por el sistema.

Archivo sugerido:

```text
tests/integration/session-flow.integration.test.js
```

---

## 6.4 Integración con HistoryManager

Validar:

* almacenamiento del historial;
* recuperación del historial;
* orden de elementos;
* preservación de datos;
* limpieza o reinicio, si existe;
* integración con sesión activa;
* integración con import/export;
* ausencia de referencias mutables no controladas;
* aislamiento entre instancias.

Verificar si las colecciones retornadas pueden modificar accidentalmente el estado interno.

No cambies el comportamiento únicamente para satisfacer el test.

Si se detecta un riesgo, documentarlo.

Archivo sugerido:

```text
tests/integration/history.integration.test.js
```

---

## 6.5 Persistencia

Identificar el mecanismo real de persistencia.

Puede ser:

* `localStorage`;
* almacenamiento encapsulado;
* repositorio;
* adapter;
* serialización interna;
* otro mecanismo presente en el proyecto.

Crear una capa de aislamiento para tests.

Validar:

* guardado del estado;
* recuperación del estado;
* reconstrucción del tracker;
* persistencia de spins;
* persistencia de sesión;
* persistencia de configuración;
* persistencia de custom series;
* recuperación de datos vacíos;
* recuperación ante datos inexistentes;
* comportamiento frente a datos inválidos, si está definido;
* limpieza entre tests.

No utilizar almacenamiento real del usuario.

No dejar residuos entre suites.

Si Vitest utiliza entorno Node y el proyecto necesita APIs de navegador, configurar únicamente los polyfills o el entorno mínimo requerido.

No agregar dependencias pesadas sin justificación.

Archivo sugerido:

```text
tests/integration/persistence.integration.test.js
```

---

## 6.6 Importación y exportación

Identificar la API real de import/export.

Validar:

* exportación de estado vacío;
* exportación con spins;
* exportación con sesión;
* exportación con configuración;
* importación del mismo estado exportado;
* equivalencia observable después de un round trip;
* preservación del orden;
* preservación de números `0` y `00`, cuando corresponda;
* manejo de payload incompleto;
* manejo de payload inválido, solo según comportamiento existente;
* no mutación del objeto de entrada;
* aislamiento entre instancia origen e instancia restaurada.

Escenario central:

```text
tracker A
    -> registrar spins
    -> modificar configuración permitida
    -> exportar
    -> crear tracker B
    -> importar
    -> comparar estado observable
```

No exigir igualdad de propiedades internas que no formen parte del contrato.

Archivo sugerido:

```text
tests/integration/import-export.integration.test.js
```

---

## 6.7 Integración de DelayManager

Validar el comportamiento integrado, no solo métodos aislados.

Comprobar:

* delays antes de registrar spins;
* delays después de registrar spins;
* actualización después de nuevos giros;
* invalidación de cache;
* recálculo tras invalidación;
* consistencia con historial;
* consistencia con metadatos de `numberMeta`;
* consistencia al importar estado;
* consistencia al reiniciar sesión, según contrato;
* ausencia de resultados obsoletos.

Crear al menos un escenario que detecte si el cache entrega datos antiguos después de registrar un nuevo spin.

Archivo sugerido:

```text
tests/integration/delay-sync.integration.test.js
```

---

## 6.8 Sincronización de RouletteAnalytics

Validar que analytics refleje el estado actual del dominio.

Comprobar:

* analytics con estado vacío;
* analytics después de un spin;
* analytics después de múltiples spins;
* sincronización con historial;
* sincronización con sesión;
* actualización después de importación;
* actualización después de reinicio;
* ausencia de dobles conteos;
* consistencia entre cálculos derivados;
* comportamiento con números repetidos;
* comportamiento con `0` y `00`, si aplica.

No verificar fórmulas inventadas.

Derivar las expectativas del contrato existente y del comportamiento actual.

Archivo sugerido:

```text
tests/integration/analytics-sync.integration.test.js
```

---

## 6.9 Configuración y customSeries

Si `SettingsManager` participa en la API pública o afecta analytics, delays o clasificación de números, crear pruebas de integración para:

* carga de configuración por defecto;
* modificación de preferencias permitidas;
* definición de `customSeries`;
* persistencia de configuración;
* importación/exportación de configuración;
* actualización de cálculos dependientes;
* aislamiento entre instancias;
* no mutación de objetos proporcionados por el usuario.

Archivo sugerido:

```text
tests/integration/settings.integration.test.js
```

Si esta funcionalidad no participa aún en flujos integrados observables, documentar por qué queda fuera de esta fase.

---

## 6.10 Bootstrap

Validar el proceso real de arranque de la aplicación únicamente hasta el límite razonable para pruebas de integración.

Comprobar:

* creación del tracker;
* carga de estado inicial;
* conexión de dependencias;
* exposición o entrega correcta de la instancia;
* inicialización única;
* manejo de estado vacío;
* comportamiento con estado persistido;
* ausencia de instancias duplicadas, si el contrato lo garantiza.

Evitar pruebas visuales o E2E.

No montar toda la interfaz salvo que Bootstrap dependa inevitablemente del DOM.

Archivo sugerido:

```text
tests/integration/bootstrap.integration.test.js
```

---

# 7. FIXTURES DE INTEGRACIÓN

Extender las fixtures existentes únicamente cuando sea necesario.

Crear o consolidar datasets deterministas para:

```text
emptyTrackerState
singleSpinState
tenSpinSequence
americanRouletteSequence
repeatedNumberSequence
zeroAndDoubleZeroSequence
longDeterministicSequence
validExportPayload
invalidExportPayload
customSeriesSettings
persistedTrackerState
```

No duplicar fixtures que ya existan.

Centralizar secuencias canónicas.

Todas las secuencias deben tener propósito documentado.

---

# 8. BUILDERS DE INTEGRACIÓN

Reutilizar los builders existentes.

Crear nuevos builders solo si reducen duplicación real.

Ejemplos posibles:

```javascript
createIntegratedTracker()
createTrackerWithSpins()
createTrackerWithSession()
createTrackerFromPersistedState()
createExportPayload()
createStorageMock()
```

Los nombres definitivos deben adaptarse al proyecto real.

Los builders:

* no deben ocultar el comportamiento probado;
* no deben contener assertions;
* no deben replicar lógica productiva;
* deben producir estados claros y controlados.

---

# 9. HELPERS Y ASSERTIONS

Crear helpers de integración únicamente cuando aporten claridad.

Ejemplos:

```javascript
expectTrackerToMatchState()
expectSpinFlowConsistency()
expectSessionHistoryConsistency()
expectAnalyticsConsistency()
expectExportRoundTrip()
expectDelayCacheInvalidated()
```

Reglas:

* no implementar el mismo algoritmo que el código productivo;
* no calcular resultados complejos replicando la lógica de producción;
* preferir valores esperados explícitos;
* mantener mensajes de error descriptivos.

---

# 10. MOCKS

Utilizar mocks únicamente en los límites externos:

* persistencia;
* reloj o fechas, si afectan el resultado;
* APIs de navegador;
* identificadores aleatorios;
* módulos externos no deterministas.

No mockear:

* `RouletteTracker`;
* managers del dominio;
* `RouletteAnalytics`;
* `numberMeta`;

cuando sean precisamente los componentes cuya integración se está validando.

La prueba debe usar implementaciones reales de los componentes internos.

---

# 11. AISLAMIENTO DE ESTADO

Implementar limpieza obligatoria:

```javascript
beforeEach(() => {
  // restaurar mocks
  // limpiar storage
  // restaurar timers
  // crear nuevas instancias
});

afterEach(() => {
  // limpiar residuos
  // restaurar mocks globales
});
```

Usar las APIs reales de Vitest:

* `vi.clearAllMocks()`
* `vi.restoreAllMocks()`
* `vi.useRealTimers()`

cuando corresponda.

No compartir una instancia mutable entre tests.

---

# 12. ENTORNO DE EJECUCIÓN

Evaluar si las pruebas requieren:

* entorno `node`;
* entorno `jsdom`;
* configuración por archivo;
* setup global;
* polyfills mínimos.

No cambiar todo el proyecto a `jsdom` si solo una suite necesita APIs del navegador.

Preferir configuración específica:

```javascript
// @vitest-environment jsdom
```

o un archivo de setup dedicado, según la estructura real.

Documentar cualquier decisión.

---

# 13. COBERTURA

No perseguir cobertura artificial.

La prioridad es cubrir flujos de integración relevantes.

Configurar, revisar o conservar métricas para:

* statements;
* branches;
* functions;
* lines.

Registrar:

* cobertura antes de la Fase 4.2;
* cobertura después de la Fase 4.2;
* módulos con baja cobertura;
* exclusiones justificadas;
* brechas reservadas para Fase 4.3.

No excluir archivos solo para elevar porcentajes.

No establecer thresholds globales agresivos sin analizar la línea base.

Si se incorporan thresholds, deben ser graduales y estar documentados.

---

# 14. SCRIPTS NPM

Revisar los scripts existentes.

Mantener compatibilidad con:

```bash
npm test
npm run test:coverage
npm run lint
npm run build
```

Agregar únicamente si aporta valor:

```bash
npm run test:unit
npm run test:integration
npm run test:watch
npm run test:ci
```

No romper scripts existentes.

No duplicar comandos innecesariamente.

Un script sugerido:

```json
"test:integration": "vitest run tests/integration"
```

Adapta la sintaxis a la configuración real.

---

# 15. ESLINT

Mantener la decisión de Fase 4.1:

* lint obligatorio sobre `tests/`;
* no ampliar de manera accidental el alcance a todo `src/`;
* no corregir warnings legacy de `src/` dentro de esta fase;
* registrar esa deuda técnica por separado.

Añadir reglas específicas para tests solo si son necesarias y justificadas.

No desactivar reglas globalmente para ocultar problemas.

---

# 16. CAMBIOS EN CÓDIGO PRODUCTIVO

La expectativa principal es que esta fase pueda completarse sin cambios significativos en `src/`.

Si un componente no puede integrarse o probarse por acoplamiento fuerte:

1. documentar el bloqueo;
2. identificar la causa exacta;
3. proponer el cambio mínimo;
4. demostrar que no altera comportamiento observable;
5. agregar pruebas antes y después;
6. registrar el cambio en el informe.

No realizar refactors amplios.

No renombrar APIs públicas.

No mover módulos productivos sin necesidad.

No introducir adapters nuevos salvo que sean imprescindibles para aislar una dependencia externa.

---

# 17. CASOS DE ERROR

Probar errores reales soportados por el sistema.

Ejemplos posibles:

* spin inválido;
* payload de importación inválido;
* estado persistido corrupto;
* configuración inválida;
* operación sobre sesión inexistente;
* almacenamiento no disponible.

No inventar excepciones o validaciones que el sistema actualmente no tenga.

Si el comportamiento actual ante un error es ambiguo, caracterizarlo con un test y documentarlo, sin cambiarlo automáticamente.

---

# 18. CHARACTERIZATION TESTS

Cuando exista comportamiento no documentado pero observable, crear pruebas de caracterización.

Objetivo:

* capturar el comportamiento actual;
* protegerlo frente a regresiones;
* permitir una futura decisión consciente.

Marcar estos tests claramente:

```javascript
describe('characterization: ...', () => {
  // comportamiento actual capturado sin reinterpretarlo
});
```

No presentar un comportamiento accidental como diseño definitivo.

Registrarlo en el informe como deuda o decisión pendiente.

---

# 19. NO HACER EN ESTA FASE

Queda prohibido:

* agregar nuevas estadísticas;
* modificar fórmulas;
* cambiar la semántica de delays;
* rediseñar managers;
* cambiar el owner del estado;
* crear un nuevo sistema de persistencia;
* implementar UI testing;
* agregar Playwright o Cypress;
* realizar pruebas E2E completas;
* solucionar el warning de chunks de Vite;
* limpiar todos los warnings legacy de `src/`;
* convertir la infraestructura en skill reutilizable;
* comenzar la Fase 4.3 dentro de esta ejecución;
* modificar APIs por comodidad del test;
* ocultar defectos mediante mocks.

---

# 20. ESTRUCTURA ESPERADA

Adaptar a la estructura existente, evitando crear carpetas vacías o duplicadas.

Ejemplo:

```text
tests/
├── unit/
│   ├── utils/
│   ├── managers/
│   └── tracker/
│
├── integration/
│   ├── RouletteTracker.initialization.integration.test.js
│   ├── spin-flow.integration.test.js
│   ├── session-flow.integration.test.js
│   ├── history.integration.test.js
│   ├── persistence.integration.test.js
│   ├── import-export.integration.test.js
│   ├── delay-sync.integration.test.js
│   ├── analytics-sync.integration.test.js
│   ├── settings.integration.test.js
│   └── bootstrap.integration.test.js
│
├── fixtures/
├── builders/
├── helpers/
├── mocks/
└── setup/
```

No es obligatorio crear todos los archivos si alguna funcionalidad no existe o no puede validarse todavía.

En ese caso, documentar la exclusión.

---

# 21. DOCUMENTACIÓN

Actualizar:

```text
TESTING_STRATEGY.md
TEST_ARCHITECTURE.md
```

Agregar:

```text
INTEGRATION_TESTING_GUIDE.md
```

El documento debe incluir:

## Propósito

Qué se considera una prueba de integración en ORION.

## Alcance

Qué módulos se integran y cuáles quedan fuera.

## Convenciones

* nombres de archivos;
* estructura de suites;
* uso de fixtures;
* uso de builders;
* uso de mocks;
* limpieza de estado.

## Persistencia

Cómo se aísla.

## Bootstrap

Cómo se prueba.

## Import/export

Cómo se valida el round trip.

## Analytics

Cómo se verifica la sincronización.

## Ejecución

```bash
npm test
npm run test:integration
npm run test:coverage
```

## Diagnóstico

Cómo interpretar fallos.

## Límites

Qué corresponde a Fase 4.3 o a E2E.

---

# 22. INFORME FINAL

Crear:

```text
reports/IMPLEMENTACION_ETAPA_4_2_INTEGRATION_TESTING.md
```

Debe contener obligatoriamente:

# Implementación ETAPA 4.2 — Integration Testing

## 1. Resumen ejecutivo

Explicar qué se implementó y el nivel de confianza conseguido.

## 2. Línea base

Registrar:

* tests antes;
* suites antes;
* cobertura antes;
* build antes;
* lint antes;
* warnings preexistentes.

## 3. Análisis arquitectónico

Explicar:

* cómo se inicializa el dominio;
* cómo colaboran los managers;
* cómo funciona persistencia;
* cómo funciona import/export;
* cómo se sincroniza analytics;
* cómo se invalidan delays.

## 4. Archivos creados

Lista completa con propósito.

## 5. Archivos modificados

Lista completa y justificación.

## 6. Escenarios cubiertos

Tabla sugerida:

| Escenario         | Componentes integrados             | Resultado |
| ----------------- | ---------------------------------- | --------- |
| Inicialización    | Tracker + Managers + Analytics     | OK        |
| Registro de spins | Tracker + Spin + Session + History | OK        |
| Persistencia      | Tracker + Storage                  | OK        |
| Round trip        | Export + Import                    | OK        |
| Analytics         | History + Analytics                | OK        |
| Delays            | Spins + Delay cache                | OK        |

## 7. Fixtures, builders y helpers

Detallar los reutilizados y los nuevos.

## 8. Mocks y aislamiento

Explicar límites externos simulados.

## 9. Cobertura

Incluir:

* antes;
* después;
* diferencia;
* módulos aún débiles;
* exclusiones justificadas.

## 10. Resultados de verificación

Registrar resultados reales de:

```bash
npm install
npm test
npm run test:integration
npm run test:coverage
npm run lint
npm run build
```

## 11. Warnings

Separar:

* warnings preexistentes;
* warnings nuevos;
* warnings resueltos.

El warning de Vite por chunks mayores a 500 kB no debe tratarse como fallo si sigue siendo el mismo warning preexistente.

## 12. Hallazgos

Clasificar:

* defectos reales;
* comportamiento ambiguo;
* deuda técnica;
* riesgos de regresión;
* oportunidades futuras.

## 13. Cambios productivos

Indicar explícitamente:

* si se modificó `src/`;
* por qué;
* impacto;
* pruebas que protegen el cambio.

Si no hubo cambios productivos, declararlo.

## 14. Riesgos pendientes

Indicar riesgos no cubiertos.

## 15. Recomendaciones para Fase 4.3

Preparar la siguiente fase:

```text
FASE 4.3 — Regression Safety
```

## 16. Estado final

Concluir con una de estas opciones:

```text
FASE 4.2 COMPLETADA
```

```text
FASE 4.2 COMPLETADA CON OBSERVACIONES
```

```text
FASE 4.2 BLOQUEADA
```

No declarar éxito si algún comando obligatorio falla.

---

# 23. VALIDACIÓN FINAL OBLIGATORIA

Ejecutar al finalizar:

```bash
npm install
npm test
npm run test:integration
npm run test:coverage
npm run lint
npm run build
git status --short
```

Si `test:integration` no existía y fue creado, verificarlo explícitamente.

Registrar:

* número total de suites;
* número total de tests;
* cantidad de tests de integración;
* tests fallidos;
* cobertura final;
* duración;
* estado del build;
* estado del lint;
* archivos sin seguimiento;
* cambios pendientes.

No afirmar que una verificación pasó sin ejecutarla.

---

# 24. CRITERIOS DE ACEPTACIÓN

La fase solo puede considerarse completada si:

* las pruebas unitarias anteriores siguen pasando;
* las pruebas de integración pasan;
* el flujo principal de spins está cubierto;
* sesión e historial permanecen sincronizados;
* analytics refleja el estado actual;
* delays no entregan cache obsoleto;
* persistencia está aislada;
* import/export tiene al menos un round trip verificado;
* Bootstrap está probado hasta un límite razonable;
* no se alteró la API pública;
* no se introdujeron funcionalidades;
* lint pasa dentro del alcance establecido;
* cobertura se genera correctamente;
* build finaliza correctamente;
* no aparecen warnings nuevos sin documentar;
* existe informe final;
* existe guía de integration testing.

---

# 25. CRITERIO DE DETENCIÓN

Detén la implementación y documenta el bloqueo si descubres:

* que el código analizado no corresponde a la arquitectura descrita;
* que faltan archivos críticos;
* que la línea base no compila;
* que los tests anteriores fallan antes de los cambios;
* que la persistencia no puede aislarse sin rediseño;
* que import/export no existe;
* que Bootstrap depende de infraestructura no disponible;
* que sería necesario cambiar un contrato público;
* que aparece riesgo de pérdida de datos;
* que el repositorio tiene cambios ajenos que podrían sobrescribirse.

No improvises cambios arquitectónicos para continuar.

---

# 26. DISCIPLINA GIT

Antes de modificar:

```bash
git status --short
git branch --show-current
git log -1 --oneline
```

No eliminar ni sobrescribir cambios existentes del usuario.

No ejecutar:

```bash
git reset --hard
git clean -fd
git checkout -- .
```

No crear commits ni tags automáticamente, salvo instrucción explícita del usuario.

Al finalizar, proponer:

```bash
git add package.json package-lock.json \
  vitest.config.js eslint.config.js \
  tests/ \
  TESTING_STRATEGY.md \
  TEST_ARCHITECTURE.md \
  INTEGRATION_TESTING_GUIDE.md \
  reports/IMPLEMENTACION_ETAPA_4_2_INTEGRATION_TESTING.md

git commit -m "test(domain): add phase 4.2 integration coverage"

git tag -a etapa-4.2-integration-testing \
  -m "ORION ETAPA 4.2 completed: domain integration testing"
```

Ajustar la lista según los archivos realmente modificados.

---

# 27. SALIDA FINAL DE HERMES

Al terminar, entregar un resumen breve con:

```text
ETAPA 4.2 — INTEGRATION TESTING

Estado:
- COMPLETADA / COMPLETADA CON OBSERVACIONES / BLOQUEADA

Resultados:
- Suites:
- Tests totales:
- Tests de integración:
- Coverage:
- Lint:
- Build:

Archivos principales:
- ...

Código productivo modificado:
- Sí / No

Warnings:
- ...

Informe:
- reports/IMPLEMENTACION_ETAPA_4_2_INTEGRATION_TESTING.md

Siguiente fase recomendada:
- ETAPA 4.3 — REGRESSION SAFETY
```

No ofrecer convertir la infraestructura en skill todavía.

Primero debe completarse y validarse la Fase 4.3.

---

# 28. RESULTADO ESPERADO

Al finalizar esta fase, ORION debe pasar de tener componentes probados individualmente a tener flujos completos del dominio protegidos mediante pruebas automáticas.

El objetivo no es demostrar que cada clase funciona por separado.

El objetivo es demostrar que el sistema consolidado funciona correctamente cuando sus componentes colaboran.

Ejecuta ahora la FASE 4.2.
