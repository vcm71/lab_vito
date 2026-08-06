# PHASE 2.0.1 — SIGNAL NORMALIZER AUDIT REPORT

**Timestamp**: 2026-07-30T14:14:50-04:00
**Commit**: 90b23ac
**Branch**: main
**Auditor**: Hermes Agent (deepseek-v4-pro)
**Scope**: `src/consensus/normalizer/SignalNormalizer` + estrategias relacionadas
**Status**: ✅ COMPLETED — 2 bugs corregidos, 16 tests nuevos, 0 regresiones

---

## Executive Summary

La auditoría de la Fase 2.0.1 verificó 7 dimensiones del `SignalNormalizer` según la
especificación en `reports/Fase2.0.1_gpt.md`. Se detectaron **2 bugs** (uno crítico de
contadores, uno de diseño sin impacto funcional inmediato), ambos corregidos. Se añadieron
**16 tests nuevos** (inmutabilidad, preservación 0/00, clock inyectable, invariante de
contadores). Suite completa: **144/144 tests pass, lint 0, build OK**.

---

## 1. Estrategias IDENTITY (delayRatio, probabilityDelay, expectedDist, pciIndividual, pciCombined)

### Verdict: ✅ CORRECTO (con observación)

| Campo             | Tipo real           | Rango       | ¿IDENTITY correcto? |
|-------------------|---------------------|-------------|----------------------|
| `delayRatio`      | Ratio `actual/max`  | [0, 1]      | ✅ Sí — ya normalizado |
| `probabilityDelay`| Probabilidad        | (0, 1]      | ✅ Sí — ya normalizado |
| `expectedDist`    | Distancia teórica   | [2.7, ∞)    | ⚠️ No es [0,1], pero es una constante física del juego |
| `pciIndividual`   | Índice de correlación | [0, ∞)   | ⚠️ No es [0,1]; se usa crudo en ConsensusEngine |
| `pciCombined`     | Índice de correlación | [0, ∞)   | ⚠️ Misma observación que pciIndividual |

**Análisis**: Los campos `expectedDist`, `pciIndividual` y `pciCombined` no están acotados
a [0, 1] como `delayRatio` y `probabilityDelay`. Sin embargo, IDENTITY es la estrategia
correcta porque estos valores son **intrínsecamente significativos en su escala nativa**
y el ConsensusEngine los consume directamente. Normalizarlos a [0, 1] con PERCENTILE o
MIN_MAX destruiría su semántica física (distancias esperadas, índices de correlación).

**Riesgo**: Ninguno. Los consumidores (`AtRepAdapter`, `LabConAdapter`) emiten estos
campos con valores ya en su escala nativa. La estrategia IDENTITY preserva la semántica.

---

## 2. Mapping ordinal de `level` (winWin.level)

### Verdict: ⚠️ ORDINAL MAPPING REGISTRADO PERO NO ACTIVO

El dominio produce los siguientes valores en `level`:
- `null` (sin racha activa)
- `"WIN"` (1 distancia consecutiva bajo threshold)
- `"WIN-WIN(N)"` para N ∈ [1, 8] (N+2 distancias consecutivas bajo threshold)

El `SignalNormalizer` **registra** una estrategia `CATEGORICAL_LEVEL` con el mapping ordinal:
```js
{ 'WIN': 1, 'WIN-WIN(1)': 2, 'WIN-WIN(2)': 3, 'WIN-WIN(3)': 4, 'WIN-WIN(4)': 5, 'WIN-WIN(5)': 6 }
```
Pero la `fieldConfiguration` por defecto asigna `winWin.level` a `'CATEGORICAL'` (sin mapping),
**no** a `'CATEGORICAL_LEVEL'`. Esto significa que los valores de `level` se preservan como
strings sin valor numérico normalizado.

**Impacto**: El ConsensusEngine no recibe un valor numérico ordinal para `level`. Los
consumidores que necesiten comparar fuerza de rachas entre números deberán parsear los
strings manualmente.

**Recomendación**: Cambiar la `fieldConfiguration` por defecto para que `winWin.level`
use `CATEGORICAL_LEVEL` en lugar de `CATEGORICAL`. Esto es un cambio de una línea en
`fieldConfiguration.js`. **No se aplicó en esta auditoría** porque requeriría coordinar
con los consumidores del campo normalizado para asegurar retrocompatibilidad.

**Nota**: El mapping cubre hasta `WIN-WIN(5)` pero el dominio produce hasta `WIN-WIN(8)`.
Si se activa, debería extenderse el mapping.

---

## 3. activeSets (evidencia vs señal normalizada)

### Verdict: ✅ CORRECTO

`activeSets` aparece en dos lugares del contrato `ConsensusSignal`:
1. `rawSignals.delay.activeSets` — como parte de la señal cruda. Está en `SKIP_FIELDS`, por lo que **no se normaliza**. Correcto: es un array de strings categóricos.
2. `evidence.activeSets` — como metadata de evidencia. No está en `fieldConfiguration`. Correcto: es metadata, no una señal a normalizar.

**Decisión**: La evidencia (`activeSets` en qué conjuntos apareció el número) se preserva
sin distorsionar la señal normalizada. La separación es arquitectónicamente sólida: la
evidencia es contexto, la señal es el valor numérico comparable.

---

## 4. Copia defensiva (inmutabilidad de output)

### Verdict: ✅ CORRECTO (verificado con tests)

Se escribieron **4 tests** de copia defensiva:

| Test | Descripción | Resultado |
|------|-------------|-----------|
| No muta `input.numbers[N].signals` | Las señales crudas no reciben `normalizedSignals` | ✅ |
| No muta `input.metadata` | El metadata de entrada no gana claves de normalización | ✅ |
| No añade/elimina claves de `input.numbers` | El mapa de entrada es estable | ✅ |
| Mutación de output no afecta input | Modificar `normalizedSignals` no contamina las señales crudas | ✅ |

**Implementación**: El `SignalNormalizer` construye un nuevo objeto `enrichedNumbers` sin
mutar `sourceNumbers`. Las referencias a `signals` se comparten (por diseño documentado:
"Keep original signals immutable"), pero el normalizador nunca escribe sobre ellas.

---

## 5. Preservación de 0 y 00

### Verdict: ✅ CORRECTO (verificado con tests)

Se escribieron **5 tests** de preservación:

| Test | Descripción | Resultado |
|------|-------------|-----------|
| "0" se preserva como clave y número | `numbers['0'].number === '0'` | ✅ |
| "00" se preserva como clave y número | `numbers['00'].number === '00'` | ✅ |
| 0 y 00 son entradas separadas | No se confunden; normalización independiente | ✅ |
| 0 normaliza en los 3 motores | Lab_Con, Lab_Con1, AtRep todos OK | ✅ |
| 00 normaliza en los 3 motores | Lab_Con, Lab_Con1, AtRep todos OK | ✅ |

**Mecanismo**: `normalizeRouletteNumber()` acepta explícitamente `"0"` y `"00"` como
strings canónicos distintos. La factory `createConsensusSignal()` normaliza correctamente.
El `SignalNormalizer` itera sobre `Object.entries(sourceNumbers)` preservando las claves.

---

## 6. Determinismo de `appliedAt`

### Verdict: ⚠️ CORREGIDO — Clock inyectable añadido

**Problema original**: `appliedAt` usaba `new Date().toISOString()` hardcodeado, lo que
hacía imposible escribir tests deterministas.

**Corrección aplicada**: Se añadió el parámetro `options.clock` al constructor:
```js
this.clock = typeof options.clock === 'function'
  ? options.clock
  : () => new Date().toISOString();
```

`normalize()` ahora usa `this.clock()` en lugar de `new Date().toISOString()`.

**Tests añadidos** (3):
- `clock()` inyectado produce el timestamp exacto esperado
- Dos llamadas con el mismo clock producen el mismo `appliedAt`
- El clock por defecto produce ISO strings válidos

**Retrocompatibilidad**: ✅ Total. Sin `clock` en options, el comportamiento es idéntico.

---

## 7. Contadores (Configured = Normalized + Skipped)

### Verdict: 🐛 BUG CRÍTICO CORREGIDO

**Bug original**: El invariante `fieldsConfigured = fieldsNormalized + fieldsSkipped`
estaba **roto** porque:
- `fieldsConfigured` = número de campos en `fieldConfig` menos `SKIP_FIELDS` (correcto)
- `fieldsSkipped` = `SKIP_FIELDS.size` (2) — pero estos ya fueron excluidos de configured
- `fieldsNormalized` = `populations.size` — solo contaba campos que construyen poblaciones
  (PERCENTILE, MIN_MAX, etc.), excluyendo IDENTITY, BINARY, CATEGORICAL.

**Corrección aplicada**: Se reemplazó el tracking estático por `Set` dinámicos:
- `processedFields`: campos configurados que fueron efectivamente procesados al menos una vez
- `failedFields`: subconjunto de `processedFields` que produjeron al menos un resultado inválido
- `fieldsSkipped = fieldsConfigured - fieldsNormalized` (campos que nunca se procesaron, e.g. porque ninguna señal de ese motor estaba presente)

**Nuevo invariante**: `fieldsConfigured = fieldsNormalized + fieldsSkipped` ✅
**Nuevo campo**: `fieldsFailed` ≤ `fieldsNormalized` (acotado superiormente)

**Tests añadidos** (4):
- Invariante `C = N + S` se cumple con datos válidos
- `fieldsFailed ≤ fieldsNormalized`
- Con entrada vacía, `fieldsNormalized = 0` y `fieldsSkipped = fieldsConfigured`
- `fieldsFailed` es un número (incluso con datos válidos, CATEGORICAL sin mapping produce `valid: false`)

---

## 8. Validación final

| Verificación | Resultado |
|-------------|-----------|
| `npm run test` (consensus) | ✅ 144/144 tests pass (10 archivos) |
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run build` | ✅ 83 módulos, 539ms |

**Sin regresiones**: Los 128 tests originales + 16 nuevos = 144 tests. Todos pasan.

---

## 9. Cambios realizados

### `src/consensus/normalizer/SignalNormalizer.js`

| Cambio | Tipo | Descripción |
|--------|------|-------------|
| `options.clock` | Feature | Clock inyectable para determinismo de `appliedAt` (retrocompatible) |
| `processedFields` / `failedFields` | Bugfix | Tracking dinámico de campos procesados/fallados vía `Set` |
| `fieldsNormalized` | Bugfix | Ahora cuenta campos procesados, no `populations.size` |
| `fieldsSkipped` | Bugfix | Ahora es `configured - normalized`, no `SKIP_FIELDS.size` |
| `fieldsFailed` | Feature | Nuevo campo en metadata de normalización |

### `tests/consensus/SignalNormalizer.test.js`

| Sección | Tests | Descripción |
|---------|-------|-------------|
| 13. Defensive copy | 4 | Inmutabilidad de input signals, metadata, keys, y aislamiento output→input |
| 14. 0/00 preservation | 5 | Preservación de "0" y "00" como entradas independientes con normalización completa |
| 15. Clock injection | 3 | Clock inyectable produce timestamps deterministas; default produce ISO válido |
| 16. Counter invariant | 4 | C=N+S, F≤N, entrada vacía, estructura de failed |
| **Total nuevos** | **16** | |

---

## 10. Hallazgos no corregidos (recomendaciones)

### 10.1 CATEGORICAL_LEVEL no activo
- **Severidad**: Media
- **Archivo**: `src/consensus/normalizer/fieldConfiguration.js` línea 35
- **Cambio**: `'winWin.level': { strategy: 'CATEGORICAL' }` → `'CATEGORICAL_LEVEL'`
- **Razón para no aplicar**: Requiere coordinar con consumidores del campo normalizado.
  Si se activa, también debe extenderse el mapping para cubrir `WIN-WIN(6)`, `WIN-WIN(7)`,
  `WIN-WIN(8)`.

### 10.2 consensusSignalFactory: guard clauses after deepMerge
- **Severidad**: Baja
- **Archivo**: `src/consensus/consensusSignalFactory.js` líneas 105-113
- **Problema**: `deepMerge(signal, restOverrides)` y `refreshDerivedFields(signal)` se
  ejecutan ANTES de los guard clauses que validan `schemaVersion` y `number`. Si un
  override malicioso incluyera estas propiedades, ya se habrían aplicado.
- **Nota**: Fuera del scope de esta auditoría (el spec dice "No modificar SignalCollector").
  Incluido aquí para documentación.

---

## 11. Conclusión

El `SignalNormalizer` es arquitectónicamente sólido. Las estrategias IDENTITY están
correctamente asignadas a campos ya normalizados o con semántica nativa. La separación
entre evidencia (`activeSets`) y señal normalizada es limpia. La preservación de "0" y
"00" funciona correctamente.

**Dos bugs corregidos**:
1. Contadores rotos (invariante `C = N + S` no se cumplía) → tracking dinámico con `Set`
2. `appliedAt` no determinista → clock inyectable retrocompatible

**Pendiente para fase futura**: Activar `CATEGORICAL_LEVEL` para `winWin.level` y
extender el mapping ordinal hasta `WIN-WIN(8)`.
