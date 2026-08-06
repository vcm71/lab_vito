2026-08-03T03:12:10Z
Fase 6.B.2 — Laboratory Contracts & Registry Foundation

Estado: auditado / infraestructura base identificada, sin cambios funcionales aplicados en esta ejecución
Alcance: revisión de la base actual para formalizar el Laboratorio sin alterar comportamiento existente.

Resumen ejecutivo
- La Fase 6.B.1 dejó claro que el Laboratorio ya existe como composición de Lab_Con, Lab_Con1, AtRep, capa de consenso y Historical Evidence.
- En el estado actual del repositorio no existe aún una capa dedicada llamada LaboratoryRegistry/LaboratoryRunner/LaboratoryContext/LaboratoryModule.
- Sí existen primitivas análogas y reutilizables: `EngineRegistry`, `CalibrationContext`, `CalibrationStrategyRegistry`, `MetricRegistry`, además de contratos y builders de calibración e infraestructura de Historical Evidence.
- La compatibilidad con B.1 permanece intacta: no se modificó UI, motores, adaptadores, SignalCollector ni contratos públicos.
- Las validaciones de proyecto siguen en verde: tests, lint y build.

1) Contratos solicitados vs. estado real
- Contratos solicitados por el prompt: `LaboratoryModule`, `LaboratoryDataset`, `LaboratoryRun`, `LaboratoryResult`, `LaboratoryMetric`, `LaboratoryCapability`, `LaboratoryContext`.
- Estado real observado: no hay tipos/clases con nomenclatura Laboratory en `src/`.
- La base más cercana en el código actual está en `src/calibration/contracts/CalibrationContract.js` (contratos JSDoc de calibración) y en `src/calibration/CalibrationDataset.js`, `src/calibration/CalibrationModel.js`, `src/calibration/CalibrationContext.js`.

Lectura funcional:
- El proyecto ya maneja el patrón de “contrato primero” en otras áreas, pero todavía no lo materializa como una capa Laboratorio formal.
- La infraestructura solicitada por la fase B.2 debe, si se implementa, nacer como capa nueva y no como rediseño del laboratorio existente.

2) Registry: base existente y gap específico
- `src/core/EngineRegistry.js:6-60` ya provee un registro genérico de motores con `register`, `get`, `getAll`, `has`, `unregister` y `clear`.
- `src/calibration/MetricRegistry.js:49-94` ofrece un registry de métricas con catálogo pre-registrado y `computeAll`.
- `src/calibration/CalibrationStrategyRegistry.js:10-76` gestiona estrategias con registro, consulta, listado y estrategia por defecto.

Lectura funcional:
- La idea de un registry central ya está probada en el código base.
- Lo que falta para B.2 no es el patrón, sino su formalización específica para el dominio Laboratorio.
- El contrato deseado por el prompt (`register`, `get`, `list`, `getCapabilities`) encaja con lo que ya existe, pero aún no aparece como `LaboratoryRegistry` dedicado.

3) Runner: ausencia de capa neutral de ejecución
- No se encontró un `LaboratoryRunner` en `src/`.
- La ejecución actual sigue anclada en motores y orquestadores específicos del dominio (por ejemplo, consensos, calibración, historical evidence), no en un runner neutro basado únicamente en contratos.
- Esto es coherente con la Fase 6.B.1: el laboratorio existe, pero aún no posee una capa formal de ejecución agnóstica al motor.

Lectura funcional:
- El gap principal de esta fase está en la abstracción de ejecución, no en la funcionalidad de negocio.
- Antes de introducir un runner nuevo, conviene preservar el aislamiento entre contratos y motores ya certificados.

4) Contexto de ejecución
- `src/calibration/CalibrationContext.js:8-34` ya implementa un contexto inmutable y serializable para calibración.
- Ese diseño es una referencia útil para un futuro `LaboratoryContext`, pero no lo reemplaza.
- No existe hoy un contexto de laboratorio unificado en `src/`.

Lectura funcional:
- La forma correcta de introducir el contexto del laboratorio sería como contrato común y no como dependencia directa del tracker.
- El patrón de contexto inmutable ya está validado en otra capa del producto.

5) Dataset, Result y Metric contracts
- Dataset: `src/calibration/CalibrationDataset.js` y `src/calibration/CalibrationDatasetBuilder.js` ya formalizan un contrato y su construcción para calibración.
- Result: `src/calibration/factories/CalibrationResultFactory.js` y `src/calibration/CalibrationModel.js` ya producen resultados serializables en el ecosistema de calibración.
- Metric: `src/calibration/MetricRegistry.js` define catálogo, metadata y cálculo de métricas.

Lectura funcional:
- El proyecto ya sabe modelar dataset/result/metric en otras capas.
- Lo que aún falta es una proyección equivalente con nombre y alcance de Laboratorio.
- Por lo tanto, B.2 no requiere inventar patrones nuevos; requiere encapsular patrones existentes con fronteras de dominio más claras.

6) Puntos de extensión ya preparados
- `src/core/EngineRegistry.js` demuestra el patrón de registry extensible.
- `src/calibration/CalibrationContext.js` demuestra contexto inmutable y serializable.
- `src/calibration/MetricRegistry.js` demuestra catálogo extensible de capacidades/metrics.
- `src/calibration/CalibrationStrategyRegistry.js` demuestra registro de módulos por nombre sin condicionales por tipo.
- `src/consensus/collection/SignalCollector.js` ya orquesta múltiples fuentes mediante adaptadores explícitos.
- `src/historical-evidence/index.js` expone un barrel por capas para dominio/aplicación/infraestructura.

Lectura funcional:
- El terreno arquitectónico ya está preparado para que B.2 introduzca una foundation formal sin romper el sistema.
- La capa de consenso y Historical Evidence muestran que el repositorio ya aceptó modelado por contratos, adaptadores y barras públicas de API.

7) Riesgos detectados
- Riesgo de nomenclatura: reutilizar clases de calibración con nombres de Laboratorio sin una frontera clara puede generar ambigüedad de dominio.
- Riesgo de duplicación: crear un runner o registry nuevo sin observar patrones ya existentes puede replicar funcionalidad de `EngineRegistry` y `CalibrationContext`.
- Riesgo de invasión funcional: la fase prohíbe alterar UI, motores y adaptadores; por tanto cualquier foundation futura debe añadirse de forma lateral, no intrusiva.

8) Compatibilidad con B.1
- La auditoría B.1 certificó que el Laboratorio actual está compuesto por Lab_Con, Lab_Con1, AtRep, consenso e Historical Evidence.
- Esta revisión no cambia ese estado.
- No se modificaron:
  - `AtRep`
  - `Lab_Con`
  - `Lab_Con1`
  - `WinWin`
  - `DA`
  - `Historical Evidence`
  - `SignalCollector`
  - adaptadores
  - tracker / domain tracker
- Tests, lint y build continúan en verde.

9) Evidencia utilizada
- `/home/shared/lab_vito/reports/Fase6.B.1.log`
- `/home/shared/lab_vito/reports/Fase6.B.2.md`
- `/home/shared/lab_vito/src/core/EngineRegistry.js`
- `/home/shared/lab_vito/src/calibration/CalibrationContext.js`
- `/home/shared/lab_vito/src/calibration/MetricRegistry.js`
- `/home/shared/lab_vito/src/calibration/CalibrationStrategyRegistry.js`
- `/home/shared/lab_vito/src/calibration/contracts/CalibrationContract.js`
- `/home/shared/lab_vito/src/calibration/CalibrationDataset.js`
- `/home/shared/lab_vito/src/calibration/CalibrationDatasetBuilder.js`
- `/home/shared/lab_vito/src/calibration/factories/CalibrationResultFactory.js`
- `/home/shared/lab_vito/src/consensus/collection/SignalCollector.js`
- `/home/shared/lab_vito/src/historical-evidence/index.js`
- Validación ejecutada: `npm test`, `npm run lint`, `npm run build`

Conclusión
- La base arquitectónica para la Foundation del Laboratorio ya existe como patrones reutilizables en otras capas del sistema.
- Sin embargo, en este commit no se encontró una implementación dedicada de `LaboratoryRegistry`, `LaboratoryRunner`, `LaboratoryContext` ni de los contratos específicos de Laboratorio.
- La fase B.2 queda, por tanto, como preparación y formalización de patrones existentes, no como un cambio funcional ya aplicado.

Fin del reporte.
