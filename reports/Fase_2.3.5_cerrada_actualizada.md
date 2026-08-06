2026-08-02T01:10:43-04:00
# Fase 2.3.5 cerrada

## Encabezado
- proyecto: Roulette Tracker / historical-evidence
- nombre anterior: Fase 2.3.5
- repositorio: /home/shared/lab_vito
- fecha: 2026-08-02T01:10:43-04:00
- estado: cerrada
- pipeline: green

## Resumen ejecutivo
La cadena de trabajo de la Fase 2.3.5 quedó cerrada con contratos de dominio, splitter determinista, detector de leakage, auditoría de integridad y hardening final documentados y verificados. La validación actual conserva determinismo, inmutabilidad, trazabilidad de descriptor y separación clara entre dominio y aplicación.

## Baseline final
- tests: 67 archivos, 963 tests, 0 fallos.
- archivos de test: 67.
- lint: OK.
- build: OK.
- warnings: chunk grande de Vite no bloqueante.

## Cadena consolidada
HistoricalCalibrationDataset
→ GroupedTemporalDatasetSplitter
→ GroupedTemporalSplit
→ DatasetSplitLeakageDetector
→ DatasetSplitLeakageReport

## Contratos implementados
- Contratos de dominio para partición temporal agrupada.
- Split determinista por `spinId` y `predictionCreatedAt`.
- Detector de leakage con reportes tipados.
- Integridad FULL con forwarding de descriptor.
- Exportación pública por barrels del submódulo.

## Estrategia de splitting
- `GROUPED_TEMPORAL`
- `groupingKey = spinId`
- `temporalKey = predictionCreatedAt`
- `trainUntil`
- `validationUntil` opcional
- soporta `TRAIN + TEST` y `TRAIN + VALIDATION + TEST`

## Invariantes
- `spinId` indivisible.
- `observationId` única.
- periodos no solapados.
- orden temporal correcto.
- particiones no vacías.
- cobertura consistente.
- identidad fuente coherente.
- determinismo.
- inmutabilidad.

## Leakage cubierto
- duplicados entre particiones
- solapamiento temporal
- orden
- cobertura
- identidad
- timestamps
- conteos
- grupos inesperados
- grupos omitidos

## Leakage no cubierto
- feature leakage
- target leakage en features
- preprocessing leakage
- hyperparameter leakage
- model-state leakage
- leakage operacional

## Archivos relevantes
- `/home/shared/lab_vito/src/historical-evidence/domain/index.js`
- `/home/shared/lab_vito/src/historical-evidence/application/index.js`
- `/home/shared/lab_vito/src/historical-evidence/index.js`
- `/home/shared/lab_vito/src/historical-evidence/application/GroupedTemporalDatasetSplitter.js`
- `/home/shared/lab_vito/src/historical-evidence/application/DatasetSplitLeakageDetector.js`
- `/home/shared/lab_vito/src/historical-evidence/application/DatasetIntegrityVerifier.js`
- `/home/shared/lab_vito/src/historical-evidence/domain/GroupedTemporalSplit.js`
- `/home/shared/lab_vito/src/historical-evidence/domain/DatasetPartition.js`
- `/home/shared/lab_vito/src/historical-evidence/domain/DatasetSplitLeakageReport.js`
- `/home/shared/lab_vito/tests/historical-evidence/GroupedTemporalSplit.test.js`
- `/home/shared/lab_vito/tests/historical-evidence/GroupedTemporalDatasetSplitter.test.js`
- `/home/shared/lab_vito/tests/historical-evidence/DatasetSplitLeakageDetector.test.js`
- `/home/shared/lab_vito/tests/historical-evidence/GroupedTemporalSplitIntegration.test.js`
- `/home/shared/lab_vito/reports/trabajo/Fase2.3.5.5_grouped_temporal_splitting_hardening_closure_reporte.md`
- `/home/shared/lab_vito/reports/trabajo/Fase2.3.5.5_nota_tecnica_cierre.md`
- `/home/shared/lab_vito/reports/Fase_2.3.5.5_cerrada.md`

## Estado Git
- Working tree sucio preexistente.
- Rama actual: `main`.
- No se alteró la base del repositorio.

## Decisiones que no deben revertirse
- Mantener el split agrupado determinista por `spinId`.
- Mantener `predictionCreatedAt` como clave temporal.
- Mantener el forwarding del descriptor en `FULL`.
- Mantener inmutabilidad de reportes y splits.
- Mantener separación domain / application / infrastructure.

## Fuera de alcance
- entrenamiento
- métricas
- bootstrap
- selección
- promoción
- persistencia
- exportadores
- deserialización
- migración
- UI
- captura productiva

## Próxima fase recomendada
La próxima fase debe seleccionarse revisando el roadmap real antes de implementar cualquier nuevo hito.

## Prompt de reanudación
Revisar el roadmap real y continuar solo con el siguiente hito autorizado, preservando los contratos de `historical-evidence`.

## Veredicto final
FASE 2.3.5: CERRADA
ESTADO TÉCNICO: PASS
PIPELINE: GREEN


## Resumen de la conversación de reanudación (ChatGPT)

Durante la revisión posterior al cierre de la Fase 2.3.5 se confirmó que:

- Se verificó el cierre completo de las subfases 2.3.5.1 a 2.3.5.5.
- Se confirmó el baseline consolidado:
  - 963 tests aprobados.
  - 67 archivos de prueba.
  - Lint OK.
  - Build OK.
  - Pipeline GREEN.
- Se revisó la arquitectura consolidada del pipeline:
  - HistoricalCalibrationDataset
  - GroupedTemporalDatasetSplitter
  - GroupedTemporalSplit
  - DatasetSplitLeakageDetector
  - DatasetSplitLeakageReport
- Se confirmó que permanecen vigentes las decisiones arquitectónicas críticas:
  - particionado determinista por `spinId`;
  - `predictionCreatedAt` como clave temporal;
  - forwarding del descriptor en validación `FULL`;
  - separación entre dominio, aplicación e infraestructura;
  - determinismo e inmutabilidad del pipeline.
- Se revisó el documento de cierre global y se concluyó que **no autoriza automáticamente una nueva fase funcional**.
- La siguiente etapa del proyecto debe determinarse revisando el **roadmap maestro** del repositorio y no mediante una secuencia asumida.
- Antes de generar nuevos prompts para Hermes se acordó identificar el siguiente hito autorizado por dicho roadmap para mantener la coherencia arquitectónica y documental del proyecto.

### Estado al finalizar esta sesión

- Fase 2.3.5: **CERRADA**.
- Estado técnico: **PASS**.
- Pipeline: **GREEN**.
- Próxima acción: localizar y revisar el roadmap maestro del proyecto para determinar el siguiente hito autorizado antes de iniciar una nueva fase.
