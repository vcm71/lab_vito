# ORION REFACTOR - FASE 4.4
# Migración del Dominio de Historial
## (HistoryManager administra sesiones finalizadas)

# IMPORTANTE

Esta fase migra EXCLUSIVAMENTE el historial del dominio Roulette Tracker.

History representa sesiones finalizadas.

NO representa un simple listado de números.

NO modificar:

- Spins
- Session
- Settings
- Motores
- Renderers
- UI
- HTML
- CSS
- EventBus

No realizar otros refactor.

Una única responsabilidad.

------------------------------------------------------------

# Rol

Actúa como Principal Software Architect especializado en:

- Domain Driven Design
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

✔ TrackerState

✔ RouletteTracker

✔ SpinManager

✔ SessionManager

✔ SettingsManager

✔ Build correcto

Ahora migraremos únicamente HistoryManager.

------------------------------------------------------------

# Objetivo

HistoryManager será el ÚNICO responsable del historial del Tracker.

Toda la lógica relacionada con historial deberá vivir allí.

main.js dejará de administrar historial.

------------------------------------------------------------

# Paso 1 - Análisis

Antes de modificar código:

Buscar toda lógica relacionada con:

- historial
- sesiones anteriores
- almacenamiento histórico
- recuperación
- limpieza
- exportación (si existe)
- importación (si existe)

No mover código todavía.

Primero comprender completamente el dominio.

------------------------------------------------------------

# Modelo de Dominio

History representa una colección de sesiones finalizadas.

Conceptualmente:

History

↓

Session

↓

Spins

No representar History como un simple array de números.

Usar únicamente la estructura que realmente exista en el proyecto.

No inventar datos.

------------------------------------------------------------

# TrackerState

TrackerState será propietario de:

state.history

Debe existir una única fuente de verdad.

Eliminar duplicaciones si aparecen.

------------------------------------------------------------

# HistoryManager

Implementar únicamente la lógica existente.

Ejemplos posibles:

load()

save()

addSession()

removeSession()

clear()

getHistory()

getLastSession()

count()

Si durante el análisis aparecen otros métodos necesarios, implementarlos.

No inventar comportamiento.

------------------------------------------------------------

# RouletteTracker

Exponer API pública.

Ejemplo conceptual:

tracker.getHistory()

tracker.saveHistory()

tracker.loadHistory()

tracker.addSessionToHistory()

tracker.clearHistory()

RouletteTracker únicamente delega.

No implementar lógica.

------------------------------------------------------------

# main.js

Buscar toda manipulación directa del historial.

Reemplazar gradualmente por llamadas al Tracker.

Ejemplo conceptual:

ANTES

history.push(...)

DESPUÉS

tracker.addSessionToHistory(...)

------------------------------------------------------------

# Persistencia

Mantener completamente compatible la persistencia existente.

No modificar:

- IndexedDB
- claves
- formato
- estructura

HistoryManager utilizará la capa de persistencia existente.

No acceder directamente desde main.js.

------------------------------------------------------------

# Compatibilidad

Si existen funciones antiguas utilizadas por otros módulos:

Mantener wrappers temporales.

Delegar hacia HistoryManager.

No romper compatibilidad.

------------------------------------------------------------

# Restricciones

NO modificar:

SpinManager

SessionManager

SettingsManager

Motores

Renderers

UI

EventBus

------------------------------------------------------------

# Calidad

Aplicar:

DDD

SOLID

SRP

Single Source Of Truth

Dependency Inversion

No crear dependencias circulares.

No duplicar estado.

------------------------------------------------------------

# Validaciones

Después de cada modificación:

npm run build

Corregir errores.

Continuar.

Nunca dejar el proyecto inconsistente.

------------------------------------------------------------

# Reporte

Generar:

reports/phase4_4_history_manager.md

Debe incluir:

# Concepto de History encontrado

# Responsabilidades migradas

# Métodos implementados

# Código eliminado de main.js

# Persistencia utilizada

# Wrappers temporales

# Riesgos

# Preparación para Fase 4.5

------------------------------------------------------------

# Criterio de éxito

La fase será exitosa únicamente si:

✔ HistoryManager administra completamente el historial.

✔ TrackerState contiene history.

✔ RouletteTracker expone la API pública.

✔ main.js deja de administrar directamente el historial.

✔ Se mantiene compatibilidad con la persistencia existente.

✔ No cambia el comportamiento observable.

✔ Spins continúan funcionando.

✔ Session continúa funcionando.

✔ Settings continúa funcionando.

✔ npm run build finaliza correctamente.

✔ No existen dependencias circulares.

------------------------------------------------------------

# REGLA DE ORO

History representa el historial del dominio Roulette Tracker.

Migrar únicamente esa responsabilidad.

No modificar otros Managers.

No modificar EventBus.

No modificar Motores.

No modificar Renderers.

No modificar UI.

No realizar refactorizaciones adicionales.

Al finalizar:

Detenerse y esperar autorización para comenzar la Fase 4.5.

------------------------------------------------------------

# DEFINICIÓN ARQUITECTÓNICA

Al finalizar esta fase, el dominio deberá quedar estructurado conceptualmente así:

RouletteTracker
│
├── SpinManager
├── SessionManager
├── SettingsManager
├── HistoryManager
│
└── TrackerState
      ├── session
      ├── spins
      ├── settings
      └── history

TrackerState será la única fuente de verdad del dominio.

RouletteTracker será el único punto de entrada al dominio.

Los Managers serán los únicos responsables de modificar su parte del estado.

main.js no contendrá lógica de negocio del Tracker.
