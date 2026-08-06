# ORION REFACTOR
# ETAPA 2
# FASE 5.5.3
# RETIRADA DEFINITIVA DEL LEGACY TRACKER

==================================================
## CONTEXTO
==================================================

Las fases anteriores completaron la migración progresiva
desde la arquitectura Legacy hacia el dominio.

Estado actual confirmado:

- RouletteTracker es el núcleo principal del sistema.
- RouletteTracker es Owner de Spins.
- Session, Settings e History pertenecen al dominio.
- Engines consumen APIs públicas del dominio.
- Bootstrap crea Domain Tracker como componente primario.
- MonteCarloValidator fue desacoplado del Legacy.
- tomadorRenderer ya no depende de métodos estáticos del Tracker.
- externalSpins eliminado.
- TrackerSyncAdapter mantiene únicamente compatibilidad residual.

Arquitectura actual:

```
                 UI
                  |
                  ▼

           RouletteTracker
                  |
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   Engines    Renderers   Simulation


                  |
                  ▼

        Legacy Tracker
        (compatibilidad temporal)
```

El objetivo de esta fase es eliminar definitivamente
la capa Legacy.

==================================================
## OBJETIVO PRINCIPAL
==================================================

Eliminar completamente:

- Legacy Tracker.
- TrackerSyncAdapter.
- monkey patches de compatibilidad.
- sincronizaciones Domain → Legacy.
- imports heredados.
- código muerto relacionado.

Resultado esperado:

RouletteTracker debe quedar como:

- única fuente de verdad;
- único owner del estado;
- única implementación válida del tracker.

==================================================
## PRINCIPIO DE EJECUCIÓN
==================================================

Esta fase NO es una refactorización funcional.

No se deben:

- cambiar algoritmos;
- modificar cálculos;
- alterar comportamiento observable;
- mejorar funcionalidades.

Sólo retirar capas temporales.

Regla:

Eliminar únicamente después de demostrar
que no existen consumidores activos.

==================================================
# PASO 1
# AUDITORÍA FINAL PRE-ELIMINACIÓN
==================================================

Antes de borrar cualquier archivo realizar búsqueda completa:

Buscar:

```
LegacyTracker
legacyTracker
rouletteTracker
TrackerSyncAdapter
syncAllSpins
syncAdapter
externalSpins
new Legacy
```

También revisar:

- imports;
- exports;
- constructores;
- parámetros;
- dependencias indirectas.

Clasificar cada referencia:

| Estado | Acción |
|---|---|
| Activa | Migrar antes de eliminar |
| Compatibilidad | Eliminar si ya no es necesaria |
| Muerta | Eliminar |
| Externa | Documentar |

No eliminar sin clasificación.

==================================================
# PASO 2
# ELIMINACIÓN DE TRACKER SYNC ADAPTER
==================================================

Actualmente:

```
RouletteTracker

      |
      ▼

TrackerSyncAdapter

      |
      ▼

Legacy Tracker
```

Objetivo:

```
RouletteTracker
```

Eliminar:

- creación del adapter;
- imports;
- referencias;
- métodos puente;
- sincronización de arrays;
- sincronización de frecuencias;
- sincronización de metadata.

Verificar que ningún componente llame:

```
syncAdapter.*
```

==================================================
# PASO 3
# ELIMINACIÓN DE MONKEY PATCHES
==================================================

Auditar main.js.

Buscar patrones:

```javascript
tracker.addSpin = ...
tracker.deleteSpin = ...
tracker.updateSpin = ...
tracker.clearSession = ...
```

Eliminar la capa de redirección.

Antes:

```
Renderer

   |
   ▼

Legacy API parcheada

   |
   ▼

TrackerSyncAdapter

   |
   ▼

Domain
```

Después:

```
Renderer

   |
   ▼

RouletteTracker API
```

Mantener compatibilidad sólo donde sea estrictamente necesario.

==================================================
# PASO 4
# ELIMINACIÓN DEL LEGACY TRACKER
==================================================

Sólo ejecutar después de:

- eliminar TrackerSyncAdapter;
- eliminar monkey patches;
- confirmar ausencia de consumidores.

Eliminar:

- archivo Legacy Tracker;
- imports;
- exports;
- referencias;
- comentarios temporales.

Buscar referencias residuales:

```
LegacyTracker
rouletteTracker.js antiguo
```

El proyecto debe quedar con:

```
src/tracker/RouletteTracker.js
```

como único tracker.

==================================================
# PASO 5
# LIMPIEZA FINAL
==================================================

Eliminar:

- variables legacy;
- nombres heredados;
- código muerto;
- comentarios de migración temporal.

No realizar:

- reorganización masiva;
- cambios de arquitectura adicionales;
- mejoras no relacionadas.

==================================================
# VERIFICACIONES OBLIGATORIAS
==================================================

Confirmar:

✓ No existe Legacy Tracker.

✓ No existe TrackerSyncAdapter.

✓ No existen imports Legacy.

✓ No existen monkey patches.

✓ Bootstrap sólo crea Domain Tracker.

✓ OrionKernel utiliza Domain Tracker.

✓ Engines funcionan.

✓ Renderers funcionan.

✓ Simulation funciona.

✓ MonteCarlo funciona.

✓ History funciona.

✓ Session funciona.

✓ HitMap funciona.

✓ Persistencia funciona.


Ejecutar:

```bash
npm run build
```

Resultado esperado:

```
0 errores
```

==================================================
# VALIDACIÓN DE REGRESIÓN
==================================================

Comparar antes/después.

Verificar:

- cantidad de spins;
- orden de spins;
- frecuencias;
- estadísticas;
- historial;
- sesiones;
- configuración.

Resultado esperado:

```
Estado antes = Estado después
```

No debe existir diferencia funcional.

==================================================
# ENTREGABLES
==================================================

Generar:

```
reports/

FASE_5_5_3_LEGACY_REMOVAL.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Estado inicial

3. Auditoría final

4. Dependencias encontradas

5. TrackerSyncAdapter eliminado

6. Monkey patches eliminados

7. Legacy Tracker eliminado

8. Código muerto eliminado

9. Validación funcional

10. Resultado del build

11. Arquitectura final

==================================================
# CRITERIO DE ACEPTACIÓN
==================================================

La fase está completa únicamente si:

- RouletteTracker es la única implementación.
- Legacy Tracker fue eliminado.
- TrackerSyncAdapter fue eliminado.
- No existe sincronización duplicada.
- No existen referencias Legacy.
- El sistema compila.
- El comportamiento observable permanece igual.

==================================================
# ESTADO FINAL ESPERADO
==================================================

Arquitectura final:

```
                      UI
                       |
                       ▼

               RouletteTracker

                       |
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼

    Engines        Renderers     Simulation


                       |
                       ▼

               Domain completo
```

==================================================
# FIN ETAPA 2
==================================================

Resultado esperado:

Roulette Tracker queda completamente migrado desde
la arquitectura Legacy hacia un dominio explícito basado
en DDD + Clean Architecture.

RouletteTracker se convierte en el único núcleo del sistema.
