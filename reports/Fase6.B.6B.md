# FASE 6.B.6 — Laboratory Workspace & Experiment Orchestration

## Rol

Actúa como **Principal Software Architect**, **Chief Research Architect**, **Lead UX Architect** y **Senior Domain Architect** del proyecto **Roulette Tracker**.

Las fases anteriores ya implementaron:

* Laboratory Foundation
* Registry
* Runner
* Dataset
* Session
* Comparison Framework
* Evidence Framework

El Laboratorio ya puede ejecutar experimentos reproducibles.

El siguiente paso consiste en construir el modelo de trabajo del investigador.

No se trata de construir pantallas.

Se trata de construir el dominio del Workspace.

---

# Objetivo principal

Implementar el modelo de:

* LaboratoryWorkspace
* Experiment
* ExperimentLifecycle

permitiendo organizar múltiples experimentos independientes dentro del Laboratorio.

---

# Principios

El Workspace NO es una interfaz.

El Workspace representa un proyecto de investigación.

Cada Workspace puede contener múltiples Experiment.

Cada Experiment puede contener múltiples Session.

Cada Session puede generar múltiples Comparison.

Cada Comparison puede generar múltiples EvidenceReport.

---

# Modelo conceptual

```text
LaboratoryWorkspace
        │
        ├───────────────┐
        ▼               ▼
Experiment A       Experiment B
        │               │
        ▼               ▼
Sessions        Sessions
        │               │
        ▼               ▼
Comparisons   Comparisons
        │               │
        ▼               ▼
Evidence      Evidence
```

---

# Objetivos específicos

## 1. LaboratoryWorkspace

Crear una entidad responsable de representar un espacio completo de investigación.

Debe contener:

* workspaceId
* name
* description
* owner
* experiments
* metadata
* createdAt
* updatedAt

Debe ser:

* serializable
* reproducible
* inmutable

No contener lógica de negocio.

---

## 2. LaboratoryExperiment

Crear una entidad que represente una hipótesis o línea de investigación.

Debe contener:

* experimentId
* workspaceId
* hypothesis
* objective
* sessions
* comparisons
* evidence
* metadata
* status

Debe ser completamente independiente de la interfaz.

---

## 3. Experiment Builder

Crear un Builder responsable de:

* validar experimentos;
* agregar sesiones;
* agregar comparaciones;
* agregar evidencia;
* validar consistencia.

No ejecutar sesiones.

---

## 4. Experiment Lifecycle

Formalizar estados mínimos:

```text
CREATED

READY

RUNNING

ANALYZING

COMPLETED

ARCHIVED

CANCELLED
```

Las transiciones deben estar validadas.

---

## 5. Workspace Catalog

Crear un catálogo de Workspaces.

Debe permitir:

* registrar
* consultar
* listar
* abrir
* cerrar

No implementar persistencia permanente.

Solo infraestructura.

---

## 6. Experiment Catalog

Cada Workspace deberá administrar múltiples Experiment.

No utilizar listas globales.

---

## 7. Integración

Integrar:

Workspace

↓

Experiment

↓

Session

↓

Runner

↓

Comparison

↓

Evidence

sin modificar la lógica existente.

---

## 8. Provenance

Toda entidad deberá conservar trazabilidad.

Como mínimo:

* versiones de módulos;
* dataset utilizado;
* Session utilizada;
* parámetros;
* configuración;
* fecha;
* origen de datos;
* versión del Runner.

No depender del estado global.

---

## 9. Reproducibilidad

Un Workspace completo deberá poder reconstruirse únicamente a partir de:

* Experiments
* Sessions
* Comparisons
* Evidence

No depender del Tracker.

---

## 10. Preparación para UI

La estructura deberá ser suficiente para que una futura interfaz pueda:

* abrir un Workspace;
* seleccionar un Experiment;
* lanzar Sessions;
* comparar resultados;
* consultar Evidence.

La UI no deberá contener lógica de negocio.

---

# Restricciones

NO modificar:

* Runner
* Registry
* Dataset
* Session
* Comparison
* Evidence
* Historical Evidence
* SignalCollector
* Motores
* Tracker
* Domain Tracker

No modificar algoritmos.

No modificar resultados.

No introducir dependencias desde el dominio hacia la UI.

---

# Validaciones

Ejecutar:

* npm test
* npm run lint
* npm run build

Verificar:

* serialización completa;
* reconstrucción de Workspace;
* compatibilidad con fases anteriores;
* ausencia de regresiones.

---

# Informe obligatorio

Generar:

```text
reports/

PHASE_6_B_6_LABORATORY_WORKSPACE_EXPERIMENT_ORCHESTRATION.md
```

Debe contener:

## Resumen ejecutivo

## Modelo de Workspace

## Modelo de Experiment

## Lifecycle

## Builders

## Catálogos

## Integración con Session

## Integración con Comparison

## Integración con Evidence

## Provenance

## Compatibilidad

## Riesgos

## Próximos pasos

## Evidencia utilizada

---

# Criterios de aceptación

La fase será aceptada únicamente si:

✓ Existe LaboratoryWorkspace.

✓ Existe LaboratoryExperiment.

✓ Existe ExperimentBuilder.

✓ Existe ExperimentLifecycle.

✓ Existe WorkspaceCatalog.

✓ Un Workspace puede contener múltiples Experiment.

✓ Un Experiment puede contener múltiples Session.

✓ Toda la trazabilidad queda preservada.

✓ No cambia ningún algoritmo existente.

✓ No cambia ningún resultado existente.

✓ No cambia la UI.

✓ Tests, Build y Lint permanecen en verde.

---

# Requisitos arquitectónicos obligatorios

Antes de crear cualquier componente nuevo:

1. Buscar infraestructura reutilizable.
2. Extender antes de crear.
3. No duplicar componentes existentes.
4. Justificar toda nueva abstracción.

Toda decisión deberá documentarse.

---

# Preparación para fases futuras

La arquitectura deberá quedar preparada para incorporar posteriormente:

* Simuladores.
* Monte Carlo.
* Replay Engine.
* IA Research Agents.
* Calibración automática.
* Optimización de estrategias.
* Exportación de experimentos.
* Compartición de Workspaces.
* Persistencia de largo plazo.

Sin modificar el núcleo del Laboratorio.

---

# Estado final esperado

```text
LABORATORY WORKSPACE IMPLEMENTED

EXPERIMENT MODEL STABILIZED

READY FOR PHASE 6.B.7
```
