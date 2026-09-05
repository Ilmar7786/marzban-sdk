# Testing

**Covers:** test levels, coverage enforcement, what's mocked and what isn't.
**Excludes:** CI wiring (see [ci.md](./ci.md)).
**Next:** [ci.md](./ci.md).

## Runner

[Vitest 4](https://vitest.dev), `environment: 'node'`, `globals: true`. Tests
live next to the code they cover as `*.test.ts` — there's no separate
`tests/` directory. `packages/sdk/vitest.config.ts` and
`packages/mcp/vitest.config.ts` are the two configs that carry the real
suite; `packages/cli` has no `test` script yet (see
[`packages/cli/ARCHITECTURE.md`](../packages/cli/ARCHITECTURE.md)).

`apps/docs` has a third, deliberately narrow config
(`apps/docs/vitest.config.mts` — `.mts` because the app has no
`"type": "module"`). It covers exactly one module: `src/lib/changelog.ts`,
the parser that renders the site's Changelog page from the git-cliff
`CHANGELOG.md` files. That parser depends on the shape of `cliff.toml`'s
output, and nothing else in the build would notice if the two drifted — the
page would just render empty. Pages and components are left to
`types:check` and the production build, so there's no `test:coverage` script
for the docs app and the 100% threshold below doesn't apply to it.

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
  drift between an MCP tool's zod schema and the SDK's real types — including
  drift a mocked `.safeParse()` can't see at all, like an `outputSchema`
  claiming a JSON Schema `format` a real response value doesn't hold to (see
  ADR-0018 and the `output-schema-regression.test.ts` unit test for the rest
  of that guard). `smoke.integration.test.ts` covers that at the smallest
  scope: one passthrough tool, one with MCP-only logic, one destructive tool
  through the confirm-flow, one output validated against a real ajv instance
  the way a strict MCP client validates `structuredContent`.
  `users-lifecycle.integration.test.ts` covers the full
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

`core/ws` is the one module whose tests don't mock the transport with
`vi.mock` (see "Network isolation" below): `packages/sdk/src/testing/` runs a
real `ws.Server` on loopback, because the bugs worth catching here are
timing bugs — an unsolicited `close`, a shutdown racing a reconnect — that a
synchronous fake cannot reproduce.

`BaseWebSocketClient` itself used to have a microtask gap between socket
construction and listener attachment — `createWebSocket()` was `async`, so
`init()` only attached `on()` handlers after at least one `await`, and a
connection that failed inside that window dispatched `error`/`close` to
nobody ([issue #86](https://github.com/Ilmar7786/marzban-sdk/issues/86)).
Fixed by making `createWebSocket()` synchronous and buffering `on()`/`close()`
calls made before `init()`, so listeners attach in the same tick the socket
is constructed. `logs-stream.server.test.ts` (below) pins the regression —
it needs a real socket, since a synchronous fake can't reproduce a race that
only exists because of real event-loop timing.

- [`mock-panel.ts`](../packages/sdk/src/testing/mock-panel.ts) — one
  `http.Server` standing in for the panel: serves `POST /api/admin/token`
  and handles the WebSocket upgrade for everything else, mirroring how the
  real panel authorizes a connection before `websocket.accept()` (see
  [marzban-quirks.md](./marzban-quirks.md)). Handshakes can be configured to
  accept, reject (with a status), delay, or hang; logins to succeed,
  fail, or stall until released — enough to drive every reconnect,
  connect-timeout, and shutdown-race scenario in the suite.
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
- `logs-stream.server.test.ts` is where WS timing/lifecycle tests belong,
  on both transports (`describe.each(WS_TRANSPORTS)`): reconnect after a
  drop, retry while the panel is unavailable, backoff spacing, budget
  exhaustion, connect timeout, and every shutdown overlap — `destroy()` or
  `close()` or `closeAllConnections()` landing mid-reconnect — asserting no
  orphaned socket survives. It also carries #86's regression scenarios (a
  rejected handshake, a panel that goes unreachable after login).

The synchronous-fake `logs-stream.test.ts` that used to sit beside it is
gone: [issue #88](https://github.com/Ilmar7786/marzban-sdk/issues/88)
changed the public contract it pinned, and its branch coverage moved to the
two files above.

### Where WS behavior is tested, and why there

`logs-stream.ts` is only a registry: validate `interval`, create a
`LogStream`, track it, close them all on shutdown. The reconnect state
machine is
[`log-stream.ts`](../packages/sdk/src/core/ws/log-stream.ts) — one object per
logical stream, across however many sockets it takes (see
[ADR-0016](./adr/0016-ws-stream-lifecycle-and-reconnect.md)).

That split is what makes it testable at two levels:

- [`log-stream.test.ts`](../packages/sdk/src/core/ws/log-stream.test.ts) —
  a fake socket plus injected `now`/`sleep`, for the checkpoints that only
  matter when something lands _between_ two awaits: a shutdown mid-handshake,
  a socket that opens after its stream was closed, a stability timer
  belonging to a superseded connection.
- `logs-stream.server.test.ts` — the same policy end to end on real sockets.

Timing is driven through `LogStreamTuning` (an internal `tuning` seam on
`LogsStream`), not fake timers: the suite runs a real `ws.Server`, and faking
timers would freeze its I/O along with the backoff under test. The seam is
also what keeps the suite fast — the real defaults are a 10-second connect
timeout and a 10-minute reconnect budget.

Small pure pieces live in `core/ws/utils/` next to `configuration-url-ws.ts`
— `log-interval.ts` (validates `interval` against the panel's `0`–`10` range,
throwing `WsOptionsError`), `close-quietly.ts` (closes a socket, collecting
rather than propagating a throw from `close()` itself), `ws-error.ts`
(reads the handshake's HTTP status out of the error message, when the
transport reported one), `replay.ts` (the `replay: 'dedup'/'skip'` line
filter — every mode × armed/not-armed/hard-cap branch lives in
`replay.test.ts` rather than in the state machine), and
`reconnect-policy.ts`/`reconnect-decision.ts` (validating and resolving the
public `reconnect` option, and the `shouldReconnect`/budget verdict —
likewise fully covered as pure functions rather than through `LogStream`).
`core/ws/client/select-transport.ts` is the same idea one level up: which
transport `WebSocketClient.resolve()` picks, extracted so `LogStream` can
ask the identical question before building a URL or headers for it. None
are re-exported from `utils/index.ts`/`client/index.ts` — only
`configurationUrlWs` is; everything else is imported by its own file path so
it stays out of the package's public API.

The two transports genuinely differ, which is why `WS_TRANSPORTS` covers
both rather than picking one: on a rejected handshake the `ws` package
reports `Unexpected server response: 403`, while the native `WebSocket`
reports an empty message and close code `1006` — the same thing it reports
for a refused connection (verified on Node 24). The classifier is anchored to
that exact phrase, and `ws-error.test.ts` pins the trap it avoids: a
connection-refused message carries a port number, and a looser pattern would
read it as a status. See [marzban-quirks.md](./marzban-quirks.md).

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
