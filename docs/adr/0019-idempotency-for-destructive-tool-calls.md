# ADR-0019: Destructive tool calls are deduplicated, not just re-confirmed

Status: Accepted
Date: 2026-09-05

## Context

Two layers can replay the same irreversible operation for the same reason:
nobody saw a response, so the caller guesses. The lower layer was closed by
narrowing the SDK's `retryCondition` so an unsafe HTTP method is never
re-sent (github.com/Ilmar7786/marzban-sdk#75). The upper layer was still
open: an MCP client that times out waiting for `tools/call` re-issues the
call, and `core/tool/registry.ts` ran `tool.handler` for every call it was
handed. For `marzban_core_restart` that is a second restart; for
`marzban_config_update` a second overwrite
(github.com/Ilmar7786/marzban-sdk#76).

ADR-0013 made `confirm: 'auto'` trust a call rather than a tool, so a repeat
with identical arguments proceeds without re-asking. That is the right
behavior for a prompt — an honest retry should not pester a human twice —
but it is precisely what let the retry reach the panel a second time. The
confirmation gate answers "may this run?"; nothing answered "has this
already run?".

## Decision

A dedup store for `scope: 'destructive'` tools, as its own pipeline stage in
`core/tool/registry.ts` after the confirmation gate, backed by
`core/idempotency/`.

- **Key**: `callKey(tool.name, args)` — moved out of `core/confirm/confirm.ts`
  into `core/confirm/canonical.ts` so the trust cache and the dedup store
  share one definition of "the same call", as ADR-0013 anticipated.
  `confirmToken` is excluded from the hash: it carries a fresh `jti` per
  mint, so including it would make every retry a different key and defeat the
  mechanism.
- **Order**: confirm first, dedup second. The key ignores `confirmToken`, so
  a caller presenting no token hashes to the same key as the confirmed
  original; deduping first would hand that caller the recorded result — for
  `marzban_config_update`, the entire previous core config in `backup` —
  past a gate ADR-0013 had just tightened.
- **Records the handler's plain data, not the finished `CallToolResult`.**
  The recording boundary then wraps only the mutation, so a failure in
  rendering cannot lose the fact that a delete happened. A replay re-renders
  under the current output settings and gets a leading notice block saying it
  is a recording; `structuredContent` stays exactly as recorded, which is
  what the tool's `outputSchema` constrains. Reporting a replay as a fresh
  execution would be a silent lie, the one failure mode a safety feature must
  not have.
- **Only an unanswered unsafe request is "unknown".** `core/idempotency/classify.ts`
  treats every other failure as provably not applied: the panel answering
  4xx/5xx means it refused; a failure with no method never left the client; a
  failure on a safe method is the read that destructive handlers do before
  they write (`getCoreConfig`, `getHosts`). Only those stay retryable. An
  unanswered POST/DELETE records an `unknown` outcome, and a later identical
  call is told to verify state with a read tool rather than guess.
- **A freshly verified confirm token overrides a record.** `ConfirmDecision`
  now reports why a call was allowed, and `reason: 'token'` bypasses the
  store. Without it, `confirm: 'always'` — where reaching the handler at all
  requires a human to re-approve — would answer a deliberate second restart
  with a four-minute-old result. An accidental retry cannot reach this path:
  it re-sends the consumed token, which fails verification as `reused`.
- **Concurrent duplicates share one execution** rather than being answered
  `unknown`; the exact answer is seconds away, and both callers get it.
- **TTL is 300 seconds, as its own constant**, not an import of
  `CONFIRM_TOKEN_TTL_SECONDS` and not an env var. The two windows are equal
  today by coincidence of judgment — a confirmation window is about how
  recently a human agreed, this one about how long a client might still be
  retrying — and coupling them would let a change to one silently move the
  other. The store is capped at 256 entries, evicting oldest-first.
- **Process memory only.** A restarted server has no record of what a
  previous run executed and must not pretend otherwise — the same policy the
  confirm signing key follows.

Rejected: making the store the confirmation gate's job. `ConfirmDecision`
carries a verdict, not a result; widening it to also produce rendered data
would collapse the split that keeps handlers returning plain data. It would
also inherit the gate's early return on `confirm: 'off'`, disabling dedup in
the one mode that has no other protection.

Rejected: a shorter TTL for `unknown` records than for successful ones. It
expires the dangerous branch first.

## Consequences

- In `off`, dedup is the only thing standing between a retry and a second
  execution. In `auto`, the trust cache makes the retry admissible and dedup
  makes it a no-op — both are needed, neither subsumes the other. In
  `always`, the gate already blocks a bare repeat, so dedup mostly records.
- A deliberate immediate re-run of an argument-less destructive tool
  (`marzban_core_restart` always takes `{}`) is not expressible in `auto`:
  the trust cache is consulted before the token, so even a fresh token
  reports `trusted` and the call is replayed. Waiting out the window, or
  running in `always`, is the way to force a second run. The replay notice
  makes this visible rather than silent. Reordering the gate to check a
  presented token first would fix it and is left as separate work.
- A panel that is merely unreachable poisons a key with `unknown` for the
  window: `ECONNREFUSED` is provably not applied, but it is indistinguishable
  from a timeout on an in-flight DELETE, because the transport code sits in
  `HttpError.details` with no public accessor. The cost is a needless "verify
  the state" answer, never a wrong one. A `transportCode` getter on
  `HttpError` would narrow it — tracked separately, since it is an SDK
  change.
- Recorded data can contain masked-by-view credentials (`proxies`,
  `subscription_url`) in `structuredContent`, held for up to five minutes.
  Not a new class of exposure — `render` already returns raw data on every
  call — but the retention window is new.
- The store is per server instance and the transport is stdio, so one client
  per process gives session isolation for free. An HTTP transport would have
  to fold `sessionId` into the key, or keep a store per session.
- The single-flight branch assumes no `AbortSignal` reaches the SDK: handlers
  receive only `ToolContext`. If `serverCtx.mcpReq.signal` is ever plumbed
  through, one caller's cancellation would abort a shared operation, and the
  abort would have to be keyed to "every waiter has gone".
