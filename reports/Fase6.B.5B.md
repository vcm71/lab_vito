# FASE 6.B.5 — Laboratory Comparison & Evidence Framework

## Rol

Actúa como **Principal Software Architect**, **Chief Research Architect** y **Lead Software Engineer** del proyecto **Roulette Tracker**.

Las fases anteriores ya implementaron:

* Laboratory Foundation
* Registry
* Runner
* Dataset
* Session
* Execution Model

El Laboratorio ya puede ejecutar módulos.

El siguiente objetivo es convertir esos resultados en evidencia comparable.

---

# Objetivo principal

Implementar el **Framework de Comparación y Evidencia**.

Toda comparación futura del Laboratorio deberá apoyarse sobre esta infraestructura.

No deberá depender de ningún motor específico.

---

# Principios

El Framework compara resultados.

NO compara motores directamente.

La unidad de comparación siempre será:

```text
LaboratorySessionResult
```

Nunca:

```text
AtRep vs WinWin
```

Sino:

```text
SessionResult A

↓

SessionResult B

↓

Comparison
```

---

# Modelo conceptual

```text
Historical Evidence
          │
          ▼
LaboratoryDataset
          │
          ▼
LaboratorySession
          │
          ▼
LaboratoryRunner
          │
          ▼
LaboratorySessionResult
          │
          ▼
═══════════════════════════════
Comparison Framework
═══════════════════════════════
          │
          ▼
Comparison
          │
          ▼
Metric Aggregator
          │
          ▼
Evidence Report
          │
          ▼
Decision Layer
```

---

# Objetivos específicos

## 1. LaboratoryComparison

Crear una entidad que represente una comparación reproducible.

Debe contener:

* comparisonId
* sessions comparadas
* criterios
* métricas utilizadas
* diferencias
* conclusiones
* metadata
* timestamps

Debe ser serializable.

Debe ser inmutable.

---

## 2. ComparisonBuilder

Crear un Builder responsable de:

* validar sesiones
* validar compatibilidad
* construir comparaciones
* preparar criterios

No ejecutar comparaciones.

---

## 3. ResultComparator

Crear un comparador desacoplado.

Debe comparar:

* resultados
* métricas
* datasets
* configuraciones
* parámetros

Nunca motores directamente.

---

## 4. MetricAggregator

Crear un agregador responsable de consolidar métricas provenientes de distintos módulos.

Debe reutilizar LaboratoryMetric.

No crear un sistema paralelo.

---

## 5. EvidenceReport

Crear un reporte de evidencia.

Debe contener:

* datasets utilizados
* sesiones
* resultados
* diferencias
* métricas
* trazabilidad
* reproducibilidad
* observaciones

Debe ser serializable.

No generar UI.

---

## 6. Decision Layer

Crear una representación neutral de decisiones.

Ejemplos:

* empate
* ventaja estadística
* diferencia significativa
* evidencia insuficiente
* comparación inválida

No implementar heurísticas complejas.

Solo el contrato.

---

## 7. Compatibilidad

El Framework deberá funcionar con cualquier SessionResult.

No depender de:

* AtRep
* WinWin
* DA
* Lab_Con
* Lab_Con1

---

## 8. Comparaciones soportadas

Preparar soporte para:

* misma sesión / distintos módulos
* mismo módulo / distintos datasets
* misma configuración / distinta ventana
* distintas configuraciones
* replay
* simulación
* histórico
* futuras comparaciones IA

No implementar todavía simuladores.

Solo preparar la infraestructura.

---

## 9. Reproducibilidad

Toda comparación deberá poder reconstruirse únicamente utilizando:

* SessionResults
* criterios
* configuración

Nunca depender del estado del Tracker.

---

## 10. Extensibilidad

El Framework deberá permitir incorporar nuevos criterios de comparación mediante composición.

Evitar condicionales por tipo de motor.

---

# Restricciones

NO modificar:

* módulos existentes
* Runner
* Registry
* Session
* Dataset
* Historical Evidence
* SignalCollector
* Tracker
* Domain Tracker

No modificar algoritmos.

No modificar resultados.

No modificar la UI.

---

# Validaciones

Ejecutar:

* npm test
* npm run lint
* npm run build

Verificar:

* serialización
* reproducibilidad
* comparación determinística
* ausencia de regresiones

---

# Informe obligatorio

Generar:

```text
reports/

PHASE_6_B_5_LABORATORY_COMPARISON_EVIDENCE_FRAMEWORK.md
```

Debe contener:

## Resumen ejecutivo

## Modelo de Comparison

## Builder

## Comparator

## Metric Aggregator

## Evidence Report

## Decision Layer

## Compatibilidad

## Riesgos

## Próximos pasos

## Evidencia utilizada

---

# Criterios de aceptación

La fase será aceptada únicamente si:

✓ Existe LaboratoryComparison.

✓ Existe ComparisonBuilder.

✓ Existe ResultComparator.

✓ Existe MetricAggregator.

✓ Existe EvidenceReport.

✓ Existe Decision Layer.

✓ No cambia ningún algoritmo existente.

✓ No cambia ningún resultado existente.

✓ No cambia la UI.

✓ Toda comparación es reproducible.

✓ Tests, Build y Lint permanecen en verde.

---

# Requisitos arquitectónicos obligatorios

Antes de crear cualquier componente nuevo:

1. Buscar implementaciones reutilizables.
2. Extender antes de crear.
3. No duplicar infraestructura existente.
4. Justificar cada nueva abstracción en el informe.

No introducir lógica específica de AtRep, WinWin, DA o cualquier otro motor dentro del Framework.

El Framework debe ser completamente agnóstico al origen de los resultados.

---

# Estado final esperado

```text
LABORATORY COMPARISON FRAMEWORK IMPLEMENTED

EVIDENCE MODEL STABILIZED

READY FOR PHASE 6.B.6
```
