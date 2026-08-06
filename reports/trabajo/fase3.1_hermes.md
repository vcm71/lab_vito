# ORION REFACTOR
# ETAPA 3
# FASE 3.1
# API FREEZE

Continuemos exactamente desde el último Punto de Control.

## Contexto

La migración desde el Legacy Tracker ha finalizado completamente.

Estado actual:

- RouletteTracker es el único núcleo del dominio.
- Legacy Tracker fue eliminado físicamente.
- TrackerSyncAdapter fue eliminado.
- TrackerCompat es la única capa temporal de compatibilidad.
- El proyecto compila correctamente.
- No debe modificarse el comportamiento observable.

A partir de esta etapa ya no estamos migrando arquitectura, sino endureciendo (Domain Hardening) el dominio.

---

## Objetivo de esta fase

Realizar una auditoría completa de la API pública de `RouletteTracker` para definir el contrato estable del dominio.

El objetivo es identificar con precisión:

- métodos públicos que forman parte del contrato oficial;
- métodos internos que no deberían ser consumidos externamente;
- métodos heredados por compatibilidad;
- duplicidades;
- código candidato a simplificación futura.

Todavía **NO** eliminar compatibilidad.

Todavía **NO** modificar consumidores.

Todavía **NO** cambiar comportamiento.

Esta fase es únicamente de auditoría y consolidación.

---

## Reglas

- Mantener DDD + Clean Architecture.
- Refactor incremental.
- No introducir funcionalidades nuevas.
- No modificar UI.
- No modificar HTML/CSS.
- No cambiar comportamiento observable.
- Mantener compatibilidad existente.
- El proyecto debe compilar al finalizar.

---

## Entregables

1. Inventario completo de la API pública de `RouletteTracker`.

2. Clasificación de cada método:

- Público (contrato estable)
- Interno
- Compatibilidad temporal
- Candidato a eliminación futura

3. Identificación de responsabilidades duplicadas.

4. Recomendaciones para simplificación futura (sin implementarlas aún).

5. Si corresponde, generar la documentación inicial del contrato público del dominio.

Antes de escribir código, realiza primero la auditoría completa y explica las conclusiones. Sólo después propone los cambios mínimos necesarios para consolidar la API pública.
