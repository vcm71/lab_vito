# FASE 2.0 — IMPLEMENTACIÓN DE SIGNALNORMALIZER

## Proyecto

**Roulette Tracker**
Nombre anterior: **ORION / Orion_v2**

## Rol

Actúa como arquitecto principal de software, ingeniero senior de JavaScript y revisor de calidad.

Debes implementar exclusivamente la:

```text
FASE 2.0 — SignalNormalizer
```

del módulo:

```text
MotorConsensoCalibrado
```

Trabaja directamente sobre el repositorio actual de Roulette Tracker y basa todas tus decisiones en el código existente, los tests y los documentos de arquitectura del proyecto.

No supongas nombres de archivos, métodos o estructuras sin comprobarlos primero en el repositorio.

---

# 1. Estado confirmado del proyecto

Ya se encuentran completadas:

```text
Fase 0   — Auditoría arquitectónica
Fase 0.5 — Contrato ConsensusSignal
Fase 1.0 — Infraestructura del consenso
Fase 1.1 — LabConAdapter
Fase 1.2 — LabCon1Adapter
Fase 1.3 — AtRepAdapter
Fase 1.4 — SignalCollector
```

La infraestructura actual sigue conceptualmente este flujo:

```text
Lab_Con
    ↓
LabConAdapter
         ┐
Lab_Con1 │
    ↓    │
LabCon1Adapter ├──► SignalCollector
         │
AtRep    │
    ↓    │
AtRepAdapter ┘
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

La infraestructura de adquisición de señales está completa.

La presente fase comienza en la salida de `SignalCollector`.

---

# 2. Objetivo principal

Implementar un componente:

```text
SignalNormalizer
```

capaz de transformar las señales heterogéneas recolectadas por `SignalCollector` en señales comparables, sin destruir ni sustituir los valores originales.

El normalizador debe:

1. recibir las señales consolidadas por número;
2. preservar completamente `rawSignals`;
3. generar valores normalizados separados;
4. tratar valores nulos, ausentes, inválidos o insuficientes;
5. conservar la trazabilidad de cada transformación;
6. evitar que valores extremos dominen el resultado;
7. producir una salida determinística;
8. mantener separados `"0"` y `"00"`;
9. permitir configurar la estrategia de normalización;
10. preparar los datos para el futuro `ConsensusEngine`.

Esta fase no debe calcular consenso, recomendaciones ni probabilidades calibradas.

---

# 3. Principios arquitectónicos obligatorios

La implementación debe respetar:

* Clean Architecture.
* SOLID.
* Dependency Inversion.
* Open/Closed Principle.
* Separación estricta entre adquisición, normalización y consenso.
* Inyección de dependencias.
* Contratos serializables.
* Ausencia de dependencias del DOM.
* Ausencia de dependencias de renderers o ViewModels.
* Copias defensivas.
* Validación estructural.
* Determinismo.
* Trazabilidad completa.
* Aislamiento de fallos.
* Compatibilidad con ruleta americana.
* Preservación independiente de `"0"` y `"00"`.

No deben mutarse las entradas.

---

# 4. Inspección obligatoria antes de implementar

Antes de escribir código:

1. inspecciona la estructura completa de:

```text
src/consensus/
tests/consensus/
reports/consensus/
```

2. localiza y estudia:

```text
ConsensusSignal
consensusSignalFactory
validateConsensusSignal
cloneConsensusSignal
SignalCollector
LabConAdapter
LabCon1Adapter
AtRepAdapter
consensusConstants
```

3. identifica la forma exacta de la salida actual de `SignalCollector`;

4. identifica:

* nombres reales de propiedades;
* estructura de `rawSignals`;
* estructura de `evidence`;
* estructura de `metadata`;
* formato de warnings;
* formato de provenance;
* modo `strict`;
* modo `tolerant`;
* estrategia de exportación usada en `src/consensus/index.js`;

5. revisa los tests existentes para copiar las convenciones reales del proyecto;

6. revisa los reportes de las fases anteriores;

7. ejecuta la suite base antes de modificar archivos.

No implementes una estructura paralela incompatible con el contrato existente.

---

# 5. Señales que deben evaluarse

Comprueba en el código cuáles de las siguientes señales están realmente disponibles.

## Familia delay — Lab_Con

Posibles señales:

```text
actualDelay
maxDelay
delayRatio
delayScore
probabilityDelay
pressure
activeSets
```

## Familia winWin — Lab_Con1

Posibles señales:

```text
atraso
threshold
level
isActive
streakLength
streakBonus
recencyBonus
winWinScore
pressure
```

## Familia pci — AtRep

Posibles señales:

```text
occurrences
meanDist
expectedDist
pciIndividual
pciCombined
pciBySet
verdict
```

No inventes una señal que no exista en la salida real de los adaptadores o del colector.

Cuando una señal no exista:

* no la calcules silenciosamente;
* no copies fórmulas desde los motores;
* registra su ausencia según los mecanismos existentes;
* usa `null` cuando el contrato lo permita;
* genera warnings estructurados cuando corresponda.

---

# 6. Diseño esperado

Determina primero si el contrato actual ya contempla un espacio para señales normalizadas.

Si existe, reutilízalo.

Si no existe, diseña la extensión mínima y compatible necesaria.

Una posible estructura conceptual, que debe adaptarse al código real, es:

```javascript
{
  schemaVersion: "1.0.0",
  number: "17",

  sourceEngines: [
    "Lab_Con",
    "Lab_Con1",
    "AtRep"
  ],

  rawSignals: {
    delay: {},
    winWin: {},
    pci: {}
  },

  normalizedSignals: {
    delay: {
      actualDelay: {
        rawValue: 14,
        normalizedValue: 0.72,
        method: "PERCENTILE",
        valid: true
      }
    },

    winWin: {},

    pci: {}
  },

  evidence: {},

  metadata: {
    valid: true,
    warnings: [],
    missingSignals: [],
    provenance: [],
    normalization: {
      strategy: "PERCENTILE",
      generatedAt: "...",
      populationSize: 38
    }
  }
}
```

Esta estructura es conceptual.

No la impongas si contradice el contrato existente.

La prioridad es mantener compatibilidad arquitectónica y minimizar cambios.

---

# 7. Estrategias de normalización

Implementa una arquitectura extensible para estrategias de normalización.

Como mínimo, evalúa y documenta:

```text
PERCENTILE
MIN_MAX
ROBUST_MIN_MAX
Z_SCORE
ROBUST_Z_SCORE
IDENTITY
BINARY
CATEGORICAL
```

No es obligatorio exponer todas las estrategias públicamente si no son necesarias en esta fase.

Debe implementarse solamente el conjunto mínimo técnicamente justificado.

## Estrategia principal recomendada

Utiliza percentiles o ranking normalizado como estrategia principal para señales continuas cuando sea apropiado, porque:

* las señales tienen escalas distintas;
* varias distribuciones pueden no ser normales;
* algunas señales pueden presentar valores extremos;
* el universo por evaluación contiene hasta 38 números;
* el objetivo actual es comparabilidad, no calibración probabilística.

El valor normalizado debe quedar preferentemente en:

```text
[0, 1]
```

## Min-max

Puede utilizarse cuando:

* exista variación real;
* el mínimo y máximo sean finitos;
* no haya riesgo significativo de dominancia por outliers.

Debe definirse qué ocurre cuando:

```text
min === max
```

No dividir por cero.

## Winsorización

Evalúa implementar winsorización configurable antes de min-max.

Debe:

* ser determinística;
* no modificar los valores crudos;
* registrar los límites aplicados;
* registrar si un valor fue recortado;
* evitar configuraciones arbitrarias ocultas.

No apliques winsorización de forma indiscriminada.

## Señales binarias

Para señales como:

```text
isActive
```

conservar:

```text
false → 0
true  → 1
```

No aplicar percentiles a booleanos.

## Señales categóricas

Para señales como:

```text
level
verdict
signalQuality
```

no inventar una jerarquía numérica sin respaldo explícito en el dominio.

Si existe una jerarquía formal en constantes o código:

* reutilízala;
* documéntala;
* añade tests.

Si no existe:

* conservar el valor categórico;
* marcarlo como no normalizado;
* no asignar pesos arbitrarios.

---

# 8. Dirección de las señales

No todas las señales necesariamente tienen la misma dirección semántica.

Debes identificar si:

```text
un valor alto representa más intensidad
```

o si:

```text
un valor bajo representa más intensidad
```

Ejemplos conceptuales:

* mayor atraso podría significar mayor presión;
* menor distancia media podría interpretarse de otra manera;
* PCI negativo y PCI positivo podrían representar fenómenos distintos;
* una probabilidad teórica alta podría seguir una dirección positiva.

No inviertas señales basándote únicamente en intuición.

La dirección debe provenir de:

1. constantes existentes;
2. documentación existente;
3. semántica demostrable en el código;
4. configuración explícita del normalizador.

Si la dirección no está demostrada:

* conserva la normalización matemática;
* no cambies el signo;
* documenta la incertidumbre;
* añade un warning o metadato cuando corresponda.

---

# 9. Tratamiento de nulos y valores inválidos

El normalizador debe distinguir entre:

```text
0
null
undefined
NaN
Infinity
-Infinity
valor ausente
muestra insuficiente
señal no aplicable
```

Reglas mínimas:

* `0` es un valor válido cuando la señal lo permite;
* `null` no debe convertirse automáticamente en cero;
* `undefined` debe tratarse como señal ausente;
* `NaN` e infinitos deben considerarse inválidos;
* un dato inválido no debe contaminar la población estadística;
* no debe imputarse la media silenciosamente;
* no debe inventarse un valor normalizado neutral sin registrarlo.

La salida debe permitir distinguir:

```text
normalizedValue: null
```

de:

```text
normalizedValue: 0
```

Cuando se excluya un valor, debe registrarse:

* motivo;
* señal afectada;
* número;
* estrategia;
* warning correspondiente.

---

# 10. Calidad y tamaño de muestra

El normalizador debe considerar la evidencia disponible.

Revisa campos como:

```text
occurrences
sampleSize
windowSize
historyLength
supportCount
signalQuality
```

No confundas:

* valor normalizado;
* confianza de la señal;
* calidad de muestra;
* probabilidad calibrada.

En esta fase:

* la normalización transforma escala;
* la calidad de evidencia describe confiabilidad;
* no deben fusionarse ambos conceptos;
* no debe penalizarse matemáticamente una señal sin una política explícita.

Puede añadirse metadata descriptiva sobre calidad, pero no debe incorporarse todavía un peso de consenso definitivo.

---

# 11. API propuesta

Diseña una API pequeña y clara.

Ejemplo conceptual:

```javascript
const normalizer = new SignalNormalizer({
  strategyRegistry,
  fieldConfiguration,
  mode: "strict"
});

const normalizedSignals = normalizer.normalize(
  collectedSignals
);
```

O alternativamente:

```javascript
normalizeSignals(collectedSignals, options);
```

Selecciona el patrón que sea más coherente con el diseño actual del proyecto.

La API debe permitir:

* normalizar la colección completa;
* usar configuraciones por familia o campo;
* utilizar modos `strict` y `tolerant`;
* inyectar estrategias;
* devolver copias defensivas;
* generar resultados determinísticos.

Evita:

* singletons globales;
* estado mutable innecesario;
* configuración escondida;
* caching prematuro;
* dependencias circulares.

---

# 12. Modos strict y tolerant

Mantén coherencia con los modos utilizados por `SignalCollector`.

## Strict

Debe fallar ante problemas estructurales que impidan garantizar una normalización válida.

Ejemplos:

* colección con formato inválido;
* números duplicados cuando el contrato los prohíbe;
* número fuera del universo americano;
* configuración de estrategia inexistente;
* campo obligatorio con tipo incompatible;
* salida que incumple el contrato.

## Tolerant

Debe:

* aislar la señal o número defectuoso;
* continuar con el resto;
* producir warnings estructurados;
* devolver `null` en la señal no normalizable;
* conservar los valores crudos;
* no ocultar errores.

No conviertas `tolerant` en un modo silencioso.

---

# 13. Universo de ruleta americana

Utiliza exclusivamente la constante compartida existente:

```text
AMERICAN_ROULETTE_NUMBERS
```

El universo debe conservar los 38 valores:

```text
"0"
"00"
"1"
...
"36"
```

No recrees manualmente una lista duplicada si ya existe una constante compartida.

No conviertas `"00"` en:

```text
"0"
0
NaN
```

Debe haber tests explícitos para esta preservación.

---

# 14. Trazabilidad

Cada señal normalizada debe permitir conocer:

* motor de origen;
* familia;
* nombre del campo;
* valor crudo;
* valor utilizado para el cálculo;
* valor normalizado;
* estrategia;
* parámetros;
* población válida;
* cantidad de valores excluidos;
* si hubo winsorización;
* si hubo inversión de dirección;
* razón de ausencia o invalidez;
* warnings asociados.

No es obligatorio duplicar toda esta información en cada nodo si puede representarse de forma compacta y centralizada.

Prioriza:

* claridad;
* serialización;
* ausencia de referencias circulares;
* facilidad de auditoría.

---

# 15. Inmutabilidad y copias defensivas

La implementación no debe modificar:

* salida del `SignalCollector`;
* señales de los adaptadores;
* arrays de `activeSets`;
* arrays de `pciBySet`;
* warnings;
* provenance;
* objetos de evidence;
* objetos de metadata.

Añade tests que congelen profundamente las entradas cuando sea útil.

La normalización debe seguir funcionando con entradas congeladas.

No dependas de mutaciones accidentales.

---

# 16. Archivos permitidos

Crea o modifica únicamente archivos relacionados directamente con:

```text
src/consensus/normalizers/
src/consensus/strategies/
src/consensus/constants/
src/consensus/validators/
src/consensus/contracts/
src/consensus/index.js
tests/consensus/
reports/consensus/
```

Los nombres exactos deben adecuarse a la estructura real del proyecto.

Evita modificar contratos existentes salvo que sea estrictamente necesario para representar la salida normalizada.

Cualquier modificación del contrato debe:

* ser mínima;
* mantener compatibilidad;
* estar justificada;
* contar con tests;
* quedar documentada en el informe.

---

# 17. Archivos prohibidos

No modificar:

```text
labEngine.js
labCon1Engine.js
atRepEngine.js
atRepRenderer.js
atRepViewModel.js
main.js
RouletteTracker.js
SpinManager.js
DelayManager.js
rouletteSettingsStore.js
rouletteSpinsStore.js
UI
renderers
ViewModels
stores
tracker
```

No modificar adaptadores ni `SignalCollector`, excepto cuando exista una incompatibilidad objetiva, demostrable y documentada que impida consumir su salida.

Si detectas una incompatibilidad:

1. no la corrijas automáticamente;
2. documenta el hallazgo;
3. presenta evidencia;
4. propone la modificación mínima;
5. mantén la fase detenida en ese punto si la corrección excede el alcance.

---

# 18. Funcionalidades expresamente prohibidas

No implementar:

* `ConsensusEngine`;
* suma o promedio final de señales;
* pesos definitivos;
* puntuación global;
* ranking final de números;
* recomendación de apuesta;
* probabilidad calibrada;
* backtesting;
* walk-forward;
* MetaModel;
* regresión logística;
* integración con UI;
* persistencia;
* modificación de motores estadísticos;
* corrección incidental de AtRep;
* cambios cosméticos fuera del módulo;
* commits automáticos;
* push remoto.

El resultado de esta fase no debe indicar números “ganadores”, “seguros” ni “más probables”.

---

# 19. Tests obligatorios

Crea pruebas unitarias y de integración suficientes.

Como mínimo, cubre:

## Construcción

* creación del normalizador;
* configuración por defecto;
* inyección de estrategias;
* rechazo de configuraciones inválidas.

## Normalización continua

* percentiles;
* min-max si se implementa;
* valores negativos;
* ceros;
* valores repetidos;
* todos los valores iguales;
* valores extremos;
* precisión numérica;
* determinismo.

## Nulos e inválidos

* `null`;
* `undefined`;
* `NaN`;
* `Infinity`;
* `-Infinity`;
* tipos incompatibles;
* población vacía;
* población con un solo valor;
* muestra insuficiente.

## Booleanos

* `true → 1`;
* `false → 0`;
* `null → null`;
* tipo inválido.

## Categóricos

* preservación del valor;
* jerarquía solamente cuando esté formalmente definida;
* ausencia de codificación arbitraria.

## Ruleta americana

* exactamente 38 números cuando la entrada completa lo permita;
* preservación de `"0"`;
* preservación de `"00"`;
* ausencia de colisión entre ambos.

## Inmutabilidad

* no modificar la colección;
* no modificar señales;
* no compartir objetos mutables;
* aceptar entradas congeladas.

## Strict

* fallo ante estructura inválida;
* fallo ante estrategia desconocida;
* fallo ante configuración incompatible.

## Tolerant

* aislamiento del fallo;
* continuación del procesamiento;
* warning estructurado;
* resultado nulo únicamente para la señal afectada.

## Trazabilidad

* estrategia registrada;
* parámetros registrados;
* raw value preservado;
* exclusiones registradas;
* winsorización registrada cuando corresponda.

## Integración

Usar la salida real o fixtures representativos de:

```text
SignalCollector
```

y comprobar que el normalizador consume el contrato sin acoplarse a los motores.

---

# 20. Validaciones obligatorias

Antes de implementar, ejecuta y registra:

```bash
npm run test
npm run lint
npm run build
```

Después de implementar, ejecuta:

```bash
npm test -- tests/consensus
npm run test
npm run lint
npm run build
```

Si existe un comando específico de arquitectura, ejecuta también:

```bash
npm run check:architecture
```

Si algún comando no existe:

* no inventes su resultado;
* regístralo en el informe.

Distingue claramente entre:

* fallos introducidos por esta fase;
* fallos preexistentes;
* warnings no bloqueantes.

No declares éxito si se introducen regresiones.

---

# 21. Informe obligatorio

Genera:

```text
reports/consensus/PHASE_2_0_SIGNAL_NORMALIZER.md
```

El informe debe incluir:

1. resumen ejecutivo;
2. objetivo;
3. alcance;
4. inspección inicial;
5. estructura encontrada;
6. diseño seleccionado;
7. alternativas descartadas;
8. estrategias implementadas;
9. tratamiento de nulos;
10. tratamiento de outliers;
11. tratamiento de empates;
12. dirección de señales;
13. trazabilidad;
14. modos strict y tolerant;
15. archivos creados;
16. archivos modificados;
17. tests creados;
18. resultados antes y después;
19. compatibilidad con SignalCollector;
20. preservación de `"0"` y `"00"`;
21. riesgos;
22. deuda técnica;
23. limitaciones;
24. decisión final `GO` o `NO-GO`;
25. recomendación para Fase 2.1.

Incluye evidencia real, no afirmaciones genéricas.

---

# 22. Criterios de aceptación

La fase puede declararse `GO` únicamente si:

* existe un `SignalNormalizer` funcional;
* consume la salida real del `SignalCollector`;
* no modifica motores;
* no modifica UI;
* no implementa consenso;
* conserva `rawSignals`;
* produce señales normalizadas separadas;
* diferencia cero de ausencia;
* preserva `"0"` y `"00"`;
* maneja valores extremos;
* maneja empates;
* maneja poblaciones degeneradas;
* soporta strict y tolerant;
* mantiene trazabilidad;
* no muta entradas;
* todos los tests nuevos pasan;
* la suite completa no presenta regresiones;
* build exitoso;
* lint sin errores nuevos;
* el informe está completo.

Si alguno de estos puntos no se cumple, declarar:

```text
NO-GO
```

y explicar exactamente la causa.

---

# 23. Entrega final en consola

Al terminar, muestra:

```text
FASE 2.0 — SIGNALNORMALIZER
Estado: GO / NO-GO

Archivos creados:
- ...

Archivos modificados:
- ...

Tests añadidos:
- ...

Resultados:
- Tests focalizados: ...
- Suite completa: ...
- Lint: ...
- Build: ...
- Arquitectura: ...

Motores modificados:
- Ninguno / indicar incumplimiento

UI modificada:
- No / indicar incumplimiento

SignalCollector modificado:
- No / justificar si fue inevitable

Informe:
reports/consensus/PHASE_2_0_SIGNAL_NORMALIZER.md

Próxima fase sugerida:
FASE 2.1 — ConsensusEngine
```

---

# 24. Regla final

Implementa la solución mínima, robusta, extensible y comprobable.

No amplíes el alcance.

No realices refactorizaciones oportunistas.

No modifiques lógica estadística existente.

No conviertas la normalización en consenso.

No asignes significado predictivo fuerte a señales descriptivas.

Cuando exista ambigüedad, prioriza:

```text
preservación de datos
trazabilidad
compatibilidad
tests
mínimo cambio
```
