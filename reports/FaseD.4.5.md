# PROMPT OFICIAL — FASE D.4.5

# Tomador Input Pipeline, Laboratory Persistence & Strategy Pack Analysis

## Proyecto

**Roulette Tracker**

## Módulos implicados

* `Tomador`
* `Ajustes_vito`
* `Lab_Con`
* `RouletteTracker`
* `LaboratoryOrchestrator`
* `LaboratoryBindingLayer`
* motores y estrategias registradas
* persistencia del Laboratory

## Tipo de intervención

**Diseño, implementación, integración funcional, persistencia, pruebas runtime y certificación incremental**

---

# 1. Contexto obligatorio

La navegación interna de `Lab_Con` fue corregida previamente.

El defecto consistía en que `main.js` registraba el handler de navegación sobre todos los elementos `.nav-btn`, incluyendo las pestañas internas de `Lab_Con`.

La corrección aplicada fue:

```js
'.top-nav .nav-btn[data-target]'
```

También se agregó una guard clause en `activateTab()` para ignorar identificadores vacíos.

Existe una prueba de regresión:

```text
tests/regression/lab-con-navigation.test.js
```

Esta protección debe mantenerse.

No reabrir ese defecto salvo que la prueba falle.

---

# 2. Objetivo funcional oficial

La pestaña `Lab_Con` debe utilizar como entrada oficial los datos ingresados por el operador en la pestaña `Tomador`.

El flujo obligatorio es:

```text
Tomador
   │
   ▼
RouletteTracker / fuente oficial de giros
   │
   ▼
Laboratory Input Pipeline
   │
   ▼
Estrategias seleccionadas
   │
   ├── análisis individual
   ├── análisis paralelo
   └── análisis conjunto o modo manada
   │
   ▼
Resultados derivados
   │
   ▼
Base de datos propia del Laboratory
   │
   ▼
LaboratoryOrchestrator
   │
   ▼
LaboratoryBindingLayer
   │
   ▼
ViewModels
   │
   ▼
Lab_Con
```

La implementación debe permitir:

1. recibir giros ingresados en `Tomador`;
2. controlar el encendido del Laboratory desde `Ajustes_vito`;
3. seleccionar una o más estrategias;
4. ejecutar cada estrategia por separado;
5. ejecutar varias estrategias en paralelo;
6. coordinar varias estrategias como una manada;
7. guardar resultados individuales y colectivos;
8. recuperar resultados después de recargar;
9. mostrar resultados en `Lab_Con`;
10. conservar trazabilidad hasta los giros originales de `Tomador`.

---

# 3. Fuente oficial de entrada

## 3.1 Tomador

`Tomador` es la interfaz oficial utilizada por el operador para ingresar los números o giros.

Los datos ingresados deben llegar a la fuente funcional compartida mediante el flujo existente.

Antes de modificar, determinar con evidencia:

* cómo `Tomador` registra un giro;
* qué método utiliza;
* cómo llega a `RouletteTracker`;
* cómo se persiste;
* qué evento se publica;
* qué identificador estable recibe el giro;
* cuándo se considera confirmado.

No crear un flujo paralelo de captura para Laboratory.

---

## 3.2 Fuente persistente de giros

La fuente persistente identificada es:

```text
IndexedDB:
orion_roulette_spins
```

Implementación:

```text
rouletteSpinsStore.js
```

`RouletteTracker` debe seguir siendo propietario de los giros.

Laboratory no debe crear una segunda base que compita como fuente oficial de números.

---

## 3.3 Propiedad de los datos

Aplicar esta separación:

```text
Tomador / RouletteTracker
→ propietario de los datos capturados

Laboratory
→ propietario de experimentos, ejecuciones,
  resultados, evidencias y análisis derivados
```

La base del Laboratory puede conservar:

* IDs de los giros;
* rango de secuencias;
* checksum o huella;
* snapshot controlado cuando sea necesario para reproducibilidad.

No debe duplicar indiscriminadamente todos los giros.

---

# 4. Control ON/OFF desde Ajustes_vito

## 4.1 Requisito

El operador debe poder encender o apagar el Laboratory desde la pestaña:

```text
Ajustes_vito
```

Debe existir un parámetro persistente equivalente a:

```js
laboratory: {
  enabled: boolean
}
```

El nombre definitivo debe respetar el esquema real de `SettingsManager`.

---

## 4.2 Persistencia

El parámetro debe almacenarse usando la infraestructura compartida:

```text
IndexedDB:
orion_roulette_settings
```

Flujo requerido:

```text
Ajustes_vito
   │
   ▼
SettingsManager
   │
   ▼
rouletteSettingsStore
   │
   ▼
orion_roulette_settings
```

No guardarlo en:

```text
orion.laboratory.shell.preferences.v2
```

Esa clave debe continuar reservada para preferencias visuales del shell.

---

## 4.3 Comportamiento OFF

Cuando Laboratory está en `OFF`:

* `Tomador` continúa funcionando;
* los giros continúan guardándose;
* Laboratory no inicia análisis automáticos nuevos;
* no crea nuevas ejecuciones;
* no persiste nuevos resultados derivados;
* no publica falsos eventos de análisis;
* `Lab_Con` puede abrirse;
* `Lab_Con` debe permitir revisar datos históricos;
* debe mostrarse un indicador de modo inactivo;
* los controles que requieren ejecución deben estar deshabilitados o explicar por qué no pueden ejecutarse.

Texto conceptual:

```text
Laboratory inactivo — visualización histórica
```

No borrar resultados históricos al apagar Laboratory.

---

## 4.4 Comportamiento ON

Cuando Laboratory está en `ON`:

* los nuevos datos confirmados por `Tomador` pueden activar el pipeline;
* se ejecutan las estrategias configuradas;
* se guardan resultados;
* `Lab_Con` actualiza sus ViewModels;
* el estado se mantiene tras recargar.

Debe registrarse el punto de activación:

```js
{
  enabled: true,
  enabledAt: 'ISO-8601',
  startSpinSequence: 1234
}
```

La estructura definitiva debe seguir los contratos reales.

---

## 4.5 No reprocesar automáticamente todo el historial

Cambiar a `ON` no debe implicar automáticamente:

```text
reprocesar todos los giros históricos
```

Por defecto, debe procesar los giros posteriores al punto de activación.

El reprocesamiento histórico debe ser una acción separada y explícita, por ejemplo:

```text
Analizar rango histórico
```

No implementar esta acción si está fuera del alcance actual, pero dejar el contrato preparado.

---

## 4.6 Cambio ON → OFF durante una ejecución

Definir y documentar una política explícita.

Política recomendada:

```text
OFF impide iniciar nuevas ejecuciones.
La ejecución actualmente iniciada puede terminar de forma controlada.
```

Si el proyecto dispone de cancelación transaccional segura, puede utilizarse.

Nunca guardar un resultado parcial como `completed`.

Estados posibles:

```text
pending
running
completed
failed
cancelled
```

---

# 5. Selección y ejecución de estrategias

## 5.1 Requisito general

Laboratory debe permitir analizar:

1. una estrategia individual;
2. varias estrategias por separado;
3. varias estrategias en conjunto como una manada.

Cada estrategia debe conservar su identidad y resultado propio.

---

## 5.2 Modos de análisis

Definir un contrato equivalente a:

```js
analysisMode:
  | 'individual'
  | 'parallel'
  | 'pack'
```

### `individual`

Ejecuta una sola estrategia.

```text
Input Tomador
   │
   ▼
Estrategia A
   │
   ▼
Resultado A
```

### `parallel`

Ejecuta varias estrategias con el mismo input, manteniendo resultados independientes.

```text
Input
   │
   ├── Estrategia A → Resultado A
   ├── Estrategia B → Resultado B
   └── Estrategia C → Resultado C
```

No genera necesariamente una decisión conjunta.

### `pack`

Ejecuta varias estrategias y posteriormente coordina sus resultados.

```text
Input
   │
   ├── Estrategia A ─┐
   ├── Estrategia B ─┼──► Strategy Pack Coordinator
   └── Estrategia C ─┘
                              │
                              ▼
                    Resultado colectivo
```

---

# 6. Registro de estrategias

Antes de implementar, auditar cómo existen actualmente las estrategias.

Identificar:

* motores;
* módulos;
* IDs;
* versiones;
* parámetros;
* entradas;
* salidas;
* errores;
* dependencias;
* compatibilidad con ejecución aislada.

Crear:

```text
reports/LABORATORY_STRATEGY_INVENTORY.md
```

Formato mínimo:

| ID | Nombre | Implementación | Entrada | Salida | Parámetros | Versión | Ejecutable aislada | Estado |
| -- | ------ | -------------- | ------- | ------ | ---------- | ------- | ------------------ | ------ |

No inventar adaptadores hasta conocer los contratos reales.

---

# 7. Contrato común de estrategia

Crear o reutilizar un contrato de Application equivalente a:

```js
interface LaboratoryStrategy {
  id: string;
  name: string;
  version: string;

  validateConfiguration(configuration): ValidationResult;

  execute(input, configuration, executionContext):
    Promise<StrategyExecutionResult>;
}
```

Adaptar a JavaScript y a las convenciones reales.

Cada estrategia debe poder ejecutarse sin conocer:

* UI;
* IndexedDB;
* `LaboratoryBindingLayer`;
* renderer;
* proveedor AI;
* otras estrategias.

---

# 8. Configuración paramétrica

El operador debe poder definir, mediante la configuración adecuada:

```js
{
  laboratory: {
    enabled: true,
    analysisMode: 'pack',
    strategies: [
      {
        id: 'strategy-a',
        enabled: true,
        weight: 1,
        parameters: {}
      },
      {
        id: 'strategy-b',
        enabled: true,
        weight: 0.8,
        parameters: {}
      }
    ],
    packPolicy: {
      type: 'weighted-consensus',
      quorum: 0.6
    }
  }
}
```

No copiar literalmente si el esquema actual utiliza otro formato.

Debe validarse:

* al menos una estrategia habilitada;
* estrategia existente;
* parámetros correctos;
* pesos no negativos;
* quórum válido;
* modo compatible con cantidad de estrategias.

---

# 9. Strategy Execution Coordinator

Crear una responsabilidad de Application equivalente a:

```text
LaboratoryStrategyExecutionCoordinator
```

Responsabilidades:

* recibir el input normalizado;
* recibir la configuración;
* resolver estrategias;
* ejecutar una o varias;
* aislar errores;
* medir duración;
* normalizar resultados;
* producir resultados individuales;
* entregar resultados al coordinador de manada cuando corresponde.

No debe:

* renderizar;
* leer directamente IndexedDB;
* guardar preferencias visuales;
* contener lógica interna de todas las estrategias.

---

# 10. Strategy Pack Coordinator

Crear una responsabilidad independiente equivalente a:

```text
LaboratoryStrategyPackCoordinator
```

Responsabilidades:

* recibir resultados individuales ya normalizados;
* calcular coincidencias;
* detectar conflictos;
* aplicar pesos;
* aplicar quórum;
* medir acuerdo;
* calcular contribuciones;
* identificar redundancias;
* identificar sinergias observadas;
* producir resultado colectivo;
* registrar ausencia de consenso.

No debe ejecutar la lógica interna de las estrategias.

---

# 11. Políticas de coordinación

Diseñar el sistema para soportar políticas extensibles.

Implementar como mínimo una política funcional y determinista:

```text
weighted-consensus
```

Puede contemplar:

* peso base;
* confianza declarada;
* estado de ejecución;
* quórum.

Preparar contratos para:

```text
simple-majority
weighted-consensus
unanimity
quorum
```

No es obligatorio implementar todas en esta fase.

---

# 12. Ausencia de consenso

La manada debe poder responder:

```text
NO_CONSENSUS
```

No forzar una decisión.

Modelo conceptual:

```js
{
  status: 'conflict',
  decision: null,
  agreementScore: 0.42,
  supporters: [],
  opponents: [],
  abstentions: [],
  limitations: [
    'No se alcanzó el quórum configurado'
  ]
}
```

Conservar:

* qué estrategia apoyó cada resultado;
* peso;
* confianza;
* motivo;
* evidencia;
* error si existió.

---

# 13. Resultados individuales

Cada ejecución individual debe generar un resultado serializable.

Ejemplo conceptual:

```js
{
  id: 'strategy-result-...',
  runId: 'strategy-run-...',
  strategyId: 'strategy-a',
  strategyVersion: '1.0.0',
  status: 'completed',
  inputReference: {},
  configurationSnapshot: {},
  signal: {},
  confidence: 0.72,
  metrics: {},
  evidence: [],
  startedAt: '...',
  completedAt: '...',
  durationMs: 0,
  errors: []
}
```

No exigir campos inexistentes si no son relevantes, pero conservar trazabilidad.

---

# 14. Resultado colectivo

Ejemplo conceptual:

```js
{
  id: 'pack-result-...',
  packRunId: 'pack-run-...',
  policy: {
    type: 'weighted-consensus',
    quorum: 0.6
  },
  status: 'consensus',
  decision: {},
  agreementScore: 0.78,
  strategyContributions: [],
  conflicts: [],
  synergies: [],
  limitations: [],
  generatedAt: '...'
}
```

El resultado colectivo nunca debe borrar ni reemplazar resultados individuales.

---

# 15. Sinergias y conflictos

## 15.1 Conflicto

Registrar:

* estrategias alineadas;
* estrategias opuestas;
* abstenciones;
* fuerza de cada posición;
* score de acuerdo;
* quórum;
* limitaciones.

## 15.2 Sinergia

En esta fase, la sinergia debe tratarse como una métrica experimental.

Puede basarse inicialmente en:

* coincidencia;
* complementariedad;
* no redundancia;
* mejora del score colectivo;
* contribución marginal.

No presentar una sinergia como garantía predictiva.

---

# 16. Input normalizado desde Tomador

Crear un contrato equivalente a:

```js
{
  source: 'tomador',
  spinIds: [],
  sequenceFrom: 0,
  sequenceTo: 0,
  spins: [],
  capturedAt: '...',
  checksum: '...'
}
```

Determinar si es necesario incluir `spins` completos o solo referencias.

El input debe ser:

* inmutable durante la ejecución;
* ordenado;
* validado;
* serializable;
* reproducible.

---

# 17. Base de datos propia del Laboratory

## 17.1 Requisito

Los resultados del Laboratory deben persistirse en una base propia.

Nombre conceptual:

```text
orion_laboratory
```

El nombre real debe seguir las convenciones de stores existentes.

No crear la base hasta diseñar y documentar el esquema.

---

## 17.2 Datos que debe almacenar

Como mínimo:

* experimentos;
* sesiones o ejecuciones;
* StrategyRun;
* StrategyResult;
* PackRun;
* PackResult;
* evidencias derivadas;
* eventos de Timeline persistibles;
* metadatos;
* referencias a giros de Tomador;
* configuración utilizada;
* versiones de estrategias.

---

## 17.3 Datos que no debe almacenar

No persistir:

* elementos DOM;
* HTML;
* funciones;
* instancias no serializables;
* ViewModels completos como fuente de verdad;
* secretos;
* referencias circulares;
* preferencias visuales del shell;
* duplicados sin control de los giros.

---

## 17.4 Esquema y versión

Documentar antes de implementar:

```text
databaseName
databaseVersion
objectStores
primaryKeys
indexes
transactions
migrations
recovery
errorHandling
```

Crear:

```text
reports/LABORATORY_DATABASE_SCHEMA.md
```

---

# 18. Stores conceptuales

Evaluar object stores equivalentes a:

```text
experiments
sessions
strategyRuns
strategyResults
packRuns
packResults
evidence
timelineEvents
```

No crear stores innecesarios.

Cada store debe tener:

* owner;
* propósito;
* lifecycle;
* clave primaria;
* índices;
* relación con otras entidades.

---

# 19. Atomicidad

Una ejecución debe persistirse de forma coherente.

Secuencia recomendada:

```text
crear run: running
→ ejecutar estrategias
→ guardar resultados individuales
→ generar resultado pack
→ guardar resultado pack
→ marcar run: completed
```

Si existe error:

```text
run: failed
```

No dejar una ejecución parcial marcada como completada.

Usar transacciones cuando IndexedDB y el diseño real lo permitan.

---

# 20. Idempotencia

Evitar procesar el mismo input varias veces de forma accidental.

Crear una clave o huella basada en:

* modo;
* IDs de giros;
* configuración;
* versiones de estrategias.

Ejemplo conceptual:

```text
inputChecksum + configurationChecksum + strategyVersions
```

Si se permite repetir deliberadamente, cada ejecución debe conservar un ID distinto, pero registrar que utilizó el mismo input.

---

# 21. Bootstrap e hidratación

Reconstruir el flujo real:

```text
1. restaurar settings
2. restaurar spins
3. restaurar Laboratory
4. crear coordinadores
5. crear Orchestrator
6. crear Binding Layer
7. registrar eventos
8. renderizar
```

Determinar qué partes deben esperarse con `await`.

Evitar:

* primer render con estado incorrecto;
* análisis antes de cargar configuración;
* ejecución duplicada al restaurar;
* pérdida de resultados por condición de carrera.

---

# 22. Event Bus

Reutilizar el Event Bus central existente.

Eventos conceptuales:

```text
settings.laboratory-mode-changed
tracker.spin-confirmed
laboratory.input-received
laboratory.run-started
laboratory.strategy-started
laboratory.strategy-completed
laboratory.strategy-failed
laboratory.pack-completed
laboratory.run-completed
laboratory.run-failed
laboratory.state-restored
```

Antes de crear nombres:

* inspeccionar convenciones;
* evitar duplicados;
* mantener payloads serializables.

El Event Bus no debe convertirse en fuente de verdad.

---

# 23. Pipeline automático

Cuando `laboratory.enabled === true` y se confirma un nuevo giro:

```text
Tomador
→ RouletteTracker
→ persistencia del giro
→ evento confirmado
→ Laboratory Input Adapter
→ validación de configuración
→ Strategy Execution Coordinator
→ resultados individuales
→ Strategy Pack Coordinator, si aplica
→ persistencia Laboratory
→ actualización Orchestrator
→ Binding Layer
→ re-render Lab_Con
```

Cuando está `false`, el pipeline debe detenerse antes de crear una ejecución.

---

# 24. Tamaño mínimo de muestra

No asumir que cada estrategia puede ejecutarse con un solo giro.

Cada estrategia debe poder declarar:

```js
minimumInputSize
```

Cuando no se cumple:

```text
status: insufficient-data
```

No debe tratarse como error técnico.

El coordinador debe informar qué estrategias aún no pueden ejecutarse.

---

# 25. Lab_Con

## 25.1 Indicador de modo

Mostrar:

```text
Laboratory activo
```

o:

```text
Laboratory inactivo — visualización histórica
```

## 25.2 Configuración activa

Mostrar como mínimo:

* modo;
* estrategias habilitadas;
* política de manada;
* último input procesado;
* última ejecución;
* estado.

## 25.3 Resultados

Los workspaces deben alimentarse desde la base y Application:

### Overview

* conteos;
* última ejecución;
* estrategias activas;
* estado ON/OFF;
* resultados recientes.

### Experiments

* experimentos persistidos;
* configuración;
* rango de giros.

### Sessions

* ejecuciones persistidas;
* estado;
* input;
* duración.

### Comparison

* comparar estrategias;
* estrategia vs manada;
* pack vs pack.

### Evidence Explorer

* evidencias generadas;
* estrategia de origen;
* ejecución.

### Replay

* eventos de ejecución;
* orden temporal;
* resultados por estrategia;
* construcción del consenso.

### AI Research

* contexto de resultados individuales;
* resultado de manada;
* conflictos;
* sinergias;
* limitaciones.

---

# 26. Ajustes_vito

Implementar controles claros para:

```text
Modo Laboratory: ON / OFF

Modo de análisis:
- Individual
- Paralelo
- Manada

Estrategias:
- habilitar/deshabilitar
- parámetros
- peso

Política de manada:
- tipo
- quórum
```

No introducir una UI compleja si el sistema visual actual ofrece patrones reutilizables.

Aplicar validación y mensajes comprensibles.

---

# 27. Seguridad y robustez

Garantizar:

* ninguna clave externa;
* ningún dato no serializable;
* validación de configuración;
* manejo de errores;
* aislamiento de fallos por estrategia;
* persistencia controlada;
* protección contra ejecución duplicada;
* recuperación tras recarga;
* compatibilidad con datos previos.

Una estrategia que falla no debe necesariamente impedir guardar los resultados correctos de las demás.

El Pack Coordinator debe decidir si puede operar con resultados parciales según la política.

---

# 28. Migración y compatibilidad

La nueva base no debe romper:

* `orion_roulette_spins`;
* `orion_roulette_settings`;
* `orion_tomador_state`;
* historial;
* configuraciones anteriores;
* shell histórico;
* demás pestañas.

Si se añade un campo nuevo de settings:

* aplicar default seguro;
* `enabled` debe iniciar en `false`, salvo que exista una decisión previa explícita;
* preservar configuraciones antiguas;
* documentar migración.

---

# 29. Auditoría inicial obligatoria

Antes de modificar:

```bash
pwd
git status --short
git branch --show-current
git rev-parse HEAD
git log -n 8 --oneline
git diff --stat
git diff --check
```

No descartar cambios del usuario.

Prohibido:

```bash
git reset --hard
git clean -fd
git restore .
git checkout .
```

---

# 30. Log desde el inicio

Crear:

```text
reports/logs/Fase_D4_5_Tomador_Laboratory_Pack_YYYYMMDD_HHMMSS.log
```

Registrar progresivamente:

* auditoría;
* arquitectura encontrada;
* decisiones;
* esquema;
* archivos;
* pruebas;
* runtime;
* errores;
* correcciones;
* estado final.

---

# 31. Documentos obligatorios

Crear:

```text
reports/LABORATORY_STRATEGY_INVENTORY.md
reports/LABORATORY_DATABASE_SCHEMA.md
reports/LABORATORY_TOMADOR_PIPELINE.md
reports/LABORATORY_PACK_COORDINATION.md
reports/LABORATORY_MANUAL_ACCEPTANCE_TEST.md
reports/FASE_D4_5_IMPLEMENTATION_REPORT.md
```

---

# 32. Estrategia de implementación

## Paso 1 — Auditoría

* flujo Tomador;
* tracker;
* stores;
* settings;
* estrategias;
* Laboratory actual;
* Bootstrap;
* eventos;
* UI.

## Paso 2 — Diseño

Definir:

* contratos;
* esquema;
* modo ON/OFF;
* modos de análisis;
* coordinadores;
* persistencia;
* eventos.

## Paso 3 — Settings

Implementar:

* parámetro;
* default;
* persistencia;
* restauración;
* UI Ajustes_vito;
* notificación.

## Paso 4 — Input Adapter

Implementar el adaptador Tomador/Tracker → Laboratory.

## Paso 5 — Strategy Registry

Registrar estrategias disponibles mediante contratos homogéneos.

## Paso 6 — Execution Coordinator

Implementar individual y parallel.

## Paso 7 — Pack Coordinator

Implementar `weighted-consensus`.

## Paso 8 — Persistence

Implementar base, stores, repositorios y recuperación.

## Paso 9 — Orchestrator y Binding

Conectar pipeline y ViewModels.

## Paso 10 — Lab_Con

Mostrar estado, configuración y resultados.

## Paso 11 — Runtime

Probar Tomador, ON/OFF, ejecución y reload.

## Paso 12 — Certificación

Tests, lint, build, arquitectura y documentos.

---

# 33. Pruebas obligatorias

## 33.1 Settings

* default OFF;
* cambiar ON;
* cambiar OFF;
* persistir;
* recargar;
* notificar;
* no alterar otros settings.

## 33.2 Tomador input

* confirmar giro;
* persistir giro;
* generar input;
* mantener orden;
* preservar ID;
* no procesar giro inválido.

## 33.3 OFF

```text
Laboratory OFF
→ Tomador registra giro
→ tracker cambia
→ no se crea LaboratoryRun
→ no se guarda resultado
```

## 33.4 ON

```text
Laboratory ON
→ Tomador registra giro
→ input recibido
→ ejecución creada
→ estrategia ejecutada
→ resultado persistido
→ Lab_Con actualizado
```

## 33.5 Individual

* una estrategia;
* resultado;
* error;
* datos insuficientes;
* persistencia.

## 33.6 Parallel

* varias estrategias;
* mismo input;
* resultados separados;
* error aislado;
* persistencia individual.

## 33.7 Pack

* varias estrategias;
* weighted consensus;
* quórum;
* consenso;
* conflicto;
* contribuciones;
* resultados individuales conservados.

## 33.8 Reload

```text
ejecución completada
→ reload
→ Laboratory restore
→ Lab_Con muestra resultados
```

## 33.9 Idempotencia

* evento duplicado;
* input duplicado;
* re-render;
* no crear ejecuciones accidentales.

## 33.10 Navegación

Mantener verde:

```text
tests/regression/lab-con-navigation.test.js
```

---

# 34. Prueba runtime integral

Ejecutar en navegador:

```text
1. Abrir Ajustes_vito.
2. Confirmar Laboratory OFF.
3. Abrir Tomador.
4. Ingresar un giro.
5. Confirmar que no se crea análisis.
6. Volver a Ajustes_vito.
7. Activar Laboratory ON.
8. Seleccionar modo individual.
9. Seleccionar una estrategia.
10. Ingresar los giros mínimos requeridos.
11. Abrir Lab_Con.
12. Verificar resultado individual.
13. Cambiar a modo parallel.
14. Seleccionar varias estrategias.
15. Ingresar nuevo giro.
16. Verificar resultados separados.
17. Cambiar a modo pack.
18. Configurar pesos y quórum.
19. Ingresar nuevo giro.
20. Verificar resultados individuales.
21. Verificar resultado colectivo.
22. Verificar consenso o conflicto.
23. Recargar navegador.
24. Verificar recuperación.
25. Cambiar Laboratory OFF.
26. Confirmar que no se crean nuevas ejecuciones.
27. Confirmar que los resultados históricos siguen visibles.
```

Capturar consola y errores.

---

# 35. Evidencia runtime

Cuando sea posible, guardar en:

```text
reports/evidence/laboratory-d4-5/
```

Como mínimo:

```text
01-settings-off.png
02-tomador-off-input.png
03-no-run-when-off.png
04-settings-on-individual.png
05-individual-result.png
06-parallel-results.png
07-pack-configuration.png
08-pack-result.png
09-reload-restored.png
10-off-historical-readonly.png
browser-console.log
network-failures.log
```

Si no existe navegador disponible, declarar pendiente la validación runtime.

---

# 36. Validaciones finales

Ejecutar scripts reales:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

Cuando existan:

```bash
npm run typecheck
npm run check:architecture
npm run test:e2e
npm run anti-legacy
```

No inventar scripts.

---

# 37. Auditoría arquitectónica

Confirmar que no existe:

* UI leyendo IndexedDB funcional directamente;
* Tomador llamando estrategias;
* estrategias escribiendo directamente en stores;
* segundo tracker;
* segunda fuente de giros;
* segundo Event Bus;
* segundo Binding Layer;
* duplicación de Timeline;
* lógica de coordinación dentro del renderer;
* resultado pack sin trazabilidad;
* proveedor externo acoplado;
* secretos.

---

# 38. Criterios de aceptación

La fase solo puede cerrarse si:

* [ ] Tomador es la fuente oficial.
* [ ] Los giros conservan IDs y orden.
* [ ] Ajustes_vito controla ON/OFF.
* [ ] El setting persiste.
* [ ] Default seguro definido.
* [ ] OFF bloquea nuevas ejecuciones.
* [ ] OFF mantiene historial visible.
* [ ] ON activa el pipeline.
* [ ] Existe modo individual.
* [ ] Existe modo parallel.
* [ ] Existe modo pack.
* [ ] Las estrategias conservan resultados separados.
* [ ] Pack genera resultado colectivo.
* [ ] Se registra conflicto.
* [ ] Se registra acuerdo.
* [ ] Se registran contribuciones.
* [ ] Existe base propia del Laboratory.
* [ ] Se documentó el esquema.
* [ ] Las ejecuciones se recuperan después de reload.
* [ ] Lab_Con consume ViewModels.
* [ ] No se duplicó la fuente de giros.
* [ ] La navegación sigue funcionando.
* [ ] Existe prueba runtime integral.
* [ ] Tests pasan.
* [ ] Lint pasa.
* [ ] Build pasa.
* [ ] Arquitectura pasa.
* [ ] Documentación generada.

---

# 39. Punto de control

Solo si todo es satisfactorio crear:

```text
reports/Fase_D4_5_cerrada.md
```

Debe terminar con:

```text
Estado de la Fase D.4.5:
✅ CERRADA — TOMADOR, LABORATORY MODE, PERSISTENCIA Y MANADA OPERATIVOS
```

Si falta cualquier bloque crítico crear:

```text
reports/Fase_D4_5_pendiente.md
```

No declarar cierre parcial como cierre completo.

---

# 40. Resumen final obligatorio

Mostrar:

```text
FASE D.4.5 — RESULTADO

Tomador como input:
PASS / FAIL

Laboratory OFF:
PASS / FAIL

Laboratory ON:
PASS / FAIL

Setting persistido:
PASS / FAIL

Modo individual:
PASS / FAIL

Modo parallel:
PASS / FAIL

Modo pack:
PASS / FAIL

Consenso:
PASS / FAIL

Conflicto:
PASS / FAIL

Resultados individuales:
PASS / FAIL

Resultado colectivo:
PASS / FAIL

Base Laboratory:
PASS / FAIL

Persistencia:
PASS / FAIL

Reload:
PASS / FAIL

Lab_Con:
PASS / FAIL

Navegación:
PASS / FAIL

Runtime:
PASS / FAIL

Tests:
PASS / FAIL

Lint:
PASS / FAIL

Build:
PASS / FAIL

Arquitectura:
PASS / FAIL

Estado:
CERRADA / PENDIENTE

Log:
<ruta>

Inventario:
<ruta>

Esquema:
<ruta>

Pipeline:
<ruta>

Coordinación:
<ruta>

Checklist:
<ruta>

Reporte:
<ruta>

Punto de control:
<ruta>
```

---

# 41. Reglas de honestidad

No declarar:

* ON operativo solo porque el checkbox cambia;
* OFF operativo sin confirmar ausencia de ejecuciones;
* Tomador integrado solo porque ambos usan el tracker;
* persistencia operativa sin reload;
* estrategia operativa solo porque existe;
* manada operativa si solo concatena resultados;
* consenso operativo sin quórum y contribuciones;
* Lab_Con operativo porque renderiza fixtures;
* fase cerrada solo porque test/lint/build pasan.

La evidencia debe demostrar comportamiento real.

---

# 42. Inicio inmediato

Comienza ahora en este orden:

1. crear log;
2. capturar Git;
3. auditar flujo Tomador;
4. auditar SettingsManager y Ajustes_vito;
5. inventariar estrategias;
6. diseñar base Laboratory;
7. documentar contratos;
8. implementar ON/OFF;
9. implementar Input Adapter;
10. implementar ejecución individual;
11. implementar paralelo;
12. implementar manada;
13. implementar persistencia;
14. integrar Orchestrator y Binding;
15. actualizar Lab_Con;
16. ejecutar runtime integral;
17. ejecutar pruebas;
18. documentar;
19. cerrar solo con evidencia.
