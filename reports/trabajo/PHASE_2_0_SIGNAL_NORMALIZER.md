# Fase 2.0: Normalizador de Señales de Consenso (SignalNormalizer)

**Timestamp:** 2026-07-30T13:25:00-04:00
**Estado:** COMPLETADO
**Suite:** 128 tests (61 nuevos) — 100% pass
**Lint:** 0 warnings
**Build:** 83 módulos — exit 0

---

## Resumen

Implementación del submódulo `normalizer/` dentro de `src/consensus/` que extiende la salida del `SignalCollector` (Fase 1.4) añadiendo señales normalizadas a vectores numéricos. Cada campo de cada familia de señales se normaliza con una estrategia configurable, usando la población global (todos los números) como referencia.

## Arquitectura

```
src/consensus/
├── strategies/            ← 7 estrategias de normalización
│   ├── PercentileStrategy.js
│   ├── MinMaxStrategy.js
│   ├── RobustMinMaxStrategy.js
│   ├── ZScoreStrategy.js
│   ├── IdentityStrategy.js
│   ├── BinaryStrategy.js
│   └── CategoricalStrategy.js
├── normalizer/
│   ├── SignalNormalizer.js        ← clase principal
│   ├── fieldConfiguration.js      ← mapeo campo→estrategia por defecto
│   └── index.js                   ← barrel
└── index.js                       ← exportación central
```

## Estrategias implementadas

| Estrategia | Descripción | Salida |
|---|---|---|
| **PERCENTILE** | Rango empírico basado en ranking dentro de la población | [0, 1] |
| **MIN_MAX** | Escalado lineal (value − min) / (max − min) | [0, 1] |
| **ROBUST_MIN_MAX** | Winsorización configurable (p5/p95 por defecto) antes de min-max | [0, 1] |
| **Z_SCORE** | Estandarización (value − μ) / σ | R (sin cota) |
| **IDENTITY** | Pass-through para valores ya normalizados (ej. ratios, probabilidades) | raw |
| **BINARY** | Conversión booleana: true → 1, false → 0 | {0, 1} |
| **CATEGORICAL** | Preservación de strings categóricos, con mapeo ordinal opcional | string \| index |

### Detalles por estrategia

**PERCENTILE**
- Usa midrank para empates (promedio de posiciones compartidas)
- Valores fuera del rango poblacional se saturan a [0, 1]
- Población de un único valor → 0.5 para todos
- No-finitos → null

**MIN_MAX**
- Caso degenerado (min === max) → 0.5
- Fuera de rango → clamp a [0, 1]

**ROBUST_MIN_MAX**
- Winsorización en percentiles configurables (default: 5º / 95º)
- El rawValue en la salida es el original, no el winsorizado
- params.winsorized indica si hubo clipping
- Rango degenerado post-winsorización → 0.5

**Z_SCORE**
- Población de un solo valor → 0 (sin variabilidad)
- No usa clamping

**BINARY**
- null/undefined/no-bool → null, valid = false
- No aplica percentiles sobre booleanos

**CATEGORICAL**
- Sin mapping → rawValue === normalizedValue (string)
- Con mapping ordinal → índice numérico del mapping, unmatched → null
- Sin jerarquía numérica arbitraria

## Configuración de campos por defecto

| Familia | Campo | Estrategia |
|---|---|---|
| delay (Lab_Con) | actualDelay | PERCENTILE |
| delay | maxDelay | MIN_MAX |
| delay | delayRatio | IDENTITY |
| delay | delayScore | PERCENTILE |
| delay | probabilityDelay | IDENTITY |
| delay | pressure | PERCENTILE |
| delay | activeSets | CATEGORICAL |
| winWin (Lab_Con1) | atraso | PERCENTILE |
| winWin | threshold | MIN_MAX |
| winWin | level | CATEGORICAL_LEVEL (ordinal: WIN→1, WIN-WIN(1)→2...) |
| winWin | isActive | BINARY |
| winWin | streakLength | PERCENTILE |
| winWin | streakBonus | PERCENTILE |
| winWin | recencyBonus | PERCENTILE |
| winWin | winWinScore | PERCENTILE |
| pci (AtRep) | occurrences | PERCENTILE |
| pci | meanDist | PERCENTILE |
| pci | expectedDist | IDENTITY |
| pci | pciIndividual | IDENTITY |
| pci | pciCombined | IDENTITY |

Campos excluidos (SKIP_FIELDS): `delay.schemaVersion`, `delay.number`, `delay.sourceEngines`, `delay.metadata.*`, `delay.evidence.*`, `delay.rawSignals.*` (metadatos y objetos compuestos).

## SignalNormalizer

### Constructor
```js
new SignalNormalizer({
  mode: 'tolerant',        // 'tolerant' | 'strict'
  fieldConfig: { ... },    // override de DEFAULT_FIELD_CONFIGURATION
  strategies: { ... },     // fieldKey → instancia de estrategia
})
```

### normalize(collectorOutput) → enrichedOutput

**Input:** `{ numbers: { "17": { number, signals: {...} } }, metadata: {...} }`
(Salida de `SignalCollector.collect()`)

**Output:** `{ numbers: { "17": { number, signals, normalizedSignals: {...} } }, metadata: { ...normalization } }`

Para cada número:
```js
{
  number: "17",
  signals: { Lab_Con: signal, Lab_Con1: signal, AtRep: signal },  // original inmutable
  normalizedSignals: {
    Lab_Con: {
      "delay.actualDelay": { rawValue: 12, normalizedValue: 0.42, method: "PERCENTILE", valid: true, params: {...} },
      "delay.delayRatio":  { rawValue: 0.8, normalizedValue: 0.8, method: "IDENTITY", valid: true, params: {} },
      ...
    },
    Lab_Con1: {
      "winWin.isActive": { rawValue: true, normalizedValue: 1, method: "BINARY", valid: true, params: {} },
      ...
    },
    AtRep: { ... }
  }
}
```

Metadatos añadidos:
```js
{
  normalization: {
    appliedAt: "2026-07-30T13:25:00.000Z",
    mode: "tolerant",
    strategyNames: ["PERCENTILE", "MIN_MAX", "IDENTITY", "CATEGORICAL", ...],
    fieldsConfigured: 22,
    fieldsNormalized: 17,   // campos poblacionales
    fieldsSkipped: 5,
    warnings: [],
  }
}
```

### Modos

- **tolerant** (default): estrategia desconocida → skip + warning; fallo de normalización → null + warning
- **strict**: estrategia desconocida → throw; fallo → throw

### Poblaciones

Las poblaciones se construyen sobre TODOS los números, no por número individual. Esto permite que PERCENTILE, Z_SCORE, etc. operen sobre la distribución global.

## Tests (61 nuevos)

### SignalNormalizer (30 tests)
- Constructor validation (6): default, strict mode, unknown mode fallback, custom fieldConfig, merge with defaults, strategy overrides
- Input validation (3): null, non-object, missing "numbers"
- registerStrategy (2): register, invalid strategy throws
- Basic normalization flow (1): integration with real adapters + spins
- Output structure (2): immutability, metadata
- Null signal handling (1)
- Field-level normalization (5): PERCENTILE, IDENTITY, BINARY, CATEGORICAL (with/without mapping)
- Population building (2): cross-number populations, mixed null/valid
- Strict mode (2)
- Field exclusion (1): SKIP_FIELDS
- Edge cases (2): empty input, non-finite values
- Metadata warnings (2)

### Estrategias (31 tests)
- PercentileStrategy (7): min→0, max→1, median→0.5, ties, out-of-range, non-finite, single-value, empty
- MinMaxStrategy (5): min→0, max→1, midpoint→0.5, out-of-range, degenerate
- RobustMinMaxStrategy (4): winsorization, custom percentiles, clamping bounds, degenerate
- ZScoreStrategy (4): mean→0, positive, negative, single-value
- IdentityStrategy (3): pass-through, NaN→null, null→null
- BinaryStrategy (3): true→1, false→0, non-boolean→null
- CategoricalStrategy (3): no mapping, ordinal mapping, unmatched

## Archivos creados / modificados

| Archivo | Acción |
|---|---|
| `src/consensus/strategies/PercentileStrategy.js` | Nuevo |
| `src/consensus/strategies/MinMaxStrategy.js` | Nuevo |
| `src/consensus/strategies/RobustMinMaxStrategy.js` | Nuevo |
| `src/consensus/strategies/ZScoreStrategy.js` | Nuevo |
| `src/consensus/strategies/IdentityStrategy.js` | Nuevo |
| `src/consensus/strategies/BinaryStrategy.js` | Nuevo |
| `src/consensus/strategies/CategoricalStrategy.js` | Nuevo |
| `src/consensus/strategies/index.js` | Nuevo |
| `src/consensus/normalizer/SignalNormalizer.js` | Nuevo |
| `src/consensus/normalizer/fieldConfiguration.js` | Nuevo |
| `src/consensus/normalizer/index.js` | Nuevo |
| `src/consensus/index.js` | Modificado (nuevas exportaciones) |
| `tests/consensus/SignalNormalizer.test.js` | Nuevo |
| `tests/consensus/consensusExports.test.js` | Modificado |

## Verificación

```
$ npx vitest run tests/consensus/
✓ 10 test files — 128 tests passed

$ npm run lint
✓ 0 errors, 0 warnings

$ npm run build
✓ 83 modules transformed — built in 395ms
```
