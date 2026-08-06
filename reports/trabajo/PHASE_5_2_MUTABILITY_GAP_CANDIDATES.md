2026-08-02T16:26:53-04:00
# PHASE_5_2_MUTABILITY_GAP_CANDIDATES

## Gaps reales priorizados

### 1. Documentar referencias vivas de getters públicos
- Prioridad: alta
- Motivo: hoy el contrato existe, pero está distribuido entre implementación y pruebas.
- Subfase sugerida: escritura de contrato y advertencias de mutabilidad.

### 2. Aislar el acceso de lectura en consumidores nuevos
- Prioridad: media
- Motivo: nuevos consumidores podrían asumir snapshots y mutar inadvertidamente.
- Subfase sugerida: helpers de solo lectura para lectura segura.

### 3. Revisar `getSeries()` como alias de `customSeries`
- Prioridad: media
- Motivo: colección anidada con riesgo de mutación accidental.
- Subfase sugerida: decidir si se mantiene vivo o se expone un clon superficial.

### 4. Evaluar cobertura explícita de mutación accidental
- Prioridad: baja
- Motivo: las pruebas actuales cubren contratos, pero no todas las mutaciones externas.
- Subfase sugerida: añadir tests de protección o de contrato vivo según decisión funcional.

## No-gaps
- No se detectó una mutación insegura reproducible que obligue a refactorizar ahora.
- No se propone convertir globalmente el dominio a inmutabilidad.
- No se propone modificar EventBus ni el flujo de cierre de sesión.

## Recomendación
- Cerrar la fase como auditoría con condiciones, y reservar la corrección estructural para una subfase futura solo si aparece un consumidor real que rompa el contrato.
