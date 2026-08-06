# ORION REFACTOR - FASE 2
## Construcción del Kernel y Ciclo de Vida de los Motores

# Rol

Actúa como un Principal Software Architect especializado en:

- Clean Architecture
- Domain Driven Design
- SOLID
- Arquitectura Hexagonal
- Event Driven Architecture
- Dependency Injection
- JavaScript moderno
- Node.js
- Vite
- Sistemas modulares
- Refactorización incremental

Tu objetivo NO es agregar funcionalidades.

NO modificarás ningún algoritmo estadístico.

NO modificarás ningún cálculo matemático.

NO modificarás ninguna decisión de negocio.

Tu única misión es construir el verdadero núcleo de ORION.

---

# Proyecto

Ruta

/home/shared/lab_vito

---

# Estado actual

La Fase 1 ya fue completada.

Actualmente existen:

src/core/

    OrionKernel.js

    Bootstrap.js

    EngineRegistry.js

    EventBus.js

    ServiceContainer.js

main.js ya únicamente delega al Kernel.

El proyecto compila correctamente.

No romper nada.

---

# Objetivo

Convertir OrionKernel en el verdadero corazón del sistema.

Al finalizar esta fase:

main.js

↓

OrionKernel

↓

ServiceContainer

↓

EngineRegistry

↓

Bootstrap

↓

Motores

Todo el flujo debe pasar por OrionKernel.

---

# Restricciones

NO modificar

- HTML
- CSS
- lógica estadística
- cálculos
- DA
- Chi
- Kelly
- WinWin
- Sesgo97
- Laboratorio
- Tomador
- Ataque

No cambiar comportamiento.

No cambiar resultados.

No cambiar interfaz.

Solo reorganizar responsabilidades.

---

# Objetivo del Kernel

El Kernel será responsable de:

- iniciar el sistema
- crear servicios
- registrar motores
- inicializar motores
- iniciar motores
- detener motores
- destruir motores

Nunca realizará cálculos.

Nunca contendrá lógica estadística.

Nunca conocerá detalles internos de los motores.

Solo coordina.

---

# OrionKernel

Agregar métodos:

constructor()

bootstrap()

initialize()

start()

stop()

dispose()

Responsabilidad:

bootstrap()

↓

crea Container

↓

crea Registry

↓

crea EventBus

↓

ejecuta Bootstrap

↓

obtiene motores

↓

los registra

initialize()

↓

llama initialize() de todos los motores

start()

↓

llama start() de todos

stop()

↓

llama stop()

dispose()

↓

libera recursos

No agregar lógica adicional.

---

# EngineRegistry

Convertir EngineRegistry en un verdadero registro.

Debe soportar:

register(name, engine)

unregister(name)

has(name)

get(name)

getAll()

clear()

Debe mantener el orden de registro.

No debe conocer implementación de motores.

---

# Crear interfaz común de motores

Crear:

src/core/BaseEngine.js

Debe contener una clase base.

Métodos vacíos:

initialize()

start()

stop()

dispose()

Todos deben retornar Promise o ser async.

No modificar motores todavía.

Solo crear la interfaz.

---

# Bootstrap

Modificar Bootstrap.

Su responsabilidad será:

crear Tracker

crear Stores

crear Renderers

crear Motores

retornar una estructura:

{
    tracker,
    services,
    engines
}

No registrar motores.

Solo construirlos.

---

# OrionKernel

Después de ejecutar Bootstrap:

registrar automáticamente todos los motores en EngineRegistry.

Ejemplo:

for (const engine of bootstrap.engines)

↓

registry.register(engine.name, engine)

No registrar manualmente.

Debe ser automático.

---

# ServiceContainer

Agregar soporte para:

singleton

factory

instance

Debe permitir:

registerSingleton()

registerFactory()

registerInstance()

resolve()

exists()

No usar librerías externas.

---

# EventBus

Mejorar EventBus.

Debe soportar:

on()

once()

off()

emit()

removeAll()

Mantener implementación simple.

No migrar eventos todavía.

---

# Motores

NO modificar

DA

Chi

Kelly

WinWin

Sesgo97

Laboratorio

Tomador

Ataque

Solo permitir que el Kernel los conozca.

No cambiar comportamiento.

---

# Dependencias

El Kernel debe conocer motores.

Los motores NO deben conocer el Kernel.

Los motores NO deben conocerse entre ellos.

---

# Flujo esperado

main.js

↓

OrionKernel.bootstrap()

↓

Bootstrap

↓

crea objetos

↓

retorna motores

↓

Kernel registra motores

↓

Kernel.initialize()

↓

todos initialize()

↓

Kernel.start()

↓

todos start()

---

# Calidad

Seguir principios:

SOLID

Open/Closed

Single Responsibility

Dependency Inversion

No duplicar código.

No crear dependencias circulares.

No romper imports.

No introducir librerías.

---

# Validaciones obligatorias

Después de cada modificación:

verificar imports

verificar exports

npm run build

corregir errores

continuar

No dejar el proyecto en estado inconsistente.

---

# Reporte

Generar

reports/phase2_report.md

Debe incluir:

## Arquitectura del nuevo Kernel

## Responsabilidades del Kernel

## Responsabilidades de Bootstrap

## Responsabilidades del Registry

## Responsabilidades del Container

## Motores registrados

## Riesgos encontrados

## Próximos pasos para Fase 3

---

# Criterio de éxito

La fase se considera exitosa únicamente si:

✓ main.js continúa siendo mínimo

✓ OrionKernel controla completamente el ciclo de vida

✓ Los motores quedan registrados automáticamente

✓ No cambia ningún algoritmo

✓ La aplicación produce exactamente los mismos resultados

✓ npm run build termina sin errores

✓ No existen dependencias circulares

✓ El proyecto continúa funcionando exactamente igual

---

# REGLA DE ORO

Nunca hagas un refactor masivo.

Trabaja mediante pequeños cambios seguros.

Después de cada cambio:

1. Compilar.
2. Verificar.
3. Continuar.

Si algún cambio rompe la aplicación:

DETENER EL PROCESO

Corregir primero.

Luego continuar.

No continúes si existe un solo error.

---

# IMPORTANTE

Esta fase NO debe comenzar la migración al EventBus.

NO debe modificar los motores.

NO debe crear plugins.

NO debe mover renderers.

NO debe cambiar la lógica del Tracker.

Únicamente debe construir la infraestructura del Kernel que permitirá realizar esas migraciones en las siguientes fases.

Al finalizar, detenerse y esperar autorización para comenzar la Fase 3.
