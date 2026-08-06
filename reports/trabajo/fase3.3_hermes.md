# ORION REFACTOR
# ETAPA 3
# FASE 3.3
# TRACKERCOMPAT AUDIT

Continuemos exactamente desde el cierre de la Fase 3.2.

## Estado actual

La migración Legacy → Domain ha finalizado.

Las fases completadas son:

- Fase 3.1 — API Freeze
- Fase 3.2 — Domain Contracts

Entregables existentes:

- references/domain_contract.md
- references/domain_internal_contract.md
- reports/Fase3.1.log
- reports/Fase3.2.log

Build limpio:

- 77 módulos
- 0 errores

No debe modificarse el comportamiento observable.

---

# Hallazgos conocidos

La auditoría de la Fase 3.2 documentó:

CRÍTICA

- calcularPesoRetraso() en:
  - labengine
  - motor_matematico_de_conjuntos

depende indirectamente de getStatsForSet(), método que nunca existió en el dominio.

Resultado:

- pesoRetraso = 0 permanentemente.

ALTA

- getStats() duplicado.
- getAdvancedStats() duplicado.
- session.spinCount puede desincronizarse.

MEDIA

- NUM_META duplicado.
- CustomSeries repartido entre RouletteTracker y SettingsManager.

La prioridad inmediata es comprender completamente TrackerCompat y las dependencias restantes antes de iniciar cualquier eliminación.

---

# Objetivo de la fase

Auditar completamente TrackerCompat y todos sus consumidores.

Determinar si sigue siendo necesario.

Detectar cualquier dependencia oculta.

Resolver documentalmente el bug crítico relacionado con getStatsForSet().

Esta fase debe producir un plan preciso para la futura eliminación de TrackerCompat.

---

# Objetivos específicos

## 1. Auditoría completa de TrackerCompat

Inventariar todos sus métodos.

Para cada uno indicar:

- propósito;
- origen histórico;
- consumidor(es);
- frecuencia de uso;
- si pertenece realmente al dominio;
- si sólo existe por compatibilidad.

Clasificar cada método como:

- contrato válido;
- adaptador temporal;
- candidato a eliminación;
- código muerto.

---

## 2. Consumidores reales

Localizar todos los consumidores de TrackerCompat.

Indicar para cada uno:

- archivo;
- método utilizado;
- dependencia creada;
- posibilidad de migración directa hacia RouletteTracker.

Construir un mapa completo.

---

## 3. Bug crítico: getStatsForSet()

Realizar investigación completa.

Responder:

- quién realiza la llamada;
- desde cuándo existe;
- si proviene del Legacy;
- qué comportamiento esperaba obtener;
- por qué nunca falló explícitamente;
- por qué actualmente produce peso 0.

Determinar cuál debería ser la fuente correcta de datos.

NO implementar todavía la corrección definitiva.

Si es imprescindible introducir una corrección mínima para restablecer el comportamiento esperado, justificarla explícitamente y mantener compatibilidad.

---

## 4. Delays

Auditar completamente el cálculo de retrasos.

Documentar:

- dónde se calculan;
- quién es Owner;
- quién los consume;
- existencia de cachés;
- posibles duplicidades.

Verificar que exista una única fuente de verdad.

---

## 5. Estadísticas

Relacionar TrackerCompat con:

- RouletteTracker
- RouletteAnalytics

Documentar:

- flujo de datos;
- dependencias;
- duplicidades;
- responsabilidades.

No unificar todavía.

---

## 6. Plan de retirada

Determinar qué pasos serán necesarios para eliminar TrackerCompat.

Clasificar:

Puede eliminarse inmediatamente.

Requiere migración.

Debe permanecer temporalmente.

No pertenece al dominio.

---

# Restricciones

Durante esta fase NO debe:

- modificar UI;
- modificar HTML;
- modificar CSS;
- introducir funcionalidades nuevas;
- optimizar rendimiento;
- reestructurar el dominio;
- eliminar TrackerCompat;
- eliminar métodos públicos;
- romper compatibilidad.

Únicamente podrán realizarse cambios mínimos si son imprescindibles para corregir el bug crítico de getStatsForSet(), manteniendo el comportamiento funcional esperado.

---

# Entregables

Generar:

## 1.

references/trackercompat_audit.md

Debe contener:

- inventario completo;
- consumidores;
- responsabilidades;
- dependencias;
- plan de retirada.

---

## 2.

reports/Fase3.3.log

Debe contener:

- hallazgos;
- riesgos;
- deuda técnica;
- recomendaciones.

---

## 3.

Mapa completo:

TrackerCompat

↓

Consumidores

↓

RouletteTracker

↓

RouletteAnalytics

↓

Managers

---

## 4.

Informe técnico específico del bug:

getStatsForSet()

Incluyendo:

- causa raíz;
- impacto;
- comportamiento esperado;
- estrategia de corrección recomendada.

---

# Criterio de finalización

La fase finalizará únicamente cuando:

- TrackerCompat esté completamente auditado.
- Todos sus consumidores estén identificados.
- El bug crítico de getStatsForSet() esté completamente explicado y tenga una estrategia de resolución documentada.
- Exista un plan de eliminación de TrackerCompat.
- El proyecto compile correctamente (`npm run build`).
- Se entregue un resumen ejecutivo indicando si TrackerCompat puede eliminarse en la siguiente fase (Fase 3.4) o si antes es necesario resolver incidencias críticas del dominio.
