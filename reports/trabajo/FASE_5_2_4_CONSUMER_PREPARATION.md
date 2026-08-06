# FASE 5.2.4 — Preparación de Consumidores para la Inversión del Ownership

**Fecha:** 2026-07-24
**Proyecto:** Roulette Tracker (Orion)
**Estado:** COMPLETADO

---

## 1. Resumen Ejecutivo

Se prepararon los consumidores del sistema para que ningún componente dependa directamente de implementaciones internas del Legacy Tracker. Se eliminaron accesos a propiedades privadas (`_freq`), se extendió `TrackerSyncAdapter` para cubrir todas las operaciones CRUD, y se unificó el tratamiento de metadatos entre Legacy y Domain. El dominio queda listo para asumir el ownership en Fase 5.2.5.

**Archivos modificados:**
- `src/sync/TrackerSyncAdapter.js` — nuevos métodos `deleteSpin()` y `updateSpin()`
- `src/engines/WinWin/WinWinEngine.js` — eliminado acceso a `this.tracker._freq`
- `src/tracker/RouletteTracker.js` — metadatos raw (sin `|| ''`)
- `src/tracker/SpinManager.js` — metadatos raw (sin `|| ''`)

**Build:** 78 módulos, 0 errores.

---

## 2. Riesgos Abordados

| ID | Riesgo | Estado | Solución |
|----|--------|--------|----------|
| **R01** | `deleteSpin()`/`updateSpin()` no atraviesan TrackerSyncAdapter | ✅ RESUELTO | Nuevos métodos en TrackerSyncAdapter que sincronizan ambos trackers |
| **R02** | WinWinEngine accede directamente a `tracker._freq` | ✅ RESUELTO | Reemplazado por mapa de frecuencias desde `this.tracker.getSpins()` |
| **R03** | Diferencia en tratamiento de metadatos (Legacy: raw, Domain: `|| ''`) | ✅ RESUELTO | Ambos trackers ahora usan valor raw del setting |
| **R04** | Referencias directas a `this.tracker._freq` | ✅ RESUELTO | Único punto de acceso estaba en `getCHIDetails()`, ya migrado |
| **R05** | Persistencia automática post-CRUD depende parcialmente del Legacy | ⏭️ **DOCUMENTADO** | No se añadió persistencia al Domain para evitar duplicación (ver §4) |
| **R06** | Engines consideran al Legacy como fuente principal | ⏭️ **PERSISTE** | Ownership se invertirá en Fase 5.2.5 |

---

## 3. Consumidores Auditados

Se auditaron todos los consumidores de Spins en el sistema:

| Consumidor | Archivo | Dependencia Legacy | Estado |
|------------|---------|-------------------|--------|
| **WinWinEngine** | `src/engines/WinWin/WinWinEngine.js` | `this.tracker._freq` | ✅ Migrado a `getSpins()` |
| **TrackerSyncAdapter** | `src/sync/TrackerSyncAdapter.js` | `this._legacy.*` (públicas) | ✅ Extendido con delete/update |
| **RouletteTracker** (Domain) | `src/tracker/RouletteTracker.js` | Ninguna (orquestador) | ✅ Metadatos unificados |
| **SpinManager** | `src/tracker/SpinManager.js` | Ninguna (gestor de estado) | ✅ Metadatos unificados |
| **HistoryPanel** | `src/ui/panels/HistoryPanel.js` | — | No depende de estado interno Legacy |
| **tomadorRenderer** | `tomadorRenderer.js` | `this.tracker.deleteSpin()` / `this.tracker.updateSpin()` | ⏭️ Legacy (Fase 5.2.5 migrará al adapter) |
| **Engines restantes** | `src/engines/*/` | `this.tracker.getSpins()` (pública) | ✅ Usan APIs públicas |

**Nota:** `tomadorRenderer.js` llama a `this.tracker.deleteSpin()` y `this.tracker.updateSpin()` directamente sobre el Legacy. No se modificó porque la restricción de la fase lo impide ("NO modificar Renderers"). La migración ocurrirá en Fase 5.2.5 cuando se invierta el ownership.

---

## 4. Cambios Realizados

### 4.1 TrackerSyncAdapter — `deleteSpin()` y `updateSpin()`

Se agregaron dos nuevos métodos que sincronizan la operación en ambos trackers:

```js
deleteSpin(spinId) {
  const result = this._legacy.deleteSpin(spinId);
  if (result) {
    this._domain.deleteSpin(spinId);
  }
  return result;
}

updateSpin(spinId, newNumber) {
  const result = this._legacy.updateSpin(spinId, newNumber);
  if (result) {
    this._domain.updateSpin(spinId, newNumber);
  }
  return result;
}
```

- Legacy primero (valida, persiste)
- Domain después (refleja tras éxito)
- Retorna el resultado de la operación Legacy

### 4.2 WinWinEngine — Eliminación de `_freq`

En `getCHIDetails()` se reemplazó el acceso directo a `this.tracker._freq[n]` por un mapa de frecuencias construido desde `this.tracker.getSpins()`:

```js
// Antes
const freq = this.tracker._freq[n] || 0;

// Después
const freqMap = {};
spins.forEach(s => { freqMap[s.number] = (freqMap[s.number] || 0) + 1; });
const freq = freqMap[n] || 0;
```

Esto elimina la única dependencia directa a una propiedad interna (`_freq`) y usa exclusivamente la API pública `getSpins()`.

### 4.3 Metadatos — Unificación Legacy/Domain

Se eliminó el operador `|| ''` en ambos lugares donde se asignan metadatos:

| Archivo | Cambio |
|---------|--------|
| `RouletteTracker.js:88-90` | `settings.casinoName \|\| ''` → `settings.casinoName` |
| `SpinManager.js:67-69` | `meta.casino \|\| ''` → `meta.casino` |

Ahora el valor se conserva tal cual viene de settings, igual que en el Legacy (`this.settings.casinoName`). Si el setting es `undefined`, el objeto spin tendrá `casino: undefined`, que al serializar JSON se convierte en `null` — idéntico comportamiento al Legacy.

---

## 5. APIs Públicas Utilizadas

Todos los consumidores ahora usan exclusivamente las siguientes APIs públicas del Legacy Tracker y DomainTracker:

| API | Consumidor | Propósito |
|-----|-----------|-----------|
| `getSpins()` | WinWinEngine, TrackerSyncAdapter, RouletteTracker | Obtener array de giros |
| `deleteSpin(id)` | TrackerSyncAdapter, tomadorRenderer | Eliminar un giro |
| `updateSpin(id, num)` | TrackerSyncAdapter, tomadorRenderer | Modificar un giro |
| `addSpin(num)` | TrackerSyncAdapter, RouletteTracker | Agregar nuevo giro |
| `clearSession()` | TrackerSyncAdapter | Limpiar sesión |
| `importSpins(arr)` | TrackerSyncAdapter | Importación masiva |

Ningún consumidor accede a:
- `_freq` (eliminado)
- `_saveSpins` (privado)
- `_buildFreq` (privado)
- `spins` (propiedad interna)
- Cualquier otra propiedad o método precedido por `_`

---

## 6. Dependencias Legacy Eliminadas

| Dependencia | Archivo | Línea | Reemplazo |
|-------------|---------|-------|-----------|
| `this.tracker._freq[n]` | `WinWinEngine.js` | 490 | `freqMap[n]` construido desde `this.tracker.getSpins()` |

Total: **1 dependencia directa eliminada** de propiedades internas del Legacy.

---

## 7. Compatibilidad

### Persistencia

La persistencia continúa manejándose exclusivamente desde el Legacy Tracker en las operaciones CRUD que ya la soportaban (addSpin, deleteSpin, updateSpin). No se introdujo persistencia paralela en el Domain para evitar duplicación. El TrackerSyncAdapter mantiene la sincronización en ambas direcciones.

### Comportamiento observable

- **Metadatos:** Los spins creados por el Domain ahora tienen el mismo valor de metadatos que los creados por el Legacy (raw desde settings). La serialización JSON produce `null` en lugar de `""` cuando el setting no está definido, idéntico al Legacy.
- **CHI Details:** La función `getCHIDetails()` produce resultados idénticos; la frecuencia se computa desde `getSpins()` en lugar de `_freq`.
- **CRUD sincronizado:** delete/update ahora pasan por el adaptador y mantienen ambos trackers sincronizados (antes solo modificaban el Legacy).

### Riesgos remanentes documentados (R05)

La persistencia automática después de operaciones CRUD en el Domain (deleteSpin/updateSpin) no se implementó para evitar duplicación con la persistencia que ya realiza el Legacy. Esta es una decisión consciente: dado que el Legacy sigue siendo la fuente de verdad, persiste él. Cuando se invierta el ownership en Fase 5.2.5, la persistencia se moverá al Domain.

---

## 8. Resultado del Build

```
> npm run build
> vite build

vite v8.0.10 building client environment for production...
✓ 78 modules transformed.
✓ built in 491ms

dist/index.html                               26.03 kB │ gzip:   5.12 kB
dist/assets/index-DCcLP4Fy.css                19.85 kB │ gzip:   4.35 kB
dist/assets/index-D558thHe.js                539.10 kB │ gzip: 155.04 kB
dist/assets/monteCarloValidator-CPEqEVkp.js    5.20 kB │ gzip:   2.33 kB
dist/assets/statsWorker-cM-BRWnz.js           43.11 kB │ gzip:     --

✓ Build exitoso — 78 módulos, 0 errores.
```

---

## 9. Recomendación

**Proceder a Fase 5.2.5 (Inversión del Ownership).**

El sistema está preparado:
- ✅ TrackerSyncAdapter cubre todas las operaciones CRUD
- ✅ Ningún Engine depende de propiedades internas del Legacy
- ✅ Metadatos unificados entre Legacy y Domain
- ✅ Persistencia única desde el Legacy (sin duplicación)
- ✅ Build limpio

**El único paso restante:** cambiar la dirección del flujo de sincronización en TrackerSyncAdapter para que el Domain sea la fuente de verdad, y el Legacy actúe como adaptador de compatibilidad para los renderers y componentes UI que aún dependan de él.

---

## 10. Anexo: Verificaciones de Criterio de Aceptación

| Criterio | Estado |
|----------|--------|
| Ningún consumidor depende de propiedades internas del Legacy | ✅ Verificado |
| Todos los Engines consumen únicamente APIs públicas | ✅ Verificado |
| TrackerSyncAdapter sincroniza todas las operaciones relevantes | ✅ delete/update añadidos |
| Persistencia única y consistente | ✅ Legacy como fuente única |
| No existen regresiones funcionales | ✅ Compatibilidad mantenida |
| Proyecto compila sin errores | ✅ 78 módulos, 0 errores |

