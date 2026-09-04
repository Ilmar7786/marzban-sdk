# ADR-0016: WebSocket stream lifecycle and reconnect policy

Status: Accepted
Date: 2026-09-03

## Context

`LogsStream` modeled a WebSocket as a request that either succeeds or fails,
not as a long-lived connection that will be interrupted
([issue #88](https://github.com/Ilmar7786/marzban-sdk/issues/88)):

- A dropped connection was never re-established. The `close` handler only
  untracked the socket, so a panel restart mid-stream left the stream
  silently dead — no messages, no `onError`.
- The one retry policy that existed (re-authenticate on `403`) matched the
  substring `'403'` in the error event's message. Only the `ws` package puts
  a status there; the native `WebSocket` (browsers, Deno, Bun, Node 21+)
  reports an empty message, so on the default transport the branch never ran.
- Shutdown could race a reconnect. `closeAllConnections()` closed the sockets
  it could see while a re-auth already in flight went on to open one it
  couldn't, and the per-stream close handle had the same problem: it closed
  the socket it captured, while the replacement stayed open and kept
  delivering to a disposed handler.
- Every `403` was treated as an expired token, including the cases where
  re-authentication structurally cannot help (a non-sudo admin), burning the
  retry budget on an error a fresh token never fixes.
- Nothing bounded the handshake, so a socket could sit in `CONNECTING`
  indefinitely — a black hole on SYN, or a proxy that accepts TCP and never
  upgrades.

A constraint inherited from [ADR-0006](./0006-cross-runtime-web-crypto.md)
shapes the whole design and was not recorded there: preferring the native
`WebSocket` means the handshake's HTTP status is structurally unavailable on
most runtimes. Browsers are forbidden from exposing it, and undici follows
suit. Verified on Node 24 — a rejected handshake and a refused connection are
indistinguishable on the native transport: empty `error` message, close code
`1006` for both.

## Decision

Each `connect*()` call owns a `LogStream` (`core/ws/log-stream.ts`): one
object per logical stream, for its whole life, across however many sockets
that takes. `LogsStream` keeps only the registry of live streams.

**States.** `connecting → open → reconnecting → closed`. `closed` is terminal
and reachable from anywhere.

**One staleness invariant, checked everywhere.** After every `await` and at
the top of every socket event handler, the stream asks whether its work is
still wanted: the SDK was destroyed, this stream was closed, or a newer
socket superseded its generation counter. This — not caller discipline — is
what closes both shutdown races. `closeAllConnections()` closes each tracked
stream rather than the sockets it can see, so a reconnect in flight aborts at
its next checkpoint instead of racing to completion, and the SDK does not
have to be destroyed for that to work.

**Failure is classified by connection phase, not by error text.**

| Did this attempt reach `open`?                          | Outcome                                                                                                                                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No — handshake failed (rejected, refused, or timed out) | Re-authenticate once and retry. The panel collapses an expired token into the same generic rejection as everything else (see [marzban-quirks.md](../marzban-quirks.md)), so one retry with a fresh token is the only way to tell them apart. |
| No, twice in a row                                      | Terminal. The first connect rejects `connect*()` with a `WsError`; a later one reports through `onError`.                                                                                                                                    |
| Yes, then dropped                                       | A transport drop: reconnect with exponential backoff + jitter, bounded by a time budget.                                                                                                                                                     |

**Reconnect is bounded by time, not by attempts.** A `docker restart`-scale
outage (~10s) must never be lost to a low attempt-count default, while an
unbounded default would silently mask a permanent failure. The budget
(`WS_RECONNECT_BUDGET_MS`, 10 minutes) starts at the first drop and is
cleared only after a reconnected stream has been stable for
`WS_STABLE_AFTER_MS` (30s) — a flapping stream keeps the original deadline
and its growing backoff, so it still gives up.

**Terminating early requires positive evidence.** Reconnecting stops before
the budget runs out only when the transport actually reported an HTTP status
_and_ the panel refused a handshake carrying a token we had just refreshed.
That combination is evidence retrying cannot help — a revoked or non-sudo
admin — and continuing would spend the whole budget on logins that can't
succeed. Anything ambiguous (a refused connection, a timeout, or any failure
on the native transport, which never reports a status) keeps retrying, so a
restarting panel is never mistaken for a rejection. The practical
consequence is deliberate and asymmetric: the `ws`-package transport gives up
in that one case, the native transport retries until the budget expires.

**The handshake is bounded** by `WS_CONNECT_TIMEOUT_MS` (10s), after which
the socket is closed and the attempt counts as a handshake failure.

**`connect*()` resolves only once the socket is genuinely open**, so a
misconfigured `baseUrl` or a panel that is down fails loudly instead of
handing back a close handle to a dead stream. A failure is reported exactly
once: through the promise before the stream ever opens, through `onError`
afterwards — never both.

`WsError` (`WS_HANDSHAKE_REJECTED`, `WS_AUTH_FAILED`, `WS_CONNECTION_LOST`,
`WS_RETRIES_EXHAUSTED`) carries the phase, attempt, close code, any reported
status, and a URL with its token redacted. It is public API.

## Consequences

- **Breaking** (`sdk-v4.0.0`, bundled with
  [#84](https://github.com/Ilmar7786/marzban-sdk/issues/84)'s remaining
  scope): a failed first `connect*()` rejects instead of resolving; it also
  resolves later than before, since it now waits for `open`. `onError` is no
  longer called for a failure the promise already reports.
  `LogsStreamOptions.maxRetries` is gone — WS reconnects no longer read
  `config.retries`, which stays an HTTP-only knob.
- Reconnects re-deliver log lines. The panel seeds every new connection from
  a shared buffer of the last 100 lines (see
  [marzban-quirks.md](../marzban-quirks.md)), so more reconnects means more
  duplicates. Deduplication is
  [issue #89](https://github.com/Ilmar7786/marzban-sdk/issues/89)'s
  `replay: 'dedup'`; this ADR's policy is why that default matters, and why
  #88 must not ship to consumers without it.
- The reconnect policy is not configurable yet. Timing is injectable
  internally (a `tuning` seam, used by the tests to avoid waiting out real
  10-second and 10-minute windows), but the public `reconnect` option and its
  escape hatches land with #89, so the public surface changes once rather
  than twice.
- Timing is tested through that seam rather than with fake timers: the WS
  suite runs against a real `ws.Server`, and faking timers would freeze its
  I/O along with the backoff under test.
- The stream still hands back a bare close function. Turning it into a
  stream handle with `close()` and a readable `state` is part of #89's public
  surface.
- This ADR does not revisit [ADR-0015](./0015-sdk-destroy-terminal-lifecycle.md)'s
  contract; it implements the WS half of it, reusing the same `Lifecycle`
  object as the outermost of the two shutdown signals a stream checks.
