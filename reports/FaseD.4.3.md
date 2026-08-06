# PROMPT DE EJECUCIÓN ESTRICTA — FASE D.4.3

# Diagnóstico y reparación funcional real de Lab_Con

## Proyecto

**Roulette Tracker**

## Componente afectado

**Lab_Con / Laboratory Console**

## Clasificación

**Incidente funcional crítico posterior a una certificación incorrecta**

---

# 1. Situación actual

El usuario verificó manualmente que:

> **Lab_Con no está operativo.**

Dos auditorías anteriores declararon la funcionalidad como correcta basándose principalmente en:

* `npm test`;
* `npm run lint`;
* `npm run build`;
* revisión estática de Binding Layer;
* revisión estática del Orchestrator;
* revisión de tests existentes.

Ese procedimiento fue insuficiente.

La última ejecución:

* no reprodujo el fallo reportado;
* no inició una validación funcional real en navegador;
* no interactuó módulo por módulo;
* no documentó clicks, entradas, cambios de estado ni resultados visibles;
* no modificó código;
* volvió a concluir que Lab_Con era operativo.

Esa conclusión queda rechazada.

La Fase D.4 y las certificaciones D.4.1/D.4.2 deben considerarse **funcionalmente reabiertas**.

---

# 2. Objetivo único

Abrir la aplicación real, reproducir el problema de Lab_Con, probar cada pestaña mediante interacción de usuario, identificar las causas raíz, reparar el código y demostrar que los módulos quedan operativos.

No debes realizar una nueva auditoría documental como sustituto de esta tarea.

---

# 3. Regla de bloqueo absoluto

## Está prohibido declarar Lab_Con operativo únicamente porque:

* compila;
* pasa lint;
* pasan los tests existentes;
* el HTML contiene los nombres de las pestañas;
* existen ViewModels;
* existen comandos;
* existe `executeResearch()`;
* la arquitectura parece correcta;
* un fixture presenta datos;
* el renderer retorna una cadena HTML.

## Lab_Con solo puede declararse operativo si existe evidencia de:

1. aplicación iniciada;
2. navegador real o headless abierto;
3. Lab_Con visible;
4. cada pestaña seleccionada mediante interacción;
5. cada control principal ejecutado;
6. cambio de estado comprobado;
7. resultado visible comprobado;
8. consola del navegador revisada;
9. defectos reproducidos y corregidos;
10. prueba funcional automatizada añadida.

Si no puedes abrir o automatizar un navegador, el estado obligatorio será:

```text
PENDIENTE — NO FUE POSIBLE CERTIFICAR LA INTERFAZ REAL
```

No puedes reemplazar esa validación con `npm test`.

---

# 4. Resultado mínimo obligatorio

Debes entregar una tabla final con evidencia para cada módulo real de Lab_Con:

| Módulo            | Abre | Datos reales | Acción ejecutada | Estado cambia | UI se actualiza | Consola limpia | Resultado |
| ----------------- | ---: | -----------: | ---------------- | ------------: | --------------: | -------------: | --------- |
| Overview          |      |              |                  |               |                 |                |           |
| Experiments       |      |              |                  |               |                 |                |           |
| Sessions          |      |              |                  |               |                 |                |           |
| Comparison        |      |              |                  |               |                 |                |           |
| Evidence Explorer |      |              |                  |               |                 |                |           |
| Replay            |      |              |                  |               |                 |                |           |
| AI Research       |      |              |                  |               |                 |                |           |

Solo se permite:

```text
PASS
FAIL
PARTIAL
NOT AVAILABLE
```

Cada PASS debe tener evidencia concreta.

---

# 5. Crear log antes de cualquier auditoría

Crear inmediatamente:

```text
reports/logs/Fase_D4_3_Lab_Con_runtime_recovery_YYYYMMDD_HHMMSS.log
```

Registrar desde el comienzo:

* fecha;
* rama;
* commit;
* estado Git;
* comando utilizado para iniciar la aplicación;
* URL local;
* navegador utilizado;
* herramientas de automatización disponibles;
* errores de arranque;
* errores de consola;
* resultado por pestaña;
* defectos;
* reparaciones;
* pruebas;
* conclusión.

El log debe escribirse progresivamente.

---

# 6. Captura inicial del repositorio

Ejecutar:

```bash
pwd
git status --short
git branch --show-current
git rev-parse HEAD
git log -n 8 --oneline
git diff --stat
git diff --check
```

No descartar modificaciones existentes.

Prohibido:

```bash
git reset --hard
git clean -fd
git restore .
git checkout .
```

---

# 7. Inspección de scripts y herramientas disponibles

Leer completamente:

```bash
cat package.json
```

Identificar:

* comando de desarrollo;
* comando de preview;
* runner de tests;
* entorno DOM;
* Playwright;
* Puppeteer;
* Cypress;
* Webdriver;
* Testing Library;
* Vitest Browser;
* scripts E2E;
* scripts smoke;
* scripts de arquitectura.

Ejecutar además:

```bash
find . -maxdepth 3 \( \
  -iname '*playwright*' -o \
  -iname '*cypress*' -o \
  -iname '*puppeteer*' -o \
  -iname '*e2e*' -o \
  -iname '*browser*' \
\) -print
```

No instalar dependencias antes de comprobar las existentes.

---

# 8. Iniciar la aplicación real

Usar el script real encontrado en `package.json`.

Ejemplo solo referencial:

```bash
npm run dev -- --host 127.0.0.1
```

Debes:

* mantener el servidor activo durante la prueba;
* guardar la salida del servidor;
* comprobar que responde mediante HTTP;
* registrar la URL exacta;
* comprobar que los recursos principales cargan;
* registrar respuestas 404 o 500.

Ejemplo de verificación:

```bash
curl -I http://127.0.0.1:<puerto>
```

Usar el puerto real.

No continuar con una certificación si la aplicación no inicia.

---

# 9. Abrir la aplicación en navegador

Utilizar, en este orden de preferencia:

1. infraestructura E2E ya existente;
2. Playwright ya instalado;
3. Puppeteer ya instalado;
4. Cypress ya instalado;
5. navegador Chromium/Chrome headless disponible;
6. herramienta DOM de integración existente.

Registrar exactamente qué opción fue utilizada.

La validación debe capturar:

* `console.error`;
* `pageerror`;
* promesas rechazadas;
* peticiones fallidas;
* errores de módulos;
* errores de listeners;
* stack traces relevantes.

Configurar la prueba para fallar ante errores inesperados de consola.

---

# 10. Reproducir primero el fallo reportado

Antes de revisar arquitectura o ejecutar toda la suite:

1. abrir la aplicación;
2. navegar a Lab_Con;
3. observar qué ocurre;
4. intentar abrir cada pestaña;
5. ejecutar los controles principales;
6. guardar evidencia del fallo.

Registrar:

```text
Pasos para reproducir
Resultado observado
Resultado esperado
Error de consola
Error de red
Elemento afectado
Módulo afectado
```

No se permite escribir:

```text
No se detectó el fallo
```

sin haber demostrado que Lab_Con fue abierto y utilizado.

Si el comportamiento depende de una secuencia específica, descubrirla mediante interacción real.

---

# 11. Localizar el acceso real a Lab_Con

Inspeccionar:

* menú principal;
* pestañas superiores;
* botones de navegación;
* rutas;
* hash;
* IDs;
* `data-action`;
* `data-tab`;
* `data-workspace`;
* Bootstrap;
* inicialización de renderers.

Buscar:

```bash
grep -RIn \
  -e 'Lab_Con' \
  -e 'lab-con' \
  -e 'Laboratory' \
  -e 'laboratory' \
  -e 'activeWorkspace' \
  -e 'activeTab' \
  -e 'data-workspace' \
  -e 'data-action' \
  . \
  --exclude-dir=node_modules \
  --exclude-dir=.git
```

Identificar la secuencia exacta que abre la interfaz.

---

# 12. Crear una prueba smoke inicial que falle

Antes de corregir el código, crear una prueba automatizada que reproduzca el problema real.

Nombre sugerido:

```text
tests/e2e/lab-con-runtime.smoke.test.js
```

o la ubicación compatible con el proyecto.

La prueba inicial debe:

1. abrir la aplicación;
2. navegar hasta Lab_Con;
3. verificar que el contenedor principal existe;
4. capturar errores de consola;
5. intentar abrir todas las pestañas;
6. fallar en el defecto observado.

No crear una prueba basada solo en importar el renderer.

Debe probar el runtime real o el nivel más próximo posible al runtime.

---

# 13. Inventario real de módulos

No asumir los nombres.

Extraer desde el DOM o registro de navegación:

* todas las pestañas visibles;
* identificador interno;
* texto visible;
* selector;
* comando asociado;
* workspace esperado.

Generar:

```text
reports/LAB_CON_RUNTIME_MODULE_INVENTORY.md
```

Formato:

| Texto visible | ID interno | Selector | Acción | Workspace | Renderer | ViewModel |
| ------------- | ---------- | -------- | ------ | --------- | -------- | --------- |

---

# 14. Auditoría funcional de navegación

Para cada pestaña:

1. hacer click real;
2. comprobar clase/atributo activo;
3. comprobar panel visible;
4. comprobar que el resto se oculta correctamente;
5. comprobar ViewModel;
6. comprobar ausencia de excepción;
7. volver a otra pestaña;
8. regresar;
9. comprobar que no se duplicaron listeners.

Detectar especialmente inconsistencias como:

```text
aiResearch
ai-research
ai_research
AI Research
research
```

Hacer lo mismo con todos los módulos.

---

# 15. Auditoría de Overview

Ejecutar al menos una interacción real.

Comprobar:

* panel visible;
* datos o estado vacío;
* métricas;
* accesos rápidos;
* actualización tras cambiar otra entidad;
* navegación desde tarjeta o botón, cuando exista.

Capturar:

* valor anterior;
* acción;
* valor posterior;
* evidencia visible.

---

# 16. Auditoría de Experiments

Ejecutar:

* abrir listado;
* seleccionar un experimento;
* verificar selección visible;
* comprobar actualización de detalle;
* cambiar a otro experimento, cuando exista;
* comprobar actualización de Sessions y contexto compartido.

Si existen acciones adicionales:

* crear;
* editar;
* eliminar;
* buscar;
* filtrar;

probarlas según su disponibilidad.

No inventar datos de producción. Utilizar el mecanismo de datos de desarrollo ya existente.

---

# 17. Auditoría de Sessions

Ejecutar:

* abrir Sessions;
* comprobar listado;
* seleccionar sesión;
* verificar detalle;
* cambiar experimento;
* confirmar que las sesiones se actualizan;
* comprobar estado vacío;
* comprobar navegación asociada.

Detectar snapshots obsoletos.

---

# 18. Auditoría de Comparison

Ejecutar mediante clicks:

* agregar primer elemento;
* agregar segundo elemento;
* comprobar comparación;
* remover un elemento;
* comprobar actualización;
* limpiar selección;
* comprobar estado insuficiente o vacío.

Verificar en cada paso:

```text
DOM antes
Comando ejecutado
Estado interno después
ViewModel después
DOM después
```

---

# 19. Auditoría de Evidence Explorer

Ejecutar:

* abrir módulo;
* introducir búsqueda;
* confirmar filtrado visible;
* aplicar filtro;
* seleccionar evidencia;
* abrir detalle;
* limpiar búsqueda/filtros;
* confirmar restauración;
* navegar a evento o Replay, si existe acción.

No basta con comprobar que el input acepta texto.

Debe cambiar la lista visible.

---

# 20. Auditoría de Replay

Ejecutar:

* seleccionar evento;
* siguiente;
* anterior;
* inicio;
* final;
* play;
* esperar avance;
* pause;
* confirmar que se detiene;
* cambiar pestaña durante reproducción;
* confirmar limpieza del timer;
* volver a Replay;
* comprobar estado coherente.

Registrar cualquier:

* intervalo duplicado;
* índice fuera de rango;
* botón sin respuesta;
* estado visual desincronizado.

---

# 21. Auditoría de AI Research

Ejecutar en navegador:

1. abrir AI Research;
2. localizar el input de consulta;
3. escribir una consulta real de prueba;
4. seleccionar scope;
5. construir contexto;
6. comprobar preview;
7. verificar cantidades;
8. ejecutar investigación;
9. comprobar estado loading;
10. esperar la respuesta;
11. comprobar respuesta visible;
12. comprobar identificación del proveedor local;
13. comprobar referencias;
14. ejecutar reset;
15. comprobar limpieza.

La prueba debe confirmar el flujo:

```text
DOM event
→ handler
→ LaboratoryBindingLayer
→ LaboratoryOrchestrator.executeResearch()
→ provider local
→ respuesta
→ actualización del ViewModel
→ re-render
→ respuesta visible
```

Instrumentar o espiar los límites públicos cuando sea necesario, sin sustituir el flujo real.

---

# 22. Trazabilidad de controles

Crear:

```text
reports/LAB_CON_CONTROL_TRACEABILITY.md
```

Para cada control principal:

| Módulo | Control | Selector | Evento | Handler | Binding command | Orchestrator | Estado | Efecto visible | PASS/FAIL |
| ------ | ------- | -------- | ------ | ------- | --------------- | ------------ | ------ | -------------- | --------- |

Todos los controles principales deben aparecer.

---

# 23. Identificar causas raíz

Clasificar cada defecto como:

* inicialización;
* selector incorrecto;
* `data-action` incompatible;
* listener ausente;
* listener duplicado;
* comando inexistente;
* firma incompatible;
* acción async sin `await`;
* ViewModel obsoleto;
* falta de re-render;
* snapshot incorrecto;
* ID de workspace incompatible;
* error de estado;
* datos no cargados;
* timer no limpiado;
* excepción silenciosa;
* fixture irreal;
* test falso positivo;
* otro.

No reparar síntomas sin documentar la causa raíz.

---

# 24. Aplicar reparaciones incrementales

Por cada defecto:

1. crear prueba roja;
2. aplicar corrección mínima;
3. ejecutar prueba;
4. ejecutar módulo afectado en navegador;
5. revisar consola;
6. actualizar log;
7. continuar con el siguiente defecto.

No modificar muchos módulos simultáneamente sin validación intermedia.

---

# 25. Revisar re-render y suscripciones

Comprobar de forma explícita:

* quién llama al renderer;
* cuándo se genera un nuevo ViewModel;
* si las acciones async son esperadas;
* si el Binding Layer publica cambios;
* si Event Bus se utiliza correctamente;
* si la UI conserva snapshots obsoletos;
* si se llama al render después de cada mutación;
* si una excepción impide renders posteriores.

La existencia de comandos sin re-render es un defecto funcional.

---

# 26. Probar datos reales del runtime

Comparar:

```text
Fixture de test
vs.
Objeto ViewModel producido por Bootstrap/Binding real
```

Documentar diferencias:

* claves;
* nombres;
* tipos;
* valores nulos;
* estructuras anidadas;
* identificadores de workspace;
* commands disponibles.

Actualizar tests para usar objetos cercanos al runtime real.

Evitar fixtures construidos manualmente que oculten incompatibilidades.

---

# 27. Prueba integral obligatoria

Crear una prueba automatizada con esta historia:

```text
Abrir aplicación
→ abrir Lab_Con
→ abrir Experiments
→ seleccionar experimento
→ abrir Sessions
→ seleccionar sesión
→ abrir Evidence Explorer
→ buscar y seleccionar evidencia
→ abrir Replay
→ seleccionar o avanzar evento
→ abrir Comparison
→ agregar elementos
→ abrir AI Research
→ construir contexto
→ verificar contexto heredado
→ ejecutar investigación
→ verificar respuesta visible
→ resetear
→ comprobar estado limpio
```

Adaptar solo los pasos que no existan realmente.

La prueba debe fallar ante errores inesperados de consola.

---

# 28. Evidencia visual

Cuando la herramienta de navegador lo permita, guardar capturas en:

```text
reports/evidence/lab-con/
```

Como mínimo:

```text
01-lab-con-open.png
02-overview.png
03-experiments-selected.png
04-sessions-selected.png
05-comparison-result.png
06-evidence-filtered.png
07-replay-running.png
08-ai-research-context.png
09-ai-research-result.png
10-final-state.png
```

Si no es posible guardar capturas, documentar el motivo.

No declarar evidencia visual si no existe.

---

# 29. Consola y red

Guardar:

```text
reports/evidence/lab-con/browser-console.log
reports/evidence/lab-con/network-failures.log
```

Los archivos deben registrar:

* errores;
* warnings relevantes;
* recursos fallidos;
* promesas rechazadas.

Los errores esperados deben justificarse.

No aceptar errores no controlados para declarar PASS.

---

# 30. Tests existentes

Solo después de reparar y validar en navegador, ejecutar:

```bash
npm test
npm run lint
npm run build
```

Y los scripts reales adicionales:

```bash
npm run test:e2e
npm run check:architecture
npm run typecheck
```

únicamente cuando existan.

Estos comandos son validaciones complementarias, no sustituyen el runtime.

---

# 31. Reporte de defectos obligatorio

Crear:

```text
reports/LAB_CON_RUNTIME_DEFECTS.md
```

Por cada defecto:

```text
ID:
Módulo:
Severidad:
Estado:
Pasos para reproducir:
Resultado observado:
Resultado esperado:
Error de consola:
Causa raíz:
Archivos:
Corrección:
Prueba roja:
Prueba verde:
Evidencia:
```

Si no encuentras defectos, pero el usuario afirma que Lab_Con no opera, no puedes cerrar sin reproducir y explicar la discrepancia.

---

# 32. Checklist manual obligatorio

Crear:

```text
reports/LAB_CON_MANUAL_ACCEPTANCE_TEST.md
```

Debe proporcionar al usuario instrucciones exactas:

* comando para iniciar;
* URL;
* forma de abrir Lab_Con;
* pasos por pestaña;
* acción;
* resultado esperado;
* criterio PASS/FAIL.

El checklist debe ser ejecutable por una persona sin conocimiento del código.

---

# 33. Reporte final

Crear:

```text
reports/FASE_D4_3_LAB_CON_RUNTIME_RECOVERY_REPORT.md
```

Contenido:

1. incidente;
2. razón de reapertura;
3. limitaciones de las certificaciones previas;
4. entorno ejecutado;
5. URL;
6. navegador;
7. módulos reales;
8. fallo reproducido;
9. matriz inicial;
10. defectos;
11. causas raíz;
12. reparaciones;
13. archivos;
14. trazabilidad de controles;
15. prueba integral;
16. evidencia visual;
17. consola;
18. red;
19. tests;
20. lint;
21. build;
22. arquitectura;
23. matriz final;
24. limitaciones;
25. conclusión honesta.

---

# 34. Condición de cierre

Solo crear:

```text
reports/Fase_D4_3_Lab_Con_runtime_cerrada.md
```

si se cumple todo:

* [ ] aplicación iniciada;
* [ ] navegador abierto;
* [ ] Lab_Con abierto;
* [ ] fallo original reproducido o discrepancia explicada;
* [ ] Overview probado por interacción;
* [ ] Experiments probado por interacción;
* [ ] Sessions probado por interacción;
* [ ] Comparison probado por interacción;
* [ ] Evidence probado por interacción;
* [ ] Replay probado por interacción;
* [ ] AI Research probado por interacción;
* [ ] cambios de estado demostrados;
* [ ] re-render demostrado;
* [ ] consola sin errores inesperados;
* [ ] red sin fallos críticos;
* [ ] prueba integral PASS;
* [ ] tests PASS;
* [ ] lint PASS;
* [ ] build PASS;
* [ ] defectos críticos corregidos;
* [ ] evidencia guardada;
* [ ] checklist manual generado.

Debe terminar con:

```text
Estado de la Fase D.4.3:
✅ CERRADA — LAB_CON VALIDADO EN RUNTIME
```

---

# 35. Estado pendiente obligatorio

Crear:

```text
reports/Fase_D4_3_Lab_Con_runtime_pendiente.md
```

si ocurre cualquiera de estas condiciones:

* no se pudo iniciar la aplicación;
* no se pudo abrir un navegador;
* no se pudo abrir Lab_Con;
* no se probaron todas las pestañas;
* quedó algún módulo crítico con FAIL;
* existe error inesperado de consola;
* falta prueba integral;
* falta evidencia runtime;
* solo pasaron tests/lint/build.

Debe indicar exactamente qué impide el cierre.

---

# 36. Prohibición específica de repetir el error anterior

No se acepta como conclusión:

```text
La fase puede considerarse operativa en el estado verificado por
las pruebas, lint y build.
```

Esa formulación está expresamente prohibida.

La operatividad debe estar verificada en runtime.

---

# 37. Resumen final obligatorio

Mostrar:

```text
FASE D.4.3 — LAB_CON RUNTIME RECOVERY

Servidor iniciado:
PASS / FAIL

URL validada:
PASS / FAIL

Navegador real/headless:
PASS / FAIL

Lab_Con abierto:
PASS / FAIL

Fallo reproducido:
PASS / FAIL / DISCREPANCIA DOCUMENTADA

Overview:
PASS / FAIL / NOT TESTED

Experiments:
PASS / FAIL / NOT TESTED

Sessions:
PASS / FAIL / NOT TESTED

Comparison:
PASS / FAIL / NOT TESTED

Evidence Explorer:
PASS / FAIL / NOT TESTED

Replay:
PASS / FAIL / NOT TESTED

AI Research:
PASS / FAIL / NOT TESTED

Clicks reales:
PASS / FAIL

Cambios de estado:
PASS / FAIL

Re-render:
PASS / FAIL

Consola:
PASS / FAIL

Red:
PASS / FAIL

Prueba integral:
PASS / FAIL

Tests:
PASS / FAIL

Lint:
PASS / FAIL

Build:
PASS / FAIL

Estado:
CERRADA — LAB_CON VALIDADO EN RUNTIME
o
PENDIENTE

Log:
<ruta>

Defectos:
<ruta>

Trazabilidad:
<ruta>

Evidencias:
<ruta>

Checklist manual:
<ruta>

Reporte:
<ruta>

Punto de control:
<ruta>
```

---

# 38. Inicio obligatorio

Ejecuta ahora, sin comenzar por `npm test`:

1. crear el log;
2. capturar Git;
3. leer `package.json`;
4. identificar herramienta de navegador;
5. iniciar la aplicación;
6. verificar URL;
7. abrir navegador;
8. abrir Lab_Con;
9. capturar consola;
10. reproducir el fallo;
11. crear prueba roja;
12. reparar;
13. probar pestaña por pestaña;
14. ejecutar flujo integral;
15. ejecutar tests, lint y build;
16. generar documentación;
17. cerrar únicamente con evidencia runtime.
