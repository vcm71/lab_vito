# FASE 6.B.1 — Laboratory Discovery & Architecture Audit

## Rol

Actúa como **Principal Software Architect**, **Senior Domain Architect** y **Technical Auditor** del proyecto **Roulette Tracker**.

No eres un generador de código.

Eres un arquitecto encargado de realizar una auditoría completa del estado actual del Laboratorio antes de iniciar cualquier integración.

Tu prioridad absoluta es **comprender**, **documentar** y **certificar** el estado actual del sistema.

No debes modificar comportamiento alguno.

---

# Contexto

La plataforma acaba de finalizar exitosamente la migración completa hacia **Domain Tracker**.

Estado certificado:

* Domain Tracker consolidado.
* Legacy eliminado funcionalmente.
* No existen adapters Legacy.
* No existen wrappers Legacy.
* No existen dependencias Legacy en runtime.
* Los contratos públicos fueron estabilizados.
* Pipeline estable.
* Tests en verde.
* Build en verde.
* Lint en verde.

A partir de este punto comienza la **Fase 6**, cuyo objetivo es expandir capacidades sin modificar la estabilidad alcanzada.

El siguiente bloque del roadmap corresponde al **Laboratorio**.

El Laboratorio será una plataforma experimental desacoplada desde la cual podrán ejecutarse motores estadísticos, simulaciones, comparativas y futuras capacidades de IA.

NO debe alterar el funcionamiento normal de Roulette Tracker.

---

# Objetivo de esta fase

Realizar una auditoría arquitectónica completa del estado actual del Laboratorio.

Esta fase es únicamente de descubrimiento.

No se implementa ninguna funcionalidad nueva.

No se mueve código.

No se refactoriza.

No se renombran módulos.

No se cambian contratos.

No se modifica comportamiento.

El resultado esperado es conocer exactamente qué existe hoy.

---

# Alcance de la auditoría

Auditar completamente los módulos relacionados con:

* Laboratorio
* AtRep
* Historical Evidence
* DA
* WinWin
* Motores experimentales existentes
* Componentes auxiliares
* Pantallas relacionadas
* Hooks
* Stores
* Servicios
* Adaptadores
* Providers
* Presenters
* Contratos utilizados
* Modelos de datos
* Flujo de ejecución
* Dependencias

---

# Objetivos específicos

Determinar:

## 1. Estado del Laboratorio

Responder:

* ¿Existe actualmente un Laboratorio?
* ¿Es solamente una pantalla?
* ¿Es un módulo?
* ¿Es una carpeta?
* ¿Es un conjunto de componentes?
* ¿Qué responsabilidades posee?
* ¿Qué dependencias tiene?

---

## 2. AtRep

Determinar:

* ubicación
* arquitectura
* responsabilidades
* entradas
* salidas
* dependencias
* estado compartido
* integración con Tracker
* integración con Domain
* posibilidad de convertirse en módulo independiente

---

## 3. Historical Evidence

Analizar:

* origen de datos
* almacenamiento
* contratos
* formato
* responsabilidades
* reutilización
* acoplamiento
* posibilidades de transformarse en proveedor oficial de datasets

---

## 4. DA

Analizar:

* cálculos
* algoritmos
* separación entre UI y lógica
* contratos utilizados
* reutilización
* dependencias

---

## 5. WinWin

Analizar:

* arquitectura
* integración
* contratos
* estado
* dependencias
* posibilidades de replay
* posibilidades de backtesting

---

## 6. Motores experimentales

Localizar cualquier motor experimental existente.

Documentar:

* propósito
* dependencias
* estado
* uso
* integración

---

## 7. Dependencias

Construir el mapa de dependencias entre:

Tracker

↓

Domain

↓

Motores

↓

Laboratorio

↓

UI

Identificar:

* dependencias directas
* dependencias inversas
* dependencias circulares
* dependencias ocultas

---

## 8. Contratos

Localizar todos los contratos utilizados por los módulos anteriores.

Determinar:

* DTO
* interfaces
* modelos
* tipos
* eventos
* colecciones
* snapshots
* getters
* servicios

---

## 9. Estado compartido

Determinar:

Qué información es compartida.

Qué información es mutable.

Qué información proviene del Domain Tracker.

Qué información pertenece únicamente a la interfaz.

---

## 10. Riesgos arquitectónicos

Detectar:

* alto acoplamiento
* duplicación
* lógica repetida
* responsabilidades mezcladas
* componentes demasiado grandes
* dependencias innecesarias
* posibles problemas futuros para la integración del Laboratorio

No modificar ninguno.

Solo documentarlos.

---

# Qué NO hacer

No crear carpetas.

No mover archivos.

No crear módulos.

No cambiar nombres.

No modificar interfaces.

No cambiar contratos.

No agregar EventBus.

No integrar módulos.

No refactorizar.

No optimizar.

No eliminar código.

No corregir problemas.

No generar deuda técnica nueva.

No tocar comportamiento existente.

---

# Evidencia requerida

Toda afirmación debe estar respaldada por evidencia.

Cada conclusión debe incluir:

* archivo
* carpeta
* componente
* línea aproximada
* dependencia encontrada

No asumir absolutamente nada.

Si algo no puede demostrarse mediante evidencia:

Indicar explícitamente:

**"No existe evidencia suficiente."**

---

# Entregables

Generar:

```
reports/

PHASE_6_B_1_LABORATORY_DISCOVERY_AUDIT.md
```

El informe debe contener como mínimo:

## Resumen ejecutivo

## Arquitectura encontrada

## Mapa del Laboratorio

## Inventario de módulos

## Inventario de contratos

## Inventario de datasets

## Inventario de motores

## Dependencias

## Estado compartido

## Riesgos

## Oportunidades

## Recomendaciones para B.2

## Evidencia utilizada

---

# Criterios de aceptación

La auditoría será considerada exitosa únicamente si:

✓ No se modifica código.

✓ No cambia ningún comportamiento.

✓ No cambian contratos.

✓ No cambia la UI.

✓ No cambian tests.

✓ No cambia build.

✓ No cambia lint.

✓ Se documenta completamente el estado actual.

✓ Se identifican todos los candidatos a integrarse en el Laboratorio.

✓ Se obtiene una visión arquitectónica completa para iniciar la siguiente fase.

---

# Resultado esperado

El repositorio debe permanecer funcionalmente idéntico.

La única salida debe ser un informe arquitectónico completo que permita diseñar el Laboratorio sobre evidencia y no sobre supuestos.

Estado final esperado:

```
AUDIT COMPLETED

NO FUNCTIONAL CHANGES

READY FOR PHASE 6.B.2
```
