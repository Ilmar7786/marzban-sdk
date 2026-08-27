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
  (`vitest.integration.config.ts` in each package, built from the shared
  `unitConfig`/`integrationConfig` helpers in the root `vitest.shared.ts`),
  separate scripts (`test:integration`), not part of `pnpm test`/`test:coverage`
  or the 100%-coverage threshold — see "Network isolation" below for why. The
  local panel's self-signed cert is trusted via each package's own
  `httpsAgent`/`MARZBAN_TLS_CA_FILE` support (`test/integration/helpers/tls.ts`
  in each package), not by disabling TLS verification process-wide. `mcp`'s
  suite stays deliberately smaller than `sdk`'s — not a re-run of `sdk`'s
  edge cases, since the mocked-SDK unit tests in `packages/mcp/src/modules/**`
  already prove each tool calls the SDK correctly; what they can't catch is
  drift between an MCP tool's zod schema and the SDK's real types.
  `smoke.integration.test.ts` covers that at the smallest scope: one
  passthrough tool, one with MCP-only logic, one destructive tool through
  the confirm-flow. `users-lifecycle.integration.test.ts` covers the full
  path GitHub issue #65's Definition of Done asked for — create → extend →
  deactivate → activate → usage → delete through the actual MCP tools, plus
  reading and dry-running a core config change. Real Marzban behavior these
  suites had to
  work around — 500s that should succeed, fields that normalize on the wire,
  etc. — is centralized in [marzban-quirks.md](./marzban-quirks.md) rather
  than commented inline everywhere it's relevant. The `core`, `system`, and
  `node-hosts` suites additionally mutate live, panel-wide state (the xray
  core config, the proxy host map) — each takes a snapshot in `beforeAll`
  and restores + deep-equal-asserts it in `afterAll`, so a failure fails
  loudly in its own file instead of silently breaking the files that run
  after it (`fileParallelism: false`). If a run is ever interrupted
  mid-mutation, `pnpm local:reset` gets the panel back to a known state.

  `sdk` module coverage:
  - [x] User
  - [x] Admin
  - [x] Core
  - [x] Node
  - [x] Subscription
  - [x] System
  - [x] UserTemplate
  - [x] Logs (WebSocket) — smoke only, see "WS module" below for the detailed
        timing coverage

## WS module

`core/ws` is the one module whose unit tests don't mock the transport with
`vi.mock` (see "Network isolation" below) — `logs-stream.test.ts` mocks
`WebSocketClient.create` itself with a synchronous fake instead, which
cannot reproduce timing bugs that only show up with a real socket (a
microtask gap between socket construction and listener attachment, an
unsolicited `close`, a shutdown racing a reconnect). `packages/sdk/src/testing/`
fixes that gap with a real `ws.Server` on loopback:

- [`mock-panel.ts`](../packages/sdk/src/testing/mock-panel.ts) — one
  `http.Server` standing in for the panel: serves `POST /api/admin/token`
  and handles the WebSocket upgrade for everything else, mirroring how the
  real panel authorizes a connection before `websocket.accept()` (see
  [marzban-quirks.md](./marzban-quirks.md)). Handshakes can be configured to
  accept, reject (with a status), delay, or hang; logins to succeed,
  fail, or stall until released — enough to drive the real-socket timing
  scenarios `logs-stream.test.ts`'s fake can't.
- [`transports.ts`](../packages/sdk/src/testing/transports.ts) — forces
  `WebSocketClient.create` onto the `ws`-package fallback for a test, so WS
  behavior can be asserted on both transports it can resolve to.
- Lives under `src/` rather than `test/`: `packages/sdk/tsconfig.json` sets
  `rootDir: "./src"`, so a unit test under `src/core/ws/` importing a helper
  from `test/` fails `tsc --noEmit` (`TS6059`) even though Vitest itself
  would run it fine. Being under `src/` means it's covered by the 100%
  threshold too — `mock-panel.test.ts`/`transports.test.ts` test the fixture
  itself. It isn't exported from `src/index.ts`, so it never reaches the
  published package (`tsup`'s only entry is `index.ts`; `files: ["dist"]`
  in `package.json` ships only the build output regardless).
- `logs-stream.server.test.ts` (next to `logs-stream.test.ts`) is where new
  WS timing/lifecycle tests belong, built on this fixture instead of a
  hand-rolled fake. `logs-stream.test.ts` itself stays — it still pins
  `LogsStream`'s branch behavior efficiently — until it's replaced outright
  once a public-API change lands (tracked alongside the reconnect rework in
  [issue #88](https://github.com/Ilmar7786/marzban-sdk/issues/88)).

Reconnect, connect-timeout, and shutdown-race scenarios are exercised on
this fixture as those behaviors are implemented — see
[issue #85](https://github.com/Ilmar7786/marzban-sdk/issues/85) for the
fixture itself and the issues it unblocks.

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
client. The WS module is the exception: `logs-stream.server.test.ts` and the
fixture's own self-tests run against a real (loopback-only) `ws.Server`
rather than a mocked transport — see "WS module" above for why a mock
couldn't do the job there. [`local/marzban/README.md`](../local/marzban/README.md)
has a disposable Docker panel for the "Integration" level above — and for ad
hoc manual poking, which is still the faster loop for one-off checks.

```sh
pnpm local:up && pnpm local:logs   # wait for it to report ready, then Ctrl+C
pnpm --filter marzban-sdk test:integration
pnpm --filter marzban-mcp test:integration
```

Not wired into `ci.yml` — see [ci.md](./ci.md) for why and where it does
run.
