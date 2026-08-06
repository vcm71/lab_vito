# ORION REFACTOR
# ETAPA 2
# FASE 5.2.1
# CIERRE DE GAPS CRÍTICOS — BLOQUE I

## Contexto

La Fase 5.2 concluyó mediante una auditoría técnica que `RouletteTracker` aún no implementa completamente el contrato funcional del Legacy Tracker respecto a la gestión de Spins.

Resultado de la auditoría:

- 21 responsabilidades auditadas
- 5 equivalentes
- 3 parciales
- 13 inexistentes

Se identificaron tres gaps críticos que impiden convertir al dominio en el Owner de los Spins:

- GAP-01 — Validación
- GAP-04 — Persistencia
- GAP-07 — Hidratación

El Legacy Tracker continúa siendo el Owner de Spins.

El `TrackerSyncAdapter` mantiene la sincronización entre Legacy y Domain.

Esta fase NO modifica esa arquitectura.

---

# Objetivo

Cerrar los gaps críticos del dominio para acercarlo a la equivalencia funcional con el Legacy Tracker, sin alterar el comportamiento observable del sistema.

El objetivo NO es invertir todavía el ownership.

El objetivo es preparar al dominio para que pueda hacerlo en una fase posterior.

---

# Alcance

Esta fase trabaja únicamente sobre:

## GAP-01

Validación de Spins

El dominio debe validar cada Spin antes de incorporarlo al estado.

La validación debe impedir que ingresen valores inválidos.

Debe utilizar el conjunto oficial de números permitido (`ROULETTE_NUMBERS`) o la infraestructura equivalente existente.

La lógica de validación debe vivir exclusivamente en el dominio.

No debe duplicarse en múltiples componentes.

---

## GAP-04

Persistencia

Antes de implementar cualquier cambio, realizar una auditoría de la infraestructura de persistencia existente.

Determinar si el Legacy utiliza:

- un servicio reutilizable;
- una capa de infraestructura compartida;
- un wrapper de IndexedDB;
- un Repository;
- una implementación interna acoplada.

Documentar el resultado.

### Regla principal

Si existe infraestructura reutilizable:

- reutilizarla;
- no duplicarla;
- mantener una única implementación de persistencia.

Si la persistencia está completamente acoplada al Legacy:

extraer únicamente la infraestructura necesaria hacia la capa correspondiente.

No copiar código.

No crear una segunda implementación de IndexedDB.

La persistencia del dominio debe utilizar la misma infraestructura siempre que sea técnicamente viable.

---

## GAP-07

Hidratación

El dominio debe ser capaz de reconstruir su estado de Spins desde la persistencia durante su inicialización.

La hidratación debe:

- restaurar el estado completo;
- mantener consistencia;
- dejar el dominio listo antes de que otros componentes lo consuman.

No modificar el flujo de sincronización actual.

---

# Restricciones

NO invertir el ownership.

NO eliminar Legacy Tracker.

NO eliminar TrackerSyncAdapter.

NO modificar UI.

NO modificar HTML.

NO modificar CSS.

NO modificar Renderers.

NO migrar Engines.

NO modificar Simulation.

NO introducir nuevas funcionalidades.

NO reorganizar archivos.

NO cambiar comportamiento observable.

Mantener compatibilidad completa.

---

# Restricciones de arquitectura

NO duplicar infraestructura existente.

NO crear un segundo acceso a IndexedDB.

NO crear un segundo mecanismo de persistencia.

NO duplicar validaciones.

NO romper compatibilidad con el Legacy.

Preferir extracción de infraestructura antes que reimplementación.

Mantener un único punto de acceso al almacenamiento.

Toda nueva lógica de negocio debe permanecer dentro del dominio.

La infraestructura debe permanecer desacoplada del dominio siguiendo la arquitectura existente.

---

# Trabajo requerido

## 1. Auditoría de Persistencia

Analizar cómo persiste actualmente el Legacy Tracker.

Identificar:

- servicios utilizados;
- adapters;
- repositories;
- utilidades;
- wrappers;
- dependencias.

Determinar si son reutilizables.

---

## 2. Validación

Implementar validación completa de Spins dentro del dominio.

Garantizar que:

- sólo entren valores válidos;
- las validaciones sean centralizadas;
- no existan duplicaciones.

---

## 3. Persistencia

Conectar el dominio con la infraestructura de persistencia existente.

Si es necesario extraer infraestructura:

hacer la extracción mínima posible.

No realizar refactorizaciones masivas.

---

## 4. Hidratación

Implementar carga inicial desde persistencia.

La restauración debe dejar el dominio consistente.

---

## 5. Compatibilidad

Verificar que el flujo actual permanezca exactamente igual:

UI

↓

TrackerSyncAdapter

↓

Legacy Tracker (Owner)

↓

RouletteTracker

El dominio únicamente incrementa capacidades.

No cambia el ownership.

---

# Verificaciones

Comprobar:

✓ Validación de Spins válidos.

✓ Rechazo de Spins inválidos.

✓ Persistencia correcta.

✓ Restauración correcta tras reinicio.

✓ Sincronización Legacy ↔ Domain intacta.

✓ Compatibilidad completa.

✓ Build limpio.

Ejecutar obligatoriamente:

```bash
npm run build
```

No finalizar la fase si existen errores de compilación.

---

# Entregables

Generar:

```
reports/

FASE_5_2_1_GAP_CLOSURE.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Objetivos

3. Auditoría de infraestructura de persistencia

4. Diseño adoptado

5. Cambios realizados

6. Validación implementada

7. Persistencia implementada

8. Hidratación implementada

9. Compatibilidad con Legacy

10. Riesgos

11. Resultado del build

12. Estado actualizado de los gaps

Clasificar cada gap como:

- Resuelto
- Parcial
- Pendiente

---

# Criterio de aceptación

La fase se considera completada únicamente si:

- GAP-01 queda resuelto o documentado objetivamente.
- GAP-04 queda resuelto reutilizando o extrayendo la infraestructura existente, sin duplicarla.
- GAP-07 queda resuelto mediante hidratación consistente del dominio.
- No existen regresiones funcionales.
- El flujo Legacy → Domain permanece operativo.
- El proyecto compila sin errores.
- Se mantiene la compatibilidad completa con la arquitectura actual.

---

# Criterio de salida

Al finalizar esta fase, `RouletteTracker` debe haber incorporado las capacidades críticas de validación, persistencia e hidratación necesarias para acercarse a la equivalencia funcional con el Legacy Tracker, manteniendo a este último como Owner de Spins.

Esta fase NO autoriza la inversión del ownership.

La decisión de invertir el ownership deberá tomarse únicamente después de una nueva auditoría de equivalencia funcional (Fase 5.2.2 o reauditoría equivalente) que confirme objetivamente que el dominio implementa el 100% del contrato funcional requerido.
