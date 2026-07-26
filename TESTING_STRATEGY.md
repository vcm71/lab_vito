# Testing Strategy

## Goal
Build a clean, deterministic testing foundation for the Orion domain without changing observable production behavior.

## Scope of phase 4.1
- Unit tests for domain utilities and managers
- Reusable fixtures, builders, helpers, and mocks
- Vitest-based execution locally and in CI later
- Coverage generation in text, HTML, and LCOV formats

## Principles
- Test behavior, not implementation details
- Keep tests deterministic
- Keep test data centralized
- Prefer low-coupling helpers over repeated setup code
- Do not mix product code with test infrastructure

## Directory convention
- `tests/unit/utils/` for pure utilities like `numberMeta`
- `tests/unit/managers/` for domain managers like `DelayManager` and `SpinManager`
- `tests/unit/tracker/` for tracker orchestration as the suite grows
- `tests/integration/` for cross-module behavior later
- `tests/fixtures/` for deterministic datasets
- `tests/builders/` for object factories
- `tests/helpers/` for custom assertions and shared test utilities
- `tests/mocks/` for stub implementations when a dependency must be isolated

## Current initial coverage
- `numberMeta`
- `DelayManager`
- `SpinManager`

## Commands
- `npm test` — run the suite once
- `npm run test:watch` — watch mode
- `npm run test:coverage` — generate coverage artifacts
- `npm run build` — ensure the application still bundles
- `npm run lint` — static validation for `tests/` (the project source still has pre-existing unused-symbol warnings)

## Coverage targets for future phases
- Expand from utility/managers to integration-level domain flows
- Add regression tests for persistence and compatibility adapters
- Keep coverage focused on meaningful behavior rather than line-count gaming
