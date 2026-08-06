# FASE 6.B.4 — Laboratory Session & Execution Model

## Rol

Actúa como **Principal Software Architect**, **Lead Software Engineer** y **Senior Domain Architect** del proyecto **Roulette Tracker**.

Las fases anteriores ya fueron completadas:

* Fase 6.B.1 — Laboratory Discovery
* Fase 6.B.2 — Foundation Assessment
* Fase 6.B.2B — Foundation Implementation
* Fase 6.B.3 — Module Registration

La infraestructura base ya existe.

Los módulos ya pueden registrarse.

El siguiente paso consiste en introducir el modelo operativo del Laboratorio.

---

# Objetivo principal

Implementar el concepto de **Laboratory Session**.

Una sesión representa una ejecución reproducible del Laboratorio.

Toda ejecución futura deberá realizarse dentro de una sesión.

---

# Principios

La Session NO es una pantalla.

La Session NO es un módulo.

La Session NO es un dataset.

La Session representa el contexto completo de una experimentación.

Debe ser reproducible.

Debe ser serializable.

Debe ser desacoplada del Tracker.

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
Modules
          │
          ▼
LaboratoryResults
```

---

# Objetivos específicos

## 1. LaboratorySession

Crear una entidad que represente una sesión completa.

Debe contener como mínimo:

* sessionId
* dataset
* modules
* parameters
* configuration
* executionMode
* metadata
* timestamps
* status

No debe contener lógica de negocio.

Debe ser serializable.

Debe ser inmutable.

---

## 2. SessionBuilder

Crear un Builder responsable de construir correctamente una sesión.

Debe validar:

* dataset válido
* módulos registrados
* parámetros
* configuración

No ejecutar módulos.

---

## 3. SessionLifecycle

Formalizar el ciclo de vida.

Estados mínimos:

```text
CREATED

READY

RUNNING

COMPLETED

FAILED

CANCELLED
```

No mezclar estados internos del Runner.

---

## 4. Integración con LaboratoryRunner

Modificar el Runner únicamente para aceptar una LaboratorySession como entrada.

El Runner no debe recibir múltiples parámetros sueltos.

Debe trabajar sobre una única Session.

---

## 5. SessionResult

Formalizar el resultado completo de una sesión.

Debe contener:

* Session
* módulos ejecutados
* resultados
* métricas
* duración
* errores
* metadata

No alterar LaboratoryResult.

SessionResult agrega resultados.

---

## 6. Dataset Provider

Verificar que Historical Evidence pueda iniciar correctamente una Session.

No modificar Historical Evidence.

Utilizar el provider ya registrado.

---

## 7. Ejecuciones múltiples

Una Session deberá permitir ejecutar:

* un módulo;
* varios módulos;
* módulos secuenciales;
* módulos independientes.

Sin modificar Runner posteriormente.

---

## 8. Compatibilidad

Verificar compatibilidad con:

* LaboratoryRegistry
* LaboratoryRunner
* LaboratoryContext
* LaboratoryDataset
* LaboratoryResult

No romper contratos existentes.

---

## 9. Persistencia

No implementar almacenamiento permanente.

Preparar únicamente la estructura necesaria para soportarlo en fases futuras.

---

## 10. Reproducibilidad

Toda Session debe poder reconstruirse utilizando únicamente:

* dataset;
* configuración;
* parámetros;
* módulos registrados.

No depender del estado del Tracker.

---

# Restricciones

NO modificar:

* Lab_Con
* Lab_Con1
* AtRep
* WinWin
* DA
* Historical Evidence
* SignalCollector
* Tracker
* Domain Tracker

No modificar algoritmos.

No modificar resultados.

No modificar UI.

No alterar contratos públicos.

---

# Validaciones

Ejecutar:

* npm test
* npm run lint
* npm run build

Verificar:

* compatibilidad completa;
* ausencia de regresiones;
* serialización correcta;
* reconstrucción correcta de sesiones.

---

# Informe obligatorio

Generar:

```text
reports/

PHASE_6_B_4_LABORATORY_SESSION_EXECUTION_MODEL.md
```

Debe incluir:

## Resumen ejecutivo

## Modelo de Session

## Lifecycle

## Builder

## Integración con Runner

## Compatibilidad

## Reproducibilidad

## Riesgos detectados

## Próximos pasos

## Evidencia utilizada

---

# Criterios de aceptación

La fase será aceptada únicamente si:

✓ Existe LaboratorySession.

✓ Existe SessionBuilder.

✓ Existe SessionLifecycle.

✓ Runner ejecuta mediante Session.

✓ Historical Evidence puede iniciar una Session.

✓ Los módulos continúan funcionando sin cambios.

✓ No cambia la UI.

✓ No cambian resultados.

✓ No cambian algoritmos.

✓ Tests, Build y Lint permanecen en verde.

---

# Estado final esperado

```text
LABORATORY SESSION MODEL IMPLEMENTED

EXECUTION MODEL STABILIZED

READY FOR PHASE 6.B.5
```

---

# Requisitos arquitectónicos obligatorios

Antes de crear cualquier componente nuevo:

1. Buscar una implementación reutilizable.
2. Extender antes de crear.
3. No duplicar infraestructura existente.
4. Justificar toda nueva clase en el informe final.

No introducir abstracciones que no aporten una responsabilidad claramente diferenciada.

Toda Session deberá ser independiente del estado del Tracker y ejecutable sobre cualquier `LaboratoryDataset`, ya provenga de Historical Evidence, simulaciones futuras o importaciones externas.
