# ORION
# ETAPA 4
# FASE 4.1 — DOMAIN TEST FOUNDATION

## CONTEXTO

El proyecto ORION ha finalizado completamente la ETAPA 3 (Domain Hardening).

La arquitectura actual es considerada la línea base oficial.

NO debe modificarse la arquitectura.

NO deben agregarse funcionalidades.

NO deben cambiar APIs públicas.

NO debe alterarse ningún comportamiento observable.

El objetivo exclusivo de esta fase es construir la infraestructura profesional de pruebas automáticas del dominio.

Toda decisión debe privilegiar:

- mantenibilidad
- estabilidad
- bajo acoplamiento
- escalabilidad
- arquitectura limpia

---

# Arquitectura actual

Bootstrap

↓

RouletteTracker

↓

SpinManager
SessionManager
HistoryManager
SettingsManager
DelayManager

↓

RouletteAnalytics

↓

numberMeta

RouletteTracker continúa siendo el único Owner del estado.

No modificar esta estructura.

---

# Objetivo

Construir una infraestructura de testing que sirva como base para toda la evolución futura del proyecto.

Esta infraestructura deberá permitir:

- pruebas unitarias
- pruebas de integración
- futuras pruebas de regresión
- cobertura automática
- ejecución local
- integración futura con CI/CD

No escribir únicamente algunos tests.

Construir una plataforma completa de testing.

---

# Tareas

## 1. Analizar el proyecto

Identificar:

- framework utilizado
- bundler
- estructura src
- estructura domain
- utilidades existentes
- configuración de npm
- compatibilidad con Vitest

No asumir nada.

Detectarlo automáticamente.

---

## 2. Diseñar la arquitectura de testing

Crear una estructura similar a:

tests/

    unit/

        tracker/

        managers/

        analytics/

        utils/

    integration/

    fixtures/

    builders/

    helpers/

    mocks/

Organizar siguiendo Clean Architecture.

No mezclar tests con código productivo.

---

## 3. Configurar Vitest

Instalar y configurar:

Vitest

Coverage

HTML Report

LCOV

Watch Mode

Configuración mediante archivos dedicados.

No romper el build existente.

---

## 4. Fixtures

Crear datasets reutilizables.

Ejemplos:

emptySession

singleSpin

tenSpins

hundredSpins

thousandSpins

randomSession

invalidSession

customSeries

Todos deterministas.

No usar aleatoriedad sin semilla.

---

## 5. Builders

Crear builders reutilizables.

Ejemplos:

createTracker()

createSession()

createSpin()

createAnalytics()

createHistory()

Evitar duplicación de código.

---

## 6. Helpers

Crear helpers reutilizables.

Ejemplos:

expectTrackerState()

expectAnalytics()

expectDelay()

expectSpinHistory()

expectSession()

---

## 7. Primeros tests

Crear únicamente la base para:

numberMeta

DelayManager

SpinManager

No intentar cubrir todavía toda la aplicación.

Construir una base sólida.

---

## 8. Calidad

Verificar:

✓ npm install

✓ npm test

✓ cobertura

✓ build

✓ lint

✓ arquitectura

Nada debe romperse.

---

# Restricciones

NO modificar:

API pública

RouletteTracker

contratos

interfaces

comportamiento observable

No introducir nuevas funcionalidades.

No refactorizar código por gusto.

Toda modificación debe estar justificada.

---

# Entregables

Generar:

TESTING_STRATEGY.md

TEST_ARCHITECTURE.md

Explicar:

estructura

convenciones

builders

fixtures

helpers

mocks

cobertura

criterios

Agregar comentarios únicamente donde aporten valor.

---

# Validación final

Antes de finalizar verificar:

✓ Build limpio

✓ Sin errores

✓ Sin warnings nuevos

✓ Tests ejecutan correctamente

✓ Cobertura generada

✓ Arquitectura intacta

---

# Informe final

Generar:

reports/

IMPLEMENTACION_ETAPA_4_1_DOMAIN_TEST_FOUNDATION.md

Debe contener:

## Resumen Ejecutivo

## Archivos creados

## Archivos modificados

## Configuración realizada

## Infraestructura implementada

## Cobertura inicial

## Riesgos encontrados

## Recomendaciones para Fase 4.2

## Estado final

Concluir indicando explícitamente si el proyecto quedó listo para iniciar:

ETAPA 4 — FASE 4.2 Integration Testing
