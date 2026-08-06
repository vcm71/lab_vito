# Roadmap Técnico — Roulette Tracker Pro

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

---

## Resumen

```
Fase3 ──► Fase4 ──► Fase5 ──► Fase6 ──► Fase7
 (completado)  (completado)  (en curso)   (futuro)    (futuro)
```

---

## Fase 3: Refactor a Engines (COMPLETADA)

**Objetivo:** Normalizar la arquitectura de motores.

| Etapa | Estado | Descripción |
|-------|--------|-------------|
| 3.1   | ✅ Done | API Freeze del Legacy Tracker |
| 3.2   | ✅ Done | Contract Audit entre motores |
| 3.3   | ✅ Done | Consolidación de imports |
| 3.4   | ✅ Done | Extracción de DelayManager |
| 3.5   | ✅ Done | TrackerCompat eliminado |

**Lecciones:**
- Extraer DelayManager antes de eliminarlo todo
- Los imports deben normalizarse gradualmente

---

## Fase 4: Domain Tracker (COMPLETADA)

**Objetivo:** Crear un dominio puro, testeable y con documentación completa.

| Etapa | Estado | Descripción |
|-------|--------|-------------|
| 4.1   | ✅ Done | Domain Test Foundation (5 unit test files) |
| 4.2   | ✅ Done | Integration Testing (6 tests, 4 files) |
| 4.3   | ✅ Done | Regression Safety (81 tests, guía) |
| 4.4   | ✅ Done | Engineering Documentation & Governance |

**Lecciones:**
- La documentación debe crearse durante la implementación, no al final
- `vi.mock` factories no deben usar `vi.fn()`
- Los tests de regresión son esenciales para la confianza en refactors

---

## Fase 5: Gap Resolution (EN CURSO)

**Objetivo:** Cerrar brechas funcionales entre el Legacy y el Domain Tracker.

| Etapa   | Estado     | Descripción |
|---------|------------|-------------|
| 5.1     | (pendiente)| Sync Audit — auditoría de diferencias funcionales |
| 5.2.x   | (pendiente)| Gap fixes — implementación de brechas identificadas |
| 5.3     | (pendiente)| External Spins Removal |
| 5.4     | (pendiente)| Engine Migration |
| 5.5.x   | (pendiente)| Legacy Dependency Audit |

**Pendiente para Fase 5:**
- Auditoría funcional completa (getStats, getAdvancedStats, getAlerts, etc.)
- Migración de motores que aún dependen del Legacy
- Eliminar dependencias de `rouletteTracker.js`

---

## Fase 6: Arquitectura de Eventos (FUTURO)

**Objetivo:** Sistema de eventos desacoplado para comunicación entre dominio, motores y UI.

- EventBus funcional: dominio emite eventos al mutar estado
- Motores se suscriben a eventos de datos cambiados
- UI se suscribe a eventos de dominio (sin polling)
- Desacoplar renderers de referencias directas al tracker

**Prioridad:** Media

---

## Fase 7: Persistencia Unificada (FUTURO)

**Objetivo:** Unificar los mecanismos de persistencia bajo una sola abstracción.

- StoreAdapter: interfaz común para IndexedDB / localStorage / API remota
- Migrar HistoryManager a IndexedDB (actualmente localStorage)
- Transacciones atómicas multi-store
- Backup/restore de datos completos

**Prioridad:** Baja

---

## Principios rectores para fases futuras

1. **No romper tests existentes** — Toda nueva funcionalidad debe mantener la
   suite verde.
2. **Documentar antes de merge** — Los cambios estructurales requieren
   actualización de ARCHITECTURE.md o ADRs.
3. **Tests de regresión primero** — Antes de cambiar implementación, congelar
   el comportamiento actual con tests.
4. **Un cambio por PR** — PRs pequeños y enfocados son más fáciles de revisar
   y revertir.
5. **Backward compatibility** — La API pública del Domain Tracker no debe
   cambiar sin MAJOR version bump.
