# FASE 6.B.2B — Laboratory Foundation Implementation

## Rol

Actúa como **Principal Software Architect**, **Lead Software Engineer** y **Senior Domain Architect** del proyecto **Roulette Tracker**.

Las fases anteriores ya fueron certificadas:

* Fase 6.B.1 → Discovery Audit
* Fase 6.B.2 → Foundation Assessment

La auditoría demostró que gran parte de la infraestructura requerida ya existe bajo otros nombres (EngineRegistry, CalibrationContext, MetricRegistry, CalibrationStrategyRegistry, Historical Evidence, etc.).

Tu objetivo NO es crear una arquitectura paralela.

Tu objetivo es **implementar la Foundation del Laboratorio reutilizando y extendiendo la infraestructura existente siempre que sea posible.**

---

# Principio rector

Antes de crear cualquier clase, interfaz o contrato, seguir obligatoriamente este orden:

1. Buscar una implementación existente.
2. Evaluar si puede reutilizarse directamente.
3. Si no es suficiente, extenderla.
4. Crear una implementación nueva únicamente cuando no exista una alternativa razonable.

Cada decisión debe justificarse en el informe final.

No duplicar infraestructura.

---

# Objetivo

Implementar la infraestructura base del Laboratorio sin modificar el comportamiento funcional del sistema.

La implementación debe dejar preparada la plataforma para integrar módulos experimentales en fases posteriores.

---

# Objetivos específicos

## 1. Registry

Analizar `EngineRegistry`.

Si puede extenderse:

* reutilizarlo.

Si no puede:

* implementar un `LaboratoryRegistry`.

La decisión debe estar documentada.

El resultado deberá permitir:

* registrar módulos;
* consultarlos;
* listar módulos;
* consultar capacidades.

---

## 2. Context

Analizar `CalibrationContext`.

Determinar si puede evolucionar hacia un contexto reutilizable para el Laboratorio.

Si no es posible:

crear `LaboratoryContext`.

Debe permanecer inmutable.

No depender directamente del Tracker.

---

## 3. Dataset

Analizar:

* CalibrationDataset
* CalibrationDatasetBuilder

Determinar si pueden convertirse en la base del Dataset del Laboratorio.

No duplicar contratos.

---

## 4. Result

Analizar:

* CalibrationModel
* CalibrationResultFactory

Reutilizar si es posible.

Solo crear contratos nuevos cuando sea estrictamente necesario.

---

## 5. Metric

Analizar:

MetricRegistry.

Evitar crear un segundo sistema de métricas.

Si es posible, extender el catálogo existente.

---

## 6. Runner

Implementar un Runner únicamente si no existe un componente equivalente.

El Runner deberá:

* iniciar ejecuciones;
* construir contexto;
* invocar módulos;
* capturar errores;
* registrar resultados.

No deberá conocer implementaciones concretas.

Solo contratos.

---

## 7. Module Manifest

Crear una definición común para módulos del Laboratorio.

Debe incluir:

* id
* nombre
* versión
* descripción
* categoría
* capacidades
* compatibilidad
* contratos soportados

No contener lógica.

---

## 8. Extensibilidad

La infraestructura debe permitir registrar posteriormente:

* Lab_Con
* Lab_Con1
* AtRep
* WinWin
* DA
* Historical Evidence
* Simuladores
* Motores IA

Sin modificar el núcleo.

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
* Adaptadores
* Tracker
* Domain Tracker

No alterar:

* resultados;
* interfaz;
* contratos públicos;
* comportamiento observable.

Toda implementación debe ser lateral y compatible.

---

# Validaciones

Ejecutar:

* npm test
* npm run lint
* npm run build

Confirmar que no existen regresiones.

---

# Informe obligatorio

Generar:

```text
reports/

PHASE_6_B_2B_LABORATORY_FOUNDATION_IMPLEMENTATION.md
```

Debe incluir:

## Resumen ejecutivo

## Componentes reutilizados

## Componentes extendidos

## Componentes nuevos

## Justificación de cada decisión

## Compatibilidad con B.1

## Compatibilidad con B.2

## Riesgos

## Próximos pasos

## Evidencia utilizada

---

# Criterios de aceptación

La fase será aceptada únicamente si:

✓ No existen duplicaciones innecesarias.

✓ Se reutiliza la infraestructura existente cuando sea posible.

✓ La Foundation queda implementada.

✓ No cambia ningún comportamiento funcional.

✓ No cambian resultados.

✓ No cambian contratos públicos.

✓ Tests, Build y Lint continúan en verde.

✓ La plataforma queda preparada para registrar módulos del Laboratorio.

---

# Estado final esperado

```text
LABORATORY FOUNDATION IMPLEMENTED

BACKWARD COMPATIBILITY VERIFIED

READY FOR PHASE 6.B.3
```
