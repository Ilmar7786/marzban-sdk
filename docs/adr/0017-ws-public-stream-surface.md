# ADR-0017: WS stream public surface — replay, reconnect, and header auth

Status: Accepted
Date: 2026-09-04

## Context

[ADR-0016](./0016-ws-stream-lifecycle-and-reconnect.md) built the reconnect
state machine as an internal default and explicitly deferred its public
surface to [issue #89](https://github.com/Ilmar7786/marzban-sdk/issues/89):
lifecycle callbacks, a `replay` option to deduplicate lines the panel
re-delivers after a reconnect, a public `reconnect` policy, and sending the
access token as a header instead of in the URL. Each of these turned out to
need a real decision beyond "expose what's already there":

- The panel's replay buffer has no cursor — there is nothing to dedupe
  _against_ except content itself, which risks silently swallowing a
  legitimately repeating log line (a heartbeat, `"OK"`).
- `onClose` needed a definition of "once" that survives a flapping
  connection, a caller-initiated close, and a first connect that never
  opened at all.
- A public `reconnect` option and the existing internal `tuning` test seam
  both want to set the same timing knobs, for different reasons (a real
  policy vs. compressing real windows for tests).
- The panel accepts the token via `Authorization: Bearer` as an alternative
  to the query string — but only one of the SDK's two transports can send a
  custom header at all.

## Decision

**Replay dedup operates on lines, not messages, and only inside a window
armed by a drop.** A batching `interval > 0` joins several lines into one
message on the live stream; the panel's replay buffer has no such grouping,
so a whole-message comparison would rarely match. `replay: 'dedup'`
(default) keeps a ring of the last ~200 delivered lines and drops a leading
run of already-seen lines after a reconnect; the first genuinely new line
disarms the window, so nothing is suppressed once the replay has actually
been worked through. A hard cap on lines scanned while armed forces a
disarm regardless, so a stream of identical lines can never hold the window
open forever. `replay: 'skip'` drops each replayed message outright until
the first clean one; `replay: 'all'` disables the filter.

**`onClose` fires at most once per logical stream, and only if it ever
reached `open`.** A first connect that fails is reported through the
`connect*()` rejection alone — the same "reported exactly once" invariant
ADR-0016 established for `onError`. A self-inflicted end reports
`onError` then `onClose({ byCaller: false })`; a caller-initiated `close()`
(the handle, `close()`, or `sdk.destroy()`) reports `onClose({ byCaller:
true })` with no `onError`.

**The public `reconnect` policy and the internal `tuning` seam are layered,
not merged.** `LogStream.tuning` is built as
`{ ...DEFAULT_TUNING, ...reconnectPolicyToTuning(policy), ...tuning }` —
only the policy's explicitly-set timing fields participate, and the
internal seam (used by this package's own tests to avoid waiting out real
windows) always wins. `reconnect.initial` retries a failed first connect
through the same policy-gated loop a post-open drop uses, but still only
ever rejects `connect*()` directly — never `onError`/`onClose` — since the
stream never reached `open`. `reconnect.shouldReconnect` sits beside the
reconnect budget rather than inside it: a hard-capped budget check happens
independently of what `shouldReconnect` returns, and the documented escape
hatch for "never give up" is `maxElapsedMs: Infinity`, not a callback that
can outlast the budget.

**The token moves to an `Authorization` header only on the `ws`-package
transport.** The panel accepts `query_params.get("token") or
headers.get("Authorization").removeprefix("Bearer ")` (verified against
`gozargah/marzban:v0.8.4`), but the native `WebSocket` constructor
(browsers, Deno, Bun, Node.js 21+) has no headers option at all — a
platform limit, not a gap in this SDK. `core/ws/client/select-transport.ts`
extracts the transport decision `WebSocketClient.resolve()` already made
into a standalone, pure function, so `LogStream.attemptOnce()` can ask it
_before_ building the URL — deciding the transport first, then whether the
token goes in the query or the header, rather than building a URL that
might not match what `resolve()` picks. Subprotocol smuggling (the
Kubernetes `base64url.bearer.authorization.k8s.io.<token>` pattern) was
considered and rejected: the panel only ever reads the query parameter or
the `Authorization` header, so a third encoding would add complexity this
API surface has no use for.

## Consequences

- **Breaking** (`sdk-v4.0.0`, same release as ADR-0016): `LogOptions.onError`
  receives a `WsError` instead of a raw transport event; `connect*()`
  resolves to a callable stream handle (`{ (): void; close(): void; readonly
state }`) instead of a bare close function — source-compatible, since the
  handle is still callable; `replay: 'dedup'` is on by default, so a
  consumer that relied on seeing every replayed line (unlikely, but
  possible) now has to opt into `replay: 'all'`.
- `LogStreamState`, `WsCloseInfo`, `WsReconnectInfo`, `ReplayMode`,
  `ReconnectOption`/`ReconnectOptions`/`ShouldReconnectContext` are now
  public API. `LogStream`, `LogStreamTuning`, and everything under
  `core/ws/utils/` except `configurationUrlWs` stay internal — the branchy
  parts of replay/reconnect resolution live there specifically so they can
  be tested as pure functions instead of through the state machine.
- On the native transport, the token still travels in the URL query string
  — this ADR does not (and cannot) change that; `WsError.url`'s redaction
  guarantee is unaffected either way, but on the `ws`-package transport it
  becomes a no-op-by-absence rather than an active redaction, which is why
  the test suite asserts "not the real token" on both transports rather
  than "redacted" specifically.
- `config.reconnect` (SDK-wide default) and `LogOptions.reconnect`
  (per-call) don't merge field-by-field — a per-call value fully replaces
  the SDK-wide one, the same model `interval` and `replay` already use.
