# PROMPT MAESTRO — FASE 2.3.4.1

## Dataset Version, Scientific Identity and Snapshot Descriptor

Actúa como **arquitecto principal de software, ingeniero senior de dominio y revisor científico** del proyecto **Roulette Tracker Pro**.

Tu tarea es inspeccionar el repositorio, diseñar, implementar, probar y documentar exclusivamente la:

> **Fase 2.3.4.1 — Dataset Version, Scientific Identity and Snapshot Descriptor**

No debes implementar las siguientes subfases ni anticipar sus responsabilidades.

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

Punto de control obligatorio:

```text
Fase_2.3.3_cerrada.md
```

Antes de modificar cualquier archivo, localiza y lee completamente el punto de control y los informes técnicos relacionados con las fases:

```text
2.3.1
2.3.1.1
2.3.2
2.3.3
```

No repitas esas fases.

No reviertas decisiones ya cerradas.

---

# 2. Estado técnico esperado

El baseline informado al cierre de la Fase 2.3.3 es:

```text
FASE 2.3.3: COMPLETADA
TESTS: 832/832 PASS
ARCHIVOS DE TEST: 54
TESTS HISTORICAL-EVIDENCE: 198/198 PASS
LINT: 0 warnings
BUILD: OK
DEPENDENCIAS NUEVAS: ninguna
PIPELINE: GREEN
```

No asumas que el baseline continúa válido.

Debes comprobarlo antes de implementar.

---

# 3. Cadena científica existente

La arquitectura vigente transforma:

```text
ConsensusOutput
      │
      ▼
ConsensusToPredictionMapper
      │
      ▼
PredictionRecord
      │
      ▼
SpinOutcomeRecord
      │
      ▼
CalibrationObservation
      │
      ▼
HistoricalCalibrationDataset
```

La Fase 2.3.4.1 comienza desde:

```text
HistoricalCalibrationDataset
```

No debes modificar el significado científico de los componentes anteriores.

---

# 4. Objetivo general

Incorporar contratos de dominio que permitan representar de forma explícita:

1. la versión de un dataset;
2. su identidad científica y operativa;
3. la descripción auditable de un snapshot;
4. las relaciones básicas de procedencia entre snapshots;

sin implementar todavía:

* verificación completa de integridad;
* serialización pública;
* comparación avanzada;
* persistencia;
* exportación;
* entrenamiento;
* selección o promoción de modelos.

La implementación debe establecer una base estable para las siguientes subfases de la Fase 2.3.4.

---

# 5. Alcance obligatorio

Implementa, como mínimo, los siguientes contratos conceptuales.

Los nombres finales pueden ajustarse únicamente si la arquitectura real del repositorio demuestra que existe una convención diferente claramente establecida.

## 5.1 `DatasetVersion`

Crear un Value Object inmutable que represente una versión explícita del contrato o artefacto dataset.

Debe modelar como mínimo:

```text
major
minor
patch
```

Debe proporcionar una representación canónica:

```text
major.minor.patch
```

Ejemplo:

```text
1.0.0
```

### Reglas mínimas

* `major`, `minor` y `patch` deben ser enteros.
* No pueden ser negativos.
* No deben aceptar `NaN`.
* No deben aceptar `Infinity`.
* No deben aceptar coerción silenciosa de strings.
* El objeto debe ser profundamente inmutable.
* Su representación textual debe ser determinista.
* La igualdad debe depender de sus componentes.
* No debe depender de timestamps.
* No debe generar IDs.
* No debe usar estado global.
* No debe usar `Math.random()`.
* No debe usar `new Date()` internamente.

### Capacidades esperadas

Evaluar e implementar, si son coherentes con el estilo actual:

```text
DatasetVersion.create(...)
DatasetVersion.parse(...)
DatasetVersion.equals(...)
DatasetVersion.compare(...)
DatasetVersion.toString()
DatasetVersion.toJSON()
```

No introduzcas SemVer externo ni dependencias nuevas salvo que exista una necesidad demostrable y aprobada por la arquitectura actual.

Preferir implementación local mínima, explícita y testeable.

---

## 5.2 Política de compatibilidad de versión

Implementar una política mínima y explícita, sin construir todavía un motor completo de migraciones.

Debe distinguir al menos:

```text
IDENTICAL
BACKWARD_COMPATIBLE
FORWARD_COMPATIBLE
INCOMPATIBLE
```

Sin embargo, no inventes reglas arbitrarias.

Antes de implementarla:

1. inspecciona las convenciones actuales de `schemaVersion`;
2. identifica cómo se versionan `CalibrationObservation` y `HistoricalCalibrationDataset`;
3. documenta la relación entre:

   * `DatasetVersion`;
   * `schemaVersion`;
   * `observationSchemaVersion`.

La propuesta por defecto es:

```text
mismo major:
    puede ser compatible según minor/patch

major diferente:
    incompatible por defecto
```

Pero esta regla debe validarse contra el diseño existente antes de consolidarse.

No implementes migración automática.

No reinterpretar datos históricos.

No modificar observaciones.

---

## 5.3 `DatasetIdentity`

Crear un Value Object profundamente inmutable que represente la identidad declarada de un dataset.

Debe distinguir claramente:

### Identidad científica

Basada principalmente en:

```text
contentHash
```

### Identidad operativa

Basada en elementos como:

```text
datasetId
manifestHash
createdAt
```

El contrato debe incluir, según corresponda:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

### Reglas mínimas

* No recalcular hashes dentro de `DatasetIdentity`.
* No inventar hashes.
* No aceptar hashes vacíos.
* Validar el formato de hash según la convención real del repositorio.
* Reutilizar la implementación oficial existente de hashing.
* No duplicar SHA-256.
* No duplicar serialización canónica.
* No usar igualdad basada solamente en `datasetId`.
* No usar igualdad basada en timestamps.
* No mezclar equivalencia científica con equivalencia operativa.
* Mantener inmutabilidad profunda.

### Métodos o funciones esperadas

Evaluar, según convenciones existentes:

```text
isScientificallyEquivalentTo(...)
isOperationallyEquivalentTo(...)
equals(...)
toJSON()
```

Debe quedar explícito que:

```text
dos snapshots operativamente distintos
pueden contener la misma evidencia científica
```

Por lo tanto:

```text
mismo contentHash
```

puede significar equivalencia científica aunque existan:

```text
datasetId diferentes
createdAt diferentes
manifestHash diferentes
```

---

## 5.4 `DatasetSnapshotDescriptor`

Crear un contrato inmutable que describa un snapshot sin reemplazar a `HistoricalCalibrationDataset`.

Este descriptor no debe duplicar todas las observaciones.

Debe referenciar o representar únicamente información descriptiva y auditable.

Debe incluir, según la arquitectura real:

```text
identity
createdAt
period
manifest
statistics
policies
filters
provenance
lineage
metadata
```

No todos los campos deben ser obligatorios si el contrato existente demuestra otra necesidad, pero cualquier opcionalidad debe ser explícita.

### Reglas mínimas

* Debe ser profundamente inmutable.
* No debe contener arrays mutables.
* No debe modificar el dataset de origen.
* No debe calcular estadísticas nuevas.
* No debe recalcular hashes.
* No debe persistir datos.
* No debe exportar datos.
* No debe acceder al filesystem.
* No debe acceder a red.
* No debe leer reloj global.
* `createdAt` debe recibirse explícitamente.
* Toda identidad debe recibirse o construirse mediante dependencias explícitas.
* La metadata debe pasar por las utilidades seguras existentes.

### Procedencia

El descriptor debe permitir representar procedencia básica como:

```text
sourceDatasetId
sourceContentHash
parentDatasetVersion
assemblyReason
transformationType
```

No debes crear todavía un grafo completo de lineage.

Solo debes introducir los contratos mínimos que permitan ampliar la funcionalidad en la Subfase 2.3.4.5.

---

## 5.5 Factory o builder de descriptor

Si es coherente con la arquitectura existente, crear una factory o builder de aplicación como:

```text
DatasetSnapshotDescriptorFactory
```

o:

```text
BuildDatasetSnapshotDescriptorUseCase
```

Su responsabilidad debe ser limitada:

```text
HistoricalCalibrationDataset
        ↓
DatasetIdentity
        ↓
DatasetSnapshotDescriptor
```

### Restricciones

* No debe persistir.
* No debe exportar.
* No debe mutar el dataset.
* No debe recalcular contenido científico salvo que el contrato existente lo requiera explícitamente.
* Debe reutilizar `datasetId`, `contentHash`, `manifestHash`, versiones, periodo, estadísticas y manifiesto existentes.
* Debe recibir timestamps, IDs y dependencias externas por inyección.
* Debe mantener construcción all-or-nothing.
* Los errores deben ser tipados.

No crees esta capa si solo añade una abstracción vacía. Justifica su inclusión o exclusión en el informe final.

---

# 6. Separaciones conceptuales obligatorias

La implementación debe mantener separadas las siguientes nociones.

## 6.1 Versión del artefacto

```text
DatasetVersion
```

Representa la evolución controlada del dataset o snapshot.

## 6.2 Versión del schema del dataset

```text
schemaVersion
```

Representa el contrato estructural de `HistoricalCalibrationDataset`.

## 6.3 Versión del schema de observación

```text
observationSchemaVersion
```

Representa el contrato de `CalibrationObservation`.

No combines estas tres versiones en un único string sin semántica explícita.

---

# 7. Invariantes científicas que deben preservarse

Toda implementación debe respetar:

1. modularidad absoluta;
2. separación entre dominio, aplicación e infraestructura;
3. reproducibilidad;
4. determinismo;
5. inmutabilidad profunda;
6. prevención de data leakage;
7. separación entre captura, dataset, entrenamiento e inferencia;
8. asociación por `spinId`;
9. IDs inyectados;
10. timestamps inyectados;
11. ausencia de `Math.random()`;
12. ausencia de relojes globales en contratos científicos;
13. serialización canónica oficial;
14. SHA-256 oficial;
15. ausencia de efectos secundarios ocultos;
16. `IdentityCalibration` como default;
17. prohibición de promoción con datos sintéticos.

No modifiques `IdentityCalibration`.

No modifiques probabilidades calibradas.

No agregues lógica de entrenamiento.

---

# 8. Decisiones de la Fase 2.3.3 que no pueden romperse

El dataset actual mantiene:

```text
duplicatePolicy = REJECT
```

```text
invalidObservationPolicy = REJECT_DATASET
```

```text
unsupportedSchemaPolicy = REJECT_DATASET
```

La política temporal es inclusiva:

```text
from <= timestamp <= to
```

La cronología exige:

```text
predictionCreatedAt <= outcomeRecordedAt
```

El orden canónico vigente es:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

El `contentHash` representa el contenido científico y excluye:

```text
datasetId
createdAt
```

El `manifestHash` representa el manifiesto operativo completo.

No cambies estas reglas en esta subfase.

---

# 9. Fuera de alcance

Está estrictamente prohibido implementar en esta subfase:

* `CanonicalDatasetSerializer` público completo;
* `DatasetIntegrityVerifier`;
* verificación completa de corrupción;
* comparación avanzada de datasets;
* grafo completo de lineage;
* migraciones automáticas;
* persistencia durable;
* SQLite;
* DuckDB;
* PostgreSQL;
* filesystem snapshots;
* almacenamiento remoto;
* CSV;
* JSONL;
* Parquet;
* Arrow;
* entrenamiento;
* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* selección de modelos;
* ranking de calibradores;
* `PromotionPolicy`;
* UI;
* captura productiva;
* integración automática con `SpinManager`;
* cambios en `ConsensusEngine`;
* cambios productivos en `ProbabilityCalibrator`.

Si detectas que alguna capacidad futura es necesaria, documenta el requerimiento, pero no la implementes.

---

# 10. Inspección inicial obligatoria

Antes de editar código, ejecuta y registra:

```bash
cd /home/shared/lab_vito

pwd
git status --short
git branch --show-current
git log -1 --oneline
git tag --list | tail -n 20
```

Después inspecciona:

```bash
find src/historical-evidence -maxdepth 4 -type f | sort
find tests/historical-evidence -maxdepth 4 -type f | sort
```

Localiza también:

```text
HistoricalCalibrationDataset
DatasetManifest
DatasetStatistics
DatasetAssemblyOptions
canonicalHashSync
deepFreeze
metadata utilities
error classes
schemaVersion
observationSchemaVersion
```

Usa búsquedas seguras, por ejemplo:

```bash
grep -R "class HistoricalCalibrationDataset\|function HistoricalCalibrationDataset" -n src tests
grep -R "canonicalHashSync" -n src tests
grep -R "schemaVersion" -n src/historical-evidence tests/historical-evidence
grep -R "deepFreeze" -n src/historical-evidence tests/historical-evidence
```

No asumas paths ni nombres de archivos antes de inspeccionar.

---

# 11. Validación del baseline

Antes de modificar código, ejecuta:

```bash
npm run test
npm run lint
npm run build
npx vitest run tests/historical-evidence/
```

Registra resultados reales.

Si el baseline falla:

1. no ocultes el fallo;
2. no atribuyas el fallo a esta fase;
3. documenta el estado;
4. identifica si es ambiental o preexistente;
5. no realices cambios destructivos para forzar verde.

La implementación solo debe continuar si es posible distinguir claramente los fallos preexistentes de los introducidos por esta fase.

---

# 12. Diseño previo obligatorio

Antes de escribir código, genera una nota técnica provisional con:

```text
1. arquitectura encontrada;
2. convenciones de Value Objects;
3. estrategia de errores;
4. estrategia de inmutabilidad;
5. formato actual de versiones;
6. formato actual de hashes;
7. relación entre datasetVersion, schemaVersion y observationSchemaVersion;
8. archivos que se crearán;
9. archivos que se modificarán;
10. riesgos de compatibilidad;
11. criterios de aceptación.
```

No modifiques archivos productivos hasta completar esta evaluación.

---

# 13. Estrategia de errores

Reutiliza el sistema de errores tipados existente.

Si no existe un error adecuado, crea errores específicos, por ejemplo:

```text
InvalidDatasetVersionError
InvalidDatasetIdentityError
InvalidSnapshotDescriptorError
IncompatibleDatasetVersionError
```

Los nombres son orientativos.

Evita:

```text
throw new Error("invalid")
```

cuando el proyecto ya utiliza errores de dominio tipados.

Los errores deben:

* ser deterministas;
* incluir contexto seguro;
* no exponer objetos mutables;
* no ocultar la causa;
* permitir tests exactos.

---

# 14. Estrategia de inmutabilidad

Reutiliza las utilidades vigentes.

No crees una segunda implementación de `deepFreeze`.

Comprueba explícitamente:

* objeto raíz congelado;
* objetos anidados congelados;
* arrays congelados;
* metadata congelada;
* provenance congelada;
* lineage congelado;
* serialización sin referencias mutables.

Los tests deben intentar mutaciones reales.

---

# 15. Estrategia de pruebas

Crear pruebas focalizadas y exhaustivas para cada contrato.

## 15.1 Tests de `DatasetVersion`

Cubrir como mínimo:

* creación válida;
* versión `0.0.0`;
* valores negativos;
* valores decimales;
* strings numéricos;
* `NaN`;
* `Infinity`;
* `null`;
* `undefined`;
* ausencia de campos;
* igualdad;
* desigualdad;
* comparación;
* parse válido;
* parse inválido;
* serialización;
* representación canónica;
* inmutabilidad;
* determinismo.

## 15.2 Tests de compatibilidad

Cubrir:

* versiones idénticas;
* cambio patch;
* cambio minor;
* cambio major;
* inputs inválidos;
* simetría o asimetría explícita;
* determinismo;
* comportamiento documentado.

No fuerces simetría si `BACKWARD_COMPATIBLE` y `FORWARD_COMPATIBLE` son direccionales.

## 15.3 Tests de `DatasetIdentity`

Cubrir:

* creación válida;
* hash vacío;
* hash malformado;
* versiones inválidas;
* equivalencia científica;
* equivalencia operativa;
* mismo `contentHash` con distinto `datasetId`;
* mismo `datasetId` con distinto `contentHash`;
* distinto `manifestHash`;
* serialización;
* inmutabilidad;
* ausencia de cálculo de hashes;
* ausencia de reloj global.

## 15.4 Tests de `DatasetSnapshotDescriptor`

Cubrir:

* descriptor válido;
* identidad obligatoria;
* timestamp explícito;
* periodo;
* estadísticas;
* manifiesto;
* filtros;
* políticas;
* metadata;
* provenance;
* lineage básico;
* datos opcionales;
* datos inválidos;
* deep freeze;
* no mutación del dataset original;
* no duplicación de observaciones;
* serialización determinista;
* construcción all-or-nothing.

## 15.5 Tests de integración controlada

Construir un `HistoricalCalibrationDataset` usando las APIs existentes y derivar:

```text
DatasetIdentity
DatasetSnapshotDescriptor
```

Comprobar:

* preservación de `contentHash`;
* preservación de `manifestHash`;
* preservación de versiones;
* preservación de estadísticas;
* preservación del periodo;
* ausencia de mutaciones;
* equivalencia científica correcta.

---

# 16. Pruebas de regresión obligatorias

Durante la implementación ejecuta frecuentemente:

```bash
npx vitest run tests/historical-evidence/
```

Al finalizar ejecuta:

```bash
npm run test
npm run lint
npm run build
npx vitest run tests/historical-evidence/
```

El resultado final debe ser:

```text
tests anteriores: todos PASS
tests nuevos: todos PASS
lint: 0 warnings
build: OK
```

El número total final debe ser igual o superior al baseline.

No elimines pruebas para conseguir verde.

No debilites assertions.

No uses `.skip`, `.only` ni exclusiones permanentes.

---

# 17. Calidad de implementación

La solución debe cumplir:

* nombres explícitos;
* responsabilidades únicas;
* funciones pequeñas;
* sin dependencias circulares;
* sin duplicación;
* sin abstracciones especulativas innecesarias;
* APIs mínimas;
* contratos documentados;
* exports públicos controlados;
* compatibilidad con CommonJS o ESM según el repositorio;
* estilo consistente con el código existente;
* cero side effects al importar módulos.

No introduzcas TypeScript si el módulo actual está implementado en JavaScript.

No migres archivos fuera del alcance.

---

# 18. Barrel exports

Actualiza únicamente los exports necesarios.

Inspecciona:

```text
src/historical-evidence/index.js
```

y los índices internos existentes.

No exportes helpers privados.

No rompas imports actuales.

Agrega pruebas de exports públicos si el proyecto las utiliza.

---

# 19. Documentación técnica

Documenta:

1. diferencia entre versión de dataset y versión de schema;
2. identidad científica;
3. identidad operativa;
4. equivalencia científica;
5. equivalencia operativa;
6. rol de `contentHash`;
7. rol de `manifestHash`;
8. límites del descriptor;
9. procedencia básica;
10. fuera de alcance.

La documentación no debe afirmar que existe verificación completa de integridad, porque eso pertenece a una subfase posterior.

---

# 20. Informe de implementación

Crear un informe final en el directorio de reportes utilizado por el repositorio.

Nombre sugerido:

```text
FASE_2.3.4.1_DATASET_VERSION_IDENTITY_SNAPSHOT_REPORT.md
```

Si existe una convención distinta, respétala.

El informe debe incluir:

```text
1. Resumen ejecutivo
2. Estado inicial del repositorio
3. Baseline real
4. Arquitectura inspeccionada
5. Decisiones de diseño
6. Componentes implementados
7. Archivos creados
8. Archivos modificados
9. Contratos públicos
10. Invariantes
11. Política de versiones
12. Identidad científica versus operativa
13. Estrategia de inmutabilidad
14. Estrategia de errores
15. Pruebas agregadas
16. Resultados de pruebas
17. Resultado de lint
18. Resultado de build
19. Riesgos
20. Pendientes
21. Elementos fuera de alcance
22. Recomendación para la Subfase 2.3.4.2
23. Veredicto final
```

No escribas resultados ficticios.

Incluye salidas reales de los comandos.

---

# 21. Actualización del punto de control

No sobrescribas:

```text
Fase_2.3.3_cerrada.md
```

Genera, si la fase queda completamente verde, un nuevo punto de control:

```text
Fase_2.3.4.1_cerrada.md
```

Debe contener:

* estado técnico;
* baseline actualizado;
* componentes implementados;
* decisiones arquitectónicas;
* contratos nuevos;
* invariantes;
* archivos relevantes;
* riesgos;
* pendientes;
* próxima subfase recomendada;
* comandos de reanudación.

Si la fase no queda verde, genera:

```text
Fase_2.3.4.1_pendiente.md
```

No declares la fase cerrada si existen fallos.

---

# 22. Git y seguridad operacional

No ejecutes automáticamente:

```bash
git commit
git push
git tag
git reset --hard
git clean -fd
git checkout -- .
```

No borres archivos no relacionados.

No reformatees todo el repositorio.

No modifiques configuración global.

No instales dependencias sin justificación crítica.

Al finalizar, muestra:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence
```

Si el diff completo es demasiado extenso, guarda una copia en reportes y presenta el resumen.

---

# 23. Criterios de aceptación

La Subfase 2.3.4.1 solo puede considerarse completada si:

* [ ] el baseline inicial fue comprobado;
* [ ] `DatasetVersion` existe y está probado;
* [ ] la política mínima de compatibilidad está documentada y probada;
* [ ] `DatasetIdentity` existe y está probado;
* [ ] la identidad científica está separada de la operativa;
* [ ] `DatasetSnapshotDescriptor` existe y está probado;
* [ ] timestamps e IDs son inyectados;
* [ ] no existe uso nuevo de `Math.random()`;
* [ ] no existe reloj global nuevo;
* [ ] no se duplicó SHA-256;
* [ ] no se duplicó serialización canónica;
* [ ] no se modificó el orden canónico;
* [ ] no se modificaron políticas de dataset;
* [ ] no se modificó `IdentityCalibration`;
* [ ] no se implementó persistencia;
* [ ] no se implementaron exportadores;
* [ ] no se implementó entrenamiento;
* [ ] no se implementó promoción;
* [ ] tests focalizados PASS;
* [ ] suite completa PASS;
* [ ] lint sin warnings;
* [ ] build OK;
* [ ] informe final creado;
* [ ] punto de control generado;
* [ ] no hay regresiones.

---

# 24. Veredicto esperado

Si todos los criterios se cumplen, el informe debe terminar con:

```text
FASE 2.3.4.1: COMPLETADA
DATASET VERSION: IMPLEMENTADO
SCIENTIFIC IDENTITY: IMPLEMENTADA
OPERATIONAL IDENTITY: IMPLEMENTADA
SNAPSHOT DESCRIPTOR: IMPLEMENTADO
VERSION COMPATIBILITY: IMPLEMENTADA
PERSISTENCIA: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
INTEGRITY VERIFIER: NO IMPLEMENTADO
ENTRENAMIENTO: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA
PIPELINE: GREEN
```

Si algún criterio falla:

```text
FASE 2.3.4.1: PENDIENTE
```

y debes explicar exactamente qué falta.

---

# 25. Secuencia de ejecución

Ejecuta el trabajo en este orden:

```text
1. Leer punto de control.
2. Inspeccionar Git.
3. Inspeccionar arquitectura real.
4. Ejecutar baseline.
5. Elaborar diseño previo.
6. Implementar DatasetVersion.
7. Implementar compatibilidad mínima.
8. Implementar DatasetIdentity.
9. Implementar DatasetSnapshotDescriptor.
10. Implementar factory/use case solo si aporta valor real.
11. Actualizar exports.
12. Crear tests focalizados.
13. Ejecutar tests focalizados.
14. Corregir defectos.
15. Ejecutar suite completa.
16. Ejecutar lint.
17. Ejecutar build.
18. Revisar diff.
19. Crear informe final.
20. Crear punto de control.
21. Mostrar resumen y veredicto.
```

---

# 26. Instrucción final

Trabaja de manera autónoma, conservadora y verificable.

No solicites confirmación para decisiones menores que puedan resolverse inspeccionando el repositorio.

Ante ambigüedades:

1. prioriza los contratos ya existentes;
2. minimiza cambios;
3. preserva compatibilidad;
4. documenta la decisión;
5. no amplíes el alcance.

No declares éxito basándote solo en inspección visual.

No declares la fase cerrada sin ejecutar los comandos de validación.

Comienza ahora.
