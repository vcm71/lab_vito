# Domain Hardening Final — Fase 3.6

## Resumen Ejecutivo

El dominio de Roulette Tracker ha sido consolidado definitivamente. Se eliminaron todas las duplicidades estructurales detectadas durante las fases 3.1–3.5, estableciendo una única fuente de verdad para cada responsabilidad.

---

## Decisiones Arquitectónicas Adoptadas

### 1. Estadísticas — Fuente Única: RouletteAnalytics

| Decisión | Detalle |
|----------|---------|
| **Única implementación** | RouletteAnalytics.getStats() y RouletteAnalytics.getAdvancedStats() |
| **RouletteTracker** | Delega completamente a RouletteAnalytics vía `setAnalytics(analytics)`. Eliminada la implementación duplicada (~100 líneas de cómputo inline). |
| **Consumidor** | KellyManager (único externo) llama `tracker.getStats()` → delega a analytics. |
| **Sincronización** | Las estadísticas se refrescan automáticamente tras cada `addSpin` e `importNumbers` vía `analytics.refresh()`. |
| **API pública** | Mantiene `highLowPct` (camelCase) para compatibilidad con KellyManager. Se corrigió la nomenclatura de RouletteAnalytics que usaba `highlowPct` (lowercase). |

### 2. NUM_META — Centralizado en numberMeta.js

| Decisión | Detalle |
|----------|---------|
| **Ubicación** | `src/utils/numberMeta.js` — única definición. |
| **Exportación** | `export const NUM_META` |
| **Duplicación eliminada** | RouletteTracker.js (definición local ~20 líneas) y RouletteAnalytics.js (definición local ~15 líneas) ahora importan desde numberMeta.js. |

### 3. session.spinCount — Política de Sincronización Automática

| Decisión | Detalle |
|----------|---------|
| **Propietario** | SessionManager — único responsable de incrementar/leer. |
| **Gatillo** | `RouletteTracker.addSpin()` incrementa automáticamente el contador. |
| **Incrementos redundantes eliminados** | Dos llamadas explícitas a `incrementSessionSpinCount()` en `main.js` (en `addSpin` e `importNumbers`) — ambas redundantes porque `addSpin()` ya auto-incrementa. |
| **Riesgo de desincronización** | Eliminado. El contador se sincroniza en el mismo paso que el registro del giro. |

### 4. CustomSeries — Diseño Actual Validado

| Decisión | Detalle |
|----------|---------|
| **Responsabilidad** | RouletteTracker expone CRUD (`getSeries`, `addOrUpdateSeries`, `toggleSeries`, `deleteSeries`). Datos residentes en SettingsManager bajo `settings.customSeries`. |
| **Riesgo conocido** | RouletteAnalytics accede directamente a `this.settings.customSeries` en `getAlerts()` y `getSeriesTrendData()`. Acoplamiento a la estructura interna de settings. |
| **Justificación** | No se crea CustomSeriesManager dedicado. La carga de crear un manager separado no se justifica para la complejidad actual de la funcionalidad. Se documenta como deuda técnica menor. |

---

## Fuente de Verdad de Cada Componente

### Núcleo

| Componente | Responsabilidad | Fuente de verdad |
|------------|----------------|-----------------|
| RouletteTracker | Orquestación del dominio. API pública de alto nivel. | Única |
| TrackerState | Estado inmutable del tracker. | Única |

### Managers

| Manager | Responsabilidad | Fuente de verdad |
|---------|----------------|-----------------|
| SpinManager | Gestión de giros (add, delete, update). | Única |
| SessionManager | Sesiones activas, contador de giros. | Única |
| HistoryManager | Persistencia (carga/guarda). | Única |
| SettingsManager | Configuración persistente. | Única |
| DelayManager | Cálculo de atrasos. | Única |

### Servicios

| Servicio | Responsabilidad | Fuente de verdad |
|----------|----------------|-----------------|
| RouletteAnalytics | Estadísticas, alertas, tendencias. | Única (delegada desde RouletteTracker) |

### Utilidades

| Utilidad | Responsabilidad | Fuente de verdad |
|----------|----------------|-----------------|
| numberMeta | Constantes de ruleta (NUM_META, AMERICAN_WHEEL_ORDER, ROULETTE_NUMBERS, helpers). | Única |

---

## Deuda Técnica Eliminada

| Deuda | Archivos afectados | Impacto |
|-------|-------------------|---------|
| Implementación duplicada de getStats/getAdvancedStats | RouletteTracker.js, RouletteAnalytics.js | ~100 líneas de lógica redundante eliminadas |
| NUM_META triplicado | RouletteTracker.js, RouletteAnalytics.js, numberMeta.js | Ahora definición única |
| static getWheelDistance duplicado | RouletteTracker.js, numberMeta.js | Ahora única en numberMeta.js |
| highlowPct vs highLowPct (casing) | RouletteAnalytics.js | Corregido a highLowPct para coincidir con API pública |
| Incrementos redundantes de spinCount | main.js (2 sitios) | Eliminados; addSpin auto-incrementa |
| Llamada estática a RouletteTracker.getWheelDistance | LogicEngine.js | Migrada a getWheelDistance directo desde numberMeta.js |
| AMERICAN_WHEEL_ORDER + ROULETTE_NUMBERS imports huérfanos | RouletteTracker.js | Eliminados tras remover getWheelDistance y NUM_META locales |

---

## Deuda Técnica Restante

| Deuda | Componente | Impacto | Prioridad |
|-------|-----------|---------|-----------|
| RouletteAnalytics accede a settings.customSeries directamente | RouletteAnalytics | Acoplamiento a estructura de settings | Baja |
| RouletteTracker importa rouletteSpinsStore directamente | RouletteTracker | Acoplamiento a almacenamiento | Baja |
| Chunk size > 500 kB | Build | Warning de empaquetado | Mínima |

---

## Ownership Definitivo

```
RouletteTracker
  ├── SpinManager        → giros
  ├── SessionManager     → sesiones, spinCount
  ├── HistoryManager     → persistencia
  ├── SettingsManager    → configuración, customSeries
  └── DelayManager       → atrasos

RouletteAnalytics        → estadísticas (servicio)

numberMeta               → constantes (utilidad)
```

---

## Tabla Comparativa — Antes y Después

### Duplicidades

| Concepto | Antes (Fase 3.5) | Después (Fase 3.6) |
|----------|------------------|-------------------|
| getStats | RouletteTracker + RouletteAnalytics | RouletteAnalytics (única) |
| getAdvancedStats | RouletteTracker + RouletteAnalytics | RouletteAnalytics (única) |
| NUM_META | RouletteTracker + RouletteAnalytics + numberMeta | numberMeta (única) |
| getWheelDistance | RouletteTracker (static) + numberMeta | numberMeta (única) |
| incrementSessionSpinCount | addSpin + main.js x2 | addSpin (única, automática) |

### Responsabilidades

| Componente | Antes | Después |
|-----------|-------|---------|
| RouletteTracker | Orquestador + cómputo de stats | Orquestador puro |
| RouletteAnalytics | Servicio con NUM_META local | Servicio puro |
| numberMeta | Utilidad con NUM_META privado | Utilidad con NUM_META exportado |
| LogicEngine | Dependiente de static en RouletteTracker | Dependiente de utilidad pura |
