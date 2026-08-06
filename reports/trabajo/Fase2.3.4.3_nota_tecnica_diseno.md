2026-08-01T00:00:00.000Z

# Fase 2.3.4.3 — Nota técnica de diseño

## Objetivo
Diseñar e implementar un verificador de integridad para el dominio de histórico/calibración que compare proyecciones canónicas, hashes, coherencia semántica y la inmutabilidad profunda de los artefactos expuestos por el pipeline.

## Baseline inspeccionado
Se reutilizan los contratos ya existentes del submódulo `historical-evidence`:
- `DatasetBuilder` para producir datasets válidos y ordenados canónicamente.
- `HistoricalCalibrationDataset` para derivar periodo, sort canónico y estructura científica.
- `DatasetIdentity` para comparar identidad, content hash y manifest hash.
- `DatasetSnapshotDescriptor` para validar la coherencia operativa del snapshot.
- `CanonicalDatasetSerializer` para proyectar y serializar artefactos sin inventar reglas nuevas.

## Arquitectura propuesta
Se introdujeron dos contratos nuevos:
- `DatasetIntegrityVerifier` en aplicación: orquesta la verificación por modo, normaliza opciones y emite un reporte inmutable.
- `DatasetIntegrityReport` en dominio: encapsula estado, checks, errores, warnings y resumen.

Además se añadieron:
- `DatasetIntegrityStatus` para el estado global del reporte.
- `IntegrityVerificationMode` para los modos SCIENTIFIC, OPERATIONAL y FULL.
- errores tipados de integridad para validar opciones de entrada y checks explícitos.

## Checks reutilizados / implementados
### SCIENTIFIC
- `CONTENT_HASH`
- `DATASET_SCHEMA`
- `OBSERVATION_SCHEMA`
- `CANONICAL_ORDER`
- `DUPLICATES`
- `CHRONOLOGY`
- `STATISTICS`
- `SCIENTIFIC_STRUCTURE`

### OPERATIONAL
- `MANIFEST_HASH`
- `DATASET_IDENTITY`
- `SNAPSHOT_DESCRIPTOR`

### FULL
- unión de SCIENTIFIC + OPERATIONAL + `IMMUTABILITY`

## Estrategia de verificación
1. Validar el input básico y el modo solicitado.
2. Elegir el subconjunto de checks permitido por el modo.
3. Ejecutar cada check de forma aislada, sin mutar el input.
4. Comparar:
   - hashes canónicos del dataset científico,
   - hashes del manifest,
   - versiones de esquema,
   - orden canónico de observaciones,
   - unicidad de observaciones,
   - chronology,
   - estadísticas derivadas,
   - coherencia identity/descriptor,
   - freeze profundo de los artefactos.
5. Consolidar un reporte final con estado `VALID`, `INVALID` o `INCOMPLETE`.

## Estrategia de pruebas
- caso feliz científico con dataset profundo e inmutable,
- corrupción de content hash, orden y estadísticas,
- validación completa con identity + descriptor,
- fallo por inmutabilidad cuando los objetos son mutables pero coherentes,
- drift de descriptor en campos compartidos,
- validación de opciones y check ids explícitos.

## Observación de implementación
El verificador se apoya en proyecciones canónicas y hashes del dominio existente; no introduce reglas de negocio nuevas para el cálculo científico, sino que audita el contrato ya producido por el builder y el descriptor.
