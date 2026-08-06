# PROMPT MAESTRO — FASE 2.3.4.2

## Canonical Dataset Serialization

Actúa como **arquitecto principal de software, ingeniero senior de dominio y revisor científico** del proyecto **Roulette Tracker Pro**.

Tu tarea es inspeccionar el repositorio, diseñar, implementar, probar y documentar exclusivamente la:

> **Fase 2.3.4.2 — Canonical Dataset Serialization**

El objetivo de esta subfase es formalizar una representación canónica, pública, determinista, estable y auditable de los datasets históricos y sus descriptores.

No debes implementar persistencia, exportadores de formato, verificación integral de corrupción, entrenamiento, selección de modelos ni promoción de calibradores.

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

Puntos de control obligatorios:

```text
Fase_2.3.3_cerrada.md
Fase_2.3.4.1_cerrada.md
```

Informe de referencia de la subfase anterior:

```text
reports/trabajo/Fase2.3.4.1_dataset_version_identity_snapshot_reporte.md
```

Nota técnica de referencia:

```text
reports/trabajo/Fase2.3.4.1_nota_tecnica_diseno.md
```

Antes de modificar código:

1. localiza y lee completamente los puntos de control;
2. revisa el informe final de la Fase 2.3.4.1;
3. revisa la nota técnica de diseño;
4. inspecciona el código realmente implementado;
5. no asumas que los nombres o paths coinciden exactamente con este prompt.

No repitas las fases anteriores.

No reviertas decisiones cerradas.

---

# 2. Baseline esperado

El cierre aprobado de la Fase 2.3.4.1 informó:

```text
FASE 2.3.4.1: CERRADA
TESTS: 919/919 PASS
ARCHIVOS DE TEST: 59
TESTS FOCALIZADOS NUEVOS: 87/87 PASS
LINT: 0 problemas
BUILD: OK
PIPELINE: GREEN
```

Componentes ya implementados:

```text
DatasetVersion
DatasetVersionPolicy
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory
```

No asumas que el baseline sigue vigente.

Debes comprobarlo antes de modificar código.

---

# 3. Arquitectura científica existente

La cadena vigente es:

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
      │
      ▼
DatasetIdentity
      │
      ▼
DatasetSnapshotDescriptor
```

La Fase 2.3.4.2 debe añadir una capa de representación canónica:

```text
HistoricalCalibrationDataset
      │
      ▼
CanonicalDatasetSerializer
      │
      ▼
Canonical Dataset Representation
```

Y, de forma separada:

```text
DatasetSnapshotDescriptor
      │
      ▼
CanonicalDescriptorSerializer
      │
      ▼
Canonical Descriptor Representation
```

Ambos flujos deben permanecer separados cuando representen semánticas diferentes.

---

# 4. Objetivo general

Implementar una infraestructura de serialización canónica que permita transformar:

```text
HistoricalCalibrationDataset
DatasetSnapshotDescriptor
DatasetIdentity
DatasetVersion
```

en representaciones:

* deterministas;
* estables;
* explícitamente versionadas;
* independientes del orden de inserción de propiedades;
* adecuadas para hashing;
* adecuadas para auditoría;
* adecuadas para futura persistencia;
* adecuadas para futuros exportadores;
* libres de efectos secundarios.

La serialización canónica debe convertirse en el origen oficial de representación de snapshots científicos.

No debe convertirse todavía en un mecanismo de almacenamiento.

---

# 5. Definición de serialización canónica

Para esta fase, serialización canónica significa:

```text
mismo contenido lógico
+
mismas reglas de serialización
=
misma secuencia exacta de caracteres o bytes
```

La salida debe ser estable incluso cuando:

* las propiedades de entrada se inserten en diferente orden;
* las observaciones se entreguen originalmente en diferente orden, siempre que el dataset aplique el orden canónico oficial;
* los objetos provengan de instancias diferentes;
* la metadata se construya con diferente orden de propiedades;
* el proceso se ejecute varias veces;
* el entorno de ejecución sea el mismo bajo el contrato soportado.

No debes afirmar compatibilidad entre runtimes, motores o versiones de Node.js distintas sin demostrarla y documentarla.

---

# 6. Principio de única fuente de verdad

El repositorio ya dispone de infraestructura usada por:

```text
canonicalHashSync
```

Antes de implementar cualquier serializador:

1. localiza la serialización canónica actual;
2. inspecciona su API;
3. identifica su semántica;
4. revisa qué tipos soporta;
5. revisa sus reglas de ordenamiento;
6. revisa su tratamiento de objetos, arrays, fechas, números y valores inválidos;
7. revisa sus consumidores actuales;
8. determina si puede convertirse en una primitiva pública reutilizable.

Está prohibido crear una segunda lógica independiente que ordene propiedades o normalice valores de forma distinta.

Debe existir una única fuente de verdad para:

```text
normalización canónica
ordenamiento de propiedades
representación JSON canónica
entrada de hashing
```

Si la implementación actual está encapsulada dentro de `canonicalHashSync`, debes refactorizar conservadoramente para extraer la serialización sin alterar los hashes existentes.

Los hashes producidos antes y después de la refactorización deben ser idénticos para el mismo contenido.

---

# 7. Alcance obligatorio

Implementa, como mínimo, los siguientes contratos conceptuales.

Los nombres finales pueden adaptarse a las convenciones reales del repositorio, pero toda desviación debe justificarse en el informe.

---

## 7.1 Primitiva oficial de serialización canónica

Debe existir una función o servicio público claramente definido, por ejemplo:

```javascript
canonicalSerialize(value)
```

o:

```javascript
CanonicalSerializer.serialize(value)
```

Responsabilidad:

```text
valor lógico soportado
        ↓
representación canónica determinista
```

Debe devolver una representación textual o binaria explícita.

Preferencia inicial:

```text
string UTF-8 compatible
```

No introduzcas buffers o binarios si el repositorio no los necesita todavía.

### Reglas mínimas

* no debe mutar el input;
* no debe usar reloj global;
* no debe generar IDs;
* no debe usar `Math.random()`;
* no debe acceder al filesystem;
* no debe acceder a red;
* no debe persistir;
* debe ser determinista;
* debe tener errores tipados;
* debe rechazar tipos no soportados;
* debe distinguir arrays de objetos;
* debe preservar el orden de arrays;
* debe ordenar las propiedades de objetos mediante una regla documentada;
* debe producir la misma salida para objetos lógicamente equivalentes;
* debe manejar strings de forma segura;
* debe rechazar números no finitos;
* debe evitar coerciones silenciosas.

---

## 7.2 Modelo canónico intermedio

Antes de serializar, evalúa si es necesario construir un modelo lógico canónico intermedio.

Ejemplo conceptual:

```text
Domain Object
      ↓
Canonical Projection
      ↓
Canonical Serialization
```

Una proyección canónica puede ser apropiada para evitar serializar directamente:

* métodos;
* prototipos;
* referencias accidentales;
* campos privados;
* campos derivados no autorizados;
* propiedades operativas no incluidas en identidad científica.

Puedes implementar funciones como:

```javascript
toCanonicalDatasetProjection(dataset)
toCanonicalDescriptorProjection(descriptor)
toCanonicalIdentityProjection(identity)
```

No implementes una abstracción genérica innecesariamente compleja.

Las proyecciones deben tener propósito científico explícito.

---

## 7.3 `CanonicalDatasetSerializer`

Crear un componente específico para:

```text
HistoricalCalibrationDataset
        ↓
representación canónica del dataset
```

Debe serializar únicamente el contrato público y científico aprobado.

La representación debe incluir, según el contrato actual:

```text
schemaVersion
observationSchemaVersion
period
observations
```

También debe evaluar explícitamente si incluye:

```text
manifest
statistics
contentHash
manifestHash
datasetId
createdAt
datasetVersion
```

No decidas esto implícitamente.

Debes distinguir al menos dos vistas conceptuales:

### Vista científica

Representa la evidencia científica.

Debe ser coherente con el contenido que origina:

```text
contentHash
```

Debe excluir los campos operativos que actualmente no forman parte del contenido científico, como:

```text
datasetId
createdAt
```

cuando esa exclusión forme parte del contrato vigente.

### Vista completa del snapshot

Representa el artefacto completo, incluyendo elementos operativos y de auditoría.

Debe ser coherente con el descriptor y manifiesto.

No mezcles ambas vistas en una API ambigua.

Puedes diseñar:

```javascript
serializeScientificContent(dataset)
serializeSnapshot(dataset)
```

o una opción tipada equivalente.

No uses booleanos ambiguos como:

```javascript
serialize(dataset, true)
```

---

## 7.4 `CanonicalDescriptorSerializer`

Crear un componente para:

```text
DatasetSnapshotDescriptor
        ↓
representación canónica del descriptor
```

Debe incluir, según el contrato implementado:

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

Debe respetar:

* orden estable;
* inmutabilidad;
* diferencias entre identidad científica y operativa;
* referencias existentes;
* no duplicación de observaciones;
* ausencia de recálculo de hashes.

El descriptor serializado debe ser una descripción del snapshot, no una copia del dataset completo.

---

## 7.5 `CanonicalIdentitySerializer`

Evalúa crear un serializador explícito para:

```text
DatasetIdentity
```

o reutilizar la primitiva genérica con una proyección oficial.

Debe quedar definido el orden y contenido de:

```text
datasetId
datasetVersion
schemaVersion
observationSchemaVersion
contentHash
manifestHash
```

No debe recalcular hashes.

No debe consultar el dataset.

Solo representa la identidad ya construida.

---

## 7.6 `CanonicalSerializationOptions`

Si existen distintas vistas de serialización, implementa un contrato explícito de opciones.

Ejemplo conceptual:

```text
mode:
  SCIENTIFIC_CONTENT
  SNAPSHOT
  DESCRIPTOR
  IDENTITY
```

Las opciones deben:

* ser explícitas;
* ser inmutables;
* tener defaults documentados;
* rechazar combinaciones inválidas;
* evitar flags booleanos ambiguos;
* no permitir exclusiones arbitrarias que alteren identidad científica;
* no permitir callbacks no deterministas;
* no permitir funciones de ordenamiento externas sin control.

No agregues opciones únicamente por anticipación.

Implementa solo las necesarias en esta fase.

---

## 7.7 `CanonicalSerializationResult`

Evalúa si la salida debe encapsularse en un Value Object como:

```text
CanonicalSerializationResult
```

Podría contener:

```text
format
encoding
schemaVersion
mode
serialized
byteLength
```

No debe incluir timestamps generados automáticamente.

No debe recalcular hashes.

No debe incluir información redundante sin valor.

Si una simple string es suficiente para la arquitectura actual, no crees este objeto.

La decisión debe justificarse.

---

# 8. Contratos de representación

La fase debe documentar de forma explícita qué incluye cada representación.

---

## 8.1 Representación científica

Debe incluir exclusivamente lo necesario para representar contenido científico.

Debe alinearse con la semántica vigente de:

```text
contentHash
```

Conceptualmente:

```text
schemaVersion
observationSchemaVersion
period
observations ordenadas canónicamente
```

No debe incluir automáticamente:

```text
datasetId
createdAt
```

porque el contrato de la Fase 2.3.3 estableció que esos campos están excluidos del contenido científico.

---

## 8.2 Representación del manifiesto

Debe alinearse con la semántica de:

```text
manifestHash
```

Debe incluir el manifiesto completo con:

* identidad operativa;
* filtros;
* políticas;
* procedencia;
* conteos;
* metadata;
* configuración de ensamblaje.

No cambies qué campos forman parte del manifiesto sin una decisión arquitectónica explícita.

---

## 8.3 Representación completa del snapshot

Debe contener una representación auditable del snapshot.

Puede incluir:

```text
identity
datasetVersion
schemaVersion
observationSchemaVersion
createdAt
period
manifest
statistics
observations
contentHash
manifestHash
```

Debe quedar documentado si esta representación se usará como futuro formato lógico de persistencia.

No implementes todavía lectura, escritura ni deserialización.

---

## 8.4 Representación del descriptor

Debe incluir solo la descripción del snapshot.

No debe incluir observaciones completas salvo que la arquitectura implementada actualmente lo haga de forma explícita, lo cual debe justificarse.

---

# 9. Orden canónico de observaciones

El orden aprobado en la Fase 2.3.3 es:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

No modifiques ese orden.

El serializador debe comprobar que:

* consume las observaciones en orden canónico;
* no reordena mediante una política distinta;
* no depende del orden accidental del input;
* no usa `localeCompare()` sin estudiar sus implicaciones;
* no usa ordenamientos dependientes del locale;
* no muta el array original.

Si el dataset garantiza el orden canónico, reutiliza esa garantía.

No dupliques innecesariamente el algoritmo de ordenamiento.

Si necesitas una validación defensiva, debe reutilizar el comparador oficial existente.

---

# 10. Reglas por tipo de dato

Documenta e implementa reglas explícitas para los tipos soportados.

---

## 10.1 Strings

* usar representación JSON segura;
* preservar Unicode;
* escapar caracteres especiales correctamente;
* no normalizar Unicode silenciosamente salvo contrato explícito;
* probar caracteres acentuados, emojis y secuencias especiales.

---

## 10.2 Números

* aceptar solo números finitos;
* rechazar `NaN`;
* rechazar `Infinity`;
* rechazar `-Infinity`;
* definir tratamiento de `-0`;
* no convertir strings a números;
* no redondear silenciosamente;
* no usar notación dependiente del locale.

Debes documentar si:

```text
-0
```

se serializa como:

```text
0
```

o se rechaza.

La decisión debe ser determinista y compatible con los hashes existentes.

---

## 10.3 Booleanos

Representación canónica:

```text
true
false
```

Sin coerción.

---

## 10.4 Null

Debe existir una decisión explícita sobre:

```text
null
```

No confundas `null` con ausencia de propiedad.

---

## 10.5 Undefined

Define una política clara.

Preferencia:

```text
undefined no es serializable
```

o:

```text
propiedades undefined se rechazan
```

No elimines silenciosamente propiedades si eso puede alterar identidad.

---

## 10.6 Arrays

* preservar orden;
* serializar cada elemento mediante las mismas reglas;
* rechazar elementos no soportados;
* no ordenar arrays genéricos;
* no mutar;
* distinguir array vacío de ausencia.

---

## 10.7 Objetos

* aceptar solo objetos planos o contratos de dominio proyectados;
* ordenar propiedades mediante regla estable;
* evitar serializar prototipos;
* evitar propiedades heredadas;
* evitar getters con side effects;
* evitar símbolos salvo contrato explícito;
* evitar funciones;
* detectar referencias circulares;
* rechazar ciclos con error tipado.

---

## 10.8 Fechas

Inspecciona cómo el proyecto representa timestamps actualmente.

Preferencia:

```text
timestamps como strings ISO 8601 ya validadas
```

No conviertas automáticamente instancias `Date` salvo que el contrato existente lo permita.

No uses zona horaria local.

No llames `new Date()` para generar timestamps.

---

## 10.9 BigInt, Map, Set y tipos especiales

No agregues soporte automáticamente.

Si no están presentes en los contratos actuales, recházalos con error tipado.

No serialices mediante coerción implícita.

---

# 11. Relación con hashing

Actualmente existen:

```text
contentHash
manifestHash
canonicalHashSync
```

La nueva infraestructura debe permitir conceptualmente:

```text
canonicalSerialize(value)
        ↓
SHA-256 oficial
        ↓
hash
```

La función de hashing debe reutilizar la nueva primitiva oficial.

No cambies:

* algoritmo SHA-256;
* encoding;
* prefijos;
* formato hexadecimal;
* composición del payload;
* campos incluidos;
* orden canónico.

Debes crear pruebas de regresión que demuestren que:

```text
hash anterior = hash posterior
```

para fixtures o datasets representativos.

No recalcules los hashes almacenados en `DatasetIdentity` o `DatasetSnapshotDescriptor`.

La verificación activa de hashes pertenece a la Fase 2.3.4.3.

En esta fase solo se formaliza la representación que podrá ser verificada posteriormente.

---

# 12. Invariantes científicas obligatorias

Toda implementación debe preservar:

1. modularidad;
2. separación entre dominio, aplicación e infraestructura;
3. reproducibilidad;
4. determinismo;
5. inmutabilidad profunda;
6. separación entre identidad científica y operativa;
7. prevención de data leakage;
8. asociación por `spinId`;
9. IDs inyectados;
10. timestamps inyectados;
11. ausencia de `Math.random()`;
12. ausencia de reloj global;
13. única implementación de serialización canónica;
14. única implementación de SHA-256;
15. ausencia de efectos secundarios ocultos;
16. `IdentityCalibration` como default;
17. prohibición de promoción con datos sintéticos;
18. datasets all-or-nothing;
19. schemas explícitos;
20. orden canónico estable.

---

# 13. Decisiones anteriores que no deben modificarse

Se mantienen:

```text
duplicatePolicy = REJECT
```

```text
invalidObservationPolicy = REJECT_DATASET
```

```text
unsupportedSchemaPolicy = REJECT_DATASET
```

Política temporal:

```text
from <= timestamp <= to
```

Cronología:

```text
predictionCreatedAt <= outcomeRecordedAt
```

Orden canónico:

```text
predictionCreatedAt
→ spinId
→ predictionId
→ outcomeId
→ observationId
```

Semántica de `contentHash`:

```text
incluye:
- schemaVersion
- observationSchemaVersion
- period
- observations ordenadas

excluye:
- datasetId
- createdAt
```

Semántica de `manifestHash`:

```text
representa el manifiesto operativo completo
```

No alteres estas reglas.

---

# 14. Fuera de alcance

Está estrictamente prohibido implementar en esta subfase:

* persistencia durable;
* lectura desde disco;
* escritura en disco;
* repositorio de snapshots;
* SQLite;
* DuckDB;
* PostgreSQL;
* filesystem snapshots;
* almacenamiento remoto;
* CSV;
* JSONL;
* Parquet;
* Arrow;
* compresión;
* cifrado;
* firma digital;
* `DatasetIntegrityVerifier`;
* reparación automática;
* detección integral de corrupción;
* migración de schemas;
* deserialización;
* importación de datasets;
* comparación avanzada;
* grafo completo de lineage;
* entrenamiento;
* Brier Score;
* Log Loss;
* ECE;
* MCE;
* bootstrap;
* model selection;
* ranking de calibradores;
* `PromotionPolicy`;
* captura productiva;
* UI;
* integración automática con `SpinManager`;
* cambios productivos en `ConsensusEngine`;
* cambios productivos en `ProbabilityCalibrator`.

Si detectas una necesidad futura, documéntala, pero no la implementes.

---

# 15. Inspección inicial obligatoria

Antes de editar código, ejecuta y registra:

```bash
cd /home/shared/lab_vito

pwd
git status --short
git branch --show-current
git log -1 --oneline
git tag --list | tail -n 20
```

Inspecciona:

```bash
find src/historical-evidence -maxdepth 5 -type f | sort
find tests/historical-evidence -maxdepth 5 -type f | sort
```

Localiza:

```text
HistoricalCalibrationDataset
DatasetManifest
DatasetStatistics
DatasetIdentity
DatasetSnapshotDescriptor
DatasetSnapshotDescriptorFactory
DatasetVersion
canonicalHashSync
canonical serialization
deepFreeze
metadata utilities
chronology utilities
schemaVersion
observationSchemaVersion
```

Usa búsquedas como:

```bash
grep -R "canonicalHashSync" -n src tests
grep -R "canonical" -n src/historical-evidence src/calibration tests
grep -R "JSON.stringify" -n src/historical-evidence src/calibration tests
grep -R "contentHash" -n src/historical-evidence tests/historical-evidence
grep -R "manifestHash" -n src/historical-evidence tests/historical-evidence
grep -R "toJSON" -n src/historical-evidence tests/historical-evidence
```

También busca implementaciones paralelas o riesgosas:

```bash
grep -R "Object.keys.*sort" -n src tests
grep -R "sort()" -n src/historical-evidence src/calibration
grep -R "JSON.stringify" -n src | sort
```

No asumas rutas antes de inspeccionar.

---

# 16. Verificación del baseline

Antes de modificar código ejecuta:

```bash
npm run test
npm run lint
npm run build
npx vitest run tests/historical-evidence/
```

Registra:

* número de tests;
* número de archivos;
* warnings;
* duración;
* fallos preexistentes;
* warning de chunk si continúa presente.

Si el baseline no es:

```text
919/919 o superior
```

investiga y documenta la diferencia.

No fuerces verde mediante eliminación o debilitamiento de pruebas.

---

# 17. Nota técnica previa

Antes de modificar archivos productivos, crea una nota técnica con:

```text
1. Arquitectura encontrada
2. Implementación actual de canonicalHashSync
3. Implementación actual de canonical serialization
4. Tipos soportados
5. Reglas actuales de ordenamiento
6. Campos usados por contentHash
7. Campos usados por manifestHash
8. Riesgos de compatibilidad
9. Estrategia de refactorización
10. APIs propuestas
11. Archivos a crear
12. Archivos a modificar
13. Estrategia de errores
14. Estrategia de pruebas
15. Estrategia de regresión de hashes
16. Decisiones fuera de alcance
```

Nombre sugerido:

```text
reports/trabajo/Fase2.3.4.2_nota_tecnica_diseno.md
```

No modifiques producción antes de completar esta nota.

---

# 18. Estrategia de errores

Reutiliza el sistema de errores tipados existente.

Si es necesario, crea errores como:

```text
CanonicalSerializationError
UnsupportedCanonicalTypeError
CircularCanonicalReferenceError
InvalidCanonicalNumberError
InvalidCanonicalProjectionError
InvalidSerializationModeError
```

Los nombres son orientativos.

Los errores deben:

* heredar del error base apropiado;
* ser deterministas;
* incluir path seguro del valor problemático;
* no incluir objetos completos potencialmente sensibles;
* no mutar contexto;
* permitir assertions precisas;
* distinguir tipo no soportado de ciclo;
* distinguir proyección inválida de input inválido.

Evita mensajes genéricos como:

```text
serialization failed
```

---

# 19. Estrategia de inmutabilidad

La serialización debe ser completamente observacional.

Debe garantizar:

* no mutación del dataset;
* no mutación del descriptor;
* no mutación de observaciones;
* no mutación de metadata;
* no mutación de arrays;
* no escritura de campos temporales;
* no caching mutable oculto;
* no inserción de propiedades;
* no ordenamiento in-place.

Las pruebas deben congelar profundamente los inputs antes de serializarlos.

También deben comparar los inputs antes y después.

---

# 20. Estrategia de pruebas

Crear pruebas focalizadas y exhaustivas.

---

## 20.1 Pruebas de la primitiva canónica

Cubrir:

* `null`;
* booleanos;
* strings;
* strings vacíos;
* Unicode;
* caracteres escapados;
* números enteros;
* números decimales;
* cero;
* `-0`;
* números negativos;
* `NaN`;
* `Infinity`;
* `-Infinity`;
* arrays;
* arrays anidados;
* objetos;
* objetos anidados;
* propiedades en diferente orden;
* objetos vacíos;
* arrays vacíos;
* `undefined`;
* funciones;
* símbolos;
* BigInt;
* Map;
* Set;
* Date;
* ciclos;
* propiedades heredadas;
* getters;
* determinismo;
* igualdad byte a byte;
* no mutación.

---

## 20.2 Pruebas de orden de propiedades

Construir múltiples objetos lógicamente equivalentes con diferente orden de inserción.

La salida debe ser exactamente idéntica.

Ejemplo conceptual:

```javascript
{ b: 2, a: 1 }
{ a: 1, b: 2 }
```

Ambos deben producir la misma representación.

Probar también objetos anidados.

---

## 20.3 Pruebas de `CanonicalDatasetSerializer`

Cubrir:

* dataset válido;
* dataset vacío permitido explícitamente;
* dataset con múltiples observaciones;
* preservación del orden canónico;
* misma evidencia con distinta identidad operativa;
* diferente evidencia;
* diferentes schemas;
* periodos diferentes;
* metadata con diferente orden;
* inmutabilidad;
* serialización repetida;
* ausencia de timestamps generados;
* ausencia de recálculo de hashes;
* representación científica;
* representación completa;
* modo inválido.

---

## 20.4 Equivalencia científica

Construir dos snapshots con:

```text
datasetId diferentes
createdAt diferentes
manifestHash diferentes
contentHash iguales
misma evidencia científica
```

La representación científica debe ser idéntica.

La representación completa puede ser distinta.

Esta diferencia debe quedar probada explícitamente.

---

## 20.5 Diferencia científica

Construir datasets que difieran en:

* una observación;
* `observedOutcome`;
* `rawConsensusScore`;
* target;
* periodo;
* schemaVersion;
* observationSchemaVersion.

La representación científica debe ser distinta.

---

## 20.6 Pruebas del descriptor

Cubrir:

* descriptor válido;
* identidad;
* datasetVersion;
* createdAt;
* manifest;
* statistics;
* policies;
* filters;
* provenance;
* lineage;
* metadata;
* propiedades en diferente orden;
* deep freeze;
* representación repetida;
* no duplicación de observaciones;
* no acceso al dataset original;
* no recálculo de hashes.

---

## 20.7 Regresión de hashes

Crear fixtures representativos y comprobar que:

```text
canonicalHashSync(payload)
```

produce exactamente el mismo resultado antes y después de la refactorización.

Si es posible, registrar hashes conocidos como fixtures de regresión.

No generes expectativas dinámicamente usando la misma función bajo prueba.

Los valores esperados deben ser literales previamente calculados y revisados.

---

## 20.8 Pruebas de exports

Comprobar que las nuevas APIs públicas se exportan correctamente desde:

```text
src/historical-evidence/domain/index.js
src/historical-evidence/application/index.js
src/historical-evidence/index.js
```

o los barrels que correspondan.

No exportes helpers internos.

---

## 20.9 Pruebas anti-side-effects

Comprobar:

* importar módulos no ejecuta serialización;
* importar módulos no genera hashes;
* importar módulos no lee reloj;
* importar módulos no accede a filesystem;
* importar módulos no produce logs;
* serializar no altera inputs;
* serializar no altera prototipos.

---

# 21. Pruebas de regresión obligatorias

Durante la implementación ejecuta:

```bash
npx vitest run tests/historical-evidence/
```

También ejecuta las pruebas de calibración relacionadas con canonical hashing si están en otro directorio.

Al finalizar ejecuta:

```bash
npm run test
npm run lint
npm run build
npx vitest run tests/historical-evidence/
```

Si existen suites focalizadas adicionales para canonical hashing, ejecútalas explícitamente.

El resultado final debe ser:

```text
tests anteriores: todos PASS
tests nuevos: todos PASS
hashes anteriores: preservados
lint: 0 problemas
build: OK
pipeline: GREEN
```

No establezcas como criterio un número arbitrario de tests.

El total debe ser superior a 919 por las nuevas pruebas, pero la calidad y cobertura son más importantes que alcanzar una cifra predeterminada.

No elimines tests.

No uses `.skip`.

No uses `.only`.

No debilites assertions.

---

# 22. Calidad de implementación

La solución debe cumplir:

* API mínima;
* responsabilidad única;
* funciones pequeñas;
* nombres explícitos;
* ausencia de dependencias circulares;
* ausencia de duplicación;
* ausencia de abstracciones especulativas;
* cero efectos secundarios al importar;
* estilo consistente con el repositorio;
* documentación de contratos;
* compatibilidad con el sistema modular actual;
* cero dependencias nuevas salvo necesidad crítica demostrada.

No introduzcas TypeScript si el módulo continúa en JavaScript.

No migres módulos no relacionados.

No reformatees todo el repositorio.

---

# 23. Arquitectura recomendada

La arquitectura conceptual recomendada es:

```text
src/historical-evidence/
├── domain/
│   ├── canonical/
│   │   ├── canonicalSerialize
│   │   ├── CanonicalSerializationMode
│   │   ├── DatasetCanonicalProjection
│   │   ├── DescriptorCanonicalProjection
│   │   └── IdentityCanonicalProjection
│   │
│   ├── DatasetVersion
│   ├── DatasetIdentity
│   ├── DatasetSnapshotDescriptor
│   └── errors
│
└── application/
    ├── CanonicalDatasetSerializer
    └── CanonicalDescriptorSerializer
```

Esta estructura es conceptual.

No la impongas si el repositorio usa una convención diferente.

Evalúa si la primitiva genérica pertenece realmente a:

```text
src/calibration
src/shared
src/core
src/historical-evidence
```

La ubicación debe respetar la dependencia arquitectónica.

Evita que un módulo compartido dependa de `historical-evidence`.

Preferir:

```text
historical-evidence depende de shared canonical serialization
```

y no:

```text
shared canonical serialization depende de historical-evidence
```

---

# 24. Barrel exports

Actualiza solo los exports necesarios.

No expongas:

* comparadores internos;
* walkers;
* helpers de path;
* funciones de escape;
* detalles de implementación.

Expón únicamente contratos públicos estables.

Verifica que no se rompan imports anteriores.

---

# 25. Documentación técnica

Documenta como mínimo:

1. definición de serialización canónica;
2. tipos soportados;
3. tipos rechazados;
4. orden de propiedades;
5. orden de arrays;
6. tratamiento de números;
7. tratamiento de `-0`;
8. tratamiento de `undefined`;
9. tratamiento de timestamps;
10. detección de ciclos;
11. representación científica;
12. representación operativa;
13. representación completa;
14. representación del descriptor;
15. relación con `contentHash`;
16. relación con `manifestHash`;
17. compatibilidad con hashes anteriores;
18. limitaciones;
19. fuera de alcance;
20. preparación para el `DatasetIntegrityVerifier`.

No describas como implementadas capacidades futuras.

---

# 26. Informe final

Crear:

```text
reports/trabajo/Fase2.3.4.2_canonical_dataset_serialization_reporte.md
```

El informe debe incluir:

```text
1. Resumen ejecutivo
2. Estado inicial
3. Baseline real
4. Arquitectura inspeccionada
5. Implementación canónica previa
6. Riesgos detectados
7. Decisiones de diseño
8. Componentes implementados
9. Archivos creados
10. Archivos modificados
11. APIs públicas
12. Tipos soportados
13. Tipos rechazados
14. Reglas de representación
15. Representación científica
16. Representación completa
17. Representación del descriptor
18. Relación con hashing
19. Regresión de hashes
20. Inmutabilidad
21. Errores tipados
22. Tests agregados
23. Resultados de tests focalizados
24. Resultado de suite completa
25. Resultado de lint
26. Resultado de build
27. Git diff summary
28. Riesgos pendientes
29. Fuera de alcance
30. Recomendación para Fase 2.3.4.3
31. Veredicto final
```

No escribas resultados ficticios.

Incluye salidas reales.

---

# 27. Punto de control

No sobrescribas los puntos de control anteriores.

Si todo queda verde, crea:

```text
Fase_2.3.4.2_cerrada.md
```

Debe incluir:

* timestamp;
* estado;
* baseline actualizado;
* componentes;
* APIs públicas;
* reglas canónicas;
* compatibilidad de hashes;
* archivos creados;
* archivos modificados;
* tests;
* lint;
* build;
* invariantes;
* riesgos;
* pendientes;
* siguiente fase;
* prompt de reanudación.

Si la fase no queda verde, crea:

```text
Fase_2.3.4.2_pendiente.md
```

No declares cierre si:

* falla una prueba;
* cambia un hash existente sin decisión autorizada;
* lint no está limpio;
* build falla;
* existen regresiones;
* la serialización no es determinista.

---

# 28. Git y seguridad operacional

No ejecutes automáticamente:

```bash
git commit
git push
git tag
git reset --hard
git clean -fd
git checkout -- .
```

No elimines archivos ajenos al alcance.

No instales dependencias sin justificación crítica.

Al finalizar muestra:

```bash
git status --short
git diff --stat
git diff -- src/historical-evidence tests/historical-evidence
```

Si modificas infraestructura compartida de hashing o serialización, incluye esos paths en el diff.

Guarda un diff completo en reportes si es demasiado extenso.

---

# 29. Criterios de aceptación

La Fase 2.3.4.2 solo puede considerarse completada si:

* [ ] se leyó el punto de control de 2.3.4.1;
* [ ] se verificó el baseline inicial;
* [ ] se inspeccionó `canonicalHashSync`;
* [ ] existe una única fuente de serialización canónica;
* [ ] no se duplicó SHA-256;
* [ ] los hashes existentes se preservaron;
* [ ] la serialización es determinista;
* [ ] el orden de propiedades es estable;
* [ ] el orden de arrays se preserva;
* [ ] el orden canónico de observaciones no cambió;
* [ ] existe representación científica explícita;
* [ ] existe representación completa explícita;
* [ ] existe representación canónica del descriptor;
* [ ] identidad científica y operativa permanecen separadas;
* [ ] no se recalculan hashes del descriptor;
* [ ] no se mutan inputs;
* [ ] se detectan ciclos;
* [ ] se rechazan tipos no soportados;
* [ ] existen errores tipados;
* [ ] no se usa reloj global;
* [ ] no se usa `Math.random()`;
* [ ] no existe persistencia;
* [ ] no existen exportadores;
* [ ] no existe deserialización;
* [ ] no existe `DatasetIntegrityVerifier`;
* [ ] no existe entrenamiento;
* [ ] no existe promoción;
* [ ] tests focalizados PASS;
* [ ] suite completa PASS;
* [ ] lint limpio;
* [ ] build OK;
* [ ] informe final creado;
* [ ] punto de control creado;
* [ ] pipeline GREEN.

---

# 30. Veredicto esperado

Si todos los criterios se cumplen:

```text
FASE 2.3.4.2: COMPLETADA
CANONICAL SERIALIZATION: IMPLEMENTADA
SCIENTIFIC DATASET REPRESENTATION: IMPLEMENTADA
SNAPSHOT REPRESENTATION: IMPLEMENTADA
DESCRIPTOR REPRESENTATION: IMPLEMENTADA
IDENTITY REPRESENTATION: IMPLEMENTADA
HASH REGRESSION: VALIDADA
CONTENT HASH SEMANTICS: PRESERVADA
MANIFEST HASH SEMANTICS: PRESERVADA
PERSISTENCIA: NO IMPLEMENTADA
EXPORTADORES: NO IMPLEMENTADOS
DESERIALIZACIÓN: NO IMPLEMENTADA
INTEGRITY VERIFIER: NO IMPLEMENTADO
ENTRENAMIENTO: NO AUTORIZADO
PROMOCIÓN: NO AUTORIZADA
PIPELINE: GREEN
```

Si algún criterio falla:

```text
FASE 2.3.4.2: PENDIENTE
```

Debes indicar exactamente:

* qué falló;
* qué archivos están afectados;
* qué pruebas fallan;
* si hubo cambios de hash;
* cuál es el riesgo;
* qué falta para cerrar.

---

# 31. Secuencia de ejecución

Trabaja en este orden:

```text
1. Leer puntos de control.
2. Leer informe y nota técnica de 2.3.4.1.
3. Inspeccionar Git.
4. Inspeccionar arquitectura.
5. Localizar canonicalHashSync.
6. Localizar serialización canónica actual.
7. Ejecutar baseline.
8. Crear nota técnica.
9. Diseñar la única fuente de verdad.
10. Refactorizar conservadoramente si es necesario.
11. Implementar la primitiva canónica.
12. Implementar proyecciones.
13. Implementar CanonicalDatasetSerializer.
14. Implementar CanonicalDescriptorSerializer.
15. Implementar opciones explícitas si son necesarias.
16. Actualizar exports.
17. Crear tests unitarios.
18. Crear tests de integración.
19. Crear fixtures de regresión de hashes.
20. Ejecutar tests focalizados.
21. Corregir defectos.
22. Ejecutar suite completa.
23. Ejecutar lint.
24. Ejecutar build.
25. Revisar diff.
26. Crear informe final.
27. Crear punto de control.
28. Mostrar veredicto.
```

---

# 32. Instrucción final

Trabaja de manera autónoma, conservadora y verificable.

No pidas confirmación para decisiones menores que puedan resolverse inspeccionando el repositorio.

Ante una ambigüedad:

1. preserva los hashes existentes;
2. prioriza los contratos cerrados;
3. evita duplicación;
4. minimiza el cambio;
5. documenta la decisión;
6. no amplíes el alcance.

No declares éxito solo porque la salida parece correcta.

Debes demostrar:

```text
determinismo
+
inmutabilidad
+
regresión de hashes preservada
+
suite completa en verde
```

No declares la fase cerrada sin ejecutar todas las validaciones.

Comienza ahora.
