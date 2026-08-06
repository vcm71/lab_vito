# ORION REFACTOR
# ETAPA 2
# FASE 5.5.4
# ELIMINACIÓN FÍSICA DEL LEGACY TRACKER

==================================================
# CONTEXTO
==================================================

La migración progresiva del Tracker Legacy hacia una
arquitectura basada en dominio ha completado todas las
etapas previas.

Estado actual confirmado:

## Dominio

- RouletteTracker es el Owner real de Spins.
- SpinManager administra operaciones de Spins.
- SessionManager administra sesiones.
- HistoryManager administra historial.
- SettingsManager administra configuración.
- RouletteAnalytics concentra métricas.
- numberMeta concentra conocimiento estático de números.

## Compatibilidad

- TrackerCompat reemplaza la antigua API Legacy.
- TrackerSyncAdapter ya no participa del flujo principal.
- Monkey patches eliminados.
- main.js trabaja con Domain + Compatibilidad explícita.

## Consumidores

- Engines migrados.
- Tester migrado.
- MonteCarloValidator migrado.
- Renderers desacoplados de la implementación Legacy.

Arquitectura actual:

```
                    UI
                     |
                     ▼

              TrackerCompat
          (compatibilidad temporal)

                     |
                     ▼

              RouletteTracker
                (Domain Core)

       ┌─────────────┼─────────────┐
       ▼             ▼             ▼

   Engines       Renderers     Simulation

                     |
                     ▼

              Domain Services
```

El único objetivo pendiente es eliminar físicamente
el antiguo Legacy Tracker.

==================================================
# OBJETIVO
==================================================

Eliminar definitivamente:

- rouletteTracker.js Legacy.
- imports Legacy restantes.
- exports Legacy.
- código duplicado heredado.
- referencias de compatibilidad internas.

Resultado esperado:

RouletteTracker queda como:

- único Tracker del sistema;
- única fuente de verdad;
- único owner del estado.

==================================================
# PRINCIPIO FUNDAMENTAL
==================================================

Esta fase es una operación de limpieza.

NO realizar:

- mejoras funcionales;
- cambios de algoritmos;
- optimizaciones no necesarias;
- cambios de UI;
- cambios de comportamiento.

La regla es:

Eliminar solamente aquello que ya fue reemplazado.

==================================================
# FASE 1
# AUDITORÍA FINAL DE REFERENCIAS
==================================================

Antes de eliminar archivos realizar búsqueda completa.

Buscar:

```
rouletteTracker.js
LegacyTracker
legacyTracker
TrackerSyncAdapter
syncAdapter
externalSpins
new RouletteTracker
new Legacy
```

Revisar:

- imports;
- exports;
- constructores;
- parámetros;
- referencias dinámicas;
- comentarios temporales.

Crear inventario:

| Referencia | Archivo | Tipo | Estado | Acción |
|---|---|---|---|---|
| Legacy Tracker | archivo | Import | Activo/Muerto | Migrar/Eliminar |
| TrackerCompat | archivo | Compatibilidad | Mantener | Ninguna |
| Legacy API | archivo | Referencia | Revisar | Resolver |

No eliminar nada hasta cerrar el inventario.

==================================================
# FASE 2
# MIGRACIÓN DE REFERENCIAS RESIDUALES
==================================================

Cualquier referencia restante al Legacy debe migrarse.

Reglas:

## Escrituras

Usar:

```
RouletteTracker
```

o:

```
TrackerCompat
```

cuando exista una necesidad de compatibilidad externa.

---

## Lecturas de estado

Usar:

```
RouletteTracker API
```

Nunca:

```
Legacy interno
```

---

## Métricas

Usar:

```
RouletteAnalytics
```

---

## Constantes

Usar:

```
numberMeta
```

---

Eliminar cualquier dependencia hacia:

- arrays Legacy;
- caches Legacy;
- propiedades privadas;
- métodos internos.

==================================================
# FASE 3
# ELIMINACIÓN DE LEGACY TRACKER
==================================================

Sólo ejecutar cuando:

✓ No existen imports.

✓ No existen instancias.

✓ No existen consumidores.

✓ Build previo correcto.

Eliminar:

```
rouletteTracker.js
```

Eliminar también:

- exports asociados;
- referencias en bootstrap;
- referencias en configuración;
- archivos auxiliares exclusivos.

==================================================
# FASE 4
# LIMPIEZA DE DUPLICACIÓN
==================================================

Auditar código duplicado heredado.

Buscar:

- getStats();
- getAdvancedStats();
- getHitMap();
- getHitRanking();
- getProbabilities();
- getWheelDistance();
- metadata;
- delays;
- frecuencia;
- normalización.

Regla:

Mantener responsabilidad donde corresponde:

| Responsabilidad | Ubicación |
|---|---|
| Estado | RouletteTracker |
| Spins | SpinManager |
| Métricas | RouletteAnalytics |
| Metadata | numberMeta |
| Compatibilidad API | TrackerCompat |

Eliminar copias Legacy.

==================================================
# FASE 5
# VERIFICACIÓN DE AUSENCIA LEGACY
==================================================

Ejecutar búsquedas:

```
grep -R "LegacyTracker"
grep -R "legacyTracker"
grep -R "rouletteTracker.js"
grep -R "TrackerSyncAdapter"
```

Resultado esperado:

No deben existir referencias activas.

Las únicas referencias permitidas son:

- documentación histórica;
- reportes de fases anteriores.

==================================================
# PRUEBAS FUNCIONALES
==================================================

Verificar obligatoriamente:

## Spins

✓ addSpin

✓ deleteSpin

✓ updateSpin

✓ importSpins

✓ clearSpins


## Sesión

✓ recordSession

✓ clearSessionAndRecord


## Datos

✓ History

✓ HitMap

✓ Ranking

✓ Estadísticas

✓ Probabilidades


## Consumidores

✓ WinWin

✓ Orion

✓ DA

✓ Kelly

✓ Logic

✓ Sesgo97

✓ MonteCarlo


## UI

✓ Renderers funcionan.

✓ No hay cambios visuales.

==================================================
# BUILD
==================================================

Ejecutar:

```bash
npm run build
```

Resultado requerido:

```
0 errores
```

Registrar:

- módulos generados;
- tiempo;
- warnings existentes.

==================================================
# ENTREGABLE
==================================================

Generar:

```
reports/

FASE_5_5_4_LEGACY_PHYSICAL_REMOVAL.md
```

Debe incluir:

1. Resumen ejecutivo.

2. Estado inicial.

3. Auditoría final.

4. Referencias encontradas.

5. Migraciones realizadas.

6. rouletteTracker.js eliminado.

7. Código duplicado eliminado.

8. Validaciones ejecutadas.

9. Resultado build.

10. Arquitectura final.

==================================================
# CRITERIO DE ACEPTACIÓN
==================================================

La fase está completa cuando:

✓ rouletteTracker.js Legacy no existe.

✓ No existen imports Legacy.

✓ No existe TrackerSyncAdapter.

✓ No existen monkey patches.

✓ No existen sincronizaciones duplicadas.

✓ TrackerCompat es la única capa de compatibilidad.

✓ RouletteTracker es el único Tracker.

✓ Build correcto.

✓ Sin regresiones funcionales.

==================================================
# ARQUITECTURA FINAL ORION
==================================================

```
                         UI
                          |
                          ▼

                   TrackerCompat
              (compatibilidad externa)

                          |
                          ▼

                  RouletteTracker
                    (Domain Core)

        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼

   SpinManager      SessionManager    HistoryManager

        |
        ▼

 RouletteAnalytics
 numberMeta
```

==================================================
# FIN ETAPA 2
==================================================

Resultado esperado:

ORION queda completamente migrado desde el modelo Legacy
hacia una arquitectura DDD + Clean Architecture.

RouletteTracker se consolida como el único núcleo del sistema.
