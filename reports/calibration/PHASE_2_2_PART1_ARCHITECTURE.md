# FASE 2.2 PART I — PROBABILITY CALIBRATOR ARCHITECTURE

**Timestamp:** 2026-07-30T15:43:00-04:00  
**Proyecto:** Roulette Tracker (lab_vito)  
**Fase:** 2.2 Part I — Infraestructura de calibración  
**Prompt:** [`reports/Fase2.2P1_gpt.md`](../Fase2.2P1_gpt.md)  

---

## 1. Resumen ejecutivo

Se implementó la infraestructura completa del **ProbabilityCalibrator** — el
componente que transforma `rawConsensusScore` (salida del `ConsensusEngine`) en
`calibratedProbability` (probabilidad calibrada lista para consumir por la UI).

**Solo se implementó `IdentityCalibration` como estrategia baseline**
(`calibratedProbability = rawConsensusScore`). Las estrategias de calibración
reales (Histogram, Isotonic, Platt, Beta) se implementarán en Part II.

**Arquitectura:** Plug-in con Registry. Cada estrategia extiende
`CalibrationStrategy` (clase abstracta). El `ProbabilityCalibrator` orquesta la
pipeline: validar input → resolver estrategia → `structuralClone` → calibrar cada
número → construir output.

---

## 2. Árbol de módulos

```
src/calibration/
├── index.js                          # barrel: ProbabilityCalibrator, IdentityCalibration, ...
├── ProbabilityCalibrator.js          # main orchestrator
├── CalibrationStrategyRegistry.js    # registry: register/unregister/get/list/default
├── CalibrationMetadata.js            # metadata builder (per-entry + global)
├── contracts/
│   └── CalibrationContract.js        # input/output type contracts (JSDoc)
├── validators/
│   ├── index.js
│   └── CalibrationInputValidator.js  # validates ConsensusEngine output shape
├── strategies/
│   ├── CalibrationStrategy.js        # abstract base class
│   ├── IdentityCalibration.js        # baseline: calibratedProbability = rawConsensusScore
│   └── index.js
├── factories/
│   └── CalibrationResultFactory.js   # builds CalibrationOutput objects
└── versioning/
    ├── CalibrationVersion.js         # semver immutable value object
    └── index.js

tests/calibration/
└── ProbabilityCalibrator.test.js     # 62 tests
```

**Total:** 15 archivos fuente + 1 test file.

---

## 3. Cumplimiento de restricciones del prompt

| #  | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| 1  | Directorio `src/calibration/` | **OK** | 10 módulos, 5 subdirectorios |
| 2  | `ProbabilityCalibrator` como único punto de entrada pública | **OK** | `src/calibration/index.js` → `ProbabilityCalibrator` |
| 3  | Usa solo `ConsensusEngine.compute()` como entrada | **OK** | Validador verifica contrato público |
| 4  | No importa engines/adapters/normalizers directamente | **OK** | Zero imports de módulos externos |
| 5  | Capa de validación (`CalibrationInputValidator`) | **OK** | strict/tolerant, 9 checks |
| 6  | Estrategia como plug-in (`CalibrationStrategy`) | **OK** | Clase abstracta, `calibrate() + getMeta()` |
| 7  | Registry de estrategias | **OK** | `CalibrationStrategyRegistry` con `register/get/list/default/unregister` |
| 8  | Solo implementar `IdentityCalibration` | **OK** | Ninguna estrategia real (Histogram/Isotonic/Platt/Beta) |
| 9  | Determinismo (sin clock) | **OK** | Test: misma entrada → misma salida |
| 10 | Inmutabilidad (deep clone) | **OK** | `structuralClone` vía JSON, test: entrada no mutada |
| 11 | Semántica de cobertura/participación conservada | **OK** | Fix aplicado en Fase 2.1.1 |
| 12 | Validación strict/tolerant | **OK** | `mode` configurable, throws en strict |
| 13 | `IdentityCalibration` es la estrategia por defecto | **OK** | Registry la pre-registra y la devuelve en `default()` |
| 14 | Factory para construir output (`CalibrationResultFactory`) | **OK** | `buildEntry()` + `buildOutput()` |
| 15 | Versionado semántico (`CalibrationVersion`) | **OK** | parse/toString/equals/isCompatible |
| 16 | Metadata por entrada y global | **OK** | `CalibrationMetadata` con `buildPerEntryMeta` + `buildGlobalMeta` |

---

## 4. Diseño detallado

### 4.1 Pipeline del ProbabilityCalibrator

```
ConsensusEngine.compute()
  │
  ├─ { numbers: { '17': { rawConsensusScore: 0.72, ... } }, metadata: { consensus: {...} } }
  │
  ▼
ProbabilityCalibrator.calibrate(input, strategyName?)
  │
  ├─ [1] Validar contrato de entrada → CalibrationInputValidator
  │      - strict: lanza Error ante fallos
  │      - tolerant: warnings, continúa
  │
  ├─ [2] Resolver estrategia → CalibrationStrategyRegistry
  │      - Por nombre o default (IdentityCalibration)
  │
  ├─ [3] structuralClone(input) → preserve immutability
  │
  ├─ [4] Para cada número: strategy.calibrate(rawConsensusScore, context)
  │      └─ newEntry = { ...entry, calibratedProbability, calibration: {...} }
  │
  └─ [5] Construir output vía CalibrationResultFactory
         └─ { numbers, metadata: { ...consensus, calibration: {...} } }
```

### 4.2 Estrategias — Interfaz

```js
class CalibrationStrategy {
  calibrate(rawScore, context) → { calibratedProbability, metadata }
  getMeta(overrides?)              → { name, strategyVersion, trainingDataset, trainedAt, ... }
}
```

Subclases deben implementar `calibrate()`. La clase base lanza `Error` si se
invoca `calibrate()` sin override.

`IdentityCalibration` implementa: `calibratedProbability = score` (null-safe:
null/undefined/NaN/Infinity → null, 0 y 1 preservados).

### 4.3 Registry

- `IdentityCalibration` pre-registrada al instanciar, **no se puede desregistrar**.
- `register(strategy)` valida que sea instancia de `CalibrationStrategy`.
- `unregister(name)` retorna `true/false`.
- `default()` retorna `IdentityCalibration`.

### 4.4 CalibrationVersion

Immutable value object con semántica de parseo:

```js
CalibrationVersion.parse('1.0.0')           // major=1, minor=0, patch=0, label=null
CalibrationVersion.parse('2.1.0-beta')      // label='beta'
CalibrationVersion.isCompatible(v1, v2)     // true si major coincide
```

### 4.5 Contratos

| Contrato | Definido en |
|----------|-------------|
| `CalibrationInput` | `contracts/CalibrationContract.js` (JSDoc) |
| `CalibrationOutput` | ibid |
| `CalibrationEntryInput` | per-number entry shape |
| `CalibrationEntryOutput` | per-number entry + calibration block |

---

## 5. Resultados de tests

### Test report

| Suite | Tests | Status |
|-------|-------|--------|
| IdentityCalibration | 8 | ✓ |
| Deep Clone / Immutability | 3 | ✓ |
| Determinism | 3 | ✓ |
| CalibrationStrategyRegistry | 9 | ✓ |
| CalibrationVersion | 9 | ✓ |
| CalibrationInputValidator (contracts) | 9 | ✓ |
| Serialization | 4 | ✓ |
| Error handling (strict/tolerant) | 5 | ✓ |
| Strategy interface contract | 5 | ✓ |
| ProbabilityCalibrator full pipeline | 5 | ✓ |
| **Total Phase 2.2 Part I** | **62** | **✓** |
| **Project total** | **464** | **✓** |

### Otras verificaciones

| Métrica | Valor |
|---------|-------|
| Lint (eslint) | 0 warnings |
| Build (vite) | 83 módulos, 385ms |
| Archivos fuente nuevos | 15 |
| Archivos de test nuevos | 1 |

---

## 6. API pública

```js
import {
  ProbabilityCalibrator,
  IdentityCalibration,
  CalibrationStrategyRegistry,
  CalibrationVersion,
  validateCalibrationInput,
} from './src/calibration/index.js';

// Uso por defecto (IdentityCalibration)
const calibrator = new ProbabilityCalibrator({ mode: 'tolerant' });
const consensusOutput = consensusEngine.compute(normalizedSignals);
const calibrated = calibrator.calibrate(consensusOutput);

// Con estrategia custom
const registry = new CalibrationStrategyRegistry();
registry.register(new MyCustomStrat());
const calibrator = new ProbabilityCalibrator({ registry });
const calibrated = calibrator.calibrate(consensusOutput, 'MyCustomStrat');
```

---

## 7. Próximos pasos (Part II)

1. Implementar estrategias de calibración reales:
   - `HistogramCalibration` — bucket-based
   - `IsotonicCalibration` — monotonic regression
   - `PlattScaling` — sigmoid fitting
   - `BetaCalibration` — beta distribution fit
2. Pipeline de entrenamiento: `historicalConsensusScores → fit → strategy`
3. Métricas de calibración: `ECE`, `MCE`, `Brier score`
4. Cross-validation y backtesting

---

## 8. Archivos producidos

| Archivo | Propósito |
|---------|-----------|
| `src/calibration/ProbabilityCalibrator.js` | Orquestador principal |
| `src/calibration/CalibrationStrategyRegistry.js` | Registry de estrategias |
| `src/calibration/CalibrationMetadata.js` | Metadata builder |
| `src/calibration/contracts/CalibrationContract.js` | Contratos tipo |
| `src/calibration/validators/CalibrationInputValidator.js` | Validador de entrada |
| `src/calibration/strategies/CalibrationStrategy.js` | Clase abstracta |
| `src/calibration/strategies/IdentityCalibration.js` | Estrategia baseline |
| `src/calibration/factories/CalibrationResultFactory.js` | Factory de output |
| `src/calibration/versioning/CalibrationVersion.js` | Versionado semántico |
| `src/calibration/index.js` | Barrel export |
| `tests/calibration/ProbabilityCalibrator.test.js` | 62 tests |
| `reports/calibration/PHASE_2_2_PART1_ARCHITECTURE.md` | Este reporte |

---

*Reporte generado: 2026-07-30T15:43:00-04:00*
