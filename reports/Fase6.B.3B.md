# FASE 6.B.3 — Laboratory Module Registration

## Rol

Actúa como **Principal Software Architect**, **Lead Software Engineer** y **Senior Domain Architect** del proyecto **Roulette Tracker**.

La Foundation del Laboratorio ya fue implementada y validada.

Existe ahora una infraestructura compuesta por:

* LaboratoryRegistry
* LaboratoryRunner
* LaboratoryContext
* LaboratoryDataset
* LaboratoryResult
* LaboratoryMetric
* LaboratoryModuleManifest

El objetivo de esta fase es comenzar a utilizar esa infraestructura registrando los módulos reales del Laboratorio.

No se debe modificar la lógica de negocio de ningún motor.

---

# Objetivo principal

Registrar formalmente los módulos existentes dentro del LaboratoryRegistry utilizando la infraestructura creada en la fase anterior.

El comportamiento observable del sistema debe permanecer idéntico.

---

# Principios

Cada módulo debe comportarse como un plugin.

No modificar algoritmos.

No modificar cálculos.

No modificar resultados.

No modificar UI.

La integración debe realizarse mediante composición y adaptadores.

---

# Módulos a registrar

Registrar los siguientes módulos:

* Lab_Con
* Lab_Con1
* AtRep
* WinWin
* DA

Cada registro debe utilizar un LaboratoryModuleManifest.

---

# Historical Evidence

No registrarlo como motor.

Debe registrarse como proveedor oficial de datasets.

Debe poder proporcionar datasets al LaboratoryRunner sin depender directamente del Tracker.

No modificar Historical Evidence.

---

# LaboratoryModuleManifest

Cada módulo debe declarar al menos:

* id
* name
* version
* description
* category
* capabilities
* supportedContracts
* compatibility
* implementation
* adapter (si corresponde)

No incluir lógica de negocio.

---

# Integración con LaboratoryRegistry

Cada módulo deberá registrarse mediante la API del Registry.

Ejemplo conceptual:

```ts
registry.register({
    manifest,
    implementation,
    adapter
});
```

Evitar cualquier tipo de registro manual distribuido.

---

# Runner

Verificar que LaboratoryRunner pueda ejecutar correctamente cada módulo registrado.

Si un módulo utiliza:

* execute()
* run()
* adapter
* implementation

La adaptación deberá realizarse mediante composición.

No modificar el motor.

---

# Adaptadores

Si algún módulo necesita adaptación para cumplir el contrato del Runner:

Crear un adapter específico.

Nunca modificar el algoritmo original.

---

# Dataset

Verificar que todos los módulos puedan recibir un LaboratoryDataset.

Si actualmente utilizan:

tracker.getSpins()

o

DomainTracker

La adaptación deberá realizarse mediante Context o Adapter.

No modificar todavía los motores.

---

# Resultados

Cada ejecución deberá devolver un LaboratoryResult.

Debe contener:

* moduleId
* runId
* dataset
* output
* metrics
* metadata
* timestamps
* estado

---

# Métricas

Reutilizar LaboratoryMetric.

No crear un segundo sistema.

---

# Descubrimiento dinámico

Al finalizar la fase deberá ser posible ejecutar:

```ts
registry.list()
```

y obtener automáticamente todos los módulos registrados.

El sistema no deberá depender de listas codificadas manualmente.

---

# Validaciones

Verificar:

* registro correcto;
* ejecución correcta;
* aislamiento entre módulos;
* compatibilidad con consenso;
* compatibilidad con Historical Evidence.

Ejecutar:

* npm test
* npm run lint
* npm run build

---

# Restricciones

NO modificar:

* algoritmos de Lab_Con;
* algoritmos de Lab_Con1;
* algoritmos de AtRep;
* algoritmos de WinWin;
* algoritmos de DA;
* SignalCollector;
* Historical Evidence;
* Tracker;
* Domain Tracker.

No modificar resultados.

No modificar comportamiento observable.

No modificar la UI.

---

# Informe obligatorio

Generar:

```text
reports/

PHASE_6_B_3_LABORATORY_MODULE_REGISTRATION.md
```

El informe deberá contener:

## Resumen ejecutivo

## Módulos registrados

## Adaptadores utilizados

## Compatibilidad con Foundation

## Compatibilidad con Consensus

## Compatibilidad con Historical Evidence

## Resultados de validación

## Riesgos detectados

## Evidencia utilizada

---

# Criterios de aceptación

La fase será aceptada únicamente si:

✓ Todos los módulos aparecen registrados en LaboratoryRegistry.

✓ Historical Evidence funciona como proveedor de datasets.

✓ LaboratoryRunner puede ejecutar módulos registrados.

✓ No cambia el comportamiento funcional.

✓ No cambian los resultados.

✓ No cambia la UI.

✓ No se modifica la lógica interna de los motores.

✓ Tests, Build y Lint continúan en verde.

✓ La plataforma queda preparada para ejecutar módulos del Laboratorio mediante una infraestructura común.

---

# Estado final esperado

```text
LABORATORY MODULES REGISTERED

FOUNDATION OPERATIONAL

READY FOR PHASE 6.B.4
```
