2026-08-02T17:09:06-04:00

# LEGACY_DEPENDENCY_MATRIX

| Hallazgo | Archivo | Tipo | Consumidor | Estado | Riesgo | Acción |
|---|---|---|---|---|---|---|
| `LegacyTracker` | árbol JS | ACTIVE_RUNTIME | Ninguno | Ausente | Bajo | NO_ACTION |
| `TrackerSyncAdapter` | árbol JS | ACTIVE_RUNTIME | Ninguno | Ausente | Bajo | NO_ACTION |
| `rouletteTracker.js` en `Bootstrap.js` | `src/core/Bootstrap.js` | DOCUMENTATION_ONLY | Ninguno | Comentario/JSDoc | Bajo | DOCUMENT |
| `rouletteTracker.js` en `numberMeta.js` | `src/utils/numberMeta.js` | DOCUMENTATION_ONLY | Ninguno | Comentario/JSDoc | Bajo | DOCUMENT |
| Scripts de integración con referencias legacy | `core/integrate_lab.js`, `core/script_de_integracion.js`, `core/script_de_integracion_automatizada.js` | OBSOLETE | Operación manual externa | No usados por build | Medio | DOCUMENT |
| Múltiples menciones históricas al Legacy Tracker | `reports/`, `references/`, `Refactura_hermes/`, `ROADMAP.md` | HISTORICAL_REFERENCE | Lectura humana | Conservado | Bajo | KEEP |

## Nota
No se encontró evidencia de doble implementación activa, ni consumidores dinámicos del Legacy Tracker en runtime.
