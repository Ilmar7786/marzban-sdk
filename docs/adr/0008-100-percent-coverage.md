# ADR-0008: 100% coverage on hand-written code

Status: Accepted
Date: 2026-06

## Context

Ahead of the `v3.0.0` cross-runtime rework, the SDK's hand-written
infrastructure (auth, HTTP, errors, config, logger, webhook, WS) needed a
stable safety net before behavior changed underneath it. Partial coverage
made it unclear which paths were actually exercised by tests versus merely
assumed to work.

## Decision

Enforce 100% statement/branch/function/line coverage via Vitest's
`v8` provider on hand-written code in `packages/sdk` and (once it existed)
`packages/mcp`. Exclude generated code (`src/gen/**` in `sdk`) and type-only
files (`**/types.ts`, `**/*.types.ts`, `**/index.ts`) from the requirement —
testing generated code would test the generator, not this project, and
type-only files have no runtime behavior to cover.

## Consequences

- Every PR touching hand-written code must ship tests; `test:coverage`
  failing locally means CI will fail too.
- Defensive branches that are structurally unreachable in tests are marked
  `/* istanbul ignore next */` explicitly, rather than silently lowering the
  threshold.
- `packages/cli` has no coverage requirement yet because it has no test
  script — this ADR's threshold applies once one exists.
