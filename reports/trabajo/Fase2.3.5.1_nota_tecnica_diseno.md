# Fase 2.3.5.1 — Nota técnica de diseño
Timestamp (UTC): 2026-08-01T23:07:15.1727260Z

## Por qué `spinId` es la unidad indivisible
El dominio histórico trata el `spinId` como la unidad mínima de trazabilidad científica. Si un spin se reparte entre particiones distintas, el modelo pierde la posibilidad de auditar orden temporal, origen y no interferencia entre conjuntos. Por eso el contrato valida que un `spinId` no aparezca en más de una partición.

## Cómo se representa una partición
Una partición se modela con `DatasetPartition` como un value object plano e inmutable que contiene:
- `partitionType`: tipo cerrado (`TRAIN`, `VALIDATION`, `TEST`).
- `period`: ventana temporal inclusiva.
- `observationIds`: ids concretos de observaciones incluidas.
- `spinIds`: spins cubiertos por la partición.
- `observationCount` y `spinCount`: métricas derivadas.
- `sourceDatasetIdentity`: trazabilidad completa al origen.
- `metadata`: envoltorio opcional para notas o atributos no esenciales.

La partición no duplica observaciones ni manifiestos; sólo describe el corte lógico.

## Cómo se representan los periodos
`SplitPeriod` usa timestamps ISO canónicos con semántica inclusiva:
- `from`: inicio de la ventana.
- `to`: fin de la ventana.

El contrato valida que `from <= to` y que ambos valores sean timestamps ISO válidos. Esta forma es suficiente para comparar temporalmente sin introducir conversiones locales ni estados dependientes del reloj.

## Cómo se evita el solapamiento estructural
`GroupedTemporalSplit` valida tres niveles de no solapamiento:
1. `partitionType` no puede repetirse.
2. Los periodos deben ir en orden estricto y no compartir borde temporal.
3. `spinIds` y `observationIds` no pueden repetirse entre particiones.

Para comparar periodos se usa `compareIso`, preservando el orden canónico del dominio.

## Cómo se conserva la trazabilidad
La trazabilidad se conserva con `SplitMetadata` y con `sourceDatasetIdentity` en cada partición. El agregado `GroupedTemporalSplit` hereda la identidad fuente del metadata de split, de modo que el resultado completo sigue pudiéndose atribuir a un único dataset científico de origen.

## Cómo se diferencia identidad fuente e identidad derivada
- La identidad fuente es la del dataset original y debe llegar intacta.
- La identidad derivada es la del split, que añade `splitId`, `createdAt` y la estrategia aplicada.

La subfase no inventa una nueva identidad científica; sólo conserva la fuente y añade metadata del proceso.

## Cómo se preserva la inmutabilidad
Los value objects internos usan congelación profunda cuando no existen referencias compartidas.
En `GroupedTemporalSplit`, el agregado superior se congela de forma superficial porque comparte identidades fuente ya congeladas entre `metadata` y particiones. Esa decisión evita ciclos falsos en el freezer recursivo sin perder inmutabilidad práctica.

## Qué validaciones pertenecen al dominio
Pertenecen al dominio:
- tipo de partición válido;
- periodos ISO válidos y ordenados;
- ids no vacíos y sin duplicados;
- particiones no vacías;
- coherencia entre particiones y fuente;
- ausencia de solapamiento estructural.

## Qué validaciones quedan para `LeakageDetector`
Le corresponden más adelante las comprobaciones de fuga semántica y análisis entre conjuntos que no son estructurales, por ejemplo:
- compatibilidad de estrategia con métricas experimentales;
- reglas de leakage entre fuentes distintas;
- inspección de features o estados derivados que no caben en el value object.

## Qué decisiones quedan para `GroupedTemporalDatasetSplitter`
Faltan por decidir, en una fase posterior:
- cómo se construyen las particiones desde observaciones crudas;
- qué política exacta ordena train/validation/test;
- cómo se derivan heurísticas de tamaño o balance;
- si el splitter vive como servicio de aplicación o como orquestador de dominio.

## Conclusión técnica
La subfase deja cerrado el contrato del dominio: particiones temporales agrupadas, tipadas, trazables e inmutables. El algoritmo que produce esas particiones y la política de leakage quedan explícitamente fuera de alcance para no mezclar contrato con orquestación.
