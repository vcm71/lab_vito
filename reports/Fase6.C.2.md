# =====================================================================
# Roulette Tracker
#
# FASE 6.C.2
#
# LABORATORY UI SHELL
#
# IMPLEMENTACIÓN DEL SHELL BASE
# =====================================================================

Antes de realizar cualquier modificación:

1. Leer completamente el proyecto.

2. Leer el Blueprint generado en:

reports/LABORATORY_UI_BLUEPRINT.md

3. Considerar dicho documento como contrato arquitectónico obligatorio.

No modificar nada que contradiga el Blueprint.

======================================================================
OBJETIVO
======================================================================

Implementar exclusivamente el Laboratory UI Shell.

NO implementar funcionalidades.

NO implementar lógica estadística.

NO implementar comparación.

NO implementar evidencia.

NO implementar replay.

NO implementar IA.

Esta fase solamente construye la estructura visual.

======================================================================
RESTRICCIONES
======================================================================

NO modificar motores.

NO modificar dominio.

NO modificar Application Layer.

NO modificar LaboratoryOrchestrator.

NO modificar contratos públicos.

NO cambiar algoritmos.

NO romper compatibilidad.

NO introducir dependencias innecesarias.

======================================================================
DEBE IMPLEMENTARSE
======================================================================

Crear la estructura visual definida en el Blueprint.

LaboratoryShell

LaboratoryHeader

LaboratorySidebar

LaboratoryToolbar

LaboratoryWorkspace

LaboratoryStatusBar

LaboratoryOverlayHost

======================================================================
EL SHELL DEBE
======================================================================

Integrarse con el shell actual.

Reutilizar:

panel

panel-title

cards

top-nav

tabs

tokens

estilos existentes

No duplicar CSS.

No duplicar componentes.

No crear un sistema paralelo.

======================================================================
HEADER
======================================================================

Implementar:

Título

Subtítulo

Breadcrumb (placeholder)

Zona de acciones (vacía)

Contexto visual

Sin lógica.

======================================================================
SIDEBAR
======================================================================

Implementar estructura visual.

Debe contener placeholders para:

Overview

Experiments

Sessions

Comparison

Evidence

Replay

AI Research

Settings

Sin navegación funcional.

Solo selección visual.

======================================================================
TOOLBAR
======================================================================

Implementar visualmente:

Search

Filters

Sort

Refresh

Compare

Export

Todos los controles deben ser placeholders.

No ejecutar acciones.

======================================================================
WORKSPACE
======================================================================

Crear el contenedor principal.

Debe admitir:

Overview

Experiment

Session

Comparison

Evidence

Replay

AI Research

Cada vista será únicamente un placeholder.

No consumir datos.

No consultar dominio.

No renderizar resultados.

======================================================================
STATUS BAR
======================================================================

Implementar visualmente:

Loading

Ready

Offline

Processing

Completed

Todos simulados.

Sin lógica.

======================================================================
OVERLAY HOST
======================================================================

Preparar el host para:

Dialogs

Modals

Notifications

No implementar overlays reales.

Solo la infraestructura.

======================================================================
RESPONSIVE
======================================================================

Aplicar únicamente el comportamiento definido en el Blueprint.

Desktop

Laptop

Tablet

Mobile

======================================================================
ACCESIBILIDAD
======================================================================

Aplicar desde esta fase:

roles

labels

focus

keyboard navigation

estructura semántica

======================================================================
NO HACER
======================================================================

No conectar datos.

No conectar Application Layer.

No conectar dominio.

No ejecutar experimentos.

No mostrar evidencia.

No mostrar comparaciones.

No mostrar replay.

No mostrar IA.

Todo debe ser placeholder.

======================================================================
VALIDACIONES
======================================================================

Verificar:

✓ Build

✓ Lint

✓ Tests

✓ Sin regresiones

✓ Compatibilidad con tabs existentes

✓ Sin romper el shell actual

======================================================================
GENERAR
======================================================================

Crear:

reports/LAB_UI_SHELL_IMPLEMENTATION.md

Incluyendo:

1. Archivos creados.

2. Archivos modificados.

3. Componentes implementados.

4. Componentes reutilizados.

5. CSS reutilizado.

6. Riesgos encontrados.

7. Capturas o descripción de la estructura generada.

8. Validaciones ejecutadas.

9. Pendientes para C.3.

======================================================================
CRITERIOS DE ÉXITO
======================================================================

Al finalizar debe existir:

✓ LaboratoryShell operativo.

✓ Header visible.

✓ Sidebar visible.

✓ Toolbar visible.

✓ Workspace visible.

✓ StatusBar visible.

✓ OverlayHost preparado.

✓ Sin lógica funcional.

✓ Sin acceso al dominio.

✓ Sin cambios en motores.

✓ Sin romper compatibilidad.

El resultado debe ser un shell completamente navegable desde el punto de vista visual, preparado para que las siguientes fases (C.3–C.7) incorporen comportamiento sin necesidad de rediseñar la arquitectura.
