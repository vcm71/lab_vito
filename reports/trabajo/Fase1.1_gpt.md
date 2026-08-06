# PROMPT MAESTRO — FASE 1.1

# Implementación de LabConAdapter

## Proyecto: Roulette Tracker

Actúa como Arquitecto Principal de Software y desarrollador senior especializado en:

* Clean Architecture
* SOLID
* JavaScript/TypeScript
* Sistemas estadísticos
* Adaptadores
* Diseño por contratos
* Testing
* Refactoring seguro

---

# Contexto

Las siguientes fases ya fueron completadas:

* Fase 0 — Auditoría arquitectónica.
* Fase 0.5 — Diseño del contrato `ConsensusSignal`.
* Fase 1.0 — Infraestructura base del módulo `src/consensus/`.

Existe el módulo:

```text
src/consensus/
```

Existe el contrato:

```text
ConsensusSignal
```

NO existe todavía ningún adaptador.

---

# Objetivo

Implementar exclusivamente:

```text
LabConAdapter
```

El adaptador debe convertir la salida de:

```text
Lab_Con
```

al contrato:

```text
ConsensusSignal
```

---

# Restricciones

NO modificar:

* labEngine.js
* labCon1Engine.js
* atRepEngine.js
* main.js
* tracker
* stores
* renderers
* ViewModels
* UI
* lógica estadística

NO copiar fórmulas.

NO reimplementar Lab_Con.

NO cambiar pesos.

NO cambiar resultados.

NO implementar:

* SignalCollector
* ConsensusEngine
* Normalizer
* MetaModel

---

# Principio arquitectónico

El adaptador debe ser un envoltorio.

Siempre:

```text
Lab_Con

↓

LabConAdapter

↓

ConsensusSignal
```

Nunca:

```text
Lab_Con

↓

reescribir cálculos

↓

ConsensusSignal
```

---

# Ubicación

Crear:

```text
src/consensus/adapters/
├── LabConAdapter.js
└── index.js
```

Adaptar extensión según el lenguaje real del proyecto.

---

# Responsabilidades

Debe:

* consumir únicamente APIs existentes de Lab_Con;
* no acceder a campos privados salvo que sea estrictamente necesario y documentado;
* traducir datos;
* completar `ConsensusSignal`;
* añadir provenance;
* generar warnings cuando falte evidencia;
* mantener la trazabilidad.

---

# Entrada

El adaptador debe recibir la instancia real del motor.

No crear motores paralelos.

---

# Salida

Debe devolver una colección de:

```text
ConsensusSignal
```

Uno por cada número válido de la ruleta americana.

Debe soportar:

```text
"0"
"00"
"1"
...
"36"
```

---

# Mapeo obligatorio

Completar:

```text
rawSignals.delay
```

con:

```text
actualDelay
maxDelay
delayRatio
delayScore
probabilityDelay
pressure
activeSets
```

Solo utilizar datos realmente disponibles.

Si alguno no existe:

* usar null cuando corresponda;
* registrar warning;
* registrar missingSignal.

Nunca inventar un cálculo.

---

# Evidence

Completar cuando sea posible:

```text
occurrences
sampleSize
activeSets
windowSize
historyLength
supportCount
signalQuality
```

Si Lab_Con no expone alguno:

* dejar null o valor permitido;
* documentarlo;
* no estimarlo.

---

# Metadata

Completar:

```text
generatedAt
valid
warnings
missingSignals
provenance
```

Cada provenance debe contener:

```text
engine
file
method
```

---

# Calidad de señal

Usar únicamente:

```text
INSUFFICIENT
LOW
MEDIUM
HIGH
```

No inventar nuevos estados.

---

# Validación

Cada objeto creado debe pasar por:

```text
validateConsensusSignal()
```

No devolver objetos inválidos.

---

# API pública

Exportar únicamente:

```text
LabConAdapter
```

---

# Tests

Crear:

```text
tests/consensus/
```

Añadir:

```text
LabConAdapter.test.js
```

Debe comprobar:

* creación correcta;
* cantidad de señales;
* preservación de "00";
* provenance;
* warnings;
* ausencia de mutaciones;
* contratos válidos;
* independencia de referencias;
* compatibilidad con `validateConsensusSignal()`.

No modificar tests existentes.

---

# Informe

Crear:

```text
reports/consensus/

PHASE_1_1_LABCON_ADAPTER.md
```

Debe contener:

1. Resumen.
2. Archivos creados.
3. APIs reutilizadas.
4. Campos realmente disponibles.
5. Campos no disponibles.
6. Warnings generados.
7. Decisiones de diseño.
8. Tests.
9. Build.
10. Estado de Git.
11. Riesgos pendientes.
12. Compatibilidad con Fase 1.2.

---

# Validaciones finales

Ejecutar:

```bash
npm run test
npm run build
```

Ejecutar lint únicamente si existe.

Registrar:

* tests aprobados;
* build;
* lint;
* archivos modificados.

No ocultar errores preexistentes.

---

# Criterios de aceptación

La fase solo se aprueba si:

* existe `LabConAdapter`;
* no se modificó `Lab_Con`;
* todos los objetos cumplen `ConsensusSignal`;
* `"0"` y `"00"` se preservan;
* existe provenance;
* existen warnings estructurados;
* no existen regresiones;
* tests nuevos aprobados;
* build exitoso.

---

# Resultado esperado

Responder con:

```text
FASE 1.1 COMPLETADA

Estado:
GO / GO CON CONDICIONES / NO-GO

Adaptador:
LabConAdapter

Motores modificados:
NINGUNO

Contrato:
ConsensusSignal

Tests:
[...]

Build:
[...]

Informe:
reports/consensus/PHASE_1_1_LABCON_ADAPTER.md

Siguiente fase:
FASE 1.2 — LabCon1Adapter
```
