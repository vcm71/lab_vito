# Quality Gates — Roulette Tracker Pro

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

Gates obligatorios que todo cambio debe superar antes de integrarse a `main`.

---

## Gate 1: Build (Compilación)

```bash
npm run build
```

- **Resultado esperado:** Exit 0, sin errores.
- **Módulos esperados:** 77 (configuración actual).
- **Output en:** `dist/`.

---

## Gate 2: Tests (Suite completa)

```bash
npm test
```

- **Resultado esperado:** 128/128 tests pasando (todos).
- **Archivos de test:** 9 (5 unit + 4 integration + 1 regression).
- **Dominio cubierto:** Contratos públicos, invariantes, regresión, aislamiento.

---

## Gate 3: Tests de regresión

```bash
npx vitest run tests/regression/
```

- **Resultado esperado:** 81 tests pasando (10 bloques).
- **Cobertura de regresión:** Contratos, invariantes, characterization,
  roundtrip, regresión, límite, bugs, mutabilidad, aislamiento, estabilidad.

---

## Gate 4: Lint

```bash
npm run lint
```

- **Resultado esperado:** 0 errores.
- **Ámbito:** `tests/` (el código legacy en `src/` no se evalúa aún).

---

## Gate 5: Cobertura (cuando aplica)

```bash
npm run coverage
```

- **Objetivo:** >85% en módulos del dominio (`src/tracker/`).
- **Mínimo:** >0% de disminución respecto al commit anterior.

---

## Gate 6: Validación manual

Antes de merge:

- [ ] El cambio no rompe funcionalidad existente.
- [ ] No hay archivos temporales ni de debug.
- [ ] Los mensajes de commit siguen Conventional Commits.
- [ ] La documentación relevante está actualizada.
- [ ] No hay secretos ni credenciales en el diff.

---

## Resumen ejecutable

```bash
# Gate pre-commit completo
npm run lint && npm test && npm run build && echo "✅ ALL GATES PASSED"
```
