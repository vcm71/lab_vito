# =====================================================================
# Roulette Tracker
#
# FASE 6.C.5
#
# LABORATORY FUNCTIONAL WORKSPACE
#
# IMPLEMENTACIÓN FUNCIONAL
#
# OVERVIEW
# EXPERIMENTS
# SESSIONS
# =====================================================================

Antes de comenzar:

1. Leer completamente el proyecto.

2. Leer toda la documentación generada en las fases C.1 a C.4.

3. Analizar LaboratoryBindingLayer.

4. Analizar LaboratoryOrchestrator.

5. Analizar todos los ViewModels.

6. Analizar los contratos públicos existentes.

======================================================================
OBJETIVO
======================================================================

Transformar el Laboratory Workspace desde una interfaz de placeholders
a una interfaz funcional.

Esta fase implementará únicamente:

Overview

Experiments

Sessions

Las demás vistas deberán mantenerse como placeholders.

======================================================================
NO HACER
======================================================================

NO modificar Domain.

NO modificar Motores.

NO modificar algoritmos.

NO modificar LaboratoryOrchestrator.

NO romper contratos.

NO modificar Binding Layer salvo para ampliaciones necesarias.

NO modificar la arquitectura del Shell.

======================================================================
OVERVIEW
======================================================================

Implementar una vista funcional utilizando datos reales provenientes
del Binding Layer.

Mostrar únicamente información ya disponible.

Ejemplos:

Estado del laboratorio.

Experimentos disponibles.

Sesiones recientes.

Última sincronización.

Estado del sistema.

Indicadores generales.

No inventar información.

======================================================================
EXPERIMENTS
======================================================================

Implementar:

Listado funcional.

Selección.

Panel de detalle.

Estados.

Vacíos.

Errores.

Loading.

Todo utilizando ViewModels.

======================================================================
SESSIONS
======================================================================

Implementar:

Listado funcional.

Detalle.

Timeline.

Estado.

Eventos recientes.

Todo utilizando ViewModels.

======================================================================
UI
======================================================================

Eliminar placeholders únicamente de:

Overview

Experiments

Sessions

Las demás vistas permanecen simuladas.

======================================================================
VIEWMODELS
======================================================================

Completar los ViewModels necesarios.

No exponer entidades del dominio.

Toda la UI deberá consumir exclusivamente ViewModels.

======================================================================
WORKSPACE
======================================================================

El Workspace deberá actualizarse automáticamente al cambiar:

Vista.

Experimento.

Sesión.

No recrear componentes innecesariamente.

======================================================================
ESTADOS
======================================================================

Gestionar correctamente:

Loading

Ready

Empty

Error

Offline

Refreshing

Completed

Utilizar la infraestructura existente.

======================================================================
PERFORMANCE
======================================================================

Evitar renderizados innecesarios.

Reutilizar componentes.

Mantener separación entre presentación y aplicación.

======================================================================
VALIDACIONES
======================================================================

Verificar:

✓ Build

✓ Lint

✓ Tests

✓ Navegación

✓ Datos reales visibles

✓ Sin acceso directo al dominio

✓ Sin regresiones

======================================================================
GENERAR
======================================================================

Crear:

reports/LAB_FUNCTIONAL_WORKSPACE.md

Incluyendo:

1. Componentes implementados.

2. ViewModels ampliados.

3. Datos expuestos.

4. Integración con Binding Layer.

5. Estados implementados.

6. Riesgos encontrados.

7. Compatibilidad.

8. Pendientes para C.6.

======================================================================
CRITERIOS DE ÉXITO
======================================================================

Overview funcional.

Experiments funcional.

Sessions funcional.

Datos reales mostrados mediante ViewModels.

Sin placeholders en esas tres vistas.

Binding Layer reutilizada.

Sin modificar la arquitectura.

Sin romper compatibilidad.

Las vistas Comparison, Evidence, Replay, AI Research y Settings deben
permanecer disponibles pero todavía en modo placeholder.
