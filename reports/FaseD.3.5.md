# PROMPT — Fase D.3.5

# Laboratory Timeline Model & Event Bus

## Proyecto

**Roulette Tracker**

---

# Estado actual

El módulo Laboratory dispone actualmente de los siguientes workspaces funcionales:

* Overview
* Experiments
* Sessions
* Comparison
* Evidence Explorer
* Replay

Todos consumen información mediante:

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

Replay ya permite navegar cronológicamente por eventos.

Evidence Explorer expone evidencias.

Comparison expone resultados comparativos.

Sin embargo, todavía **no existe un modelo temporal unificado**.

Cada workspace mantiene su propia representación del tiempo.

---

# Objetivo

Implementar una infraestructura común denominada:

**Laboratory Timeline Model**

que se convertirá en la fuente temporal oficial del módulo Laboratory.

No es un nuevo workspace.

No es una nueva UI.

Es una infraestructura compartida.

---

# Rol

Actúa como:

* Principal Software Architect
* Senior Application Engineer
* Event Driven Architect
* Clean Architecture Reviewer
* UX Architect
* Technical Auditor

---

# Principio fundamental

NO modificar:

* Domain
* Motores estadísticos
* Casos de uso
* Repositorios

Toda la nueva funcionalidad debe integrarse exclusivamente en:

* LaboratoryOrchestrator
* LaboratoryBindingLayer
* ViewModels
* Infraestructura del Laboratory

---

# Primera tarea (OBLIGATORIA)

Antes de modificar cualquier archivo:

Realizar una auditoría completa.

Determinar:

* qué eventos existen actualmente;
* cómo Replay obtiene recentEvents;
* qué eventos producen Experiments;
* qué eventos producen Sessions;
* qué eventos producen Comparison;
* qué eventos producen Evidence Explorer;
* qué identificadores comunes existen;
* qué timestamps existen;
* qué metadata existe.

No asumir.

Verificar.

Documentar.

---

# Objetivo arquitectónico

Construir un modelo unificado.

Conceptualmente:

```text
Timeline
│
├── ExperimentStarted
├── ExperimentFinished
├── SessionCreated
├── SessionUpdated
├── EvidenceGenerated
├── ComparisonExecuted
├── ReplayVisited
├── UserInteraction
└── ...
```

Los nombres reales deben derivarse del repositorio.

No inventar eventos inexistentes.

---

# Timeline ViewModel

Crear únicamente si no existe.

Debe representar una secuencia temporal lista para UI.

Nunca entidades del dominio.

Debe incluir únicamente información realmente disponible.

Ejemplo conceptual:

```ts
TimelineViewModel
{
    events
    currentEvent
    selectedEvent
    filters
    statistics
}
```

No copiar este contrato si contradice el proyecto.

---

# Timeline Event

Crear un modelo unificado.

Debe representar cualquier evento del Laboratory.

Debe reutilizar identificadores existentes.

Ejemplo conceptual:

```text
id
timestamp
type
source
title
description
metadata
references
```

No inventar campos.

---

# Relaciones

Cada evento debe poder referenciar, cuando exista:

* Experimento
* Sesión
* Evidencia
* Comparación
* Replay

Nunca duplicar información.

Solo referencias.

---

# Timeline Builder

Crear una única infraestructura responsable de construir el Timeline.

No repartir esta lógica entre varios workspaces.

Debe consumir únicamente información proveniente de:

* Binding Layer
* Application

Nunca desde Domain directamente.

---

# Event Bus

Si el proyecto ya dispone de un mecanismo similar:

reutilizarlo.

Si no existe:

implementar una infraestructura mínima para publicar eventos internos del Laboratory.

No implementar un bus genérico para toda la aplicación.

Debe limitarse al módulo Laboratory.

---

# Binding Layer

Auditar primero.

Crear únicamente los métodos realmente necesarios.

Ejemplos:

```text
loadTimeline()

refreshTimeline()

selectTimelineEvent()

filterTimeline()

searchTimeline()

publishTimelineEvent()
```

Usar la nomenclatura real.

---

# Orchestrator

Ampliar únicamente cuando sea imprescindible.

Toda coordinación debe permanecer en Application.

Nunca introducir lógica visual.

---

# Integración

Actualizar los siguientes workspaces para consumir el Timeline cuando resulte apropiado:

* Replay
* Evidence Explorer
* Comparison

Sin romper compatibilidad.

No reescribirlos.

---

# Timeline Statistics

Construir únicamente con datos existentes.

Ejemplos:

* número de eventos
* tipos de eventos
* distribución temporal

No realizar cálculos estadísticos nuevos.

---

# Estados

Implementar:

* loading
* ready
* empty
* filtered
* error

Reutilizar estados existentes.

---

# Rendimiento

Evitar:

* reconstruir todo el Timeline en cada render;
* ordenar repetidamente;
* duplicar eventos;
* múltiples transformaciones iguales.

Construir una única representación reutilizable.

---

# Accesibilidad

Verificar:

* navegación teclado
* selección de eventos
* foco
* aria

---

# Responsive

No modificar el diseño global.

Solo mantener compatibilidad.

---

# Compatibilidad

No modificar:

* Shell
* Navegación
* Bootstrap
* Sistema visual
* Motores estadísticos
* Domain

---

# Tests

Agregar únicamente los necesarios.

Cubrir:

* construcción del Timeline
* orden cronológico
* referencias cruzadas
* filtrado
* búsqueda
* selección
* integración con Replay
* integración con Evidence
* integración con Comparison

No duplicar pruebas existentes.

---

# Validaciones

Ejecutar:

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

Ejecutar además todas las validaciones arquitectónicas existentes.

No declarar éxito sin evidencia.

---

# Informe obligatorio

Crear:

```text
reports/FASE_D35_TIMELINE_IMPLEMENTATION.md
```

Debe incluir:

1. Auditoría inicial.
2. Eventos encontrados.
3. Timeline construido.
4. Componentes reutilizados.
5. ViewModels.
6. Binding Layer.
7. Orchestrator.
8. Integración con Replay.
9. Integración con Evidence.
10. Integración con Comparison.
11. Tests.
12. Build.
13. Lint.
14. Riesgos.
15. Deuda técnica.
16. Preparación para AI Research.

---

# Punto de control

Si todos los criterios se cumplen:

Crear:

```text
Fase_D35_cerrada.md
```

En caso contrario:

```text
Fase_D35_pendiente.md
```

explicando exactamente qué impide el cierre.

---

# Criterios de aceptación

La fase solo podrá declararse **CERRADA** cuando:

* exista un Timeline unificado;
* todos los eventos provengan de datos reales;
* Replay reutilice el Timeline;
* Evidence Explorer reutilice el Timeline cuando corresponda;
* Comparison pueda enlazar eventos relacionados sin duplicar información;
* no existan accesos directos al Domain;
* los tests pasen;
* el lint pase;
* el build pase;
* no existan regresiones funcionales en los workspaces ya certificados.

---

# Preparación para D.4

Esta fase debe dejar lista la infraestructura para que **AI Research Workspace** pueda consumir el Timeline como fuente única de contexto.

AI Research no deberá reconstruir la historia desde múltiples componentes.

Simplemente consultará el Timeline.

No implementar AI Research durante esta fase.

---

# Instrucción final

Ejecutar el trabajo siguiendo estrictamente este orden:

```text
AUDITAR
→ IDENTIFICAR EVENTOS
→ DOCUMENTAR BRECHAS
→ DISEÑAR TIMELINE
→ IMPLEMENTAR TIMELINE BUILDER
→ AMPLIAR BINDING LAYER
→ AMPLIAR ORCHESTRATOR (solo si es necesario)
→ INTEGRAR REPLAY
→ INTEGRAR EVIDENCE
→ INTEGRAR COMPARISON
→ AGREGAR TESTS
→ VALIDAR
→ DOCUMENTAR
→ CERTIFICAR
```

## Restricciones arquitectónicas

* No crear una segunda fuente temporal.
* No duplicar eventos ya existentes.
* No introducir dependencias entre workspaces.
* Mantener el principio **Domain → Application → Binding Layer → ViewModels → UI**.
* Todo evento debe ser reutilizable por fases futuras.
* Diseñar el Timeline como una infraestructura estable y extensible para los siguientes bloques del proyecto.

## Visión de largo plazo

El Timeline debe convertirse en el **registro cronológico oficial del Laboratory**.

Las siguientes capacidades deberán consumirlo sin reconstruir contexto:

* AI Research Workspace
* Auditorías
* Exportación de sesiones
* Diagnóstico de experimentos
* Análisis temporal
* Visualizaciones futuras

Esta fase debe consolidar esa base sin modificar la arquitectura certificada ni el dominio.
