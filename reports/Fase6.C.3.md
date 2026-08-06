# =====================================================================
# Roulette Tracker
#
# FASE 6.C.3
#
# LABORATORY NAVIGATION & UI STATE
#
# IMPLEMENTACIÓN DEL COMPORTAMIENTO DE LA UI
#
# SIN CONECTAR EL DOMINIO
# =====================================================================

Antes de comenzar:

1. Leer completamente el proyecto.

2. Leer el documento:

reports/LABORATORY_UI_BLUEPRINT.md

3. Leer el reporte de implementación de C.2.

El Blueprint sigue siendo el contrato arquitectónico.

======================================================================
OBJETIVO
======================================================================

Convertir el Laboratory UI Shell en una interfaz completamente navegable.

NO conectar todavía:

- LaboratoryOrchestrator

- Application Layer

- Domain

- Motores

Toda la navegación será local.

Toda la información será placeholder.

======================================================================
NO HACER
======================================================================

NO consumir datos.

NO ejecutar experimentos.

NO consultar repositorios.

NO acceder al dominio.

NO crear lógica estadística.

NO implementar casos de uso.

======================================================================
IMPLEMENTAR
======================================================================

Implementar la navegación interna del Laboratory.

Las siguientes vistas deben existir como pantallas independientes:

Overview

Experiments

Sessions

Comparison

Evidence

Replay

AI Research

Settings

Cada vista deberá poseer:

Título

Subtítulo

Workspace propio

Estado Ready

Contenido placeholder

======================================================================
SIDEBAR
======================================================================

Implementar navegación funcional.

Al seleccionar una opción:

• cambia la vista

• actualiza el Header

• actualiza Breadcrumb

• actualiza Workspace

• actualiza Toolbar

• mantiene selección activa

Implementar:

teclado

focus

aria-selected

persistencia local

======================================================================
HEADER
======================================================================

Actualizar dinámicamente:

Título

Subtítulo

Breadcrumb

Contexto

Estado

Todo utilizando únicamente estado local.

======================================================================
TOOLBAR
======================================================================

Los controles deben ser funcionales visualmente.

Implementar:

Search

Clear

Refresh

Sort

Compare

Export

No ejecutar acciones reales.

Cada acción debe modificar únicamente el estado visual.

======================================================================
WORKSPACE
======================================================================

Cada vista debe tener un layout independiente.

Ejemplo:

Overview

↓

KPIs placeholder

↓

Actividad reciente

↓

Resumen

------------------------------------------------------------

Experiments

↓

Lista placeholder

↓

Panel lateral

↓

Detalle

------------------------------------------------------------

Sessions

↓

Timeline placeholder

↓

Estado

------------------------------------------------------------

Comparison

↓

Grid placeholder

------------------------------------------------------------

Evidence

↓

Explorer placeholder

------------------------------------------------------------

Replay

↓

Timeline placeholder

------------------------------------------------------------

AI Research

↓

Área de Prompt

↓

Resultados simulados

------------------------------------------------------------

Settings

↓

Preferencias visuales

======================================================================
ESTADO DE LA UI
======================================================================

Implementar un estado local para manejar:

activeView

selectedItem

searchQuery

sortMode

filters

expandedGroups

sidebarCollapsed

toolbarState

workspaceState

statusBarState

selectedBreadcrumb

No utilizar dominio.

======================================================================
PERSISTENCIA
======================================================================

Persistir únicamente preferencias visuales.

Ejemplos:

última vista

sidebar expandido

filtros visuales

orden

tema (si existe)

Utilizar el mismo mecanismo ya empleado por la aplicación.

======================================================================
STATUS BAR
======================================================================

Actualizar automáticamente:

Ready

Searching

Filtering

Refreshing

Placeholder Updated

Offline

Todo simulado.

======================================================================
OVERLAY HOST
======================================================================

Implementar:

Toast placeholder

Confirm placeholder

Info placeholder

Warning placeholder

Los diálogos deben abrir y cerrar correctamente.

No ejecutar acciones.

======================================================================
TRANSICIONES
======================================================================

Agregar únicamente microtransiciones.

No introducir animaciones pesadas.

======================================================================
ACCESIBILIDAD
======================================================================

Mantener:

roles

aria

focus

tabindex

keyboard navigation

labels

======================================================================
RESPONSIVE
======================================================================

Mantener el comportamiento definido en el Blueprint.

No introducir nuevos breakpoints.

======================================================================
VALIDACIONES
======================================================================

Verificar:

✓ Build

✓ Tests

✓ Lint

✓ Navegación completa

✓ Persistencia local

✓ Sin regresiones

✓ Sin conexión al dominio

======================================================================
GENERAR
======================================================================

Crear:

reports/LAB_UI_NAVIGATION.md

Incluyendo:

1. Componentes modificados.

2. Estado local implementado.

3. Flujo de navegación.

4. Persistencia implementada.

5. Eventos UI.

6. Accesibilidad.

7. Responsive.

8. Riesgos.

9. Pendientes para C.4.

======================================================================
CRITERIOS DE ÉXITO
======================================================================

Al finalizar deberá existir una interfaz Laboratory completamente navegable.

El usuario podrá recorrer todas las vistas.

Todos los componentes reaccionarán al estado local.

Toda la navegación será funcional.

No existirá conexión con el dominio.

No existirán consultas a motores.

No existirán casos de uso.

El Shell quedará completamente preparado para que la Fase C.4 conecte la UI con LaboratoryOrchestrator sin modificar nuevamente la arquitectura visual.
