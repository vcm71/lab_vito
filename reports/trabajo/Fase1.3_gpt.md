# PROMPT DE EJECUCIÓN — FASE 1.3

## Implementación de `AtRepAdapter`

Estamos trabajando en el proyecto:

```text
Roulette Tracker
```

Nombre anterior:

```text
ORION / Orion_v2
```

Directorio esperado del repositorio:

```text
/home/shared/lab_vito
```

Debes actuar como arquitecto principal de software e ingeniero senior. Trabaja con enfoque conservador, verificable y estrictamente limitado a esta microfase.

Respeta:

```text
Clean Architecture
SOLID
Dependency Inversion
Open/Closed Principle
contratos serializables
copias defensivas
trazabilidad
pruebas automatizadas
compatibilidad con ruleta americana
```

---

# 1. CONTEXTO DEL PROYECTO

El proyecto está construyendo un:

```text
MotorConsensoCalibrado
```

capaz de integrar señales provenientes de:

```text
Lab_Con
Lab_Con1
AtRep
```

La arquitectura objetivo es:

```text
Tracker
  ↓
Adapters
  ↓
SignalCollector
  ↓
SignalNormalizer
  ↓
ConsensusEngine
  ↓
ProbabilityCalibrator
  ↓
BacktestEvaluator
  ↓
RecommendationPolicy
```

Actualmente están completadas:

```text
FASE 0   — Auditoría arquitectónica
FASE 0.5 — Contrato ConsensusSignal
FASE 1.0 — Infraestructura base de src/consensus/
FASE 1.1 — LabConAdapter
FASE 1.2 — LabCon1Adapter
```

La siguiente microfase aprobada es exclusivamente:

```text
FASE 1.3 — AtRepAdapter
```

No implementes ninguna fase posterior.

---

# 2. ESTADO VALIDADO ANTES DE ESTA FASE

La Fase 1.2 informó:

```text
npm test -- tests/consensus/LabCon1Adapter.test.js
→ OK

npm run test
→ 198/198 tests aprobados

npm run build
→ OK
```

El lint continúa fallando por deuda preexistente en:

```text
tests/atRepRenderer.test.js
tests/atRepViewModel.test.js
```

No corrijas esos archivos durante esta microfase.

La infraestructura esperada incluye:

```text
src/consensus/
├── adapters/
│   ├── LabConAdapter.js
│   ├── LabCon1Adapter.js
│   └── index.js
├── constants/
├── contracts/
├── utils/
├── validators/
├── consensusSignalFactory.js
└── index.js
```

Antes de implementar, confirma las rutas reales y el estado actual del repositorio.

---

# 3. OBJETIVO ÚNICO DE LA FASE 1.3

Implementar:

```text
AtRepAdapter
```

como adaptador entre:

```text
AtRep
```

y:

```text
ConsensusSignal
```

El adaptador debe transformar únicamente datos públicos y realmente disponibles de AtRep en señales compatibles con `ConsensusSignal`.

Debe producir una señal independiente para cada uno de los 38 números de la ruleta americana:

```text
"0"
"00"
"1"
"2"
...
"36"
```

Debe preservar estrictamente la diferencia entre:

```text
"0"
```

y:

```text
"00"
```

---

# 4. PRINCIPIO FUNDAMENTAL

El adaptador debe:

```text
envolver
traducir
copiar defensivamente
validar
registrar provenance
generar warnings estructurados
preservar valores crudos
mantener separación entre dominio y UI
```

El adaptador no debe:

```text
modificar atRepEngine.js
copiar fórmulas estadísticas
reescribir PCI
recalcular clasificaciones
corregir lógica de membresía
acceder innecesariamente a campos privados
depender del DOM
depender del renderer
depender del ViewModel
integrarse con la UI
implementar SignalCollector
normalizar señales
fusionar motores
crear consenso
crear rankings
crear recomendaciones
introducir caching prematuro
```

---

# 5. RESTRICCIÓN CRÍTICA SOBRE EL POSIBLE BUG DE ATREP

Existe un riesgo arquitectónico previamente identificado en:

```text
atRepEngine.getNumeroScores()
```

El problema potencial está relacionado con:

```text
filtrado de conjuntos activos
pertenencia real de cada número
setsIn
groupPci
PCI combinado
clasificación atracción/repulsión/CSR
```

Durante esta fase está prohibido corregir ese comportamiento.

No modifiques:

```text
atRepEngine.js
```

No alteres resultados para “compensar” el posible fallo.

No introduzcas una lógica paralela de membresía en el adaptador salvo la mínima necesaria para traducir la salida pública, y únicamente si puede demostrarse que no cambia la semántica del motor.

Si detectas o reproduces el posible bug:

1. No lo corrijas.
2. Documenta el caso.
3. Añade, si es posible, un test de caracterización que refleje el comportamiento actual.
4. Marca el riesgo en el reporte.
5. Propón una microfase separada de regresión y corrección.
6. Continúa la Fase 1.3 sin alterar el motor.

Un test de caracterización no debe declarar que el comportamiento actual es correcto. Solo debe congelar el comportamiento observado para evitar cambios accidentales.

---

# 6. INSPECCIÓN OBLIGATORIA ANTES DE PROGRAMAR

Antes de escribir código, localiza e inspecciona:

```text
atRepEngine.js
atRepRenderer.js
src/viewmodels/atRepViewModel.js
```

También revisa:

```text
src/consensus/adapters/LabConAdapter.js
src/consensus/adapters/LabCon1Adapter.js
src/consensus/adapters/index.js
src/consensus/index.js
src/consensus/consensusSignalFactory.js
src/consensus/contracts/
src/consensus/validators/
src/consensus/constants/
tests/consensus/LabConAdapter.test.js
tests/consensus/LabCon1Adapter.test.js
tests/consensus/consensusExports.test.js
reports/consensus/PHASE_0_ARCHITECTURE_AUDIT.md
reports/consensus/PHASE_0_5_SIGNAL_CONTRACT.md
reports/consensus/PHASE_1_0_CONSENSUS_INFRASTRUCTURE.md
reports/consensus/PHASE_1_1_LABCON_ADAPTER.md
reports/consensus/PHASE_1_2_LABCON1_ADAPTER.md
```

Debes identificar con precisión:

1. Archivo real del motor AtRep.
2. Clase, factory o API pública disponible.
3. Métodos públicos que generan resultados.
4. Argumentos requeridos.
5. Estructura exacta de la salida.
6. Representación de números.
7. Tratamiento de `"0"` y `"00"`.
8. Significado exacto de `pci`.
9. Diferencia entre `individualPci`, `groupPci`, `pciBySet` y PCI combinado.
10. Semántica de `verdict`.
11. Semántica de `setsIn`.
12. Cómo se calculan ocurrencias y distancias.
13. Qué información proviene realmente del engine.
14. Qué información es derivada por el ViewModel.
15. Qué información pertenece solo al renderer.
16. Qué propiedades son internas o privadas.
17. Si el motor mantiene estado mutable.
18. Si existen APIs que devuelven referencias internas.
19. Qué datos pueden obtenerse sin tocar UI.
20. Qué datos no están disponibles públicamente.

No copies datos desde el renderer.

No uses el ViewModel como fuente si el mismo dato puede obtenerse directamente del engine.

No accedas a campos internos solo porque el ViewModel actual lo hace.

---

# 7. SEÑALES CONCEPTUALES DE ATREP

AtRep está orientado principalmente a:

```text
PCI individual
PCI por conjunto
ocurrencias
distancia media
distancia esperada
atracción
repulsión
CSR
agregación por número
intersecciones
resumen global
```

Las señales previamente identificadas incluyen:

```text
occurrences
meanDist
expectedDist
pci
individualPci
groupPci
pciBySet
verdict
setsIn
resumen global
intersecciones
```

Estas referencias son conceptuales.

Debes verificar en el código real:

```text
nombres exactos
tipos
escalas
nulabilidad
estructura
rangos
significado estadístico
unidad de medida
disponibilidad por número
```

No asumas que todos los campos existen o tienen la misma semántica.

---

# 8. MAPEO HACIA CONSENSUSSIGNAL

La familia principal para `AtRepAdapter` será:

```javascript
rawSignals.pci
```

La salida conceptual esperada por número es:

```javascript
{
  sourceEngines: ["AtRep"],

  rawSignals: {
    delay: null,
    winWin: null,

    pci: {
      occurrences: 0,
      meanDist: null,
      expectedDist: null,
      pciIndividual: null,
      pciCombined: null,
      pciBySet: []
    }
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
    valid: true,
    warnings: [],
    missingSignals: [],
    provenance: []
  }
}
```

Esta estructura es conceptual.

Debes adaptarla al schema, factory, constantes y validadores reales existentes.

No agregues propiedades no permitidas por el contrato.

---

# 9. REGLAS DE MAPEO

## 9.1 `occurrences`

Debe provenir directamente de la salida pública de AtRep.

Debe representar la cantidad real de ocurrencias del número dentro de la muestra o ventana utilizada.

No la derives de otras métricas.

No confundas:

```text
occurrences
```

con:

```text
supportCount
cantidad de conjuntos
cantidad de intersecciones
```

Si no está disponible:

```javascript
occurrences: 0
```

acompañado de warning cuando la ausencia afecte la interpretación.

---

## 9.2 `meanDist`

Debe mapear la distancia media real calculada por AtRep.

No recalcules la media en el adaptador.

Si la salida del motor usa otro nombre, documenta la equivalencia exacta.

Si el valor no está disponible o no es calculable por muestra insuficiente:

```javascript
meanDist: null
```

No utilices `0` para representar ausencia.

---

## 9.3 `expectedDist`

Debe mapear la distancia esperada real expuesta por AtRep.

No la derives en el adaptador desde probabilidad teórica, cantidad de números o tamaño de conjunto.

Si no está disponible:

```javascript
expectedDist: null
```

con warning estructurado cuando corresponda.

---

## 9.4 `pciIndividual`

Debe corresponder al PCI individual real del número.

No recalcules PCI.

No cambies signo, escala, redondeo o rango.

No conviertas el valor a porcentaje salvo que el motor ya lo entregue así y el contrato espere exactamente esa escala.

Documenta:

```text
escala
rango observado
nulabilidad
condiciones de disponibilidad
```

---

## 9.5 `pciCombined`

Debe mapear el PCI combinado o agregado final realmente producido por AtRep.

Determina en el código real si corresponde a:

```text
pci
groupPci
PCI combinado
otra propiedad
```

No elijas arbitrariamente.

No promedies `pciIndividual` y `groupPci`.

No sumes valores de `pciBySet`.

No reproduzcas la fórmula del motor.

Si AtRep no expone un PCI combinado inequívoco:

```javascript
pciCombined: null
```

y documenta la incompatibilidad.

---

## 9.6 `pciBySet`

Debe contener únicamente datos reales por conjunto.

Formato conceptual:

```javascript
[
  {
    set: "nombre_real",
    pci: 0.0
  }
]
```

Usa los nombres reales de los conjuntos.

Conserva la escala original del PCI.

No incluyas conjuntos que no soporten realmente al número, salvo que la salida pública del motor ya los asigne y debas preservar el comportamiento actual.

Copia defensivamente el array y cada objeto interno.

No compartas referencias entre señales.

---

## 9.7 `verdict`

El contrato actual puede no contener un campo directo para:

```text
atracción
repulsión
CSR
neutral
```

No fuerces `verdict` en un campo semánticamente incorrecto.

Antes de decidir:

1. Inspecciona si el contrato admite este dato.
2. Revisa si existe un campo de metadata o diagnóstico aprobado.
3. No modifiques el contrato salvo incompatibilidad objetiva.
4. No conviertas `verdict` en `signalQuality`.
5. No conviertas `verdict` en `valid`.
6. No alteres PCI para representar la clasificación.

Si el contrato vigente no permite conservar `verdict`:

* documenta la pérdida semántica;
* genera un warning estructurado;
* registra una propuesta futura;
* no agregues una propiedad desconocida.

No modifiques silenciosamente el schema.

---

## 9.8 `setsIn`

Debe representar los conjuntos a los que pertenece el número según la salida pública real del motor.

Debido al posible bug de membresía:

* no corrijas la lista;
* no amplíes la lista;
* no reduzcas la lista;
* no reconstruyas relaciones usando una lógica nueva;
* conserva la salida observable del motor;
* documenta el riesgo.

Si existe una API pública inequívoca de catálogo que permita conocer la membresía real sin alterar el cálculo, puedes usarla únicamente para validar o documentar diferencias, no para cambiar la señal en esta fase.

---

# 10. EVIDENCE

Completa `evidence` solo con datos demostrables.

## 10.1 `occurrences`

Debe coincidir con:

```javascript
rawSignals.pci.occurrences
```

cuando ambos campos representen la misma evidencia.

Evita contradicciones.

---

## 10.2 `sampleSize`

Debe reflejar la muestra real utilizada por AtRep.

Determina si corresponde a:

```text
cantidad total de spins
ventana efectiva
cantidad de observaciones procesadas
otra medida explícita
```

No inventes el valor.

---

## 10.3 `activeSets`

Para AtRep puede representar los conjuntos relevantes, activos o asociados al número.

Debes verificar la semántica real.

No confundas:

```text
setsIn
```

con:

```text
activeSets
```

Si AtRep no tiene concepto de conjunto activo, no declares activos todos los conjuntos de pertenencia.

En ese caso utiliza:

```javascript
activeSets: []
```

o el mapeo aprobado por el contrato, y documenta la limitación.

---

## 10.4 `windowSize`

Debe provenir de configuración o salida pública verificable.

Si AtRep procesa todo el historial y no usa ventana específica, documenta esa decisión.

No inventes una ventana.

---

## 10.5 `historyLength`

Debe reflejar la cantidad real de spins recibidos o procesados.

No debe derivarse desde `occurrences`.

---

## 10.6 `supportCount`

Debe representar la cantidad real de fuentes internas que soportan la señal.

Podría corresponder conceptualmente a la cantidad de conjuntos con PCI válido para el número, pero debes verificarlo.

No uses simplemente:

```javascript
pciBySet.length
```

si el array incluye elementos nulos, inválidos o ajenos al número.

Documenta el criterio exacto.

---

## 10.7 `signalQuality`

Utiliza solo valores permitidos:

```text
INSUFFICIENT
LOW
MEDIUM
HIGH
```

No conviertas directamente:

```text
ATRACCIÓN
REPULSIÓN
CSR
```

en niveles de calidad.

`signalQuality` representa calidad o suficiencia de evidencia, no dirección estadística.

Si no existe una política aprobada, usa un criterio conservador basado únicamente en:

```text
disponibilidad estructural
muestra
ocurrencias
cantidad de valores PCI válidos
```

Documenta claramente el criterio.

No afirmes que una calidad alta implica capacidad predictiva.

---

# 11. METADATA

## 11.1 `valid`

Debe reflejar validez estructural.

No debe representar:

```text
atracción
repulsión
confianza predictiva
calidad estadística
```

Una señal incompleta puede ser estructuralmente válida.

---

## 11.2 `warnings`

Los warnings deben ser objetos estructurados.

Formato conceptual:

```javascript
{
  code: "ATREP_MISSING_EXPECTED_DISTANCE",
  message: "AtRep no expone distancia esperada para este número.",
  severity: "WARNING",
  source: "AtRep"
}
```

No uses strings simples.

Evita warnings duplicados dentro de una misma señal.

Ejemplos posibles, solo si corresponden realmente:

```text
ATREP_INSUFFICIENT_SAMPLE
ATREP_MISSING_OCCURRENCES
ATREP_MISSING_MEAN_DISTANCE
ATREP_MISSING_EXPECTED_DISTANCE
ATREP_MISSING_INDIVIDUAL_PCI
ATREP_MISSING_COMBINED_PCI
ATREP_MISSING_SET_PCI
ATREP_VERDICT_NOT_REPRESENTED
ATREP_MEMBERSHIP_RISK
ATREP_INVALID_ENGINE_OUTPUT
ATREP_INVALID_NUMBER
ATREP_NON_FINITE_VALUE
ATREP_UNSUPPORTED_SCALE
```

La ausencia de `delay` y `winWin` es esperada por diseño y no debe generar warnings innecesarios.

---

## 11.3 `missingSignals`

Debe ser compatible con:

```text
createConsensusSignal()
```

No mantengas manualmente una lista contradictoria con la factory.

Verifica cómo se calculan las familias ausentes.

La ausencia esperada de:

```text
delay
winWin
```

debe representarse según la infraestructura existente.

---

## 11.4 `provenance`

Registra la procedencia real.

Formato conceptual:

```javascript
{
  engine: "AtRep",
  file: "atRepEngine.js",
  method: "getNumeroScores",
  version: null
}
```

Usa nombres reales.

Si se invocan varios métodos públicos, registra provenance suficiente.

No inventes versiones.

No pongas como fuente al renderer o al ViewModel si los datos provienen del engine.

---

# 12. VALORES NUMÉRICOS

Antes de crear cada `ConsensusSignal`, valida valores numéricos.

Distingue entre:

```text
0 válido
null por ausencia
NaN inválido
Infinity inválido
-Infinity inválido
string numérico inesperado
```

No conviertas silenciosamente valores inválidos a `0`.

Cuando un valor no finito aparezca:

* usa `null` si el contrato lo permite;
* genera warning estructurado;
* preserva la estabilidad del adaptador;
* no permitas que una señal invalide toda la colección.

No cambies el redondeo original salvo que el contrato lo exija.

---

# 13. DISEÑO DEL ADAPTADOR

La interfaz concreta debe seguir el patrón real de:

```text
LabConAdapter
LabCon1Adapter
```

Como referencia conceptual:

```javascript
const adapter = new AtRepAdapter(atRepEngine);

const signals = adapter.adapt({
  spins,
  settings
});
```

o:

```javascript
const signals = AtRepAdapter.adapt({
  engine,
  spins,
  settings
});
```

No impongas esta forma si los adaptadores existentes usan otra convención.

Prioriza consistencia pública entre los tres adaptadores.

El adaptador debe devolver una colección claramente definida, preferentemente un array de 38 `ConsensusSignal`, salvo que el patrón existente establezca otra estructura.

No combines esta colección con los resultados de otros adaptadores.

---

# 14. COPIAS DEFENSIVAS E INMUTABILIDAD

El adaptador no debe mutar:

```text
spins
settings
atRepEngine
salidas originales del motor
catálogos de conjuntos
pciBySet
setsIn
warnings
provenance
```

Cada señal debe tener referencias independientes en:

```text
sourceEngines
rawSignals
rawSignals.pci
pciBySet
evidence
activeSets
metadata
warnings
provenance
missingSignals
```

Agrega pruebas que demuestren que modificar una señal no altera:

* otra señal;
* el resultado original de AtRep;
* los inputs;
* los arrays de otra señal;
* objetos internos de `pciBySet`.

Si existe opción de congelamiento, verifica el comportamiento conforme al patrón real de los adaptadores anteriores.

---

# 15. ARCHIVOS A CREAR O MODIFICAR

Crea:

```text
src/consensus/adapters/AtRepAdapter.js
tests/consensus/AtRepAdapter.test.js
reports/consensus/PHASE_1_3_ATREP_ADAPTER.md
```

Actualiza únicamente cuando corresponda:

```text
src/consensus/adapters/index.js
src/consensus/index.js
tests/consensus/consensusExports.test.js
```

No modifiques:

```text
atRepEngine.js
atRepRenderer.js
src/viewmodels/atRepViewModel.js
labEngine.js
labCon1Engine.js
main.js
rouletteSettingsStore.js
rouletteSpinsStore.js
src/tracker/RouletteTracker.js
src/tracker/SpinManager.js
src/tracker/DelayManager.js
```

No modifiques el contrato ni el schema salvo incompatibilidad objetiva, mínima, demostrada y documentada.

---

# 16. PRUEBAS OBLIGATORIAS

Crea pruebas unitarias suficientes para cubrir como mínimo:

## 16.1 Construcción básica

* El adaptador puede instanciarse o invocarse.
* Rechaza dependencias inválidas cuando corresponda.
* No depende del DOM.
* No depende de renderer.
* No depende de ViewModel.

## 16.2 Universo americano

* Genera exactamente 38 señales.
* Incluye `"0"`.
* Incluye `"00"`.
* Incluye `"1"` a `"36"`.
* No genera duplicados.
* No colapsa `"00"` en `"0"`.

## 16.3 Source engine

Cada señal debe contener:

```javascript
sourceEngines: ["AtRep"]
```

## 16.4 Familias

Verifica:

```javascript
rawSignals.delay === null
rawSignals.winWin === null
rawSignals.pci !== null
```

## 16.5 Mapeo PCI

Comprueba, cuando estén disponibles:

```text
occurrences
meanDist
expectedDist
pciIndividual
pciCombined
pciBySet
```

Cuando no estén disponibles:

* usa `null` o el valor neutral permitido;
* genera warnings apropiados;
* no inventa datos.

## 16.6 Conservación de escala

Utiliza fixtures con valores reconocibles para demostrar que el adaptador:

* no recalcula PCI;
* no cambia signo;
* no cambia escala;
* no redondea arbitrariamente;
* no combina valores.

## 16.7 `pciBySet`

Verifica que:

* el array se copia defensivamente;
* cada objeto interno se copia;
* solo contiene campos permitidos;
* no comparte referencias entre señales;
* maneja valores nulos o inválidos.

## 16.8 Verdict

Si el contrato no permite representarlo:

* verifica que no se agregue una propiedad desconocida;
* verifica el warning correspondiente;
* documenta la limitación.

Si el contrato sí permite representarlo, usa el mecanismo real aprobado.

## 16.9 Membership risk

Añade una prueba de caracterización, cuando sea posible, para el comportamiento actual de `setsIn` o membresía.

La prueba no debe corregir el motor.

La prueba debe dejar explícito que captura comportamiento actual.

## 16.10 Evidence

Verifica:

```text
occurrences
sampleSize
activeSets
windowSize
historyLength
supportCount
signalQuality
```

según los datos realmente disponibles.

## 16.11 Metadata

Verifica:

```text
valid
warnings
missingSignals
provenance
```

## 16.12 Warnings estructurados

Cada warning debe ser un objeto con la estructura esperada.

No debe ser un string.

## 16.13 Provenance

Comprueba:

```text
engine real
archivo real
método real
```

## 16.14 Datos incompletos

Prueba escenarios con:

```text
historial vacío
muestra insuficiente
cero ocurrencias
meanDist nulo
expectedDist nulo
PCI individual nulo
PCI combinado nulo
pciBySet vacío
setsIn vacío
verdict ausente
salida parcial
salida inesperada
NaN
Infinity
números inválidos
```

## 16.15 No mutación

Demuestra que:

* no modifica inputs;
* no modifica la salida de AtRep;
* no comparte arrays;
* no comparte objetos internos.

## 16.16 Validación

Cada señal debe pasar por:

```text
validateConsensusSignal()
```

o el mecanismo real existente.

Distingue:

```text
error estructural
warning de evidencia
warning de limitación semántica
```

## 16.17 Regresión

Ejecuta la suite completa para demostrar que no se rompe:

```text
LabConAdapter
LabCon1Adapter
ConsensusSignal
AtRep
Lab_Con
Lab_Con1
resto del proyecto
```

---

# 17. PROHIBICIONES EXPLÍCITAS

Está prohibido:

```text
modificar atRepEngine.js
corregir el posible bug de membresía
copiar fórmulas PCI
recalcular meanDist
recalcular expectedDist
combinar PCI manualmente
reinterpretar verdict
modificar LabConAdapter
modificar LabCon1Adapter salvo defecto imprescindible demostrado
crear SignalCollector
integrar adaptadores
normalizar señales
crear pesos
crear consenso
crear ranking
crear recomendaciones
integrar UI
corregir lint preexistente
hacer refactors generales
hacer commits automáticos
crear tags automáticos
hacer push
```

No describas AtRep como mecanismo de predicción garantizada.

No uses:

```text
número seguro
número ganador
predicción cierta
garantía
```

---

# 18. VALIDACIONES A EJECUTAR

Ejecuta:

```bash
npm test -- tests/consensus/AtRepAdapter.test.js
```

Luego:

```bash
npm test -- tests/consensus
```

Después:

```bash
npm run test
```

Después:

```bash
npm run build
```

Finalmente:

```bash
npm run lint
```

Si lint falla únicamente por:

```text
tests/atRepRenderer.test.js
tests/atRepViewModel.test.js
```

documenta la deuda preexistente y no la corrijas.

Si aparecen errores nuevos en archivos de esta fase, deben resolverse antes de declarar `GO`.

---

# 19. REPORTE OBLIGATORIO

Genera:

```text
reports/consensus/PHASE_1_3_ATREP_ADAPTER.md
```

Debe incluir:

## 19.1 Resumen ejecutivo

* objetivo;
* alcance;
* resultado;
* estado final:

  * `GO`;
  * `GO CON CONDICIONES`;
  * `NO-GO`.

## 19.2 Archivos

* creados;
* modificados;
* confirmación de archivos protegidos intactos.

## 19.3 Inspección de AtRep

Documenta:

* archivo real;
* clase o API;
* métodos públicos;
* estructura de resultados;
* señales disponibles;
* señales no disponibles;
* campos internos descartados;
* dependencias;
* estado mutable;
* relación con ViewModel y renderer.

## 19.4 Tabla de mapeo

Incluye una tabla con nombres reales:

| Origen AtRep | ConsensusSignal                | Transformación  | Ausencia      |
| ------------ | ------------------------------ | --------------- | ------------- |
| Campo real   | `rawSignals.pci.occurrences`   | Copia directa   | `0` + warning |
| Campo real   | `rawSignals.pci.meanDist`      | Copia directa   | `null`        |
| Campo real   | `rawSignals.pci.expectedDist`  | Copia directa   | `null`        |
| Campo real   | `rawSignals.pci.pciIndividual` | Copia directa   | `null`        |
| Campo real   | `rawSignals.pci.pciCombined`   | Copia directa   | `null`        |
| Campo real   | `rawSignals.pci.pciBySet`      | Copia defensiva | `[]`          |

Sustituye “Campo real” por los nombres encontrados.

## 19.5 Escalas y semántica

Documenta:

```text
rango de PCI
significado del signo
redondeo
nulabilidad
condiciones de muestra
semántica de verdict
semántica de setsIn
```

No hagas afirmaciones no respaldadas por el código.

## 19.6 Riesgo de membresía

Incluye una sección específica:

```text
RIESGO CONOCIDO — getNumeroScores()
```

Indica:

* comportamiento observado;
* si pudo reproducirse;
* si se añadió test de caracterización;
* impacto potencial;
* confirmación de que no se corrigió;
* recomendación para microfase posterior.

## 19.7 Decisiones de diseño

Explica:

* interfaz del adaptador;
* consistencia con adaptadores anteriores;
* copias defensivas;
* manejo de nulos;
* valores no finitos;
* warnings;
* provenance;
* validación;
* tratamiento de verdict;
* tratamiento de setsIn.

## 19.8 Pruebas

Incluye:

* archivos;
* cantidad de tests;
* casos;
* comandos;
* resultados exactos.

## 19.9 Build y lint

Documenta:

```text
npm run build
npm run lint
```

Distingue errores nuevos de deuda previa.

## 19.10 Restricciones confirmadas

Confirma:

```text
No se modificó atRepEngine.js.
No se modificó atRepRenderer.js.
No se modificó atRepViewModel.js.
No se modificó Lab_Con.
No se modificó Lab_Con1.
No se corrigió el posible bug.
No se implementó SignalCollector.
No se implementó consenso.
No se integró UI.
No se alteraron fórmulas estadísticas.
No se hicieron commits ni push.
```

## 19.11 Recomendación final

Indica si el proyecto puede avanzar a:

```text
FASE 1.4 — SignalCollector
```

No implementes la Fase 1.4.

---

# 20. CRITERIOS DE ACEPTACIÓN

La fase será aceptable únicamente si:

* existe `AtRepAdapter`;
* genera 38 señales;
* preserva `"0"` y `"00"`;
* usa `ConsensusSignal`;
* deja `delay` en `null`;
* deja `winWin` en `null`;
* utiliza `rawSignals.pci`;
* conserva valores crudos;
* no recalcula PCI;
* no cambia escalas;
* no modifica AtRep;
* no corrige el posible bug;
* maneja nulos y valores no finitos;
* genera warnings estructurados;
* incluye provenance;
* realiza copias defensivas;
* valida señales;
* incluye pruebas;
* pasan pruebas específicas;
* pasa suite de consenso;
* pasa suite global;
* pasa build;
* no introduce lint nuevo;
* genera reporte.

---

# 21. MANEJO DE INCOMPATIBILIDADES

Si el contrato actual no puede representar correctamente una salida de AtRep:

1. No fuerces el dato.
2. No reutilices un campo con semántica distinta.
3. No agregues propiedades desconocidas.
4. No modifiques inmediatamente el contrato.
5. Documenta la incompatibilidad.
6. Usa `null` cuando corresponda.
7. Añade warning.
8. Propón una microfase futura.

Solo modifica infraestructura compartida si existe un defecto objetivo que impida implementar el adaptador y la corrección es:

```text
mínima
demostrable
probada
compatible con Fases 1.1 y 1.2
documentada
```

---

# 22. SALIDA FINAL DE LA EJECUCIÓN

Entrega:

```text
FASE 1.3 — AtRepAdapter

Estado:
GO / GO CON CONDICIONES / NO-GO

Archivos creados:
- ...

Archivos modificados:
- ...

Pruebas específicas:
- comando
- resultado

Pruebas de consenso:
- comando
- resultado

Suite global:
- comando
- resultado

Build:
- resultado

Lint:
- resultado
- deuda preexistente o errores nuevos

Riesgo de membresía:
- reproducido / no reproducido
- test de caracterización: sí / no
- corrección aplicada: NO

Restricciones:
- atRepEngine.js intacto
- renderer intacto
- ViewModel intacto
- Lab_Con intacto
- Lab_Con1 intacto
- SignalCollector no implementado
- UI no integrada
- fórmulas intactas

Reporte:
reports/consensus/PHASE_1_3_ATREP_ADAPTER.md

Siguiente fase recomendada:
FASE 1.4 — SignalCollector
```

---

# 23. INSTRUCCIÓN FINAL

Ejecuta ahora exclusivamente:

```text
FASE 1.3 — AtRepAdapter
```

Primero inspecciona el código real.

Después implementa:

```text
adaptador
exportaciones
pruebas
reporte
```

No corrijas AtRep.

No implementes `SignalCollector`.

No integres los tres adaptadores.

No te limites a describir el trabajo: realiza los cambios, ejecuta validaciones y documenta resultados.
