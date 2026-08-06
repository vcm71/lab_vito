# ORION REFACTOR
# ETAPA 2
# FASE 5.2.5
# INVERSIÓN DEL OWNERSHIP DE SPINS

## Contexto

Las fases anteriores prepararon el dominio para asumir la responsabilidad completa sobre los Spins.

Estado alcanzado:

### Fase 5.2
Auditoría inicial:
- RouletteTracker no podía ser Owner.

### Fase 5.2.1
Gaps críticos resueltos:
- Validación
- Persistencia
- Hidratación

### Fase 5.2.2
Paridad funcional alcanzada:
- CRUD
- Normalización
- Metadatos
- Compatibilidad

### Fase 5.2.3
Reauditoría:
- RouletteTracker implementa el contrato funcional requerido.

### Fase 5.2.4
Preparación de consumidores:
- Eliminadas dependencias internas del Legacy.
- Engines adaptados.
- TrackerSyncAdapter preparado.

---

# Objetivo

Invertir formalmente el ownership de Spins.

El dominio pasa a ser la única fuente de verdad.

El Legacy Tracker deja de ser Owner y pasa a funcionar como adaptador temporal de compatibilidad.

---

# Arquitectura objetivo

ANTES:

UI

↓

TrackerSyncAdapter

↓

Legacy Tracker
(Owner)

↓

RouletteTracker


DESPUÉS:

UI

↓

TrackerSyncAdapter

↓

RouletteTracker
(Owner)

↓

Legacy Tracker
(Adapter temporal)

---

# Principios de la migración

## 1. RouletteTracker es la autoridad

Toda operación de Spin debe originarse en el dominio.

El flujo principal debe ser:

entrada

↓

RouletteTracker

↓

SpinManager

↓

Estado

↓

Persistencia

↓

Compatibilidad Legacy


---

## 2. Legacy deja de decidir

El Legacy Tracker:

- no valida;
- no normaliza;
- no persiste como autoridad;
- no mantiene el estado principal.

Su función queda limitada a compatibilidad.

---

## 3. Mantener rollback posible

Durante esta fase:

- no eliminar código Legacy;
- no eliminar TrackerSyncAdapter;
- mantener capacidad de revertir la dirección del flujo.

---

# Trabajo requerido

## 1. Invertir TrackerSyncAdapter

Modificar la dirección de sincronización.

Antes:

Legacy → Domain

Después:

Domain → Legacy


El adapter debe:

- recibir operaciones del dominio;
- actualizar Legacy para compatibilidad;
- evitar doble ownership.

---

## 2. Migrar operaciones CRUD

Todas las operaciones deben pasar por:

RouletteTracker

Incluyendo:

- addSpin()
- deleteSpin()
- updateSpin()
- clear()
- importación
- operaciones equivalentes


---

## 3. Persistencia

Resolver R05.

Después de la inversión:

RouletteTracker debe controlar el ciclo completo:

Spin

↓

Estado

↓

Persistencia


No debe depender de que Legacy ejecute persistencia.

---

## 4. Migrar consumidores restantes

Resolver R06.

Los consumidores deben utilizar:

- RouletteTracker;
- APIs públicas;
- dominio.

No deben apuntar al Legacy.

---

## 5. Sincronización de compatibilidad

Después de cada operación verificar:

Domain State

=

Legacy State


El Legacy debe reflejar el estado del dominio.

No al revés.

---

# Restricciones

NO eliminar Legacy Tracker.

NO eliminar TrackerSyncAdapter.

NO cambiar UI.

NO cambiar HTML.

NO cambiar CSS.

NO modificar Renderers.

NO introducir funcionalidades nuevas.

NO migrar todavía toda la infraestructura Legacy.

NO realizar limpieza definitiva.

NO cambiar APIs públicas externas sin necesidad.

---

# Verificaciones obligatorias

Verificar:

✓ addSpin funciona desde Domain.

✓ deleteSpin funciona desde Domain.

✓ updateSpin funciona desde Domain.

✓ import funciona desde Domain.

✓ clear funciona desde Domain.

✓ Persistencia ocurre desde Domain.

✓ Legacy refleja el estado del Domain.

✓ Engines continúan funcionando.

✓ History continúa funcionando.

✓ HitMap continúa funcionando.

✓ Session continúa funcionando.

✓ Build limpio.

Ejecutar:

```bash
npm run build
```

---

# Validación de regresión

Durante la fase comparar:

Antes:

Legacy State

Después:

Domain State


Confirmar:

- misma cantidad de spins;
- mismo orden;
- mismos metadatos;
- mismas frecuencias;
- mismo historial;
- misma persistencia.

---

# Entregables

Generar:

```
reports/

FASE_5_2_5_OWNERSHIP_INVERSION.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Arquitectura anterior

3. Arquitectura nueva

4. Cambios realizados

5. TrackerSyncAdapter actualizado

6. Persistencia migrada

7. Consumidores migrados

8. Compatibilidad Legacy

9. Validaciones realizadas

10. Riesgos

11. Resultado del build

12. Estado final del ownership

---

# Criterio de aceptación

La fase se considera completada únicamente si:

- RouletteTracker es la única fuente de verdad.
- Legacy Tracker funciona únicamente como compatibilidad.
- Todas las operaciones de Spins pasan por Domain.
- La persistencia pertenece al ciclo del Domain.
- Los consumidores no dependen del Legacy.
- No existen regresiones funcionales.
- El proyecto compila correctamente.

---

# Estado esperado al finalizar

Ownership:

| Entidad | Owner |
|---------|-------|
| Spins | RouletteTracker |
| Session | RouletteTracker |
| Settings | RouletteTracker |
| History | RouletteTracker |

Compatibilidad:

| Componente | Rol |
|------------|-----|
| Legacy Tracker | Adapter temporal |
| TrackerSyncAdapter | Puente de compatibilidad |

Siguiente etapa:

Fase 5.3

Eliminar `externalSpins` y continuar la retirada progresiva del Legacy.
