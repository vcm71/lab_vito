# =====================================================================
# Roulette Tracker
#
# FASE 6.C.1B
#
# LABORATORY UX/UI BLUEPRINT
#
# NO IMPLEMENTAR CÓDIGO
#
# ARQUITECTURA VISUAL COMPLETA
# =====================================================================

Antes de realizar cualquier acción:

Lee completamente el proyecto.

Lee completamente el reporte generado en la Fase 6.C.1.

No escribas código.

No modifiques archivos del proyecto.

No agregues componentes.

No hagas refactor.

No cambies CSS.

No cambies HTML.

No cambies JavaScript.

No modifiques el dominio Laboratory.

No modifiques LaboratoryOrchestrator.

No modifiques motores.

No cambies contratos públicos.

El objetivo ES ÚNICAMENTE producir el Blueprint arquitectónico definitivo de la futura interfaz del Laboratorio.

======================================================================
OBJETIVO
======================================================================

Diseñar completamente la experiencia de usuario (UX) y la arquitectura visual (UI) del módulo Laboratory.

El documento generado será el contrato oficial para todas las implementaciones posteriores (C.2 hasta C.7).

No debe existir ninguna implementación.

Solamente documentación arquitectónica.

======================================================================
ANALIZAR
======================================================================

Analizar completamente:

• index.html

• style.css

• main.js

• renderers

• tabs

• sistema visual

• navegación

• paneles

• cards

• tablas

• componentes reutilizables

• LaboratoryOrchestrator

• estructura de src/laboratory

======================================================================
GENERAR
======================================================================

Crear únicamente:

reports/LABORATORY_UI_BLUEPRINT.md

======================================================================
EL DOCUMENTO DEBE CONTENER
======================================================================

# 1. Filosofía de diseño

Explicar:

- objetivos UX

- principios

- consistencia visual

- modularidad

- desacoplamiento

- reutilización

- escalabilidad

---------------------------------------------------------------------

# 2. Arquitectura visual completa

Mostrar un diagrama ASCII de toda la aplicación.

Ejemplo:

Application

├── Header

├── Navigation

├── Laboratory

│   ├── Sidebar

│   ├── Toolbar

│   ├── Workspace

│   ├── Dialogs

│   ├── Notifications

│   └── StatusBar

└── Footer

No copiar este ejemplo.

Generar el real.

---------------------------------------------------------------------

# 3. Árbol completo de componentes

Para cada componente indicar:

Nombre

Responsabilidad

Entradas

Salidas

Eventos

Dependencias

Componentes hijos

Componentes reutilizados

Componentes nuevos

---------------------------------------------------------------------

# 4. Flujo de navegación

Crear un mapa visual ASCII.

Ejemplo:

Laboratory

↓

Workspace

↓

Experiment

↓

Session

↓

Comparison

↓

Evidence

↓

Replay

↓

AI Research

Generar el flujo real.

---------------------------------------------------------------------

# 5. Flujo de datos

Mostrar cómo viajan los datos.

Ejemplo:

Domain

↓

Application

↓

Presenter

↓

Renderer

↓

Workspace

↓

Panels

↓

Widgets

Indicar claramente responsabilidades.

---------------------------------------------------------------------

# 6. Contratos entre componentes

Para cada componente indicar:

Entradas

Salidas

Eventos

Estado

Dependencias

Nunca escribir código.

---------------------------------------------------------------------

# 7. Estados visuales

Definir completamente:

Loading

Empty

Error

Warning

Success

Disabled

Read Only

Offline

Processing

Completed

Sin implementar.

---------------------------------------------------------------------

# 8. Wireframes ASCII

Crear wireframes detallados de:

Laboratory Home

Experiment Workspace

Session View

Comparison Dashboard

Evidence Explorer

Replay

AI Research

No usar imágenes.

Solo diagramas ASCII.

---------------------------------------------------------------------

# 9. Sidebar

Diseñar completamente:

Jerarquía

Grupos

Expansión

Colapso

Persistencia

Accesibilidad

---------------------------------------------------------------------

# 10. Toolbar

Diseñar:

Acciones

Filtros

Búsquedas

Indicadores

Estado

---------------------------------------------------------------------

# 11. Workspace

Definir:

Layout

Paneles

Divisiones

Áreas

Persistencia

Redimensionamiento

---------------------------------------------------------------------

# 12. Dashboard

Definir:

Cards

KPIs

Indicadores

Gráficos

Tablas

Prioridades visuales

---------------------------------------------------------------------

# 13. Responsive

Definir comportamiento para:

Desktop

Laptop

Tablet

Pantallas pequeñas

---------------------------------------------------------------------

# 14. Accesibilidad

Definir:

ARIA

Focus

Keyboard Navigation

Contraste

Lectores de pantalla

---------------------------------------------------------------------

# 15. Sistema visual

Inventariar:

Colores

Tokens

Tipografías

Espaciados

Sombras

Bordes

Iconografía

Animaciones

Indicar qué se reutiliza y qué podría ampliarse.

---------------------------------------------------------------------

# 16. Riesgos

Arquitectónicos

UX

Performance

Mantenibilidad

Escalabilidad

---------------------------------------------------------------------

# 17. Roadmap

Preparar las siguientes fases:

C.2

C.3

C.4

C.5

C.6

C.7

Indicar qué implementará exactamente cada una.

======================================================================
RESTRICCIONES
======================================================================

No modificar ningún archivo.

No generar componentes.

No crear rutas.

No escribir JavaScript.

No escribir HTML.

No escribir CSS.

No escribir TypeScript.

No escribir pseudocódigo.

No modificar el proyecto.

======================================================================
CRITERIOS DE ÉXITO
======================================================================

Al finalizar debe existir únicamente:

reports/LABORATORY_UI_BLUEPRINT.md

El proyecto debe permanecer idéntico.

Sin cambios de código.

Sin cambios visuales.

Sin cambios funcionales.

Solo documentación arquitectónica.

Este documento será el contrato oficial para implementar las fases C.2 a C.7.
