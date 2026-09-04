# ADR-0015: `MarzbanSDK.destroy()` is a terminal lifecycle transition

Status: Accepted
Date: 2026-09-03

## Context

`MarzbanSDK.destroy()` only closed active WebSocket log streams. Nothing
defined what happens to the rest of the SDK's owned state when the instance
stays referenced after shutdown — common in long-lived services, tests, hot
reload, and graceful process termination
([issue #84](https://github.com/Ilmar7786/marzban-sdk/issues/84)):

- A pending 403 re-authentication/reconnect in `LogsStream` could still open
  a new WebSocket connection after `destroy()` had already resolved.
- `WebhookManager` kept every subscribed listener alive after `destroy()`,
  with no operation to clear them.
- The stored access token's fate after `destroy()` was undefined.
- Whether any public operation (`authorize()`, `logs.connect*()`, webhook
  processing) should still work after `destroy()` was undefined.

`destroy()` also wasn't idempotent, and a throw from its one cleanup step
had no defined interaction with other steps once more were added.

## Decision

`destroy()` is a terminal state transition, not just a cleanup routine —
modeled on undici's `Client`, where every operation past `destroyed` rejects
with a typed error (`ClientDestroyedError`) rather than silently continuing
or reconnecting (the latter is what Prisma's `$disconnect()` does, and it's
a [documented source of surprise](https://github.com/prisma/prisma/issues/12134)).

- A single `Lifecycle` object (`core/lifecycle.ts`) is shared by
  `MarzbanSDK` and every subsystem it owns (`AuthManager`, `LogsStream`,
  `WebhookManager`) instead of each holding its own flag. `destroy()` calls
  `markDestroyed()` on it before running any cleanup step, so a pending
  operation observes the destroyed state at its next checkpoint.
- `destroy()` is idempotent: a second call returns the same promise and
  starts no new work.
- From that point, `authorize()`, `getAuthToken()`, `logs.connect*()`, and
  `webhook.parseWebhook()`/`handleWebhook()`/`dispatch()` reject with the new
  `SdkDestroyedError`. `webhook.on()`/`once()`/`off()` keep working —
  unsubscribing after shutdown must stay safe.
- `WebhookManager` gains a `close()` that clears every listener.
- `AuthManager` gains a `close()` that clears the stored access token
  reference. No claim of memory zeroization is made — JavaScript strings are
  immutable and can't be reliably scrubbed; this only drops the reference so
  a live JWT doesn't sit reachable on a "destroyed" object. Stored
  username/password are left alone: they belong to the caller's
  `ValidatedConfig`, not to `AuthManager`, and re-authentication is rejected
  by the guard above regardless.
- The three cleanup steps (WebSocket streams, webhook listeners, auth state)
  run independently — one throwing doesn't skip the others — matching the
  cleanup-resilience `destroy()` already had for its one step.
- Direct API calls (`sdk.user.*`, `sdk.node.*`, …) are deliberately **not**
  guarded at the HTTP transport. The token being cleared makes such a call
  fail with the panel's own 401, and the subsequent re-authentication attempt
  is rejected by the `AuthManager` guard above. Guarding the transport itself
  (`configureHttpClient`, `axios-retry`'s `retryCondition`, the 401 response
  interceptor) was considered and rejected for this change: it would replace
  `HttpError` with `SdkDestroyedError` for a request that was legally in
  flight when `destroy()` was called, breaking `isHttpError()` checks on
  existing consumer code, for a scenario (a stray call slightly after
  shutdown) the simpler guard already makes safe in one hop. One HTTP
  request can reach the network after `destroy()` in this scenario; an
  already-in-flight request is not cancelled either way.
- `LogsStream`'s reconnect race gets two checks, not one, because they guard
  different call paths with different desired behavior: `connect()` itself
  asserts active on entry, so a direct top-level `connectByCore()`/
  `connectByNode()` call after `destroy()` rejects with `SdkDestroyedError`.
  `LogsStreamRetryHandler.handleError()` separately checks
  `lifecycle.destroyed` right after `await authService.retryAuth()` and,
  if destroyed, returns quietly — no `emitError`, no reconnect — because the
  consumer's handlers are already disposed of and forwarding the original
  socket error there would be misleading.

## Consequences

- Calling any guarded operation after `destroy()` now throws/rejects instead
  of silently succeeding or (for WS) silently reconnecting — a behavior
  change for any consumer relying on post-destroy calls succeeding.
  `BREAKING CHANGE`, shipped as part of `sdk-v4.0.0` (bundled with the
  WS-specific reconnect rework in #88/#89/#90, which needed a major anyway).
- `packages/mcp`'s only `destroy()` call
  ([`packages/mcp/src/index.ts`](../../packages/mcp/src/index.ts)) is
  immediately followed by `process.exit(0)`, so it's unaffected.
- Full per-request cancellation (`AbortController`) and a graceful `close()`
  that waits for in-flight work before tearing down remain out of scope —
  `destroy()` stays the one abrupt terminal operation, matching undici's
  `destroy()` half of its `close()`/`destroy()` pair without yet building the
  `close()` half.
- This ADR does not cover the WS module's reconnect state machine, phase-based
  failure classification, or the per-stream `close()` handle race described
  in issue #84's follow-up comment — that is
  [issue #88](https://github.com/Ilmar7786/marzban-sdk/issues/88)'s scope,
  which reuses the `Lifecycle` object introduced here.
