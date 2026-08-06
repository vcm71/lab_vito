2026-08-02T01:10:43-04:00
# Fase 2.3.5.5 — nota técnica de cierre

## Flujo científico consolidado
La cadena consolidada en `historical-evidence` queda así:
`HistoricalCalibrationDataset -> GroupedTemporalDatasetSplitter -> GroupedTemporalSplit -> DatasetSplitLeakageDetector -> DatasetSplitLeakageReport`.

Ese flujo separa claramente:
- construcción del dataset de evidencia,
- particionado temporal agrupado por spin,
- encapsulado inmutable del split,
- detección de leakage sobre la partición,
- reporte tipado y determinista de hallazgos.

## Responsabilidad de cada componente
- `HistoricalCalibrationDataset`: fuente científica de observaciones.
- `GroupedTemporalDatasetSplitter`: transforma el dataset fuente en un split temporal agrupado.
- `GroupedTemporalSplit`: contiene particiones y metadatos del split.
- `DatasetSplitLeakageDetector`: valida el split, distingue `STRUCTURAL` y `FULL`, y produce el estado de leakage.
- `DatasetSplitLeakageReport`: materializa la salida auditada de forma inmutable.

## spinId como unidad indivisible
`spinId` sigue siendo la unidad de agrupación indivisible. Las observaciones asociadas a un mismo spin deben permanecer juntas y no pueden repartirse entre particiones.

## Clave temporal
La clave científica auditada sigue siendo `predictionCreatedAt`. Esa referencia gobierna el corte temporal y el orden canónico cuando aplica el split.

## Orden canónico
El orden esperado se conserva en la ruta científica auditada:
`predictionCreatedAt -> spinId -> predictionId -> outcomeId -> observationId`.

## Periodos inclusivos
La política temporal continúa siendo inclusiva: `from <= timestamp <= to`. Esto impide ambigüedades en los bordes de los periodos.

## Configuración del splitter
La configuración del splitter permanece explícita y obligatoria. Los cortes `trainUntil` y, cuando aplica, `validationUntil`, delimitan la partición sin introducir valores generados internamente.

## Trazabilidad de fuente
El modo `FULL` conserva la trazabilidad de fuente al reenviar el `descriptor` al verificador de integridad cuando esa evidencia está disponible.

## Identidad científica y operativa
Se mantiene la separación entre identidad científica y operativa. `datasetId`, `datasetVersion`, `schemaVersion`, `observationSchemaVersion`, `contentHash` y `manifestHash` siguen funcionando como contratos, no como datos a recomputar de forma oportunista.

## Integridad FULL y validación STRUCTURAL
- `STRUCTURAL` valida la estructura y el particionado.
- `FULL` exige la evidencia completa y pasa el descriptor a `DatasetIntegrityVerifier`.

## Cobertura, findings y status
La cobertura actual demuestra el comportamiento esperado en los casos focalizados y de integración. Los findings permanecen ordenados de forma determinista y el status resultante es coherente con la evidencia observada.

## Determinismo
La auditoría estática no mostró fuentes problemáticas de aleatoriedad o reloj global dentro de `src/historical-evidence`. Los usos de ordenamiento y serialización observados forman parte de contratos deterministas.

## Inmutabilidad
Los contratos auditados continúan protegidos por congelación y por suites que ejercitan el comportamiento de mutación. No se encontró una vía nueva que obligue a otra capa de freezing.

## Límites de leakage
La fase 2.3.5.5 cierra el leakage de split y de integridad dentro del alcance de `historical-evidence`. No amplía el sistema hacia leakage de features, target leakage, preprocessing leakage ni otros dominios fuera del contrato actual.

## Riesgos residuales
- Warning de Vite por chunk grande en build.
- Working tree sucio heredado del repositorio.
- Ausencia de scripts de verificación arquitectónica en `package.json`.

## Qué queda habilitado para fases posteriores
Queda habilitado continuar con evolución controlada del flujo científico auditado, siempre preservando los contratos públicos, la inmutabilidad, el determinismo y la trazabilidad de descriptor.

## Qué sigue prohibido
Sigue prohibido introducir:
- aleatoriedad,
- reloj global,
- reparación automática,
- entrenamiento,
- promoción,
- persistencia,
- deserialización,
- cambios de hashes o schemas,
- dependencias inversas críticas,
- o un rediseño de API sin justificación crítica.

## Veredicto de cierre
El estado técnico de la subfase es PASS y la línea de trabajo queda lista para cierre formal.
