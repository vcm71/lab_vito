# Fase 2.3.4.2 — Nota técnica de diseño

Fecha: 2026-08-01T15:17:43-04:00

## 1. Arquitectura encontrada

La capa de evidencia histórica ya tenía separadas tres piezas clave:

- `HistoricalCalibrationDataset` en `src/historical-evidence/domain/HistoricalCalibrationDataset.js`
- `DatasetIdentity` en `src/historical-evidence/domain/DatasetIdentity.js`
- `DatasetSnapshotDescriptor` en `src/historical-evidence/domain/DatasetSnapshotDescriptor.js`

La orquestación de ensamblado vive en la capa de aplicación:

- `DatasetBuilder` en `src/historical-evidence/application/DatasetBuilder.js`
- `DatasetSnapshotDescriptorFactory` en `src/historical-evidence/application/DatasetSnapshotDescriptorFactory.js`

La serialización canónica compartida ya existía en calibración:

- `canonicalSerialize`
- `canonicalHashSync`
- `canonicalHash`

ubicadas en `src/calibration/CanonicalHash.js` y reexportadas desde `src/calibration/index.js`.

## 2. Contrato real que quedó implementado

La fase formalizó dos niveles de proyección canónica:

### 2.1 Serialización canónica general

`canonicalSerialize(value)` ahora:

- serializa strings, booleanos, números finitos, null, arrays y objetos planos;
- ordena claves de objetos de forma determinista;
- detecta ciclos explícitamente;
- rechaza tipos no soportados con errores tipados;
- rechaza números no finitos con error tipado;
- no hace coerciones silenciosas de `undefined`, `function`, `symbol`, `bigint` ni huecos de array.

Errores tipados añadidos:

- `UnsupportedCanonicalTypeError`
- `InvalidCanonicalNumberError`
- `CircularCanonicalReferenceError`

### 2.2 Proyecciones canónicas del dominio histórico

Se añadió `src/historical-evidence/application/CanonicalDatasetSerializer.js` con estas APIs públicas:

- `serializeScientificDataset(dataset)`
- `serializeDatasetIdentity(identity)`
- `serializeDatasetManifest(manifest)`
- `serializeDatasetStatistics(statistics)`
- `serializeDatasetSnapshotDescriptor(descriptor)`

Y dos proyecciones reutilizables para mantener compatibilidad de hashes:

- `projectScientificDataset(dataset)`
- `projectObservation(observation)`

Estas proyecciones son explícitas y eliminan dependencia accidental de campos operativos.

## 3. Proyección científica del dataset

`serializeScientificDataset(dataset)` y `projectScientificDataset(dataset)` cubren solo:

- `schemaVersion`
- `observationSchemaVersion`
- `period`
- `observations`

La proyección de observaciones normaliza opcionales de forma explícita:

- `calibration.modelId` → string o `null`
- `calibration.modelHash` → string o `null`
- `metadata` → objeto o `null`

Esto evita que `undefined` llegue al serializador canónico y, al mismo tiempo, conserva el hash histórico que antes se obtenía por coerción implícita a `null`.

## 4. Proyección de identidad y descriptor

### 4.1 Identidad

`serializeDatasetIdentity(identity)` usa `datasetIdentityToJSON(identity)` y luego serializa canónicamente el resultado.

### 4.2 Descriptor

`serializeDatasetSnapshotDescriptor(descriptor)` proyecta:

- `identity`
- `createdAt`
- `period`
- `manifest`
- `statistics`
- `policies`
- `filters`
- `provenance`
- `lineage`
- `metadata`

y normaliza opcionales a `null` para conservar forma estable.

## 5. Dónde se aplica la proyección

### 5.1 Hash científico del dataset

`DatasetBuilder` ahora usa `projectScientificDataset(...)` antes de invocar el hash canónico. El hash de contenido sigue cubriendo únicamente el contenido científico, no los campos operativos.

### 5.2 Duplicados de observación

`DatasetBuilder` también usa `projectObservation(...)` al comparar observaciones con el mismo `observationId`, evitando que opcionales `undefined` provoquen errores de serialización durante la detección de duplicados.

## 6. Barriles públicos actualizados

Exports actualizados:

- `src/calibration/index.js`
  - expone `canonicalSerialize`, `canonicalHashSync`, `canonicalHash`
  - expone los errores tipados nuevos

- `src/historical-evidence/application/index.js`
  - expone los serializadores canónicos nuevos

- `src/historical-evidence/index.js`
  - reexporta los serializadores y mantiene el contrato de dominio/aplicación unificado

## 7. Estrategia de pruebas aplicada

Se agregaron pruebas de regresión y determinismo para:

- orden de claves estable en la serialización canónica;
- rechazo de `NaN` e `Infinity`;
- rechazo de ciclos;
- representación científica del dataset sin campos operativos;
- serialización de `DatasetIdentity` con `datasetVersion` normalizada a string;
- serialización de `DatasetSnapshotDescriptor` con campos opcionales normalizados;
- exportación desde los barrels públicos;
- compatibilidad del hash de dataset y la detección de duplicados.

Los tests focalizados y la suite completa quedaron verdes.

## 8. Resultado de compatibilidad

La refactorización no rompió los hashes existentes del dataset científico ni la detección de duplicados. El cambio principal fue convertir la semántica implícita previa en una proyección explícita y testeada.

## 9. Conclusión

La arquitectura ya tenía las piezas, pero faltaba formalizar el contrato canónico en dos capas:

1. serialización canónica general con errores tipados;
2. proyecciones de dominio histórico explícitas para contenido científico, identidad y snapshot.

Eso quedó implementado, exportado y verificado con la suite completa.