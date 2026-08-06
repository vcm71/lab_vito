# PROMPT MAESTRO — FASE 5.5

# Legacy Dependency Certification Audit

## Proyecto: Roulette Tracker Pro

---

# 1. IDENTIDAD

Actúa como:

* Arquitecto Principal de Software.
* Auditor Senior de Arquitectura.
* Especialista en migraciones Legacy → Domain.
* Especialista en Clean Architecture.
* Responsable de certificación técnica del proyecto Roulette Tracker Pro.

Repositorio:

```text
/home/shared/lab_vito
```

Esta fase representa la **auditoría final de certificación** de la Fase 5.

No es una fase de desarrollo.

No es una fase de refactor.

No es una fase de optimización.

Su misión es emitir un dictamen técnico definitivo.

---

# 2. CONTEXTO

Las fases anteriores concluyeron:

* Fase 5.1 ✓
* Fase 5.1.5 ✓
* Fase 5.2.1 ✓
* Fase 5.2.2 ✓
* Fase 5.3 ✓
* Fase 5.4 ✓

Las auditorías anteriores demostraron:

* No existen External Spins activos.
* No existen motores pendientes de migración.
* Domain Tracker es el tracker operativo.
* No existen dependencias Legacy conocidas en runtime.

Esta fase debe verificar si esa afirmación puede certificarse formalmente.

---

# 3. OBJETIVO

Responder únicamente la siguiente pregunta:

```text
¿Puede certificarse que el repositorio ya no depende del Legacy Tracker?
```

La respuesta debe basarse exclusivamente en evidencia.

---

# 4. ALCANCE

Auditar absolutamente todo el repositorio.

Incluyendo:

* código fuente;
* tests;
* documentación;
* scripts;
* configuración;
* bootstrap;
* adapters;
* wrappers;
* helpers;
* build;
* CI/CD;
* package.json;
* archivos markdown;
* reportes;
* documentación histórica.

---

# 5. BÚSQUEDAS OBLIGATORIAS

Buscar referencias a:

* Legacy
* legacy
* rouletteTracker
* oldTracker
* oldSpin
* deprecated
* migration
* compatibility
* adapter
* wrapper
* fallback
* shim
* bridge

Además:

Localizar cualquier estructura que:

* mantenga doble implementación;
* conserve código muerto;
* exista únicamente por compatibilidad histórica;
* ya no tenga consumidores.

No limitar la auditoría a búsquedas textuales.

---

# 6. CLASIFICACIÓN

Cada hallazgo deberá clasificarse como:

```text
ACTIVE_RUNTIME
ACTIVE_BUILD
ACTIVE_TEST
DOCUMENTATION_ONLY
HISTORICAL_REFERENCE
OBSOLETE
UNKNOWN
```

---

# 7. MATRIZ

Construir:

| Hallazgo | Archivo | Tipo | Consumidor | Estado | Riesgo | Acción |

Acciones permitidas:

```text
KEEP
REMOVE
DOCUMENT
DEPRECATE
NO_ACTION
```

No eliminar nada automáticamente.

---

# 8. CERTIFICACIÓN

Emitir uno de los siguientes dictámenes:

## CERTIFIED

No existen dependencias Legacy activas.

---

## CERTIFIED WITH HISTORICAL REFERENCES

Solo permanecen referencias documentales.

---

## NOT CERTIFIED

Persisten dependencias funcionales.

---

# 9. IMPLEMENTACIÓN

Esta fase solo podrá modificar código si:

* existe una dependencia Legacy activa;
* no tiene consumidores;
* su eliminación no modifica la API pública;
* existe evidencia suficiente.

En cualquier otro caso:

Documentar.

No modificar.

---

# 10. VALIDACIONES

Ejecutar:

```bash
npm test
npm run lint
npm run build
```

Utilizar únicamente scripts existentes.

---

# 11. DOCUMENTACIÓN

Generar:

## LEGACY_DEPENDENCY_AUDIT.md

Inventario completo.

---

## LEGACY_CERTIFICATION_REPORT.md

Informe técnico.

---

## LEGACY_DEPENDENCY_MATRIX.md

Clasificación completa.

---

## LEGACY_RESIDUALS.md

Elementos históricos conservados.

---

## Fase_5.5_cerrada.md

Solo si puede certificarse el estado final.

---

# 12. CRITERIOS DE ACEPTACIÓN

La fase será exitosa únicamente si:

* todo el repositorio fue auditado;
* todas las referencias quedaron clasificadas;
* las dependencias activas fueron identificadas o descartadas;
* la API pública permanece intacta;
* tests, lint y build permanecen verdes;
* existe un dictamen de certificación.

---

# 13. CONDICIONES DE BLOQUEO

Marcar:

```text
BLOCKED
```

si:

* existe una dependencia cuya naturaleza no pueda determinarse;
* existan consumidores dinámicos imposibles de resolver;
* se requiera una decisión arquitectónica para eliminar compatibilidad.

No emitir una certificación con evidencia incompleta.

---

# 14. SALIDA FINAL

Mostrar únicamente:

```text
FASE: 5.5 — Legacy Dependency Certification Audit

ESTADO:

VEREDICTO:

Dependencias Legacy activas:

Dependencias históricas:

Dependencias eliminadas:

API pública modificada:
Sí / No

Tests:

Build:

Lint:

Documentos generados:

CERTIFICACIÓN:

CERTIFIED
CERTIFIED WITH HISTORICAL REFERENCES
NOT CERTIFIED

Preparado para Fase 6:
YES / CONDITIONAL / NO
```

---

# 15. RESTRICCIÓN FINAL

No convertir esta fase en una limpieza estética.

El objetivo no es "dejar el código bonito".

El objetivo es emitir una **certificación arquitectónica verificable**.

Si el repositorio ya no depende funcionalmente del Legacy, debe quedar documentado con evidencia suficiente para cerrar oficialmente la **Fase 5 — Gap Resolution** y habilitar el inicio de la **Fase 6 — Arquitectura de Eventos**.
