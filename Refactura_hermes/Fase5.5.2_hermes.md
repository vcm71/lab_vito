# ORION REFACTOR
# ETAPA 2
# FASE 5.5.2
# MIGRACIÓN DE ÚLTIMOS CONSUMIDORES LEGACY

## Contexto

La Fase 5.5.1 realizó la auditoría final de dependencias Legacy.

Resultado:

La arquitectura de dominio está consolidada, pero existen consumidores activos que todavía dependen del Legacy Tracker.

Dependencias encontradas:

### ACTIVAS

1. Bootstrap.js:43
   - Instancia principal del Legacy RouletteTracker.
   - Actualmente es el punto de composición principal del sistema.

2. monteCarloValidator.js:115
   - Crea una instancia Legacy propia.
   - Flujo aislado de simulación.

3. tomadorRenderer.js
   - Utiliza métodos estáticos que actualmente sólo existen en Legacy.

### MUERTAS

4. WinWinEngine.js:7
   - Import Legacy RouletteTracker no utilizado.
   - Sólo utiliza constantes.

### MENORES

5. Imports de constantes:
   - AMERICAN_WHEEL_ORDER
   - RED_NUMBERS
   - ROULETTE_NUMBERS

---

# Objetivo

Eliminar las dependencias activas hacia Legacy Tracker antes de su eliminación definitiva.

Al finalizar esta fase:

- Bootstrap debe crear Domain Tracker.
- MonteCarloValidator debe trabajar con Domain Tracker.
- tomadorRenderer debe consumir APIs compatibles con Domain.
- Legacy debe quedar únicamente como capa temporal de compatibilidad.

---

# Principio arquitectónico

El sistema debe iniciar desde el dominio.

Objetivo:

ANTES:
