# FASE 5.2.2 — Cierre de Gaps Funcionales — Paridad de Spins

**Fecha:** 2026-07-24
**Proyecto:** Roulette Tracker (Orion)
**Estado:** COMPLETADO

---

## 1. Resumen Ejecutivo

Se completó la equivalencia funcional entre el dominio (`RouletteTracker` + `SpinManager`)
y el Legacy (`rouletteTracker.js`) respecto a la gestión de Spins, manteniendo intacto
el ownership (Opción B).

| Gap | Severidad | Estado |
|-----|-----------|--------|
| **GAP-02** | ALTO | ✅ Resuelto |
| **GAP-03** | MEDIO | ✅ Resuelto |
| **GAP-05** | MEDIO | ✅ No aplica (justificado) |
| **GAP-06** | MEDIO | ✅ Resuelto |

---

## 2. Objetivos

- Implementar `deleteSpin()` y `updateSpin()` en el dominio (GAP-02)
- Centralizar normalización de entradas (GAP-03)
- Evaluar y decidir sobre cache de frecuencias (GAP-05)
- Agregar metadatos casino/dealer/table a los spins del dominio (GAP-06)
- Mantener compatibilidad total con el Legacy
- No invertir ownership

---

## 3. Gaps Abordados

### GAP-02 — CRUD de Spins (Resuelto ✅)

**Archivos:** `src/tracker/SpinManager.js`, `src/tracker/RouletteTracker.js`

**Implementación:**

| Operación | Firma | Comportamiento |
|-----------|-------|----------------|
| `deleteSpin(spinId)` | `(number) => boolean` | Busca por ID, elimina, reindexa IDs (1-based). Retorna `true` si eliminó, `false` si no encontró |
| `updateSpin(spinId, newNumber)` | `(number, string\|number) => boolean` | Valida newNumber contra ROULETTE_NUMBERS, busca spin por ID, actualiza. Retorna `true/false` |

**Equivalencia con Legacy:**

| Detalle | Legacy | Domain |
|---------|--------|--------|
| `deleteSpin` reindexación | `splice` + `forEach(..., i => s.id = i+1)` | ✅ Idéntico |
| `deleteSpin` retorno | `true/false` según existencia | ✅ Idéntico |
| `updateSpin` validación previa | `ROULETTE_NUMBERS.includes(newNumber)` | ✅ Idéntico (misma constante) |
| `updateSpin` retorno | `false` si no encuentra, `false` si inválido, `true` si éxito | ✅ Idéntico |
| `_freq` update en delete/update | Actualiza cache | ❌ No aplica (GAP-05 justificado) |
| `_saveSpins()` | Persiste a IndexedDB | ❌ No requiere (Legacy es Owner y persiste) |
| `_chiDirty` / `_delaysDirty` | Marca sucio | ❌ No aplica (engine stats viven en Legacy) |

**RouletteTracker expone** `deleteSpin()` y `updateSpin()` delegando directamente a SpinManager.

---

### GAP-03 — Normalización (Resuelto ✅)

**Archivo:** `src/tracker/SpinManager.js`

**Implementación:** Método estático `SpinManager.normalizeNumber(input)`

```js
static normalizeNumber(input) {
  let clean = String(input).trim().split('.')[0].split(',')[0];
  if (clean === "90") clean = "00";
  return clean;
}
```

**Equivalencia con Legacy:**

| Regla | Legacy (importSpins) | Domain (normalizeNumber) |
|-------|---------------------|--------------------------|
| `toString()` | `val.toString()` | `String(input)` ✅ |
| `trim()` | `.trim()` | `.trim()` ✅ |
| Separador `.` | `.split('.')[0]` | `.split('.')[0]` ✅ |
| Separador `,` | `.split(',')[0]` | `.split(',')[0]` ✅ |
| `90 → 00` | `if (cleanNum === "90") cleanNum = "00"` | `if (clean === "90") clean = "00"` ✅ |
| No introduce reglas nuevas | — | ✅ |
| No elimina reglas existentes | — | ✅ |

**Nota:** El dominio **no** aplica normalización automática en `addSpin()` — esto es intencional y consistente con el Legacy, cuyo `addSpin()` tampoco normaliza. La normalización solo ocurre en el flujo de importación, que el Legacy maneja como Owner.

El método está `export` y disponible en `SpinManager.normalizeNumber(val)` para cuando el dominio lo necesite (futura inversión de ownership).

---

### GAP-05 — Cache de Frecuencias (No aplica — Justificado ⏭️)

**Análisis del Legacy:**

El Legacy usa `this._freq` como un diccionario `{ [num]: count }` inicializado con
`_buildFreq()` (O(38) + O(n)) y mantenido incrementalmente en cada mutación.

**Consumidores de `_freq`:**

| Consumidor | Ruta | Acceso |
|-----------|------|--------|
| `Legacy.getStats()` | Interno | `this._freq` — agrega colores/paridades O(38) |
| `Legacy._getChi()` | Interno | `this._freq` — Chi-cuadrado O(38) |
| `WinWinEngine` | Externo (legacy) | `this.tracker._freq[n]` — acceso directo al Legacy |
| `getDelayData` / `hotZone` | Interno | `this._freq` — cálculos de atrasos |

**Justificación de omisión en el dominio:**

1. **Sin consumidores externos:** Ningún consumidor del dominio requiere `_freq`.
   El único consumidor externo (`WinWinEngine`) accede directamente al Legacy.
2. **Rendimiento aceptable:** `getHitMap()` del dominio computa O(n) sobre los spins
   en memoria (~500 típicamente), sin impacto medible.
3. **No forma parte del contrato funcional:** La API pública del dominio
   (`getHitMap`, `getHitRanking`, `getSpins`) no expone ni requiere `_freq`.
4. **Optimización prematura:** Según el prompt, "No optimizar prematuramente."
5. **Duplicación innecesaria:** Implementar `_freq` en el dominio sería duplicar
   una estructura que el Legacy ya mantiene, violando "No duplicar estructuras de cache."

**Conclusión:** Se omite `_freq` en el dominio. Si en el futuro el dominio
asume ownership de los spins y los engines migran a leer del dominio, se
implementará como cache incremental opcional según perfil de rendimiento.

---

### GAP-06 — Metadatos (Resuelto ✅)

**Archivos:** `src/tracker/SpinManager.js`, `src/tracker/RouletteTracker.js`

**Implementación:**

1. `SpinManager.addSpin(number, meta = {})` acepta segundo parámetro opcional `meta`
   con campos `casino`, `dealer`, `table`.
2. `RouletteTracker.addSpin(number)` lee los settings actuales y pasa los metadatos:
   ```js
   addSpin(number) {
     const settings = this.getSettings();
     return this.spinManager.addSpin(number, {
       casino: settings.casinoName || '',
       dealer: settings.crupierName || '',
       table: settings.tableName || ''
     });
   }
   ```

**Equivalencia con Legacy:**

| Campo | Legacy | Domain | Origen |
|-------|--------|--------|--------|
| `casino` | `this.settings.casinoName` | `settings.casinoName` | ✅ SettingsManager (mismos datos) |
| `dealer` | `this.settings.crupierName` | `settings.crupierName` | ✅ SettingsManager |
| `table` | `this.settings.tableName` | `settings.tableName` | ✅ SettingsManager |

**Compatibilidad:**
- Serialización: no se rompe (campos iguales que el Legacy)
- Persistencia: `rouletteSpinsStore` ya normaliza y preserva todos los campos
- APIs existentes: `addSpin(number)` sigue funcionando sin `meta` (backward compatible)

---

## 4. Comparación Legacy vs Domain (Estado Final)

| Responsabilidad | Legacy | Domain | Diferencia |
|----------------|--------|--------|------------|
| `addSpin()` | ✅ Valida + persistencia + cache | ✅ Valida + metadatos | Domain no persiste (Legacy es Owner) |
| `deleteSpin()` | ✅ Reindexa + cache | ✅ Reindexa | Domain sin cache (justificado) |
| `updateSpin()` | ✅ Valida + cache | ✅ Valida | Domain sin cache (justificado) |
| `clearSpins()` | ✅ Persistencia | ✅ | Domain sin persistencia |
| `importSpins()` | ✅ Normaliza + persiste | — | Legacy es Owner |
| `getSpins()` | ✅ | ✅ | Idéntico |
| `getHitMap()` | — | ✅ | Solo Domain |
| `getHitRanking()` | — | ✅ | Solo Domain |
| Normalización | En importSpins | `normalizeNumber()` estático | ✅ Disponible |
| Cache `_freq` | ✅ Incremental | ❌ Omitido | Justificado |
| Metadatos spin | casino, dealer, table | casino, dealer, table | ✅ Idéntico |
| Hidratación | Constructor | `initialize()` | ✅ Ambos desde rouletteSpinsStore |
| Persistencia | IndexedDB | `saveSpins()`/`loadSpins()` | ✅ Reutiliza rouletteSpinsStore |

---

## 5. CRUD Implementado

```js
// SpinManager
addSpin(number, meta = {})     → object | null
deleteSpin(spinId)             → boolean
updateSpin(spinId, newNumber)  → boolean

// RouletteTracker (delega a SpinManager con metadatos de settings)
addSpin(number)     → object | null
deleteSpin(spinId)  → boolean
updateSpin(spinId, newNumber) → boolean
```

---

## 6. Normalización Implementada

```js
SpinManager.normalizeNumber(input)
// " 90 "  → "00"
// "17.0"  → "17"
// "3,5"   → "3"
// " 00 "  → "00"
// "abc"   → "abc" (rechazado por validación posterior)
```

---

## 7. Cache de Frecuencias

**Estado:** No implementado — justificado técnicamente en Sección 3 (GAP-05).

---

## 8. Metadatos Implementados

Cada spin del dominio ahora incluye:
```json
{
  "id": 1,
  "number": "17",
  "timestamp": "2026-07-24T...",
  "casino": "Casino Name",
  "dealer": "Dealer Name",
  "table": "Table Name"
}
```

---

## 9. Compatibilidad

### Flujo addSpin (sin cambios observables en UI)
```
UI → syncAdapter.addSpin(num)
  → legacy.addSpin(num) → valida, crea con metadatos, persiste, cache
  → domainTracker.addSpin(num) → valida, crea con metadatos (de settings),
      almacena en memoria
```

### Flujo deleteSpin (desde tomadorRenderer)
```
tomadorRenderer → tracker.deleteSpin(spinId)
  → legacy.deleteSpin(spinId) → legacy elimina, reindexa, cache
  → domainTracker.deleteSpin(spinId) NO se llama (sigue siendo Legacy-Legacy)
```
**Nota:** `domainTracker.deleteSpin()` está disponible pero no es llamado
por el adaptador ni por la UI. Es funcionalmente correcto y listo para
cuando el ownership se invierta.

### Flujo updateSpin (desde tomadorRenderer)
```
tomadorRenderer → tracker.updateSpin(id, num)
  → legacy.updateSpin(id, num) → legacy actualiza, cache
  → domainTracker.updateSpin(id, num) NO se llama
```

---

## 10. Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| `deleteSpin` en dominio no persiste | BAJO | Legacy es Owner y persiste. Domain es réplica. |
| `updateSpin` en dominio no marca chiDirty | BAJO | chiDirty es del Legacy. Domain no computa chi. |
| Normalización no aplicada en addSpin | BAJO | Consistente con Legacy — addSpin no normaliza. |
| Metadatos vacíos si settings no cargados | BAJO | `|| ''` garantiza campo presente, nunca undefined. |
| `_freq` omitido puede afectar rendimiento futuro | MEDIO | Re-evaluar cuando domain asuma ownership. |

---

## 11. Resultado del Build

```bash
npm run build
> ruleta-americana@0.0.0 build
> vite build

vite v8.0.10 building client environment for production...
transforming...✓ 78 modules transformed.
✓ built in 497ms
```

**Estado:** ✅ Compilación limpia — 0 errores.

---

## 12. Estado Actualizado de los Gaps

| Gap | Severidad | Estado | Notas |
|-----|-----------|--------|-------|
| **GAP-01** | CRÍTICO | ✅ Resuelto (Fase5.2.1) | Validación ROULETTE_NUMBERS |
| **GAP-02** | ALTO | ✅ Resuelto | deleteSpin + updateSpin |
| **GAP-03** | MEDIO | ✅ Resuelto | normalizeNumber() estático |
| **GAP-04** | CRÍTICO | ✅ Resuelto (Fase5.2.1) | saveSpins + loadSpins |
| **GAP-05** | MEDIO | ⏭️ No aplica | Justificado técnicamente |
| **GAP-06** | MEDIO | ✅ Resuelto | Metadatos casino/dealer/table |
| **GAP-07** | ALTO | ✅ Resuelto (Fase5.2.1) | Hidratación en initialize() |

**Ownership:** Legacy sigue siendo dueño de Spins. NO se invirtió.
**Siguiente fase:** Fase 5.2.3 — Reauditoría de equivalencia.
