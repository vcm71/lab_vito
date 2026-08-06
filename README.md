# Roulette Tracker Pro (Orion)

Sistema de registro y análisis estadístico para ruleta americana.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js ≥ 18 |
| Build | Vite |
| Tests | Vitest 3.2.7 |
| Persistencia | IndexedDB (spins, settings) + localStorage (historial) |
| UI | DOM nativo (sin frameworks) |

## Scripts

```bash
npm run dev        # Servidor de desarrollo (puerto 3000)
npm run build      # Build de producción → dist/
npm test           # Suite completa (128 tests)
npm run lint       # Linter (0 errores)
npm run coverage   # Cobertura de tests
```

## Documentación

| Documento | Propósito |
|-----------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura de capas, componentes, decisiones |
| [DOMAIN_MODEL.md](DOMAIN_MODEL.md) | Entidades, agregados, invariantes, relaciones |
| [PUBLIC_API.md](PUBLIC_API.md) | API pública documentada método por método |
| [DOMAIN_FLOW.md](DOMAIN_FLOW.md) | Diagramas ASCII de flujos clave |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Setup, scripts, build, test, CI |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Estilo, PRs, DoD, checklist |
| [QUALITY_GATES.md](QUALITY_GATES.md) | Gates obligatorios pre-merge |
| [RELEASE_PROCESS.md](RELEASE_PROCESS.md) | Versionado, tags, release, rollback |
| [ROADMAP.md](ROADMAP.md) | Roadmap técnico Etapas 5-6-7 |
| [TESTING_STRATEGY.md](TESTING_STRATEGY.md) | Estrategia de testing |
| [REGRESSION_SAFETY_GUIDE.md](REGRESSION_SAFETY_GUIDE.md) | Guía de regresión |
| [docs/adr/](docs/adr/) | Architecture Decision Records |

## Estado

- **Tests:** 128/128 pasando (5 unit + 4 integration + 1 regression)
- **Lint:** 0 errores
- **Build:** 77 módulos
- **Cobertura tracker:** >85%
- **Fase actual:** 4.4 — Engineering Documentation & Governance
