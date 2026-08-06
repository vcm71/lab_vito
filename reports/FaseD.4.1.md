# PROMPT OFICIAL — FASE D.4.1

# Certification & Closure

## Proyecto

**Roulette Tracker**

## Estado de origen

La implementación funcional de la **Fase D.4 — AI Research Workspace** ya fue realizada y existe un log de recuperación (`FaseD.4.0.log`) que indica:

* pruebas focalizadas: PASS;
* suite completa: PASS (75 archivos, 1002 tests);
* lint: PASS;
* build: PASS.

Esta fase **NO debe volver a implementar funcionalidades**.

Su único objetivo es **auditar, certificar y cerrar formalmente la Fase D.4**.

---

# 1. Rol

Actúa como:

* Arquitecto Principal del proyecto.
* Auditor de arquitectura.
* Revisor de calidad.
* Ingeniero de Release.
* Responsable de Certificación.

No actúes como generador de nuevas funcionalidades.

---

# 2. Objetivo

Determinar objetivamente si la Fase D.4 cumple todos los requisitos arquitectónicos y técnicos para declararse oficialmente cerrada.

Si existe algún incumplimiento crítico:

* NO declarar la fase cerrada;
* documentar exactamente qué falta.

Si todo es correcto:

* generar toda la documentación oficial de cierre.

---

# 3. Regla principal

No modificar comportamiento funcional salvo que sea imprescindible para corregir un defecto descubierto durante la auditoría.

No realizar refactorizaciones cosméticas.

No introducir nuevas capacidades.

No cambiar el dominio.

---

# 4. Auditoría Arquitectónica

Verificar explícitamente:

## UI

Confirmar que ningún componente UI importa directamente:

* Domain
* Repository
* Entity
* UseCase
* Motor estadístico

---

## Binding Layer

Confirmar que:

* LaboratoryBindingLayer sigue siendo el único punto público de integración.

No debe existir una segunda Binding Layer.

---

## Orchestrator

Confirmar que:

* LaboratoryOrchestrator coordina AI Research.

No debe contener lógica de render.

---

## Timeline

Confirmar que:

* Timeline Model continúa siendo la única fuente temporal.

Buscar evidencia de que NO existen:

* timeline duplicado;
* listas paralelas de eventos;
* reconstrucciones manuales del historial.

---

## Event Bus

Confirmar que:

* se reutiliza el Event Bus existente;
* no existe un segundo bus.

---

## Provider

Confirmar que:

* AI Research depende de una abstracción;
* no existe acoplamiento directo a OpenAI, Gemini, DeepSeek, Groq o cualquier proveedor concreto;
* no existen claves API embebidas.

---

# 5. Auditoría Funcional

Verificar que continúan funcionando:

* Overview
* Experiments
* Sessions
* Comparison
* Evidence Explorer
* Replay
* AI Research

Registrar cualquier regresión encontrada.

---

# 6. Auditoría de Integración

Verificar que AI Research reutiliza correctamente:

* Timeline
* Evidence
* Comparison
* Replay

No debe existir duplicación de modelos.

---

# 7. Auditoría del Código

Buscar:

* TODO
* FIXME
* código muerto
* imports sin uso
* duplicaciones
* any innecesarios
* funciones huérfanas
* archivos sin referencias

Documentar únicamente aquello realmente encontrado.

---

# 8. Auditoría Git

Registrar:

* rama actual;
* estado Git;
* archivos modificados;
* diff final;
* archivos nuevos.

No crear commit automáticamente.

---

# 9. Validaciones

Detectar primero los scripts reales disponibles en package.json.

Ejecutar los existentes:

* npm test
* npm run lint
* npm run build

y cualquier auditoría arquitectónica propia del proyecto.

No inventar scripts inexistentes.

Registrar:

* comando;
* resultado;
* código de salida.

---

# 10. Checklist de Certificación

Verificar uno por uno:

* [ ] UI desacoplada del Domain
* [ ] Binding Layer único
* [ ] Orchestrator coordinador
* [ ] Timeline único
* [ ] Event Bus único
* [ ] Sin providers acoplados
* [ ] Sin secretos
* [ ] Tests PASS
* [ ] Lint PASS
* [ ] Build PASS
* [ ] Sin regresiones
* [ ] AI Research integrado
* [ ] Comparison operativo
* [ ] Replay operativo
* [ ] Evidence operativo
* [ ] Timeline operativo

Cada punto debe marcarse:

PASS

FAIL

o

NOT APPLICABLE

con evidencia.

---

# 11. Documentación

Generar:

reports/FASE_D4_AI_RESEARCH_IMPLEMENTATION_REPORT.md

incluyendo:

* resumen ejecutivo;
* arquitectura;
* auditoría;
* integración;
* pruebas;
* limitaciones;
* resultados.

---

Generar además:

reports/Fase_D4_cerrada.md

con la misma estructura de los puntos de control oficiales del proyecto.

Debe contener:

* propósito;
* estado general;
* arquitectura consolidada;
* componentes;
* decisiones certificadas;
* pruebas;
* calidad;
* siguiente fase.

Debe finalizar con:

Estado de la Fase D.4:
✅ CERRADA

únicamente si todas las verificaciones críticas son satisfactorias.

---

# 12. Log oficial

Crear:

reports/logs/Fase_D4_certification.log

El log debe registrar cronológicamente:

* auditoría;
* comandos;
* resultados;
* checklist;
* incidencias;
* conclusión.

Debe existir incluso si la fase no puede cerrarse.

---

# 13. Criterio de Honestidad

No afirmar que:

* una prueba pasó si no fue ejecutada;
* lint pasó si no fue ejecutado;
* build pasó si no fue ejecutado;
* la fase está cerrada si existe algún incumplimiento crítico.

La documentación debe reflejar exactamente el estado real del repositorio.

---

# 14. Resultado esperado

Al finalizar debe existir una de estas dos situaciones:

## Opción A

La Fase D.4 queda oficialmente certificada y cerrada.

Se generan:

* `FASE_D4_AI_RESEARCH_IMPLEMENTATION_REPORT.md`
* `Fase_D4_cerrada.md`
* `Fase_D4_certification.log`

y se recomienda como referencia:

Commit:

```text
docs(laboratory): certify phase D.4 AI Research workspace
```

Tag:

```text
roulette-tracker-phase-d4-certified
```

## Opción B

La auditoría detecta incumplimientos.

En ese caso:

* NO generar `Fase_D4_cerrada.md`;
* generar `Fase_D4_pendiente.md`;
* documentar exactamente qué impide el cierre;
* proponer un plan de corrección mínimo para alcanzar la certificación.

No inventes resultados. La certificación debe basarse únicamente en evidencia obtenida durante la auditoría.
