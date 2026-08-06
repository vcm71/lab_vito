# Fase 1.4 — SignalCollector · Reporte de Implementación

**Timestamp:** 2026-07-30T16:46:14Z
**Módulo:** `src/consensus/collection/SignalCollector.js`
**Estado:** COMPLETADO ✅

---

## 1. Resumen Ejecutivo

Se implementó el **SignalCollector**, el orquestador de recolección de señales dentro del subsistema de consenso. Actúa como fachada sobre los tres adaptadores (`LabConAdapter`, `LabCon1Adapter`, `AtRepAdapter`), ejecutándolos en secuencia y consolidando sus señales en una estructura canónica indexada por número.

La implementación sigue el patrón de inyección de dependencias: recibe los tres adaptadores ya instanciados, valida su contrato estructural (`adapt()` method), y expone un único punto de entrada `collect(options)`.

---

## 2. Arquitectura

```
SignalCollector
├── constructor({ labConAdapter, labCon1Adapter, atRepAdapter })
├── collect({ mode?, clock? }) → { numbers, metadata }
└── Validaciones internas (inmutabilidad, universo, señales inválidas, duplicados, etc.)
```

### Estructura de salida

```json
{
  "numbers": {
    "0": { "number": "0", "signals": { "Lab_Con": {...}|null, "Lab_Con1": {...}|null, "AtRep": {...}|null } },
    "00": { ... },
    "1": { ... },
    ...
    "36": { ... }
  },
  "metadata": {
    "collectedAt": "<ISO-8601>",
    "enginesRequested": ["Lab_Con", "Lab_Con1", "AtRep"],
    "enginesCompleted": [...],
    "enginesFailed": [...],
    "totalNumbers": 38,
    "totalSignals": <N>,
    "completeNumbers": <N>,
    "incompleteNumbers": <N>,
    "warnings": [...],
    "provenance": { "collector": "SignalCollector", "adapters": [...] }
  }
}
```

---

## 3. Archivos creados/modificados

### Nuevos

| Archivo | Rol |
|---------|------|
| `src/consensus/collection/SignalCollector.js` | Implementación del orquestador (~350 líneas) |
| `src/consensus/collection/index.js` | Barrel de exportación |
| `tests/consensus/SignalCollector.test.js` | Suite completa: 30 tests |

### Modificados

| Archivo | Cambio |
|---------|--------|
| `src/consensus/constants/consensusConstants.js` | +`AMERICAN_ROULETTE_NUMBERS` (constante canónica de 38 números) |
| `src/consensus/constants/index.js` | +export de `AMERICAN_ROULETTE_NUMBERS` |
| `src/consensus/index.js` | +export de `SignalCollector`, `AMERICAN_ROULETTE_NUMBERS` |
| `tests/consensus/consensusExports.test.js` | Actualizado con nuevos exports |

---

## 4. Funcionalidades implementadas

### 4.1 Construcción con validación de contrato

- Requiere `{ labConAdapter, labCon1Adapter, atRepAdapter }` como objeto plano.
- Cada adaptador debe exponer `adapt()`. Sin ello, `TypeError`.
- Las dependencias se congelan con `Object.freeze`.

### 4.2 Modos de operación

| Modo | Comportamiento |
|------|---------------|
| `tolerant` (default) | Si un adaptador falla, continúa con los demás. Registra `enginesFailed` y warnings. Las señales del engine fallido quedan `null`. |
| `strict` | Si un adaptador falla, lanza `Error` inmediatamente con `engine` + `adapterKey`. |

Además, en modo `strict` ante `sourceMismatch` también se lanza error.

### 4.3 Reloj inyectable

- `collect({ clock })` acepta `clock: () => ISO-8601`.
- Por defecto usa `new Date().toISOString()`.
- Permite tests deterministas.

### 4.4 Inmutabilidad (deep clone)

- Cada señal que pasa las validaciones se clona con `cloneConsensusSignal` (usa `structuredClone` con fallback recursivo).
- Los warnings también se copian para evitar contaminación entre llamadas.

### 4.5 Validaciones por engine

Para cada engine que completa exitosamente:

| Validación | Código de warning | Severidad |
|-----------|-------------------|-----------|
| Resultado no-array | `INVALID_COLLECTION` | ERROR |
| Array vacío | `INVALID_COLLECTION` | WARNING |
| Señal no-objeto | `INVALID_SIGNAL` | ERROR |
| Señal estructuralmente inválida (schema) | `INVALID_SIGNAL` | ERROR |
| Número no canónico | `UNKNOWN_NUMBER` | ERROR |
| Número duplicado (mismo engine) | `DUPLICATE_NUMBER` | ERROR |
| Número faltante (no cubierto) | `MISSING_NUMBER` | WARNING |
| `sourceEngines` no coincide con el engine esperado | `SOURCE_MISMATCH` | ERROR |

### 4.6 Metadatos agregados

- `completeNumbers`: cuántos números tienen señal de los 3 engines.
- `incompleteNumbers`: cuántos tienen al menos una señal nula.
- `totalSignals`: total de señales no-nulas en todo el universo.
- `provenance`: trazabilidad del collector y sus adaptadores.

---

## 5. Testing

### Suite: `tests/consensus/SignalCollector.test.js`

```
✓ 30 tests passed
  ├── constructor validation: 4 tests
  ├── collect() option validation: 5 tests
  ├── basic collection: 3 tests
  ├── engine failure: 2 tests
  ├── clock: 1 test
  ├── immutability: 2 tests
  ├── signal validation: 2 tests
  ├── duplicate handling: 1 test
  ├── unknown number: 1 test
  ├── missing number: 1 test
  ├── source mismatch: 2 tests
  ├── empty array: 1 test
  ├── completeNumbers / incompleteNumbers: 2 tests
  ├── warning structure contract: 1 test
  ├── multiple adapter failures: 1 test
  └── non-array adapter result: 1 test
```

### Suite completa de consenso

```
Test Files  9 passed (9)
Tests      67 passed (67)
  ├── cloneConsensusSignal.test.js       2 tests
  ├── consensusSignalFactory.test.js      4 tests
  ├── validateConsensusSignal.test.js    10 tests
  ├── LabConAdapter.test.js               2 tests
  ├── LabCon1Adapter.test.js             2 tests
  ├── AtRepAdapter.test.js               2 tests
  ├── SignalCollector.test.js            30 tests ← NUEVO
  ├── normalizeRouletteNumber.test.js    14 tests
  └── consensusExports.test.js           1 test
```

---

## 6. Validaciones de calidad

| Check | Resultado |
|-------|-----------|
| `npm test` (consensus) | ✅ 67/67 passed |
| `npm run lint` | ✅ 0 warnings, 0 errors |
| `npm run build` | ✅ 83 modules, 0 errors |

---

## 7. Decisiones de diseño

1. **Inyección de dependencias**: El collector no instancia engines; recibe los adaptadores ya construidos. Esto desacopla la recolección del ciclo de vida de los engines.

2. **`AMERICAN_ROULETTE_NUMBERS` como constante canónica**: Centraliza la lista de 38 números `['0', '00', '1'..'36']` en `consensusConstants.js`. Los adaptadores futuros deben usarla en lugar de importar `UNIVERSO_RULETA` desde engines individuales.

3. **Deep clone con `cloneConsensusSignal`**: Reutiliza la utilidad existente del subsistema de consenso (`structuredClone` con fallback recursivo).

4. **Estructura de warnings**: Cada warning incluye `code`, `message`, `severity`, `source: 'SignalCollector'`, `engine`, y `number` (nullable). Esto permite filtrar por engine o número en herramientas de diagnóstico.

5. **UNKNOWN_NUMBER como capa defensiva**: El Schema (`normalizeRouletteNumber`) captura números inválidos primero. El collector mantiene su propia verificación como defensa ante schemas futuros o custom.

6. **Agrupación por número**: La salida `numbers` es un objeto indexado por string (ej. `"0"`, `"00"`, `"5"`), facilitando el acceso O(1) desde renderers que ya trabajan con el número como clave.

---

## 8. Pendientes / Futuras iteraciones

- **Paralelización**: Actualmente los adaptadores se ejecutan secuencialmente. Una futura iteración podría ejecutarlos en paralelo con `Promise.all`.
- **Caché**: Si `collect()` se llama múltiples veces con los mismos datos, podría cachearse por `(spinsHash, settingsHash)`.
- **Métricas de rendimiento**: Agregar `durationMs` por engine en metadata.
- **`collectAsync`**: Versión asíncrona para adaptadores que requieran I/O (ej. fuentes remotas).

---

## 9. Notas para el prompt original

El prompt de Fase 1.4 describía requisitos detallados. A continuación, la trazabilidad:

| Requisito del prompt | Estado |
|----------------------|--------|
| Constructor con 3 adaptadores + validación estructural | ✅ |
| Modo `strict` vs `tolerant` | ✅ |
| `collectedAt` con clock inyectable | ✅ |
| Inmutabilidad (deep clone) | ✅ |
| Warnings con code/message/severity/source/engine/number | ✅ |
| Universo de 38 números canónicos | ✅ (`AMERICAN_ROULETTE_NUMBERS`) |
| Validación de señales inválidas | ✅ |
| Detección de duplicados | ✅ |
| Detección de números faltantes | ✅ |
| Detección de números desconocidos | ✅ (defensivo) |
| Detección de source mismatch | ✅ |
| Metadata: enginesCompleted, enginesFailed | ✅ |
| Metadata: completeNumbers, incompleteNumbers | ✅ |
| Metadata: provenance | ✅ |
| Estructura agrupada `numbers[num] = { number, signals: {...} }` | ✅ |
| Señales de engine fallido = null | ✅ |
| Sin dependencia directa de engines | ✅ (inyección de adaptadores) |

---

*Reporte generado automáticamente por Hermes Agent — Fase 1.4 SignalCollector*
