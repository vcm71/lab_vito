# ORION REFACTOR
# ETAPA 3
# FASE 3.2
# DOMAIN CONTRACTS

Continuemos exactamente desde el cierre de la Fase 3.1.

## Estado actual

La migración Legacy → Domain ha finalizado completamente.

La Fase 3.1 concluyó con éxito.

Entregables existentes:

- `references/domain_contract.md`
- `reports/Fase3.1.log`

Hallazgos confirmados:

- RouletteTracker expone 48 métodos.
- 30 métodos pertenecen al contrato estable.
- 18 métodos son delegaciones hacia Managers.
- TrackerCompat sigue siendo la única capa temporal de compatibilidad.
- Existe duplicidad funcional entre:
  - getStats()
  - getAdvancedStats()
- Existe una referencia a getStatsForSet() que debe investigarse.
- Build limpio.
- No hubo cambios de comportamiento.

La API pública ya quedó congelada.

Ahora comienza la consolidación interna del dominio.

---

# Objetivo de la fase

Auditar completamente los contratos internos del dominio para asegurar que la arquitectura DDD quede correctamente consolidada antes de continuar con la eliminación definitiva de compatibilidad.

Esta fase NO busca optimizar.

NO busca eliminar código.

NO busca simplificar la API.

Busca verificar que el dominio tenga responsabilidades correctamente definidas y documentadas.

---

# Objetivos específicos

Realizar una auditoría completa de:

## 1. Responsabilidades

Verificar que cada componente tenga una única responsabilidad clara.

Revisar especialmente:

- RouletteTracker
- SpinManager
- SessionManager
- HistoryManager
- SettingsManager
- RouletteAnalytics

Para cada componente indicar:

- Responsabilidad principal.
- Responsabilidades secundarias.
- Posibles mezclas de responsabilidades.
- Riesgos arquitectónicos.

---

## 2. Ownership del dominio

Verificar que exista un único Owner para cada tipo de información.

Auditar:

- Spins
- History
- Session
- Settings
- Estadísticas
- Analytics
- Persistencia

Detectar:

- ownership duplicado
- ownership ambiguo
- ownership implícito

---

## 3. Dependencias internas

Construir el mapa de dependencias entre componentes.

Identificar:

Dependencias permitidas.

Dependencias innecesarias.

Acoplamientos fuertes.

Posibles ciclos.

Dependencias que podrían invertirse en el futuro.

Sin modificarlas aún.

---

## 4. Invariantes del dominio

Documentar las reglas que siempre deben cumplirse.

Ejemplos:

- consistencia de spins
- sesión activa
- persistencia
- sincronización de history
- normalización
- validaciones

Determinar cuáles están protegidas por código y cuáles dependen únicamente de convenciones.

---

## 5. Delegaciones

Analizar las 18 delegaciones detectadas en la fase anterior.

Clasificarlas como:

- delegación correcta
- delegación innecesaria
- posible simplificación futura

Sin modificar código.

---

## 6. Duplicidades

Analizar técnicamente:

- getStats()
- getAdvancedStats()

Responder:

- cuál debería ser la fuente única de verdad;
- cuál consume datos;
- cuál produce datos;
- qué riesgos existen si ambas implementaciones evolucionan por separado.

No implementar la unificación todavía.

Sólo documentarla.

---

## 7. Dead Code

Investigar completamente:

getStatsForSet()

Determinar:

- dónde se invoca;
- si alguna vez existió;
- si es un bug;
- si es código muerto;
- si debe eliminarse o implementarse en una fase futura.

No modificar código.

---

# Restricciones

Durante esta fase NO debe:

- cambiar comportamiento observable;
- modificar UI;
- modificar HTML;
- modificar CSS;
- eliminar TrackerCompat;
- eliminar métodos;
- mover lógica entre clases;
- optimizar rendimiento;
- introducir funcionalidades nuevas.

Esta es una fase exclusivamente de auditoría y documentación arquitectónica.

---

# Entregables

Generar:

## 1.

`references/domain_internal_contract.md`

Debe contener:

- responsabilidades
- ownership
- invariantes
- dependencias
- reglas del dominio

---

## 2.

`reports/Fase3.2.log`

Debe contener:

- hallazgos
- riesgos
- duplicidades
- deuda técnica detectada
- recomendaciones para fases posteriores

---

## 3.

Mapa completo del dominio indicando:

- componentes
- dependencias
- owners
- lectores
- flujo de datos

---

## 4.

Clasificación de todas las incidencias encontradas según prioridad:

- Crítica
- Alta
- Media
- Baja
- Informativa

---

## Criterio de finalización

La fase finalizará únicamente cuando:

- El dominio haya sido completamente auditado.
- Las responsabilidades estén claramente documentadas.
- Los contratos internos queden definidos.
- Las invariantes del dominio estén identificadas.
- El ownership sea explícito.
- El mapa de dependencias esté documentado.
- No existan cambios funcionales.
- El proyecto compile correctamente (`npm run build`).
- Se entregue un resumen ejecutivo de la auditoría con las conclusiones y la preparación para la siguiente fase (Fase 3.3 — Auditoría de TrackerCompat).
