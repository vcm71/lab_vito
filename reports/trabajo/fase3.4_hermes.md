# ORION REFACTOR
# ETAPA 3
# FASE 3.4
# TRACKERCOMPAT CONSOLIDATION

Continuemos exactamente desde el cierre de la Fase 3.3.

## Estado actual

La migración Legacy → Domain está completamente finalizada.

Fases completadas:

- ✅ Fase 3.1 — API Freeze
- ✅ Fase 3.2 — Domain Contracts
- ✅ Fase 3.3 — TrackerCompat Audit

Documentación disponible:

- references/domain_contract.md
- references/domain_internal_contract.md
- references/trackercompat_audit.md

Reportes:

- reports/Fase3.1.log
- reports/Fase3.2.log
- reports/Fase3.3.log

Build actual:

- 77 módulos
- 0 errores

---

# Conclusiones de la Fase 3.3

La auditoría confirmó:

- TrackerCompat contiene aproximadamente 20 métodos.
- La mayoría son adaptadores temporales.
- El supuesto bug crítico de getStatsForSet pertenece únicamente a código muerto fuera del runtime de la SPA.
- El dominio activo funciona correctamente.

Incidencias abiertas:

MEDIA

- TrackerCompat mantiene ownership implícito de delays.

MEDIA

- getStats()/getAdvancedStats() continúan duplicados entre RouletteTracker y RouletteAnalytics.

MEDIA

- NUM_META duplicado.

BAJA

- winWinEngine mal ubicado.

- ready residual.

- clearSpins() sin consumidores.

- getSeriesTrendData() sin consumidores.

No existen bloqueos funcionales.

La siguiente prioridad es reducir TrackerCompat al mínimo imprescindible.

---

# Objetivo de la fase

Preparar TrackerCompat para su eliminación definitiva.

Esta fase SÍ permite realizar refactorizaciones internas controladas.

No debe cambiar ningún comportamiento observable.

El objetivo es reducir responsabilidades y dejar TrackerCompat como una fachada extremadamente delgada.

---

# Objetivos específicos

## 1. Ownership de delays

Eliminar el ownership implícito de TrackerCompat.

Determinar la ubicación correcta del cálculo de delays.

La información deberá pertenecer explícitamente al dominio.

TrackerCompat sólo podrá delegar.

No deberá mantener estado propio.

---

## 2. Métodos sin consumidores

Analizar:

- clearSpins()

- getSeriesTrendData()

Si realmente no poseen consumidores:

- documentarlos como candidatos para eliminación en Fase 3.5;

o eliminarlos únicamente si se demuestra que no existe ninguna dependencia.

Justificar cualquier eliminación.

---

## 3. winWinEngine

Determinar si realmente pertenece a TrackerCompat.

Si corresponde:

- mover la responsabilidad al componente adecuado.

Mantener compatibilidad pública.

---

## 4. ready residual

Eliminar código residual relacionado con ready si:

- no posee consumidores;
- no modifica comportamiento.

---

## 5. Delays

Mover cualquier lógica que todavía viva dentro de TrackerCompat hacia el dominio.

TrackerCompat no debe calcular.

TrackerCompat no debe almacenar.

TrackerCompat sólo debe delegar.

---

## 6. Simplificación

Reducir TrackerCompat al mínimo posible.

Clasificar cada método restante como:

- Adaptador indispensable.

- Compatibilidad temporal.

- Eliminable en Fase 3.5.

---

## 7. Validación

Verificar que:

- todos los consumidores continúan funcionando;

- RouletteTracker continúa siendo el único Owner del estado;

- no aparecen dependencias nuevas.

---

# Restricciones

Durante esta fase NO debe:

- modificar UI;

- modificar HTML;

- modificar CSS;

- introducir funcionalidades nuevas;

- modificar contratos públicos;

- romper compatibilidad;

- eliminar TrackerCompat completamente.

Sí está permitido:

- mover responsabilidades;

- eliminar código muerto demostrado;

- reducir delegaciones innecesarias;

- limpiar estado residual;

- consolidar ownership.

---

# Entregables

Generar:

## 1.

references/trackercompat_consolidation.md

Debe incluir:

- responsabilidades finales;

- métodos restantes;

- ownership definitivo;

- componentes consumidores;

- cambios realizados.

---

## 2.

reports/Fase3.4.log

Debe documentar:

- modificaciones realizadas;

- código eliminado;

- responsabilidades movidas;

- riesgos residuales;

- trabajo pendiente para la Fase 3.5.

---

## 3.

Tabla comparativa

Antes de la fase

↓

Después de la fase

Indicando:

- número de métodos;

- responsabilidades;

- ownership;

- consumidores.

---

## 4.

Lista final de métodos que seguirán existiendo en TrackerCompat y justificación de cada uno.

---

# Criterio de finalización

La fase finalizará únicamente cuando:

- TrackerCompat haya sido reducido al mínimo necesario.

- Toda lógica de negocio pertenezca al dominio.

- TrackerCompat actúe únicamente como adaptador.

- El ownership de delays quede explícitamente en el dominio.

- El código muerto identificado haya sido eliminado o documentado para su retirada.

- El proyecto compile correctamente (`npm run build`).

- Se entregue un resumen ejecutivo indicando si TrackerCompat puede eliminarse completamente en la Fase 3.5.
