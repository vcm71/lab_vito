# FASE 2.0.1 — Auditoría y Endurecimiento del SignalNormalizer

## Proyecto

**Roulette Tracker**
Nombre anterior: **ORION / Orion_v2**

---

# Rol

Actúa como Arquitecto Principal del proyecto Roulette Tracker y revisor técnico senior.

No debes implementar nuevas funcionalidades del MotorConsensoCalibrado.

Tu única misión es **auditar, validar y endurecer** la implementación existente de la **Fase 2.0 — SignalNormalizer**, preparando el proyecto para iniciar con seguridad la **Fase 2.1 — ConsensusEngine**.

Esta NO es una fase de expansión funcional.

Es una fase de validación arquitectónica.

---

# Contexto

La Fase 2.0 ya fue implementada satisfactoriamente.

Existe:

* SignalNormalizer
* Estrategias de normalización
* Tests
* Reporte técnico
* Integración con SignalCollector

El objetivo ahora es demostrar formalmente que el normalizador es matemáticamente consistente, arquitectónicamente correcto y suficientemente robusto para servir como entrada del futuro ConsensusEngine.

---

# Objetivo

Realizar una auditoría técnica completa del módulo de normalización.

No crear nuevas características.

No modificar motores estadísticos.

No modificar UI.

No modificar SignalCollector salvo que exista un error demostrable.

---

# Debes comprobar

## 1. Estrategias IDENTITY

Revisar todos los campos configurados con:

```text
IDENTITY
```

Confirmar mediante inspección del código que realmente ya se encuentran normalizados.

Analizar especialmente:

```text
delayRatio
probabilityDelay
expectedDist
pciIndividual
pciCombined
```

Para cada uno indicar:

* rango real;
* dominio;
* significado estadístico;
* si realmente puede utilizarse como identidad;
* si requiere estrategia distinta en el futuro.

No cambiar la estrategia.

Sólo documentarla.

---

## 2. level

Verificar que el mapping ordinal utilizado proviene realmente del dominio.

Buscar evidencia en:

* constantes;
* engine;
* documentación;
* tests.

Si no existe evidencia:

No modificar.

Documentar el riesgo.

---

## 3. activeSets

Determinar si:

```text
activeSets
```

debe permanecer como evidencia,

o

debe formar parte de las señales normalizadas.

Justificar la decisión utilizando el contrato actual.

---

## 4. Copias defensivas

Verificar mediante tests que:

```javascript
output !== input
```

y además:

```javascript
output.signals !== input.signals
```

así como:

* arrays
* objetos
* metadata
* evidence
* warnings
* provenance

No deben compartirse referencias mutables.

Si ya ocurre correctamente:

añadir evidencia en el informe.

---

## 5. Preservación de "0" y "00"

Crear pruebas explícitas para garantizar que:

```text
"0"
```

y

```text
"00"
```

nunca colisionan.

Debe comprobarse:

* claves
* normalización
* exportación
* estructuras internas

---

## 6. Determinismo

Evaluar si:

```javascript
appliedAt
```

rompe el determinismo.

No eliminarlo.

Analizar la conveniencia de permitir:

```javascript
clock()
```

inyectable.

Si se implementa:

debe ser totalmente retrocompatible.

---

## 7. Contadores

Verificar:

```text
fieldsConfigured
fieldsNormalized
fieldsSkipped
```

Confirmar que:

```text
Configured =
Normalized + Skipped
```

y que el conteo corresponde realmente a campos distintos y no a iteraciones sobre números.

---

# Informe obligatorio

Actualizar o generar:

```text
reports/consensus/PHASE_2_0_1_SIGNAL_NORMALIZER_AUDIT.md
```

Debe incluir:

* Resumen ejecutivo
* Objetivo
* Auditoría por punto
* Evidencia encontrada
* Riesgos
* Hallazgos
* Recomendaciones
* Cambios realizados
* Tests añadidos
* Resultados
* Compatibilidad
* Conclusión

Finalizar con una decisión:

```text
GO
```

o

```text
NO-GO
```

respecto al inicio de:

```text
FASE 2.1 — ConsensusEngine
```

---

# Restricciones

No modificar:

```text
Lab_Con
Lab_Con1
AtRep
SignalCollector
UI
Tracker
Stores
ViewModels
Renderers
```

salvo que exista un error objetivo y demostrable que impida validar la fase.

No implementar:

* ConsensusEngine
* pesos
* ranking
* consenso
* calibración
* recomendaciones
* backtesting

---

# Validaciones

Ejecutar:

```bash
npm test
npm run lint
npm run build
```

Si existe:

```bash
npm run check:architecture
```

ejecutarlo también.

No declarar GO si aparece una regresión.

---

# Resultado esperado

Al finalizar mostrar:

```text
FASE 2.0.1 — AUDITORÍA SIGNALNORMALIZER

Estado:
GO / NO-GO

Hallazgos críticos:
...

Hallazgos menores:
...

Tests añadidos:
...

Regresiones:
Ninguna / Detallar

Informe:
reports/consensus/PHASE_2_0_1_SIGNAL_NORMALIZER_AUDIT.md

Próxima fase autorizada:

FASE 2.1 — ConsensusEngine
```

La prioridad absoluta es garantizar que el SignalNormalizer sea una base matemática confiable antes de comenzar el cálculo de consenso.
