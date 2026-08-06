# PROMPT — CONTINUACIÓN DE RECUPERACIÓN FUNCIONAL DE LAB_CON

## Proyecto

**Roulette Tracker**

## Estado confirmado

Se corrigió un defecto crítico de navegación en `main.js`.

### Causa raíz corregida

El handler global utilizaba:

```js
document.querySelectorAll('.nav-btn')
```

Esto capturaba también las pestañas internas de `Lab_Con`.

Algunas pestañas internas no disponían de `data-target`, por lo que ejecutaban:

```js
activateTab(undefined)
```

El resultado era la desactivación de todas las pestañas principales y una interfaz aparentemente vacía.

### Corrección aplicada

El selector fue limitado a la navegación superior:

```js
'.top-nav .nav-btn[data-target]'
```

También se añadió una guard clause en `activateTab()` para ignorar identificadores vacíos.

### Validaciones ya realizadas

```text
npm run test  — PASS
npm run lint  — PASS
npm run build — PASS
```

Verificación runtime confirmada:

```text
Abrir Lab_Con
→ pulsar Comparison
→ Lab_Con permanece visible
→ Comparison se renderiza correctamente
```

Archivo modificado:

```text
main.js
```

---

# 1. Objetivo de esta ejecución

Continuar la revisión funcional de `Lab_Con` pestaña por pestaña.

No volver a revisar el defecto general de navegación salvo para crear su prueba de regresión.

Debes ahora comprobar y reparar las funcionalidades internas de:

1. Overview
2. Experiments
3. Sessions
4. Comparison
5. Evidence Explorer
6. Replay
7. AI Research

Trabaja de forma incremental.

No declares toda la consola operativa por haber corregido la navegación.

---

# 2. Primera tarea obligatoria: prueba de regresión del bug corregido

Crear o actualizar una prueba automatizada que demuestre:

```text
1. La pestaña principal Lab_Con está activa.
2. Se pulsa una pestaña interna de Lab_Con.
3. activateTab() no recibe undefined.
4. Lab_Con permanece como pestaña superior activa.
5. El workspace interno seleccionado se vuelve visible.
6. Las demás pestañas principales no quedan todas desactivadas.
```

Cubrir como mínimo `Comparison`.

Cuando sea razonable, probar también otra pestaña interna, por ejemplo `Replay` o `AI Research`.

La prueba debe simular interacción y no limitarse a inspeccionar strings.

---

# 3. Regla de trabajo

Auditar un módulo a la vez.

Para cada módulo seguir este ciclo:

```text
Abrir módulo
→ ejecutar sus controles
→ observar DOM y consola
→ reproducir defecto
→ crear prueba roja
→ corregir causa raíz
→ ejecutar prueba verde
→ volver a probar en navegador
→ actualizar log
```

No agrupar correcciones especulativas de varios módulos.

---

# 4. Crear o continuar log

Usar un log específico:

```text
reports/logs/Fase_D4_4_Lab_Con_modules_YYYYMMDD_HHMMSS.log
```

Registrar:

* estado Git inicial;
* prueba de regresión de navegación;
* módulo revisado;
* acciones ejecutadas;
* error observado;
* causa raíz;
* corrección;
* pruebas focalizadas;
* resultado runtime;
* estado pendiente de los otros módulos.

---

# 5. Matriz de trabajo

Mantener esta matriz actualizada:

| Módulo             |       Abre | Datos | Controles | Estado cambia | Re-render | Consola | Estado    |
| ------------------ | ---------: | ----: | --------: | ------------: | --------: | ------: | --------- |
| Navegación interna |       PASS |   N/A |      PASS |          PASS |      PASS |    PASS | CORREGIDO |
| Overview           | NOT TESTED |       |           |               |           |         |           |
| Experiments        | NOT TESTED |       |           |               |           |         |           |
| Sessions           | NOT TESTED |       |           |               |           |         |           |
| Comparison         |    PARTIAL |       |           |               |           |         |           |
| Evidence Explorer  | NOT TESTED |       |           |               |           |         |           |
| Replay             | NOT TESTED |       |           |               |           |         |           |
| AI Research        | NOT TESTED |       |           |               |           |         |           |

No marcar PASS sin interacción real.

---

# 6. Overview

Comprobar en navegador:

* apertura;
* métricas;
* tarjetas;
* estados vacíos;
* accesos rápidos;
* actualización después de seleccionar experimento o sesión;
* errores de consola.

Si dispone de controles, ejecutarlos.

Confirmar que no es únicamente contenido estático.

---

# 7. Experiments

Comprobar:

* listado visible;
* selección mediante click;
* indicador de selección;
* panel de detalle;
* cambio entre experimentos;
* estado vacío;
* actualización de módulos dependientes;
* errores de consola.

Registrar antes y después:

```text
experimentId activo
ViewModel anterior
acción
ViewModel posterior
resultado DOM
```

---

# 8. Sessions

Comprobar:

* listado correspondiente al experimento activo;
* selección;
* detalle;
* actualización al cambiar experimento;
* estado sin sesiones;
* identificadores;
* sincronización con Replay y Evidence.

Verificar que no conserva sesiones obsoletas de otro experimento.

---

# 9. Comparison

La apertura ya fue confirmada, pero falta validar funcionalidad.

Ejecutar:

* agregar elemento;
* agregar segundo elemento;
* visualizar comparación;
* remover elemento;
* limpiar selección;
* estado con selección insuficiente;
* actualización del panel;
* errores de consola.

No considerar este módulo PASS solo porque se renderiza.

---

# 10. Evidence Explorer

Ejecutar:

* escribir búsqueda;
* comprobar cambio real de resultados;
* aplicar filtros;
* seleccionar evidencia;
* abrir detalle;
* limpiar búsqueda;
* limpiar filtros;
* navegar a evento o Replay cuando exista la acción.

Comprobar que los inputs modifican el ViewModel y no solo el DOM local.

---

# 11. Replay

Ejecutar:

* seleccionar evento;
* siguiente;
* anterior;
* inicio;
* final;
* play;
* esperar un avance;
* pause;
* confirmar detención;
* cambiar de pestaña;
* confirmar que no queda un timer activo;
* volver a Replay.

Revisar límites y errores de índices.

---

# 12. AI Research

Ejecutar el flujo completo:

```text
abrir workspace
→ escribir consulta
→ seleccionar scope
→ construir contexto
→ comprobar preview
→ ejecutar
→ observar loading
→ esperar respuesta
→ comprobar respuesta
→ comprobar proveedor local
→ resetear
```

Confirmar el recorrido:

```text
UI
→ LaboratoryBindingLayer
→ LaboratoryOrchestrator
→ proveedor local
→ respuesta
→ nuevo ViewModel
→ re-render
```

No aceptar respuestas provenientes exclusivamente de fixtures.

---

# 13. Consola del navegador

Durante todas las pruebas capturar:

* `console.error`;
* excepciones;
* promesas rechazadas;
* errores de eventos;
* errores de red;
* selectores inexistentes.

Un módulo no puede obtener PASS con errores inesperados de consola.

---

# 14. Pruebas conductuales

Por cada módulo corregido, crear pruebas que incluyan:

```text
render inicial
→ interacción
→ comando público
→ cambio de estado
→ regeneración de ViewModel
→ resultado visible
```

Evitar como única comprobación:

```js
expect(html).toContain(...)
```

La prueba debe verificar conducta.

---

# 15. Alcance de esta ejecución

Revisar tantos módulos como permita la sesión, pero:

* no dejar código con sintaxis rota;
* no declarar módulos no probados como PASS;
* no declarar `Lab_Con` completamente operativo si quedan pestañas sin validar;
* actualizar el log antes de terminar.

Cuando el límite se aproxime, cerrar limpiamente el módulo actual y dejar una lista exacta de pendientes.

---

# 16. Validaciones finales

Después de las correcciones ejecutar:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

Ejecutar también pruebas focalizadas después de cada módulo.

---

# 17. Reporte obligatorio

Crear o actualizar:

```text
reports/LAB_CON_MODULE_FUNCTIONAL_STATUS.md
```

Para cada módulo incluir:

```text
Módulo:
Estado:
Acciones probadas:
Defectos encontrados:
Causa raíz:
Corrección:
Prueba añadida:
Resultado en navegador:
Errores de consola:
Pendientes:
```

---

# 18. Condición de cierre

Solo declarar:

```text
LAB_CON OPERATIVO
```

cuando todas las filas estén en PASS:

* navegación;
* Overview;
* Experiments;
* Sessions;
* Comparison;
* Evidence Explorer;
* Replay;
* AI Research.

Si queda al menos una en `NOT TESTED`, `PARTIAL` o `FAIL`, declarar:

```text
LAB_CON PARCIALMENTE RECUPERADO — REVISIÓN EN CURSO
```

---

# 19. Resumen final

Mostrar:

```text
LAB_CON — REVISIÓN FUNCIONAL POR MÓDULOS

Navegación interna:
PASS

Prueba de regresión de navegación:
PASS / FAIL

Overview:
PASS / FAIL / NOT TESTED

Experiments:
PASS / FAIL / NOT TESTED

Sessions:
PASS / FAIL / NOT TESTED

Comparison:
PASS / FAIL / PARTIAL

Evidence Explorer:
PASS / FAIL / NOT TESTED

Replay:
PASS / FAIL / NOT TESTED

AI Research:
PASS / FAIL / NOT TESTED

Errores inesperados de consola:
0 / cantidad

Tests:
PASS / FAIL

Lint:
PASS / FAIL

Build:
PASS / FAIL

Estado general:
LAB_CON OPERATIVO
o
LAB_CON PARCIALMENTE RECUPERADO — REVISIÓN EN CURSO

Log:
<ruta>

Reporte:
<ruta>
```

---

# 20. Inicio

Comienza por:

1. crear la prueba de regresión del selector `.top-nav .nav-btn[data-target]`;
2. verificarla;
3. abrir Overview;
4. ejecutar sus controles reales;
5. continuar módulo por módulo.
