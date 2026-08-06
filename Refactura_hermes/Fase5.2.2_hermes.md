# ORION REFACTOR
# ETAPA 2
# FASE 5.2.2
# CIERRE DE GAPS FUNCIONALES — PARIDAD DE SPINS

## Contexto

La Fase 5.2 realizó una auditoría completa entre el Legacy Tracker y el nuevo dominio (`RouletteTracker` + `SpinManager`).

La Fase 5.2.1 resolvió los gaps críticos:

- GAP-01 — Validación
- GAP-04 — Persistencia
- GAP-07 — Hidratación

El proyecto continúa utilizando la siguiente arquitectura:

UI
↓
TrackerSyncAdapter
├── Legacy Tracker (Owner de Spins)
└── RouletteTracker (Replica sincronizada)

El ownership NO cambia en esta fase.

---

# Objetivo

Completar la equivalencia funcional entre el dominio y el Legacy respecto a la gestión de Spins.

Esta fase NO busca optimizar ni rediseñar.

Busca reproducir el contrato funcional existente del Legacy dentro del dominio.

Al finalizar esta fase, todas las diferencias funcionales identificadas en la auditoría deberán estar resueltas o justificadas técnicamente.

---

# Alcance

Trabajar únicamente sobre los gaps pendientes de la auditoría.

## GAP-02

CRUD de Spins

Implementar en `SpinManager` las operaciones equivalentes al Legacy para:

- deleteSpin(...)
- updateSpin(...)

Las operaciones deben:

- mantener consistencia del estado;
- respetar la persistencia existente;
- actualizar cualquier estructura derivada necesaria.

No modificar la API pública existente salvo que sea imprescindible para mantener compatibilidad.

---

## GAP-03

Normalización

Centralizar la normalización de entradas antes de la validación.

La implementación debe reproducir el comportamiento del Legacy.

Considerar, según corresponda:

- espacios
- trim
- mayúsculas/minúsculas
- separadores
- "." y ","
- "90" → "00"
- formatos históricos admitidos

No introducir reglas nuevas.

No eliminar reglas existentes.

La normalización debe existir en un único punto del dominio.

---

## GAP-05

Cache de frecuencias

Analizar el mecanismo utilizado por el Legacy.

Determinar:

- estructura
- ciclo de vida
- invalidación
- actualización

Implementar una solución equivalente únicamente si la auditoría confirma que forma parte del contrato funcional o del rendimiento esperado.

No optimizar prematuramente.

Mantener coherencia con la arquitectura del dominio.

---

## GAP-06

Metadatos

Incorporar soporte para los metadatos utilizados por el Legacy cuando forman parte del modelo de Spin.

Ejemplos:

- casino
- dealer
- table

La incorporación debe:

- mantener compatibilidad;
- no romper serialización;
- no romper persistencia;
- no afectar APIs existentes.

No inventar nuevos campos.

No eliminar campos existentes.

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

NO reorganizar archivos.

NO introducir nuevas funcionalidades.

NO cambiar comportamiento observable.

Mantener compilación limpia.

---

# Restricciones de arquitectura

Toda lógica de negocio debe permanecer dentro del dominio.

No duplicar lógica existente.

No duplicar normalización.

No duplicar persistencia.

No duplicar estructuras de cache.

Reutilizar infraestructura existente siempre que sea posible.

Toda nueva responsabilidad debe tener un único Owner.

---

# Trabajo requerido

## 1. Auditoría puntual

Antes de implementar cada gap:

Comparar exactamente el comportamiento del Legacy.

No asumir equivalencias.

Documentar cualquier diferencia detectada.

---

## 2. CRUD

Implementar las operaciones faltantes.

Garantizar consistencia entre:

- memoria
- persistencia
- estado del dominio

---

## 3. Normalización

Extraer toda la normalización a un único punto del dominio.

Eliminar duplicaciones si aparecen durante la implementación.

---

## 4. Cache

Implementar únicamente si existe evidencia de que el Legacy depende de ella para mantener el comportamiento esperado o el rendimiento estructural.

En caso contrario, justificar técnicamente su omisión.

---

## 5. Metadatos

Incorporar soporte completo respetando compatibilidad con el Legacy.

---

## 6. Compatibilidad

Verificar que el flujo continúe siendo:

UI

↓

TrackerSyncAdapter

↓

Legacy Tracker (Owner)

↓

RouletteTracker

No modificar el ownership.

---

# Verificaciones

Comprobar:

✓ deleteSpin()

✓ updateSpin()

✓ normalización

✓ persistencia

✓ hidratación

✓ metadatos

✓ cache (si aplica)

✓ sincronización Legacy ↔ Domain

✓ compilación limpia

Ejecutar obligatoriamente:

```bash
npm run build
```

No cerrar la fase si existen errores.

---

# Entregables

Generar:

```
reports/

FASE_5_2_2_FUNCTIONAL_PARITY.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Objetivos

3. Gaps abordados

4. Comparación Legacy vs Domain

5. CRUD implementado

6. Normalización implementada

7. Cache implementada o justificada

8. Metadatos implementados

9. Compatibilidad

10. Riesgos

11. Resultado del build

12. Estado actualizado de los gaps

Clasificar cada gap como:

- Resuelto
- Parcial
- No aplica (justificado)
- Pendiente

---

# Criterio de aceptación

La fase se considera completada únicamente si:

- GAP-02 queda resuelto.
- GAP-03 queda resuelto.
- GAP-05 queda resuelto o técnicamente justificado.
- GAP-06 queda resuelto.
- No existen regresiones funcionales.
- El flujo Legacy → Domain permanece intacto.
- El proyecto compila sin errores.

---

# Criterio de salida

Al finalizar esta fase, `RouletteTracker` y `SpinManager` deberán implementar el contrato funcional del Legacy respecto a la gestión de Spins, manteniendo la compatibilidad completa y sin modificar el ownership.

La siguiente fase será una **reauditoría de equivalencia (Fase 5.2.3)**.

Únicamente si dicha reauditoría demuestra que el dominio implementa el 100 % del contrato funcional y no existen diferencias significativas, podrá iniciarse la **Fase 5.2.4 — Inversión del Ownership de Spins**.
