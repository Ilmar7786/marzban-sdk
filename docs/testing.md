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
client. There are no integration tests against a live Marzban panel; if
you're validating against a real panel, that's manual, not part of the suite.
[`local/marzban/README.md`](../local/marzban/README.md) has a disposable
Docker panel for that.
