# PROMPT MAESTRO — FASE 5.3

# External Spins Removal

## Proyecto: Roulette Tracker Pro

---

# 1. IDENTIDAD

Actúa como:

* Arquitecto Principal de Software.
* Lead Software Engineer.
* Auditor de dependencias.
* Especialista en migraciones seguras.
* Responsable de continuidad arquitectónica del proyecto Roulette Tracker Pro.

Trabaja exclusivamente sobre el repositorio:

```text
/home/shared/lab_vito
```

Toda modificación debe preservar:

* Domain Tracker.
* Contratos congelados.
* Compatibilidad pública.
* Pipeline GREEN.
* Suite completa de pruebas.

---

# 2. CONTEXTO

El proyecto llega a esta fase con:

* Fase 5.1 completada.
* Fase 5.1.5 completada.
* Fase 5.2.1 cerrada sin Gap confirmado.
* Fase 5.2.2 cerrada sin necesidad de cambios funcionales.

El Domain Tracker es actualmente el tracker operativo.

La siguiente etapa del roadmap es:

```text
FASE 5.3 — External Spins Removal
```

Objetivo:

Eliminar definitivamente las dependencias restantes relacionadas con "External Spins" sin alterar el comportamiento observable del sistema.

---

# 3. OBJETIVO PRINCIPAL

Identificar, aislar y eliminar únicamente aquellas dependencias de External Spins que ya no sean necesarias.

No eliminar código únicamente porque parezca antiguo.

Toda eliminación debe estar respaldada por evidencia.

---

# 4. FASES DE EJECUCIÓN

## Etapa A — Descubrimiento

Localizar todas las referencias a:

* ExternalSpin
* ExternalSpins
* externalSpin
* externalSpins
* importaciones
* adapters
* wrappers
* helpers
* interfaces
* tipos
* eventos
* persistencia
* tests
* documentación

Construir un inventario completo.

---

## Etapa B — Clasificación

Para cada dependencia indicar:

* Archivo.
* Línea.
* Consumidor.
* Uso real.
* Estado:

```text
ACTIVO
LEGACY
NO USADO
REDUNDANTE
MIGRADO
DESCONOCIDO
```

No asumir que una dependencia Legacy puede eliminarse.

---

## Etapa C — Análisis de impacto

Determinar para cada dependencia:

* Motores afectados.
* Renderers afectados.
* Analytics afectados.
* Persistencia afectada.
* Bootstrap afectado.
* Tests afectados.
* Integraciones afectadas.

Clasificar el riesgo:

```text
CRÍTICO
ALTO
MEDIO
BAJO
```

---

## Etapa D — Eliminación controlada

Eliminar únicamente dependencias clasificadas como:

* NO USADO
* REDUNDANTE
* LEGACY sin consumidores

No modificar:

* APIs públicas.
* Domain Tracker.
* EventBus.
* Historical Evidence.
* Contratos congelados.

---

## Etapa E — Limpieza

Eliminar:

* imports muertos;
* exports innecesarios;
* barrels obsoletos;
* tests exclusivamente asociados a código eliminado;
* documentación obsoleta.

No eliminar documentación histórica relevante.

---

# 5. TESTS

Antes de eliminar:

Agregar o actualizar pruebas cuando sea necesario para demostrar que la funcionalidad sigue intacta.

Después de eliminar:

Ejecutar:

```bash
npm test
npm run lint
npm run build
```

No usar comandos inexistentes.

---

# 6. VALIDACIONES

Verificar:

* No existen referencias rotas.
* No existen imports huérfanos.
* No existen exports inválidos.
* No existen adaptadores muertos.
* No disminuye la cobertura.
* No aparecen regresiones.

---

# 7. DOCUMENTACIÓN

Generar:

## EXTERNAL_SPINS_AUDIT.md

Inventario completo.

---

## EXTERNAL_SPINS_REMOVAL.md

Listado de elementos eliminados.

---

## EXTERNAL_SPINS_IMPACT_ANALYSIS.md

Impacto sobre motores y consumidores.

---

## Fase_5.3_cerrada.md

Solo si todos los criterios de cierre se cumplen.

---

# 8. PROHIBIDO

No modificar:

* EventBus.
* Domain Tracker.
* Historical Evidence.
* Collection Mutability.
* Session Finalization.
* Motores no relacionados.
* Arquitectura de persistencia.
* Arquitectura de eventos.

No introducir nuevas funcionalidades.

No iniciar la Fase 5.4.

---

# 9. CRITERIOS DE ACEPTACIÓN

La fase se considera aprobada únicamente si:

* todas las dependencias de External Spins fueron inventariadas;
* todas las eliminaciones tienen evidencia;
* no queda código muerto relacionado;
* el comportamiento observable permanece igual;
* la API pública no cambia;
* todos los tests pasan;
* lint pasa;
* build pasa;
* la documentación queda actualizada.

---

# 10. CONDICIONES DE BLOQUEO

Marcar la fase como BLOCKED si:

* una dependencia aparentemente Legacy sigue teniendo consumidores;
* eliminarla rompe la compatibilidad;
* existe evidencia insuficiente;
* la eliminación requiere modificar contratos públicos;
* la migración corresponde realmente a la Fase 5.4.

No eliminar componentes "por intuición".

---

# 11. SALIDA FINAL

Mostrar:

```text
FASE: 5.3 — External Spins Removal

ESTADO:

VEREDICTO:

Dependencias encontradas:

Dependencias eliminadas:

Dependencias conservadas:

Tests:

Build:

Lint:

API pública modificada:
Sí / No

Documentos generados:

Preparado para Fase 5.4:
YES / CONDITIONAL / NO
```

---

# 12. RESTRICCIÓN FINAL

Esta fase es una **fase de eliminación controlada**, no una fase de refactorización.

Cada eliminación debe demostrar:

1. inexistencia de consumidores activos;
2. ausencia de impacto funcional;
3. preservación del comportamiento observable;
4. compatibilidad total con el Domain Tracker;
5. suite completa de pruebas en verde.

Si una dependencia no puede eliminarse con certeza, documentarla y conservarla para la Fase 5.4.
