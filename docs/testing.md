# Testing

**Covers:** test levels, coverage enforcement, what's mocked and what isn't.
**Excludes:** CI wiring (see [ci.md](./ci.md)).
**Next:** [ci.md](./ci.md).

## Runner

[Vitest 4](https://vitest.dev), `environment: 'node'`, `globals: true`. Tests
live next to the code they cover as `*.test.ts` — there's no separate
`tests/` directory. `packages/sdk/vitest.config.ts` and
`packages/mcp/vitest.config.ts` are the two active configs;
`packages/cli` has no `test` script yet (see
[`packages/cli/ARCHITECTURE.md`](../packages/cli/ARCHITECTURE.md)).

```sh
pnpm test                                    # every package, once
pnpm --filter marzban-sdk test:watch
pnpm --filter marzban-sdk test:coverage
```

## Levels

- **Unit** — the bulk of the suite: individual functions/classes in
  isolation (`common/`, `helpers/`, `config/`, error classes, logger).
- **Facade integration** — `packages/sdk/src/core/MarzbanSDK.test.ts` and
  `packages/mcp/src/server.test.ts` construct the real top-level object with
  its dependencies mocked, and assert the wiring is correct. No network.
- **Generator regression** — `packages/sdk/src/gen-regression.test.ts` is the
  one test that touches `src/gen`. It pins a specific generator failure mode
  (open-ended OpenAPI objects silently losing keys on parse) so a future
  `codegen` run against an imprecise spec fails the suite instead of shipping
  a bug. See [`packages/sdk/ARCHITECTURE.md`](../packages/sdk/ARCHITECTURE.md).
- **Integration** — `packages/sdk/test/integration/**/*.integration.test.ts`
  and `packages/mcp/test/integration/**/*.integration.test.ts` run against a
  real Marzban panel (no mocked transport). Separate configs
  (`vitest.integration.config.ts` in each package), separate scripts
  (`test:integration`), not part of `pnpm test`/`test:coverage` or the
  100%-coverage threshold — see "Network isolation" below for why. `mcp`'s
  suite is deliberately thin: 3 smoke tests against real tools (a
  passthrough, one with its own logic, one destructive with the
  confirm-flow), not a re-run of `sdk`'s edge cases — the mocked-SDK unit
  tests in `packages/mcp/src/modules/**` already prove each tool calls the
  SDK correctly; what they can't catch is drift between an MCP tool's zod
  schema and the SDK's real types. Real Marzban behavior these suites had to
  work around — 500s that should succeed, fields that normalize on the wire,
  etc. — is centralized in [marzban-quirks.md](./marzban-quirks.md) rather
  than commented inline everywhere it's relevant. The `core` and `system`
  suites additionally mutate live, panel-wide state (the xray core config,
  the proxy host map) — each takes a snapshot in `beforeAll` and restores +
  deep-equal-asserts it in `afterAll`, so a failure fails loudly in its own
  file instead of silently breaking the files that run after it
  (`fileParallelism: false`). If a run is ever interrupted mid-mutation,
  `pnpm local:reset` gets the panel back to a known state.

  `sdk` module coverage:
  - [x] User
  - [x] Admin
  - [x] Core
  - [ ] Node
  - [ ] Subscription
  - [x] System
  - [ ] UserTemplate

## Coverage

`packages/sdk` and `packages/mcp` both enforce **100%** statements,
branches, functions, and lines (`@vitest/coverage-v8`, thresholds in each
`vitest.config.ts`). Excluded from coverage in both: `**/index.ts`,
`**/types.ts`, `**/*.types.ts`. `packages/sdk` additionally excludes
`src/gen/**` — testing generated code would test the generator, not this
project's code.

A PR that drops coverage below 100% on either package fails
`test:coverage` locally and `test` in CI.

## Network isolation

There's no HTTP mock library (no msw, no nock) in this repo. The transport
itself is mocked — `vi.mock('axios')` / `vi.mock('axios-retry')` — so tests
exercise real request-building and error-handling logic against a fake
client. [`local/marzban/README.md`](../local/marzban/README.md) has a disposable
Docker panel for the "Integration" level above — and for ad hoc manual
poking, which is still the faster loop for one-off checks.

```sh
pnpm local:up && pnpm local:logs   # wait for it to report ready, then Ctrl+C
pnpm --filter marzban-sdk test:integration
pnpm --filter marzban-mcp test:integration
```

Not wired into `ci.yml` — see [ci.md](./ci.md) for why and where it does
run.
