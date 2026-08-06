# ORION REFACTOR - FASE 3
# Engine Normalization
## Construcción de la arquitectura modular de Orion

# Rol

Actúa como un Principal Software Architect con experiencia en:

- Clean Architecture
- Hexagonal Architecture
- Domain Driven Design
- SOLID
- Enterprise Software
- Sistemas Multiagente
- Sistemas Modulares
- JavaScript moderno
- Node.js
- Vite
- Arquitectura basada en componentes

Tu misión NO es agregar funcionalidades.

NO modificarás algoritmos.

NO modificarás estadísticas.

NO modificarás cálculos.

NO modificarás resultados.

NO modificarás la interfaz visible.

Solo construirás una arquitectura sostenible.

---

# Proyecto

Ruta

/home/shared/lab_vito

---

# Estado actual

Las Fases 1 y 2 fueron completadas.

Actualmente existen:

✔ OrionKernel

✔ Bootstrap

✔ EventBus

✔ EngineRegistry

✔ ServiceContainer

✔ BaseEngine

Todo compila correctamente.

No romper nada.

---

# Objetivo de esta fase

Normalizar TODOS los motores.

Todos los motores deben tener exactamente la misma estructura.

No importa qué hagan.

Todos deben verse iguales.

El Kernel nunca debe conocer detalles internos.

---

# Arquitectura objetivo

Cada motor debe terminar con esta estructura.

src/

engines/

    Orion/

        index.js

        OrionEngine.js

        OrionStore.js

        OrionConfig.js

        OrionMetadata.js

    DA/

        index.js

        DAEngine.js

        DAStore.js

        DAConfig.js

        DAMetadata.js

    Chi/

    Kelly/

    WinWin/

    Sesgo97/

    Ataque/

    Tomador/

    Lab/

---

# IMPORTANTE

NO crear archivos vacíos innecesarios.

Si un Store aún no existe,

crear únicamente una implementación mínima.

Lo mismo para Config y Metadata.

No inventar lógica.

---

# Cada Engine

Debe extender

BaseEngine

Ejemplo

export class DAEngine extends BaseEngine

Debe implementar

initialize()

start()

stop()

dispose()

Si alguna función aún no es necesaria,

implementar una versión mínima.

---

# Cada carpeta

Debe contener un

index.js

que exporte únicamente la API pública.

Ejemplo

export * from "./DAEngine.js";

export * from "./DAStore.js";

Nunca importar archivos internos directamente desde fuera.

Siempre importar desde index.js.

---

# Config

Cada motor debe tener su propia configuración.

Ejemplo

DAConfig.js

Debe contener únicamente

const DEFAULT_CONFIG

y funciones para leer configuración.

No mover configuración global todavía.

---

# Metadata

Cada motor debe exponer información descriptiva.

Ejemplo

export default {

    id:"da",

    name:"DA Engine",

    version:"1.0",

    author:"ORION",

    description:"..."

}

Todavía no utilizar Metadata.

Solo prepararla.

---

# Store

Si el motor mantiene estado,

crear un Store.

Si aún no existe,

crear una implementación mínima.

Ejemplo

class DAStore

getState()

setState()

reset()

Nada más.

---

# Renderers

NO mover todavía.

Los Renderers permanecen donde están.

Solo actualizar imports si fuera necesario.

---

# Bootstrap

Modificar Bootstrap.

Ya no debe importar motores individuales.

Debe importar únicamente

src/engines/*/index.js

Nunca importar implementaciones internas.

---

# EngineRegistry

Registrar motores únicamente usando

Metadata.id

Nunca registrar nombres escritos manualmente.

Ejemplo

registry.register(

metadata.id,

engine

)

---

# Kernel

El Kernel nunca debe saber qué motor está cargando.

Solo recibe

engine

+

metadata

---

# Dependencias

Prohibido

DA

↓

Chi

↓

Kelly

↓

WinWin

↓

Tomador

↓

Ataque

↓

Sesgo

comunicándose entre sí.

Cada motor únicamente conoce:

BaseEngine

Store

Config

Metadata

Nada más.

---

# NO HACER

No implementar EventBus todavía.

No mover Renderers.

No crear Plugins.

No crear carga dinámica.

No crear reflexión.

No cambiar Tracker.

No cambiar Stores existentes.

No cambiar HTML.

No cambiar CSS.

---

# Calidad

Seguir estrictamente

SOLID

DRY

KISS

YAGNI

Single Responsibility

Open Closed

Dependency Inversion

---

# Validaciones

Después de cada cambio

npm run build

Corregir errores.

Continuar.

Nunca dejar imports rotos.

Nunca dejar referencias rotas.

---

# Reporte

Generar

reports/phase3_report.md

Debe contener

## Motores normalizados

## Cambios realizados

## Imports simplificados

## Acoplamiento eliminado

## Riesgos

## Recomendaciones

## Preparación para Fase 4

---

# Criterio de éxito

La fase solo termina si

✔ Todos los motores tienen exactamente la misma estructura.

✔ Todos extienden BaseEngine.

✔ Todos exponen index.js.

✔ Todos poseen Config.

✔ Todos poseen Metadata.

✔ Todos poseen Store.

✔ El Kernel ya no conoce implementaciones concretas.

✔ Bootstrap importa únicamente index.js.

✔ El proyecto produce exactamente el mismo resultado.

✔ npm run build termina sin errores.

---

# REGLA DE ORO

No hacer un Big Bang Refactor.

Trabajar motor por motor.

Después de terminar un motor

↓

Compilar

↓

Verificar

↓

Continuar con el siguiente.

Si un motor produce errores

DETENER EL PROCESO.

Corregir.

Luego continuar.

Nunca avanzar con errores.

---

# VISIÓN ARQUITECTÓNICA

Esta fase NO busca ordenar archivos.

Busca convertir cada motor en un módulo autocontenido.

Al finalizar esta fase,

cada motor deberá poder evolucionar de forma independiente.

La Fase 4 dependerá completamente de esta arquitectura.

No avanzar a la Fase 4 automáticamente.

Esperar autorización.
