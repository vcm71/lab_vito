# PROMPT CORRECTIVO OFICIAL — FASE D.4.2

# Recuperación funcional integral de Lab_Con

## Proyecto

**Roulette Tracker**

## Módulo afectado

**Lab_Con / Laboratory Console**

## Tipo de intervención

**Auditoría funcional real, diagnóstico módulo por módulo, reparación integral, pruebas de interacción y recertificación**

---

# 1. Antecedente crítico

La Fase D.4 fue declarada cerrada después de que pasaran:

* `npm test`;
* `npm run lint`;
* `npm run build`.

Sin embargo, la validación manual posterior confirmó que:

> **Lab_Con no está operativo.**

Por lo tanto, la certificación anterior no puede considerarse suficiente desde el punto de vista funcional.

El hecho de que compile y que las pruebas existentes pasen puede significar que:

* las pruebas no cubren la interacción real;
* los fixtures no representan el estado real;
* los botones se renderizan, pero no ejecutan comandos;
* los comandos existen, pero no actualizan la UI;
* los ViewModels son estáticos;
* la navegación cambia visualmente sin cargar datos;
* los listeners no están conectados;
* el Binding Layer no se refresca;
* existen errores silenciosos en runtime;
* las acciones dependen de datos de prueba;
* la inicialización real de `Lab_Con` no coincide con la usada en tests.

Esta fase debe comprobar el comportamiento real y corregirlo.

---

# 2. Objetivo principal

Revisar y reparar la funcionalidad completa de **cada módulo o pestaña visible dentro de Lab_Con**, verificando el flujo real:

```text
Interacción del usuario
        │
        ▼
Control o botón de la interfaz
        │
        ▼
Event listener / action dispatcher
        │
        ▼
LaboratoryBindingLayer command
        │
        ▼
LaboratoryOrchestrator
        │
        ▼
Application / servicios correspondientes
        │
        ▼
Actualización del estado
        │
        ▼
Nuevo ViewModel
        │
        ▼
Render actualizado
        │
        ▼
Resultado visible y verificable
```

No basta con comprobar que el HTML existe.

Cada acción debe producir un resultado observable y coherente.

---

# 3. Estado de las certificaciones anteriores

Leer antes de modificar:

```text
reports/FaseD.4.md
reports/FaseD.4.0.md
reports/FaseD.4.1.md
reports/FASE_D4_AI_RESEARCH_IMPLEMENTATION_REPORT.md
reports/Fase_D4_cerrada.md
reports/logs/FaseD.4.0.log
reports/logs/Fase_D4_certification.log
```

Usar las rutas reales disponibles en el repositorio.

Si alguno de esos archivos no existe, registrarlo.

La declaración anterior:

```text
Estado de la Fase D.4: CERRADA
```

debe considerarse provisional e invalidada hasta completar esta auditoría funcional.

No borrar los documentos históricos.

Generar una fe de erratas o indicar claramente en el nuevo punto de control que la certificación previa fue reabierta debido a una falla funcional detectada manualmente.

---

# 4. Rol del agente

Actúa como:

* arquitecto principal;
* ingeniero senior de frontend;
* ingeniero senior de Application;
* especialista en depuración de interfaces;
* especialista en pruebas de integración;
* auditor de flujos de interacción;
* responsable de calidad funcional;
* responsable de recertificación.

No asumas que una función opera porque existe en el código.

No asumas que un botón funciona porque aparece en el DOM.

No asumas que un test representa el runtime real.

Debes demostrar cada flujo.

---

# 5. Regla fundamental

La unidad de auditoría no es el archivo.

La unidad de auditoría es la **funcionalidad visible para el usuario**.

Para cada pestaña de Lab_Con debes comprobar:

1. que puede abrirse;
2. que obtiene el ViewModel correcto;
3. que muestra datos reales o estados vacíos válidos;
4. que sus controles responden;
5. que sus acciones llaman al comando correcto;
6. que el comando llega al Binding Layer;
7. que el Orchestrator ejecuta la operación;
8. que el estado se actualiza;
9. que el renderer vuelve a pintar;
10. que el usuario ve el resultado;
11. que los errores son visibles y controlados;
12. que no aparecen excepciones en consola.

---

# 6. Primera acción obligatoria: capturar estado

Antes de modificar:

```bash
pwd
git status --short
git branch --show-current
git log -n 8 --oneline
git diff --stat
git diff
```

Registrar en el log:

* rama;
* commit actual;
* archivos modificados;
* archivos sin seguimiento;
* cambios previos del usuario;
* estado del repositorio;
* diferencias relacionadas con Laboratory y Lab_Con.

No descartar cambios del usuario.

Está prohibido ejecutar:

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
```

---

# 7. Crear el log al inicio

Crear inmediatamente:

```text
reports/logs/Fase_D4_2_Lab_Con_functional_recovery_YYYYMMDD_HHMMSS.log
```

No dejar la creación del log para el final.

Añadir progresivamente:

* estado inicial;
* módulos encontrados;
* acciones encontradas;
* errores reproducidos;
* causas raíz;
* archivos modificados;
* pruebas ejecutadas;
* resultados;
* estado final.

El log debe existir incluso si la reparación no se completa.

---

# 8. Descubrir la interfaz real

No asumir que los nombres oficiales coinciden exactamente con los nombres visibles.

Inspeccionar:

* HTML principal;
* registro de pestañas;
* navegación;
* toolbar;
* controladores;
* renderers;
* Bootstrap;
* Kernel;
* Binding Layer;
* Orchestrator;
* CSS relacionado;
* tests;
* fixtures.

Buscar referencias a:

```text
Lab_Con
lab-con
laboratory
Laboratory
workspace
tab
panel
toolbar
renderer
viewModel
activeWorkspace
activeTab
```

Generar un inventario real de todas las pestañas o módulos visibles.

Como referencia inicial, probablemente existan:

* Overview;
* Experiments;
* Sessions;
* Comparison;
* Evidence Explorer;
* Replay;
* AI Research.

Pero debes usar los nombres y módulos encontrados realmente en el código.

También identificar:

* pestañas adicionales;
* subpaneles;
* modales;
* toolbars contextuales;
* selectores;
* filtros;
* formularios;
* botones secundarios;
* acciones de teclado.

---

# 9. Crear matriz funcional antes de reparar

Generar un documento temporal o sección del log con una matriz como esta:

| Módulo      | Abre | Renderiza | Datos | Botones | Binding | Orchestrator | Actualiza UI | Error runtime | Estado |
| ----------- | ---: | --------: | ----: | ------: | ------: | -----------: | -----------: | ------------: | ------ |
| Overview    |      |           |       |         |         |              |              |               |        |
| Experiments |      |           |       |         |         |              |              |               |        |
| Sessions    |      |           |       |         |         |              |              |               |        |
| Comparison  |      |           |       |         |         |              |              |               |        |
| Evidence    |      |           |       |         |         |              |              |               |        |
| Replay      |      |           |       |         |         |              |              |               |        |
| AI Research |      |           |       |         |         |              |              |               |        |

Para cada celda usar:

```text
PASS
FAIL
PARTIAL
NOT APPLICABLE
NOT TESTED
```

No marcar PASS sin evidencia.

---

# 10. Ejecutar la aplicación real

Detectar los scripts reales de `package.json`.

Iniciar la aplicación usando el comando correcto, por ejemplo:

```bash
npm run dev
```

o el equivalente real.

No inventar comandos.

Capturar:

* salida de consola;
* errores de inicialización;
* errores del navegador;
* peticiones fallidas;
* módulos que no montan;
* listeners no registrados;
* promesas rechazadas;
* errores al cambiar de pestaña.

Si el entorno permite pruebas con navegador automatizado, usar la herramienta ya disponible en el proyecto.

Buscar configuraciones o dependencias de:

* Playwright;
* Puppeteer;
* Cypress;
* jsdom;
* Testing Library;
* Vitest Browser;
* Webdriver.

No añadir una dependencia nueva antes de comprobar si ya existe una solución.

---

# 11. Auditar la inicialización real de Lab_Con

Seguir el flujo desde el arranque:

```text
main
  → Bootstrap
  → OrionKernel
  → LaboratoryOrchestrator
  → LaboratoryBindingLayer
  → controlador de la vista
  → renderer
  → pestaña activa
```

Confirmar:

* que `Lab_Con` se inicializa;
* que recibe una instancia válida del Binding Layer;
* que el Orchestrator existe;
* que el renderer recibe el ViewModel;
* que hay una pestaña activa válida;
* que el estado inicial no es `undefined`;
* que el primer render ocurre;
* que los listeners se registran una sola vez;
* que no se registran listeners duplicados en cada render;
* que el mecanismo de refresco está conectado;
* que las acciones provocan un nuevo render.

Investigar especialmente diferencias entre:

* inicialización usada en tests;
* inicialización usada por la aplicación real.

---

# 12. Auditoría obligatoria de cada pestaña

## 12.1 Overview

Comprobar:

* apertura;
* resumen general;
* métricas;
* conteos;
* estado vacío;
* actualización cuando cambian experimentos o sesiones;
* navegación desde tarjetas o accesos rápidos;
* botones o acciones disponibles;
* errores de datos ausentes.

El Overview no debe depender únicamente de fixtures.

---

## 12.2 Experiments

Comprobar:

* listado;
* selección;
* detalle;
* creación, si existe;
* actualización, si existe;
* eliminación, si existe;
* filtros;
* búsqueda;
* estado vacío;
* cambio de experimento activo;
* sincronización con Sessions, Comparison, Evidence, Replay y AI Research.

Seguir cada botón hasta su comando real.

---

## 12.3 Sessions

Comprobar:

* listado por experimento;
* sesión activa;
* detalle;
* selección;
* filtros;
* estado vacío;
* actualización al cambiar experimento;
* navegación a evidencias o replay;
* coherencia de identificadores.

Verificar que no muestra sesiones de otro experimento por estado obsoleto.

---

## 12.4 Comparison

Comprobar:

* selección múltiple;
* agregar elemento;
* remover elemento;
* limpiar selección;
* límites;
* métricas;
* resultados comparativos;
* estados insuficientes;
* comparación activa;
* sincronización con AI Research;
* persistencia del estado durante navegación, solo según el diseño existente.

Verificar que los botones modifican realmente el ViewModel.

---

## 12.5 Evidence Explorer

Comprobar:

* listado;
* selección;
* detalle;
* búsqueda;
* filtros;
* limpiar filtros;
* navegación;
* evidencia inexistente;
* sincronización con Timeline;
* sincronización con Replay;
* incorporación al contexto de AI Research.

Verificar que las búsquedas y filtros no sean puramente visuales.

---

## 12.6 Replay

Comprobar:

* carga de eventos;
* orden temporal;
* evento seleccionado;
* avanzar;
* retroceder;
* reproducir;
* pausar;
* ir al inicio;
* ir al final;
* seleccionar desde Timeline;
* mostrar detalle;
* sincronización con Evidence;
* sincronización con Comparison cuando corresponda;
* estado sin eventos;
* límites de navegación.

Verificar timers, intervalos y limpieza de recursos.

No deben quedar reproducciones duplicadas al cambiar de pestaña.

---

## 12.7 AI Research

Comprobar:

* campo de consulta;
* edición de consulta;
* scope;
* construcción de contexto;
* vista previa;
* Timeline incluido;
* Evidence incluida;
* Comparison incluida;
* Replay incluido;
* ejecución;
* loading;
* respuesta;
* error;
* reset;
* proveedor local;
* estado vacío;
* referencias navegables.

Confirmar que la respuesta no es un placeholder fijo.

Confirmar que el comando `executeResearch()` atraviesa realmente:

```text
UI
→ Binding Layer
→ Orchestrator
→ Provider local
→ Binding Layer
→ ViewModel
→ UI
```

---

# 13. Auditar todos los controles

Para cada módulo crear un inventario de controles:

```text
Control
Elemento DOM
Evento
Handler
Comando Binding
Método Orchestrator
Estado modificado
ViewModel resultante
Efecto visible
Resultado
```

Revisar:

* botones;
* inputs;
* selects;
* checkboxes;
* tabs;
* filtros;
* enlaces;
* acciones de toolbar;
* tarjetas clicables;
* atajos de teclado;
* controles de Replay.

Detectar controles que:

* no tengan listener;
* tengan listener con selector incorrecto;
* llamen métodos inexistentes;
* usen nombres antiguos;
* reciban parámetros incorrectos;
* fallen silenciosamente;
* modifiquen una copia de estado que no se renderiza;
* dependan de IDs incompatibles;
* se encuentren permanentemente deshabilitados;
* ejecuten dos veces la misma acción.

---

# 14. Revisar el mecanismo de eventos de la UI

Inspeccionar si la interfaz usa:

* event delegation;
* listeners directos;
* dataset attributes;
* custom events;
* Event Bus;
* callbacks;
* suscripciones.

Comprobar:

* selectores correctos;
* `data-action` coherentes;
* IDs únicos;
* propagación;
* `preventDefault`;
* contexto de `this`;
* parámetros;
* manejo async;
* errores capturados;
* re-render posterior.

Prestar especial atención a incompatibilidades como:

```text
aiResearch
ai-research
ai_research
research
```

y equivalentes en el resto de pestañas.

---

# 15. Revisar estado y reactividad

Determinar cómo se actualiza la UI.

Comprobar:

* quién conserva el estado;
* quién genera el ViewModel;
* cómo se notifica un cambio;
* quién vuelve a llamar al renderer;
* si el render ocurre después de acciones async;
* si hay estados obsoletos;
* si hay snapshots capturados demasiado pronto;
* si se muta estado sin notificación;
* si las promesas no se esperan;
* si se renderiza antes de terminar una acción;
* si errores bloquean posteriores renders.

Corregir el mecanismo, no solo el síntoma visual.

---

# 16. Revisar contratos Binding Layer–UI

Inventariar todos los comandos públicos usados por la UI.

Para cada comando validar:

* existe;
* está exportado;
* recibe los argumentos esperados;
* devuelve el tipo esperado;
* actualiza estado;
* maneja errores;
* es síncrono o asíncrono de forma coherente;
* la UI usa `await` cuando corresponde;
* produce un nuevo ViewModel.

Evitar incompatibilidades entre versiones antiguas y nuevas de nombres.

Cuando sea necesario conservar compatibilidad, usar adaptadores explícitos y documentados.

---

# 17. Revisar contratos Binding Layer–Orchestrator

Para cada comando funcional comprobar:

* método del Orchestrator;
* firma;
* argumentos;
* retorno;
* errores;
* efectos;
* actualización del snapshot.

No permitir que el Binding Layer invente respuestas para ocultar un Orchestrator no conectado, salvo el proveedor local explícito de AI Research.

---

# 18. Reproducir fallos antes de corregir

Antes de modificar cada defecto:

1. reproducirlo;
2. registrar pasos;
3. registrar resultado observado;
4. registrar resultado esperado;
5. identificar causa raíz;
6. crear o ajustar una prueba que falle por la causa real;
7. corregir;
8. volver a ejecutar la prueba;
9. volver a probar el flujo completo.

No hacer cambios especulativos masivos.

---

# 19. Prioridad de corrección

Aplicar este orden:

## Prioridad 0 — Bloqueos generales

* Lab_Con no abre;
* error de JavaScript al inicializar;
* Binding Layer inexistente;
* renderer roto;
* navegación de pestañas rota;
* listeners globales no conectados.

## Prioridad 1 — Módulos completamente inoperativos

* pestañas que no abren;
* botones sin efecto;
* errores runtime;
* ViewModels ausentes.

## Prioridad 2 — Flujos parciales

* selección que no refresca;
* filtros que no aplican;
* acciones async no esperadas;
* datos obsoletos;
* sincronización incompleta.

## Prioridad 3 — Estados de borde

* vacío;
* error;
* loading;
* IDs inexistentes;
* datos incompletos.

## Prioridad 4 — UX secundaria

* mensajes;
* foco;
* etiquetas;
* consistencia visual.

No comenzar por cambios cosméticos.

---

# 20. Pruebas obligatorias de interacción

Las pruebas deben demostrar comportamiento, no solo cadenas HTML.

Para cada módulo agregar o reparar pruebas que:

1. creen el runtime o fixture más cercano al real;
2. rendericen el módulo;
3. simulen la acción del usuario;
4. verifiquen el comando llamado;
5. verifiquen el cambio de estado;
6. vuelvan a renderizar;
7. verifiquen el resultado visible.

Evitar fixtures que ya contengan mágicamente el estado final.

---

# 21. Pruebas mínimas por módulo

## Navegación general

* abrir cada pestaña;
* pestaña activa correcta;
* ViewModel correcto;
* módulo desconocido;
* cambio repetido entre pestañas;
* ausencia de listeners duplicados.

## Overview

* render inicial;
* métricas;
* navegación desde acción;
* estado vacío.

## Experiments

* seleccionar;
* cambiar experimento;
* actualización visible;
* estado vacío.

## Sessions

* filtrar por experimento;
* seleccionar sesión;
* actualización visible;
* sin sesiones.

## Comparison

* agregar;
* remover;
* limpiar;
* resultado actualizado;
* selección insuficiente.

## Evidence

* buscar;
* filtrar;
* seleccionar;
* limpiar filtros;
* abrir detalle.

## Replay

* seleccionar evento;
* siguiente;
* anterior;
* reproducir;
* pausar;
* límites;
* estado vacío.

## AI Research

* escribir consulta;
* construir contexto;
* ejecutar;
* esperar resultado async;
* mostrar respuesta;
* mostrar error;
* resetear.

---

# 22. Prueba de integración completa

Crear al menos una prueba que recorra una historia funcional real:

```text
1. Abrir Experiments.
2. Seleccionar un experimento.
3. Abrir Sessions.
4. Seleccionar una sesión.
5. Abrir Evidence.
6. Seleccionar una evidencia.
7. Abrir Replay.
8. Seleccionar un evento.
9. Abrir Comparison.
10. Añadir elementos.
11. Abrir AI Research.
12. Construir contexto.
13. Verificar que contiene las selecciones anteriores.
14. Ejecutar investigación.
15. Verificar resultado.
16. Navegar desde una referencia al módulo relacionado.
```

Adaptar la secuencia a las capacidades reales.

Esta prueba debe usar los contratos públicos y aproximarse al runtime real.

---

# 23. Pruebas en navegador

Si el proyecto dispone de Playwright, Cypress o herramienta equivalente, crear una prueba smoke real:

```text
Lab_Con abre
→ cada pestaña puede seleccionarse
→ no hay errores no controlados
→ los controles principales responden
→ AI Research completa un flujo local
```

Capturar consola del navegador.

La prueba debe fallar ante:

* `console.error` inesperado;
* excepción no capturada;
* promesa rechazada;
* selector inexistente;
* módulo que no renderiza.

Si no existe infraestructura de navegador, documentarlo y fortalecer las pruebas de integración DOM existentes.

---

# 24. Instrumentación temporal

Puede añadirse logging temporal durante el diagnóstico, pero debe eliminarse o convertirlo al sistema oficial antes del cierre.

No dejar:

```js
console.log(...)
debugger
alert(...)
```

salvo que el proyecto use `console` como estrategia oficial y esté justificado.

Los errores funcionales deben pasar por la infraestructura de logging existente.

---

# 25. Restricciones arquitectónicas

Mantener:

```text
Domain
      │
Application
      │
LaboratoryOrchestrator
      │
LaboratoryBindingLayer
      │
ViewModels
      │
Lab_Con UI
```

Prohibido:

* UI → Domain;
* UI → Repository;
* UI → motores;
* UI → casos de uso;
* UI → proveedor AI;
* segundo Binding Layer;
* segundo Timeline;
* segundo Event Bus;
* estado duplicado sin sincronización;
* cambios en motores estadísticos;
* refactorización global no relacionada.

La corrección funcional no autoriza romper la arquitectura.

---

# 26. No confiar ciegamente en pruebas anteriores

Los tests anteriores pasaron mientras Lab_Con seguía inoperativo.

Por lo tanto:

* auditar calidad de los tests;
* identificar falsos positivos;
* detectar mocks excesivos;
* detectar fixtures irreales;
* detectar assertions superficiales;
* reemplazar verificaciones de texto por verificaciones de comportamiento cuando sea necesario.

Ejemplo insuficiente:

```js
expect(html).toContain('AI Research');
```

Ejemplo necesario:

```text
simular click
→ verificar comando
→ esperar resultado
→ regenerar ViewModel
→ verificar respuesta visible
```

Adaptar al framework real.

---

# 27. Validaciones progresivas

Después de cada reparación:

1. chequeo sintáctico;
2. prueba focalizada;
3. prueba del módulo;
4. prueba de integración de Laboratory.

Al final ejecutar todos los scripts reales disponibles:

```bash
npm test
npm run lint
npm run build
```

Cuando existan:

```bash
npm run typecheck
npm run check
npm run check:architecture
npm run anti-legacy
npm run test:e2e
```

No inventar scripts.

Registrar comando y código de salida.

---

# 28. Verificación manual guiada

Generar un checklist reproducible para validación manual.

Debe indicar para cada pestaña:

* cómo abrirla;
* qué datos deberían aparecer;
* qué control usar;
* qué resultado esperar;
* cómo reconocer un error;
* qué estado vacío debe aparecer.

Guardar en:

```text
reports/LAB_CON_MANUAL_VALIDATION_CHECKLIST.md
```

Este documento debe permitir que el usuario valide Lab_Con sin leer el código.

---

# 29. Reporte de defectos

Crear:

```text
reports/LAB_CON_FUNCTIONAL_DEFECTS.md
```

Para cada defecto incluir:

```text
ID
Módulo
Severidad
Pasos para reproducir
Resultado observado
Resultado esperado
Causa raíz
Archivos implicados
Corrección
Prueba añadida
Estado
```

No incluir defectos imaginarios.

---

# 30. Reporte de implementación

Crear:

```text
reports/FASE_D4_2_LAB_CON_FUNCTIONAL_RECOVERY_REPORT.md
```

Debe contener:

1. resumen ejecutivo;
2. motivo de reapertura;
3. estado inicial;
4. inventario de módulos;
5. matriz inicial;
6. defectos encontrados;
7. causas raíz;
8. reparaciones;
9. arquitectura preservada;
10. contratos corregidos;
11. pruebas añadidas;
12. test de integración;
13. prueba de navegador, si aplica;
14. validación manual;
15. resultados de test;
16. lint;
17. build;
18. auditoría arquitectónica;
19. estado Git;
20. limitaciones;
21. matriz final;
22. conclusión real.

---

# 31. Nuevo punto de control

Solo si cada módulo crítico es operativo y las validaciones pasan, crear:

```text
reports/Fase_D4_2_Lab_Con_cerrada.md
```

Debe indicar explícitamente:

* que D.4 fue reabierta;
* que la certificación anterior era técnicamente correcta respecto de sus tests, pero funcionalmente insuficiente;
* qué defectos se corrigieron;
* qué módulos fueron comprobados;
* qué pruebas de comportamiento se incorporaron;
* qué flujo completo fue validado;
* que Lab_Con está operativo.

Debe terminar con:

```text
Estado de la Fase D.4.2:
✅ CERRADA — LAB_CON OPERATIVO
```

Si algún módulo crítico no funciona, crear:

```text
reports/Fase_D4_2_Lab_Con_pendiente.md
```

No usar la palabra “cerrada” en ese caso.

---

# 32. Criterios estrictos de cierre

La fase solo puede cerrarse cuando:

* [ ] Lab_Con abre sin errores.
* [ ] Todas las pestañas reales pueden abrirse.
* [ ] Cada pestaña recibe el ViewModel correcto.
* [ ] Todos los controles principales tienen efecto.
* [ ] Las acciones actualizan el estado real.
* [ ] La UI vuelve a renderizar después de las acciones.
* [ ] No existen errores no controlados en consola.
* [ ] Overview funciona.
* [ ] Experiments funciona.
* [ ] Sessions funciona.
* [ ] Comparison funciona.
* [ ] Evidence Explorer funciona.
* [ ] Replay funciona.
* [ ] AI Research funciona.
* [ ] Timeline se reutiliza.
* [ ] Las selecciones se sincronizan.
* [ ] Existe prueba de integración completa.
* [ ] Existen pruebas conductuales por módulo.
* [ ] Tests completos pasan.
* [ ] Lint pasa.
* [ ] Build pasa.
* [ ] Auditoría arquitectónica pasa.
* [ ] Checklist manual generado.
* [ ] Reporte de defectos generado.
* [ ] Log generado.
* [ ] Validación manual realizada cuando el entorno lo permita.

No marcar PASS solo porque un método existe.

---

# 33. Manejo de limitaciones del entorno

Si no puedes abrir un navegador gráfico:

* usa pruebas DOM o navegador headless;
* ejecuta el servidor;
* captura errores de inicialización;
* crea pruebas conductuales;
* genera el checklist manual;
* declara claramente qué parte requiere confirmación visual humana.

No declares operatividad visual completa sin evidencia.

Si el límite de herramientas se aproxima:

1. guardar cambios coherentes;
2. ejecutar pruebas focalizadas;
3. actualizar el log;
4. generar un reporte parcial;
5. declarar estado pendiente.

No dejar archivos con sintaxis rota.

---

# 34. Estado Git final

Al terminar ejecutar:

```bash
git status --short
git diff --stat
git diff --check
```

Registrar:

* archivos creados;
* archivos modificados;
* archivos ajenos a la fase;
* warnings de whitespace;
* estado de las pruebas.

No crear commit ni tag automáticamente.

---

# 35. Commit recomendado

Solo si la fase queda cerrada:

```text
fix(laboratory): restore Lab_Con module functionality
```

Tag sugerido:

```text
roulette-tracker-phase-d4-2-lab-con-operational
```

No recomendar tag si algún módulo queda pendiente.

---

# 36. Resumen final obligatorio

Mostrar en consola:

```text
FASE D.4.2 — RECUPERACIÓN FUNCIONAL LAB_CON

Lab_Con inicia: PASS / FAIL
Navegación de pestañas: PASS / FAIL

Overview: PASS / FAIL
Experiments: PASS / FAIL
Sessions: PASS / FAIL
Comparison: PASS / FAIL
Evidence Explorer: PASS / FAIL
Replay: PASS / FAIL
AI Research: PASS / FAIL

Interacción UI → Binding: PASS / FAIL
Binding → Orchestrator: PASS / FAIL
Actualización de ViewModel: PASS / FAIL
Re-render después de acciones: PASS / FAIL
Errores de consola: PASS / FAIL
Prueba de integración completa: PASS / FAIL
Prueba de navegador: PASS / FAIL / NOT AVAILABLE

Tests: PASS / FAIL
Lint: PASS / FAIL
Build: PASS / FAIL
Arquitectura: PASS / FAIL

Estado:
CERRADA — LAB_CON OPERATIVO
o
PENDIENTE

Log:
<ruta>

Reporte de defectos:
<ruta>

Reporte de recuperación:
<ruta>

Checklist manual:
<ruta>

Punto de control:
<ruta>
```

---

# 37. Condición de honestidad

No afirmar:

* “Lab_Con está operativo” porque el build pasa;
* “los módulos funcionan” porque se renderizan títulos;
* “los botones funcionan” porque tienen atributos HTML;
* “AI Research funciona” porque aparece una respuesta en un fixture;
* “no hay errores” sin revisar runtime o pruebas conductuales;
* “la fase está cerrada” si falta comprobar un módulo crítico.

El objetivo es recuperar la operación real de Lab_Con, no volver a producir una certificación documental basada en verificaciones insuficientes.

---

# 38. Inicio inmediato

Comienza ahora en este orden:

1. crear el log;
2. capturar estado Git;
3. leer los documentos de D.4;
4. localizar la entrada real de Lab_Con;
5. ejecutar la aplicación;
6. reproducir la falla;
7. inventariar todas las pestañas;
8. construir la matriz funcional inicial;
9. identificar el primer bloqueo global;
10. corregir de forma incremental;
11. crear pruebas conductuales;
12. validar cada módulo;
13. ejecutar integración completa;
14. ejecutar suite, lint y build;
15. generar los reportes;
16. cerrar únicamente con evidencia real.
