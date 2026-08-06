# ORION REFACTOR - FASE 4
# Construcción del Dominio Roulette Tracker
## (NO migrar lógica todavía)

# IMPORTANTE

Esta fase NO es una migración.

Esta fase NO es un refactor masivo.

Esta fase únicamente construye el nuevo Dominio de Roulette Tracker.

NO mover lógica desde main.js.

NO mover algoritmos.

NO modificar comportamiento.

NO modificar HTML.

NO modificar CSS.

NO cambiar resultados.

NO eliminar código existente.

El objetivo es preparar la nueva arquitectura para las siguientes fases.

---

# Rol

Actúa como Principal Software Architect especializado en:

- Domain Driven Design
- Clean Architecture
- SOLID
- Arquitectura Hexagonal
- JavaScript moderno
- Node.js
- Vite
- Refactorización incremental

Tu misión consiste únicamente en construir el Dominio.

No migrar lógica.

---

# Proyecto

/home/shared/lab_vito

---

# Estado actual

Existe:

✔ OrionKernel

✔ Bootstrap

✔ EngineRegistry

✔ EventBus

✔ ServiceContainer

✔ BaseEngine

✔ Motores normalizados

✔ Build correcto

Todo funciona.

No romper nada.

---

# Objetivo

Construir el Dominio Roulette Tracker.

NO migrar comportamiento.

Solo crear la estructura.

---

# Crear

src/tracker/

    RouletteTracker.js

    TrackerState.js

    SpinManager.js

    SessionManager.js

    HistoryManager.js

    SettingsManager.js

    index.js

---

# TrackerState

Crear una clase TrackerState.

Será el único lugar donde vive el estado del dominio.

Debe contener únicamente la estructura.

Ejemplo conceptual

class TrackerState {

    session

    spins

    history

    settings

}

No implementar lógica.

Solo estructura.

---

# RouletteTracker

Será el orquestador del dominio.

Debe recibir:

TrackerState

SpinManager

SessionManager

HistoryManager

SettingsManager

Responsabilidades:

- coordinar managers
- exponer API pública
- preparar integración con EventBus

NO implementar lógica todavía.

Crear únicamente la interfaz del dominio.

---

# SpinManager

Crear una implementación mínima.

Métodos vacíos.

Ejemplo

addSpin()

removeLast()

clear()

getHistory()

No mover lógica existente.

---

# SessionManager

Crear únicamente la interfaz.

initialize()

start()

reset()

stop()

status()

No mover código.

---

# HistoryManager

Crear únicamente:

save()

load()

clear()

No implementar persistencia.

---

# SettingsManager

Crear únicamente:

load()

save()

reset()

No mover configuración existente.

---

# Bootstrap

Modificar Bootstrap.

Debe crear una instancia de RouletteTracker.

Debe inyectar:

TrackerState

Managers

El resto de la aplicación continuará funcionando igual.

El Tracker todavía no debe utilizarse.

Solo debe existir.

---

# OrionKernel

Registrar el Tracker.

Debe poder obtenerse mediante:

kernel.getTracker()

o mecanismo equivalente.

No reemplazar el flujo actual.

Solo agregar soporte.

---

# main.js

NO mover lógica.

NO eliminar código.

Solo permitir acceder al nuevo Tracker si fuera necesario.

main.js debe seguir funcionando exactamente igual.

---

# EventBus

NO migrar eventos.

NO emitir eventos.

Únicamente dejar preparado RouletteTracker para utilizarlos en futuras fases.

---

# Motores

NO modificar.

DA

CHI

Kelly

WinWin

Tomador

Ataque

Laboratorio

Sesgo97

No cambiar imports.

No cambiar comportamiento.

---

# UI

NO modificar.

---

# Calidad

Aplicar:

SOLID

DDD

SRP

Dependency Inversion

No crear dependencias circulares.

No crear acoplamiento innecesario.

---

# Validaciones

Después de cada modificación:

npm run build

Corregir errores.

Continuar.

Nunca dejar el proyecto inconsistente.

---

# Reporte

Generar

reports/phase4_domain_build.md

Debe incluir:

# Nuevo Dominio

# TrackerState

# RouletteTracker

# Managers creados

# Dependencias

# Integración con Kernel

# Riesgos

# Preparación para Fase 4.1

---

# Criterio de éxito

La fase será exitosa únicamente si:

✔ Existe src/tracker/

✔ Existe TrackerState

✔ Existe RouletteTracker

✔ Existen todos los Managers

✔ Bootstrap crea el Tracker

✔ Kernel registra el Tracker

✔ main.js continúa funcionando exactamente igual

✔ No se mueve lógica desde main.js

✔ No cambia ningún algoritmo

✔ npm run build finaliza correctamente

✔ No existen dependencias circulares

---

# REGLA DE ORO

No migrar comportamiento.

No mover lógica.

No eliminar código.

Solo construir el nuevo Dominio.

La siguiente fase será la encargada de migrar responsabilidades de forma incremental.

Al finalizar, detenerse y esperar autorización para comenzar la Fase 4.1.
