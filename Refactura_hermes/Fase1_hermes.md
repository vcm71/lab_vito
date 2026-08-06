# ORION REFACTOR PHASE 1
## Objetivo

Actúa como un Arquitecto Principal de Software (Staff/Principal Engineer) experto en:

- Clean Architecture
- Domain Driven Design (DDD)
- SOLID
- Arquitectura Hexagonal
- Sistemas orientados a eventos
- JavaScript moderno
- Vite
- Node.js
- Refactorización incremental
- Sistemas críticos

Tu misión NO es agregar funcionalidades.

Tu misión es preparar la arquitectura de ORION para su crecimiento futuro.

La aplicación DEBE seguir funcionando exactamente igual al finalizar cada cambio.

Nunca rompas compatibilidad.

Nunca cambies algoritmos.

Nunca cambies cálculos estadísticos.

Nunca modifiques la lógica matemática.

Solo reorganiza responsabilidades.

---

# Proyecto

Ruta del proyecto

/home/shared/lab_vito

---

# Contexto

ORION es una plataforma de análisis estadístico para ruleta americana.

Está compuesta por múltiples motores independientes:

- ORION Logic
- DA Engine
- WinWin
- Chi
- Kelly
- Sesgo97
- Laboratorio
- Tomador
- Ataque

Todos dependen actualmente de un archivo main.js demasiado grande.

El objetivo es convertir main.js en un simple punto de entrada.

---

# Restricciones

NO modificar:

- algoritmos
- cálculos
- fórmulas
- modelos estadísticos
- HTML visible
- CSS
- comportamiento de la UI

La aplicación debe producir exactamente los mismos resultados.

Solo cambia la arquitectura.

---

# Objetivo de esta fase

Reducir la responsabilidad de main.js.

No importa que siga siendo grande.

Lo importante es comenzar a mover responsabilidades fuera de él.

---

# Paso 1

Crear la siguiente estructura.

src/

    core/

        OrionKernel.js

        Bootstrap.js

        EngineRegistry.js

        EventBus.js

        ServiceContainer.js

Si algún archivo aún no se utiliza, créalo igualmente con una implementación mínima.

---

# OrionKernel

Crear una clase.

export class OrionKernel

Debe contener inicialmente únicamente:

constructor()

bootstrap()

No agregar lógica innecesaria.

Debe ser muy pequeña.

---

# Bootstrap

Mover desde main.js únicamente la lógica de inicialización del proyecto.

Por ejemplo:

- creación del Tracker
- creación de Stores
- carga de configuración

NO mover todavía motores.

---

# EngineRegistry

Crear una clase responsable únicamente de registrar motores.

Debe permitir:

register()

get()

getAll()

Aún no debe contener lógica adicional.

---

# EventBus

Crear un EventBus extremadamente pequeño basado en EventTarget o EventEmitter.

Debe soportar:

on()

off()

emit()

Nada más.

Todavía no migrar eventos.

---

# ServiceContainer

Crear un contenedor simple para servicios compartidos.

Debe permitir:

register()

resolve()

exists()

Sin dependencias externas.

---

# Main.js

Modificar main.js únicamente para:

importar OrionKernel

crear una instancia

ejecutar bootstrap()

Toda la lógica posible debe comenzar a salir de main.js.

No eliminar código todavía.

Moverlo.

---

# Importante

Cada cambio debe dejar el proyecto funcionando.

Después de cada modificación:

- verificar imports
- verificar exports
- verificar que Vite compile
- verificar que no existan referencias rotas

---

# Calidad

Seguir principios:

SOLID

Single Responsibility

Open Closed

Dependency Injection cuando sea posible

No introducir dependencias nuevas.

---

# Al finalizar

Generar un reporte llamado

reports/phase1_report.md

Debe incluir:

## Archivos creados

## Archivos modificados

## Responsabilidades movidas

## Riesgos encontrados

## Recomendaciones para la Fase 2

No continuar automáticamente con la siguiente fase.

Esperar aprobación.

---

# Criterio de éxito

Si al finalizar

main.js únicamente inicializa OrionKernel

y toda la aplicación continúa funcionando exactamente igual,

la tarea se considera completada.

No realizar cambios adicionales.
