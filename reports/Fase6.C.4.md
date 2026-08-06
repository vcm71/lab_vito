# =====================================================================
# Roulette Tracker
#
# FASE 6.C.4
#
# LABORATORY APPLICATION BINDING LAYER
#
# UI → APPLICATION
#
# NO MODIFICAR LA ARQUITECTURA VISUAL
# =====================================================================

Antes de comenzar:

1. Leer completamente el proyecto.

2. Leer el Blueprint:

reports/LABORATORY_UI_BLUEPRINT.md

3. Leer los reportes:

C.2

C.3

4. Analizar completamente LaboratoryOrchestrator.

5. Analizar la capa Application.

6. Analizar los contratos públicos existentes.

======================================================================
OBJETIVO
======================================================================

Conectar el Laboratory UI Shell con LaboratoryOrchestrator.

NO conectar directamente la UI al dominio.

Toda comunicación deberá realizarse mediante una Binding Layer.

La UI nunca debe conocer:

Domain

Repositories

Motores

Servicios internos

Persistencia

======================================================================
PRINCIPIO ARQUITECTÓNICO
======================================================================

La arquitectura deberá quedar:

UI

↓

ViewModel

↓

Binding Layer

↓

LaboratoryOrchestrator

↓

Application

↓

Domain

Nunca:

UI

↓

Domain

======================================================================
NO HACER
======================================================================

NO modificar LaboratoryShell.

NO modificar Sidebar.

NO modificar Toolbar.

NO modificar Workspace.

NO modificar StatusBar.

NO modificar OverlayHost.

NO modificar LaboratoryOrchestrator.

NO modificar Domain.

NO modificar Motores.

======================================================================
IMPLEMENTAR
======================================================================

Crear una Binding Layer responsable de:

• solicitar información

• transformar respuestas

• construir ViewModels

• desacoplar la UI del dominio

• centralizar errores

• centralizar estados

• centralizar carga

======================================================================
VIEW MODELS
======================================================================

Implementar ViewModels para:

Overview

Experiments

Sessions

Comparison

Evidence

Replay

AI Research

Settings

Cada ViewModel debe exponer únicamente datos listos para renderizar.

Nunca entidades del dominio.

======================================================================
ESTADOS
======================================================================

La Binding Layer deberá administrar:

Loading

Ready

Empty

Error

Offline

Refreshing

Processing

Completed

La UI solo consumirá dichos estados.

======================================================================
ERRORES
======================================================================

Toda excepción deberá convertirse en estados UI.

Nunca propagar excepciones del dominio hacia la interfaz.

======================================================================
EVENTOS
======================================================================

Centralizar:

Refresh

Search

Compare

Open

Close

Export

Retry

Navigation

======================================================================
CONTRATOS
======================================================================

La UI deberá consumir únicamente:

ViewModels

Commands

UI States

Nunca objetos del dominio.

======================================================================
CACHÉ
======================================================================

Implementar únicamente caché visual si ya existe infraestructura.

No introducir mecanismos nuevos de persistencia.

======================================================================
LOGGING
======================================================================

Reutilizar el sistema de logging existente.

No crear otro.

======================================================================
VALIDACIONES
======================================================================

Verificar:

✓ Build

✓ Tests

✓ Lint

✓ UI funcional

✓ Comunicación con Application

✓ Sin dependencia directa al dominio

✓ Sin regresiones

======================================================================
GENERAR
======================================================================

Crear:

reports/LAB_APPLICATION_BINDING.md

Incluyendo:

1. Componentes creados.

2. Componentes modificados.

3. ViewModels implementados.

4. Binding Layer.

5. Eventos.

6. Estados.

7. Transformaciones realizadas.

8. Riesgos encontrados.

9. Compatibilidad.

10. Pendientes para C.5.

======================================================================
CRITERIOS DE ÉXITO
======================================================================

La UI debe visualizar datos provenientes de LaboratoryOrchestrator.

La UI nunca debe acceder directamente al dominio.

Toda comunicación debe pasar por la Binding Layer.

Los ViewModels deben encapsular completamente las entidades del dominio.

La arquitectura visual construida en C.2 y C.3 debe permanecer intacta.

No debe romperse ningún contrato público.

La implementación debe ser completamente compatible hacia atrás.
