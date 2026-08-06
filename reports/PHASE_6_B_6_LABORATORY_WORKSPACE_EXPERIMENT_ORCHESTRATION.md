2026-08-03T04:46:38Z

# FASE 6.B.6 — Laboratory Workspace & Experiment Orchestration

## Resumen ejecutivo
Se implementó el dominio de Workspace y Experiment para Laboratory sin tocar la UI ni alterar los algoritmos existentes. La nueva capa permite agrupar múltiples experimentos dentro de un workspace, modelar su ciclo de vida, validar consistencia, administrar catálogos de workspaces y preservar trazabilidad/provenance para reutilización futura.

## Modelo de Workspace
- `LaboratoryWorkspace` representa un proyecto de investigación.
- Es inmutable y serializable con `toJSON()`.
- Contiene `workspaceId`, `name`, `description`, `owner`, `experiments`, `metadata`, `provenance` y `timestamps`.
- Un workspace puede contener múltiples experimentos.

## Modelo de Experiment
- `LaboratoryExperiment` representa una unidad de investigación dentro de un workspace.
- Es inmutable y serializable con `toJSON()`.
- Contiene `experimentId`, `workspaceId`, `hypothesis`, `objective`, `sessions`, `comparisons`, `evidence`, `metadata`, `provenance`, `lifecycle` y `timestamps`.
- Cada experiment puede contener múltiples sesiones, comparaciones y reportes de evidencia.

## Lifecycle
- Se añadió `LaboratoryExperimentLifecycle` con estados:
  - `CREATED`
  - `READY`
  - `RUNNING`
  - `ANALYZING`
  - `COMPLETED`
  - `ARCHIVED`
  - `CANCELLED`
- Las transiciones están validadas y cada cambio agrega timestamps del estado alcanzado.
- El lifecycle queda serializado para reconstrucción posterior.

## Builders
- `LaboratoryExperimentBuilder`:
  - construye experiments;
  - agrega sesiones;
  - agrega comparaciones;
  - agrega evidencia;
  - valida consistencia y unicidad de artefactos.
- `LaboratoryWorkspaceBuilder`:
  - construye workspaces;
  - agrega experiments;
  - valida que cada experiment pertenezca al workspace correcto y que no haya duplicados.
- Ambos builders conservan `metadata` y `provenance`.

## Catálogos
- `LaboratoryWorkspaceCatalog` permite:
  - registrar workspaces;
  - consultarlos;
  - listarlos;
  - abrirlos;
  - cerrarlos.
- El catálogo mantiene estado por workspace sin usar listas globales.
- La estructura queda preparada para extenderse a persistencia futura.

## Integración con Session
- Los experiments pueden contener múltiples sesiones serializadas.
- La trazabilidad de sesión se conserva mediante `provenance`.
- La reconstrucción del workspace puede hacerse desde datos serializados.

## Integración con Comparison
- Los experiments pueden agregar comparaciones serializadas.
- Las comparaciones quedan asociadas al experiment y preservan su identidad.
- Se mantiene compatibilidad con la capa de comparación ya existente.

## Integración con Evidence
- Los experiments pueden registrar `LaboratoryEvidenceReport`.
- La evidencia queda vinculada al experiment con trazabilidad completa.
- Se conserva la serialización necesaria para auditoría y reproducción.

## Provenance
- Se preservan `metadata`, `provenance` y `timestamps` en workspace y experiment.
- El diseño deja rastreables:
  - origen del dato;
  - versión del runner;
  - referencias a sesiones, comparaciones y evidencia;
  - fechas de creación y actualización.
- Esto prepara la arquitectura para exportación, compartición y persistencia a largo plazo.

## Compatibilidad
- No se modificó la UI.
- No se cambió ningún algoritmo existente.
- No se alteraron resultados existentes.
- Se mantuvo la compatibilidad con las fases previas del laboratorio.

## Riesgos
- La persistencia sigue siendo en memoria.
- El lifecycle de experiment está modelado para reconstrucción y validación, pero no sustituye un motor transaccional.
- La sincronización entre workspace y experiment depende de que se respeten los builders.

## Próximos pasos
- Exportación de experiments.
- Compartición de workspaces.
- Persistencia de largo plazo.
- Integración con simuladores, Monte Carlo y replay engine.

## Evidencia utilizada
- `reports/Fase6.B.6B.md`
- `src/laboratory/LaboratoryWorkspace.js`
- `src/laboratory/LaboratoryWorkspaceBuilder.js`
- `src/laboratory/LaboratoryWorkspaceCatalog.js`
- `src/laboratory/LaboratoryExperiment.js`
- `src/laboratory/LaboratoryExperimentBuilder.js`
- `src/laboratory/LaboratoryExperimentLifecycle.js`
- `src/laboratory/index.js`
- `tests/laboratory/LaboratoryWorkspace.test.js`
- `npm run test` ✅
- `npm run lint` ✅
- `npm run build` ✅
