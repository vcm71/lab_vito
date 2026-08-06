# ORION REFACTOR
# ETAPA 2
# FASE 5.1
# Auditoría y Centralización de la Sincronización

## IMPORTANTE

Esta fase NO elimina el Legacy Tracker.

Esta fase NO convierte todavía a RouletteTracker en la única fuente de verdad.

Esta fase NO migra motores.

Esta fase NO modifica renderers.

Esta fase NO modifica la UI.

Esta fase NO modifica EventBus.

Esta fase NO cambia comportamiento observable.

El único objetivo es comprender completamente cómo conviven ambos modelos y centralizar la sincronización existente.

No crear nuevas funcionalidades.

No realizar refactorizaciones fuera del alcance.

------------------------------------------------------------

# Rol

Actúa como Principal Software Architect especializado en:

- Domain Driven Design (DDD)
- Clean Architecture
- SOLID
- Arquitectura Hexagonal
- JavaScript moderno
- Refactorización incremental

------------------------------------------------------------

# Proyecto

/home/shared/lab_vito

------------------------------------------------------------

# Estado actual

Existe:

✓ OrionKernel

✓ Bootstrap

✓ TrackerState

✓ RouletteTracker

✓ SpinManager

✓ SessionManager

✓ SettingsManager

✓ HistoryManager

✓ Legacy Tracker

Ambos modelos conviven correctamente.

------------------------------------------------------------

# Objetivo

Esta fase NO busca eliminar el Legacy Tracker.

Busca descubrir y documentar completamente la sincronización existente.

Debe quedar perfectamente definido:

- quién es propietario del estado
- quién puede modificarlo
- quién únicamente lo consume

Debe existir un único mecanismo claramente identificado para mantener consistencia entre ambos modelos.

------------------------------------------------------------

# PRINCIPIO ARQUITECTÓNICO

Para cada entidad del dominio debe existir exactamente:

UN Owner

UN Modifier

Múltiples Readers

Nunca más de un Owner.

Nunca múltiples Modifiers independientes.

------------------------------------------------------------

# PASO 1
# Auditoría completa

Antes de modificar código:

Buscar absolutamente todos los lugares donde:

- se agrega un spin
- se elimina un spin
- se modifica una sesión
- se reinicia una sesión
- se modifica configuración
- se registra historial
- se copian arrays
- se sincronizan objetos
- aparece externalSpins
- se sincroniza manualmente desde main.js

NO modificar nada todavía.

Primero generar un mapa completo.

------------------------------------------------------------

# PASO 2
# Ownership

Documentar el ownership REAL del código.

No proponer arquitectura futura.

Describir únicamente la situación actual.

Completar:

## Spins

Owner:

Modifier:

Readers:

------------------------------------------------------------

## Session

Owner:

Modifier:

Readers:

------------------------------------------------------------

## Settings

Owner:

Modifier:

Readers:

------------------------------------------------------------

## History

Owner:

Modifier:

Readers:

------------------------------------------------------------

# PASO 3
# Sincronización

Identificar todos los puntos donde:

Legacy Tracker

↓

RouletteTracker

o

RouletteTracker

↓

Legacy Tracker

Determinar si existen múltiples mecanismos.

Si existen varios mecanismos:

centralizar en uno solo.

Si es necesario crear un componente específico (por ejemplo TrackerSyncAdapter), hacerlo únicamente si reduce duplicación y simplifica la arquitectura.

NO crear sincronizaciones nuevas.

NO aumentar el acoplamiento.

------------------------------------------------------------

# PASO 4
# externalSpins

Analizar todos los usos de:

externalSpins

Clasificarlos en:

A)

Necesarios mientras exista Legacy Tracker.

B)

Temporales.

C)

Eliminables inmediatamente.

Eliminar únicamente los claramente innecesarios.

Mantener compatibilidad completa.

------------------------------------------------------------

# PASO 5
# Duplicaciones

Buscar:

- doble escritura
- doble lectura
- doble persistencia
- doble cálculo
- doble sincronización
- doble ownership

Eliminar únicamente duplicaciones sin riesgo.

No modificar comportamiento.

------------------------------------------------------------

# PASO 6
# Validación funcional

Comprobar que:

✓ cada spin agregado mantiene ambos modelos sincronizados.

✓ cada reset mantiene consistencia.

✓ cada sesión finalizada se registra una sola vez.

✓ no existen dobles escrituras.

✓ no existen divergencias.

✓ no aparecen regresiones.

------------------------------------------------------------

# Restricciones

NO modificar:

- Engines
- Renderers
- UI
- HTML
- CSS
- Bootstrap
- OrionKernel
- EventBus

NO eliminar Legacy Tracker.

NO migrar motores.

NO introducir nuevas funcionalidades.

------------------------------------------------------------

# Calidad

Aplicar:

- DDD
- Clean Architecture
- SOLID
- SRP
- DRY
- Single Source Of Truth
- Dependency Inversion

Evitar dependencias circulares.

Evitar nuevos acoplamientos.

------------------------------------------------------------

# Validación técnica

Después de cada modificación:

npm run build

Resolver inmediatamente cualquier error.

No continuar con el proyecto si el build falla.

------------------------------------------------------------

# Reporte

Generar:

reports/phase5_1_sync_audit.md

Debe incluir obligatoriamente:

# Mapa completo de sincronización

# Ownership real de cada entidad

# Duplicaciones encontradas

# Duplicaciones eliminadas

# externalSpins clasificados

# Riesgos detectados

# Recomendaciones para Fase 5.2

# Componentes que siguen dependiendo del Legacy Tracker

# Componentes preparados para abandonar el Legacy Tracker

------------------------------------------------------------

# Criterio de éxito

La fase termina únicamente si:

✓ Existe un único mecanismo claramente identificado para sincronizar ambos modelos.

✓ Cada entidad posee un único Owner.

✓ No existen sincronizaciones duplicadas innecesarias.

✓ main.js deja de coordinar múltiples sincronizaciones manuales.

✓ Legacy Tracker continúa funcionando.

✓ RouletteTracker continúa funcionando.

✓ Build limpio.

✓ Compatibilidad completa.

✓ No cambia el comportamiento observable.

------------------------------------------------------------

# REGLA DE ORO

Esta fase NO convierte todavía a RouletteTracker en la única fuente de verdad.

Esta fase únicamente prepara la eliminación segura del Legacy Tracker.

No eliminar Legacy.

No migrar Engines.

No modificar Renderers.

No introducir EventBus.

No realizar refactorizaciones adicionales.

Al finalizar:

DETENERSE.

Esperar autorización para comenzar la Fase 5.2.
