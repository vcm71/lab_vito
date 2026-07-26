# Test Architecture

## Layout

```text
tests/
  unit/
    utils/
    managers/
    tracker/
    analytics/
  integration/
  fixtures/
  builders/
  helpers/
  mocks/
```

## Why this structure
- `unit/` keeps the fast, isolated tests close to the behavior they validate
- `integration/` is reserved for cross-module flows and persistence boundaries
- `fixtures/` holds deterministic datasets shared across many suites
- `builders/` centralizes object creation and avoids repeated boilerplate
- `helpers/` contains reusable assertions and test utilities
- `mocks/` is kept separate so stubs do not bleed into production code

## Conventions
- Test files end in `.test.js`
- Fixtures are deterministic and seeded when pseudo-random sequences are needed
- Builders return valid domain-shaped objects by default
- Helpers assert observable state, not internal implementation details
- Tests should import production modules directly from `src/`

## Initial helper set
- `createSpin`
- `createSession`
- `createHistory`
- `createAnalytics`
- `createTracker`
- `expectTrackerState`
- `expectAnalytics`
- `expectDelay`
- `expectSpinHistory`
- `expectSession`

## Tooling
- Vitest for test execution
- V8 coverage provider
- HTML and LCOV coverage reporters
- Watch mode for local iteration
- ESLint for static checks on `tests/` while the legacy source tree is still being normalized

## Ready for phase 4.2
This foundation is intentionally narrow: it validates core domain primitives first and leaves room for the next integration layer without revisiting the test scaffolding.
