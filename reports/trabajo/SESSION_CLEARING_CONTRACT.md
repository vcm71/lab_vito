2026-08-02T15:48:41-04:00
# SESSION_CLEARING_CONTRACT

## Alcance
Contrato actual de cierre de sesión en `RouletteTracker` y consumidores directos.

## APIs
- `clearSession()`
- `recordAndClearSession()`

## `clearSession()`
Ubicación: `src/tracker/RouletteTracker.js:648-653`

Comportamiento observado:
- `clearSpins()`
- `resetSession()`
- `saveSpins()`
- `invalidateDelays()`
- no devuelve valor útil
- es síncrona en la implementación actual

Efecto funcional:
- borra la sesión activa del tracker
- limpia la colección de spins
- invalida la caché de delays
- persiste el estado de spins por la vía actual

## `recordAndClearSession()`
Ubicación: `src/tracker/RouletteTracker.js:514-531`

Comportamiento observado:
- lee spins y sesión actuales
- si hay spins, construye un sessionRecord y lo agrega al historial
- luego ejecuta `resetSession()` y `clearSpins()`
- devuelve `{ saved, spinCount }`
- persiste historial mediante `addSessionToHistory()` / `saveHistory()` dentro del flujo

## Diferencias importantes
- `clearSession()` es un reset total de la sesión actual
- `recordAndClearSession()` preserva el historial de la sesión previa cuando hay spins
- `clearSession()` invalida delays; `recordAndClearSession()` no lo hace directamente
- `clearSession()` es síncrona; `recordAndClearSession()` es asíncrona

## Consumidores
- `main.js:1493-1497` usa `recordAndClearSession()` y luego llama `saveSpins()` + `invalidateDelays()` otra vez
- `orionRenderer.js:539-563` usa `clearSession()` para el demo de sesgo

## Flujo canónico recomendado
- Para cerrar y registrar una sesión: usar `recordAndClearSession()`
- Para limpiar sin registro histórico explícito desde UX/demo: usar `clearSession()`
- No asumir que ambos métodos son equivalentes

## Riesgo residual
- La secuencia de cierre en `main.js` mezcla registro, guardado extra e invalidación extra
- Cualquier cambio futuro debe preservar el contrato observable ya cubierto por tests
