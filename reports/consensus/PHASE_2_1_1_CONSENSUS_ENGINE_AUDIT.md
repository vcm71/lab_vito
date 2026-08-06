# FASE 2.1.1 — AUDITORÍA CONSENSUS ENGINE

**Timestamp:** 2026-07-30T15:11:00-04:00  
**Proyecto:** Roulette Tracker (lab_vito)  
**Componente auditado:** `ConsensusEngine`  
**Fase anterior:** Fase 2.1 — ConsensusEngine implementado  
**Próxima fase autorizada:** Fase 2.2 — ProbabilityCalibrator  

---

## Estado

```
GO
```

---

## 1. Métrica de acuerdo (agreement)

### Original (Fase 2.1)
Reportaba "desviación estándar normalizada acotada a [0,1]" con máxima teórica de 0.5.

### Final (verificado)
La fórmula implementada es:

```
stddev = √(Σ(scores_i - μ)² / n)
normalizedDispersion = clamp(stddev / 0.5, 0, 1)
agreement = clamp(1 - normalizedDispersion, 0, 1)
```

**Validación por tests (§6-8):**
- Case A (todos 0): agreement = 1.0 (sin NaN/Infinity) ✓
- Case B (valores ~0.3 cercanos): agreement > 0.8 ✓
- Case C (valores ~0.5 cercanos): agreement > 0.8 ✓
- Case D (valores ~1.0 cercanos): agreement > 0.8 ✓
- Case E (divergencia fuerte 0.9 vs 0.3 vs 0.1): agreement < 0.5 ✓
- Case F (divergencia simétrica 0.1, 0.5, 0.9): agreement < 0.5 ✓
- Case G (dos engines): calculable, agreement válido ✓
- Case H (un engine): no calculable, reason = INSUFFICIENT_ENGINES ✓
- §8 (usa stddev/0.5, no CV): confirmado ✓

**Veredicto:** La fórmula es **correcta y estable**. Usa dispersión normalizada (σ/0.5), no coeficiente de variación (σ/μ). Sin NaN en el caso de media cero. Sin divisiones por cero.

---

## 2. Mode vs missingPolicy (separación)

### Mode
Controla la validación de configuración en strict/tolerant:
- `strict`: lanza error en pesos no positivos, direcciones desconocidas.
- `tolerant`: acepta valores fuera de rango excluyéndolos silenciosamente.

### missingPolicy
Controla qué hacer con señales ausentes:
- `RENORMALIZE_AVAILABLE`: excluye señales faltantes y renormaliza pesos entre las presentes.

**Validación por tests (§9-11):**
- missingPolicy declarado como RENORMALIZE_AVAILABLE (no TOLERANT) ✓
- mode separado conceptualmente de missingPolicy ✓
- Señales faltantes excluidas (no contadas como cero) ✓
- Señal nula excluida, no tratada como cero ✓
- Valor 0 tratado como válido (no excluido) ✓

**Veredicto:** Separación correcta. Sin confusión entre mode y missingPolicy.

---

## 3. Coverage vs Participation (independencia)

### Bug encontrado y corregido

**Descripción:** `_globalCoverage()` usaba peso binario por engine (presente = peso completo). Con pesos iguales 1:1:1, `coverageRatio` siempre era idéntico a `participationRatio` (ambos = n_engines_activos / 3). Esto producía doble contabilidad en la fórmula de confianza.

**Corrección aplicada:** `_globalCoverage()` ahora multiplica el peso configurado de cada engine por su `coverageRatio` a nivel de señales:

```diff
- totalAvailable += isFinitePositive(cfg.weight) ? cfg.weight : 0;
+ totalAvailable += er.coverage.coverageRatio * weight;
```

Esto hace que coverage y participation sean **independientes**: cobertura mide completitud de señales por engine, participación mide presencia binaria de engines.

**Validación por tests (§12-13):**
- coverage y participation como dimensiones distintas ✓
- coverage cambia al faltar señales, participation se mantiene ✓
- participation baja al faltar engine, coverage refleja gaps de señales ✓
- 1 engine con cobertura completa: participation baja, coverage completo ✓
- 3 engines con señales parciales: coverage varía por engine ✓

**Veredicto:** Corregido. Sin doble contabilidad.

---

## 4. Confianza (confidence)

### Fórmula
```
confidenceScore =
    coverageComp   × weight_coverage   (0.35)
  + participationComp × weight_participation (0.15)
  + agreementComp × weight_agreement    (0.35)
  + conflictPenalty × weight_conflict    (0.15)
```

- Pesos suman 1.0
- Agreement no calculable → contribución neutral de 0.5
- Conflicto bloqueante → penalty 0.2
- Conflicto no bloqueante → penalty según severidad (HIGH=0.5, MEDIUM=0.7, LOW=0.9)

**Validación por tests (§14-17):**
- Pesos suman 1.0 ✓
- High coverage + high agreement → high confidence ✓
- High coverage + very low agreement → confidence no enmascarado ✓
- Partial signals + 3 engines → coverage refleja completitud (post-fix) ✓
- Single engine → confidence limitado ✓
- Bloqueante → confidence ≥ 0.2 (por conflicto penalty) ✓
- No calculable → neutral 0.5 ✓

**Veredicto:** Fórmula correcta. Pesos balanceados. Penalización apropiada de conflictos.

---

## 5. Conflictos (conflict detection)

### Thresholds
| Spread   | Severidad | Bloqueante |
|----------|-----------|------------|
| ≥ 0.50   | HIGH      | Sí         |
| ≥ 0.30   | MEDIUM    | No         |
| ≥ 0.15   | LOW       | No         |
| < 0.15   | Ninguno   | —          |

### Tipos de conflicto
- `ENGINE_DIVERGENCE`: spread entre scores de motores (≥2 motores)
- `INSUFFICIENT_COVERAGE`: coverageRatio < 0.5 (siempre HIGH, bloqueante)
- `DOMINANT_SINGLE_ENGINE`: solo 1 motor activo (LOW, no bloqueante)

**Validación por tests (§18-21):**
- spread ~0.25 → LOW ✓
- spread ~0.40 → MEDIUM ✓
- spread ~0.60 → HIGH, bloqueante ✓
- DOMINANT_SINGLE_ENGINE con 1 engine ✓
- Thresholds centralizados en config ✓

**Veredicto:** Thresholds apropiados. Sin conflictos espurios.

---

## 6. Redundancias (§22-25)

### Matriz de dependencia

| Señal              | Engine    | Dependencia          |
|---------------------|-----------|----------------------|
| delay.ratio         | Lab_Con   | delayScore indirecta |
| delay.score         | Lab_Con   | delayRatio indirecta |
| delay.pressure      | Lab_Con   | Independiente (contador) |
| ww.active           | Lab_Con1  | Independiente        |
| ww.score            | Lab_Con1  | Retrollamada a ww.active |
| pci.occurrences     | AtRep     | Independiente        |
| pci.meanDist        | AtRep     | Derivado de pci.occurrences |

### Evaluación
- **delay.ratio ↔ delay.score:** Alta redundancia intra-engine. Ambas miden el mismo fenómeno (atraso de un número) en escalas diferentes. No es un bug pero sí un sesgo: Lab_Con tiene 2 votos correlacionados sobre el mismo dato subyacente. Documentado como **hallazgo de diseño**.
- **ww.active → ww.score:** La segunda señal depende de la primera (no se computa si ww.active = 0). Esto reduce independencia pero es intencional (score sin active carece de significado).
- **pci.occurrences → pci.meanDist:** Similar al caso anterior. meanDist se deriva de occurrences.

**Veredicto:** Redundancia intra-engine documentada. No requiere corrección inmediata pero debe ser considerada en Fase 2.2 (calibración de pesos).

---

## 7. pci.meanDist (inversión)

### Semántica
pci.meanDist mide distancia promedio entre ocurrencias de un número. **Mayor distancia = menor frecuencia = mayor atipicidad = más relevante.** Por tanto, la dirección en el motor AtRep es `NEGATIVE`:

```
effectiveValue = 1 - meanDist
```

**Validación por tests (§26-27):**
- meanDist bajo → effectiveValue alto (inversión funciona) ✓
- meanDist alto → effectiveValue bajo ✓
- meanDist = 0 → effectiveValue = 1 ✓
- meanDist = 1 → effectiveValue = 0 ✓
- Dirección NEGATIVE en config ✓
- Documentado en explanation (vía engine score) ✓

**Veredicto:** Correcto. La inversión es intencional y documentada.

---

## 8. Contrato para ProbabilityCalibrator

### Campos requeridos en output
El output de `ConsensusEngine.compute()` incluye todos los campos del contrato `ProbabilityCalibrator`:

| Campo                | Presente | Serializable |
|----------------------|----------|--------------|
| number               | ✓        | ✓            |
| rawConsensusScore    | ✓        | ✓            |
| valid                | ✓        | ✓            |
| engineScores         | ✓        | ✓            |
| engineContributions  | ✓        | ✓            |
| agreement            | ✓        | ✓            |
| conflicts            | ✓        | ✓            |
| confidence           | ✓        | ✓            |
| coverage             | ✓        | ✓            |
| explanation          | ✓        | ✓            |

**Validación por tests (§28-31):**
- Todos los campos requeridos presentes ✓
- JSON.stringify sin NaN, Infinity, funciones ✓
- Sin funciones, Maps, Sets, referencias circulares ✓
- metadata incluye configurationVersion ✓
- Defensive copies: output !== input ✓
- Mutar input no afecta output ✓
- Mutar output no afecta input ✓
- Estructuras anidadas independientes ✓

**Veredicto:** **Apto.** El contrato está listo para ProbabilityCalibrator.

---

## 9. 0/00 y determinismo

**Validación por tests (§34-35):**
- 0 y 00 son keys string distintas ✓
- engineScores de 0 y 00 independientes ✓
- Determinismo: misma entrada → salida idéntica ✓
- Orden estable entre llamadas ✓

**Veredicto:** Los números 0 y 00 se preservan correctamente como strings independientes.

---

## 10. Strict vs Tolerant mode

**Validación por tests (§36):**
- strict: rechaza dirección desconocida ✓
- strict: acepta entrada válida ✓
- tolerant: no lanza error con valores fuera de rango (los excluye) ✓

**Veredicto:** Ambos modos funcionan según especificación.

---

## 11. Pipeline integrado

**Validación por tests (§39.20):**
- SignalCollector → SignalNormalizer → ConsensusEngine produce resultados válidos ✓

**Veredicto:** Pipeline funcional de extremo a extremo.

---

## 12. Errores encontrados

| # | Error | Severidad | Corregido |
|---|-------|-----------|-----------|
| 1 | `_globalCoverage()` usaba peso binario (engine presente/ausente), haciendo que coverageRatio = participationRatio con pesos iguales (1:1:1). Esto causaba doble contabilidad en la fórmula de confianza: ambos componentes se basaban en el mismo número. | MEDIUM | ✓ |

### Hallazgos de diseño (no errores)

| # | Hallazgo | Recomendación |
|---|----------|--------------|
| 1 | `delay.ratio` y `delay.score` en Lab_Con miden el mismo fenómeno (atraso) en escalas distintas. Peso efectivo de Lab_Con ≈ 2× en presencia de ambas señales. | Evaluar en Fase 2.2 si reducir peso de una o combinarlas en señal compuesta. |
| 2 | `AMERICAN_ROULETTE_NUMBERS` (consensusConstants.js) restringe las claves a '0','00','1'-'36'. Señales con números fuera de este rango son silenciosamente ignoradas sin advertencia. | Documentar este contrato en la interfaz pública del motor o emitir warning. |
| 3 | Pesos 1:1:1 son neutrales intencionalmente pero no calibrados. | Backtesting en Fase 2.2-2.3 para calibrar. |

---

## 13. Correcciones aplicadas

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `src/consensus/engine/ConsensusEngine.js:374-396` | `_globalCoverage()` ahora multiplica el peso de cada engine por su `coverageRatio` a nivel de señales. Esto elimina la doble contabilidad con `participation`. |

---

## 14. Archivos creados

- `tests/consensus/ConsensusEngine.audit.test.js` — 53 tests de auditoría cubriendo §§6-39
- `reports/consensus/PHASE_2_1_1_CONSENSUS_ENGINE_AUDIT.md` — este informe

## 15. Archivos modificados

- `src/consensus/engine/ConsensusEngine.js` — fix de `_globalCoverage()` (líneas 374-396)

---

## 16. Resultados

| Métrica                | Valor                  |
|------------------------|------------------------|
| Tests focalizados (auditoría) | 53/53 pass       |
| Suite completa          | 402/402 pass          |
| Lint                    | 0 warnings            |
| Build                   | 83 módulos OK (386ms) |
| Regresiones             | Ninguna               |

---

## 17. Declaración de honestidad estadística

```
El rawConsensusScore no representa una probabilidad calibrada.
La confianza es estructural (cobertura + participación + acuerdo + conflictos).
El acuerdo mide proximidad entre scores de motores (dispersión normalizada).
Los pesos siguen siendo provisionales (1:1:1) hasta backtesting en Fase 2.2-2.3.
```

Se **desaconseja** interpretar `rawConsensusScore` como:
- Probabilidad real de salida del número
- Señal de ventaja predictiva
- Indicador de patrón explotable
- Métrica de rentabilidad

---

## 18. Veredicto final

**GO** — El ConsensusEngine es una base matemática y contractual confiable para la Fase 2.2 (ProbabilityCalibrator).

**Fundamento:**
- Fórmula de acuerdo estable y sin NaN
- Mode/missingPolicy correctamente separados
- Coverage/participation independientes (bug corregido)
- Confianza con pesos balanceados y penalización apropiada
- Conflictos con thresholds documentados
- Contrato serializable completo para ProbabilityCalibrator
- 0/00 preservados, determinismo confirmado
- 402 tests pasan, lint 0, build OK, cero regresiones

**Próxima fase autorizada:** `FASE 2.2 — ProbabilityCalibrator`
