# Guía de Contribución — Roulette Tracker Pro

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

---

## 1. Flujo de trabajo

1. **Fork/clone** el repositorio.
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feat/mi-cambio
   ```
3. **Implementa** con commits convencionales.
4. **Verifica** que tests y lint pasen.
5. **Abre un Pull Request** contra `main`.

---

## 2. Estilo de código

### JavaScript

- ES2022+ modules (import/export).
- JSDoc en toda función/ método público.
- `const` por defecto, `let` solo cuando hay reasignación.
- Arrow functions para callbacks.
- Nombres descriptivos: `getSpins()`, `addSpin(number)` (no `getData()`, `add()`).

### Tests

- Tests en archivos `*.test.js`.
- Usar `describe` → `describe` → `it` para estructura jerárquica.
- Nombres descriptivos de tests:
  ```javascript
  it('debería retornar null para número inválido', () => {
  ```

### Documentación

- `README.md`: Visión general, cómo empezar.
- `ARCHITECTURE.md`: Estructura de capas, decisiones.
- Docs técnicos en directorio raíz para máxima visibilidad.
- ADRs en `docs/adr/` para decisiones arquitectónicas.
- Comentarios JSDoc en el código: propósito, parámetros, retorno.

---

## 3. Definition of Done (DoD)

Un cambio se considera completo cuando:

- [ ] El código compila (`npm run build` pasa).
- [ ] Todos los tests pasan (`npm test` pasa).
- [ ] Linter no reporta errores (`npm run lint` pasa).
- [ ] Los tests nuevos siguen la jerarquía de `describe()`.
- [ ] Se usó `vi.mock()` correctamente (sin `vi.fn()` en factories).
- [ ] Cobertura no disminuye (cuando aplica).
- [ ] El commit sigue Conventional Commits.
- [ ] No hay regresiones en los tests existentes.

---

## 4. Pull Request checklist

### Antes de abrir PR

- [ ] `npm test` — toda la suite pasa.
- [ ] `npm run lint` — 0 errores.
- [ ] `npm run build` — build exitoso.
- [ ] Tests nuevos incluidos (si aplica).
- [ ] Documentación actualizada (si aplica).

### Contenido del PR

- Título descriptivo siguiendo Conventional Commits.
- Descripción clara del cambio y motivación.
- Referencia a issues relacionados (si los hay).
- Screenshots para cambios visuales (si aplica).

### Proceso de revisión

1. Al menos un reviewer debe aprobar.
2. Todos los checks de CI deben pasar.
3. El PR debe estar actualizado con `main` (sin conflictos).
4. Merge con squash para mantener historial limpio.

---

## 5. Branches

| Prefijo      | Propósito                          | Merge a |
|--------------|------------------------------------|---------|
| `feat/*`     | Nueva funcionalidad                | `main`  |
| `fix/*`      | Corrección de bug                  | `main`  |
| `test/*`     | Tests (nuevos o mejoras)           | `main`  |
| `docs/*`     | Documentación                      | `main`  |
| `refactor/*` | Refactor sin cambio funcional      | `main`  |
| `chore/*`    | Tareas de mantenimiento            | `main`  |
| `release/*`  | Preparación de release             | `main`  |

---

## 6. Versionado

Usamos [Semantic Versioning](https://semver.org/):

- **MAJOR:** Cambios incompatibles en API pública.
- **MINOR:** Nuevas funcionalidades compatibles hacia atrás.
- **PATCH:** Bug fixes y cambios menores.

---

## 7. Reportar bugs

Abrir un issue con:

1. Descripción concisa del problema.
2. Pasos para reproducir.
3. Comportamiento esperado vs. actual.
4. Versión del proyecto (commit o tag).
5. Output de `npm test` y `npm run build`.
