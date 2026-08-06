# FASE D.4.4

# LAB_CON — Functional Recovery

## Microfase 1 — Overview Workspace

### Proyecto

**Roulette Tracker**

---

# Contexto

La navegación principal de Lab_Con ya fue corregida.

La causa raíz fue:

* el selector global `.nav-btn` capturaba también las pestañas internas;
* se ejecutaba `activateTab(undefined)`;
* la interfaz principal quedaba completamente desactivada.

Ese defecto ya fue:

* corregido;
* validado;
* protegido mediante una prueba de regresión.

No debes volver a trabajar sobre ese problema salvo para verificar que la prueba continúa pasando.

El objetivo de esta ejecución es **únicamente Overview**.

---

# Regla principal

No revises:

* Comparison
* Sessions
* Replay
* AI Research
* Evidence Explorer

salvo cuando Overview dependa directamente de alguno de ellos.

Toda la ejecución debe concentrarse exclusivamente en el funcionamiento de Overview.

---

# Objetivo

Verificar que el workspace **Overview** funciona correctamente en runtime.

Debes demostrarlo mediante interacción real.

No basta con comprobar:

* HTML
* renderer
* ViewModel
* tests existentes

Debe demostrarse el comportamiento visible.

---

# Paso 1

Leer:

```text
reports/LAB_CON_MODULE_FUNCTIONAL_STATUS.md
```

Actualizar únicamente la sección correspondiente a Overview.

No modificar el estado de los demás módulos.

---

# Paso 2

Crear un log:

```text
reports/logs/Fase_D4_4_Overview_YYYYMMDD_HHMMSS.log
```

Registrar desde el inicio:

* rama;
* commit;
* estado Git;
* comandos;
* errores;
* correcciones;
* pruebas;
* resultado final.

---

# Paso 3

Iniciar la aplicación real.

Utilizar el script existente en package.json.

Registrar:

* comando utilizado;
* URL;
* puerto;
* tiempo de arranque;
* errores de inicialización.

No continuar si la aplicación no inicia.

---

# Paso 4

Abrir Lab_Con.

Entrar al workspace Overview.

Registrar:

* screenshot inicial (si la infraestructura lo permite);
* errores de consola;
* errores de red;
* warnings relevantes.

---

# Paso 5

Inventariar todos los controles visibles en Overview.

Para cada uno registrar:

* nombre;
* selector;
* evento;
* handler;
* comando del Binding Layer;
* actualización del ViewModel.

---

# Paso 6

Ejecutar todas las acciones disponibles.

Por ejemplo:

* tarjetas;
* accesos rápidos;
* botones;
* filtros;
* refresco;
* navegación;
* indicadores;
* métricas.

No asumir que funcionan.

Comprobar una por una.

---

# Paso 7

Para cada acción documentar:

Estado inicial

↓

Click del usuario

↓

Handler

↓

Binding Layer

↓

Orchestrator

↓

Nuevo ViewModel

↓

Render

↓

Resultado visible

---

# Paso 8

Si aparece un error:

Registrar:

* pasos para reproducir;
* resultado observado;
* resultado esperado;
* stack trace;
* causa raíz;
* archivos implicados.

Antes de corregir:

crear una prueba roja.

Después:

corregir únicamente ese defecto.

No aprovechar para refactorizar otros módulos.

---

# Paso 9

Crear pruebas conductuales.

Las pruebas deben verificar:

```text
render inicial

↓

interacción

↓

cambio de estado

↓

nuevo ViewModel

↓

nuevo render

↓

resultado visible
```

No utilizar únicamente:

```javascript
expect(html).toContain(...)
```

---

# Paso 10

Verificar consola.

Durante toda la ejecución comprobar:

* console.error
* promesas rechazadas
* errores de eventos
* errores de red

Overview no puede declararse operativo si existen errores inesperados.

---

# Paso 11

Actualizar:

```text
reports/LAB_CON_MODULE_FUNCTIONAL_STATUS.md
```

Solo la fila:

Overview

Debe quedar:

PASS

FAIL

PARTIAL

o

NOT TESTED

con evidencia.

---

# Paso 12

Generar:

```text
reports/LAB_CON_OVERVIEW_REPORT.md
```

Debe contener:

* estado inicial;
* controles encontrados;
* acciones ejecutadas;
* defectos encontrados;
* causas raíz;
* correcciones;
* pruebas añadidas;
* resultado runtime;
* errores de consola;
* estado final.

---

# Paso 13

Validaciones finales

Ejecutar:

```bash
npm run test

npm run lint

npm run build
```

Ejecutar además la prueba de regresión de navegación creada anteriormente.

No aceptar regresiones.

---

# Paso 14

Resumen final

Mostrar:

```text
OVERVIEW

Runtime:
PASS / FAIL

Render:
PASS / FAIL

Controles:
PASS / FAIL

Binding Layer:
PASS / FAIL

ViewModel:
PASS / FAIL

Errores consola:
0 / cantidad

Pruebas nuevas:
cantidad

Tests:
PASS / FAIL

Lint:
PASS / FAIL

Build:
PASS / FAIL

Estado:

PASS
FAIL
PARTIAL

Log:

<ruta>

Reporte:

<ruta>
```

---

# Criterio de cierre

Esta microfase solo puede declararse PASS cuando:

* Overview abre correctamente.
* Todos sus controles principales funcionan.
* No existen errores inesperados de consola.
* Existe al menos una prueba conductual nueva.
* La prueba de regresión de navegación sigue pasando.
* Tests, lint y build continúan en verde.

No evalúes ningún otro módulo durante esta ejecución.

Cuando Overview quede certificado, la siguiente microfase será **Experiments**, siguiendo exactamente el mismo procedimiento.
