# Proceso de Release — Roulette Tracker Pro

> **Versión:** 1.0.0  
> **Última actualización:** 2026-07-26

---

## 1. Versionado

Usamos [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH (ej. 1.3.2)
```

| Componente | Cuándo incrementar                          | Ejemplo |
|------------|----------------------------------------------|---------|
| MAJOR      | Cambio incompatible en API pública           | `addSpin` cambia firma |
| MINOR      | Nueva funcionalidad compatible hacia atrás   | Nueva API `getSeries` |
| PATCH      | Bug fix, refactor interno, documentación     | Corrección de chi-cuadrado |

---

## 2. Flujo de release

### Paso 1: Preparación

1. Asegurar que `main` está actualizado:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Verificar todos los gates:
   ```bash
   npm run lint && npm test && npm run build
   ```

3. Ejecutar suite completa de regresión:
   ```bash
   npx vitest run
   ```

### Paso 2: Version bump

Actualizar versión en `package.json`:

```bash
# Para PATCH
npm version patch

# Para MINOR
npm version minor

# Para MAJOR
npm version major
```

### Paso 3: Build de release

```bash
npm run build
# Verificar output en dist/
```

### Paso 4: Tag

```bash
git tag -a v1.3.2 -m "Release v1.3.2: ..."
git push origin v1.3.2
```

### Paso 5: Git tag + push

```bash
git push origin main --tags
```

---

## 3. Release notes

Cada release debe incluir:

```
## v1.3.2 (2026-07-26)

### Added
- Nueva API getSeries() para consultar series personalizadas

### Fixed
- Cálculo de chi-cuadrado corregido para muestras pequeñas

### Changed
- [breaking] addSpin ahora retorna null para números inválidos

### Tests
- Tests de regresión para invariantes de spin IDs
```

---

## 4. Estrategia de rollback

Si un release presenta problemas:

1. **Revertir el commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **O restaurar un tag anterior:**
   ```bash
   git checkout v1.3.1
   npm run build
   # Copiar dist/ manualmente si es necesario
   ```

3. **Si el build está roto:**
   ```bash
   git stash
   git checkout v1.3.1
   npm install
   npm run build
   ```

---

## 5. Hotfixes

Para fixes críticos:

```bash
git checkout main
git checkout -b hotfix/descripcion
# aplicar fix
npm test && npm run build
git commit -m "fix: descripción del hotfix"
git checkout main
git merge hotfix/descripcion
npm version patch
git push origin main --tags
```
