# PROMPT MAESTRO — FASE 0.5

# Diseño del contrato de señales del MotorConsensoCalibrado

## Proyecto

Roulette Tracker

---

# Contexto

Ya fue completada la auditoría arquitectónica de la Fase 0.

Antes de comenzar cualquier implementación del MotorConsensoCalibrado es necesario diseñar un contrato de señales completamente independiente del código actual.

Esta fase NO modifica lógica productiva.

Su único objetivo es definir la interfaz que utilizarán todos los motores estadísticos actuales y futuros.

El diseño debe seguir principios de:

* Clean Architecture
* SOLID
* Open/Closed
* Dependency Inversion
* Arquitectura basada en adaptadores
* Motores desacoplados
* Alta testabilidad

---

# Restricciones

NO modificar:

* Lab_Con
* Lab_Con1
* AtRep
* Tracker
* Stores
* Renderers
* ViewModels
* UI
* Tests existentes

NO crear código productivo.

NO corregir bugs.

NO implementar adaptadores.

NO modificar contratos existentes.

Esta fase es exclusivamente de ingeniería de arquitectura.

---

# Objetivo principal

Diseñar el contrato definitivo denominado:

```text
ConsensusSignal
```

que utilizará el futuro

```text
MotorConsensoCalibrado
```

---

# Objetivos específicos

Debes construir un inventario completo de TODAS las señales disponibles actualmente.

Para cada señal indicar:

* motor origen
* método origen
* archivo
* tipo
* rango
* significado
* unidad
* si es continua o discreta
* si requiere normalización
* si depende de la ventana
* si depende de configuración
* si depende de subconjuntos
* tamaño mínimo de muestra
* posibles valores nulos
* estabilidad
* posibilidad de reutilización

---

# Inventario obligatorio

Como mínimo inspeccionar:

Lab_Con

Lab_Con1

AtRep

Tracker

DelayManager

HistoryManager

SettingsManager

---

# Tabla obligatoria

Construir una tabla similar a:

| Señal | Motor | Método | Tipo | Escala | Normalizar | Ventana | Configuración | Reutilizable |
| ----- | ----- | ------ | ---- | ------ | ---------- | ------- | ------------- | ------------ |

Debe incluir absolutamente todas las señales encontradas.

No limitarse únicamente a:

* DelayScore
* WinWinScore
* PCI

Buscar cualquier otra señal útil.

---

# Contrato ConsensusSignal

Diseñar el contrato definitivo.

Debe proponer un modelo similar a:

```typescript
interface ConsensusSignal {

    number: number;

    rawSignals: {

        delayScore;

        delayRatio;

        actualDelay;

        maxDelay;

        probabilityDelay;

        winWinScore;

        streakLength;

        streakBonus;

        recencyBonus;

        pciIndividual;

        pciCombined;

        pciBySet;

    };

    evidence: {

        occurrences;

        sampleSize;

        activeSets;

        windowSize;

        historyLength;

    };

    metadata: {

        sourceEngines;

        generatedAt;

        valid;

        warnings;

    };

}
```

NO escribir código productivo.

Solo diseñar la interfaz.

---

# Clasificación de señales

Cada señal encontrada debe clasificarse como:

Observacional

Derivada

Predictiva

Configuración

Metadato

Diagnóstico

Explicar por qué pertenece a dicha categoría.

---

# Correlación

Analizar la relación existente entre señales.

Construir una matriz.

Ejemplo:

DelayScore

↓

Muy correlacionada con

↓

ActualDelay

↓

Razón:

...

---

PCI Individual

↓

Poca correlación

↓

WinWinScore

↓

Razón

...

No calcular correlaciones matemáticas.

Solo analizar dependencias lógicas.

---

# Riesgo de redundancia

Identificar señales que podrían duplicar evidencia.

Ejemplos:

DelayScore

↓

ActualDelay

↓

Duplicación parcial

---

PCI combinado

↓

PCI conjuntos

↓

Duplicación alta

---

WinWin

↓

StreakLength

↓

Duplicación parcial

Explicar cada caso.

---

# Adaptadores futuros

Diseñar únicamente la interfaz conceptual de:

LabConAdapter

LabCon1Adapter

AtRepAdapter

Todos deben producir exactamente el mismo contrato:

ConsensusSignal

No implementar código.

---

# Reutilización

Para cada método importante indicar:

Puede reutilizarse directamente

Debe encapsularse

Debe envolverse

Debe copiarse

Debe reemplazarse

Justificar cada decisión.

---

# Dependencias

Construir un diagrama Mermaid mostrando:

Tracker

↓

Adapters

↓

SignalCollector

↓

Normalizer

↓

Consensus Engine

↓

Future MetaModel

El diagrama debe representar únicamente arquitectura lógica.

---

# Riesgos

Crear una matriz con:

Riesgo

Origen

Impacto

Probabilidad

Mitigación

Especial atención a:

duplicación de evidencia

señales correlacionadas

estado mutable

dependencias ocultas

escalas incompatibles

valores nulos

ventanas distintas

dependencias del renderer

dependencias del ViewModel

---

# Señales faltantes

Responder explícitamente:

¿Qué señales útiles NO existen actualmente?

Ejemplos posibles:

estabilidad temporal

persistencia

consenso entre motores

confianza

calidad de muestra

diversidad de evidencia

No implementarlas.

Solo documentarlas.

---

# Entregable

Crear:

```text
reports/consensus/

PHASE_0_5_SIGNAL_CONTRACT.md
```

---

# El documento debe contener

1. Resumen ejecutivo

2. Inventario completo de señales

3. Clasificación

4. Escalas

5. Dependencias

6. Correlación lógica

7. Riesgo de redundancia

8. Contrato ConsensusSignal

9. Adaptadores futuros

10. Señales faltantes

11. Riesgos

12. Arquitectura objetivo

13. Recomendaciones para Fase 1

14. Criterios de aceptación

15. Conclusiones

---

# Validaciones

Al finalizar ejecutar únicamente:

```bash
git status --short
git diff --stat
```

Confirmar que no existe modificación de código productivo.

---

# Criterios de aceptación

La Fase 0.5 solo se considera aprobada cuando:

✓ Existe un inventario completo de señales.

✓ Existe el contrato ConsensusSignal.

✓ Existe una clasificación de señales.

✓ Existe la matriz de redundancia.

✓ Existe el mapa de adaptadores.

✓ Existe el diagrama arquitectónico.

✓ Existen recomendaciones claras para la Fase 1.

✓ No se modificó código productivo.

✓ No se modificaron tests.

✓ Solo se creó documentación.

---

# Resultado esperado

La respuesta final debe indicar:

```text
FASE 0.5 COMPLETADA

Estado:
GO / GO CON CONDICIONES / NO GO

Documento generado:

reports/consensus/PHASE_0_5_SIGNAL_CONTRACT.md

Señales inventariadas:
[número]

Métodos reutilizables:
[número]

Señales redundantes:
[número]

Riesgos críticos:
[...]

Cambios en código:
NINGUNO

Estado de Git:
[...]

Siguiente fase recomendada:

FASE 1

Implementación del SignalCollector y los tres adaptadores
(LabConAdapter, LabCon1Adapter y AtRepAdapter).
```
