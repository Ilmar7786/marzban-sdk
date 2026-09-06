# ADR-0020: `confirm: 'auto'` checks a presented token before the trust cache

Status: Accepted
Date: 2026-09-06

## Context

ADR-0013 gave `auto` a trust cache keyed by tool name and exact arguments;
ADR-0019 added a dedup store and made `ConfirmDecision.reason` the signal
that decides whether a call runs or is replayed — only `reason: 'token'`,
a single-use token verified moments ago, outranks a recorded outcome.

`core/confirm/confirm.ts` consulted the trust cache _before_ it read
`confirmToken` from the arguments, so in `auto` a caller presenting a fresh,
valid token still got `reason: 'trusted'` and its call was replayed
(github.com/Ilmar7786/marzban-sdk#129). A deliberate immediate re-run was
therefore inexpressible in the default mode — worst for tools whose
arguments never vary, since `marzban_core_restart` always takes `{}` and
every call inside the window hashes to one key. ADR-0019 recorded this as a
known consequence and left the reordering as separate work, because #76 was
a safety change to the destructive path and widening it would have widened
its review surface.

Reordering alone does not finish the job. A token is minted only in the
decline branch, and a trust-cache hit returns before that branch is reached,
so in `auto` there is no way to obtain a fresh token for a call that is
already trusted — the replay notice's own advice, "to run it again for real,
confirm it afresh", was impossible to follow in the one mode where replays
are most common.

## Decision

1. **Verify a presented token first; fall through to the trust cache only
   when no valid token was supplied.** Every #74 guarantee is untouched — the
   token is bound to the exact tool and the canonicalized arguments, and is
   single-use — while an explicit re-approval now means what it says. It does
   not weaken `auto`: an accidental retry re-sends an already-consumed token,
   fails verification as `reused`, and lands on the trust-cache path exactly
   as before. `always` and `off` are unaffected, since the trust cache was
   already `auto`-only.

2. **A trusted decision carries a fresh token**, as `ConfirmDecision.rerunHint`
   — a ready-to-show sentence, not a raw token — and `core/tool/registry.ts`
   appends it to a replay notice. That closes the loop: a human asked again
   can say yes again, and the model has something to present.

   The hint is built in `core/confirm` rather than in `core/idempotency` or
   the registry. ADR-0019 rejected making the dedup store the confirmation
   gate's job; the mirror image — teaching the store to mint confirmation
   tokens — would collapse the same split from the other side. The registry
   passes a string through and still knows nothing about tokens.

3. **The token is minted on every trusted decision**, not lazily when a
   replay actually happens. Minting is one HMAC over a small payload, and an
   unused mint costs nothing: `jti` is recorded only on successful
   verification, so an unpresented token leaves no state behind.

4. **A token rejected on the way to a trust-cache hit is reported at `info`,
   not `warn`.** After the reorder an honest retry fails verification
   (`reused`) before reaching the cache; logging that at `warn` — the default
   `MARZBAN_MCP_LOG_LEVEL` — would raise an alarm on the single most ordinary
   thing `auto` exists to permit. The `warn` stays for a token attached to a
   call that is actually refused.

## Consequences

- The re-run path is now uniform across modes: a fresh confirmation runs the
  operation for real, in `auto` as in `always`. The documented workaround —
  wait out the 5-minute window, or switch to `MARZBAN_MCP_CONFIRM=always` —
  is no longer needed, and `security.mdx` says so.
- A model that receives a replay notice also receives a valid token. This is
  the same trust model the first confirmation already uses: possessing a
  token is not consent, and the hint repeats the instruction not to call
  again until the user has explicitly said yes. Nothing here authenticates
  who is asking — on stdio that boundary is the process itself.
- A caller can now spend a token to force a second execution inside the dedup
  window. That is the intent, and it is the only way past the store; the cost
  is that "deliberate" is defined as "presented a fresh token", which the
  server cannot distinguish from a client that hoarded an unspent one.
- `ConfirmDecision` grows a field that only the `auto` path populates. A
  `ConfirmFn` that does not distinguish its reasons (`alwaysProceed`) omits
  it, and a replay notice then renders exactly as it did before.
