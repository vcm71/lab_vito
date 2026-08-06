# PROMPT — Fase D.3

# Laboratory Replay Workspace

## Proyecto

**Roulette Tracker**

---

# Estado del proyecto

El módulo **Laboratory** posee actualmente los siguientes workspaces funcionales:

* Overview
* Experiments
* Sessions
* Comparison
* Evidence Explorer

Todos operan sobre la arquitectura certificada:

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

La siguiente fase consiste en implementar el **Replay Workspace**.

---

# Objetivo

Implementar un entorno que permita reproducir cronológicamente una ejecución del laboratorio utilizando únicamente datos reales expuestos por la capa Application.

Replay NO debe generar nuevas simulaciones.

Replay NO ejecuta motores.

Replay únicamente reconstruye y visualiza el historial de una ejecución existente.

Debe servir posteriormente como base para:

* AI Research
* Debugging
* Auditorías
* Validación científica
* Comparación temporal
* Análisis de decisiones

---

# Rol

Actúa como:

* Principal Software Architect
* Senior Frontend Engineer
* Senior Application Engineer
* UX Engineer
* Clean Architecture Reviewer
* Technical Auditor

---

# Regla arquitectónica principal

Replay jamás podrá acceder directamente al Domain.

Toda información deberá seguir exactamente este flujo:

```text
Domain
      │
Application
      │
LaboratoryOrchestrator
      │
LaboratoryBindingLayer
      │
Replay ViewModels
      │
Replay Workspace
```

No romper esta arquitectura.

---

# Primera tarea obligatoria

Antes de modificar cualquier archivo:

Realiza una auditoría completa.

Determina:

* qué representa actualmente una sesión;
* qué representa un experimento;
* qué eventos históricos existen;
* qué evidencias pueden reutilizarse;
* qué contratos públicos ya exponen secuencias temporales;
* qué ViewModels pueden reutilizarse;
* qué componentes de Comparison y Evidence Explorer pueden compartirse.

Genera un informe de auditoría.

No asumir.

Verificar.

---

# Concepto de Replay

Replay debe representar una ejecución histórica.

Cada reproducción debe estar formada por una secuencia ordenada de eventos.

No inventar eventos.

Utilizar únicamente información realmente existente.

---

# Replay ViewModel

Verificar si existe.

Si no existe:

crear la mínima implementación compatible.

Debe exponer únicamente información preparada para UI.

Nunca entidades del dominio.

Debe contener, cuando exista información real:

* replayId
* source
* timestamp
* currentStep
* totalSteps
* timeline
* playbackState
* selectedEvent
* metadata

No inventar propiedades innecesarias.

---

# Funcionalidades

Implementar:

## Explorador de Replay

Listado de reproducciones disponibles.

---

## Selección

Permitir seleccionar una reproducción.

---

## Timeline

Mostrar cronológicamente los eventos.

La timeline debe utilizar exclusivamente datos existentes.

---

## Panel de detalle

Al seleccionar un evento mostrar:

* información disponible;
* evidencia relacionada;
* experimento asociado;
* sesión asociada;
* comparación asociada (si existe).

No generar información sintética.

---

## Controles

Implementar:

* Play
* Pause
* Stop
* Step Forward
* Step Backward
* Go To Beginning
* Go To End

Los controles solo deben navegar por los datos existentes.

Nunca ejecutar nuevamente el experimento.

---

## Navegación temporal

Permitir avanzar y retroceder entre eventos.

Mantener sincronizado el panel de detalle.

---

## Sincronización

Cuando exista relación con:

* Evidence Explorer
* Comparison
* Sessions

debe mostrarse mediante referencias reutilizando ViewModels existentes.

No duplicar datos.

---

# Binding Layer

Auditar primero.

Solo crear métodos nuevos cuando realmente falten.

Ejemplos orientativos:

```text
loadReplay()

refreshReplay()

selectReplay()

playReplay()

pauseReplay()

stepForward()

stepBackward()

seekReplay()

stopReplay()
```

Utilizar la nomenclatura real del proyecto.

---

# Orchestrator

Ampliar únicamente cuando sea imprescindible.

Toda coordinación debe permanecer dentro de Application.

Nunca introducir lógica visual.

---

# Estados

Implementar:

* idle
* loading
* ready
* playing
* paused
* finished
* empty
* error

Reutilizar estados existentes siempre que sea posible.

---

# Timeline

Implementar una representación cronológica reutilizando el sistema visual existente.

Cada evento debe mostrar únicamente información disponible.

Nunca crear eventos ficticios.

---

# Integración

Replay debe reutilizar información proveniente de:

* Experiments
* Sessions
* Comparison
* Evidence Explorer

No duplicar ViewModels.

No crear una segunda representación de los mismos datos.

---

# Rendimiento

Evitar:

* reconstrucciones completas en cada render;
* cálculos repetidos;
* renderizados innecesarios;
* duplicación de estructuras temporales.

Mover transformaciones al Binding Layer cuando corresponda.

---

# Accesibilidad

Verificar:

* teclado
* focus
* aria
* timeline navegable
* botones accesibles

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
* Algoritmos
* Repositorios
* Bootstrap
* Shell
* Navegación
* Sistema visual

---

# Tests

Agregar únicamente los necesarios.

Cubrir:

* carga
* selección
* play
* pause
* stop
* step forward
* step backward
* seek
* timeline
* detalle
* errores
* estados
* sincronización con Evidence
* sincronización con Sessions
* sincronización con Comparison

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

No declarar éxito sin evidencia.

---

# Informe obligatorio

Crear:

```text
reports/FASE_D3_REPLAY_WORKSPACE_IMPLEMENTATION.md
```

Debe incluir:

1. Auditoría inicial.
2. Componentes reutilizados.
3. Contratos reutilizados.
4. ViewModels creados o ampliados.
5. Binding Layer.
6. Orchestrator.
7. Timeline.
8. Estados.
9. Integración con Evidence Explorer.
10. Integración con Comparison.
11. Integración con Sessions.
12. Tests ejecutados.
13. Resultado de lint.
14. Resultado de build.
15. Riesgos.
16. Deuda técnica.
17. Recomendaciones para D.4.

---

# Punto de control

Si todos los criterios se cumplen:

Crear:

```text
Fase_D3_cerrada.md
```

En caso contrario:

```text
Fase_D3_pendiente.md
```

indicando exactamente qué impide el cierre.

---

# Criterios de aceptación

La fase solo podrá declararse **CERRADA** cuando:

* Replay Workspace sea completamente funcional.
* La reproducción utilice exclusivamente datos reales.
* No exista acceso directo al Domain.
* La timeline funcione correctamente.
* Los controles funcionen.
* El panel de detalle funcione.
* Replay reutilice ViewModels existentes.
* No existan duplicaciones de datos.
* Los tests pasen.
* El lint pase.
* El build pase.
* No existan regresiones en:

  * Overview
  * Experiments
  * Sessions
  * Comparison
  * Evidence Explorer

---

# Preparación para D.4

La implementación debe dejar preparada la infraestructura para que **AI Research Workspace** pueda consumir Replay como una fuente de contexto temporal.

Replay debe convertirse en el registro cronológico oficial del Laboratory.

No implementar AI Research en esta fase.

---

# Instrucción final

Ejecutar el trabajo siguiendo estrictamente este orden:

```text
AUDITAR
→ IDENTIFICAR FUENTES TEMPORALES
→ DOCUMENTAR BRECHAS
→ DISEÑAR REPLAY VIEWMODEL
→ AMPLIAR BINDING LAYER
→ AMPLIAR ORCHESTRATOR (solo si es necesario)
→ IMPLEMENTAR REPLAY WORKSPACE
→ AGREGAR TESTS
→ VALIDAR
→ DOCUMENTAR
→ CERTIFICAR
```

Prioridades obligatorias:

```text
ARQUITECTURA
→ REUTILIZACIÓN
→ TRAZABILIDAD
→ TESTEABILIDAD
→ RENDIMIENTO
→ UX
```

No reinventes la arquitectura.

No generes implementaciones paralelas.

No dupliques datos ya representados en Evidence Explorer o Comparison.

Replay debe consolidarse como el **visor cronológico oficial** del módulo Laboratory y como la base arquitectónica para la futura **Fase D.4 — AI Research Workspace**.
