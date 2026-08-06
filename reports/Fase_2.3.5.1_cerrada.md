# PUNTO DE CONTROL — FASE 2.3.5.1 CERRADA

- Timestamp (UTC): 2026-08-01T23:07:15.1727260Z
- Proyecto: Roulette Tracker Pro / historical-evidence domain
- Estado: CERRADA (APROBADO)
- Propósito: cerrar el contrato de grouped temporal split del dominio histórico con pruebas y documentación trazable.

---

## Resumen ejecutivo
Se añadieron los contratos de dominio para particiones temporales agrupadas: tipo de partición, periodo, metadata de split, partición lógica y agregado final `GroupedTemporalSplit`. La suite completa, lint y build quedaron en verde.

## Baseline inicial
- No existían contratos específicos de grouped temporal split en `src/historical-evidence/domain`.
- No había pruebas focalizadas para esta subfase.
- Existían piezas reutilizables del dominio histórico base y una implementación paralela en `src/calibration`.

## Baseline final
- Los nuevos value objects están implementados e exportados.
- Los contratos están cubiertos por pruebas.
- `npm test`, `npm run lint` y `npm run build` completaron correctamente.

## Arquitectura resultante
- Dominio histórico con value objects inmutables y trazables.
- Agregado superior de split con validación estructural.
- Continuidad con los barrels del dominio y de la raíz del submódulo.

## Contratos nuevos
- `DatasetPartitionType`
- `SplitPeriod`
- `SplitMetadata`
- `DatasetPartition`
- `GroupedTemporalSplit`

## Invariantes
- `spinId` es indivisible.
- No hay solapamiento temporal entre particiones.
- No se repiten `observationId` ni `spinId` entre particiones.
- Toda partición mantiene la identidad del dataset fuente.
- Los value objects permanecen inmutables.

## Errores
- `InvalidPartitionTypeError`
- `InvalidSplitPeriodError`
- `InvalidSplitMetadataError`
- `InvalidDatasetPartitionError`
- `InvalidGroupedTemporalSplitError`

## Tests
- Archivo nuevo: `tests/historical-evidence/GroupedTemporalSplit.test.js`
- Resultado focalizado: `10/10` tests pasaron.
- Resultado suite completa: `950/950` tests pasaron.
- Resultado lint: OK.
- Resultado build: OK.

## Decisiones vigentes
- La validación estructural pertenece al dominio.
- La política semántica de leakage queda para fases posteriores.
- El splitter de aplicación no se implementa en esta subfase.
- Para evitar ciclos de congelación, el agregado superior usa freeze superficial y reutiliza value objects ya congelados.

## Archivos creados
- `src/historical-evidence/domain/DatasetPartitionType.js`
- `src/historical-evidence/domain/SplitPeriod.js`
- `src/historical-evidence/domain/SplitMetadata.js`
- `src/historical-evidence/domain/DatasetPartition.js`
- `src/historical-evidence/domain/GroupedTemporalSplit.js`
- `tests/historical-evidence/GroupedTemporalSplit.test.js`
- `reports/trabajo/Fase2.3.5.1_grouped_temporal_split_domain_reporte.md`
- `reports/trabajo/Fase2.3.5.1_nota_tecnica_diseno.md`

## Archivos modificados
- `src/historical-evidence/domain/errors.js`
- `src/historical-evidence/domain/index.js`
- `src/historical-evidence/index.js`

## Estado Git
- Rama: `main`
- Working tree: ya estaba sucio con múltiples cambios preexistentes; esta subfase añadió archivos y modificaciones concentradas en `src/historical-evidence` y `reports/`.

## Warnings
- Warning de bundle grande en `vite build` preexistente y no bloqueante.
- Warnings de stderr en algunos tests existentes del proyecto, no relacionados con esta subfase.

## Fuera de alcance
- `GroupedTemporalDatasetSplitter` como caso de uso.
- Política avanzada de leakage.
- Limpieza de cambios legacy ajenos a la subfase.

## Cierre
La fase queda cerrada y el árbol de trabajo contiene el reporte, la nota técnica y este punto de control para continuar en una sesión nueva sin repetir auditoría.
