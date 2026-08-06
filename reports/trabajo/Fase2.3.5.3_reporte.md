2026-08-01T23:44:15-04:00

# Fase 2.3.5.3 — Reporte de ejecución

## Objetivo
Implementar el detector de leakage para splits temporales agrupados, con reporte inmutable, findings tipados y clasificación explícita de evidencia válida, inválida o incompleta.

## Resultado
Se añadió el detector `DatasetSplitLeakageDetector` en la capa de aplicación y se modeló su salida con un reporte de dominio inmutable.

### Elementos incorporados
- `DatasetSplitLeakageDetector`
- `DATASET_SPLIT_VALIDATION_MODE` con modos `FULL` y `STRUCTURAL`
- `DatasetSplitLeakageStatus`
- `DatasetSplitLeakageSeverity`
- `DatasetSplitLeakageFindingType`
- `DatasetSplitLeakageFinding`
- `DatasetSplitLeakageReport`
- errores específicos para entrada inválida, modo no soportado y fallo de detección

### Comportamiento cubierto
- Verificación opcional de integridad del dataset fuente mediante `DatasetIntegrityVerifier`.
- Comparación de identidad científica y operativa entre `dataset.identity` y `split.sourceDatasetIdentity`.
- Validación de cobertura de `spinId` y `observationId` entre source y particiones.
- Detección de:
  - particiones duplicadas por tipo,
  - periodos temporales fuera de orden o solapados,
  - observaciones fuera del intervalo de la partición,
  - spins u observaciones inesperados,
  - duplicados de spin / observación entre particiones,
  - conflictos temporales por spin.
- Clasificación final del reporte en `VALID`, `INVALID` o `INCOMPLETE`.

## Archivos modificados
- `src/historical-evidence/application/DatasetSplitLeakageDetector.js`
- `src/historical-evidence/application/index.js`
- `src/historical-evidence/index.js`
- `src/historical-evidence/domain/DatasetSplitLeakageFinding.js`
- `src/historical-evidence/domain/DatasetSplitLeakageFindingType.js`
- `src/historical-evidence/domain/DatasetSplitLeakageReport.js`
- `src/historical-evidence/domain/DatasetSplitLeakageSeverity.js`
- `src/historical-evidence/domain/DatasetSplitLeakageStatus.js`
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/index.js`
- `tests/historical-evidence/DatasetSplitLeakageDetector.test.js`

## Verificación ejecutada
- `npx vitest run tests/historical-evidence/DatasetSplitLeakageDetector.test.js`
- `npm run test`
- `npm run lint`
- `npm run build`

### Resultado
- Tests: OK
- Lint: OK
- Build: OK
- Aviso no bloqueante en build: Vite informó un chunk mayor a 500 kB, sin impedir la compilación.

## Cierre
La fase quedó implementada y verificada con evidencia real de ejecución.
