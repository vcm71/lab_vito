2026-08-01T23:31:35Z

# Fase 2.3.5.2 — Reporte de ejecución

## Objetivo
Implementar el splitter temporal agrupado para historical-evidence con contrato explícito de configuración, validación de integridad y preservación de trazabilidad sobre la identidad del dataset origen.

## Resultado
Se incorporó el servicio de aplicación `GroupedTemporalDatasetSplitter` y su contrato de configuración `createGroupedTemporalSplitConfiguration`.

### Alcance implementado
- Validación explícita de configuración con:
  - `sourceDatasetIdentity`
  - `trainUntil`
  - `validationUntil` opcional
- Validación de integridad del dataset antes del split.
- Agrupación determinística por `spinId`.
- Orden canónico de observaciones por timestamp y claves científicas existentes.
- Construcción de particiones `TRAIN`, `VALIDATION` y `TEST` con periodos inclusivos derivados de timestamps reales.
- Rechazo de:
  - configuración inválida,
  - grupos con timestamps ambiguos,
  - particiones vacías,
  - spin groups sin asignación válida.

### Archivos añadidos o ajustados
- `src/historical-evidence/application/GroupedTemporalSplitConfiguration.js`
- `src/historical-evidence/application/GroupedTemporalDatasetSplitter.js`
- `src/historical-evidence/application/index.js`
- `src/historical-evidence/index.js`
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/index.js`
- `tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js`

## Verificación ejecutada
- `npx vitest run tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js`
- `npm run test`
- `npm run lint`
- `npm run build`

### Resultado de verificación
- Tests: OK
- Lint: OK
- Build: OK
- Aviso de build: Vite informó chunks mayores de 500 kB, sin bloquear la compilación.

## Cierre
La fase quedó ejecutada y documentada en formato `.md` dentro de `reports/trabajo/`.
