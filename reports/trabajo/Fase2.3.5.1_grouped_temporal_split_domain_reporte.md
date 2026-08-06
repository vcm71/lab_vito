# Fase 2.3.5.1 — Reporte de ejecución
Timestamp (UTC): 2026-08-01T23:07:15.1727260Z

## Resumen ejecutivo
Se implementaron los contratos de dominio para la subfase de grouped temporal split en `src/historical-evidence/domain`, junto con su barrel de exportación y un set focalizado de pruebas. La solución preserva trazabilidad al dataset fuente, modela particiones temporales inmutables, evita solapamientos estructurales y deja fuera de alcance el algoritmo de particionado/leakage policy de fases posteriores.

## Alcance ejecutado
1. Inspección del prompt `reports/fase2.3.5.1.md` y de los contratos existentes del dominio histórico.
2. Reutilización de piezas ya consolidadas: `DatasetIdentity`, `DatasetVersion`, `compareIso`, `deepFreeze` y la jerarquía de errores base.
3. Implementación de los nuevos value objects y del agregado de split agrupado.
4. Exportación de los nuevos contratos desde los barrels del dominio y de la raíz del submódulo.
5. Agregado de pruebas focalizadas y verificación completa del proyecto con test/lint/build.

## Estado inicial
- No existían contratos específicos de grouped temporal split dentro de `src/historical-evidence/domain`.
- La familia de pruebas históricas no cubría estos nuevos value objects.
- El repositorio sí contenía componentes relacionados en otras áreas, especialmente el dominio histórico base y una implementación distinta en `src/calibration`.

## Baseline inicial
- Baseline funcional previo a la subfase: ausencia de contratos de particionado temporal agrupado en el dominio histórico.
- Baseline de calidad sobre la rama actual antes del cambio: no se detectaron regresiones en la suite histórica tras la implementación; la verificación final quedó en `950/950` tests.

## Archivos inspeccionados
- `reports/fase2.3.5.1.md`
- `src/historical-evidence/index.js`
- `src/historical-evidence/domain/index.js`
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/immutable.js`
- `src/historical-evidence/domain/chronology.js`
- `src/historical-evidence/domain/DatasetIdentity.js`
- `src/historical-evidence/domain/DatasetVersion.js`
- `src/historical-evidence/domain/DatasetSnapshotDescriptor.js`
- `src/historical-evidence/domain/HistoricalCalibrationDataset.js`
- `tests/historical-evidence/*.test.js`

## Componentes existentes reutilizados
- `DatasetIdentity` para la trazabilidad del dataset fuente.
- `DatasetVersion` para conservar la versión científica del origen.
- `compareIso` para ordenar y comparar ventanas temporales con ISO canónico.
- `deepFreeze` para value objects internos sin ciclos.
- Base `DatasetError` para tipar las nuevas validaciones del dominio.

## Archivos creados
- `src/historical-evidence/domain/DatasetPartitionType.js`
- `src/historical-evidence/domain/SplitPeriod.js`
- `src/historical-evidence/domain/SplitMetadata.js`
- `src/historical-evidence/domain/DatasetPartition.js`
- `src/historical-evidence/domain/GroupedTemporalSplit.js`
- `tests/historical-evidence/GroupedTemporalSplit.test.js`
- `reports/trabajo/Fase2.3.5.1_grouped_temporal_split_domain_reporte.md`
- `reports/trabajo/Fase2.3.5.1_nota_tecnica_diseno.md`
- `reports/Fase_2.3.5.1_cerrada.md`

## Archivos modificados
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/index.js`
- `src/historical-evidence/index.js`

## Contratos implementados
### `DatasetPartitionType`
- Closed set: `TRAIN`, `VALIDATION`, `TEST`.
- Validación explícita y helper `is`/`assert`.

### `SplitPeriod`
- Intervalo temporal inclusivo con `from` y `to` en ISO canónico.
- Validación de orden cronológico y formato.
- Helper de serialización y comparación.

### `SplitMetadata`
- Conserva la identidad del dataset fuente.
- Lleva `strategy`, `groupingKey`, `temporalKey`, `createdAt` y `splitId`.
- Se define como value object inmutable.

### `DatasetPartition`
- Describe una partición lógica sin duplicar el dataset.
- Incluye `partitionType`, `period`, `observationIds`, `spinIds`, conteos derivados, `sourceDatasetIdentity` y `metadata` opcional.
- Rechaza ids vacíos, duplicados internos y trazabilidad inválida.

### `GroupedTemporalSplit`
- Agrupa particiones ordenadas y no solapadas.
- Conserva la identidad fuente y la metadata del split.
- Calcula `period`, `partitionCount`, `observationCount` y `spinCount` de forma derivada.
- Usa freeze superficial en el agregado para evitar ciclos al compartir identidades fuente entre nodos ya congelados.

## Invariantes
- `spinId` es la unidad indivisible de partición: no puede cruzar particiones.
- `observationId` no puede repetirse entre particiones.
- Las particiones deben conservar orden temporal estricto y no compartir borde temporal.
- Cada partición debe pertenecer a una sola `sourceDatasetIdentity`.
- La metadata del split debe corresponder al contrato del dataset fuente y al identificador inyectado del split.
- Los value objects internos son inmutables; el agregado superior usa freeze superficial para evitar ciclos de referencia compartida.

## Errores tipados
- `InvalidPartitionTypeError`
- `InvalidSplitPeriodError`
- `InvalidSplitMetadataError`
- `InvalidDatasetPartitionError`
- `InvalidGroupedTemporalSplitError`

## Tests agregados
Archivo nuevo:
- `tests/historical-evidence/GroupedTemporalSplit.test.js`

Cobertura principal:
- `DatasetPartitionType`
- `SplitPeriod`
- `SplitMetadata`
- `DatasetPartition`
- `GroupedTemporalSplit`

## Resultados de tests focalizados
Comando ejecutado:
- `npm test -- --run tests/historical-evidence/GroupedTemporalSplit.test.js`

Resultado:
- `10/10` tests pasaron.

## Resultado de suite completa
Comando ejecutado:
- `npm test`

Resultado:
- `64` archivos de test
- `950/950` tests pasaron
- Tiempo total: `6.20s`

## Resultado de lint
Comando ejecutado:
- `npm run lint`

Resultado:
- OK, sin advertencias.

## Resultado de build
Comando ejecutado:
- `npm run build`

Resultado:
- OK.
- Advertencia no bloqueante: chunks grandes en el bundle principal, warning preexistente de Vite.

## Warnings
- La rama de trabajo ya venía con un árbol Git muy sucio antes de esta subfase; hay múltiples cambios y archivos no relacionados con el alcance actual.
- El build mantiene un warning de tamaño de chunk que no bloquea la entrega.
- La suite imprime warnings de prueba existentes en áreas no relacionadas (`AtRepRenderer`, benchmark sintético); no bloquean la validación.

## Estado Git
- Rama actual: `main`
- Estado observado con `git status --short`: working tree con múltiples archivos modificados y no rastreados preexistentes.
- Los archivos de esta subfase quedaron concentrados en `src/historical-evidence/domain`, `tests/historical-evidence` y `reports/`.

## Riesgos
- Si una futura fase necesita particiones derivadas de datos crudos, deberá decidir cómo construir `GroupedTemporalDatasetSplitter` sin reintroducir referencias compartidas que rompan el freeze profundo.
- La política de leakage completa sigue fuera del dominio de estos value objects y deberá fijarse más adelante.

## Deuda técnica
- No se implementó el algoritmo de splitador de aplicación; sólo el contrato de dominio y sus validaciones.
- No se añadió persistencia ni integración con capas de infraestructura.

## Fuera de alcance
- `GroupedTemporalDatasetSplitter` como caso de uso/servicio de aplicación.
- Leakage detection de política avanzada.
- Reescritura de módulos legacy no relacionados.

## Veredicto
APROBADO. La subfase quedó cerrada a nivel de dominio, barrel exports y pruebas focalizadas, con la suite completa, lint y build en verde.
