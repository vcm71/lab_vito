# PROMPT DE EJECUCIÓN — FASE 1.4

## Implementación de `SignalCollector`

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

Debes actuar como arquitecto principal de software e ingeniero senior, respetando estrictamente:

```text
Clean Architecture
SOLID
Dependency Inversion
Open/Closed Principle
contratos serializables
inmutabilidad
copias defensivas
trazabilidad
aislamiento de fallos
pruebas automatizadas
compatibilidad con ruleta americana
```

---

# 1. CONTEXTO DEL PROYECTO

El proyecto está construyendo un:

```text
MotorConsensoCalibrado
```

que integrará señales producidas por:

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

Las fases completadas son:

```text
FASE 0   — Auditoría arquitectónica
FASE 0.5 — Contrato ConsensusSignal
FASE 1.0 — Infraestructura base de consenso
FASE 1.1 — LabConAdapter
FASE 1.2 — LabCon1Adapter
FASE 1.3 — AtRepAdapter
```

La microfase actual es exclusivamente:

```text
FASE 1.4 — SignalCollector
```

No implementes ninguna fase posterior.

---

# 2. ESTADO VALIDADO ANTES DE ESTA FASE

Actualmente existen tres adaptadores:

```text
src/consensus/adapters/LabConAdapter.js
src/consensus/adapters/LabCon1Adapter.js
src/consensus/adapters/AtRepAdapter.js
```

Cada adaptador genera un `ConsensusSignal` por cada número de la ruleta americana:

```text
"0"
"00"
"1"
"2"
...
"36"
```

La última validación reportada fue:

```text
npm test
→ 200/200 tests aprobados

npm run lint
→ OK

npm run build
→ OK
```

Antes de implementar, verifica el estado real del repositorio y confirma que las suites siguen pasando.

---

# 3. OBJETIVO ÚNICO DE LA FASE 1.4

Implementar:

```text
SignalCollector
```

El `SignalCollector` debe ejecutar u orquestar los tres adaptadores y reunir sus resultados en una estructura agrupada por número.

El colector debe integrar:

```text
LabConAdapter
LabCon1Adapter
AtRepAdapter
```

Debe conservar las señales originales de cada motor sin:

```text
fusionarlas
promediarlas
sumarlas
ponderarlas
normalizarlas
reinterpretarlas
seleccionar ganadores
calcular consenso
calcular probabilidades
calibrar scores
generar recomendaciones
```

El `SignalCollector` es exclusivamente una capa de:

```text
orquestación
recolección
agrupación
validación de colección
aislamiento de errores
trazabilidad
```

---

# 4. RESPONSABILIDAD ARQUITECTÓNICA

El `SignalCollector` debe recibir dependencias mediante inyección.

No debe construir directamente los engines ni los adaptadores, salvo que el patrón real del proyecto ya defina una factory externa específica.

Diseño conceptual:

```javascript
const collector = new SignalCollector({
  labConAdapter,
  labCon1Adapter,
  atRepAdapter
});

const result = collector.collect({
  spins,
  settings
});
```

La interfaz definitiva debe seguir las convenciones reales de los adaptadores existentes.

El colector debe depender de contratos públicos, no de implementaciones internas.

---

# 5. SALIDA ESPERADA

La salida debe agrupar señales por número.

Estructura conceptual:

```javascript
{
  numbers: {
    "0": {
      number: "0",
      signals: {
        Lab_Con: ConsensusSignal,
        Lab_Con1: ConsensusSignal,
        AtRep: ConsensusSignal
      }
    },

    "00": {
      number: "00",
      signals: {
        Lab_Con: ConsensusSignal,
        Lab_Con1: ConsensusSignal,
        AtRep: ConsensusSignal
      }
    },

    "1": {
      number: "1",
      signals: {
        Lab_Con: ConsensusSignal,
        Lab_Con1: ConsensusSignal,
        AtRep: ConsensusSignal
      }
    }
  },

  metadata: {
    collectedAt: "ISO-8601",
    enginesRequested: [
      "Lab_Con",
      "Lab_Con1",
      "AtRep"
    ],
    enginesCompleted: [],
    enginesFailed: [],
    totalNumbers: 38,
    totalSignals: 114,
    warnings: []
  }
}
```

Esta estructura es conceptual.

Debes inspeccionar las convenciones existentes antes de fijar la forma definitiva.

La salida debe ser:

```text
serializable
determinista salvo timestamp explícito
estable
fácil de recorrer
compatible con la futura normalización
```

No agregues datos estadísticos derivados.

---

# 6. REGLAS FUNDAMENTALES DE RECOLECCIÓN

## 6.1 Universo americano

El colector debe manejar exactamente estos 38 identificadores:

```text
"0"
"00"
"1"
"2"
...
"36"
```

Debe preservar estrictamente:

```text
"0" !== "00"
```

No conviertas números mediante operaciones que colapsen ambos valores.

Usa el catálogo o normalizador existente en la infraestructura de consenso.

No dupliques una nueva lista si ya existe una constante canónica.

---

## 6.2 Ejecución de adaptadores

El colector debe invocar los adaptadores mediante sus APIs públicas.

No debe:

```text
acceder a los engines directamente
invocar métodos internos de los engines
reproducir lógica de los adaptadores
construir manualmente ConsensusSignal
```

Cada adaptador debe seguir siendo responsable de traducir su motor.

---

## 6.3 Agrupación por número

El colector debe asociar correctamente cada `ConsensusSignal` con su número.

No confíes ciegamente en la posición del array.

Preferentemente, agrupa por el campo identificador real de cada señal.

Debes detectar:

```text
número faltante
número duplicado
número inválido
señal con identificador inconsistente
```

No permitas que una colección desordenada produzca asociaciones incorrectas.

---

## 6.4 Señales por número

Cada número debe poder contener hasta tres señales independientes:

```text
Lab_Con
Lab_Con1
AtRep
```

No mezcles sus campos.

No transformes:

```text
rawSignals.delay
rawSignals.winWin
rawSignals.pci
```

en un único objeto.

La salida debe conservar cada `ConsensusSignal` íntegro.

---

## 6.5 Total esperado

En una ejecución completa y exitosa deben existir:

```text
38 números
3 señales por número
114 señales totales
```

No declares error global automáticamente si un adaptador falla.

Aplica aislamiento de fallos según las reglas de esta fase.

---

# 7. AISLAMIENTO DE FALLOS

El `SignalCollector` debe tolerar el fallo de un adaptador sin perder necesariamente las señales válidas de los demás.

Ejemplo conceptual:

```text
LabConAdapter  → OK
LabCon1Adapter → ERROR
AtRepAdapter   → OK
```

El resultado debe poder conservar:

```text
Lab_Con
AtRep
```

y registrar el fallo de:

```text
Lab_Con1
```

No ocultes errores.

No conviertas excepciones en resultados silenciosos.

Registra:

```text
engine
adapter
tipo de error
mensaje seguro
fase
```

No incluyas stack traces completos dentro de estructuras públicas serializables, salvo que exista un modo diagnóstico explícito.

---

# 8. MODOS DE EJECUCIÓN

Implementa, si encaja con la arquitectura actual, dos modos claramente definidos:

## 8.1 Modo estricto

En modo estricto:

```text
si falla cualquier adaptador
→ la recolección falla
```

El error debe indicar cuál adaptador falló.

## 8.2 Modo tolerante

En modo tolerante:

```text
se conservan resultados válidos
se registran motores fallidos
se generan warnings
```

Si introducir ambos modos aumenta innecesariamente la complejidad o rompe convenciones existentes, implementa inicialmente un modo conservador y documenta la decisión.

No inventes comportamiento ambiguo.

El modo por defecto debe quedar claramente documentado.

---

# 9. VALIDACIÓN DE LAS COLECCIONES

Después de ejecutar cada adaptador, el colector debe validar al menos:

```text
la salida es iterable o array según contrato
cada elemento parece un ConsensusSignal válido
cada número pertenece al universo americano
no existen duplicados dentro del mismo motor
la fuente declarada corresponde al adaptador
las señales están estructuralmente validadas
```

No vuelvas a validar fórmulas estadísticas.

No rechaces una señal solamente porque tenga warnings o datos faltantes.

Diferencia entre:

```text
señal estructuralmente inválida
señal válida con evidencia incompleta
colección incompleta
adaptador fallido
```

---

# 10. COMPROBACIÓN DE SOURCE ENGINES

Cada señal debe declarar correctamente su fuente:

```javascript
["Lab_Con"]
```

o:

```javascript
["Lab_Con1"]
```

o:

```javascript
["AtRep"]
```

El colector debe detectar una inconsistencia como:

```text
una señal devuelta por LabConAdapter que declare AtRep
```

No corrijas silenciosamente `sourceEngines`.

Registra la inconsistencia o rechaza la colección según el modo configurado.

---

# 11. SEÑALES FALTANTES

Si un adaptador exitoso no devuelve señal para un número:

```text
no inventes un ConsensusSignal vacío
no copies la señal de otro número
no clones señales de otro motor
```

Representa la ausencia de forma explícita.

Opciones válidas, según diseño elegido:

```javascript
signals: {
  Lab_Con: signal,
  Lab_Con1: null,
  AtRep: signal
}
```

o una estructura equivalente claramente documentada.

El metadata debe registrar:

```text
motor
número
motivo
```

Distingue entre:

```text
adaptador fallido completamente
adaptador exitoso con número faltante
señal inválida descartada
```

---

# 12. DUPLICADOS

Si un adaptador devuelve dos señales para el mismo número:

* no elijas silenciosamente la primera;
* no elijas silenciosamente la última;
* no las fusiones;
* registra un error de colección;
* en modo estricto, falla;
* en modo tolerante, excluye la fuente conflictiva para ese número o aplica el comportamiento explícito que documentes.

El comportamiento debe ser determinista.

---

# 13. ORDEN DE SALIDA

La salida debe conservar un orden estable de ruleta americana definido por la infraestructura existente.

Si existe una constante canónica, reutilízala.

No dependas de:

```text
orden accidental del objeto
orden devuelto por cada adaptador
orden interno de los engines
```

El orden estable facilita pruebas, normalización y backtesting.

---

# 14. METADATA DEL COLECTOR

La salida debe incluir metadata de colección.

Campos conceptuales:

```javascript
{
  collectedAt: "2026-07-30T12:00:00.000Z",

  enginesRequested: [
    "Lab_Con",
    "Lab_Con1",
    "AtRep"
  ],

  enginesCompleted: [
    "Lab_Con",
    "Lab_Con1",
    "AtRep"
  ],

  enginesFailed: [],

  totalNumbers: 38,
  totalSignals: 114,
  completeNumbers: 38,
  incompleteNumbers: 0,

  warnings: []
}
```

Adapta los nombres a las convenciones reales del proyecto.

`collectedAt` debe poder inyectarse o estabilizarse en pruebas, por ejemplo mediante un proveedor de reloj:

```javascript
clock
now
dateProvider
```

No dependas directamente de `new Date()` si eso vuelve las pruebas no deterministas.

---

# 15. WARNINGS DEL COLECTOR

Los warnings deben ser estructurados.

Formato conceptual:

```javascript
{
  code: "SIGNAL_COLLECTOR_ENGINE_FAILED",
  message: "LabCon1Adapter failed during signal collection.",
  severity: "ERROR",
  source: "SignalCollector",
  engine: "Lab_Con1",
  number: null
}
```

Ejemplos posibles:

```text
SIGNAL_COLLECTOR_ENGINE_FAILED
SIGNAL_COLLECTOR_INVALID_COLLECTION
SIGNAL_COLLECTOR_INVALID_SIGNAL
SIGNAL_COLLECTOR_DUPLICATE_NUMBER
SIGNAL_COLLECTOR_MISSING_NUMBER
SIGNAL_COLLECTOR_UNKNOWN_NUMBER
SIGNAL_COLLECTOR_SOURCE_MISMATCH
SIGNAL_COLLECTOR_INCOMPLETE_NUMBER
```

No reutilices warnings internos de los adaptadores como si fueran errores del colector.

Conserva los warnings propios de cada `ConsensusSignal` dentro de la señal.

Los warnings del colector deben describir problemas de orquestación o colección.

---

# 16. PROVENANCE DE RECOLECCIÓN

No modifiques el provenance interno de los `ConsensusSignal`.

La colección puede incluir provenance adicional de ejecución a nivel global, por ejemplo:

```javascript
{
  collector: "SignalCollector",
  adapters: [
    "LabConAdapter",
    "LabCon1Adapter",
    "AtRepAdapter"
  ]
}
```

No agregues `SignalCollector` como si fuera un motor estadístico.

No alteres:

```javascript
sourceEngines
```

El colector no es una fuente de señal estadística.

---

# 17. COPIAS DEFENSIVAS

El colector no debe mutar:

```text
spins
settings
adaptadores
resultados originales de los adaptadores
ConsensusSignal
warnings
provenance
activeSets
pciBySet
rawSignals
metadata
```

Determina si:

```text
conservar referencias de señales inmutables
```

o:

```text
clonar defensivamente cada señal
```

es más consistente con la infraestructura actual.

Si las señales no están profundamente congeladas, el colector debe proteger la colección contra mutaciones cruzadas.

Agrega pruebas que demuestren que:

* modificar la colección no altera el resultado original del adaptador;
* modificar una señal de un número no altera otra;
* modificar metadata global no altera metadata de señales;
* las entradas no son mutadas.

---

# 18. SINCRONÍA Y ASINCRONÍA

Inspecciona las APIs reales de los adaptadores.

Si todos son síncronos, no conviertas innecesariamente el colector en asíncrono.

Si alguno puede ser asíncrono o se prevé explícitamente esa evolución, documenta la decisión.

No introduzcas:

```text
Promise.all
workers
threads
paralelismo
colas
```

sin necesidad real.

Prioriza una primera implementación simple, determinista y testeable.

---

# 19. NO DUPLICAR REFRESCOS

La Fase 1.3 informó que `AtRepAdapter` realiza un refresco del motor para calcular desde el estado actual.

El `SignalCollector` no debe volver a refrescar AtRep directamente.

Tampoco debe:

```text
refrescar Lab_Con
refrescar Lab_Con1
ejecutar métodos internos de cálculo
```

Cada adaptador debe controlar su interacción con su engine.

El colector solo invoca la API pública del adaptador.

Documenta en el reporte que algunos adaptadores pueden producir efectos controlados sobre sus motores y que el colector no duplica esos efectos.

---

# 20. CONFIGURACIÓN

El colector puede recibir:

```javascript
{
  spins,
  settings,
  mode
}
```

o la forma equivalente usada en los adaptadores.

No modifiques `settings`.

No selecciones subconjuntos arbitrarios de números.

Puedes permitir una selección explícita de adaptadores únicamente si esto resulta útil y no complica el contrato.

Ejemplo conceptual:

```javascript
collector.collect({
  spins,
  settings,
  engines: ["Lab_Con", "AtRep"]
});
```

Sin embargo, el camino principal y obligatorio debe recolectar los tres motores.

Si agregas selección parcial, debe estar probada y documentada.

---

# 21. DEPENDENCIAS INYECTADAS

Valida que las dependencias tengan la API mínima esperada.

No uses comprobaciones rígidas basadas solo en:

```javascript
instanceof
```

si eso dificulta mocks y pruebas.

Prefiere validación estructural, por ejemplo:

```text
el adaptador expone adapt()
```

o el nombre real de su método público.

Los mensajes de error deben identificar claramente la dependencia inválida.

---

# 22. ARCHIVOS A CREAR O MODIFICAR

Crea:

```text
src/consensus/collection/SignalCollector.js
src/consensus/collection/index.js
tests/consensus/SignalCollector.test.js
reports/consensus/PHASE_1_4_SIGNAL_COLLECTOR.md
```

Si la estructura existente recomienda otra carpeta, usa la convención real y documenta la decisión.

Actualiza únicamente cuando corresponda:

```text
src/consensus/index.js
tests/consensus/consensusExports.test.js
```

Puede ser válido crear constantes específicas mínimas para errores del colector, siempre que no se dupliquen constantes ya existentes.

No modifiques:

```text
src/consensus/adapters/LabConAdapter.js
src/consensus/adapters/LabCon1Adapter.js
src/consensus/adapters/AtRepAdapter.js
labEngine.js
labCon1Engine.js
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

Solo modifica un adaptador si existe un defecto objetivo que impida al colector operar y la corrección es:

```text
mínima
probada
documentada
compatible con fases anteriores
```

---

# 23. PRUEBAS OBLIGATORIAS

Crea pruebas unitarias suficientes para cubrir como mínimo:

## 23.1 Construcción

* Puede instanciarse con tres adaptadores válidos.
* Rechaza adaptadores ausentes.
* Rechaza adaptadores sin API pública esperada.
* Permite mocks simples.
* No depende del DOM.
* No depende de UI.
* No depende directamente de engines.

## 23.2 Ejecución completa

Con tres adaptadores válidos:

```text
38 números
114 señales
3 motores completados
0 motores fallidos
```

## 23.3 Universo americano

Verifica:

```text
"0"
"00"
"1" a "36"
```

No hay duplicados.

`"0"` y `"00"` permanecen separados.

## 23.4 Desorden de entrada

Haz que un mock devuelva las señales desordenadas.

Comprueba que la agrupación siga siendo correcta.

## 23.5 Fuentes

Comprueba que:

```text
LabConAdapter → Lab_Con
LabCon1Adapter → Lab_Con1
AtRepAdapter → AtRep
```

Detecta `sourceEngines` inconsistente.

## 23.6 Número faltante

Un adaptador devuelve 37 señales.

Comprueba:

* detección del número faltante;
* warning estructurado;
* metadata de colección incompleta;
* comportamiento del modo estricto;
* comportamiento del modo tolerante, si existe.

## 23.7 Número duplicado

Un adaptador devuelve dos señales para `"7"`.

Comprueba que:

* no se fusionen;
* no se elija una silenciosamente;
* se registre el error;
* el resultado sea determinista.

## 23.8 Número desconocido

Un adaptador devuelve:

```text
"37"
"-1"
"000"
```

Comprueba que se detecte.

## 23.9 Fallo total de un adaptador

Simula una excepción en `LabCon1Adapter`.

En modo tolerante:

```text
Lab_Con y AtRep deben preservarse
Lab_Con1 debe registrarse como fallido
```

En modo estricto:

```text
la recolección debe fallar
```

si ambos modos fueron implementados.

## 23.10 Señal inválida

Un adaptador devuelve un objeto que no cumple `ConsensusSignal`.

Debe detectarse sin confundirlo con una señal válida que tenga warnings.

## 23.11 Colección inválida

Prueba adaptadores que devuelvan:

```text
null
undefined
objeto no iterable
string
array vacío
```

## 23.12 Metadata

Verifica:

```text
enginesRequested
enginesCompleted
enginesFailed
totalNumbers
totalSignals
completeNumbers
incompleteNumbers
warnings
collectedAt
```

según la estructura final.

## 23.13 Reloj inyectado

Verifica que `collectedAt` sea determinista en pruebas.

## 23.14 Copias defensivas

Demuestra que:

* no se mutan entradas;
* no se mutan resultados de adaptadores;
* no hay referencias compartidas no deseadas;
* modificar metadata global no modifica señales;
* modificar una colección no altera otra ejecución.

## 23.15 No transformación

Usa valores reconocibles y comprueba que el colector:

```text
no cambia rawSignals
no cambia evidence
no cambia metadata interna
no cambia warnings
no cambia provenance
no cambia sourceEngines
```

## 23.16 No normalización

Comprueba que valores como:

```text
-5
0
1.7
100
null
```

se preservan si ya son válidos dentro de los `ConsensusSignal`.

No limites rangos en el colector.

## 23.17 Exportaciones

Comprueba que `SignalCollector` se exporte desde:

```text
src/consensus/collection/index.js
src/consensus/index.js
```

## 23.18 Regresión

Ejecuta toda la suite para asegurar que siguen funcionando:

```text
LabConAdapter
LabCon1Adapter
AtRepAdapter
ConsensusSignal
Lab_Con
Lab_Con1
AtRep
resto del proyecto
```

---

# 24. PROHIBICIONES EXPLÍCITAS

Durante esta fase está prohibido:

```text
normalizar señales
fusionar señales
promediar scores
sumar PCI
combinar delay con Win-Win
calcular acuerdo
calcular desacuerdo
crear pesos
crear confianza
crear ranking
crear predicciones
crear recomendaciones
crear SignalNormalizer
crear ConsensusEngine
crear ProbabilityCalibrator
modificar fórmulas
modificar engines
integrar UI
integrar tracker
integrar stores
corregir AtRep
hacer refactors generales
corregir código ajeno
hacer commits automáticos
crear tags automáticos
hacer push
```

El colector no debe elegir números favoritos.

No debe producir:

```text
score final
probabilidad
nivel de consenso
número recomendado
ranking
```

---

# 25. VALIDACIONES A EJECUTAR

Ejecuta primero:

```bash
npm test -- tests/consensus/SignalCollector.test.js
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
npm run lint
```

Finalmente:

```bash
npm run build
```

Si algún comando falla por un error nuevo introducido en esta fase, corrígelo antes de declarar `GO`.

No ignores fallos nuevos.

Registra los resultados exactos.

---

# 26. REPORTE OBLIGATORIO

Genera:

```text
reports/consensus/PHASE_1_4_SIGNAL_COLLECTOR.md
```

Debe incluir:

## 26.1 Resumen ejecutivo

* objetivo;
* alcance;
* resultado;
* estado:

  * `GO`;
  * `GO CON CONDICIONES`;
  * `NO-GO`.

## 26.2 Arquitectura

Explica:

```text
posición del SignalCollector
dependencias
flujo de ejecución
salida
aislamiento de errores
```

Incluye un diagrama textual:

```text
LabConAdapter ─────┐
                   │
LabCon1Adapter ────┼──→ SignalCollector ──→ colección por número
                   │
AtRepAdapter ──────┘
```

## 26.3 Archivos

Lista:

* creados;
* modificados;
* archivos protegidos confirmados como intactos.

## 26.4 Contrato público

Documenta:

```text
constructor
método collect
inputs
opciones
modo por defecto
estructura de salida
errores
```

## 26.5 Estructura de colección

Incluye un ejemplo real y reducido para:

```text
"0"
"00"
"7"
```

No incluyas los 38 números completos si vuelve el reporte innecesariamente extenso.

## 26.6 Tabla de responsabilidades

Incluye:

| Componente      | Responsabilidad    | No hace                    |
| --------------- | ------------------ | -------------------------- |
| LabConAdapter   | Traduce Lab_Con    | No recolecta otros motores |
| LabCon1Adapter  | Traduce Lab_Con1   | No fusiona                 |
| AtRepAdapter    | Traduce AtRep      | No normaliza               |
| SignalCollector | Recolecta y agrupa | No calcula consenso        |

## 26.7 Aislamiento de fallos

Documenta:

* modo implementado;
* comportamiento ante excepción;
* comportamiento ante colección incompleta;
* comportamiento ante señal inválida;
* engines completados;
* engines fallidos.

## 26.8 Validación

Documenta cómo se detectan:

```text
faltantes
duplicados
números desconocidos
source mismatch
colecciones inválidas
señales inválidas
```

## 26.9 Copias defensivas

Explica:

```text
qué se clona
qué se conserva por referencia
qué está congelado
cómo se evita mutación cruzada
```

## 26.10 Pruebas

Incluye:

* archivo;
* cantidad de tests;
* escenarios;
* comandos;
* resultados exactos.

## 26.11 Regresión

Incluye el resultado de:

```text
suite de consenso
suite global
lint
build
```

## 26.12 Restricciones confirmadas

Confirma explícitamente:

```text
No se modificó LabConAdapter.
No se modificó LabCon1Adapter.
No se modificó AtRepAdapter.
No se modificó ningún engine.
No se implementó SignalNormalizer.
No se implementó ConsensusEngine.
No se normalizaron señales.
No se fusionaron señales.
No se calculó ranking.
No se integró UI.
No se integró Tracker.
No se hicieron commits ni push.
```

## 26.13 Riesgos

Documenta:

```text
efectos controlados de los adaptadores
adaptadores que refrescan motores
colecciones incompletas
escalabilidad futura
compatibilidad con async
```

No sobrediseñes soluciones futuras.

## 26.14 Recomendación final

Indica si el proyecto está listo para avanzar a:

```text
FASE 2 — SignalNormalizer
```

No implementes Fase 2.

---

# 27. CRITERIOS DE ACEPTACIÓN

La fase será aceptable únicamente si:

* existe `SignalCollector`;
* usa los tres adaptadores;
* utiliza inyección de dependencias;
* genera una colección por número;
* preserva `"0"` y `"00"`;
* agrupa correctamente señales desordenadas;
* detecta duplicados;
* detecta faltantes;
* detecta números inválidos;
* detecta source mismatch;
* conserva señales sin transformarlas;
* no normaliza;
* no fusiona;
* no calcula consenso;
* implementa aislamiento de fallos documentado;
* genera metadata;
* genera warnings estructurados;
* es serializable;
* tiene salida estable;
* no muta entradas;
* tiene pruebas unitarias;
* pasa pruebas específicas;
* pasa suite de consenso;
* pasa suite global;
* pasa lint;
* pasa build;
* genera reporte obligatorio.

---

# 28. MANEJO DE INCOMPATIBILIDADES

Si los tres adaptadores no comparten una interfaz pública suficientemente uniforme:

1. No modifiques los engines.
2. No reescribas los adaptadores.
3. Identifica la incompatibilidad exacta.
4. Implementa una abstracción mínima en el colector o una interfaz común.
5. No cambies contratos públicos innecesariamente.
6. Agrega pruebas.
7. Documenta la decisión.

Si un adaptador requiere argumentos diferentes:

* encapsula esa diferencia sin copiar su lógica;
* conserva una API pública clara del colector;
* documenta el mapeo de argumentos.

Si existe un defecto objetivo en un adaptador:

* detén la modificación expansiva;
* aplica solo una corrección mínima;
* añade test de regresión;
* documenta el cambio;
* confirma que las fases anteriores siguen pasando.

---

# 29. SALIDA FINAL DE LA EJECUCIÓN

Al terminar, responde con:

```text
FASE 1.4 — SignalCollector

Estado:
GO / GO CON CONDICIONES / NO-GO

Archivos creados:
- ...

Archivos modificados:
- ...

Interfaz:
- constructor:
- método:
- modo por defecto:

Colección:
- números:
- señales:
- motores completados:
- motores fallidos:

Pruebas específicas:
- comando:
- resultado:

Pruebas de consenso:
- comando:
- resultado:

Suite global:
- comando:
- resultado:

Lint:
- resultado:

Build:
- resultado:

Restricciones:
- adaptadores sin cambios
- engines intactos
- SignalNormalizer no implementado
- ConsensusEngine no implementado
- señales no normalizadas
- señales no fusionadas
- UI no integrada
- Tracker no integrado

Reporte:
reports/consensus/PHASE_1_4_SIGNAL_COLLECTOR.md

Siguiente fase recomendada:
FASE 2 — SignalNormalizer
```

---

# 30. INSTRUCCIÓN FINAL

Ejecuta ahora exclusivamente:

```text
FASE 1.4 — SignalCollector
```

Primero inspecciona:

```text
los tres adaptadores
el contrato ConsensusSignal
la factory
el validador
las constantes
las exportaciones
las pruebas existentes
```

Después implementa:

```text
SignalCollector
exportaciones
pruebas
reporte
```

No implementes normalización.

No implementes consenso.

No integres UI ni Tracker.

No modifiques los motores.

No te limites a explicar qué harías: realiza los cambios en el repositorio, ejecuta todas las validaciones y documenta los resultados.
