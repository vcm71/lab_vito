# ORION REFACTOR
# ETAPA 2
# FASE 5.5.1
# AUDITORÍA FINAL DE DEPENDENCIAS LEGACY

## Contexto

La Fase 5.4 completó la migración de Engines hacia el Domain Tracker.

Estado actual:

- RouletteTracker es Owner de Spins.
- RouletteTracker es núcleo del dominio.
- TrackerSyncAdapter mantiene compatibilidad temporal Domain → Legacy.
- externalSpins eliminado.
- Engines principales consumen APIs públicas del dominio.
- Bootstrap inyecta Domain Tracker.
- Legacy Tracker ya no participa como fuente de verdad.

Arquitectura actual:

```
Consumidores

      |
      ▼

RouletteTracker
      |
      ▼

Legacy Tracker
(adaptador temporal)
```

Antes de eliminar definitivamente el Legacy Tracker es necesario realizar una auditoría final de dependencias.

---

# Objetivo

Determinar exactamente qué referencias al Legacy Tracker permanecen en el proyecto.

La fase es exclusivamente de auditoría.

NO eliminar código.

NO modificar arquitectura.

NO migrar consumidores.

El objetivo es crear el mapa completo necesario para la eliminación segura del Legacy.

---

# Alcance de auditoría

Buscar todas las referencias relacionadas con:

- Legacy Tracker
- rouletteTracker.js Legacy
- TrackerSyncAdapter
- instancias Legacy
- imports Legacy
- propiedades internas Legacy
- métodos Legacy usados externamente

---

# Áreas a revisar

## 1. Imports

Localizar:

- imports directos al Legacy Tracker;
- imports indirectos;
- referencias por alias;
- archivos duplicados.

Documentar:

- archivo;
- línea;
- uso;
- decisión futura.

---

## 2. Instanciaciones

Buscar:

```javascript
new RouletteTracker()
```

y determinar:

- si corresponde al Domain;
- si corresponde al Legacy;
- si existe duplicación accidental.

Especial atención:

- MonteCarloValidator;
- testers;
- simuladores;
- herramientas auxiliares.

---

## 3. Bootstrap y Composition Root

Auditar:

- main.js;
- bootstrap;
- inicialización del sistema.

Identificar:

- monkey patches;
- adaptadores temporales;
- creación Legacy innecesaria.

---

## 4. Renderers

Auditar consumidores que todavía reciben:

- tracker Legacy;
- métodos parcheados;
- APIs heredadas.

No modificar.

Sólo documentar.

---

## 5. Engines

Confirmar que:

- no consumen Legacy;
- no acceden a propiedades privadas;
- no mantienen referencias ocultas.

Verificar especialmente:

- WinWin;
- Kelly;
- DA;
- Orion;
- Chi;
- Logic;
- Sesgo97.

---

## 6. Simulation / Monte Carlo

Auditar completamente:

- MonteCarloValidator;
- simuladores;
- validadores estadísticos.

Determinar:

- si requieren migración;
- si crean Legacy internamente;
- si pueden consumir Domain.

---

# Clasificación obligatoria

Cada dependencia encontrada debe clasificarse:

## ACTIVA

Impide eliminar Legacy.

Ejemplo:

```
MonteCarloValidator crea Legacy Tracker
```

---

## COMPATIBILIDAD

Necesaria temporalmente.

Ejemplo:

```
TrackerSyncAdapter mantiene espejo Legacy
```

---

## MUERTA

Puede eliminarse.

Ejemplo:

```
import no utilizado
```

---

## PENDIENTE DE MIGRACIÓN

Debe cambiarse antes de eliminar Legacy.

---

# Restricciones

NO modificar código.

NO eliminar imports.

NO borrar archivos.

NO migrar MonteCarlo todavía.

NO eliminar TrackerSyncAdapter.

NO eliminar monkey patches.

NO cambiar UI.

NO cambiar Renderers.

NO cambiar Engines.

NO cambiar comportamiento observable.

---

# Verificaciones

Comprobar:

✓ Inventario completo Legacy.

✓ Todos los imports localizados.

✓ Todas las instancias localizadas.

✓ Todos los consumidores identificados.

✓ MonteCarlo evaluado.

✓ Bootstrap evaluado.

✓ Renderers evaluados.

✓ Engines confirmados.

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

FASE_5_5_1_LEGACY_DEPENDENCY_AUDIT.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Estado arquitectónico actual

3. Método de auditoría

4. Inventario de referencias Legacy

5. Imports encontrados

6. Instancias encontradas

7. Consumidores activos

8. Dependencias de compatibilidad

9. Código muerto detectado

10. MonteCarloValidator análisis

11. Riesgos

12. Plan de eliminación

13. Resultado del build

---

# Matriz final requerida

Crear tabla:

| Referencia | Archivo | Tipo | Estado | Acción |
|---|---|---|---|---|
| Legacy Tracker | archivo | Import | Activa | Migrar |
| TrackerSyncAdapter | archivo | Compatibilidad | Mantener | Fase 5.5.3 |
| Monkey patch | archivo | Compatibilidad | Mantener | Fase 5.5.3 |

---

# Criterio de aceptación

La fase se considera completada únicamente si:

- existe un inventario completo de dependencias Legacy;
- no quedan referencias desconocidas;
- cada dependencia tiene una clasificación;
- existe un plan claro de eliminación;
- build continúa funcionando.

---

# Resultado esperado

Al finalizar esta fase debe ser posible responder:

"Si eliminamos mañana Legacy Tracker, ¿qué archivos romperían y por qué?"

La siguiente fase será:

# ETAPA 2
# FASE 5.5.2

## Migración de últimos consumidores Legacy

Objetivo:

Eliminar las dependencias activas restantes antes de retirar definitivamente Legacy Tracker.
