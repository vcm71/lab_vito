2026-08-01T20:33:25Z

# Fase 2.3.4.4 — Nota técnica de diseño

## Objetivo
Diseñar e implementar la capa de comparación de datasets históricos para distinguir equivalencia científica, equivalencia operativa, evolución compatible, divergencia e incompatibilidad sin inventar contratos nuevos fuera de `historical-evidence`.

## Baseline inspeccionado
Se reutilizan los contratos existentes del submódulo `historical-evidence`:
- `DatasetBuilder` para construir datasets canónicos y profundos inmutables.
- `HistoricalCalibrationDataset` como snapshot científico fuente de verdad.
- `DatasetIdentity` para identidad operativa, `datasetId`, `contentHash` y `manifestHash`.
- `DatasetSnapshotDescriptor` para la huella operativa del snapshot.
- `DatasetVersion` y `DatasetVersionPolicy` para compatibilidad/versionado.
- `CanonicalDatasetSerializer` como proyección canónica para confirmar contenido científico.
- `DatasetIntegrityVerifier` y `DatasetIntegrityReport` para validar cada lado antes de clasificar.

## Arquitectura propuesta
Se agregan cuatro contratos nuevos de comparación:
- `DatasetComparator` en aplicación: orquesta la comparación entre dos lados, valida opciones, llama al verificador de integridad y construye el reporte final.
- `DatasetComparisonReport` en dominio: value object inmutable con clasificación, diferencias, advertencias, compatibilidad y resumen.
- `DatasetComparisonClassification` en dominio: enum inmutable con las clasificaciones globales.
- `DatasetDifference` en dominio: value object inmutable para cada diferencia puntual.

Además se añade:
- `DatasetComparisonMode` en aplicación: `SCIENTIFIC`, `OPERATIONAL`, `FULL`.
- `DatasetDifferenceCategory` para categorizar diferencias canónicas.
- `DatasetDifferenceSeverity` para graduar impacto científico/operativo si hace falta separarlo del tipo de diferencia.

## Contrato funcional
La API pública conceptual seguirá la forma de objeto explícito:
```javascript
compare({
  left: { dataset, identity, descriptor },
  right: { dataset, identity, descriptor },
  options
})
```

Se evitarán parámetros posicionales excesivos y booleanos ambiguos. La comparación mínima aceptada también podrá exponer un atajo `compareDatasets(leftDataset, rightDataset, options)` solo si no rompe claridad semántica.

## Clasificación global
Se implementan las clasificaciones documentadas por la fase:
- `EXACT_MATCH`
- `SCIENTIFICALLY_EQUIVALENT`
- `OPERATIONALLY_EQUIVALENT`
- `COMPATIBLE_EVOLUTION`
- `DIVERGENT`
- `INCOMPATIBLE`
- `INVALID_INPUT`
- `INDETERMINATE`

La precedencia quedará fijada de forma determinista para que el mismo par de entradas produzca siempre la misma clasificación y el mismo orden de diferencias.

## Categorías de diferencia
Se priorizan las diferencias previstas por el prompt:
- integridad
- schema
- version
- content hash
- manifest hash
- periodo
- observations
- statistics
- identity
- descriptor
- policies
- filters
- provenance
- lineage
- metadata

En observaciones se soportará comparación por identidad lógica estable, no por posición del array.

## Estrategia de comparación
### 1. Validación de entrada
- Validar estructura de `left`, `right` y `options`.
- Rechazar inputs mal formados con error tipado.
- Normalizar `mode` y `requireValidIntegrity`.

### 2. Integridad previa
- Reutilizar `DatasetIntegrityVerifier` para ambos lados.
- En `SCIENTIFIC`, verificar integridad científica.
- En `OPERATIONAL`, verificar integridad operativa.
- En `FULL`, verificar ambos lados en modo completo.
- Si un lado no pasa integridad y `requireValidIntegrity = true`, el reporte no declarará equivalencia científica definitiva.

### 3. Comparación científica
- Confirmar `contentHash`.
- Confirmar serialización canónica vía `CanonicalDatasetSerializer`.
- Comparar schema, periodo, observaciones, estadísticas y compatibilidad científica.
- Detectar extensiones compatibles y asimetrías izquierda/derecha.

### 4. Comparación operativa
- Comparar `datasetId`, `manifestHash`, identidad, descriptor, versión, políticas, filtros, procedencia y metadata.
- Mantener separación estricta entre semántica científica y operativa.

### 5. Reporte determinista
- Orden canónico de diferencias.
- Sin timestamps automáticos, IDs aleatorios ni dependencias de locale.
- Resumen estable y serializable.

## Estrategia de pruebas
Se cubrirán, como mínimo:
- caso exacto con dos datasets idénticos;
- equivalencia científica con diferencias operativas permitidas;
- evolución compatible izquierda→derecha y derecha→izquierda;
- divergencia científica con observaciones distintas;
- incompatibilidad por schema/version/integridad;
- reporte `INDETERMINATE` cuando falte información suficiente;
- determinismo de `toJSON()` y orden de diferencias;
- no mutación de inputs.

## Resultado esperado
El comparador debe producir un objeto de reporte inmutable, expresivo y determinista, reutilizando el pipeline histórico existente en vez de duplicarlo.
