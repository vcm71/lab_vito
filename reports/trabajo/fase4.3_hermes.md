# ORION

# ETAPA 4 — QUALITY & EVOLUTION

# FASE 4.3 — REGRESSION SAFETY

---

# MISIÓN

Ejecutar la **FASE 4.3 — Regression Safety**.

Las fases anteriores ya se encuentran completadas:

* ETAPA 3 — Domain Hardening ✅
* FASE 4.1 — Domain Test Foundation ✅
* FASE 4.2 — Integration Testing ✅

El proyecto dispone actualmente de:

* arquitectura consolidada;
* infraestructura de testing;
* pruebas unitarias;
* pruebas de integración;
* cobertura funcional;
* build limpio;
* lint limpio.

La misión de esta fase NO es aumentar la cobertura.

La misión es impedir que futuras modificaciones rompan el dominio sin ser detectadas.

---

# OBJETIVO

Transformar el conjunto actual de tests en una red permanente contra regresiones.

Toda modificación futura del dominio deberá provocar un fallo inmediato si:

* rompe un contrato público;
* altera un comportamiento observable;
* modifica una invariante del dominio;
* cambia el significado de una operación existente;
* introduce inconsistencias entre managers.

---

# PRINCIPIOS

Está estrictamente prohibido:

* agregar funcionalidades;
* cambiar APIs públicas;
* modificar el comportamiento observable;
* alterar reglas de negocio;
* optimizar algoritmos;
* refactorizar código productivo por conveniencia.

La única excepción será un cambio mínimo indispensable para permitir caracterizar un comportamiento existente, siempre documentado y protegido por tests.

---

# ANÁLISIS PREVIO

Antes de modificar cualquier archivo:

1. Leer:

* TESTING_STRATEGY.md
* TEST_ARCHITECTURE.md
* INTEGRATION_TESTING_GUIDE.md
* reports/IMPLEMENTACION_ETAPA_4_1_DOMAIN_TEST_FOUNDATION.md
* reports/IMPLEMENTACION_ETAPA_4_2_INTEGRATION_TESTING.md

2. Ejecutar la línea base:

```bash
npm install
npm test
npm run test:coverage
npm run lint
npm run build
```

Registrar:

* suites;
* tests;
* cobertura;
* duración;
* build;
* lint;
* warnings existentes.

---

# OBJETIVOS DE REGRESSION SAFETY

Crear pruebas que congelen el comportamiento observable del dominio.

No asumir cómo "debería" funcionar.

Capturar exactamente cómo funciona hoy.

---

## 1. CONTRATOS PÚBLICOS

Crear pruebas para proteger:

* métodos públicos;
* tipos devueltos;
* estructura observable;
* nombres de propiedades públicas;
* comportamiento esperado.

Si una API cambia accidentalmente, el test debe fallar.

---

## 2. INVARIANTES DEL DOMINIO

Verificar permanentemente:

* spinCount nunca negativo;
* historial consistente;
* delays coherentes;
* analytics sincronizado;
* sesión válida;
* estado consistente después de importar;
* estado consistente después de exportar;
* ausencia de duplicados inesperados;
* orden correcto del historial.

---

## 3. CHARACTERIZATION TESTS

Crear pruebas que documenten comportamientos existentes aunque no estén especificados.

Ejemplo:

```javascript
describe("characterization", () => {
    // captura comportamiento actual
});
```

No modificar el comportamiento.

Solo registrarlo.

---

## 4. ROUND TRIP

Blindar completamente:

Tracker A

↓

Export

↓

Import

↓

Tracker B

↓

Comparación observable

Debe verificarse:

* historial;
* sesión;
* analytics;
* configuración;
* delays;
* customSeries;
* estado observable.

---

## 5. ESCENARIOS DE REGRESIÓN

Crear escenarios para detectar:

* pérdida de spins;
* pérdida de sesión;
* cache obsoleto;
* analytics desincronizado;
* historial corrupto;
* importación parcial;
* exportación incompleta;
* referencias mutables;
* cambios involuntarios de orden.

---

## 6. CASOS LÍMITE

Construir escenarios deterministas para:

* tracker vacío;
* un spin;
* múltiples spins;
* números repetidos;
* secuencias largas;
* cero;
* doble cero, si existe;
* import vacío;
* export vacío;
* reinicio de sesión;
* múltiples trackers simultáneos.

---

## 7. PRUEBAS DE NO REGRESIÓN

Cada bug detectado durante las fases anteriores debe convertirse en un test permanente.

Buscar en:

* reports/
* commits recientes
* documentación

Si existe un bug corregido que aún no tiene test:

crear uno.

---

## 8. MUTABILIDAD

Verificar que:

* export() no entregue referencias internas mutables;
* getters no permitan modificar estado;
* arrays retornados no alteren el dominio;
* configuraciones copiadas permanezcan aisladas.

---

## 9. AISLAMIENTO

Garantizar que:

Tracker A

no modifica

Tracker B

Todos los tests deben ejecutarse de forma independiente.

---

## 10. ESTABILIDAD

Ejecutar múltiples veces:

```bash
npm test
```

Confirmar que:

* no existen pruebas intermitentes;
* no dependen del orden;
* no dependen del reloj;
* no dependen del sistema.

---

# COBERTURA

No perseguir porcentaje.

Priorizar:

* contratos;
* invariantes;
* regresiones.

Documentar:

* cobertura antes;
* cobertura después;
* módulos críticos;
* módulos pendientes.

---

# DOCUMENTACIÓN

Actualizar:

TESTING_STRATEGY.md

Agregar:

REGRESSION_SAFETY_GUIDE.md

Debe incluir:

* filosofía;
* invariantes;
* contratos;
* characterization tests;
* reglas para nuevos tests;
* criterios para futuras regresiones.

---

# INFORME FINAL

Crear:

```text
reports/IMPLEMENTACION_ETAPA_4_3_REGRESSION_SAFETY.md
```

Debe contener:

## Resumen Ejecutivo

## Contratos protegidos

## Invariantes protegidas

## Characterization Tests

## Casos límite

## Round Trip

## Riesgos detectados

## Cambios productivos

(indicar explícitamente si fueron necesarios)

## Cobertura

antes/después

## Resultados

```bash
npm test
npm run test:coverage
npm run lint
npm run build
```

## Hallazgos

## Recomendaciones

Preparar:

ETAPA 4.4 — Documentation & Quality

---

# VALIDACIÓN FINAL

Ejecutar:

```bash
npm install

npm test

npm run test:coverage

npm run lint

npm run build

git status --short
```

Registrar:

* suites;
* tests;
* cobertura;
* duración;
* build;
* lint;
* warnings;
* archivos modificados.

---

# CRITERIOS DE ÉXITO

La fase solo podrá declararse completada si:

* ningún test existente falla;
* todos los contratos públicos están protegidos;
* las invariantes principales tienen pruebas;
* existen characterization tests para comportamientos ambiguos;
* el round trip import/export queda blindado;
* los bugs históricos tienen pruebas;
* build permanece limpio;
* lint permanece limpio;
* no se introducen funcionalidades;
* no cambia la arquitectura.

---

# SALIDA FINAL

Al finalizar entregar:

```text
ETAPA 4.3 — REGRESSION SAFETY

Estado:
COMPLETADA / COMPLETADA CON OBSERVACIONES / BLOQUEADA

Resultados

- Suites:
- Tests:
- Characterization Tests:
- Regression Tests:
- Coverage:
- Build:
- Lint:

Contratos protegidos:

...

Invariantes protegidas:

...

Archivos creados:

...

Código productivo modificado:

Sí / No

Informe:

reports/IMPLEMENTACION_ETAPA_4_3_REGRESSION_SAFETY.md

Siguiente fase:

ETAPA 4.4 — DOCUMENTATION & QUALITY
```

No iniciar la Fase 4.4 durante esta ejecución.

---

# DISCIPLINA GIT

Antes de comenzar:

```bash
git status --short
git branch --show-current
git log -1 --oneline
```

No sobrescribir cambios del usuario.

No ejecutar comandos destructivos (`git reset --hard`, `git clean -fd`, etc.).

Al finalizar, sugerir (sin ejecutar):

```bash
git add tests/ \
  TESTING_STRATEGY.md \
  REGRESSION_SAFETY_GUIDE.md \
  reports/IMPLEMENTACION_ETAPA_4_3_REGRESSION_SAFETY.md

git commit -m "test(domain): add regression safety suite"

git tag -a etapa-4.3-regression-safety \
  -m "ORION ETAPA 4.3 completed: regression protection"
```

---

# RESULTADO ESPERADO

Al concluir esta fase, cualquier cambio futuro que altere el comportamiento observable, rompa un contrato público o viole una invariante del dominio deberá ser detectado automáticamente por la suite de pruebas.

El dominio de ORION deberá quedar protegido frente a regresiones antes de pasar a la **FASE 4.4 — Documentation & Quality**.
