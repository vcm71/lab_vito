# FASE 6.B.2 — Laboratory Contracts & Registry Foundation

## Rol

Actúa como **Principal Software Architect**, **Senior Domain Architect** y **Lead Software Engineer** del proyecto **Roulette Tracker**.

La Fase 6.B.1 ya fue completada y certificó el estado actual del Laboratorio.

Toda decisión debe respetar estrictamente las conclusiones de dicha auditoría.

No debes rediseñar el Laboratorio.

Debes formalizar la arquitectura existente para convertirla en una plataforma extensible.

---

# Contexto

La auditoría confirmó que:

* El Laboratorio ya existe.
* Está compuesto por Lab_Con, Lab_Con1 y AtRep.
* Existe una capa de consenso basada en adaptadores y SignalCollector.
* Historical Evidence ya es un subsistema desacoplado.
* WinWin y DA ya son motores independientes.
* No existen dependencias Legacy activas.

Por lo tanto, el objetivo NO es crear un nuevo Laboratorio.

El objetivo es crear la infraestructura que permita registrar módulos de manera uniforme sin alterar el comportamiento existente.

---

# Objetivo principal

Crear la **Foundation** del Laboratorio.

Esta fase debe introducir únicamente la infraestructura arquitectónica necesaria para soportar módulos actuales y futuros.

NO debe modificar el funcionamiento observable del sistema.

---

# Objetivos específicos

## 1. Definir contratos del Laboratorio

Crear contratos comunes para:

* LaboratoryModule
* LaboratoryDataset
* LaboratoryRun
* LaboratoryResult
* LaboratoryMetric
* LaboratoryCapability
* LaboratoryContext

Los contratos deben representar únicamente las capacidades comunes.

No deben contener lógica.

---

## 2. Crear LaboratoryRegistry

Implementar un registro central responsable de:

* registrar módulos;
* consultar módulos;
* obtener capacidades;
* validar identificadores únicos;
* exponer módulos disponibles.

Debe permitir registrar módulos sin modificar código existente.

Ejemplo conceptual:

```ts
registry.register(module)

registry.get("AtRep")

registry.list()

registry.getCapabilities()
```

No utilizar condicionales del tipo:

```ts
if(module==="AtRep"){...}

if(module==="DA"){...}

if(module==="WinWin"){...}
```

---

## 3. Crear definición de módulo

Cada módulo deberá describirse mediante un manifiesto.

Debe incluir información como:

* id
* nombre
* versión
* categoría
* descripción
* capacidades
* contratos de entrada
* contratos de salida
* compatibilidad

Sin incluir lógica de negocio.

---

## 4. Crear LaboratoryRunner

Implementar un Runner responsable únicamente de:

* iniciar ejecuciones;
* crear contexto;
* registrar inicio y término;
* capturar errores;
* devolver resultados.

NO debe conocer la implementación de ningún motor.

Debe trabajar únicamente mediante contratos.

---

## 5. Crear LaboratoryContext

Crear un contexto común para las ejecuciones.

Debe encapsular:

* dataset;
* parámetros;
* configuración;
* servicios compartidos;
* información temporal.

Los motores no deberán acceder directamente al Tracker cuando puedan utilizar el contexto.

No modificar todavía los motores existentes.

---

## 6. Crear contratos de Dataset

Formalizar un Dataset reutilizable.

Debe permitir representar:

* sesiones;
* históricos;
* simulaciones;
* importaciones futuras.

No implementar persistencia.

Solo el contrato.

---

## 7. Crear contratos de Resultados

Todos los motores deberán poder devolver resultados compatibles.

Los resultados deberán incluir:

* módulo;
* versión;
* dataset utilizado;
* parámetros;
* métricas;
* timestamp;
* datos producidos.

No adaptar aún los motores existentes.

---

## 8. Crear contratos de Métricas

Formalizar una representación común para métricas.

Ejemplos:

* cobertura
* señales
* precisión
* confianza
* latencia
* tamaño de muestra

No calcular métricas nuevas.

---

## 9. Preparar puntos de extensión

Diseñar la infraestructura para permitir registrar en el futuro:

* AtRep
* Lab_Con
* Lab_Con1
* WinWin
* DA
* Historical Evidence
* Motores IA
* Simuladores
* Comparadores

Sin necesidad de modificar el núcleo del Laboratorio.

---

# Restricciones

NO modificar:

* AtRep
* Lab_Con
* Lab_Con1
* WinWin
* DA
* Historical Evidence
* SignalCollector
* Adaptadores
* Tracker
* Domain Tracker
* Motores existentes

No cambiar:

* interfaces públicas;
* comportamiento;
* flujo de ejecución;
* UI;
* EventBus;
* contratos existentes.

Esta fase agrega infraestructura.

No modifica funcionalidad.

---

# Validaciones obligatorias

Verificar que:

* Tests continúan en verde.
* Build continúa en verde.
* Lint continúa en verde.
* No existen regresiones.
* No cambia ningún resultado observable.

---

# Entregables

Generar:

```text
reports/

PHASE_6_B_2_LABORATORY_CONTRACTS_FOUNDATION.md
```

El informe debe contener:

* Resumen ejecutivo.
* Contratos creados.
* Registry implementado.
* Runner implementado.
* Context implementado.
* Dataset contract.
* Result contract.
* Metric contract.
* Puntos de extensión preparados.
* Riesgos detectados.
* Compatibilidad con B.1.
* Evidencia utilizada.

---

# Criterios de aceptación

La fase será considerada exitosa únicamente si:

✓ Ningún módulo existente cambia su comportamiento.

✓ No cambia la UI.

✓ No cambia la lógica de AtRep.

✓ No cambia la lógica de Lab_Con.

✓ No cambia la lógica de Lab_Con1.

✓ No cambia la lógica de WinWin.

✓ No cambia la lógica de DA.

✓ Historical Evidence permanece intacto.

✓ La infraestructura permite registrar nuevos módulos.

✓ La arquitectura queda preparada para las siguientes fases.

---

# Estado final esperado

La plataforma deberá disponer de una infraestructura formal del Laboratorio, manteniendo exactamente el mismo comportamiento funcional.

Resultado esperado:

```text
LABORATORY FOUNDATION COMPLETED

NO FUNCTIONAL REGRESSIONS

READY FOR PHASE 6.B.3
```
