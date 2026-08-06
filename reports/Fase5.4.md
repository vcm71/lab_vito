# PROMPT MAESTRO — FASE 5.4

# Engine Migration

## Proyecto: Roulette Tracker Pro

---

# 1. IDENTIDAD

Actúa como:

* Arquitecto Principal de Software.
* Lead Software Engineer.
* Especialista en Clean Architecture.
* Especialista en migraciones incrementales.
* Auditor de dependencias.
* Responsable de continuidad arquitectónica del proyecto Roulette Tracker Pro.

Repositorio de trabajo:

```text
/home/shared/lab_vito
```

Toda modificación deberá preservar:

* Domain Tracker.
* Contratos congelados.
* Compatibilidad pública.
* Pipeline GREEN.
* 970+ tests.
* Lint.
* Build.

---

# 2. CONTEXTO

Las fases anteriores concluyeron:

* Fase 5.1 ✓
* Fase 5.1.5 ✓
* Fase 5.2.1 ✓
* Fase 5.2.2 ✓
* Fase 5.3 ✓

Las auditorías demostraron que varias tareas previstas por el roadmap ya estaban resueltas antes de intervenir.

Por tanto, esta fase no debe asumir migraciones pendientes.

Debe demostrarlas primero.

---

# 3. OBJETIVO

Completar la migración definitiva de todos los motores al Domain Tracker.

Pero únicamente cuando exista evidencia de que aún quedan motores parcialmente migrados.

Si un motor ya está completamente migrado:

* documentarlo;
* no modificarlo.

---

# 4. PRINCIPIO OBLIGATORIO

```text
NO MIGRAR POR SUPOSICIÓN.

PRIMERO DEMOSTRAR.

DESPUÉS MODIFICAR.
```

---

# 5. ETAPA A — ENGINE MIGRATION READINESS AUDIT

Inventariar absolutamente todos los motores.

Localizar:

* engines
* analytics
* renderers
* adapters
* helpers
* managers
* plugins

Construir un catálogo completo.

Para cada uno indicar:

* nombre;
* ubicación;
* consumidor;
* estado.

Clasificación:

```text
FULLY_MIGRATED
PARTIALLY_MIGRATED
LEGACY_DEPENDENCY
DOMAIN_ONLY
UNKNOWN
```

---

# 6. ETAPA B — DEPENDENCIAS

Para cada motor determinar:

* de dónde obtiene los spins;
* de dónde obtiene sesiones;
* de dónde obtiene historial;
* de dónde obtiene configuración;
* si consume Domain Tracker;
* si consume Bootstrap;
* si consume wrappers;
* si conserva adaptadores antiguos;
* si conserva compatibilidad Legacy;
* si depende de estructuras obsoletas.

---

# 7. ETAPA C — MATRIZ

Construir:

| Motor | Fuente de datos | Tracker utilizado | Estado | Riesgo | Acción |

Acción:

```text
NO_ACTION
REMOVE_WRAPPER
REMOVE_ADAPTER
MIGRATE
DEPRECATE
DOCUMENT_ONLY
```

---

# 8. ETAPA D — IMPLEMENTACIÓN

Solo intervenir motores clasificados como:

```text
PARTIALLY_MIGRATED
LEGACY_DEPENDENCY
```

No tocar motores:

```text
FULLY_MIGRATED
DOMAIN_ONLY
```

---

# 9. IMPLEMENTACIÓN

Si existen motores pendientes:

Realizar únicamente cambios mínimos.

Eliminar:

* wrappers innecesarios;
* adapters muertos;
* capas de transición;
* compatibilidad obsoleta.

No cambiar:

* lógica estadística;
* comportamiento observable;
* interfaces públicas.

---

# 10. PROHIBIDO

No modificar:

* Domain Tracker.
* EventBus.
* Historical Evidence.
* Contratos de mutabilidad.
* Session Clearing.
* Arquitectura de persistencia.
* Motores completamente migrados.

No introducir nuevas funcionalidades.

---

# 11. TESTS

Antes de modificar:

Agregar pruebas cuando sean necesarias para congelar el comportamiento.

Después:

Ejecutar:

```bash
npm test
npm run lint
npm run build
```

No utilizar comandos inexistentes.

---

# 12. VALIDACIONES

Verificar:

* ningún motor perdió funcionalidad;
* todos utilizan Domain Tracker;
* no quedan wrappers innecesarios;
* no quedan adapters muertos;
* no existen imports Legacy;
* la API pública permanece intacta;
* el comportamiento observable no cambia.

---

# 13. DOCUMENTACIÓN

Generar:

## ENGINE_MIGRATION_AUDIT.md

Inventario completo.

---

## ENGINE_MIGRATION_MATRIX.md

Estado de todos los motores.

---

## ENGINE_MIGRATION_IMPLEMENTATION.md

Cambios realizados.

---

## ENGINE_DEPENDENCY_GRAPH.md

Relación completa entre motores y Domain Tracker.

---

## Fase_5.4_cerrada.md

Solo si la fase puede cerrarse.

---

# 14. CRITERIOS DE ACEPTACIÓN

La fase será exitosa únicamente si:

* todos los motores fueron auditados;
* todas las dependencias quedaron clasificadas;
* solo se modificaron motores realmente pendientes;
* no cambia la API pública;
* todos los tests pasan;
* lint pasa;
* build pasa;
* no aparecen regresiones;
* la arquitectura queda simplificada.

---

# 15. CONDICIONES DE BLOQUEO

Marcar:

```text
BLOCKED
```

si:

* un motor no puede clasificarse;
* existe una dependencia dinámica imposible de resolver;
* la migración requiere modificar Domain Tracker;
* la migración requiere cambiar contratos públicos;
* la implementación corresponde realmente a la Fase 6.

No modificar por intuición.

---

# 16. SALIDA FINAL

Mostrar únicamente:

```text
FASE: 5.4 — Engine Migration

ESTADO:

VEREDICTO:

Motores auditados:

FULLY_MIGRATED:

PARTIALLY_MIGRATED:

LEGACY_DEPENDENCY:

DOMAIN_ONLY:

Motores modificados:

Wrappers eliminados:

Adapters eliminados:

Tests:

Build:

Lint:

API pública modificada:
Sí / No

Documentos generados:

Preparado para Fase 5.5:
YES / CONDITIONAL / NO
```

---

# 17. RESTRICCIÓN FINAL

Esta fase no consiste en reescribir motores.

Consiste en demostrar qué motores aún necesitan migración y completar únicamente esas migraciones.

Si todos los motores ya están completamente migrados, la fase deberá concluir con un **PASS** sin modificaciones funcionales, documentando la evidencia y dejando el proyecto preparado para la **Fase 5.5 — Legacy Dependency Audit**.
