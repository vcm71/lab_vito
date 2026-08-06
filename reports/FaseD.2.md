# PROMPT — Fase D.2

# Laboratory Evidence Explorer

## Proyecto

**Roulette Tracker**

---

# Estado del proyecto

El **Bloque C — Laboratory Experience** se encuentra certificado.

La **Fase D.1 — Comparison Workspace** ha sido implementada y cerrada.

El proyecto dispone actualmente de:

* LaboratoryShell
* Navigation
* LaboratoryBindingLayer
* LaboratoryOrchestrator
* ViewModels
* Overview
* Experiments
* Sessions
* Comparison Workspace funcional

La siguiente etapa es:

> **D.2 — Evidence Explorer**

---

# Objetivo

Implementar el **Evidence Explorer** como el explorador oficial de evidencias producidas por los distintos componentes del sistema.

El propósito NO es generar nuevas evidencias.

El propósito es permitir:

* descubrirlas;
* filtrarlas;
* inspeccionarlas;
* navegar entre ellas;
* reutilizarlas desde la interfaz.

Siempre utilizando la arquitectura existente.

---

# Rol

Actúa como:

* Principal Software Architect
* Senior Frontend Engineer
* Senior Application Engineer
* Clean Architecture Reviewer
* UX Engineer
* Technical Auditor

---

# Principio fundamental

El Evidence Explorer NO debe acceder nunca al Domain.

Toda la información deberá llegar mediante:

```text
Domain
      │
Application
      │
LaboratoryOrchestrator
      │
LaboratoryBindingLayer
      │
Evidence ViewModels
      │
Evidence Explorer
```

No romper este flujo.

---

# Primera tarea obligatoria

Antes de escribir código:

Audita completamente el repositorio.

Determina:

* dónde se generan evidencias;
* qué tipos de evidencia existen;
* qué repositorios las contienen;
* qué contratos públicos ya las exponen;
* qué ViewModels existen;
* qué capacidades faltan.

No asumir.

Verificar.

Generar un informe inicial de auditoría.

---

# Tipos de evidencia

Descubrir automáticamente los tipos existentes.

Por ejemplo:

* resultados experimentales
* métricas
* estadísticas
* logs
* snapshots
* reportes
* sesiones
* comparaciones
* validaciones
* diagnósticos

No inventar categorías.

Usar únicamente las reales.

---

# Evidence ViewModel

Verificar si existe.

Si no existe:

crear la mínima implementación compatible.

Debe representar únicamente información preparada para UI.

Nunca entidades del dominio.

---

# Funcionalidades

Implementar:

## Exploración

Mostrar listado de evidencias.

## Agrupación

Agrupar por tipo cuando sea posible.

## Búsqueda

Implementar búsqueda local reutilizando el sistema existente.

No incorporar motores externos.

## Filtros

Filtrar por:

* tipo
* fecha
* origen
* estado

Solo cuando dichos datos existan realmente.

## Ordenamiento

Permitir ordenar por:

* fecha
* nombre
* tipo

Si el modelo lo soporta.

---

# Vista detalle

Cada evidencia debe disponer de una vista de detalle.

Debe mostrar únicamente información existente.

Nunca datos sintéticos.

---

# Navegación

Permitir:

* abrir evidencia
* volver al listado
* conservar selección cuando el patrón existente ya lo permita

No modificar el sistema global de navegación.

---

# Binding Layer

Verificar si existen métodos equivalentes.

Solo crear nuevos cuando realmente falten.

Ejemplos orientativos:

```text
loadEvidence()

refreshEvidence()

selectEvidence()

clearEvidenceSelection()

searchEvidence()

filterEvidence()
```

Usar la nomenclatura real del proyecto.

---

# Orchestrator

Extender únicamente cuando sea imprescindible.

No mover lógica visual.

No acceder directamente a repositorios desde UI.

---

# Estados

Implementar:

* loading
* empty
* ready
* error
* no-results

Reutilizar estados existentes cuando sea posible.

---

# Rendimiento

Evitar:

* renders innecesarios
* transformaciones repetidas
* filtros costosos en render

Mover la lógica al Binding Layer o ViewModels.

---

# Accesibilidad

Verificar:

* teclado
* aria
* focus
* contraste
* navegación

Corregir únicamente lo necesario.

---

# Responsive

Mantener compatibilidad con:

* Desktop
* Tablet

No rediseñar Laboratory.

---

# Compatibilidad

No modificar:

* Domain
* Motores estadísticos
* Casos de uso
* Repositorios
* Algoritmos
* Shell
* Navegación
* Bootstrap
* Sistema visual

---

# Tests

Agregar únicamente los necesarios.

Cubrir:

* carga
* búsqueda
* filtros
* agrupación
* detalle
* selección
* estados
* errores

No duplicar cobertura existente.

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

Ejecutar además cualquier validación arquitectónica disponible.

No declarar éxito si no fueron ejecutadas.

---

# Informe obligatorio

Generar:

```text
reports/FASE_D2_EVIDENCE_EXPLORER_IMPLEMENTATION.md
```

Debe contener:

1. Auditoría inicial.
2. Evidencias encontradas.
3. Arquitectura utilizada.
4. ViewModels.
5. Binding Layer.
6. Orchestrator.
7. Componentes.
8. Estados.
9. Tests.
10. Lint.
11. Build.
12. Riesgos.
13. Deuda técnica.
14. Recomendaciones para D.3.

---

# Punto de control

Si la implementación cumple todos los criterios:

Crear:

```text
Fase_D2_cerrada.md
```

Si existen limitaciones relevantes:

Crear:

```text
Fase_D2_pendiente.md
```

explicando exactamente qué impide el cierre.

---

# Criterios de aceptación

La fase solo podrá declararse **CERRADA** cuando:

* el Evidence Explorer sea completamente funcional;
* todas las evidencias provengan exclusivamente de ViewModels;
* no exista acceso directo al Domain;
* los filtros funcionen;
* la búsqueda funcione;
* el detalle funcione;
* los tests pasen;
* el lint pase;
* el build pase;
* no existan regresiones en Overview, Experiments, Sessions y Comparison;
* la documentación quede generada.

---

# Preparación para D.3

La implementación debe dejar preparada la infraestructura para que la siguiente fase:

> **D.3 — Replay Workspace**

pueda reutilizar el mismo modelo de evidencias, evitando duplicar lógica o contratos.

No implementar Replay durante esta fase.

---

# Instrucción final

Ejecutar el trabajo siguiendo estrictamente este orden:

```text
AUDITAR
→ IDENTIFICAR EVIDENCIAS
→ DOCUMENTAR BRECHAS
→ DISEÑAR VIEWMODELS
→ AMPLIAR BINDING LAYER
→ AMPLIAR ORCHESTRATOR (solo si es necesario)
→ IMPLEMENTAR EVIDENCE EXPLORER
→ AGREGAR TESTS
→ VALIDAR
→ DOCUMENTAR
→ CERTIFICAR
```

No reinventes la arquitectura.

No generes implementaciones paralelas.

Toda ampliación debe integrarse sobre la infraestructura certificada del Bloque C y las capacidades ya implementadas en D.1.
