# Estado del Proyecto --- Roulette Tracker

**Fecha:** 2026-08-02

## 1. ¿En dónde estamos?

Actualmente el proyecto se encuentra en una etapa de **consolidación de
la arquitectura del Domain Tracker**.

### Fases completadas

-   ✅ Fase 3 --- Refactor a Engines
-   ✅ Fase 4 --- Domain Tracker
-   ✅ Fase 5.1 --- Sync Audit
-   ✅ Fase 5.1.5 --- Contract Freeze & Stabilization
-   ✅ Fase 5.2.1 --- Session Finalization Flow Gap Fix (Gap descartado)
-   ✅ Fase 5.2.2 --- Public Collection Mutability Safety Audit

### Estado técnico

-   Pipeline GREEN
-   970 tests aprobados
-   Lint OK
-   Build OK
-   Contratos principales estabilizados
-   Domain Tracker consolidado como núcleo operativo
-   Sin evidencia de brechas funcionales en las investigaciones
    recientes

------------------------------------------------------------------------

## 2. ¿A dónde vamos?

El objetivo del proyecto no es únicamente terminar el Tracker.

La meta es convertir **Roulette Tracker** en la plataforma sobre la cual
funcionen todos los motores analíticos y experimentales del laboratorio.

Arquitectura objetivo:

``` text
Roulette Tracker
        │
        ▼
Domain Tracker
        │
 ┌──────┼───────────────┐
 │      │               │
Historical Evidence  Motor Estadístico
 │                    │
AtRep                WinWin
 │                    │
DA                   Chi
 │                    │
Sesgo97          Motores IA futuros
        │
        ▼
Laboratorio
```

Todos los motores deben consumir un único núcleo estable (Domain
Tracker), eliminando dependencias del antiguo Legacy Tracker.

------------------------------------------------------------------------

## 3. ¿Cuáles son las siguientes etapas?

### Fase 5.3 --- External Spins Removal

-   Eliminar dependencias restantes relacionadas con External Spins.
-   Confirmar que ningún motor depende de implementaciones antiguas.

### Fase 5.4 --- Engine Migration

-   Migrar completamente todos los motores al Domain Tracker.
-   Eliminar dependencias funcionales remanentes del Legacy.

### Fase 5.5 --- Legacy Dependency Audit

-   Auditoría final.
-   Confirmar que el Legacy puede darse por eliminado.

### Fase 6 --- Arquitectura de Eventos

-   Activar completamente EventBus.
-   Comunicación desacoplada entre dominio, motores y UI.

### Fase 7 --- Persistencia Unificada

-   Unificar mecanismos de persistencia.
-   Preparar el sistema para futuras extensiones.

------------------------------------------------------------------------

## 4. ¿Cuándo estará el laboratorio en la interfaz?

### Lo que establece el roadmap

El roadmap no define explícitamente una fase denominada "Laboratorio" ni
especifica cuándo aparecerá integrado en la interfaz.

### Evaluación arquitectónica

La integración del laboratorio debería realizarse **después del cierre
de la Fase 5**, cuando:

-   todos los motores utilicen el Domain Tracker;
-   las dependencias Legacy hayan sido eliminadas;
-   la API pública esté estabilizada;
-   los contratos se encuentren congelados y validados.

En ese momento el laboratorio podrá incorporarse sin depender de
componentes en transición.

------------------------------------------------------------------------

## Propuesta de evolución

### Bloque A --- Plataforma

-   Domain Tracker
-   Migración de motores
-   Eliminación del Legacy
-   Contratos
-   Persistencia
-   Arquitectura de eventos

**Meta:** completar la Fase 5.

### Bloque B --- Laboratorio

Una vez estabilizada la plataforma:

-   integrar el laboratorio en la interfaz;
-   incorporar módulos como Historical Evidence, AtRep, DA, WinWin y
    futuros motores;
-   ejecutar simulaciones, comparativas y experimentos sobre una base
    estable.

------------------------------------------------------------------------

## Conclusión

El proyecto ha superado la etapa de construcción del núcleo y se
encuentra en la fase de consolidación y eliminación definitiva del
Legacy.

La prioridad inmediata continúa siendo completar las etapas restantes de
la Fase 5 antes de integrar el laboratorio en la interfaz principal de
Roulette Tracker.

Con esta estrategia se minimiza el riesgo de retrabajo y se garantiza
que el laboratorio se construya sobre una plataforma estable y
mantenible.
