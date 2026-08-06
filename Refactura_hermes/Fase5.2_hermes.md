# ORION REFACTOR
# ETAPA 2
# FASE 5.2
# INVERSIÓN DEL OWNERSHIP DE SPINS

## Contexto

El proyecto se encuentra en una migración incremental desde el Legacy Tracker hacia una arquitectura basada en DDD + Clean Architecture.

Actualmente existe un `TrackerSyncAdapter` que sincroniza el Legacy Tracker y `RouletteTracker`.

Estado actual:

UI
↓
TrackerSyncAdapter
├── Legacy Tracker (Owner de Spins)
└── RouletteTracker

El objetivo final es invertir ese ownership para que el dominio sea la única fuente de verdad.

NO debe hacerse una migración Big Bang.

La estabilidad funcional tiene prioridad sobre el objetivo arquitectónico.

---

## Objetivo de esta fase

Determinar de forma objetiva si `RouletteTracker` ya puede convertirse en Owner de los Spins.

NO asumir equivalencias.

NO migrar código todavía si no existe equivalencia funcional completa.

Primero debe realizarse una auditoría técnica exhaustiva.

---

## Trabajo requerido

### 1. Inventario del Legacy

Localizar todas las responsabilidades relacionadas con Spins.

No solamente métodos públicos.

También:

- validaciones
- normalización
- persistencia
- importación
- exportación
- listeners
- callbacks
- eventos
- sincronizaciones
- estructuras internas
- utilidades
- side-effects

Documentar cada responsabilidad encontrada.

---

### 2. Inventario del Dominio

Auditar completamente:

RouletteTracker

SpinManager

TrackerState

y cualquier clase del dominio involucrada.

Identificar exactamente qué responsabilidad cubre cada componente.

---

### 3. Matriz de Equivalencia

Construir una tabla similar a:

| Responsabilidad | Legacy | Domain | Estado |
|----------------|--------|--------|--------|
| addSpin | ✔ | ✔ | Equivalente |
| undo | ✔ | ✔ | Equivalente |
| normalize | ✔ | △ | Parcial |
| import | ✔ | ✖ | No existe |

Clasificar únicamente como:

✔ Equivalente

△ Parcial

✖ No existe

No utilizar apreciaciones subjetivas.

---

### 4. GAP Analysis

Para cada diferencia indicar:

- archivo
- responsabilidad
- impacto
- riesgo
- complejidad de migración

---

### 5. Dependencias

Detectar todos los módulos que consumen el Legacy Tracker respecto a Spins.

Ejemplos:

- UI
- Engines
- History
- Simulation
- Import
- Export
- Ranking
- HitMap
- Recording

Indicar si consumen:

- API pública
- estado interno
- efectos secundarios
- callbacks
- eventos

---

### 6. Riesgos

Identificar cualquier comportamiento que pudiera romperse al invertir el ownership.

Especial atención a:

- sincronización
- persistencia
- sesiones
- estadísticas
- engines
- compatibilidad Legacy

---

### 7. Decisión

Concluir únicamente una de las siguientes opciones:

A)

RouletteTracker implementa el 100% del contrato funcional.

Puede iniciarse la inversión del ownership.

o

B)

RouletteTracker aún no implementa completamente el contrato.

Documentar exactamente qué falta.

NO modificar el ownership.

---

## Restricciones

NO modificar comportamiento observable.

NO eliminar código Legacy.

NO eliminar TrackerSyncAdapter.

NO migrar Engines.

NO reorganizar archivos.

NO introducir nuevas funcionalidades.

NO asumir equivalencias sin evidencia.

Priorizar estabilidad por sobre velocidad.

---

## Entregables

Generar:

reports/

FASE_5_2_SPIN_OWNERSHIP_AUDIT.md

Incluyendo:

1. Resumen ejecutivo

2. Inventario Legacy

3. Inventario Domain

4. Matriz de equivalencia

5. GAP Analysis

6. Dependencias

7. Riesgos

8. Conclusión técnica

9. Recomendación

10. Decisión final

---

## Criterio de aceptación

La fase se considera completada únicamente si existe evidencia técnica suficiente para responder de manera objetiva:

¿Puede RouletteTracker convertirse en el Owner de Spins sin producir regresiones funcionales?

Si la respuesta no puede demostrarse con evidencia, la decisión correcta es NO invertir el ownership.
