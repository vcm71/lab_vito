# FASE 6.B.7 — Laboratory Orchestrator & Application Layer

## Rol

Actúa como **Principal Software Architect**, **Chief Research Architect**, **Lead Application Architect** y **Senior Domain Architect** del proyecto **Roulette Tracker**.

Las fases anteriores ya implementaron:

* Laboratory Foundation
* Registry
* Session
* Runner
* Comparison
* Evidence
* Workspace
* Experiment

La arquitectura del dominio se considera estabilizada.

El objetivo ahora es construir la capa de aplicación que coordine todas esas piezas.

---

# Objetivo principal

Implementar el **Laboratory Orchestrator**.

Será el único responsable de coordinar el flujo completo de un experimento.

No contendrá lógica estadística.

No contendrá lógica de interfaz.

No contendrá algoritmos de motores.

Solo coordinará casos de uso.

---

# Principio arquitectónico

La UI nunca deberá hablar directamente con:

* Runner
* Session
* Comparison
* Evidence
* Builders
* Registry

Toda interacción deberá pasar por el Orchestrator.

---

# Modelo conceptual

```text
LaboratoryWorkspace
          │
          ▼
LaboratoryExperiment
          │
          ▼
═══════════════════════════════
LaboratoryOrchestrator
═══════════════════════════════
      │
      ├──────────────┐
      ▼              ▼
Runner        Comparison
      │              │
      ▼              ▼
Results      Evidence
      │              │
      └──────┬───────┘
             ▼
Experiment actualizado
```

---

# Objetivos específicos

## 1. LaboratoryOrchestrator

Implementar un orquestador de alto nivel.

Debe ser completamente agnóstico a:

* AtRep
* WinWin
* DA
* Lab_Con
* Lab_Con1

Debe trabajar únicamente mediante contratos.

---

## 2. Casos de uso

El Orchestrator deberá ofrecer operaciones como:

* crear experimento
* iniciar experimento
* ejecutar sesión
* ejecutar múltiples sesiones
* comparar resultados
* generar evidencia
* actualizar experimento
* finalizar experimento

No implementar lógica de negocio en estos métodos.

Solo coordinación.

---

## 3. Coordinación

El Orchestrator deberá coordinar:

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

↓

Experiment actualizado

---

## 4. Manejo de errores

Centralizar:

* errores de ejecución
* errores de comparación
* errores de evidencia
* errores de consistencia

No propagar excepciones innecesarias.

Representar estados mediante resultados estructurados.

---

## 5. Eventos

Preparar puntos de extensión para eventos del Laboratorio.

Ejemplos:

* ExperimentCreated
* SessionStarted
* SessionCompleted
* ComparisonFinished
* EvidenceGenerated
* ExperimentCompleted

No integrar aún EventBus.

Solo definir contratos y puntos de publicación.

---

## 6. Estado del experimento

El Orchestrator será el único responsable de modificar el ciclo de vida del Experiment.

Runner no deberá modificar estados.

Comparison no deberá modificar estados.

Evidence no deberá modificar estados.

---

## 7. Compatibilidad

Mantener compatibilidad total con:

* Workspace
* Experiment
* Session
* Runner
* Comparison
* Evidence
* Registry

No romper ninguna API existente.

---

## 8. Extensibilidad

Preparar el Orchestrator para integrar posteriormente:

* Monte Carlo
* Replay Engine
* IA Research Agents
* Calibración automática
* Optimización
* Batch Execution
* Ejecución distribuida

Sin modificar su interfaz pública.

---

## 9. Reproducibilidad

Toda operación coordinada por el Orchestrator deberá mantener:

* provenance
* metadata
* timestamps
* configuración
* parámetros

No perder trazabilidad.

---

## 10. Application Layer

Formalizar que el Orchestrator pertenece a la capa de aplicación.

No debe contener:

* lógica de dominio;
* lógica de infraestructura;
* lógica de presentación.

Solo coordinación de casos de uso.

---

# Restricciones

NO modificar:

* algoritmos de motores;
* Session;
* Runner;
* Comparison;
* Evidence;
* Workspace;
* Experiment;
* Registry;
* Historical Evidence;
* Tracker;
* Domain Tracker.

No modificar resultados.

No modificar UI.

---

# Validaciones

Ejecutar:

* npm test
* npm run lint
* npm run build

Verificar:

* ausencia de regresiones;
* coordinación correcta;
* compatibilidad completa;
* serialización;
* reproducibilidad.

---

# Informe obligatorio

Generar:

```text
reports/

PHASE_6_B_7_LABORATORY_ORCHESTRATOR_APPLICATION_LAYER.md
```

Debe contener:

## Resumen ejecutivo

## Modelo del Orchestrator

## Casos de uso implementados

## Coordinación de componentes

## Manejo de errores

## Eventos preparados

## Compatibilidad

## Riesgos

## Próximos pasos

## Evidencia utilizada

---

# Criterios de aceptación

La fase será aceptada únicamente si:

✓ Existe LaboratoryOrchestrator.

✓ La UI futura podrá depender únicamente del Orchestrator.

✓ Runner deja de coordinar el flujo completo.

✓ Workspace y Experiment conservan su responsabilidad.

✓ La coordinación queda centralizada.

✓ No cambia ningún algoritmo.

✓ No cambia ningún resultado.

✓ No cambia la UI.

✓ Tests, Build y Lint permanecen en verde.

---

# Requisitos arquitectónicos obligatorios

Antes de crear cualquier componente nuevo:

1. Buscar servicios reutilizables.
2. Extender antes de crear.
3. No duplicar coordinación existente.
4. Justificar toda nueva abstracción.

No introducir dependencias desde el dominio hacia la aplicación.

El Orchestrator deberá depender únicamente de contratos públicos.

---

# Estado final esperado

```text
LABORATORY ORCHESTRATOR IMPLEMENTED

APPLICATION LAYER STABILIZED

READY FOR PHASE 6.B.8
```
