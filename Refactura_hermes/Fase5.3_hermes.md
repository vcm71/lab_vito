# ORION REFACTOR
# ETAPA 2
# FASE 5.3
# ELIMINACIÓN DE externalSpins + MIGRACIÓN TESTER / SIMULATION

## Contexto

La Fase 5.2.5 completó la inversión del ownership de Spins.

Estado actual:

- RouletteTracker es el Owner de Spins.
- Legacy Tracker funciona como adaptador temporal.
- TrackerSyncAdapter mantiene compatibilidad Domain → Legacy.
- Los consumidores principales ya no dependen de internals del Legacy.

Arquitectura actual:

UI

↓

TrackerSyncAdapter

↓

RouletteTracker
(Owner)

↓

Legacy Tracker
(Adapter temporal)


Durante la migración inicial existía `externalSpins` como mecanismo de compatibilidad.

La auditoría previa determinó que:

- `externalSpins` quedó funcionalmente muerto.
- El dominio ya posee la fuente de verdad.
- Mantenerlo aumenta complejidad y deuda técnica.

---

# Objetivo

Eliminar progresivamente `externalSpins` y migrar los flujos de prueba, simulación y validación para consumir exclusivamente el dominio.

La fase debe reducir compatibilidad heredada sin comprometer estabilidad.

---

# Alcance

## 1. Auditoría de externalSpins

Localizar todos los usos de:

- externalSpins
- referencias equivalentes
- sincronizaciones asociadas
- parámetros heredados
- estructuras temporales

Clasificar cada uso:

✔ Eliminable

△ Requiere migración

✖ Aún necesario


No eliminar sin evidencia.

---

# 2. Eliminación de externalSpins

Eliminar únicamente cuando:

- no existan consumidores activos;
- el flujo equivalente exista en RouletteTracker;
- no se modifique comportamiento observable.

Eliminar:

- variables muertas;
- sincronizaciones obsoletas;
- lógica duplicada;
- código de compatibilidad innecesario.

Mantener rollback si aparece una dependencia inesperada.

---

# 3. Migración Tester

Auditar componentes de testing:

- Tester
- validadores
- herramientas auxiliares
- simuladores relacionados

Migrar cualquier consumo directo de:

- Legacy Tracker
- externalSpins
- arrays externos de spins

hacia:

- RouletteTracker
- SpinManager
- APIs públicas del dominio

---

# 4. Migración Simulation

Auditar:

- simulaciones Monte Carlo;
- generación de spins;
- validaciones estadísticas;
- escenarios de prueba.

Objetivo:

La simulación debe operar sobre el mismo modelo utilizado por producción.

Flujo esperado:

Simulation

↓

RouletteTracker

↓

SpinManager


No:

Simulation

↓

Legacy Tracker


---

# 5. Compatibilidad

Mantener funcionando:

- UI
- Renderers
- Engines actuales
- History
- Ranking
- HitMap
- Session

No modificar comportamiento observable.

---

# Restricciones

NO eliminar Legacy Tracker.

NO eliminar TrackerSyncAdapter.

NO migrar Engines principales todavía.

NO modificar UI.

NO modificar HTML.

NO modificar CSS.

NO introducir nuevas funcionalidades.

NO hacer limpieza masiva.

NO eliminar código sin evidencia.

---

# Reglas de arquitectura

El dominio es la única fuente de verdad.

Todo nuevo consumo de Spins debe realizarse mediante:

- RouletteTracker
- SpinManager
- APIs públicas

Prohibido:

- externalSpins
- acceso directo a arrays Legacy;
- duplicación de estado;
- caches paralelas.

---

# Trabajo requerido

## Paso 1

Crear inventario completo de usos de externalSpins.

Documentar:

- archivo;
- función;
- consumidor;
- impacto;
- decisión.

---

## Paso 2

Migrar consumidores activos.

Reemplazar:

externalSpins

por APIs del dominio.

---

## Paso 3

Eliminar código muerto.

Sólo después de confirmar ausencia de dependencias.

---

## Paso 4

Auditar Tester y Simulation.

Confirmar que funcionan exclusivamente con Domain.

---

# Verificaciones

Comprobar:

✓ No existen consumidores activos de externalSpins.

✓ Tester funciona con RouletteTracker.

✓ Simulation funciona con RouletteTracker.

✓ No existen estados duplicados.

✓ Legacy sigue funcionando como compatibilidad.

✓ TrackerSyncAdapter sigue operativo.

✓ History intacto.

✓ HitMap intacto.

✓ Build limpio.

Ejecutar obligatoriamente:

```bash
npm run build
```

---

# Entregables

Generar:

```
reports/

FASE_5_3_EXTERNAL_SPINS_REMOVAL.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Auditoría externalSpins

3. Dependencias encontradas

4. Migraciones realizadas

5. Tester migrado

6. Simulation migrada

7. Código eliminado

8. Compatibilidad

9. Riesgos

10. Resultado del build

11. Estado final de externalSpins

---

# Criterio de aceptación

La fase se considera completada si:

- externalSpins deja de participar en el flujo operativo;
- Tester consume exclusivamente Domain;
- Simulation consume exclusivamente Domain;
- no existen duplicaciones de estado;
- Legacy permanece únicamente como compatibilidad;
- no existen regresiones;
- npm run build finaliza correctamente.

---

# Resultado esperado

Al finalizar:

ANTES:

```
Spins
 |
 +-- RouletteTracker
 |
 +-- externalSpins
 |
 +-- Legacy Tracker
```


DESPUÉS:

```
Spins

RouletteTracker
      |
      +-- Legacy Tracker
          (compatibilidad)
```

Siguiente fase:

# ETAPA 2
# FASE 5.4
# MIGRACIÓN COMPLETA DE ENGINES

Objetivo:
Eliminar dependencias restantes del Legacy en WinWin, Orion, DA, Kelly y demás motores.
