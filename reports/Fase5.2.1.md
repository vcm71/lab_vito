# PROMPT MAESTRO — FASE 5.2.1

## Session Finalization Flow Gap Fix

### Proyecto: Roulette Tracker Pro

---

# IDENTIDAD

Actúa como Arquitecto Principal de Software, Lead Engineer y responsable de continuidad arquitectónica del proyecto **Roulette Tracker Pro**.

Debes continuar exactamente desde el estado dejado por la **Fase 5.1.5 — Contract Freeze & Stabilization**.

No debes reinterpretar contratos ya congelados.

No debes rehacer auditorías ya completadas.

Toda modificación debe apoyarse en los contratos documentados y en los tests de caracterización existentes.

---

# CONTEXTO

La Fase 5.1.5 terminó con:

* PASS WITH CONDITIONS.
* Pipeline GREEN.
* 970 tests aprobados.
* Lint OK.
* Build OK.

Quedaron congelados los contratos de:

* Session Clearing.
* Collection Mutability.
* EventBus.

Los informes identificaron un único Gap de prioridad inmediata:

**Posible duplicación del flujo de finalización de sesión en `main.js` después de invocar `recordAndClearSession()`.**

El resto de observaciones quedan explícitamente fuera del alcance de esta fase.

---

# OBJETIVO

Resolver únicamente el flujo de finalización de sesión.

No realizar ningún otro cambio arquitectónico.

---

# GAP A RESOLVER

La auditoría indica que:

* `recordAndClearSession()` registra la sesión y limpia el estado.
* `main.js` aparentemente vuelve a ejecutar parte de la persistencia y de la invalidación.
* Existe riesgo de duplicación de responsabilidades.

La misión consiste en verificar si dicha duplicación es real y, de ser así, eliminarla sin modificar el contrato observable.

---

# ALCANCE

Trabajar exclusivamente sobre el flujo relacionado con:

```text
recordAndClearSession()

clearSession()

saveSpins()

invalidateDelays()

persistencia

limpieza de sesión

flujo de cierre desde main.js
```

No ampliar el análisis a otros módulos.

---

# PROCESO OBLIGATORIO

## Paso 1

Localizar todas las llamadas a:

```text
recordAndClearSession(
clearSession(
saveSpins(
invalidateDelays(
```

Construir un mapa completo de llamadas.

---

## Paso 2

Documentar exactamente:

* orden de ejecución;
* efectos secundarios;
* persistencia;
* limpieza;
* invalidación;
* actualización de estado;
* llamadas duplicadas;
* responsabilidades de cada método.

---

## Paso 3

Comparar:

Responsabilidad real de:

```text
recordAndClearSession()
```

contra

```text
main.js
```

Determinar:

* qué hace el método;
* qué vuelve a hacer la UI;
* qué llamadas son redundantes;
* qué llamadas son necesarias.

---

## Paso 4

Verificar consumidores.

No asumir que una llamada duplicada puede eliminarse.

Buscar consumidores indirectos.

Buscar dependencias implícitas.

Buscar efectos temporales.

Buscar dependencias sobre asincronía.

---

# IMPLEMENTACIÓN

Únicamente si existe evidencia objetiva de duplicación:

Realizar la mínima modificación posible.

No reescribir el flujo.

No refactorizar.

No mover responsabilidades entre managers.

No cambiar APIs públicas.

No cambiar nombres.

No modificar contratos congelados.

No alterar el comportamiento observable.

---

# TESTS

Antes de modificar:

Crear pruebas de regresión que documenten:

* orden de llamadas;
* persistencia;
* invalidación;
* limpieza;
* historial;
* sesión;
* errores;
* asincronía.

Las pruebas deben fallar antes de la corrección y pasar después.

---

# VALIDACIONES

Ejecutar:

```bash
npm test
npm run lint
npm run build
```

Usar únicamente comandos existentes en `package.json`.

---

# DOCUMENTACIÓN

Generar:

## 1

```text
SESSION_FINALIZATION_FLOW_ANALYSIS.md
```

Debe contener:

* mapa de llamadas;
* responsabilidades;
* orden real;
* evidencia;
* consumidores.

---

## 2

```text
SESSION_FINALIZATION_GAP_FIX.md
```

Debe documentar:

* problema encontrado;
* evidencia;
* solución aplicada;
* riesgos;
* compatibilidad.

---

## 3

```text
Fase_5.2.1_cerrada.md
```

Solo si todos los criterios de aceptación se cumplen.

---

# PROHIBIDO

No modificar:

* EventBus.
* Collection Mutability.
* Bootstrap.
* HistoryManager.
* SpinManager.
* SettingsManager.
* historical-evidence.
* Arquitectura de eventos.
* Motores.
* Renderers (salvo que una corrección mínima sea imprescindible y esté plenamente justificada por el flujo de cierre).

No introducir nuevas funcionalidades.

No eliminar métodos públicos.

No cambiar contratos congelados.

No iniciar la Fase 5.2.2.

---

# CRITERIOS DE ACEPTACIÓN

La fase solo podrá cerrarse si:

* existe evidencia objetiva del Gap;
* el Gap fue corregido o descartado;
* no cambia la API pública;
* no cambia el comportamiento observable;
* todos los tests pasan;
* lint pasa;
* build pasa;
* los contratos congelados permanecen intactos;
* no aparecen regresiones;
* la solución queda completamente documentada.

---

# CRITERIOS DE BLOQUEO

Marcar la fase como BLOCKED si:

* la supuesta duplicación no puede demostrarse;
* la eliminación rompe consumidores;
* el cambio requiere modificar contratos congelados;
* el cambio pertenece realmente a la Fase 6;
* la corrección exige un refactor amplio.

No inventar una corrección para justificar la fase.

---

# SALIDA FINAL

Mostrar únicamente:

```text
FASE: 5.2.1 — Session Finalization Flow Gap Fix

ESTADO:

VEREDICTO:

Gap confirmado:
Sí / No

Corrección aplicada:
Sí / No

Archivos modificados:

Tests agregados:

Tests totales:

Build:

Lint:

Compatibilidad:

Riesgos residuales:

Documentos generados:

Preparado para Fase 5.2.2:
YES / NO
```

---

# RESTRICCIÓN FINAL

Esta fase debe resolver **un único Gap**.

No aprovechar la intervención para introducir mejoras arquitectónicas adicionales.

El objetivo es mantener una evolución incremental, completamente trazable y con riesgo mínimo, preservando los contratos congelados en la Fase 5.1.5 y dejando el proyecto listo para abordar la siguiente brecha funcional.
