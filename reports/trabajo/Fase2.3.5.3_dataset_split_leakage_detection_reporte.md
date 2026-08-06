2026-08-01T23:44:15-04:00

# Fase 2.3.5.3 — Reporte de ejecución

## Objetivo
Implementar el detector de leakage para splits temporales agrupados, con reporte inmutable, findings tipados, validación de cobertura/tiempo/identidad y reutilización coherente del verificador de integridad del dataset fuente.

## Resultado
Se incorporó `DatasetSplitLeakageDetector` y su contrato de reporte `DatasetSplitLeakageReport` para analizar splits por estructura, identidad, cobertura temporal y consistencia científica.

### Alcance implementado
- Validación explícita de entrada para `dataset`, `split` y `mode`.
- Integración con `DatasetIntegrityVerifier` en modo `FULL`.
- Clasificación del reporte en estados `VALID`, `INVALID` e `INCOMPLETE`.
- Findings deterministas e inmutables para:
  - identidad fuente divergente,
  - drift operacional,
  - particiones inválidas,
  - periodos inválidos u ordenados incorrectamente,
  - solapamiento temporal,
  - duplicados de `spinId` y `observationId`,
  - observaciones y spins omitidos o inesperados,
  - observaciones fuera del periodo,
  - conflictos temporales por spin,
  - conteos inconsistentes,
  - evidencia de integridad incompleta o inválida.
- Estadísticas resumidas sobre cobertura, integridad y consistencia.
- Inmutabilidad explícita de reportes y findings.

### Archivos creados o ajustados
- `src/historical-evidence/domain/DatasetSplitLeakageStatus.js`
- `src/historical-evidence/domain/DatasetSplitLeakageSeverity.js`
- `src/historical-evidence/domain/DatasetSplitLeakageFindingType.js`
- `src/historical-evidence/domain/DatasetSplitLeakageFinding.js`
- `src/historical-evidence/domain/DatasetSplitLeakageReport.js`
- `src/historical-evidence/application/DatasetSplitLeakageDetector.js`
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/index.js`
- `src/historical-evidence/application/index.js`
- `src/historical-evidence/index.js`
- `tests/historical-evidence/DatasetSplitLeakageDetector.test.js`

## Verificación ejecutada
- `npx vitest run tests/historical-evidence/DatasetSplitLeakageDetector.test.js`
- `npx vitest run tests/historical-evidence/`
- `npm exec vitest run tests/calibration/CanonicalHash.test.js`
- `npm run test`
- `npm run lint`
- `npm run build`

### Resultado de verificación
- Tests: OK
- Lint: OK
- Build: OK

## Observaciones técnicas
- El detector reutiliza la identidad científica del dataset y no introduce reparación automática.
- El modo `FULL` usa el verificador de integridad inyectado antes de concluir cobertura.
- El reporte conserva findings y estadísticas profundamente inmutables.
- El resultado es determinista para las mismas entradas.

## Cierre
La fase quedó ejecutada y documentada en formato Markdown dentro de `reports/trabajo/`.
