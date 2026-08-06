# ORION REFACTOR
# ETAPA 3
# FASE 3.5
# TRACKERCOMPAT REMOVAL

Continuemos exactamente desde el cierre de la Fase 3.4.

## Estado actual

La migración Legacy → Domain está completamente finalizada.

Fases completadas:

- ✅ Fase 3.1 — API Freeze
- ✅ Fase 3.2 — Domain Contracts
- ✅ Fase 3.3 — TrackerCompat Audit
- ✅ Fase 3.4 — TrackerCompat Consolidation

Documentación existente:

- references/domain_contract.md
- references/domain_internal_contract.md
- references/trackercompat_audit.md
- references/trackercompat_consolidation.md

Reportes:

- reports/Fase3.1.log
- reports/Fase3.2.log
- reports/Fase3.3.log
- reports/Fase3.4.log

Estado del proyecto:

- Build limpio.
- TrackerCompat ya no posee estado.
- DelayManager es el Owner de delays.
- TrackerCompat actúa únicamente como adaptador.
- No existen incidencias funcionales críticas conocidas.

---

# Objetivo de la fase

Eliminar definitivamente TrackerCompat del proyecto, siempre que ningún consumidor activo lo requiera.

Si todavía existen consumidores reales, migrarlos primero hacia RouletteTracker o hacia el componente del dominio correspondiente.

La eliminación debe ser transparente para el comportamiento observable de la aplicación.

---

# Objetivos específicos

## 1. Auditoría final de consumidores

Realizar una búsqueda completa de todas las referencias a:

- TrackerCompat
- new TrackerCompat(...)
- import TrackerCompat
- métodos expuestos únicamente por TrackerCompat

Construir un inventario indicando:

- archivo;
- consumidor;
- método utilizado;
- dependencia creada.

---

## 2. Migración de consumidores

Para cada consumidor encontrado:

Determinar:

- si puede consumir directamente RouletteTracker;
- si debe consumir un Manager;
- si debe consumir RouletteAnalytics;
- si requiere un pequeño adaptador temporal.

Migrar únicamente cuando no cambie el comportamiento observable.

---

## 3. Eliminación del adaptador

Una vez migrados todos los consumidores:

Eliminar:

- TrackerCompat.js
- exports relacionados
- imports
- referencias residuales

Eliminar también cualquier documentación que lo considere parte de la arquitectura activa.

---

## 4. Limpieza del dominio

Verificar que no permanezcan:

- métodos exclusivos para TrackerCompat;
- delegaciones artificiales;
- adaptadores internos;
- estados residuales;
- comentarios relacionados con la migración Legacy.

Eliminar únicamente aquello que haya quedado completamente obsoleto.

---

## 5. Validación arquitectónica

Confirmar que:

- RouletteTracker es el único punto de entrada al dominio.
- Todos los Managers son consumidos únicamente por RouletteTracker o por componentes autorizados.
- RouletteAnalytics continúa desacoplado.
- DelayManager mantiene el ownership de delays.
- No aparecen nuevas dependencias circulares.

---

## 6. Verificación funcional

Comprobar que:

- Bootstrap funciona sin TrackerCompat.
- main.js funciona sin TrackerCompat.
- Todos los renderers siguen funcionando.
- Engines siguen funcionando.
- Persistencia continúa operativa.
- Historial.
- Spins.
- Session.
- Settings.
- Analytics.
- Delays.

Sin cambios observables.

---

# Restricciones

Durante esta fase NO debe:

- modificar UI;
- modificar HTML;
- modificar CSS;
- introducir funcionalidades nuevas;
- cambiar contratos públicos del dominio;
- modificar reglas de negocio;
- optimizar algoritmos;
- alterar RouletteAnalytics salvo para eliminar dependencias directas con TrackerCompat.

El único objetivo es retirar completamente la capa de compatibilidad.

---

# Entregables

Generar:

## 1.

references/final_architecture_transition.md

Debe documentar:

- arquitectura antes;
- arquitectura después;
- componentes eliminados;
- dependencias eliminadas;
- simplificaciones obtenidas.

---

## 2.

reports/Fase3.5.log

Debe contener:

- consumidores migrados;
- archivos modificados;
- archivos eliminados;
- riesgos encontrados;
- validaciones realizadas;
- resultado final.

---

## 3.

Tabla comparativa

Antes

↓

Después

Indicando:

- número de componentes;
- adaptadores;
- capas;
- dependencias;
- owners.

---

## 4.

Inventario final del dominio

Debe indicar:

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

### Compatibilidad

- Ninguna (si TrackerCompat pudo eliminarse completamente)

o

- Justificación detallada de cualquier remanente que deba permanecer.

---

# Criterio de finalización

La fase finalizará únicamente cuando:

- TrackerCompat haya sido eliminado físicamente **o** se demuestre técnicamente por qué aún no puede eliminarse.
- No existan referencias activas a TrackerCompat en el flujo principal de la aplicación.
- RouletteTracker sea el único punto de entrada al dominio.
- El ownership del estado permanezca completamente en el dominio.
- El proyecto compile correctamente (`npm run build`).
- Se entregue un resumen ejecutivo indicando el estado definitivo de la transición arquitectónica y si la arquitectura está preparada para iniciar la Fase 3.6 — Final Domain Hardening.
