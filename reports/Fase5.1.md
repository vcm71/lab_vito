# PROMPT — FASE 5.1

## Sync Audit — Legacy Tracker vs Domain Tracker

### Proyecto: Roulette Tracker

## CONTEXTO

Actúas como **Arquitecto Principal de Software**, **Auditor Técnico Senior** y **Revisor de Arquitectura** del proyecto **Roulette Tracker**.

Debes continuar exactamente desde el estado alcanzado al finalizar la Fase 2.3.5 del módulo **historical-evidence**, respetando todas las decisiones arquitectónicas previamente consolidadas.

La fase anterior finalizó con:

* Pipeline GREEN.
* Todos los tests aprobados.
* Arquitectura estable.
* Contratos de dominio consolidados.
* Determinismo garantizado.
* Separación Domain/Application preservada.

No debes modificar absolutamente nada relacionado con:

* historical-evidence
* GroupedTemporalSplitter
* DatasetIntegrityVerifier
* LeakageDetector
* Domain Contracts

Estos componentes se consideran congelados.

---

# ROADMAP

El roadmap oficial indica que la siguiente etapa autorizada es:

# FASE 5 — Gap Resolution

La primera subfase es:

# FASE 5.1 — Sync Audit

Objetivo:

Cerrar las diferencias funcionales existentes entre:

Legacy Tracker

y

Domain Tracker

antes de comenzar cualquier migración.

Esta fase es EXCLUSIVAMENTE DE AUDITORÍA.

No debes implementar funcionalidades nuevas.

No debes modificar comportamiento.

No debes refactorizar código.

No debes optimizar rendimiento.

No debes eliminar código Legacy.

No debes migrar motores.

Únicamente debes descubrir diferencias.

---

# OBJETIVO PRINCIPAL

Construir una auditoría funcional completa entre ambos trackers.

El resultado debe ser un mapa exacto de compatibilidad.

La implementación comenzará recién en la Fase 5.2.

---

# ALCANCE

Debes inspeccionar completamente ambos sistemas.

Analizar:

API pública

métodos

propiedades

contratos

tipos

retornos

eventos

dependencias

efectos secundarios

casos borde

errores

validaciones

orden de ejecución

invariantes

compatibilidad

---

# AUDITAR

Comparar uno a uno:

getStats()

getAdvancedStats()

getAlerts()

getHistory()

getCurrentSpin()

getLastNumber()

todos los getters

todos los setters

todos los eventos

todos los managers

todos los adapters

todas las interfaces públicas

todos los exports

todos los barrels

todo aquello consumido por otros motores

todo aquello consumido por la UI

No asumir que la lista termina aquí.

Debes descubrir automáticamente el resto.

---

# PARA CADA DIFERENCIA

Documentar:

Nombre

Ubicación

Tipo

Severidad

Descripción

Legacy

Domain

Compatibilidad

Impacto

Motores afectados

UI afectada

Tests existentes

Tests faltantes

Riesgo

Prioridad

Recomendación

---

# CLASIFICAR

Cada diferencia deberá clasificarse como:

CRÍTICA

ALTA

MEDIA

BAJA

SIN IMPACTO

---

# MATRIZ DE COMPATIBILIDAD

Construir una matriz completa:

Legacy

↓

Domain

↓

Estado

↓

Observaciones

Ejemplo:

✔ Compatible

▲ Parcial

✖ No implementado

⚠ Comportamiento diferente

---

# TESTS

Antes de cualquier implementación futura:

Identificar:

tests existentes

tests faltantes

tests necesarios para congelar comportamiento

No escribir implementaciones nuevas.

Solo proponer los tests.

---

# DEPENDENCIAS

Descubrir:

qué motores siguen usando Legacy

qué módulos dependen de rouletteTracker.js

qué dependencias impiden migrar

qué componentes ya utilizan Domain Tracker

qué motores poseen doble implementación

---

# COMPATIBILIDAD

Verificar:

Backward compatibility

API pública

nombres

firmas

tipos

retornos

errores

orden de ejecución

---

# NO MODIFICAR

Queda estrictamente prohibido:

cambiar código

renombrar métodos

refactorizar

optimizar

migrar

eliminar Legacy

crear nuevas APIs

---

# ENTREGABLES

Generar:

## 1.

SYNC_AUDIT.md

Debe contener toda la auditoría.

---

## 2.

API_COMPARISON.md

Comparación completa Legacy vs Domain.

---

## 3.

GAP_MATRIX.md

Todas las brechas detectadas.

---

## 4.

MIGRATION_BLOCKERS.md

Todo aquello que impide comenzar la Fase 5.2.

---

## 5.

TEST_FREEZE_PLAN.md

Plan de congelamiento de comportamiento mediante tests.

---

## 6.

EXECUTIVE_SUMMARY.md

Resumen ejecutivo.

---

# CRITERIOS DE ÉXITO

La auditoría será considerada exitosa únicamente si:

✓ No se modifica ninguna línea funcional.

✓ No disminuye la cobertura.

✓ No cambia ningún test existente.

✓ No cambia ninguna API.

✓ Se documentan todas las diferencias.

✓ Se identifican todos los consumidores del Legacy.

✓ Se obtiene una matriz completa de compatibilidad.

✓ Se genera un plan claro para la Fase 5.2.

---

# PRINCIPIOS OBLIGATORIOS

Mantener:

SOLID

DDD

Clean Architecture

Arquitectura Hexagonal

Separación Domain/Application

Determinismo

Inmutabilidad

Backward Compatibility

Single Source of Truth

No duplicación de lógica

---

# SALIDA ESPERADA

Al finalizar, entregar únicamente:

* Resumen ejecutivo.
* Número total de diferencias encontradas.
* Clasificación por severidad.
* APIs auditadas.
* Dependencias detectadas.
* Motores afectados.
* Riesgos identificados.
* Recomendación para iniciar (o no) la Fase 5.2.
* Lista de documentos generados.

No realizar ninguna implementación. No modificar código. El objetivo exclusivo de esta fase es producir una auditoría exhaustiva que sirva como base para la Fase 5.2 — Gap Fixes.
