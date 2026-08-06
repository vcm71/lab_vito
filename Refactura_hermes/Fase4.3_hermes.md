# ORION REFACTOR - FASE 4.3
# Migración del Dominio de Configuración del Tracker
## (SettingsManager toma el control únicamente del Tracker)

# IMPORTANTE

Esta fase migra EXCLUSIVAMENTE la configuración propia de Roulette Tracker.

NO migrar configuraciones de:

- Kelly
- WinWin
- Laboratorio
- Motores
- UI
- Renderers
- Otros Stores

NO modificar algoritmos.

NO modificar HTML.

NO modificar CSS.

NO modificar EventBus.

NO modificar Spins.

NO modificar Session.

NO modificar History.

Una única responsabilidad.

---

# Rol

Actúa como Principal Software Architect especializado en:

- Domain Driven Design
- Clean Architecture
- SOLID
- Arquitectura Hexagonal
- JavaScript moderno
- Refactorización incremental

---

# Proyecto

/home/shared/lab_vito

---

# Estado actual

Existe:

✔ TrackerState

✔ SpinManager

✔ SessionManager

✔ RouletteTracker

✔ Build correcto

Ahora únicamente migraremos la configuración del dominio Tracker.

---

# Objetivo

SettingsManager debe convertirse en el ÚNICO responsable de la configuración del Tracker.

No administrar configuraciones de otros módulos.

---

# Paso 1 - Análisis

Antes de modificar código:

Identificar todas las configuraciones que realmente pertenecen al dominio Roulette Tracker.

Separarlas de:

- configuración de motores
- configuración UI
- configuración laboratorio
- configuración Kelly
- configuración WinWin

No mover ninguna configuración ajena al Tracker.

Generar primero un mapa de dependencias.

---

# TrackerState

TrackerState será propietario de:

state.settings

Debe existir una única fuente de verdad.

No duplicar estado.

---

# SettingsManager

Implementar únicamente los métodos necesarios encontrados durante el análisis.

Ejemplo:

load()

save()

update()

reset()

get()

set()

merge()

No inventar funcionalidades.

Migrar únicamente las existentes.

---

# RouletteTracker

Exponer una API pública.

Ejemplo conceptual:

tracker.getSettings()

tracker.updateSettings()

tracker.resetSettings()

tracker.loadSettings()

tracker.saveSettings()

RouletteTracker únicamente delega.

No implementa lógica.

---

# main.js

Buscar toda manipulación directa de configuración del Tracker.

Reemplazar gradualmente por llamadas al Tracker.

Ejemplo conceptual:

ANTES

trackerSettings.xxx = valor

DESPUÉS

tracker.updateSettings(...)

---

# Compatibilidad

Si otros módulos todavía utilizan funciones antiguas:

Mantener wrappers temporales.

Delegar hacia SettingsManager.

No romper compatibilidad.

---

# Restricciones

NO modificar:

SpinManager

SessionManager

HistoryManager

Motores

Renderers

Stores externos

Persistencia ajena

UI

---

# Persistencia

Si actualmente existe persistencia de configuración del Tracker:

Mover únicamente esa responsabilidad.

No modificar el formato de almacenamiento.

No cambiar claves.

No cambiar estructura.

Mantener compatibilidad total.

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

Después de cada modificación:

npm run build

Corregir errores.

Continuar.

Nunca dejar el proyecto sin compilar.

---

# Reporte

Generar:

reports/phase4_3_tracker_settings.md

Debe incluir:

# Configuración encontrada

# Configuración perteneciente al Tracker

# Configuración descartada

# Métodos implementados

# Código eliminado de main.js

# Wrappers temporales

# Riesgos

# Preparación para Fase 4.4

---

# Criterio de éxito

La fase será exitosa únicamente si:

✔ SettingsManager administra exclusivamente la configuración del Tracker.

✔ TrackerState contiene settings.

✔ RouletteTracker expone la API pública.

✔ main.js deja de modificar directamente la configuración del Tracker.

✔ No se modifican configuraciones de otros dominios.

✔ No cambia el comportamiento observable.

✔ Spins continúan funcionando.

✔ Session continúa funcionando.

✔ npm run build finaliza correctamente.

✔ No existen dependencias circulares.

---

# REGLA DE ORO

Migrar únicamente la configuración propia del dominio Roulette Tracker.

No absorber configuraciones de otros módulos.

No tocar History.

No tocar EventBus.

No tocar Motores.

No tocar Renderers.

No tocar UI.

No realizar refactorizaciones adicionales.

Al finalizar, detenerse y esperar autorización para comenzar la Fase 4.4.
