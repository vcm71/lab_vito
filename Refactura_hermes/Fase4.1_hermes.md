# ORION REFACTOR - FASE 4.1
# Migración del Dominio de Spinners
## (SpinManager toma el control)

# IMPORTANTE

Esta fase migra EXCLUSIVAMENTE la gestión de las tiradas (spins).

NO migrar sesiones.

NO migrar configuración.

NO migrar historial persistente.

NO modificar motores.

NO modificar renderers.

NO modificar HTML.

NO modificar CSS.

NO cambiar algoritmos.

NO cambiar resultados.

NO implementar EventBus.

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

✔ OrionKernel

✔ Bootstrap

✔ TrackerState

✔ RouletteTracker

✔ SpinManager

✔ SessionManager

✔ HistoryManager

✔ SettingsManager

✔ Build correcto

El dominio ya existe.

Ahora comenzaremos a mover responsabilidades.

---

# Objetivo

SpinManager debe convertirse en el ÚNICO responsable de administrar las tiradas.

Toda la lógica relacionada con spins debe vivir allí.

main.js ya no debe administrar directamente los spins.

---

# Analizar primero

Antes de modificar código:

1. Localizar toda la lógica relacionada con spins.

Buscar:

- arrays de spins
- historial de números
- último número
- agregar número
- eliminar último número
- limpiar historial
- consultas sobre spins

Generar un pequeño mapa antes de comenzar la migración.

No mover nada hasta comprender todas las dependencias.

---

# TrackerState

TrackerState pasa a ser el dueño de:

state.spins

Toda colección de tiradas debe vivir aquí.

Evitar duplicar estado.

Debe existir una única fuente de verdad.

---

# SpinManager

Implementar completamente:

addSpin(number)

removeLastSpin()

clearSpins()

getSpins()

getLastSpin()

count()

isEmpty()

Si existen otros métodos necesarios durante el análisis, pueden añadirse justificadamente.

---

# RouletteTracker

Implementar una API pública sencilla.

Ejemplo conceptual:

tracker.addSpin(number)

tracker.removeLastSpin()

tracker.clearSpins()

tracker.getSpins()

tracker.getLastSpin()

RouletteTracker únicamente delega en SpinManager.

No implementa lógica.

---

# main.js

Buscar toda lógica relacionada con:

- push de números
- pop
- arrays
- historial de spins
- consultas del último número

Reemplazar gradualmente por llamadas al Tracker.

Ejemplo conceptual:

ANTES

spins.push(numero)

DESPUÉS

tracker.addSpin(numero)

---

# Restricción importante

NO modificar el flujo de actualización de la UI.

NO modificar llamadas a motores.

NO modificar renderers.

Solo cambiar quién administra el estado.

---

# Compatibilidad

Mientras existan referencias antiguas, mantener compatibilidad temporal si es necesario.

Si alguna función antigua sigue siendo utilizada, convertirla en un wrapper que delegue al Tracker.

No romper el proyecto.

---

# EventBus

Todavía NO utilizar.

Únicamente dejar comentarios o puntos de extensión donde posteriormente se emitirá:

spin:new

No implementar aún.

---

# Calidad

Aplicar:

SOLID

SRP

DDD

No duplicar estado.

No crear dependencias circulares.

Evitar código muerto.

---

# Validaciones

Después de cada migración parcial:

npm run build

Corregir errores.

Continuar.

Nunca continuar con errores de compilación.

---

# Reporte

Generar:

reports/phase4_1_spin_manager.md

Debe incluir:

# Responsabilidades encontradas

# Responsabilidades migradas

# Métodos implementados

# Código eliminado de main.js

# Wrappers temporales (si existen)

# Riesgos

# Próxima fase

---

# Criterio de éxito

La fase será exitosa únicamente si:

✔ SpinManager administra completamente las tiradas.

✔ TrackerState contiene el estado de spins.

✔ RouletteTracker expone la API pública.

✔ main.js deja de modificar directamente los arrays de spins.

✔ No cambia el comportamiento observable.

✔ Los motores siguen funcionando igual.

✔ La UI funciona exactamente igual.

✔ npm run build finaliza correctamente.

✔ No existen dependencias circulares.

---

# REGLA DE ORO

Mover únicamente la responsabilidad de las tiradas.

No aprovechar para refactorizar otras áreas.

No tocar sesiones.

No tocar configuración.

No tocar historial persistente.

No tocar EventBus.

Al finalizar, detenerse y esperar autorización para comenzar la Fase 4.2.
