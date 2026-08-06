# ORION REFACTOR
# ETAPA 2
# FASE 5.4
# MIGRACIÓN COMPLETA DE ENGINES AL DOMINIO

## Contexto

La Fase 5.3 eliminó `externalSpins` y migró los consumidores básicos al dominio.

Estado actual:

- RouletteTracker es Owner de Spins.
- Legacy Tracker funciona como adaptador temporal.
- TrackerSyncAdapter mantiene compatibilidad.
- externalSpins eliminado.
- Tester migrado.
- Simulation/Monte Carlo pendiente por dependencia interna Legacy.

Arquitectura actual:

```
Consumidores

      |
      ▼

RouletteTracker

      |
      ▼

Legacy Tracker
(compatibilidad)
```

Los Engines principales todavía pueden contener referencias históricas al Legacy.

Ejemplos identificados:

- WinWinEngine
- Orion Engine
- DA Engine
- Kelly Engine
- Monte Carlo / Simulation
- otros motores relacionados

---

# Objetivo

Migrar todos los Engines para consumir exclusivamente el dominio.

Al finalizar esta fase:

- ningún Engine debe depender del Legacy Tracker;
- ningún Engine debe acceder a estructuras internas;
- ningún Engine debe asumir que el Legacy es la fuente de verdad.

---

# Principio principal

Los Engines consumen información.

No administran estado.

La responsabilidad queda separada:

```
RouletteTracker
        |
        |
        ▼
  Estado y datos


Engine
        |
        |
        ▼
  Cálculo / estrategia
```

---

# Alcance

Auditar y migrar:

- WinWinEngine
- Orion Engine
- DA Engine
- Kelly Engine
- Simulation
- Monte Carlo
- cualquier módulo que use tracker

---

# Auditoría inicial

Buscar referencias a:

- tracker
- legacyTracker
- _freq
- spins internos
- arrays Legacy
- métodos Legacy específicos

Clasificar:

✔ Migrable directamente

△ Requiere adaptación

✖ Requiere diseño adicional

No modificar sin comprender el uso.

---

# Migraciones requeridas

## 1. Acceso a Spins

Reemplazar:

Legacy:

```
tracker.spins
```

o equivalentes

por:

Domain:

```
rouletteTracker.getSpins()
```

---

## 2. Frecuencias

Eliminar completamente dependencias hacia:

```
_freq
```

o caches internas Legacy.

Usar:

- getHitMap()
- ranking
- APIs públicas equivalentes

---

## 3. Historial

Si algún Engine consume historial:

Migrar hacia:

HistoryManager

o APIs públicas del dominio.

---

## 4. Estado de sesión

Migrar accesos a:

SessionManager

No leer estado interno Legacy.

---

## 5. Simulation / Monte Carlo

Caso especial:

Si crea instancias Legacy propias:

Evaluar migración hacia:

```
RouletteTracker
       +
SpinManager
```

No mantener dos modelos de simulación.

---

# Restricciones

NO modificar algoritmos matemáticos.

NO modificar estrategias.

NO cambiar parámetros.

NO alterar resultados esperados.

NO agregar nuevas capacidades.

NO eliminar Legacy Tracker todavía.

NO modificar UI.

NO modificar Renderers.

NO modificar HTML/CSS.

NO cambiar comportamiento observable.

---

# Reglas de arquitectura

Después de esta fase:

Permitido:

```
Engine
   |
   ▼
RouletteTracker API
```

Prohibido:

```
Engine
   |
   ▼
Legacy Tracker
```

Prohibido acceder a:

- propiedades privadas;
- caches internas;
- arrays internos;
- estructuras Legacy.

---

# Trabajo requerido

## Paso 1

Inventario completo de dependencias Legacy.

Documentar:

- archivo;
- línea;
- dependencia;
- reemplazo propuesto.

---

## Paso 2

Migrar Engine por Engine.

Orden recomendado:

1. WinWinEngine
2. Orion Engine
3. DA Engine
4. Kelly Engine
5. Monte Carlo / Simulation


---

## Paso 3

Validar equivalencia.

Para cada Engine comprobar:

Antes:

Legacy Tracker

Después:

RouletteTracker


Resultados esperados:

- mismas entradas;
- mismas salidas;
- mismos cálculos.

---

# Verificaciones

Comprobar:

✓ Ningún Engine usa Legacy Tracker.

✓ Ningún Engine usa _freq.

✓ Ningún Engine lee estado interno.

✓ Simulation funciona con Domain.

✓ Monte Carlo funciona con Domain.

✓ UI intacta.

✓ Renderers intactos.

✓ History intacto.

✓ HitMap intacto.

✓ Build limpio.


Ejecutar:

```bash
npm run build
```

---

# Entregables

Generar:

```
reports/

FASE_5_4_ENGINE_MIGRATION.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Inventario inicial

3. Engines auditados

4. Migraciones realizadas

5. Equivalencia de resultados

6. Dependencias Legacy eliminadas

7. Riesgos

8. Compatibilidad

9. Resultado del build

10. Estado final de Engines

---

# Criterio de aceptación

La fase se considera completada si:

- todos los Engines consumen exclusivamente Domain;
- no existen accesos internos Legacy;
- Simulation funciona con Domain;
- no hay cambios en algoritmos;
- no existen regresiones;
- build limpio.

---

# Resultado esperado

Antes:

```
Engine

 ├── Legacy Tracker
 |
 └── RouletteTracker
```


Después:

```
Engine

     |
     ▼

RouletteTracker
     |
     ▼

Legacy Tracker
(únicamente compatibilidad)
```

---

Siguiente fase:

# ETAPA 2
# FASE 5.5
# ELIMINACIÓN DEFINITIVA DEL LEGACY TRACKER

Objetivo:
Retirar el adaptador temporal y consolidar RouletteTracker como único núcleo del sistema.
