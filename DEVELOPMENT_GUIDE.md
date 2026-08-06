# Guía de Desarrollo — Roulette Tracker Pro

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

---

## 1. Requisitos

- Node.js ≥ 18
- npm ≥ 9

---

## 2. Setup

```bash
git clone <repo>
cd lab_vito
npm install
```

---

## 3. Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite, puerto 3000) |
| `npm run build` | Build de producción → `dist/` |
| `npm test` | Ejecuta toda la suite de tests (Vitest) |
| `npm run lint` | Ejecuta linter (configuración en `package.json`) |
| `npm run coverage` | Ejecuta tests con reporte de cobertura |

### Ejecutar tests específicos

```bash
# Solo tests unitarios del dominio
npx vitest run tests/unit/

# Solo tests de integración
npx vitest run tests/integration/

# Solo tests de regresión
npx vitest run tests/regression/

# Archivo específico
npx vitest run tests/unit/tracker.test.js

# Modo watch (desarrollo)
npx vitest
```

---

## 4. Estructura del proyecto

```
src/               → Código fuente
  tracker/         → Domain Tracker (núcleo del negocio)
  analytics/       → Motor de análisis estadístico
  engines/         → Motores de estrategia (WinWin, DA, Orion, etc.)
  core/            → Infraestructura (Bootstrap, Kernel, DI, EventBus)
  utils/           → Utilidades (numberMeta)
tests/             → Tests
  unit/            → Tests unitarios del dominio
  integration/     → Tests de integración
  regression/      → Tests de regresión
reports/           → Reportes de implementación por fase
docs/              → Documentación técnica
  adr/             → Architecture Decision Records
```

---

## 5. Convenciones

### Nomenclatura

- **Clases:** PascalCase (`RouletteTracker`, `SpinManager`).
- **Métodos y funciones:** camelCase (`addSpin`, `getSettings`).
- **Archivos:** PascalCase para clases (`RouletteTracker.js`), camelCase para
  utilidades y helpers (`numberMeta.js`).
- **Tests:** `<nombre>.test.js`.

### Estilo de código

- ES2022+ con imports/exports nativos (CommonJS no usado).
- JSDoc completo en clases y métodos públicos.
- `const` > `let` (nunca `var`).
- Arrow functions preferidas para callbacks.
- `async/await` para operaciones asíncronas (`.then()` no usado).

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tracker): add deleteSpin method
fix(analytics): correct chi-square calculation for edge case
test(integration): add session lifecycle test
docs: add ADR-005 for ServiceContainer
chore(deps): update vitest to 3.2.7
```

### Tests

Ver [TESTING_STRATEGY.md](TESTING_STRATEGY.md) para la estrategia completa.

Reglas:
- Todo método público debe tener al menos un test.
- Tests de regresión para contratos públicos, invariantes y límites.
- Usar `vi.mock()` para dependencias externas (IndexedDB, localStorage).
- No usar `vi.fn()` dentro de factories de `vi.mock()` (no funciona con hoisting).
- Preferir `describe.each` para tests parametrizados.

---

## 6. Linting

El linting está configurado en `package.json` y se ejecuta con:
```bash
npm run lint
```

**Nota:** El lint está restringido a `tests/`. El código legacy en `src/` no
se evalúa (fase de migración en curso).

---

## 7. Build

```bash
npm run build
```

Produce 77 módulos empaquetados en `dist/`. Verificar que no haya errores
antes de commit.

---

## 8. Coverage

```bash
npm run coverage
```

Objetivo: >85% en módulos del dominio (`src/tracker/`).

---

## 9. Debugging

### Node.js
```bash
node --inspect node_modules/.bin/vitest run tests/unit/tracker.test.js
```

### Chrome DevTools
1. Abrir `chrome://inspect`
2. Conectar al target de Node.js
3. Usar DevTools completo para debugging

---

## 10. Solución de problemas comunes

### Tests fallan con `vi.mock` issues
Asegurar que las factories de `vi.mock` usan funciones planas (`() => ({})`)
y NUNCA `vi.fn()` dentro del mock hoisteado.

### Build falla con módulos faltantes
```bash
rm -rf node_modules && npm install
```

### Tests de integración fallan
Los tests de integración requieren un entorno de navegador (jsdom).
Verificar que `vite.config.js` no esté usando `environment: 'node'`.

### Cache de Vitest stale
```bash
npx vitest clear
```
