# FASE 5.2 — SPIN OWNERSHIP AUDIT

## 1. Resumen Ejecutivo

Se auditaron el Legacy Tracker (`rouletteTracker.js`) y el Domain Tracker (`src/tracker/RouletteTracker.js` + `SpinManager.js`) para determinar si `RouletteTracker` (domain) puede convertirse en el **único Owner de los Spins** sin producir regresiones funcionales.

**Conclusión**: ❌ **NO puede iniciarse la inversión del ownership.**

Existen 7 gaps funcionales documentados que impiden la equivalencia completa.  
El Legacy Tracker DEBE seguir siendo el owner hasta que el dominio cubra:
- validación contra `ROULETTE_NUMBERS`
- normalización de entrada
- metadatos de sesión (casino, dealer, table)
- persistencia en IndexedDB
- cache de frecuencias y delays
- deleteSpin / updateSpin por ID

---

## 2. Inventario del Legacy (`rouletteTracker.js`)

| # | Responsabilidad | Método/Variable | Línea | Detalle |
|---|----------------|-----------------|-------|---------|
| 1 | Definición de números válidos | `ROULETTE_NUMBERS` | 10-14 | Array de 38 strings: ["00","0","1"…"36"] |
| 2 | Metadatos de números | `NUM_META` | 25-39 | Pre-computa color, parity, hl, dozen, column O(38) |
| 3 | Almacenamiento de spins | `this.spins` | 44 | Array — fuente de verdad ACTUAL |
| 4 | Cache de frecuencias | `this._freq` | 55 | `{num → count}`, O(1) por consulta |
| 5 | Cache chi-cuadrado | `this._chiDirty`, `this._chiValue` | 56-57 | Lazy evaluation O(38) |
| 6 | Cache de atrasos | `this._delaysDirty`, `this._cachedDelays` | 60-68 | 6 categorías de delay cacheados |
| 7 | Versión de revisión | `this._spinRevision` | 45 | Para detección de cambios |
| 8 | Carga desde IndexedDB | `_loadSpins()` | 92-94 | Lee de `rouletteSpinsStore.getSnapshot()` |
| 9 | Persistencia a IndexedDB | `_saveSpins()` | 96-105 | Escribe en `rouletteSpinsStore.setSpins()` |
| 10 | Hidratación asíncrona | `_hydratePersistedSpins()` | 107-122 | Sincroniza con IndexedDB al inicio |
| 11 | Comparación de spins | `_sameSpins(a, b)` | 137-152 | Compara número, timestamp, dealer, casino, table |
| 12 | Reconstrucción de cache | `_buildFreq()` | 164-169 | O(N) recalcula frecuencias |
| 13 | Chi-cuadrado lazy | `_getChi()` | 172-184 | O(38) si dirty |
| 14 | **CRUD: addSpin** | `addSpin(numberStr)` | 188-205 | Valida RN, crea spin {id,number,timestamp,casino,dealer,table}, pushea, actualiza cache, persiste |
| 15 | **CRUD: getSpins** | `getSpins()` | 207 | Devuelve referencia a `this.spins` |
| 16 | **CRUD: deleteSpin** | `deleteSpin(spinId)` | 209-221 | Busca por id, elimina, re-indexa ids, decrementa cache, persiste |
| 17 | **CRUD: updateSpin** | `updateSpin(spinId, newNumber)` | 223-235 | Valida RN, ajusta cache bidireccionalmente, cambia número, persiste |
| 18 | **CRUD: clearSession** | `clearSession()` | 237-245 | Vacía array, resetea _freq a 0, marca caches dirty, persiste |
| 19 | **CRUD: importSpins** | `importSpins(numbersArray)` | 264-293 | Valida RN, normaliza (trim, "90"→"00", split "," "."), construye array con timestamps, recalcula _freq, persiste, genera reporte |
| 20 | Campos adicionales en spin | casino, dealer, table | 194-196 | Lee de `this.settings.casinoName`, `crupierName`, `tableName` |
| 21 | Normalización en import | trim, split('.')[0], split(',')[0], "90"→"00" | 271-274 | Limpieza de entrada |
| 22 | Stats básicos | `getStats()` | 314-352 | O(38) recorre _freq, retorna porcentajes |
| 23 | Alertas | `getAlerts()` | 494+ | Opera sobre `this.spins`, `this._freq` |
| 24 | Probabilidades | `getProbabilities()` | 471-490 | Usa `getStats()` |
| 25 | Cálculo de delays | `_recomputeDelays()` | 356-426 | O(N) recorre `this.spins` |
| 26 | Getters de delays (7 métodos) | `getNumberDelay`, `getDozenDelay`, etc. | 428-467 | Activan `_recomputeDelays()` si dirty |
| 27 | Colores estáticos | `getColor()`, `getParity()`, etc. | 297-302 | Útiles estáticos, sin estado mutable |
| 28 | Distancia en la rueda | `getWheelDistance()` | 304-310 | Estático |

### Side-effects del Legacy
- **Persistencia**: Toda mutación de spins llama a `_saveSpins()` → IndexedDB
- **Cache bi-direccional**: `addSpin()` incrementa `_freq`, `deleteSpin()` decrementa, `updateSpin()` ajusta ambos lados
- **Re-indexación**: `deleteSpin()` re-asigna `s.id = i + 1` a todos los spins posteriores
- **Hidratación**: Al arrancar, sobreescribe `this.spins` si hay datos en IndexedDB más recientes

---

## 3. Inventario del Domain

### 3.1 `src/tracker/TrackerState.js`

| # | Responsabilidad | Atributo | Línea |
|---|----------------|----------|-------|
| 1 | Contenedor de estado | `this.spins` | 18 |
| 2 | Sesión | `this.session` | 11-16 |
| 3 | Historial | `this.history` | 20 |
| 4 | Configuración | `this.settings` | 22 |

Sin lógica — solo estructura de datos.

### 3.2 `src/tracker/SpinManager.js`

| # | Responsabilidad | Método | Línea | Detalle |
|---|----------------|--------|-------|---------|
| 1 | Constructor | `constructor(state)` | 14-22 | Inicializa `this._state.spins = []` si no existe |
| 2 | **addSpin** | `addSpin(number)` | 30-41 | Crea spin {id,number,timestamp}. **NO valida RN, NO normaliza, NO casino/dealer/table** |
| 3 | removeLastSpin | `removeLastSpin()` | 47-49 | Pop |
| 4 | clearSpins | `clearSpins()` | 54-56 | Reasigna `= []` |
| 5 | getSpins | `getSpins()` | 62-64 | Referencia directa |
| 6 | getHistory | `getHistory()` | 70-72 | Copia del array |
| 7 | getLastSpin | `getLastSpin()` | 78-81 | Último elemento |
| 8 | getLastNumber | `getLastNumber()` | 87-90 | number del último |
| 9 | count | `count()` | 96-98 | length |
| 10 | isEmpty | `isEmpty()` | 104-106 | length === 0 |

### 3.3 `src/tracker/RouletteTracker.js`

| # | Responsabilidad | Método | Línea | Detalle |
|---|----------------|--------|-------|---------|
| 1 | addSpin (delegado) | `addSpin(number)` | 76-78 | → SpinManager.addSpin |
| 2 | removeLastSpin | `removeLastSpin()` | 84-86 | → SpinManager |
| 3 | clearSpins | `clearSpins()` | 91-93 | → SpinManager |
| 4 | getSpins | `getSpins()` | 99-101 | → SpinManager |
| 5 | count | `count()` | 131-133 | → SpinManager |
| 6 | isEmpty | `isEmpty()` | 139-141 | → SpinManager |
| 7 | getLastSpin | `getLastSpin()` | 115-117 | → SpinManager |
| 8 | getLastNumber | `getLastNumber()` | 123-125 | → SpinManager |
| 9 | importSpins | `importSpins(nums)` | 415-426 | **NUEVO (Fase5.2)** — no valida RN, no normaliza, no genera reporte |
| 10 | recordAndClearSession | `recordAndClearSession()` | 436-454 | Guarda sesión e historial |
| 11 | getHitMap | `getHitMap()` | 461-469 | **NUEVO (Fase5.2)** — frecuencia O(N) |
| 12 | getHitRanking | `getHitRanking()` | 475-480 | **NUEVO (Fase5.2)** — ranking descendente |

### 3.4 Managers restantes

| Módulo | Responsabilidad | ¿Afecta spins? |
|--------|----------------|----------------|
| SessionManager | Ciclo de vida de sesión | Solo `spinCount` |
| HistoryManager | Historial persistente en localStorage | No directamente |
| SettingsManager | Configuración persistente | No |

---

## 4. Matriz de Equivalencia

| Responsabilidad | Legacy | Domain | Estado |
|----------------|--------|--------|--------|
| addSpin (crear) | ✔ | ✔ | △ **Parcial** |
| addSpin — validar RN | ✔ | ✖ | ✖ No existe |
| addSpin — normalizar entrada | ✔ (solo en import) | ✖ | ✖ No existe |
| addSpin — casino/dealer/table | ✔ | ✖ | ✖ No existe |
| getSpins (referencia) | ✔ | ✔ | ✔ Equivalente |
| removeLastSpin | ✔ | ✔ | ✔ Equivalente |
| clearSpins / clearSession | ✔ | △ | △ **Parcial** |
| deleteSpin (por ID) | ✔ | ✖ | ✖ No existe |
| updateSpin (por ID) | ✔ | ✖ | ✖ No existe |
| importSpins | ✔ | △ | △ **Parcial** |
| import — validar RN | ✔ | ✖ | ✖ No existe |
| import — normalizar (trim, 90, ., ,) | ✔ | ✖ | ✖ No existe |
| import — reporte (total,valid,discarded) | ✔ | ✖ | ✖ No existe |
| Persistencia IndexedDB | ✔ | ✖ | ✖ No existe |
| Hidratación desde IndexedDB | ✔ | ✖ | ✖ No existe |
| Cache de frecuencias (_freq) | ✔ | ✖ | ✖ No existe |
| Cache de chi-cuadrado | ✔ | ✖ | ✖ No existe |
| Cache de delays | ✔ | ✖ | ✖ No existe |
| Re-indexación post-delete | ✔ | ✖ | ✖ No existe |
| getStats (%) | ✔ | ✖ | ✖ No existe |
| getAlerts | ✔ | ✖ | ✖ No existe |
| getProbabilities | ✔ | ✖ | ✖ No existe |
| getHitMap | ✖ | ✔ | ✔ Equivalente (domain nuevo) |
| getHitRanking | ✖ | ✔ | ✔ Equivalente (domain nuevo) |
| recordAndClearSession | ✖ (delegado) | ✔ | ✔ Equivalente |
| Eventos (EventBus.stub) | ✖ | △ | △ Parcial (stub) |

**Leyenda**: ✔ = Equivalente | △ = Parcial | ✖ = No existe

---

## 5. GAP Analysis

### GAP-01: Validación de números (CRÍTICO)
- **Archivo**: `src/tracker/SpinManager.js:30-41`
- **Responsabilidad**: `addSpin()` no valida contra `ROULETTE_NUMBERS`
- **Impacto**: Acepta strings inválidos ("abc", "-1", "99") que corrompen estadísticas y engines
- **Riesgo**: ALTO — datos inválidos propagados a engines
- **Complejidad de migración**: BAJA — añadir guard condition

### GAP-02: Normalización de entrada (MEDIO)
- **Archivo**: `src/tracker/SpinManager.js:30-41`
- **Responsabilidad**: No normaliza "90"→"00", no limpia ".", "," , espacios
- **Impacto**: "90" se almacena literalmente en vez de "00", " 5" no se compara correctamente
- **Riesgo**: MEDIO — el sistema main.js ya normaliza antes de llamar, pero el dominio debería ser robusto
- **Complejidad**: BAJA — añadir normalización

### GAP-03: Metadatos de sesión (casino/dealer/table) (MEDIO)
- **Archivo**: `src/tracker/SpinManager.js:30-41`
- **Responsabilidad**: El spin del dominio no incluye `casino`, `dealer`, `table`
- **Impacto**: Spins del dominio no tienen estos campos; si se sincronizan al legacy, se pierden. El legacy usa estos campos para filtrar/reportes
- **Riesgo**: BAJO por ahora (nadie consume esos campos del dominio), pero si se elimina el legacy, los datos históricos serán incompletos
- **Complejidad**: MEDIA — requiere pasar las settings al dominio

### GAP-04: Persistencia (CRÍTICO)
- **Archivo**: `src/tracker/SpinManager.js`
- **Responsabilidad**: No persiste en IndexedDB. Los spins viven solo en memoria (`TrackerState.spins`)
- **Impacto**: **Pérdida total de datos al recargar página**
- **Riesgo**: MUY ALTO — inaceptable para un tracker de ruleta real
- **Complejidad**: ALTA — requiere integración con `rouletteSpinsStore` o un nuevo mecanismo de persistencia

### GAP-05: Cache de frecuencias (MEDIO)
- **Archivo**: `src/tracker/RouletteTracker.js`
- **Responsabilidad**: `getHitMap()` recorre O(N) cada vez. Legacy tiene `_freq` O(1)
- **Impacto**: Rendimiento O(N) vs O(1) para estadísticas. Engines como Chi-cuadrado dependen de `_freq`
- **Riesgo**: MEDIO — degradación de rendimiento en tablas grandes (10K+ spins)
- **Complejidad**: MEDIA — añadir `_freq` y lazy invalidation al dominio

### GAP-06: deleteSpin/updateSpin (MEDIO)
- **Archivo**: `src/tracker/SpinManager.js`
- **Responsabilidad**: No existe `deleteSpin(id)` ni `updateSpin(id, newNumber)`
- **Impacto**: `tomadorRenderer.js` llama directamente a `tracker.deleteSpin()` y `tracker.updateSpin()` sobre el legacy. Si el legacy deja de ser owner, estas operaciones no tendrían efecto en el dominio
- **Riesgo**: MEDIO — funcionalidad de edición de tiradas rota
- **Complejidad**: BAJA — añadir métodos

### GAP-07: Hidratación desde almacenamiento (ALTO)
- **Archivo**: `src/tracker/RouletteTracker.js`
- **Responsabilidad**: No carga datos guardados al iniciar
- **Impacto**: Al recargar, los datos de sesiones anteriores no se restauran
- **Riesgo**: ALTO — el usuario pierde el historial de giros
- **Complejidad**: ALTA — requiere integración con capa de persistencia

---

## 6. Dependencias (Consumidores del Legacy respecto a Spins)

### Lectores de `tracker.getSpins()` (referencia directa)
| Archivo | Uso | Tipo |
|---------|-----|------|
| `main.js:668` | `const spins = tracker.getSpins()` → renderHeatMap, dominio | Público |
| `orionRenderer.js` | `tracker.getSpins()` múltiples llamadas | Público |
| `labEngine.js` | `this.tracker.getSpins()` | Público |
| `MotorEstadistica_daEngine.js` | `this.tracker.getSpins()` | Público |
| `tomadorRenderer.js` | `tracker.getSpins()` | Público |

### Mutadores de `tracker.*` (llamada directa)
| Archivo | Llamada | Tipo |
|---------|---------|------|
| `main.js:1600` | `syncAdapter.addSpin(number)` | Via adapter |
| `main.js:1423` | `syncAdapter.clearSessionAndRecord()` | Via adapter |
| `main.js:2332,2389` | `syncAdapter.importSpins(matches)` | Via adapter |
| `orionRenderer.js` | `tracker.addSpin(num)`, `tracker.clearSession()` | **Directo** ⚠️ |
| `tomadorRenderer.js` | `tracker.deleteSpin(id)`, `tracker.updateSpin(id, num)` | **Directo** ⚠️ |
| `monteCarloValidator.js` | `tracker.clearSession()` | **Directo** ⚠️ |
| `stress_test_orion.js` | `tracker.addSpin(spin)` | **Directo** ⚠️ (Node) |

### Consumidores de estado interno/privado
| Archivo | Acceso | Tipo |
|---------|--------|------|
| `orionRenderer.js` | `tracker._freq` | **Privado** ⚠️ |

---

## 7. Riesgos

### R-01: Ruptura de validación
Si el dominio se convierte en owner sin validación RN, un número inválido ("99") entraría al sistema y corrompería estadísticas de engines.

### R-02: Pérdida de datos por falta de persistencia
El dominio no persiste en IndexedDB. Si se invierte el ownership y el legacy se vuelve mera copia, recargar la página borraría todos los datos.

### R-03: Cache inconsistente
El legacy tiene `_freq` y `_delaysDirty`. El dominio no. Tras `syncSpin()`, el cache del legacy se actualiza, pero si algún proceso escribe directamente en `tracker.spins` (el legacy), el dominio nunca se entera.

### R-04: Mutadores directos sin adapter
`orionRenderer.js`, `tomadorRenderer.js`, `monteCarloValidator.js` y `stress_test_orion.js` llaman métodos del legacy directamente. Si el legacy no es el owner, los cambios no llegarían al dominio.

### R-05: Re-indexación rota
`deleteSpin()` en el legacy re-indexa `id` de todos los spins posteriores. El dominio no sabe de esta re-indexación.

### R-06: Campos de sesión perdidos
spin.casino/spin.dealer/spin.table no existen en el dominio. Engines que filtran por estos campos perderían información.

### R-07: Acceso privado `tracker._freq`
`orionRenderer.js` accede directamente a `tracker._freq`. Si el ownership cambia y `_freq` deja de mantenerse, ese renderer rompe.

---

## 8. Conclusión Técnica

**Estado actual de equivalencia**: 7 gaps funcionales (2 críticos, 2 altos, 3 medios).

El Domain Tracker (`RouletteTracker` + `SpinManager`) **no implementa el 100% del contrato funcional** del Legacy Tracker respecto a Spins.

| Categoría | Total | ✔ Equivalentes | △ Parciales | ✖ No existen |
|-----------|-------|---------------|-------------|--------------|
| CRUD Spins | 8 | 2 | 3 | 3 |
| Validación | 2 | 0 | 0 | 2 |
| Cache/Stats | 6 | 0 | 0 | 6 |
| Persistencia | 2 | 0 | 0 | 2 |
| HitMap/Ranking | 2 | 2 | 0 | 0 |
| Recording Sesión | 1 | 1 | 0 | 0 |
| **Total** | **21** | **5** | **3** | **13** |

---

## 9. Recomendación

**NO migrar el ownership en esta fase.**

En lugar de invertir el ownership ahora, se recomienda:

1. **Cerrar GAP-01 y GAP-02** (validación RN + normalización) en SpinManager — baja complejidad, alto impacto
2. **Cerrar GAP-06** (deleteSpin/updateSpin en SpinManager) — baja complejidad
3. **Planificar persistencia (GAP-04, GAP-07)** como fase separada — alta complejidad, requiere decisiones arquitectónicas
4. **Cache (GAP-05)** puede esperar: el legacy lo provee mientras exista
5. **Migrar mutadores directos** (`orionRenderer`, `tomadorRenderer`, `monteCarloValidator`) a usar `syncAdapter` en una fase posterior
6. Documentar el acceso privado `tracker._freq` y planificar su migración

---

## 10. Decisión Final

❌ **Opción B: RouletteTracker NO implementa el 100% del contrato funcional.**

**No debe iniciarse la inversión del ownership en esta fase.**

Los gaps de validación (GAP-01), normalización (GAP-02), persistencia (GAP-04) y delete/update (GAP-06) son blockers determinantes. Invertir el ownership ahora produciría **regresiones funcionales**: pérdida de datos al recargar, números inválidos en engines, y edición de tiradas rota.
