# PROMPT MAESTRO — FASE 1.0

# Infraestructura base del MotorConsensoCalibrado

## Proyecto: Roulette Tracker

Actúa como un **arquitecto principal de software y desarrollador senior especializado en JavaScript, TypeScript, Clean Architecture, SOLID, testing y sistemas estadísticos auditables**.

Debes trabajar directamente sobre el repositorio actual de **Roulette Tracker**.

---

# 1. Contexto

La Fase 0 y la Fase 0.5 ya fueron completadas.

La Fase 0.5 definió el contrato conceptual:

```text
ConsensusSignal
```

que será utilizado posteriormente por:

```text
LabConAdapter
LabCon1Adapter
AtRepAdapter
SignalCollector
Normalizer
ConsensusEngine
FutureMetaModel
```

En esta fase debes implementar únicamente la infraestructura base del módulo de consenso.

Esta fase NO debe implementar todavía lógica estadística, adaptadores ni integración con la interfaz.

---

# 2. Objetivo general

Crear el módulo base:

```text
src/consensus/
```

con los contratos, tipos, constantes, validadores y exports necesarios para soportar las siguientes fases.

El resultado debe ser una infraestructura:

* independiente;
* testeable;
* sin dependencia del DOM;
* sin dependencia de renderers;
* sin dependencia de ViewModels;
* sin modificar los motores actuales;
* preparada para `0` y `00`;
* preparada para valores nulos;
* preparada para versionado de schema;
* preparada para trazabilidad.

---

# 3. Alcance exacto

Debes crear, como mínimo:

```text
src/consensus/
├── contracts/
│   ├── consensusSignal.js
│   ├── consensusSignalSchema.js
│   └── index.js
├── constants/
│   ├── consensusConstants.js
│   └── index.js
├── validators/
│   ├── validateConsensusSignal.js
│   └── index.js
├── utils/
│   ├── normalizeRouletteNumber.js
│   ├── cloneConsensusSignal.js
│   └── index.js
├── consensusSignalFactory.js
└── index.js
```

Si el repositorio utiliza TypeScript, adapta la extensión a `.ts`.

Si utiliza JavaScript con JSDoc, mantén JavaScript y añade tipos mediante JSDoc.

No migres el proyecto a TypeScript si actualmente no lo usa.

---

# 4. Restricciones obligatorias

Durante esta fase:

* NO modificar `labEngine.js`.
* NO modificar `labCon1Engine.js`.
* NO modificar `atRepEngine.js`.
* NO modificar `atRepRenderer.js`.
* NO modificar `atRepViewModel.js`.
* NO modificar `main.js`.
* NO modificar stores.
* NO modificar tracker.
* NO modificar UI.
* NO implementar adaptadores.
* NO implementar `SignalCollector`.
* NO implementar normalización estadística.
* NO implementar pesos.
* NO implementar consenso.
* NO corregir el bug detectado en AtRep.
* NO introducir dependencias externas salvo necesidad absolutamente justificada.
* NO crear commits automáticamente.
* NO hacer push.
* NO modificar tests existentes salvo que sea imprescindible para compatibilidad.
* NO alterar resultados actuales.

---

# 5. Verificación inicial

Antes de modificar archivos:

1. Confirmar la raíz del repositorio.
2. Mostrar:

```bash
pwd
git status --short
git branch --show-current
git log -1 --oneline
```

3. Revisar:

```text
package.json
configuración de tests
configuración de lint
configuración de build
sistema de módulos usado
convenciones de nombres
estructura de src/
estructura de tests/
```

4. Detectar si el proyecto utiliza:

```text
ES Modules
CommonJS
TypeScript
JavaScript con JSDoc
Vitest
Jest
Node test runner
```

5. Respetar exactamente las convenciones existentes.

Si el worktree está sucio, continuar, pero documentar el estado inicial.

No revertir cambios preexistentes.

---

# 6. Contrato ConsensusSignal

Implementar el contrato basado en la siguiente estructura:

```javascript
{
  schemaVersion: "1.0.0",

  number: "35",

  sourceEngines: [
    "Lab_Con",
    "Lab_Con1",
    "AtRep"
  ],

  rawSignals: {
    delay: null,
    winWin: null,
    pci: null
  },

  evidence: {
    occurrences: 0,
    sampleSize: 0,
    activeSets: [],
    windowSize: 0,
    historyLength: 0,
    supportCount: 0,
    signalQuality: "INSUFFICIENT"
  },

  metadata: {
    generatedAt: null,
    valid: false,
    warnings: [],
    missingSignals: [],
    provenance: []
  }
}
```

---

# 7. Definición de rawSignals

## 7.1 Delay

El contrato debe permitir:

```javascript
delay: {
  actualDelay: 0,
  maxDelay: 0,
  delayRatio: null,
  delayScore: null,
  probabilityDelay: null,
  pressure: null,
  activeSets: []
}
```

## 7.2 Win-Win

El contrato debe permitir:

```javascript
winWin: {
  atraso: 0,
  threshold: 0,
  level: null,
  isActive: false,
  streakLength: 0,
  streakBonus: null,
  recencyBonus: null,
  winWinScore: null
}
```

## 7.3 PCI

El contrato debe permitir:

```javascript
pci: {
  occurrences: 0,
  meanDist: null,
  expectedDist: null,
  pciIndividual: null,
  pciCombined: null,
  pciBySet: []
}
```

Cada elemento de `pciBySet` debe tener:

```javascript
{
  set: "red",
  pci: null
}
```

---

# 8. Tipos y constantes

Crear constantes para evitar strings mágicos.

## 8.1 Schema version

```javascript
CONSENSUS_SCHEMA_VERSION = "1.0.0"
```

## 8.2 Motores permitidos

```javascript
CONSENSUS_SOURCE_ENGINES = {
  LAB_CON: "Lab_Con",
  LAB_CON_1: "Lab_Con1",
  AT_REP: "AtRep"
}
```

## 8.3 Calidad de señal

```javascript
SIGNAL_QUALITY = {
  INSUFFICIENT: "INSUFFICIENT",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
}
```

## 8.4 Familia de señal

```javascript
SIGNAL_FAMILY = {
  DELAY: "delay",
  WIN_WIN: "winWin",
  PCI: "pci"
}
```

## 8.5 Severidad de warning

```javascript
WARNING_SEVERITY = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR"
}
```

Las constantes deben exportarse desde un único punto público.

---

# 9. Representación de números

La función:

```text
normalizeRouletteNumber()
```

debe normalizar cualquier número válido a string.

Entradas válidas:

```text
0
"0"
"00"
1
"1"
36
"36"
```

Salidas:

```text
"0"
"00"
"1"
"36"
```

Entradas inválidas:

```text
-1
37
"37"
"000"
"abc"
null
undefined
NaN
Infinity
{}
[]
```

La función debe rechazar entradas inválidas con un error claro.

No convertir `"00"` a `"0"`.

No permitir pérdida de identidad entre ambos valores.

---

# 10. Factory

Crear:

```text
createConsensusSignal()
```

Firma conceptual:

```javascript
createConsensusSignal(number, overrides = {})
```

Debe:

1. Validar y normalizar el número.
2. Crear una estructura completa.
3. Añadir `schemaVersion`.
4. Añadir `generatedAt`.
5. Crear arrays nuevos.
6. Crear objetos nuevos.
7. No compartir referencias mutables entre instancias.
8. Aplicar overrides permitidos.
9. No aceptar propiedades desconocidas silenciosamente.
10. Devolver una estructura validable.

Ejemplo:

```javascript
const signal = createConsensusSignal("00");
```

Resultado esperado:

```javascript
{
  schemaVersion: "1.0.0",
  number: "00",
  sourceEngines: [],
  rawSignals: {
    delay: null,
    winWin: null,
    pci: null
  },
  evidence: {
    occurrences: 0,
    sampleSize: 0,
    activeSets: [],
    windowSize: 0,
    historyLength: 0,
    supportCount: 0,
    signalQuality: "INSUFFICIENT"
  },
  metadata: {
    generatedAt: "...",
    valid: false,
    warnings: [],
    missingSignals: [
      "delay",
      "winWin",
      "pci"
    ],
    provenance: []
  }
}
```

---

# 11. Provenance

Cada elemento de `metadata.provenance` debe soportar:

```javascript
{
  engine: "Lab_Con",
  file: "labEngine.js",
  method: "resolverScoresIndividuales",
  version: null
}
```

Campos obligatorios:

```text
engine
file
method
```

Campo opcional:

```text
version
```

El validador debe comprobar que `engine` sea uno de los motores permitidos.

---

# 12. Warnings

Cada warning debe usar una estructura explícita:

```javascript
{
  code: "PCI_INSUFFICIENT_SAMPLE",
  message: "PCI individual no disponible por muestra insuficiente.",
  severity: "WARNING",
  source: "AtRep"
}
```

Campos obligatorios:

```text
code
message
severity
```

Campo opcional:

```text
source
```

No almacenar warnings como strings simples.

---

# 13. Validación

Crear:

```text
validateConsensusSignal()
```

Debe devolver un resultado estructurado:

```javascript
{
  valid: true,
  errors: [],
  warnings: []
}
```

No debe lanzar error para un contrato estructuralmente válido aunque sus señales estén incompletas.

Debe lanzar error o devolver `valid: false` cuando:

* falta `schemaVersion`;
* el número es inválido;
* existen motores desconocidos;
* faltan bloques obligatorios;
* los arrays no son arrays;
* los contadores son negativos;
* aparece `NaN`;
* aparece `Infinity`;
* la calidad de señal no es válida;
* provenance tiene formato inválido;
* warning tiene formato inválido;
* existen propiedades desconocidas no permitidas.

Debe distinguir:

```text
ERROR ESTRUCTURAL
WARNING DE EVIDENCIA
```

Ejemplos de warning de evidencia:

```text
PCI sin muestra suficiente
ausencia de delay
ausencia de Win-Win
supportCount = 0
historyLength = 0
```

---

# 14. Schema

Crear una definición formal en:

```text
consensusSignalSchema.js
```

Puede ser:

* un objeto schema interno;
* una definición de campos permitidos;
* un JSON Schema;
* un sistema de validación propio.

No instalar una biblioteca externa de schemas salvo que el proyecto ya utilice una.

El schema debe ser la fuente única de verdad para:

* claves permitidas;
* tipos;
* enums;
* campos obligatorios;
* nulos permitidos.

---

# 15. Clonado seguro

Crear:

```text
cloneConsensusSignal()
```

Debe:

* devolver una copia profunda;
* preservar `"00"`;
* preservar `null`;
* no compartir arrays;
* no compartir objetos;
* no mutar la entrada;
* funcionar con provenance y warnings.

Usar `structuredClone` si es compatible con el entorno del proyecto.

Si no lo es, implementar una alternativa segura.

No utilizar:

```javascript
JSON.parse(JSON.stringify(...))
```

si eso puede ocultar valores inválidos o perder información relevante.

---

# 16. Inmutabilidad

Evaluar si el proyecto utiliza `Object.freeze()`.

Si es compatible con sus convenciones, añadir una opción:

```javascript
createConsensusSignal(number, {
  freeze: true
})
```

o una función separada:

```text
freezeConsensusSignal()
```

No congelar por defecto si eso puede interferir con futuras fases.

Documentar la decisión tomada.

---

# 17. API pública

El archivo:

```text
src/consensus/index.js
```

debe exportar únicamente la API pública.

Como mínimo:

```javascript
createConsensusSignal
validateConsensusSignal
normalizeRouletteNumber
cloneConsensusSignal
CONSENSUS_SCHEMA_VERSION
CONSENSUS_SOURCE_ENGINES
SIGNAL_QUALITY
SIGNAL_FAMILY
WARNING_SEVERITY
```

No exponer helpers internos innecesarios.

---

# 18. Tests

Crear tests nuevos exclusivamente para esta infraestructura.

Ubicación recomendada:

```text
tests/consensus/
```

o la convención equivalente ya utilizada en el proyecto.

Crear como mínimo:

```text
consensusSignalFactory.test.js
validateConsensusSignal.test.js
normalizeRouletteNumber.test.js
cloneConsensusSignal.test.js
consensusExports.test.js
```

---

# 19. Casos de prueba obligatorios

## 19.1 Números

* acepta `0`;
* acepta `"0"`;
* acepta `"00"`;
* acepta `1`;
* acepta `"36"`;
* rechaza `-1`;
* rechaza `37`;
* rechaza `"000"`;
* rechaza `"abc"`;
* rechaza `null`;
* rechaza `undefined`;
* rechaza `NaN`;
* rechaza `Infinity`.

## 19.2 Factory

* crea estructura completa;
* genera fecha válida;
* genera arrays independientes;
* genera objetos independientes;
* no comparte referencias;
* aplica overrides válidos;
* rechaza overrides desconocidos;
* conserva `"00"`;
* inicializa `missingSignals`.

## 19.3 Validación

* acepta contrato base;
* rechaza schemaVersion incorrecto;
* rechaza número inválido;
* rechaza motor desconocido;
* rechaza valores negativos;
* rechaza `NaN`;
* rechaza `Infinity`;
* rechaza propiedades desconocidas;
* acepta `pciIndividual = null`;
* acepta `meanDist = null`;
* genera warning por señal ausente;
* diferencia error de warning.

## 19.4 Clonado

* copia profunda;
* no comparte arrays;
* no comparte objetos;
* conserva warnings;
* conserva provenance;
* conserva `"00"`;
* no muta la entrada.

## 19.5 Exports

* el index público exporta lo esperado;
* no exporta helpers privados;
* no existen imports circulares.

---

# 20. Compatibilidad

El código debe funcionar con:

```text
Node
entorno de tests
build actual
sistema de módulos del proyecto
```

No depender de:

```text
document
window
localStorage
HTMLElement
Canvas
renderer
ViewModel
```

El módulo debe poder importarse y probarse sin navegador.

---

# 21. Documentación técnica

Crear:

```text
reports/consensus/PHASE_1_0_CONSENSUS_INFRASTRUCTURE.md
```

Debe contener:

1. Resumen ejecutivo.
2. Archivos creados.
3. Decisiones de diseño.
4. Contrato implementado.
5. Reglas de validación.
6. Representación de `0` y `00`.
7. Tratamiento de valores nulos.
8. Estructura de warnings.
9. Estructura de provenance.
10. Estrategia de clonado.
11. Estrategia de inmutabilidad.
12. API pública.
13. Tests creados.
14. Resultados de validación.
15. Riesgos pendientes.
16. Compatibilidad con Fase 1.1.
17. Estado final de Git.
18. Conclusión GO / GO CON CONDICIONES / NO-GO.

---

# 22. Comandos permitidos

Puedes usar comandos no destructivos:

```bash
pwd
ls
find
tree
rg
grep
sed
cat
head
tail
git status
git diff
git log
npm test
npm run test
npm run lint
npm run build
npm run check
```

Antes de ejecutar scripts npm, revisar `package.json`.

---

# 23. Comandos prohibidos

No ejecutar:

```bash
rm -rf
git reset --hard
git clean -fd
git checkout -- .
git restore .
git stash
git rebase
git merge
git commit
git push
npm publish
sudo
chmod -R
chown
curl | sh
wget | sh
```

---

# 24. Validaciones finales

Al terminar ejecutar, si existen:

```bash
npm run test
npm run lint
npm run build
```

Si el proyecto tiene otros scripts de arquitectura o calidad, ejecutarlos solo después de revisar qué hacen.

Ejecutar además:

```bash
git status --short
git diff --stat
```

Registrar:

* tests ejecutados;
* tests aprobados;
* tests fallidos;
* errores de lint;
* errores de build;
* warnings;
* archivos modificados;
* archivos nuevos.

No ocultar fallos preexistentes.

Distinguir entre:

```text
Fallo introducido por esta fase
Fallo preexistente
Fallo no relacionado
```

---

# 25. Criterios de aceptación

La Fase 1.0 se considera aprobada si:

* existe `src/consensus/`;
* existe un contrato base completo;
* existe `schemaVersion`;
* `number` preserva `"0"` y `"00"`;
* existe una factory;
* existe validación estructural;
* existe normalización de números;
* existe clonado profundo;
* existen constantes;
* existe provenance;
* existen warnings estructurados;
* existen tests nuevos;
* los tests del módulo pasan;
* los tests existentes no presentan regresiones nuevas;
* el módulo no depende del DOM;
* no se modificaron motores actuales;
* no se implementaron adaptadores;
* no se implementó `SignalCollector`;
* no se modificó la interfaz;
* existe el informe de la fase.

---

# 26. Resultado final esperado

La respuesta final debe seguir este formato:

```text
FASE 1.0 — INFRAESTRUCTURA DE CONSENSO COMPLETADA

Estado:
GO / GO CON CONDICIONES / NO-GO

Módulo creado:
src/consensus/

Archivos creados:
- [...]

Contrato:
ConsensusSignal schemaVersion 1.0.0

Representación de números:
- 0 preservado
- 00 preservado
- 1..36 validados

Tests nuevos:
[número]

Tests aprobados:
[número]

Tests fallidos:
[número]

Lint:
[resultado]

Build:
[resultado]

Cambios en motores existentes:
NINGUNO / DETALLAR

Cambios en interfaz:
NINGUNO / DETALLAR

Informe:
reports/consensus/PHASE_1_0_CONSENSUS_INFRASTRUCTURE.md

Estado final de Git:
[...]

Siguiente fase:
FASE 1.1 — Implementación de LabConAdapter
```

---

# 27. Instrucción de ejecución

Comienza ahora.

No solicites confirmación adicional.

Respeta las convenciones reales del repositorio.

No inventes APIs de los motores actuales.

No implementes adaptadores.

No implementes el SignalCollector.

No cambies lógica estadística.

No corrijas AtRep.

Implementa únicamente la infraestructura base del contrato de señales y genera:

```text
reports/consensus/PHASE_1_0_CONSENSUS_INFRASTRUCTURE.md
```
