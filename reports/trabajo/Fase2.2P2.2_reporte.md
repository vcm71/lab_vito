# Fase 2.2 — Part 2.2: Datasets Históricos, Formalización, Auditoría, Hash, Bootstrap y Benchmark

**Fecha:** 2026-07-30 17:52 UTC
**Proyecto:** lab_vito (Roulette Tracker Pro)
**Rama:** `main`
**Baseline:** 598 tests → 634 tests (+36 nuevos)

---

## Veredicto

```
PIPELINE:   GREEN  (operacional, 634/634 tests, lint 0, build OK)
PRODUCTION: NOT_READY — INSUFFICIENT_EVIDENCE
```

La tubería de calibración P2.2 está completamente operativa y probada. La migración a SHA-256, serialización canónica, split temporal agrupado, bootstrap pareado y detector de leakage grupal están integrados. **Sin embargo, la ausencia de datasets históricos reales significa que NINGUNA estrategia puede ser promovida a producción.** La tubería está lista para ingerir datos reales cuando estén disponibles.

---

## Resumen de las 12 Tareas

### T1 — Inspección del repositorio ✅
- Estado de Git: branch `main`, trabajo sin commit.
- 42 archivos de test, 634 tests totales.

### T2 — Localización de datasets históricos ✅
- **No existen datasets históricos reales.**
- No hay directorio `data/`, ni archivos `.json`/`.csv` con datos de sesiones.
- Búsqueda exhaustiva con `find`, `search_files` por `dataset`, `training`, `session`, `observedOutcome`.
- **Conclusión definitiva:** sin datos reales, no se puede hacer model selection basado en evidencia.

### T3 — Formalización semántica ✅
- **Target:** `rawConsensusScore` (probabilidad cruda del consenso, valor continuo [0,1]).
- **Unidad de observación:** `spinId` (evento individual canónico).
- **Agrupador:** `sessionId` (para splits temporales).
- **Outcome observado:** `observedOutcome` presente en el código de `ConsensusEngine.js` pero NUNCA producido por la app real (es un campo previsto, no usado).

### T4 — Auditoría BetaCalibration + PlattScaling ✅
- **BetaCalibration:** `lgamma` definido localmente (Stirling approx), método de momentos con alpha/beta ≥ 0.5. Función Beta PDF correcta. Riesgo de underflow para parámetros extremos.
- **PlattScaling:** Regresión logística con lr=0.1, 1000 epochs fijos. Sin early stopping, sin regularización. Matemática correcta.
- **Veredicto:** Ambos PASS — sin bugs, matemáticamente correctos. Empíricamente no validados (falta datos reales).

### T5 — Migración SHA-256 ✅
- `CalibrationModel.computeHash()` migrado de djb2 (no-criptográfico) a SHA-256 (`node:crypto.createHash`).
- djb2: `mdl_19704256` (8-16 hex chars, colisionable)
- SHA-256: `e8a1c07b...` (64 hex chars, resistente a colisiones)
- Archivo: `src/calibration/CalibrationModel.js`
- Test: `tests/calibration/CalibrationModelHash.test.js` (6 tests)

### T6 — Serialización canónica ✅
- Módulo: `src/calibration/CanonicalHash.js`
- `canonicalSerialize(obj)`: JSON con claves ordenadas, NaN→null, Infinity→null.
- `canonicalHashSync(obj)`: SHA-256 del payload canónico serializado.
- `canonicalHash(obj)`: versión async con SubtleCrypto.
- Test: `tests/calibration/CanonicalHash.test.js` (7 tests)

### T7 — Split temporal agrupado ✅
- Módulo: `src/calibration/GroupedTemporalSplit.js`
- `groupedTemporalSplit()`: particiona dataset por grupos, asegurando que todos los registros de un mismo grupo van al mismo split.
- Grupos ordenados por timestamp, splits como partición temporal de grupos.
- `groupField` configurable (por defecto: `groupId`).
- Test: `tests/calibration/GroupedTemporalSplit.test.js` (4 tests)

### T8 — Bootstrap pareado ✅
- Módulo: `src/calibration/PairedBootstrap.js`
- `pairedBootstrap()`: resampleo pareado con B réplicas (default 1000).
- Veredicto two-sided: cuenta tanto candidate-wins como baseline-wins.
- Salida: confidence intervals, win rates, verdict (CANDIDATE_BETTER / BASELINE_BETTER / INCONCLUSIVE).
- Test: `tests/calibration/PairedBootstrap.test.js` (5 tests)

### T9 — Benchmark sintético ✅
- Resultados del benchmark sobre datos sintéticos generan INSUFFICIENT_EVIDENCE.
- Estrategias evaluadas: Identity, Histogram, Isotonic, Platt, Beta.
- Todas completan sin errores.
- Test de integración: `tests/calibration/P2_2_Benchmark.test.js` (8 tests)

### T10 — Leaderboard + PromotionPolicy ✅
- `ModelLeaderboard`: ranking con normalización, pesos configurables.
- `PromotionPolicy`: evaluación multi-criterio (métricas, datasets, leakage).
- Advertencia: promoción sobre datos sintéticos = INSUFFICIENT_EVIDENCE.

### T11 — Tests nuevos ✅  
- 36 tests nuevos en 6 archivos.
- Total: 634 tests (100% pass rate).

### T12 — Suite completa ✅
```
npm test:   634 passed, 0 failed
npm run lint: 0 warnings, 0 errors
npm run build: OK
```

---

## Archivos modificados

### Nuevos módulos
- `src/calibration/CanonicalHash.js` — SHA-256 + serialización canónica
- `src/calibration/GroupedTemporalSplit.js` — Split temporal por grupos
- `src/calibration/PairedBootstrap.js` — Bootstrap pareado con veredicto two-sided

### Módulos modificados
- `src/calibration/CalibrationModel.js` — djb2 → SHA-256
- `src/calibration/CalibrationLeakageDetector.js` — método `checkByGroups`
- `src/calibration/SyntheticCalibrationDatasetFactory.js` — campos de grupo (`wheelVersion`, `configurationVersion`, `__groupId`)
- `src/calibration/index.js` — barrel exports actualizados

### Tests nuevos
- `tests/calibration/CanonicalHash.test.js` (7 tests)
- `tests/calibration/GroupedTemporalSplit.test.js` (4 tests)
- `tests/calibration/PairedBootstrap.test.js` (5 tests)
- `tests/calibration/LeakageDetectorGroup.test.js` (5 tests)
- `tests/calibration/CalibrationModelHash.test.js` (6 tests)
- `tests/calibration/P2_2_Benchmark.test.js` (8 tests)

---

## Recomendaciones

1. **Recolectar datos reales:** La app debe loggear pares `(rawConsensusScore, observedOutcome)` en producción para alimentar el pipeline de calibración.

2. **Priorizar `observedOutcome`:** El campo existe en `ConsensusEngine.js` pero no se persiste. Implementar persistencia de spin outcomes con verificación de número real sorteado.

3. **No promover estrategias sin datos reales:** Cualquier estrategia que pase benchmarks sintéticos debe tratarse como NO VALIDADA hasta que haya evidencia empírica.

4. **Warning en pipeline:** El flag `INSUFFICIENT_EVIDENCE` está documentado en `tests/calibration/P2_2_Benchmark.test.js` como `EVIDENCE_FLAG` exportado para que cualquier consumidor del pipeline pueda verificar antes de usar resultados.

---

## Timestamp

**Generado:** 2026-07-30 17:52 UTC
**Agente:** Hermes Agent (deepseek-v4-pro)
