# ORION REFACTOR
# ETAPA 3
# FASE 3.6
# FINAL DOMAIN HARDENING

Continuemos exactamente desde el cierre de la Fase 3.5.

## Estado actual

La transición Legacy → Domain ha concluido completamente.

Fases completadas:

- ✅ Fase 3.1 — API Freeze
- ✅ Fase 3.2 — Domain Contracts
- ✅ Fase 3.3 — TrackerCompat Audit
- ✅ Fase 3.4 — TrackerCompat Consolidation
- ✅ Fase 3.5 — TrackerCompat Removal

Estado del proyecto:

- Build limpio.
- 77 módulos.
- 0 errores.
- TrackerCompat eliminado físicamente.
- RouletteTracker es el único punto de entrada del dominio.
- DelayManager pertenece al dominio.
- Bootstrap construye directamente el dominio.
- main.js consume exclusivamente el dominio.
- No existen componentes Legacy activos.

La migración arquitectónica se considera finalizada.

A partir de esta fase el objetivo es consolidar definitivamente el dominio.

---

# Objetivo de la fase

Eliminar la deuda técnica restante del dominio sin modificar el comportamiento observable de la aplicación.

Esta fase busca dejar un dominio consistente, con una única fuente de verdad para cada responsabilidad y sin duplicidades innecesarias.

---

# Objetivos específicos

## 1. Unificación de estadísticas

Auditar completamente:

- getStats()
- getAdvancedStats()

Actualmente existen implementaciones distintas entre:

- RouletteTracker
- RouletteAnalytics

Determinar una única fuente de verdad.

Eliminar la duplicidad manteniendo exactamente la misma API pública.

Verificar que todos los consumidores siguen funcionando.

---

## 2. NUM_META

Eliminar la duplicidad existente.

Debe existir una única definición.

Todos los consumidores deberán utilizar la misma fuente de datos.

No duplicar constantes.

---

## 3. session.spinCount

Auditar completamente:

session.spinCount

Determinar:

- si puede desincronizarse;
- si debe calcularse dinámicamente;
- si debe mantenerse sincronizado automáticamente;
- si debe eliminarse como estado persistente.

Implementar la solución más consistente con el modelo de dominio.

Mantener compatibilidad funcional.

---

## 4. CustomSeries

Auditar la responsabilidad actual.

Actualmente:

- lógica parcialmente en RouletteTracker;
- datos en SettingsManager.

Determinar si:

- el diseño actual es correcto;
- requiere únicamente documentación;
- merece un CustomSeriesManager dedicado.

No crear un nuevo Manager salvo que sea estrictamente necesario y esté plenamente justificado.

---

## 5. Consolidación del dominio

Verificar que:

- RouletteTracker sólo coordina;
- cada Manager mantiene una única responsabilidad;
- RouletteAnalytics continúa siendo un servicio;
- no aparecen nuevas dependencias.

Eliminar cualquier duplicidad residual detectada durante la implementación.

---

## 6. Limpieza final

Eliminar:

- constantes duplicadas;
- métodos privados obsoletos;
- comentarios de migración;
- imports muertos;
- código residual.

Únicamente cuando no exista ningún consumidor.

---

## 7. Validación

Verificar:

- compilación;
- funcionamiento del bootstrap;
- persistencia;
- historial;
- settings;
- delays;
- analytics;
- renderers;
- engines.

Confirmar que el comportamiento observable permanece idéntico.

---

# Restricciones

Durante esta fase NO debe:

- modificar UI;
- modificar HTML;
- modificar CSS;
- introducir funcionalidades nuevas;
- cambiar contratos públicos;
- modificar reglas de negocio;
- optimizar algoritmos únicamente por rendimiento.

Toda modificación debe estar orientada exclusivamente a la coherencia arquitectónica del dominio.

---

# Entregables

Generar:

## 1.

references/domain_hardening_final.md

Debe incluir:

- decisiones arquitectónicas adoptadas;
- fuente de verdad de cada componente;
- ownership definitivo;
- responsabilidades finales;
- deuda técnica eliminada;
- deuda técnica restante (si existiera).

---

## 2.

reports/Fase3.6.log

Debe contener:

- cambios realizados;
- archivos modificados;
- incidencias resueltas;
- incidencias descartadas;
- riesgos;
- validaciones.

---

## 3.

Tabla comparativa

Antes de la fase

↓

Después de la fase

Indicando:

- duplicidades eliminadas;
- responsabilidades consolidadas;
- owners;
- servicios;
- managers.

---

## 4.

Inventario final del dominio

Debe reflejar la arquitectura definitiva:

### Núcleo

- RouletteTracker

### Managers

- SpinManager
- SessionManager
- HistoryManager
- SettingsManager
- DelayManager

### Servicios

- RouletteAnalytics

### Utilidades

- numberMeta

Indicando claramente el Owner de cada responsabilidad.

---

# Criterio de finalización

La fase finalizará únicamente cuando:

- Exista una única fuente de verdad para estadísticas.
- NUM_META esté completamente centralizado.
- session.spinCount tenga una política consistente y documentada.
- CustomSeries quede correctamente justificado o reorganizado.
- No permanezcan duplicidades relevantes en el dominio.
- El proyecto compile correctamente (`npm run build`).
- Se entregue un resumen ejecutivo confirmando que el dominio ha quedado consolidado y listo para iniciar la siguiente etapa del proyecto.
