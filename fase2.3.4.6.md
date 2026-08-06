# PROMPT MAESTRO — FASE 2.3.4.6

## Hardening, Integrated Audit and Formal Closure

Actúa como **arquitecto principal de software, auditor técnico, revisor científico, ingeniero senior de calidad y responsable de cierre de fase** del proyecto **Roulette Tracker Pro**.

Tu tarea es inspeccionar, auditar, endurecer, probar y documentar exclusivamente la:

> **Fase 2.3.4.6 — Hardening, Integrated Audit and Formal Closure**

Esta subfase debe cerrar formalmente toda la **Fase 2.3.4 — Dataset Versioning, Canonical Serialization and Integrity Verification**, incluyendo los componentes de versionado, identidad, serialización canónica, integridad, comparación y lineage lógico.

Esta fase no debe agregar nuevas capacidades funcionales amplias.

Debe encontrar inconsistencias, defectos de integración, duplicaciones, contratos incompletos, errores documentales y regresiones, y corregir únicamente lo necesario para dejar la arquitectura cerrada, coherente, verificable y preparada para la siguiente fase.

---

# 1. Contexto del proyecto

## Proyecto

```text
Roulette Tracker Pro
```

Nombre anterior:

```text
ORION / ORION_v2
```

Repositorio:

```bash
/home/shared/lab_vito
```

Fase global que debe cerrarse:

```text
Fase 2.3.4 —
Dataset Versioning, Canonical Serialization
and Integrity Verification
```

Subfases comprendidas:

```text
2.3.4.1 — Dataset Version, Scientific Identity and Snapshot Descriptor
2.3.4.2 — Canonical Dataset Serialization
2.3.4.3 — Dataset Integrity Verification
2.3.4.4 — Deterministic Dataset Comparison and Scientific Equivalence
2.3.4.5 — Dataset Lineage and Version Relationships
2.3.4.6 — Hardening, Integrated Audit and Formal Closure
```

---

# 2. Documentos obligatorios

Localiza y lee completamente todos los puntos de control, informes y notas técnicas disponibles relacionados con:

```text
Fase 2.3.3
Fase 2.3.4.1
Fase 2.3.4.2
Fase 2.3.4.3
Fase 2.3.4.4
Fase 2.3.4.5
```

Revisa especialmente:

```text
Fase_2.3.3_cerrada.md
Fase_2.3.4.1_cerrada.md
Fase_2.3.4.2_cerrada.md
Fase_2.3.4.3_cerrada.md
Fase_2.3.4.4_cerrada.md
Fase_2.3.4.5_cerrada.md
```

También revisa los informes y notas técnicas ubicados en:

```text
reports/trabajo/
```

Como mínimo, busca documentos cuyos nombres contengan:

```text
Fase2.3.4.1
Fase2.3.4.2
Fase2.3.4.3
Fase2.3.4.4
Fase2.3.4.5
lineage
comparison
integrity
canonical
dataset_version
snapshot
```

No asumas que todos los archivos tienen la numeración correcta.

---

# 3. Discrepancia documental conocida

Existe al menos un informe de lineage nombrado:

```text
Fase5.6.1_lineage_resolution_reporte.md
```

pero su contenido corresponde funcionalmente a:

```text
Fase 2.3.4.5 —
Dataset Lineage and Version Relationships
```

Debes:

1. verificar el contenido;
2. confirmar qué implementación representa;
3. registrar la discrepancia;
4. generar el documento correcto bajo la convención de Fase 2.3.4.5;
5. no eliminar el archivo original;
6. no perder trazabilidad;
7. dejar una nota de compatibilidad o alias documental si corresponde.

No renombres destructivamente documentos sin preservar referencia al nombre anterior.

---

# 4. Baseline esperado

El último baseline informado es:

```text
FASE 2.3.4.5: TÉCNICAMENTE COMPLETADA
SUITE COMPLETA: 940/940 PASS
ARCHIVOS DE TEST: 63
LINT: OK
BUILD: OK
PIPELINE: GREEN
```

Warning conocido:

```text
Vite:
chunk mayor a 500 kB
```

Otros warnings históricos conocidos:

```text
AtRepRenderer:
contenedor ausente en test de stub

P2.2 Synthetic Benchmark:
INSUFFICIENT_EVIDENCE
```

Estado Git conocido:

```text
WORKSPACE DIRTY
```

El repositorio contiene modificaciones y archivos sin seguimiento de fases anteriores.

No atribuyas automáticamente todo el diff a esta fase.

No ejecutes limpieza destructiva.

No asumas que el baseline continúa válido.

Debes verificarlo antes de modificar código.

---

# 5. Arquitectura que debe auditarse

La Fase 2.3.4 debe haber producido, según la implementación real, contratos equivalentes a:

## Versionado e identidad

```text
DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory
```

## Serialización canónica

```text
canonicalSerialize
canonicalHashSync
canonicalHash

projectScientificDataset
projectObservation

serializeScientificDataset
serializeDatasetIdentity
serializeDatasetManifest
serializeDatasetStatistics
serializeDatasetSnapshotDescriptor
```

## Integridad

```text
DatasetIntegrityVerifier
DatasetIntegrityReport
DatasetIntegrityStatus
IntegrityVerificationMode
```

## Comparación

```text
DatasetComparator
DatasetComparisonReport
DatasetComparisonClassification
DatasetDifference
DatasetDifferenceCategory
DatasetComparisonMode
```

## Lineage

```text
DatasetLineageRelation
DatasetLineageRelationType
DatasetLineageResolution
DatasetLineageResolver
```

Confirma nombres, paths y APIs reales.

No inventes componentes inexistentes para hacer coincidir esta lista.

---

# 6. Objetivo general

Realizar una auditoría integral de toda la Fase 2.3.4 y dejar demostrado que:

```text
versionado
+
identidad
+
serialización
+
hashing
+
integridad
+
comparación
+
lineage
```

forman una arquitectura coherente, determinista, inmutable y sin duplicaciones.

La fase debe:

1. verificar los contratos;
2. detectar inconsistencias;
3. corregir defectos reales;
4. completar pruebas faltantes;
5. validar integraciones;
6. normalizar documentación;
7. confirmar exports;
8. confirmar ausencia de efectos secundarios;
9. confirmar compatibilidad de hashes;
10. producir el punto de control final de toda la Fase 2.3.4.

---

# 7. Restricción principal

Esta es una fase de:

```text
hardening
auditoría
integración
documentación
cierre
```

No es una fase de expansión funcional.

No agregues nuevos motores, repositorios, formatos o flujos productivos.

No implementes una capacidad solo porque sería útil en el futuro.

Todo cambio de código debe responder a uno de estos motivos:

```text
bug real
invariante incumplida
duplicación
contrato incompleto
riesgo de corrupción
falta de determinismo
falta de inmutabilidad
error de integración
falta de prueba crítica
export incorrecto
documentación contradictoria
```

---

# 8. Auditoría arquitectónica obligatoria

Debes verificar la dirección de dependencias.

La arquitectura debe respetar conceptualmente:

```text
application → domain

DatasetBuilder
    → canonical projections
    → canonical hashing

DatasetIntegrityVerifier
    → canonical serialization
    → domain contracts

DatasetComparator
    → DatasetIntegrityVerifier
    → canonical serialization
    → domain contracts

DatasetLineageResolver
    → DatasetComparator
    → DatasetIntegrityVerifier
    → DatasetVersionPolicy
```

Debe evitar:

```text
domain → application
calibration → historical-evidence
shared → historical-evidence
comparador → lineage
integrity → comparator
serialización → integrity
```

Detecta:

* imports circulares;
* dependencias inversas;
* barrels que crean ciclos;
* helpers compartidos ubicados en capas incorrectas;
* dominio acoplado a infraestructura;
* servicios de aplicación importados desde dominio.

No reorganices módulos sin necesidad demostrada.

---

# 9. Auditoría de versionado

Verifica `DatasetVersion` y `DatasetVersionPolicy`.

Debe comprobarse:

* creación válida;
* parse determinista;
* representación `major.minor.patch`;
* comparación;
* igualdad;
* inmutabilidad;
* rechazo de coerciones;
* rechazo de negativos;
* rechazo de decimales;
* rechazo de `NaN` e infinitos;
* compatibilidad direccional;
* major incompatible;
* diferencia entre versión del dataset y schemas.

Confirma que no se confunden:

```text
datasetVersion
schemaVersion
observationSchemaVersion
```

Confirma que ninguna API posterior trata estas versiones como equivalentes.

---

# 10. Auditoría de identidad

Verifica `DatasetIdentity`.

Debe mantenerse la separación:

```text
identidad científica
→ contentHash

identidad operativa
→ datasetId + manifestHash + otros campos operativos
```

Auditar:

* equivalencia científica;
* equivalencia operativa;
* igualdad;
* serialización;
* hashes arrastrados;
* ausencia de recálculo;
* ausencia de timestamps como identidad;
* ausencia de comparación solo por `datasetId`;
* inmutabilidad profunda;
* coherencia con descriptor;
* coherencia con dataset.

Debe comprobarse que dos snapshots operativamente distintos pueden ser científicamente equivalentes.

---

# 11. Auditoría del descriptor

Verifica `DatasetSnapshotDescriptor` y su factory.

Auditar:

* no duplicación de observaciones;
* manifest y statistics según contrato real;
* identidad correcta;
* periodo correcto;
* provenance;
* lineage declarado;
* metadata;
* policies;
* filters;
* createdAt explícito;
* ausencia de reloj global;
* ausencia de IDs generados;
* no persistencia;
* no exportación;
* construcción all-or-nothing;
* errores tipados;
* inmutabilidad.

Confirma que la factory no recalcula hashes.

---

# 12. Auditoría de serialización canónica

Debe existir una sola fuente oficial de serialización.

Auditar:

```text
canonicalSerialize
canonicalHashSync
canonicalHash
```

y las proyecciones históricas.

Verifica:

* orden determinista de claves;
* preservación de arrays;
* rechazo de ciclos;
* rechazo de números no finitos;
* rechazo de tipos no soportados;
* manejo explícito de `undefined`;
* manejo de `-0`;
* strings Unicode;
* objetos planos;
* ausencia de getters con efectos secundarios;
* ausencia de coerciones silenciosas;
* ausencia de mutación;
* hashes async/sync coherentes.

Confirma que no existen implementaciones paralelas de:

```text
Object.keys(...).sort()
JSON.stringify(...)
SHA-256
canonical serialization
```

con semántica diferente en el dominio auditado.

---

# 13. Regresión de hashes

La fase debe demostrar que los hashes válidos históricos siguen preservados.

Auditar:

```text
contentHash
manifestHash
canonicalHashSync
```

Debe comprobarse:

```text
mismo contenido científico
→ mismo contentHash
```

y:

```text
cambio científico
→ contentHash diferente
```

Además:

```text
datasetId diferente
createdAt diferente
misma evidencia científica
→ contentHash igual
```

No cambies fixtures literales de hashes para ocultar una regresión.

Si un hash cambia:

1. detener el cierre;
2. identificar la causa;
3. demostrar si es bug previo o ruptura;
4. no actualizar expectativas automáticamente;
5. marcar fase pendiente si no puede preservarse.

---

# 14. Auditoría de integridad

Verifica `DatasetIntegrityVerifier` y `DatasetIntegrityReport`.

Confirma los modos:

```text
SCIENTIFIC
OPERATIONAL
FULL
```

Confirma checks equivalentes a:

```text
CONTENT_HASH
MANIFEST_HASH
DATASET_SCHEMA
OBSERVATION_SCHEMA
CANONICAL_ORDER
DUPLICATES
CHRONOLOGY
STATISTICS
SCIENTIFIC_STRUCTURE
DATASET_IDENTITY
SNAPSHOT_DESCRIPTOR
IMMUTABILITY
```

Auditar:

* dataset válido → `VALID`;
* hash incorrecto → `INVALID`;
* información insuficiente → `INCOMPLETE`;
* corrupción produce reporte y no reparación;
* inputs mal formados producen errores tipados;
* checks en orden determinista;
* reporte inmutable;
* reporte serializable;
* ausencia de timestamp actual;
* no mutación;
* no reparación;
* no persistencia.

---

# 15. Auditoría de comparación

Verifica `DatasetComparator`.

Confirma clasificaciones reales equivalentes a:

```text
EXACT_MATCH
SCIENTIFICALLY_EQUIVALENT
OPERATIONALLY_EQUIVALENT
COMPATIBLE_EVOLUTION
DIVERGENT
INCOMPATIBLE
INDETERMINATE
```

Auditar:

* igualdad exacta;
* equivalencia científica;
* diferencia operativa;
* evolución compatible direccional;
* extensión izquierda;
* extensión derecha;
* divergencia;
* incompatibilidad de schemas;
* incompatibilidad de versions;
* artefactos corruptos;
* periodos;
* diferencias de observaciones;
* conflictos lógicos;
* orden determinista;
* reporte inmutable;
* prevalidación de integridad;
* ausencia de comparación por posición.

No permitir equivalencia solo por coincidencia de hashes declarados sin verificación.

---

# 16. Auditoría de lineage

Verifica los contratos reales de lineage.

Confirma implementación de:

```text
DatasetLineageRelation
DatasetLineageResolution
DatasetLineageResolver
```

Auditar como mínimo:

* equivalencia científica;
* equivalencia operativa;
* parentaje declarado;
* `PARENT_OF`;
* `CHILD_OF`, si corresponde;
* `SUPERSEDES`;
* `SUPERSEDED_BY`, si corresponde;
* `MERGE_CANDIDATE`;
* `INCOMPATIBLE`;
* provenance;
* source dataset ID;
* source content hash;
* parent dataset version;
* relaciones contradictorias;
* self-relations;
* inputs corruptos;
* determinismo;
* inmutabilidad;
* reuse de comparator;
* reuse de integrity verifier.

---

# 17. Escenarios de lineage no demostrados documentalmente

El informe disponible de lineage documentó principalmente:

```text
datasets idénticos
parentaje declarado con reemplazo
siblings divergentes con fuente compartida
incompatibilidad no reconciliable
```

Debes inspeccionar si existen pruebas para:

```text
DERIVED_FROM sin parent directo
BRANCH_OF
UNRELATED
INDETERMINATE
relaciones inversas
provenance contradictoria
self-relations
integridad inválida
serialización determinista
```

Para cada escenario:

* si está implementado y probado, documentarlo;
* si está implementado sin prueba, agregar prueba;
* si está exigido por el contrato público pero ausente, implementarlo conservadoramente;
* si nunca fue realmente parte del contrato final, justificar su exclusión;
* no declarar que existe si el código no lo soporta.

No agregues relaciones especulativas únicamente para completar una lista.

---

# 18. Auditoría de provenance

Inspecciona el contrato real de provenance.

Verifica campos como:

```text
sourceDatasetId
sourceContentHash
parentDatasetVersion
assemblyReason
transformationType
```

solo si existen realmente.

Auditar:

* forma válida;
* metadata segura;
* valores opcionales;
* referencias coherentes;
* source ID correcto;
* source hash correcto;
* parent version correcta;
* relación declarada compatible con comparación;
* provenance contradictoria detectada;
* ausencia de inferencia silenciosa.

Una declaración no debe aceptarse como verdad sin validación.

---

# 19. Auditoría de inmutabilidad

Comprobar explícitamente:

* objetos raíz congelados;
* arrays congelados;
* objetos anidados congelados;
* metadata congelada;
* provenance congelada;
* lineage congelado;
* reports congelados;
* differences congeladas;
* relations congeladas;
* resolutions congeladas.

También comprobar:

* no ordenamiento in-place;
* no escritura temporal;
* no caching mutable global;
* no modificación del input;
* no freezing de inputs como efecto secundario cuando no corresponde.

El hardening debe corregir inconsistencias de freeze solo si forman parte del contrato.

No rompas referencias compartidas válidas.

---

# 20. Auditoría de errores tipados

Inspecciona todos los errores agregados en 2.3.4.

Auditar:

* herencia correcta;
* códigos o nombres estables;
* mensajes deterministas;
* contexto seguro;
* no exposición de objetos enormes;
* no exposición de datos sensibles;
* diferencias entre invalidación y excepción;
* barrel exports;
* tests.

Detecta errores duplicados o semánticamente solapados.

No consolides errores si rompe compatibilidad pública sin necesidad.

---

# 21. Auditoría de exports

Inspecciona:

```text
src/calibration/index.js
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

Verifica:

* contratos públicos exportados;
* helpers privados no exportados;
* ausencia de colisiones de nombres;
* ausencia de exports duplicados;
* imports existentes preservados;
* ausencia de side effects al importar;
* barrels sin ciclos.

Crear o completar pruebas de exports públicos.

---

# 22. Auditoría de efectos secundarios

Comprobar que importar o ejecutar los componentes de 2.3.4 no produce:

* logs;
* acceso a filesystem;
* acceso a red;
* lectura de reloj;
* IDs automáticos;
* random;
* persistencia;
* escritura de reportes desde dominio;
* modificación de globals;
* ejecución automática de hashing;
* ejecución automática de comparación;
* ejecución automática de lineage.

---

# 23. Auditoría de complejidad

Buscar:

* funciones excesivamente largas;
* duplicación entre integridad y comparación;
* duplicación entre comparación y lineage;
* duplicación de proyecciones;
* múltiples recorridos evitables;
* algoritmos cuadráticos;
* serialización repetida innecesaria;
* múltiples hashes del mismo payload en una ejecución;
* maps globales;
* caches mutables.

No hagas optimizaciones prematuras.

Corrige únicamente problemas claros que afecten:

```text
correctitud
determinismo
mantenibilidad
memoria
complejidad asintótica
```

No agregues benchmarks frágiles por tiempo.

---

# 24. Auditoría de documentación

Comparar documentación contra código real.

Detectar:

* fases mal numeradas;
* nombres de archivos inconsistentes;
* componentes documentados pero inexistentes;
* APIs reales no documentadas;
* números de tests obsoletos;
* estados “cerrada” sin validación;
* puntos de control faltantes;
* referencias a informes con nombres incorrectos;
* claims de funcionalidades fuera de alcance.

No reescribas historia.

Preserva trazabilidad y registra correcciones.

---

# 25. Consolidación documental obligatoria

Generar o corregir, sin eliminar versiones anteriores:

```text
Fase_2.3.4.1_cerrada.md
Fase_2.3.4.2_cerrada.md
Fase_2.3.4.3_cerrada.md
Fase_2.3.4.4_cerrada.md
Fase_2.3.4.5_cerrada.md
```

Si ya existen y son correctos, no duplicarlos.

Si están incompletos, actualizar únicamente lo necesario.

Debes crear al cierre:

```text
Fase_2.3.4_cerrada.md
```

Este será el punto de control consolidado de toda la fase.

No sobrescribas:

```text
Fase_2.3.3_cerrada.md
```

---

# 26. Inspección inicial obligatoria

Antes de modificar cualquier archivo:

```bash
cd /home/shared/lab_vito

pwd
git status --short
git branch --show-current
git log -1 --oneline
git tag --list | tail -n 30
```

Inventario:

```bash
find src/historical-evidence -maxdepth 6 -type f | sort
find tests/historical-evidence -maxdepth 6 -type f | sort
find src/calibration -maxdepth 5 -type f | sort
find tests/calibration -maxdepth 5 -type f | sort
find reports/trabajo -maxdepth 3 -type f | sort
find . -maxdepth 3 -type f \
  \( -name '*2.3.4*' -o -name '*lineage*' -o -name '*Lineage*' \) \
  | sort
```

Búsquedas:

```bash
grep -R "DatasetVersion" -n src tests
grep -R "DatasetIdentity" -n src tests
grep -R "DatasetSnapshotDescriptor" -n src tests
grep -R "canonicalSerialize" -n src tests
grep -R "canonicalHashSync" -n src tests
grep -R "DatasetIntegrityVerifier" -n src tests
grep -R "DatasetComparator" -n src tests
grep -R "DatasetLineageResolver" -n src tests
grep -R "provenance" -n src/historical-evidence tests/historical-evidence
grep -R "lineage" -n src/historical-evidence tests/historical-evidence
grep -R "JSON.stringify" -n src/historical-evidence src/calibration
grep -R "Object.keys.*sort" -n src/historical-evidence src/calibration
grep -R "createHash" -n src
grep -R "Math.random" -n src/historical-evidence src/calibration
grep -R "new Date" -n src/historical-evidence src/calibration
```

No asumas que una coincidencia es un defecto.

Inspecciona contexto.

---

# 27. Validación inicial del baseline

Antes de modificar producción:

```bash
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

Baseline esperado:

```text
suite completa: 940/940 PASS o superior
archivos de test: 63 o superior
lint: exit 0
build: exit 0
```

Registra:

* tests;
* archivos;
* duración;
* warnings;
* errores;
* exit codes;
* versión de Node;
* versión de npm;
* branch;
* commit actual.

No conviertas warnings conocidos en fallos sin analizar su origen.

---

# 28. Nota técnica previa

Antes de modificar producción, crear:

```text
reports/trabajo/Fase2.3.4.6_nota_tecnica_auditoria.md
```

Debe contener:

```text
1. Resumen
2. Estado Git
3. Baseline real
4. Documentos inspeccionados
5. Arquitectura encontrada
6. Mapa de dependencias
7. Componentes públicos
8. Invariantes
9. Auditoría de versionado
10. Auditoría de identidad
11. Auditoría de descriptor
12. Auditoría canónica
13. Auditoría de hashes
14. Auditoría de integridad
15. Auditoría de comparación
16. Auditoría de lineage
17. Auditoría de provenance
18. Auditoría de inmutabilidad
19. Auditoría de errores
20. Auditoría de exports
21. Auditoría de side effects
22. Auditoría de complejidad
23. Auditoría documental
24. Hallazgos críticos
25. Hallazgos mayores
26. Hallazgos menores
27. Cambios propuestos
28. Archivos a crear
29. Archivos a modificar
30. Riesgos
31. Fuera de alcance
32. Criterios de cierre
```

Clasifica hallazgos:

```text
CRITICAL
HIGH
MEDIUM
LOW
DOCUMENTATION
```

No modifiques producción antes de completar esta nota.

---

# 29. Correcciones permitidas

Durante hardening puedes corregir:

* errores de validación;
* errores de freeze;
* inconsistencias de igualdad;
* clasificación incorrecta;
* relación de lineage incorrecta;
* ciclos de imports;
* exports faltantes;
* errores tipados incorrectos;
* serialización no determinista;
* hashes duplicados;
* pruebas insuficientes;
* documentación contradictoria;
* nombres de reportes inconsistentes;
* puntos de control faltantes.

Cada corrección debe:

1. estar vinculada a un hallazgo;
2. tener una prueba;
3. preservar compatibilidad cuando sea posible;
4. quedar documentada;
5. no ampliar alcance.

---

# 30. Correcciones prohibidas

No implementar:

* persistencia;
* repositorios durables;
* filesystem snapshots;
* SQLite;
* DuckDB;
* PostgreSQL;
* almacenamiento remoto;
* exportadores;
* CSV;
* JSONL;
* Parquet;
* Arrow;
* deserialización;
* importación;
* migraciones;
* merge;
* reconciliación;
* reparación automática;
* grafos persistentes;
* traversal global;
* búsqueda de ancestros;
* búsqueda de descendientes;
* entrenamiento;
* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* model selection;
* ranking;
* `PromotionPolicy`;
* UI;
* captura productiva;
* integración automática con `SpinManager`;
* cambios productivos en `ConsensusEngine`;
* cambios productivos en `ProbabilityCalibrator`.

---

# 31. Estrategia de pruebas integradas

Crear una nueva suite integrada, por ejemplo:

```text
tests/historical-evidence/Phase234IntegratedAudit.test.js
```

El nombre final debe respetar las convenciones del repositorio.

Debe probar el flujo completo:

```text
CalibrationObservation[]
        ↓
HistoricalCalibrationDataset
        ↓
DatasetIdentity
        ↓
DatasetSnapshotDescriptor
        ↓
Canonical Serialization
        ↓
Integrity Verification
        ↓
Dataset Comparison
        ↓
Lineage Resolution
```

---

# 32. Escenario integrado válido

Construir datasets mediante APIs oficiales.

Verificar:

1. dataset correctamente ensamblado;
2. hashes correctos;
3. descriptor correcto;
4. serialización determinista;
5. integridad `VALID`;
6. comparación exacta;
7. equivalencia científica;
8. lineage coherente;
9. inputs intactos.

No construir expectativas únicamente con la misma API bajo prueba.

---

# 33. Escenario integrado de evolución

Construir:

```text
Dataset A
Dataset B = extensión válida de A
```

Verificar:

* integridad de ambos;
* comparación `COMPATIBLE_EVOLUTION`;
* dirección de extensión;
* provenance consistente;
* lineage parent/derived correcto;
* versions compatibles;
* hashes distintos;
* observaciones compartidas intactas.

---

# 34. Escenario integrado de equivalencia

Construir dos snapshots:

```text
misma evidencia científica
distinto datasetId
distinto createdAt
distinto manifestHash
```

Verificar:

* ambos íntegros;
* mismo `contentHash`;
* serialización científica idéntica;
* comparación `SCIENTIFICALLY_EQUIVALENT`;
* diferencia operativa;
* lineage de equivalencia;
* no exact match.

---

# 35. Escenario integrado de corrupción

Alterar controladamente:

* contentHash;
* manifestHash;
* estadísticas;
* descriptor;
* orden de observaciones;
* provenance.

Verificar:

* integridad inválida;
* comparador no declara equivalencia;
* lineage no emite relación definitiva;
* inputs no se reparan;
* reporte identifica el check correcto.

No debilitar el dominio para generar corrupción.

Usar fixtures reconstruidos.

---

# 36. Escenario integrado de divergencia

Construir datasets íntegros con evidencia conflictiva.

Verificar:

* integridad válida individual;
* comparación `DIVERGENT`;
* no equivalencia;
* no parent directo;
* posible candidate relation solo si provenance lo justifica;
* ausencia de merge automático.

---

# 37. Escenario integrado incompatible

Construir:

* schemas incompatibles;
* major versions incompatibles;
* provenance contradictoria.

Verificar:

* comparación `INCOMPATIBLE`;
* lineage `INCOMPATIBLE`;
* ausencia de migración;
* ausencia de reparación.

---

# 38. Tests adicionales obligatorios

Cubrir como mínimo:

* barrel exports;
* imports sin side effects;
* deep freeze;
* determinismo de reportes;
* orden estable de differences;
* orden estable de lineage relations;
* hash regression;
* self-relations;
* provenance contradictoria;
* `DERIVED_FROM`, si forma parte del contrato real;
* `UNRELATED`, si forma parte del contrato real;
* `INDETERMINATE`;
* inputs parciales;
* errores tipados;
* ausencia de `Math.random()`;
* ausencia de reloj global en APIs científicas.

---

# 39. Validación de tests sospechosos

Buscar:

```bash
grep -R "\.skip\|\.only\|todo(" -n tests
grep -R "expect(true)" -n tests
grep -R "toBeTruthy()" -n tests/historical-evidence
grep -R "setTimeout" -n tests/historical-evidence
```

Inspecciona:

* tests deshabilitados;
* assertions débiles;
* expectativas dinámicas;
* tests que recalculan expected con la función bajo prueba;
* tests dependientes de tiempo;
* tests dependientes de orden accidental;
* mocks que ocultan fallos.

No reemplaces todas las assertions genéricas sin necesidad.

Corrige únicamente debilidades relevantes para 2.3.4.

---

# 40. Validación final obligatoria

Después de todas las correcciones:

```bash
npx vitest run tests/historical-evidence/
npm exec vitest run tests/calibration/CanonicalHash.test.js
npm run test
npm run lint
npm run build
```

También ejecutar, si existen:

```bash
npm run check:architecture
npm run test:architecture
npm run check:anti-legacy
```

No inventes scripts.

Primero revisa `package.json`.

Si un script no existe, documentarlo y continuar.

Resultado requerido:

```text
todos los tests anteriores: PASS
tests nuevos: PASS
hash regression: PASS
integrated audit: PASS
lint: exit 0
build: exit 0
pipeline: GREEN
```

El total debe ser superior o igual a 940.

No establezcas un incremento artificial.

---

# 41. Estado Git

El workspace era sucio antes de esta subfase.

Debes registrar:

```bash
git status --short
git diff --stat
git diff --name-only
```

Crear un inventario de archivos tocados específicamente por 2.3.4.6.

No atribuir el diff global completo a esta fase.

No ejecutar:

```bash
git add .
git commit
git push
git tag
git reset --hard
git clean -fd
git checkout -- .
```

No eliminar archivos no relacionados.

---

# 42. Informe de auditoría final

Crear:

```text
reports/trabajo/Fase2.3.4.6_hardening_integrated_audit_reporte.md
```

Debe contener:

```text
1. Resumen ejecutivo
2. Alcance
3. Estado Git
4. Baseline inicial
5. Documentos auditados
6. Arquitectura final
7. Mapa de dependencias
8. Componentes auditados
9. Hallazgos
10. Hallazgos corregidos
11. Hallazgos aceptados
12. Deuda técnica
13. Auditoría de versionado
14. Auditoría de identidad
15. Auditoría de descriptor
16. Auditoría de serialización
17. Auditoría de hashes
18. Auditoría de integridad
19. Auditoría de comparación
20. Auditoría de lineage
21. Auditoría de provenance
22. Auditoría de inmutabilidad
23. Auditoría de errores
24. Auditoría de exports
25. Auditoría de side effects
26. Auditoría de complejidad
27. Auditoría documental
28. Correcciones realizadas
29. Archivos creados
30. Archivos modificados
31. Tests agregados
32. Test integrado
33. Tests focalizados
34. Suite completa
35. Lint
36. Build
37. Checks arquitectónicos
38. Warnings
39. Hash regression
40. Riesgos residuales
41. Fuera de alcance
42. Preparación para fase siguiente
43. Veredicto final
```

No inventes resultados.

---

# 43. Punto de control consolidado

Crear:

```text
Fase_2.3.4_cerrada.md
```

Debe ser un documento completo de reanudación.

Incluir:

```text
1. Proyecto
2. Fecha
3. Propósito
4. Estado general
5. Baseline final
6. Arquitectura implementada
7. Componentes por subfase
8. APIs públicas
9. Contratos científicos
10. Versionado
11. Identidad
12. Serialización canónica
13. Hashing
14. Integridad
15. Comparación
16. Lineage
17. Provenance
18. Inmutabilidad
19. Errores
20. Orden canónico
21. Políticas vigentes
22. Decisiones irreversibles
23. Bugs corregidos
24. Estado de validación
25. Warnings conocidos
26. Estado Git
27. Riesgos
28. Pendientes
29. Fuera de alcance
30. Próxima fase recomendada
31. Prompt de reanudación
32. Veredicto final
```

---

# 44. Próxima fase recomendada

Según el punto de control original de la Fase 2.3.3, la siguiente fase prevista después de cerrar 2.3.4 es:

> **Fase 2.3.5 — Grouped Temporal Dataset Splitting**

Debe reutilizar:

```text
GroupedTemporalSplit
leakage detector
PairedBootstrap
agrupación por spin
separación temporal
reproducibilidad
```

No implementar nada de la Fase 2.3.5 durante este cierre.

Solo documentar la recomendación.

---

# 45. Criterios de aceptación

La Fase 2.3.4.6 solo puede cerrarse si:

* [ ] se verificó el baseline;
* [ ] se auditaron todas las subfases;
* [ ] se inspeccionó la arquitectura real;
* [ ] se validaron dependencias;
* [ ] no existen ciclos críticos;
* [ ] versionado está validado;
* [ ] identidad está validada;
* [ ] descriptor está validado;
* [ ] serialización canónica está validada;
* [ ] hashes están preservados;
* [ ] integridad está validada;
* [ ] comparación está validada;
* [ ] lineage está validado;
* [ ] provenance está validada;
* [ ] inmutabilidad está validada;
* [ ] errores tipados están validados;
* [ ] exports están validados;
* [ ] side effects están descartados;
* [ ] tests débiles relevantes fueron corregidos;
* [ ] existe prueba integrada;
* [ ] datasets válidos son aceptados;
* [ ] datasets corruptos son detectados;
* [ ] datasets equivalentes se clasifican correctamente;
* [ ] datasets divergentes se clasifican correctamente;
* [ ] lineage contradictorio es rechazado;
* [ ] inputs permanecen intactos;
* [ ] no se duplicó hashing;
* [ ] no se duplicó serialización;
* [ ] no se duplicó integrity;
* [ ] no se duplicó comparison;
* [ ] documentación fue normalizada;
* [ ] discrepancia `Fase5.6.1` fue documentada;
* [ ] puntos de control faltantes fueron creados;
* [ ] suite completa PASS;
* [ ] lint limpio;
* [ ] build OK;
* [ ] checks arquitectónicos disponibles PASS;
* [ ] informe final creado;
* [ ] `Fase_2.3.4_cerrada.md` creado;
* [ ] pipeline GREEN.

---

# 46. Veredicto esperado

Si todos los criterios se cumplen:

```text
FASE 2.3.4.6: COMPLETADA
FASE 2.3.4: CERRADA

DATASET VERSIONING: VALIDADO
SCIENTIFIC IDENTITY: VALIDADA
OPERATIONAL IDENTITY: VALIDADA
SNAPSHOT DESCRIPTOR: VALIDADO
CANONICAL SERIALIZATION: VALIDADA
HASH REGRESSION: VALIDADA
DATASET INTEGRITY: VALIDADA
DATASET COMPARISON: VALIDADA
DATASET LINEAGE: VALIDADO
PROVENANCE: VALIDADA
INMUTABILIDAD: VALIDADA
ERRORS TYPED: VALIDADOS
INTEGRATED AUDIT: PASS

PERSISTENCIA: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
DESERIALIZACIÓN: NO IMPLEMENTADA
MIGRACIÓN: NO IMPLEMENTADA
AUTOMATIC MERGE: NO IMPLEMENTADO
AUTOMATIC REPAIR: NO IMPLEMENTADA
ENTRENAMIENTO: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA

PIPELINE: GREEN
```

Si algún criterio crítico falla:

```text
FASE 2.3.4.6: PENDIENTE
FASE 2.3.4: NO CERRADA
```

Debe indicar:

* hallazgo;
* severidad;
* componente afectado;
* pruebas afectadas;
* riesgo;
* acción pendiente.

---

# 47. Secuencia de ejecución

Trabaja estrictamente en este orden:

```text
1. Leer puntos de control.
2. Leer informes y notas técnicas.
3. Identificar discrepancias documentales.
4. Inspeccionar Git.
5. Inventariar código y tests.
6. Ejecutar baseline.
7. Crear nota técnica de auditoría.
8. Auditar dependencias.
9. Auditar versionado.
10. Auditar identidad.
11. Auditar descriptor.
12. Auditar serialización.
13. Auditar hashes.
14. Auditar integridad.
15. Auditar comparación.
16. Auditar lineage.
17. Auditar provenance.
18. Auditar inmutabilidad.
19. Auditar errores.
20. Auditar exports.
21. Auditar side effects.
22. Auditar complejidad.
23. Auditar documentación.
24. Clasificar hallazgos.
25. Corregir hallazgos autorizados.
26. Crear o completar tests.
27. Crear prueba integrada.
28. Ejecutar tests focalizados.
29. Corregir regresiones.
30. Ejecutar suite completa.
31. Ejecutar lint.
32. Ejecutar build.
33. Ejecutar checks arquitectónicos disponibles.
34. Revisar diff acotado.
35. Crear inventario de archivos.
36. Normalizar documentación.
37. Crear informe final.
38. Crear `Fase_2.3.4_cerrada.md`.
39. Mostrar veredicto.
```

---

# 48. Instrucción final

Trabaja de forma autónoma, conservadora, auditable y verificable.

No pidas confirmación para decisiones menores que puedan resolverse inspeccionando el repositorio.

Ante ambigüedades:

1. prioriza contratos existentes;
2. verifica antes de cambiar;
3. no amplíes alcance;
4. preserva hashes;
5. preserva schemas;
6. preserva compatibilidad;
7. separa ciencia de operación;
8. no repares silenciosamente;
9. no infieras lineage sin evidencia;
10. documenta discrepancias;
11. añade pruebas;
12. minimiza cambios.

No declares la Fase 2.3.4 cerrada únicamente porque la suite está verde.

Debes demostrar:

```text
arquitectura coherente
+
hashes preservados
+
integridad verificable
+
comparación correcta
+
lineage justificable
+
documentación consistente
+
suite completa en verde
=
FASE 2.3.4 CERRADA
```

Comienza ahora.
