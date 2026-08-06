# PROMPT DE RECUPERACIÓN Y CIERRE — FASE D.4

## Proyecto

**Roulette Tracker**

## Fase

**D.4 — AI Research Workspace**

## Tipo de ejecución

**Recuperación de implementación incompleta, reparación, validación y cierre formal**

---

# 1. Contexto obligatorio

Una ejecución anterior comenzó la implementación de la Fase D.4, pero terminó antes de completar las modificaciones, las pruebas y el reporte final.

No debes reiniciar la fase desde cero ni eliminar automáticamente los cambios existentes.

Debes inspeccionar cuidadosamente el estado actual del repositorio, recuperar el trabajo válido, corregir lo incompleto y cerrar formalmente la fase.

El estado reportado por la ejecución anterior es el siguiente:

## Trabajo realizado parcialmente

Se inspeccionó:

```text
reports/FaseD.4.md
```

Se identificaron como puntos principales de integración:

```text
src/laboratory/application/LaboratoryBindingLayer.js
src/laboratory/LaboratoryOrchestrator.js
controlador_de_la_vista_lab.js
tests/laboratory/LaboratoryBindingLayer.test.js
tests/laboratory/LabRenderer.test.js
```

Se comenzaron cambios en:

### LaboratoryBindingLayer

* soporte para contexto de investigación;
* selección de scope;
* selección de elementos de investigación;
* construcción de solicitudes para AI Research;
* respuesta local de fallback.

### LaboratoryOrchestrator

* inicio de incorporación de `executeResearch`.

### UI

* render específico para `ai-research`;
* acciones de toolbar para:

  * construir contexto;
  * ejecutar investigación;
  * reiniciar el workspace.

### Pruebas

* nuevo caso para AI Research en:

```text
tests/laboratory/LaboratoryBindingLayer.test.js
```

* inicio de cobertura de render en:

```text
tests/laboratory/LabRenderer.test.js
```

## Problema confirmado

El archivo:

```text
tests/laboratory/LabRenderer.test.js
```

quedó con sintaxis inválida debido a una inserción parcial.

Error conocido:

```text
SyntaxError: Unexpected token ';'
```

La ejecución anterior no alcanzó a:

* reparar el archivo;
* completar la implementación;
* ejecutar la suite completa;
* ejecutar lint;
* ejecutar build;
* generar el reporte `.log`;
* certificar la fase.

---

# 2. Objetivo

Recuperar y completar la implementación actual de la Fase D.4 hasta dejarla:

* sintácticamente válida;
* arquitectónicamente compatible;
* funcional;
* probada;
* documentada;
* certificada mediante resultados reales;
* acompañada por un log final.

No declares la fase cerrada mientras exista algún fallo crítico.

---

# 3. Arquitectura que debe preservarse

Debes mantener estrictamente:

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
Laboratory UI
```

Reglas obligatorias:

1. La UI no puede acceder directamente a Domain.
2. `LaboratoryBindingLayer` continúa siendo el único punto de integración.
3. `LaboratoryOrchestrator` coordina el flujo de aplicación.
4. La UI consume exclusivamente ViewModels y comandos públicos.
5. Timeline Model continúa siendo la única fuente temporal.
6. No crear un segundo timeline.
7. No crear un Event Bus alternativo.
8. No modificar motores estadísticos.
9. No introducir credenciales.
10. No acoplar la UI a un proveedor concreto de IA.
11. No romper Overview, Experiments, Sessions, Comparison, Evidence Explorer o Replay.

---

# 4. Prohibiciones de recuperación

No utilices:

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
```

No descartes todos los cambios para comenzar nuevamente.

No sobrescribas archivos completos sin inspeccionar primero su contenido y su diff.

No elimines pruebas para conseguir una suite verde.

No ocultes errores.

No declares éxito basándote únicamente en inspección visual.

---

# 5. Paso 1 — Capturar el estado real

Antes de modificar, ejecutar:

```bash
pwd
git status --short
git branch --show-current
git log -n 5 --oneline
git diff --stat
git diff
```

Registrar:

* archivos modificados;
* archivos nuevos;
* cambios parciales;
* sintaxis incompleta;
* funciones duplicadas;
* bloques insertados en posiciones incorrectas;
* imports faltantes;
* comandos públicos incompletos;
* pruebas rotas;
* posibles cambios fuera del alcance.

Guardar el estado inicial dentro del log final.

---

# 6. Paso 2 — Leer la especificación original

Leer completamente:

```text
reports/FaseD.4.md
```

Extraer una lista verificable de:

* requisitos obligatorios;
* criterios de aceptación;
* restricciones;
* entregables;
* pruebas requeridas;
* comandos de validación.

No confiar únicamente en este prompt.

`reports/FaseD.4.md` sigue siendo la especificación principal de la fase.

---

# 7. Paso 3 — Reparar primero la sintaxis

La prioridad inicial es recuperar un repositorio analizable.

Inspeccionar cuidadosamente:

```text
tests/laboratory/LabRenderer.test.js
```

Localizar:

* bloque de prueba insertado parcialmente;
* llaves desbalanceadas;
* paréntesis incompletos;
* `describe`, `it` o `test` mal anidados;
* punto y coma fuera de contexto;
* inserción dentro de otro test;
* funciones helper cortadas;
* duplicación de cierres.

Reparar el archivo preservando:

* las pruebas anteriores;
* la estructura original;
* el nuevo caso de AI Research cuando sea válido.

Después de reparar, ejecutar un chequeo sintáctico limitado según el entorno real.

Ejemplos posibles:

```bash
node --check tests/laboratory/LabRenderer.test.js
```

o el comando equivalente compatible con el tipo de módulo del proyecto.

No continuar con una implementación extensa mientras existan errores sintácticos básicos.

---

# 8. Paso 4 — Auditar los cambios parciales

Inspeccionar detalladamente:

```text
src/laboratory/application/LaboratoryBindingLayer.js
src/laboratory/LaboratoryOrchestrator.js
controlador_de_la_vista_lab.js
tests/laboratory/LaboratoryBindingLayer.test.js
tests/laboratory/LabRenderer.test.js
```

Además, localizar cualquier otro archivo modificado relacionado con D.4.

Para cada cambio parcial determinar:

* si cumple la arquitectura;
* si está completo;
* si introduce estado duplicado;
* si usa nombres compatibles con el proyecto;
* si depende de datos inexistentes;
* si rompe contratos públicos;
* si mezcla UI y Application;
* si el fallback local está claramente identificado;
* si el flujo es testeable;
* si hay código muerto.

No conservar código solo porque ya fue insertado.

Conservar únicamente lo correcto y completar lo incompleto.

---

# 9. Paso 5 — Completar el flujo mínimo funcional

La implementación final debe proporcionar un flujo coherente:

```text
AI Research UI
      │
      ▼
LaboratoryBindingLayer
      │
      ▼
LaboratoryOrchestrator
      │
      ▼
Construcción de contexto
      │
      ▼
Proveedor desacoplado o fallback local explícito
      │
      ▼
Respuesta estructurada
      │
      ▼
Research ViewModel
      │
      ▼
AI Research UI
```

Como mínimo debe ser posible:

1. abrir el workspace AI Research;
2. ingresar o establecer una consulta;
3. construir contexto;
4. mostrar un resumen del contexto;
5. ejecutar la investigación;
6. obtener una respuesta local, determinista o simulada;
7. mostrar la respuesta;
8. mostrar estados de error;
9. reiniciar el workspace;
10. conservar compatibilidad con el resto de Laboratory.

---

# 10. Contexto de investigación

La construcción de contexto debe reutilizar las fuentes públicas existentes:

* Timeline Model;
* Evidence Explorer;
* Comparison;
* Replay;
* selección actual de experimento o sesión cuando corresponda.

No leer directamente repositorios o entidades desde UI.

El contexto debe ser:

* serializable;
* limitado;
* trazable;
* predecible;
* sin referencias circulares.

Debe informar al menos:

* scope activo;
* eventos incluidos;
* evidencias incluidas;
* comparación incluida o ausente;
* Replay incluido o ausente;
* metadatos básicos;
* truncamiento, si fue aplicado.

Si la implementación parcial ya incluye un constructor de contexto dentro del Binding Layer, evaluar si esa ubicación respeta la arquitectura real.

Cuando exista una separación razonable en Application, preferir una responsabilidad dedicada.

No realizar una refactorización excesiva si el proyecto actual utiliza un patrón más simple, pero preservar la separación de responsabilidades.

---

# 11. Scope y selección

El workspace debe soportar un alcance explícito y coherente.

Como mínimo revisar soporte para:

* experimento actual;
* sesión actual;
* evento seleccionado;
* selección temporal;
* selección personalizada o equivalente.

La selección de elementos debe:

* evitar duplicados;
* preservar identificadores;
* mantener orden cronológico;
* validar referencias inexistentes;
* no modificar el Timeline oficial.

---

# 12. Request de investigación

La solicitud debe incluir, según las convenciones del proyecto:

* identificador;
* consulta normalizada;
* contexto;
* scope;
* opciones;
* fecha;
* metadatos del proveedor;
* versión o formato cuando sea pertinente.

Validar:

* consulta vacía;
* consulta formada solo por espacios;
* consulta demasiado extensa;
* contexto no disponible;
* ejecución repetida mientras ya está procesando.

No permitir estados contradictorios.

---

# 13. Proveedor y fallback local

No integrar credenciales ni llamadas reales obligatorias.

El flujo debe funcionar sin proveedor externo.

El fallback local debe:

* estar claramente identificado como local, simulado o determinista;
* retornar una respuesta estructurada;
* no presentarse como análisis real de un modelo remoto;
* ser estable para las pruebas;
* manejar contexto vacío;
* manejar errores controlados.

No colocar lógica de proveedor directamente en el renderizador.

Si la implementación parcial insertó el fallback dentro de `LaboratoryBindingLayer`, evaluar si debe mantenerse temporalmente o moverse a una abstracción de Application.

Preferir una interfaz o adaptador desacoplado si el repositorio admite esa estructura sin cambios excesivos.

---

# 14. LaboratoryOrchestrator

Completar y revisar `executeResearch` o su equivalente.

Debe coordinar:

* validación;
* construcción o recepción del contexto;
* ejecución;
* transición de estado;
* respuesta;
* error;
* limpieza;
* cancelación únicamente si existe soporte real.

No debe:

* renderizar HTML;
* manipular directamente el DOM;
* contener credenciales;
* acceder desde UI sin pasar por Binding Layer;
* crear un timeline paralelo.

---

# 15. LaboratoryBindingLayer

Debe exponer un ViewModel estable para AI Research.

Revisar o implementar:

* estado actual;
* query;
* scope;
* selección;
* preview del contexto;
* estado del proveedor;
* respuesta;
* errores;
* permisos de ejecución;
* indicador de truncamiento.

Debe exponer comandos públicos equivalentes a:

* actualizar consulta;
* cambiar scope;
* seleccionar elementos;
* construir contexto;
* ejecutar investigación;
* limpiar o resetear;
* abrir referencias cuando la infraestructura existente lo permita.

Usar los nombres reales y patrones existentes.

No duplicar una segunda Binding Layer.

---

# 16. UI

Completar el render específico de `ai-research` en:

```text
controlador_de_la_vista_lab.js
```

o en los módulos reales que correspondan.

La UI mínima debe presentar:

* encabezado;
* estado del proveedor;
* consulta;
* scope;
* resumen del contexto;
* acciones;
* estado de ejecución;
* respuesta;
* errores;
* limitaciones;
* referencias cuando existan.

Las acciones de toolbar deben conectarse a comandos públicos.

No acceder directamente al Orchestrator desde eventos del DOM si la arquitectura actual exige Binding Layer.

Reutilizar estilos y helpers existentes.

No realizar un rediseño visual global.

---

# 17. Pruebas

## 17.1 Reparar pruebas existentes

No perder pruebas anteriores al corregir:

```text
tests/laboratory/LabRenderer.test.js
```

## 17.2 LaboratoryBindingLayer

Completar pruebas para:

* ViewModel inicial;
* cambio de query;
* selección de scope;
* construcción de contexto;
* request;
* ejecución exitosa;
* fallback local;
* error;
* reset;
* ausencia de acceso directo al dominio.

## 17.3 LaboratoryOrchestrator

Agregar pruebas si existe suite correspondiente.

Cubrir:

* ejecución válida;
* validación;
* transición de estados;
* error;
* respuesta;
* limpieza.

## 17.4 Render

Cubrir al menos:

* render inicial de AI Research;
* consulta;
* contexto;
* loading o estado de ejecución;
* respuesta;
* error;
* toolbar;
* reset.

## 17.5 Regresión

Ejecutar la suite completa.

No limitarse a las pruebas nuevas.

---

# 18. Validaciones progresivas

Después de reparar sintaxis, ejecutar primero pruebas focalizadas.

Detectar los comandos reales en `package.json`.

Ejemplos:

```bash
npm test -- tests/laboratory/LabRenderer.test.js
npm test -- tests/laboratory/LaboratoryBindingLayer.test.js
```

Usar únicamente opciones compatibles con el test runner real.

Después ejecutar:

```bash
npm test
npm run lint
npm run build
```

También ejecutar, cuando existan:

```bash
npm run typecheck
npm run check
npm run check:architecture
npm run anti-legacy
```

No inventar scripts.

Registrar exactamente:

* comando;
* código de salida;
* resultado;
* cantidad de tests;
* errores;
* warnings relevantes.

---

# 19. Manejo de fallos

Si una prueba falla:

1. analizar la causa;
2. determinar si es regresión o expectativa incorrecta;
3. corregir código o prueba justificadamente;
4. volver a ejecutar la prueba focalizada;
5. volver a ejecutar la suite completa.

No modificar expectativas solo para hacerlas coincidir con una implementación incorrecta.

Si lint o build fallan, no declarar la fase cerrada.

Si existe un fallo previo no causado por D.4:

* documentarlo con evidencia;
* comprobar su existencia respecto del estado inicial cuando sea posible;
* no ocultarlo;
* distinguirlo de las regresiones introducidas por D.4.

---

# 20. Auditoría arquitectónica final

Buscar imports o accesos prohibidos en los archivos del AI Research Workspace.

Comprobar que no exista:

* import UI → Domain;
* acceso UI → repositorio;
* acceso UI → motor;
* llamada HTTP directa desde UI;
* clave API;
* token;
* timeline duplicado;
* Event Bus duplicado;
* estado de Evidence duplicado;
* estado de Comparison duplicado;
* estado de Replay duplicado;
* proveedor concreto acoplado;
* lógica de render dentro del Orchestrator.

Registrar los comandos y resultados de la auditoría.

---

# 21. Log obligatorio

Crear el directorio de logs si no existe, respetando la estructura real del repositorio.

Nombre recomendado:

```text
reports/logs/Fase_D4_AI_Research_cierre_YYYYMMDD_HHMMSS.log
```

El `.log` debe contener:

1. fecha y hora;
2. proyecto;
3. rama;
4. commit inicial;
5. estado Git inicial;
6. objetivo;
7. especificación utilizada;
8. diagnóstico de la implementación incompleta;
9. reparación de `LabRenderer.test.js`;
10. archivos modificados;
11. archivos creados;
12. decisiones técnicas;
13. flujo implementado;
14. pruebas focalizadas;
15. suite completa;
16. lint;
17. build;
18. chequeos arquitectónicos;
19. errores encontrados;
20. correcciones realizadas;
21. estado Git final;
22. resumen del diff;
23. criterios de aceptación;
24. limitaciones;
25. conclusión real.

El log debe generarse incluso si la fase no logra cerrarse.

No esperar hasta el último comando para comenzar a escribirlo.

Crear el archivo al inicio y añadir resultados durante la ejecución.

---

# 22. Reporte Markdown de cierre

Además del `.log`, crear o completar:

```text
reports/FASE_D4_AI_RESEARCH_IMPLEMENTATION_REPORT.md
```

Debe incluir:

* resumen ejecutivo;
* estado heredado;
* recuperación realizada;
* arquitectura final;
* contexto de investigación;
* scope;
* request;
* proveedor local;
* Orchestrator;
* Binding Layer;
* UI;
* pruebas;
* validaciones;
* auditoría;
* archivos;
* riesgos;
* limitaciones;
* criterios de aceptación;
* conclusión.

No copiar datos falsos o estimados.

Usar los resultados reales de los comandos.

---

# 23. Punto de control de cierre

Solo si todas las validaciones críticas son exitosas, crear:

```text
reports/Fase_D4_cerrada.md
```

El documento debe consolidar:

* propósito;
* alcance implementado;
* arquitectura;
* componentes;
* ViewModels;
* commands;
* integración con Timeline;
* integración con Evidence;
* integración con Comparison;
* integración con Replay;
* proveedor local;
* seguridad;
* pruebas;
* resultados;
* decisiones certificadas;
* limitaciones;
* próxima fase recomendada;
* estado final.

Debe terminar con:

```text
Estado de la Fase D.4: CERRADA
```

Solo escribir esa declaración si:

* tests pasan;
* lint pasa;
* build pasa;
* no existen regresiones críticas;
* la auditoría arquitectónica es satisfactoria.

Si no se cumplen esas condiciones, crear en su lugar:

```text
reports/Fase_D4_pendiente.md
```

indicando exactamente qué impide el cierre.

---

# 24. Resumen final en consola

Al finalizar, mostrar:

```text
FASE D.4 — RESULTADO FINAL

Estado:
- CERRADA
o
- PENDIENTE

Reparación de sintaxis:
- PASS / FAIL

Pruebas focalizadas:
- PASS / FAIL

Suite completa:
- PASS / FAIL

Lint:
- PASS / FAIL

Build:
- PASS / FAIL

Arquitectura:
- PASS / FAIL

Log:
- ruta exacta

Reporte:
- ruta exacta

Punto de control:
- ruta exacta

Archivos modificados:
- cantidad

Archivos creados:
- cantidad
```

Después mostrar:

```bash
git status --short
git diff --stat
```

---

# 25. Commit y tag recomendados

No crear commit ni tag automáticamente salvo autorización expresa.

Si la fase queda cerrada, recomendar:

```text
Commit:
feat(laboratory): complete phase D.4 AI Research workspace

Tag:
roulette-tracker-phase-d4-ai-research
```

Si la fase queda pendiente, no recomendar tag de cierre.

---

# 26. Condición de honestidad

No afirmes que:

* se ejecutaron pruebas si no se ejecutaron;
* lint pasó si no pasó;
* build pasó si no pasó;
* el log existe si no fue creado;
* la fase está cerrada si quedan errores;
* AI Research está completo si solo existe una implementación parcial.

El objetivo no es producir un mensaje exitoso.

El objetivo es producir un repositorio técnicamente verificable y un cierre fiel al estado real.

---

# 27. Inicio inmediato

Comienza ahora por:

1. capturar el estado Git;
2. abrir `reports/FaseD.4.md`;
3. inspeccionar el diff;
4. reparar `tests/laboratory/LabRenderer.test.js`;
5. ejecutar un chequeo sintáctico;
6. continuar con la auditoría y cierre completo.
