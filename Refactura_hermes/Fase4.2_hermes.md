# ORION REFACTOR - FASE 4.2
# Migración del Dominio de Sesiones
## (SessionManager toma el control)

# IMPORTANTE

Esta fase migra EXCLUSIVAMENTE la gestión de sesiones.

NO migrar configuración.

NO migrar historial persistente.

NO modificar motores.

NO modificar renderers.

NO modificar HTML.

NO modificar CSS.

NO modificar algoritmos.

NO implementar EventBus.

NO modificar la lógica de spins ya migrada.

Una única responsabilidad.

---

# Rol

Actúa como Principal Software Architect especializado en:

- Domain Driven Design (DDD)
- Clean Architecture
- SOLID
- Arquitectura Hexagonal
- JavaScript moderno
- Node.js
- Vite
- Refactorización incremental

---

# Proyecto

/home/shared/lab_vito

---

# Estado actual

Existe:

✔ TrackerState

✔ RouletteTracker

✔ SpinManager completamente funcional

✔ Build correcto

La gestión de spins ya pertenece al dominio.

Ahora migraremos únicamente la gestión de sesiones.

---

# Objetivo

SessionManager debe convertirse en el ÚNICO responsable del ciclo de vida de una sesión.

Toda lógica relacionada con sesiones debe vivir allí.

main.js no debe administrar directamente el estado de la sesión.

---

# Analizar primero

Antes de modificar código:

Localizar toda lógica relacionada con sesiones.

Buscar:

- inicio de sesión
- reinicio
- nueva sesión
- cierre
- estado activo
- sesión actual
- reset general
- limpieza asociada a una sesión

Comprender completamente las dependencias antes de mover código.

No modificar nada hasta terminar el análisis.

---

# Definición de Dominio

Una sesión representa una ejecución continua del Roulette Tracker.

Debe contener únicamente estado del dominio.

Ejemplo conceptual:

session

↓

estado

fecha inicio

fecha fin

activa

cantidad de spins

identificador (si existe)

No inventar propiedades.

Usar únicamente las que realmente existan en el proyecto.

---

# TrackerState

TrackerState pasa a ser propietario de:

state.session

Debe existir una única fuente de verdad.

Eliminar duplicaciones si aparecen.

---

# SessionManager

Implementar completamente las operaciones necesarias encontradas durante el análisis.

Ejemplos posibles:

initialize()

start()

reset()

stop()

isActive()

getSession()

setSession()

Si el análisis descubre otros métodos necesarios, implementarlos.

No inventar lógica.

Migrar únicamente la existente.

---

# RouletteTracker

Exponer una API pública.

Ejemplo conceptual:

tracker.startSession()

tracker.resetSession()

tracker.stopSession()

tracker.isSessionActive()

tracker.getSession()

RouletteTracker únicamente delega.

No implementa lógica.

---

# main.js

Buscar toda lógica relacionada con:

estado de sesión

reinicios

inicio

fin

banderas de sesión

objetos de sesión

Reemplazar gradualmente por llamadas al Tracker.

Ejemplo conceptual:

ANTES

session.active = true

DESPUÉS

tracker.startSession()

---

# Restricciones

NO modificar:

SpinManager

SettingsManager

HistoryManager

Motores

Renderers

UI

Persistencia

---

# Compatibilidad

Si existen funciones antiguas utilizadas por otros módulos:

Mantener wrappers temporales.

Delegar hacia SessionManager.

No romper compatibilidad.

---

# EventBus

NO utilizar todavía.

Únicamente dejar preparado SessionManager para futuros eventos:

session:started

session:reset

session:ended

No emitir eventos aún.

---

# Calidad

Aplicar:

DDD

SOLID

SRP

Single Source Of Truth

Dependency Inversion

No crear dependencias circulares.

No duplicar estado.

---

# Validaciones

Después de cada migración parcial:

npm run build

Corregir errores.

Continuar.

Nunca continuar con errores.

---

# Reporte

Generar:

reports/phase4_2_session_manager.md

Debe incluir:

# Concepto de sesión encontrado

# Responsabilidades migradas

# Métodos implementados

# Código eliminado de main.js

# Wrappers temporales

# Dependencias

# Riesgos

# Preparación para Fase 4.3

---

# Criterio de éxito

La fase termina únicamente si:

✔ SessionManager administra completamente la sesión.

✔ TrackerState contiene session.

✔ RouletteTracker expone la API pública.

✔ main.js deja de administrar directamente la sesión.

✔ No cambia comportamiento observable.

✔ Spins continúan funcionando.

✔ Motores continúan funcionando.

✔ UI continúa funcionando.

✔ npm run build finaliza correctamente.

✔ No existen dependencias circulares.

---

# REGLA DE ORO

Migrar únicamente el dominio de sesión.

No aprovechar para refactorizar otras áreas.

No tocar configuración.

No tocar historial.

No tocar EventBus.

No tocar motores.

No tocar renderers.

Al finalizar, detenerse y esperar autorización para comenzar la Fase 4.3.
