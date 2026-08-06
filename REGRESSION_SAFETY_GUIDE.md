# Guía de Regression Safety — Orion Roulette Tracker

## Propósito

Esta suite de regression safety congela el comportamiento observable del
domain tracker y sus managers asociados. Su función no es probar nuevas
features, sino detectar cambios inesperados en el comportamiento existente
antes de que lleguen a producción.

## Archivo

- `tests/regression/tracker-regression.test.js` — 81 tests, 10 objetivos

## Cobertura

### 1. Contratos Públicos (12 tests)

Verifica que cada clase exponga los métodos esperados con firmas correctas.

**Qué testea:**
- RouletteTracker: todos sus métodos públicos (`addSpin`, `deleteSpin`, `getStats`, etc.)
- SpinManager: `addSpin` retorna objeto o `null`, `deleteSpin`/`updateSpin` retorna booleano
- RouletteAnalytics: métodos de análisis clave existen
- Tipos de retorno: `object`, `array`, `boolean`, `number`

**Protege contra:**
- Renombres accidentales de métodos
- Cambios en tipos de retorno
- Eliminación de APIs que consumidores externos (UI, tests) esperan

### 2. Invariantes del Dominio (7 tests)

Propiedades que nunca deben violarse, sin importar la implementación.

**Qué testea:**
- `spinCount == count()` después de cada addSpin
- IDs de giros son secuenciales 1-based sin huecos (incluso tras delete+reindex)
- Delays son siempre `number >= 0`, nunca `null` ni negativo
- Delay con 0 giros es 0 para todo número/docena/columna
- HitMap acumula correctamente con números repetidos
- Suma de colorsPct es 100 (o 0 si vacío)

**Protege contra:**
- Bugs en contadores que se desincronizan
- IDs duplicados o con huecos
- Delays que devuelven `null` o `NaN` en lugar de 0
- Stats que no suman 100%

### 3. Characterization (19 tests)

Documenta el comportamiento actual **exacto** como punto de referencia.
Si se cambia intencionalmente la API, estos tests deben actualizarse.

**Qué testea:**
- Estructura exacta del objeto retornado por `addSpin`
- Validación de entradas inválidas (`null`, `undefined`, `''`, `'XYZ'`, `99`, `'37'`)
- Comportamiento de `removeLastSpin`, `getLastSpin`, `getLastNumber`
- Ciclo de vida de sesión completo: start → stop → reset
- Forma exacta de `getDefaultSettings()`
- `clearSession()` y `recordAndClearSession()` comportamiento completo
- Series API: add → toggle → delete

**Protege contra:**
- Cambios silenciosos en el formato de retorno
- Regresión en validación de entradas

### 4. Round Trip (3 tests)

Verifica que el estado observable del tracker se pueda serializar,
deserializar y recrear manteniendo equivalencia.

**Qué testea:**
- Deep copy de estado → crear tracker nuevo → inyectar → comparar
- `recordAndClearSession()` preserva giros en historial
- `getHitMap()`/`getHitRanking()` son computados, nunca almacenados

**Protege contra:**
- Roturas en persistencia (export/import)
- Estado interno que no puede reconstruirse desde datos serializados

### 5. Regresión — Pérdida y Desync (6 tests)

Casos donde históricamente se han perdido giros o desincronizado caches.

**Qué testea:**
- 100 giros con IDs secuenciales sin pérdida
- `deleteSpin` + `removeLastSpin` nunca pierden giros sin decrementar count
- `deleteSpin` reindexa correctamente
- `updateSpin` no altera count ni IDs
- `clearSession` no deja giros huérfanos
- `getSpins()` retorna referencia directa al estado interno

**Protege contra:**
- El bug histórico de `deleteSpin` (Phase 5.1) — pérdida de giros no detectada
- Desync entre count real y reportado
- IDs rotos tras operaciones mixtas

### 6. Casos Límite (8 tests)

Escenarios extremos que suelen romper implementaciones ingenuas.

**Qué testea:**
- Tracker vacío: `count=0`, `isEmpty=true`, `getLastSpin=undefined`
- 1 solo giro: `getLastSpin == único giro`
- 50 repeticiones del mismo número
- Números 0 y 00 como entrada
- `resetSession` en un tracker no afecta a otro
- `deleteSpin` con ID inexistente no muta nada
- `updateSpin` con número inválido no muta nada
- `clearSpins` en vacío no da error

**Protege contra:**
- Crash en tracker vacío
- Edge cases con números especiales (0, 00)
- Efectos colaterales entre trackers

### 7. Bugs Históricos (4 tests)

Convierte bugs corregidos en tests que garantizan que no regresen.

**Qué testea:**
- `deleteSpin` NO invalida delays automáticamente (comportamiento conocido,
  el caller es responsable)
- `updateSpin` NO invalida delays automáticamente
- `clearSession()` SÍ invalida delays (cubre el triple clear)
- `addSpin` NO invalida delays (cache lazy)

**Protege contra:**
- Phase 5.1 historical bug: deleteSpin/updateSpin sin sincronización de delays
- Rotura del patrón de invalidación lazy del DelayManager

### 8. Mutabilidad (7 tests)

Documenta qué getters exponen referencias mutables al estado interno.

**Qué testea:**
- `getSpins()` retorna la misma referencia que `state.spins`
- `getHistory()` retorna la misma referencia que `state.history`
- `getSession()` retorna el mismo objeto que `state.session`
- `getSettings()` retorna el mismo objeto que `state.settings`
- `settings` getter es igual de mutable
- DelayManager retorna números puros, no referencias internas
- `getHitMap()` y `getHitRanking()` retornan objetos nuevos cada vez

**Protege contra:**
- Mutaciones externas silenciosas del estado interno
- Mutaciones que el dominio no puede detectar (sin deep clone)
- Cambios en la política de clonación (que romperían código existente)

### 9. Aislamiento (5 tests)

Dos trackers independientes deben operar sin interferencia.

**Qué testea:**
- Arrays de spins separados
- Mutación en t1.getSpins() no afecta t2
- resetSession en t1 no resetea sesión de t2
- DelayManager atado a t1 no se afecta por t2
- Series en t1 no aparecen en t2

**Protege contra:**
- Estado compartido accidental entre instancias
- Singletons globales en managers

### 10. Estabilidad (5 tests)

Operaciones repetitivas y cíclicas que no deben degradarse.

**Qué testea:**
- 1000 giros totales sin degradación (10 rondas × 100)
- Ciclo addSpin → removeLastSpin → addSpin consistente
- RouletteAnalytics refrescable sin nueva instancia
- `clearSession` y `clearSpins` son idempotentes

**Protege contra:**
- Memory leaks en acumulación de giros
- Degradación de performance en grandes volúmenes
- Idempotencia rota

## Ejecución

```bash
# Solo regression
npx vitest run tests/regression/

# Suite completa (128 tests)
npm test

# Con coverage
npx vitest run --coverage
```

## Convenciones

- **Usar siempre `% 38` con array de nombres válidos** (0-36 + '00') para
  generar números de ruleta americana. `i % 38` como número produce `37`
  que es inválido.
- **No mockear Date** en tests de characterization — el comportamiento
  de timestamp se documenta como "tiene propiedad timestamp", no como
  valor exacto.
- **Usar `makeTracker()` o `makeFullTracker()`** como helpers para crear
  trackers con estado fresco, no instanciar directamente.
- **Tests de mutabilidad referencial** (`toBe`, no `toEqual`) para verificar
  que getters exponen o no exponen referencias internas.

## Mantenimiento

- **Agregar tests aquí** cada vez que se detecte un bug en el dominio.
  El bug corregido debe tener un test que falle sin la corrección.
- **Mover tests de characterization** a unit/integration si cambia la API.
  Los tests de regression deben quedarse solo con los invariantes.
- **Actualizar contador de tests** en `reports/` al agregar o quitar tests.
