# ORION REFACTOR - FASE 4.5
# Consolidación del Composition Root

## Objetivo

Finalizar la separación entre la capa de aplicación y el dominio.

A partir de esta fase:

- main.js será exclusivamente un Composition Root.
- RouletteTracker será el único punto de entrada al dominio.
- Toda la lógica de negocio deberá vivir dentro del dominio.

NO crear nuevas funcionalidades.

NO modificar la UI.

NO cambiar comportamiento observable.

------------------------------------------------------------

# Proyecto

/home/shared/lab_vito

------------------------------------------------------------

# Estado actual

Existe:

✓ TrackerState

✓ RouletteTracker

✓ SpinManager

✓ SessionManager

✓ SettingsManager

✓ HistoryManager

✓ Bootstrap

✓ OrionKernel

✓ Build limpio

------------------------------------------------------------

# Rol

Actúa como Principal Software Architect.

Priorizar:

- Clean Architecture
- Domain Driven Design
- SOLID
- Composition Root
- Dependency Injection
- Single Responsibility

------------------------------------------------------------

# Objetivo arquitectónico

Al finalizar:

main.js NO contendrá lógica de negocio.

Su única responsabilidad será:

- inicializar aplicación
- obtener referencias
- conectar UI
- registrar eventos
- llamar APIs públicas

Nada más.

------------------------------------------------------------

# Paso 1

Analizar completamente main.js.

Clasificar cada bloque como:

A)

Inicialización

B)

UI

C)

Lógica de negocio

D)

Persistencia

E)

Comunicación con el dominio

Generar primero este análisis.

Después modificar.

------------------------------------------------------------

# Paso 2

Buscar cualquier código donde main.js:

- tome decisiones
- modifique TrackerState
- manipule arrays internos
- construya objetos de dominio
- conozca detalles internos del Tracker
- acceda directamente a managers

Toda esa lógica debe migrarse.

------------------------------------------------------------

# Paso 3

Mover únicamente lógica de negocio hacia:

RouletteTracker

o

Manager correspondiente.

Nunca hacia main.js.

------------------------------------------------------------

# Paso 4

main.js únicamente podrá hacer llamadas del tipo:

tracker.startSession()

tracker.addSpin()

tracker.clearSession()

tracker.updateSettings()

tracker.getHistory()

tracker.getSession()

tracker.getSpins()

etc.

Nunca acceder al estado interno.

Nunca modificar objetos internos.

------------------------------------------------------------

# Paso 5

Eliminar dependencias innecesarias.

main.js no debe conocer:

TrackerState

SpinManager

SessionManager

SettingsManager

HistoryManager

Sólo conoce:

RouletteTracker

------------------------------------------------------------

# Paso 6

Buscar duplicaciones.

Eliminar código repetido.

Eliminar lógica espejo.

Eliminar estados duplicados.

------------------------------------------------------------

# Restricciones

NO modificar:

Motores

Renderers

Stores

HTML

CSS

EventBus

Bootstrap

OrionKernel

No cambiar funcionalidad.

No cambiar UX.

------------------------------------------------------------

# Compatibilidad

Mantener compatibilidad completa.

Todo debe seguir funcionando exactamente igual.

------------------------------------------------------------

# Validación

Después de cada modificación:

npm run build

Resolver errores inmediatamente.

No continuar con build roto.

------------------------------------------------------------

# Reporte

Generar:

reports/phase4_5_composition_root.md

Debe incluir:

# Responsabilidades eliminadas de main.js

# Responsabilidades mantenidas

# Código migrado

# APIs nuevas creadas

# Dependencias eliminadas

# Dependencias restantes

# Riesgos

# Próximos pasos

------------------------------------------------------------

# Criterio de éxito

La fase será exitosa únicamente si:

✓ main.js no contiene reglas de negocio.

✓ Toda la lógica del Tracker entra por RouletteTracker.

✓ Ningún Manager es utilizado directamente desde main.js.

✓ No existen accesos directos a TrackerState.

✓ No existen duplicaciones de estado.

✓ Build limpio.

✓ Sin cambios funcionales.

------------------------------------------------------------

# Regla de oro

NO optimizar.

NO embellecer.

NO reestructurar archivos innecesariamente.

Migrar únicamente responsabilidades.

Detenerse al finalizar y esperar autorización para la siguiente fase.
