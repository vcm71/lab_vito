# PROMPT DE EJECUCIÓN — FASE 1.2

## Implementación de `LabCon1Adapter`

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

Debes trabajar como arquitecto principal de software e ingeniero senior, respetando estrictamente Clean Architecture, SOLID, Dependency Inversion, Open/Closed Principle, contratos serializables, pruebas automatizadas y ejecución por microfases.

---

# 1. CONTEXTO DEL PROYECTO

El proyecto está construyendo un:

```text
MotorConsensoCalibrado
```

que integrará señales estadísticas provenientes de tres motores existentes:

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

Actualmente están completadas y aprobadas:

```text
FASE 0   — Auditoría arquitectónica
FASE 0.5 — Contrato ConsensusSignal
FASE 1.0 — Infraestructura base de src/consensus/
FASE 1.1 — LabConAdapter
```

La siguiente microfase es exclusivamente:

```text
FASE 1.2 — LabCon1Adapter
```

---

# 2. ESTADO VALIDADO ANTES DE ESTA FASE

La infraestructura existente incluye:

```text
src/consensus/
├── adapters/
│   ├── LabConAdapter.js
│   └── index.js
├── constants/
├── contracts/
├── utils/
├── validators/
├── consensusSignalFactory.js
└── index.js
```

La Fase 1.1 informó:

```text
npm test -- tests/consensus/LabConAdapter.test.js
→ OK

npm run test
→ 196/196 tests aprobados

npm run build
→ OK
```

El lint presenta errores preexistentes ajenos a esta fase en:

```text
tests/atRepRenderer.test.js
tests/atRepViewModel.test.js
```

No debes corregir esos errores durante esta microfase.

Antes de implementar, verifica el estado real del repositorio y confirma las rutas existentes.

---

# 3. OBJETIVO ÚNICO DE LA FASE 1.2

Implementar:

```text
LabCon1Adapter
```

como adaptador entre:

```text
Lab_Con1
```

y:

```text
ConsensusSignal
```

El adaptador debe transformar las salidas públicas disponibles de `Lab_Con1` en señales compatibles con el contrato `ConsensusSignal`.

Debe generar una señal independiente para cada uno de los 38 números de la ruleta americana:

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
preservar datos originales
```

El adaptador no debe:

```text
copiar fórmulas estadísticas de Lab_Con1
modificar Lab_Con1
reescribir cálculos
normalizar estadísticamente
fusionar señales
crear pesos de consenso
implementar SignalCollector
implementar ConsensusEngine
integrarse con la UI
depender del DOM
depender de renderers
depender de ViewModels
inventar campos
calcular aproximaciones silenciosas
introducir caching prematuro
```

---

# 5. INSPECCIÓN OBLIGATORIA ANTES DE PROGRAMAR

Antes de escribir código, localiza e inspecciona cuidadosamente:

```text
labCon1Engine.js
```

o la ruta real equivalente.

También revisa:

```text
src/consensus/adapters/LabConAdapter.js
src/consensus/adapters/index.js
src/consensus/consensusSignalFactory.js
src/consensus/contracts/
src/consensus/validators/
src/consensus/constants/
tests/consensus/LabConAdapter.test.js
reports/consensus/PHASE_1_1_LABCON_ADAPTER.md
reports/consensus/PHASE_1_0_CONSENSUS_INFRASTRUCTURE.md
reports/consensus/PHASE_0_5_SIGNAL_CONTRACT.md
```

La implementación de `LabCon1Adapter` debe seguir las convenciones reales establecidas por `LabConAdapter`, siempre que sean compatibles con el contrato aprobado.

No copies ciegamente el adaptador anterior. Primero determina:

1. Qué datos expone realmente `Lab_Con1`.
2. Qué métodos son públicos.
3. Qué argumentos necesita.
4. Qué estructura devuelve.
5. Cómo genera scores individuales.
6. Cómo representa números.
7. Cómo representa conjuntos activos.
8. Cómo calcula y expone rachas o distancias.
9. Qué datos no están disponibles.
10. Si algún resultado depende de configuración, historial o estado mutable.

No accedas innecesariamente a propiedades privadas o internas.

Si la información necesaria no está disponible mediante una API pública razonable:

* no inventes el valor;
* utiliza `null` cuando el contrato lo permita;
* registra la señal como ausente;
* genera un warning estructurado;
* documenta la limitación.

---

# 6. SEÑALES CONCEPTUALES DE LAB_CON1

`Lab_Con1` está orientado principalmente a:

```text
distancias
rachas Win-Win
atraso
threshold
nivel
activación
peso Win-Win
presión
distribución hacia números individuales
intersecciones
```

Las señales identificadas previamente incluyen:

```text
dists
atraso
level
isActive
threshold
weight
distsCount
pressure
score individual de resolverScoresIndividuales()
intersecciones óptimas
```

Estas referencias son conceptuales.

Debes verificar en el código real:

* nombres exactos;
* tipos;
* escalas;
* nulabilidad;
* estructura;
* disponibilidad;
* relación con cada número.

No asumas que todos estos campos están disponibles directamente.

---

# 7. MAPEO HACIA CONSENSUSSIGNAL

La familia principal para `LabCon1Adapter` será:

```javascript
rawSignals.winWin
```

La salida conceptual esperada por número es:

```javascript
{
  sourceEngines: ["Lab_Con1"],

  rawSignals: {
    delay: null,

    winWin: {
      atraso: null,
      threshold: null,
      level: null,
      isActive: false,
      streakLength: null,
      streakBonus: null,
      recencyBonus: null,
      winWinScore: null
    },

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
    valid: true,
    warnings: [],
    missingSignals: [],
    provenance: []
  }
}
```

Esta estructura es conceptual y debe adaptarse al schema y factory reales existentes.

No agregues propiedades no permitidas por el contrato.

---

# 8. REGLAS DE MAPEO

Aplica estas reglas:

## 8.1 `atraso`

Mapea el atraso disponible para el número o para los conjuntos que lo soportan.

No confundas:

```text
atraso
```

con:

```text
actualDelay
```

La señal pertenece a la familia `winWin`, no a `delay`.

---

## 8.2 `threshold`

Usa únicamente el threshold realmente expuesto por `Lab_Con1`.

Si el threshold depende de un conjunto y un número pertenece a varios conjuntos:

* conserva la trazabilidad;
* no selecciones arbitrariamente un valor;
* usa el criterio real del motor si existe;
* documenta cualquier agregación ya realizada por el motor;
* no crees una fórmula nueva en el adaptador.

---

## 8.3 `level`

Debe reflejar el nivel real informado por el motor.

Si no existe nivel:

```javascript
level: null
```

No conviertas silenciosamente valores desconocidos en etiquetas inventadas.

---

## 8.4 `isActive`

Debe derivarse únicamente de un indicador explícito del motor o de una salida pública inequívoca.

No reproduzcas en el adaptador la fórmula de activación.

Si el motor no expone activación por número, determina si la salida de score individual ya incorpora esa lógica.

Si no es posible conocerla correctamente:

```javascript
isActive: false
```

acompañado de un warning que indique la ausencia del dato.

---

## 8.5 `streakLength`

Puede corresponder conceptualmente a:

```text
dists
distsCount
longitud de racha
```

Pero debes confirmar la semántica real.

No mapees automáticamente `dists` a `streakLength` si `dists` es una colección o representa otra magnitud.

Documenta la decisión exacta.

---

## 8.6 `streakBonus`

Solo debe poblarse si el motor expone un bono separado y explícito de racha.

Si no existe:

```javascript
streakBonus: null
```

No derives un bono desde `weight`.

---

## 8.7 `recencyBonus`

Solo debe poblarse si existe una señal explícita equivalente.

Si no existe:

```javascript
recencyBonus: null
```

No la calcules a partir de atraso, distancia o presión.

---

## 8.8 `winWinScore`

Debe representar preferentemente el score individual final producido por:

```text
resolverScoresIndividuales()
```

o el método público real equivalente.

No copies la fórmula del score al adaptador.

Si el motor expone `weight` por conjunto y luego distribuye ese peso hacia números individuales, utiliza la salida individual ya resuelta.

No sumes nuevamente los pesos en el adaptador.

---

# 9. EVIDENCE

Completa `evidence` únicamente con información disponible y demostrable.

## 9.1 `occurrences`

Usa ocurrencias solo si `Lab_Con1` las expone con semántica clara.

Si no están disponibles:

```javascript
occurrences: 0
```

y registra la ausencia cuando corresponda.

---

## 9.2 `sampleSize`

Debe representar el tamaño real de muestra utilizado por el motor.

Puede corresponder al historial o ventana efectiva, pero debes comprobarlo.

No inventes el valor.

---

## 9.3 `activeSets`

Debe contener únicamente los conjuntos activos que realmente soportan al número actual.

No uses una unión global que asigne todos los conjuntos activos a todos los números.

Copia defensivamente el array.

No compartas la misma referencia entre señales.

---

## 9.4 `windowSize`

Debe provenir de configuración o estado público verificable.

Si no está disponible:

```javascript
windowSize: 0
```

con warning si el dato es importante para interpretar la señal.

---

## 9.5 `historyLength`

Debe reflejar la cantidad real de spins procesados o recibidos por el adaptador.

No debe calcularse desde una fuente no relacionada.

---

## 9.6 `supportCount`

Debe reflejar cuántos conjuntos o fuentes internas válidas soportan la señal del número.

No debe ser mayor que la cantidad real de conjuntos asociados.

No confundas `supportCount` con cantidad de spins.

---

## 9.7 `signalQuality`

Utiliza únicamente los valores permitidos por las constantes existentes:

```text
INSUFFICIENT
LOW
MEDIUM
HIGH
```

No inventes nuevas categorías.

La clasificación debe reutilizar reglas existentes si ya están implementadas.

No diseñes en esta fase una política estadística nueva de calidad.

Si no existe regla aprobada, utiliza un criterio estructural conservador basado en disponibilidad de evidencia y documéntalo claramente.

---

# 10. METADATA

## 10.1 `valid`

Debe reflejar la validación estructural real del `ConsensusSignal`.

No debe usarse para indicar que una señal es predictivamente buena.

Una señal incompleta puede ser estructuralmente válida.

---

## 10.2 `warnings`

Los warnings deben ser objetos estructurados.

Formato conceptual:

```javascript
{
  code: "LABCON1_MISSING_THRESHOLD",
  message: "Lab_Con1 no expone threshold para este número.",
  severity: "WARNING",
  source: "Lab_Con1"
}
```

Reutiliza constantes o convenciones existentes cuando sea posible.

No uses strings simples.

Evita duplicar warnings idénticos dentro de una misma señal.

Ejemplos posibles, solo cuando correspondan realmente:

```text
LABCON1_MISSING_ATRASO
LABCON1_MISSING_THRESHOLD
LABCON1_MISSING_LEVEL
LABCON1_MISSING_ACTIVE_STATE
LABCON1_MISSING_STREAK_LENGTH
LABCON1_MISSING_INDIVIDUAL_SCORE
LABCON1_INVALID_NUMBER
LABCON1_INVALID_ENGINE_OUTPUT
LABCON1_INSUFFICIENT_EVIDENCE
```

No agregues warnings innecesarios por campos que legítimamente pertenecen a otros motores.

Por ejemplo, `delay` y `pci` estarán ausentes por diseño y no necesariamente requieren un warning.

---

## 10.3 `missingSignals`

Debe ser compatible con el comportamiento de:

```text
createConsensusSignal()
```

No mantengas manualmente una lista contradictoria con la factory.

Verifica cómo calcula actualmente las señales ausentes.

La ausencia esperada de:

```text
delay
pci
```

debe representarse según las reglas ya implementadas.

---

## 10.4 `provenance`

Registra la procedencia real de las señales.

Formato conceptual:

```javascript
{
  engine: "Lab_Con1",
  file: "labCon1Engine.js",
  method: "resolverScoresIndividuales",
  version: null
}
```

Usa los nombres reales de archivo y método.

Si se utilizan varios métodos públicos, registra provenance suficiente para identificar las fuentes.

No inventes versiones.

---

# 11. DISEÑO PROPUESTO DEL ADAPTADOR

La interfaz concreta debe seguir el patrón real de `LabConAdapter`.

Como referencia conceptual, puede ser:

```javascript
const adapter = new LabCon1Adapter(labCon1Engine);

const signals = adapter.adapt({
  spins,
  settings
});
```

o:

```javascript
const signals = LabCon1Adapter.adapt({
  engine,
  spins,
  settings
});
```

No impongas esta forma si `LabConAdapter` ya estableció otra convención.

Prioriza consistencia entre adaptadores.

El adaptador debe devolver una colección claramente definida, preferentemente un array de 38 `ConsensusSignal`, salvo que el patrón existente use otra estructura.

No integres aún esta salida con otros adaptadores.

---

# 12. COPIAS DEFENSIVAS E INMUTABILIDAD

El adaptador no debe mutar:

```text
spins
settings
Lab_Con1
resultados internos del motor
arrays de conjuntos
objetos de configuración
ConsensusSignal ya creados
```

Cada señal debe tener referencias independientes en:

```text
sourceEngines
activeSets
warnings
provenance
missingSignals
rawSignals
evidence
metadata
```

Agrega pruebas que demuestren que modificar una señal no altera:

* otra señal;
* la salida original del motor;
* la configuración;
* los arrays entregados al adaptador.

Si el adaptador soporta opciones de congelamiento, verifica el comportamiento profundo conforme al patrón existente.

---

# 13. ARCHIVOS A CREAR O MODIFICAR

Crea:

```text
src/consensus/adapters/LabCon1Adapter.js
tests/consensus/LabCon1Adapter.test.js
reports/consensus/PHASE_1_2_LABCON1_ADAPTER.md
```

Actualiza únicamente cuando corresponda:

```text
src/consensus/adapters/index.js
src/consensus/index.js
```

No modifiques archivos ajenos a la microfase salvo que exista una necesidad técnica demostrable y documentada.

No modifiques:

```text
labCon1Engine.js
labEngine.js
atRepEngine.js
atRepRenderer.js
src/viewmodels/atRepViewModel.js
main.js
rouletteSettingsStore.js
rouletteSpinsStore.js
src/tracker/RouletteTracker.js
src/tracker/SpinManager.js
src/tracker/DelayManager.js
```

---

# 14. PRUEBAS OBLIGATORIAS

Crea pruebas unitarias suficientes para cubrir como mínimo:

## 14.1 Construcción básica

* El adaptador puede instanciarse o invocarse según la interfaz definida.
* Rechaza dependencias inválidas cuando corresponda.
* No depende del DOM.
* No depende de la UI.

## 14.2 Universo americano

* Genera exactamente 38 señales.
* Incluye `"0"`.
* Incluye `"00"`.
* Incluye `"1"` a `"36"`.
* No genera duplicados.
* No colapsa `"00"` en `"0"`.

## 14.3 Source engine

Cada señal debe contener:

```javascript
sourceEngines: ["Lab_Con1"]
```

## 14.4 Familias de señales

Debe verificarse:

```javascript
rawSignals.delay === null
rawSignals.pci === null
rawSignals.winWin !== null
```

## 14.5 Mapeo Win-Win

Verifica, cuando estén disponibles:

```text
atraso
threshold
level
isActive
streakLength
streakBonus
recencyBonus
winWinScore
```

Cuando no estén disponibles:

* usar `null` o el valor neutral permitido;
* generar warnings apropiados;
* no inventar datos.

## 14.6 Score individual

Verifica que `winWinScore` proviene de la salida pública individual del motor y no de una fórmula duplicada dentro del adaptador.

Usa mocks o fixtures controlados para demostrarlo.

## 14.7 Active sets

Verifica que:

* cada número recibe únicamente los conjuntos que realmente lo contienen;
* los arrays se copian defensivamente;
* señales distintas no comparten referencias;
* un número sin conjuntos activos recibe `[]`.

## 14.8 Evidence

Verifica:

```text
sampleSize
windowSize
historyLength
supportCount
signalQuality
```

según la información realmente disponible.

## 14.9 Metadata

Verifica:

```text
valid
warnings
missingSignals
provenance
```

## 14.10 Warnings estructurados

Comprueba que cada warning tenga la forma esperada y que no sea un string simple.

## 14.11 Provenance

Comprueba que señale:

```text
Lab_Con1
archivo real
método real utilizado
```

## 14.12 Datos incompletos

Prueba escenarios con:

* historial vacío;
* resultados incompletos;
* score faltante;
* threshold faltante;
* nivel faltante;
* arrays vacíos;
* valores nulos;
* números inválidos;
* salida inesperada del motor.

## 14.13 No mutación

Demuestra que:

* el adaptador no modifica inputs;
* no modifica la salida original del motor;
* las señales no comparten arrays u objetos mutables.

## 14.14 Validación

Cada señal producida debe pasar por:

```text
validateConsensusSignal()
```

o por el mecanismo de validación real definido en la infraestructura.

Diferencia entre:

```text
error estructural
warning por evidencia insuficiente
```

## 14.15 Regresión

Ejecuta la suite completa para demostrar que no se rompe:

```text
LabConAdapter
ConsensusSignal
AtRep
Lab_Con
Lab_Con1
resto del proyecto
```

---

# 15. PROHIBICIONES EXPLÍCITAS

Durante esta fase está prohibido:

```text
modificar fórmulas de Lab_Con1
copiar fórmulas dentro del adaptador
modificar LabConAdapter salvo corrección imprescindible y demostrada
crear SignalCollector
integrar LabConAdapter y LabCon1Adapter
fusionar señales
normalizar scores
crear pesos de consenso
crear ranking de números
crear recomendaciones
integrar UI
corregir AtRep
corregir lint preexistente
hacer refactors generales
cambiar nombres públicos sin necesidad
crear commits automáticos
crear tags automáticos
hacer push
```

No describas ninguna señal como garantía predictiva.

No uses expresiones como:

```text
número seguro
número ganador
probabilidad garantizada
predicción cierta
```

---

# 16. VALIDACIONES A EJECUTAR

Ejecuta como mínimo:

```bash
npm test -- tests/consensus/LabCon1Adapter.test.js
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

Si el lint falla únicamente por los errores preexistentes conocidos en:

```text
tests/atRepRenderer.test.js
tests/atRepViewModel.test.js
```

documenta el resultado, pero no los corrijas.

Si aparecen errores nuevos en archivos creados o modificados por esta fase, deben corregirse antes de declarar la fase completada.

---

# 17. REPORTE OBLIGATORIO

Genera:

```text
reports/consensus/PHASE_1_2_LABCON1_ADAPTER.md
```

El reporte debe incluir:

## 17.1 Resumen ejecutivo

* objetivo;
* alcance;
* resultado;
* estado final `GO`, `GO CON CONDICIONES` o `NO-GO`.

## 17.2 Archivos

* archivos creados;
* archivos modificados;
* confirmación de archivos no modificados.

## 17.3 Inspección de Lab_Con1

Documenta:

* archivo real;
* API pública utilizada;
* métodos invocados;
* estructura de salida;
* señales disponibles;
* señales no disponibles;
* estado mutable detectado;
* dependencias relevantes.

## 17.4 Tabla de mapeo

Incluye una tabla como:

| Campo de origen | Campo ConsensusSignal            | Transformación       | Ausencia          |
| --------------- | -------------------------------- | -------------------- | ----------------- |
| Campo real      | `rawSignals.winWin.atraso`       | Copia directa        | `null` + warning  |
| Campo real      | `rawSignals.winWin.threshold`    | Copia directa        | `null` + warning  |
| Campo real      | `rawSignals.winWin.level`        | Copia directa        | `null`            |
| Campo real      | `rawSignals.winWin.isActive`     | Copia directa        | `false` + warning |
| Campo real      | `rawSignals.winWin.streakLength` | Semántica verificada | `null`            |
| Campo real      | `rawSignals.winWin.winWinScore`  | Score individual     | `null` + warning  |

Usa nombres reales, no placeholders, en el reporte final.

## 17.5 Decisiones de diseño

Explica:

* interfaz elegida;
* consistencia con `LabConAdapter`;
* estrategia de copia defensiva;
* manejo de nulos;
* warnings;
* provenance;
* validación;
* calidad de señal.

## 17.6 Pruebas

Incluye:

* cantidad de archivos de test;
* cantidad de tests;
* casos cubiertos;
* comandos ejecutados;
* resultados exactos.

## 17.7 Build y lint

Documenta:

```text
npm run build
npm run lint
```

Distingue errores nuevos de deuda preexistente.

## 17.8 Riesgos o limitaciones

Documenta cualquier señal que `Lab_Con1` no exponga directamente.

No presentes inferencias como datos reales.

## 17.9 Confirmación de restricciones

Confirma explícitamente:

```text
No se modificó labCon1Engine.js.
No se modificó Lab_Con.
No se modificó AtRep.
No se implementó SignalCollector.
No se implementó consenso.
No se integró UI.
No se alteraron fórmulas estadísticas.
No se hicieron commits ni push.
```

## 17.10 Recomendación final

Indica si el proyecto puede avanzar a:

```text
FASE 1.3 — AtRepAdapter
```

No avances ni implementes la Fase 1.3 dentro de esta ejecución.

---

# 18. CRITERIOS DE ACEPTACIÓN

La fase será aceptable únicamente si:

* existe `LabCon1Adapter`;
* genera señales para los 38 números;
* preserva `"0"` y `"00"`;
* usa el contrato `ConsensusSignal`;
* mapea únicamente datos reales;
* no duplica fórmulas;
* no modifica `labCon1Engine.js`;
* deja `delay` en `null`;
* deja `pci` en `null`;
* utiliza `rawSignals.winWin`;
* genera warnings estructurados;
* incluye provenance;
* realiza copias defensivas;
* valida las señales;
* incluye pruebas unitarias;
* pasan las pruebas específicas;
* pasa la suite de consenso;
* pasa la suite global;
* pasa el build;
* no introduce errores nuevos de lint;
* genera el reporte obligatorio.

---

# 19. MANEJO DE INCOMPATIBILIDADES

Si durante la inspección descubres que el contrato actual no puede representar correctamente una señal real de `Lab_Con1`:

1. No modifiques inmediatamente el contrato.
2. No fuerces el dato en un campo semánticamente incorrecto.
3. Documenta la incompatibilidad.
4. Usa `null` cuando sea válido.
5. Genera un warning estructurado.
6. Propón una modificación futura claramente separada.
7. Mantén la Fase 1.2 limitada al contrato vigente.

Solo modifica infraestructura compartida si existe un defecto objetivo que impida implementar correctamente el adaptador y si la corrección:

* es mínima;
* está probada;
* no rompe Fase 1.1;
* queda documentada.

---

# 20. SALIDA FINAL DE LA EJECUCIÓN

Al terminar, entrega un resumen con este formato:

```text
FASE 1.2 — LabCon1Adapter

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

Restricciones:
- labCon1Engine.js intacto
- Lab_Con intacto
- AtRep intacto
- SignalCollector no implementado
- UI no integrada
- fórmulas estadísticas intactas

Reporte:
reports/consensus/PHASE_1_2_LABCON1_ADAPTER.md

Siguiente fase recomendada:
FASE 1.3 — AtRepAdapter
```

---

# 21. INSTRUCCIÓN FINAL

Ejecuta ahora exclusivamente la:

```text
FASE 1.2 — LabCon1Adapter
```

Primero inspecciona el código real.

Después implementa el adaptador, sus exportaciones, pruebas y reporte.

Respeta estrictamente el contrato existente y las restricciones arquitectónicas.

No implementes ninguna fase posterior.

No te limites a explicar qué harías: realiza los cambios en el repositorio, ejecuta las validaciones y documenta los resultados.
