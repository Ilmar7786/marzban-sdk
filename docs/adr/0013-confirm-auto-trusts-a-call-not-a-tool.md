# ADR-0013: `confirm: 'auto'` trusts a call, not a tool

Status: Accepted
Date: 2026-08-31

## Context

ADR-0010 established the profile + confirm security model for
`packages/mcp`: destructive tools require a short-lived confirmation token
bound to the exact tool and arguments, unless `MARZBAN_MCP_CONFIRM=off`. What
that ADR did not specify is what `auto` — the default — should trust once a
confirmation succeeds.

The implementation trusted the **tool by name**: `core/confirm/confirm.ts`
kept a `trustedTools: Set<string>` and, once any call to a given tool was
confirmed, every later call to that same tool proceeded with no further
prompt, regardless of its arguments (github.com/Ilmar7786/marzban-sdk#74).
Concretely, in one session:

- Confirming `marzban_users_delete { username: "alice" }` silently
  authorised deleting `bob`, `carol`, anyone — the argument binding the token
  itself enforces (`core/confirm/canonical.ts`) was discarded the moment
  `auto` cached trust by name.
- Confirming `marzban_users_reset_traffic { username: "alice" }` authorised
  the same tool called with `{ all: true }` — resetting traffic for every
  user on the panel. This is exactly the `all: false` → `all: true`
  substitution the confirm-token mechanics are documented to catch; `auto`
  threw that guarantee away after the first confirmed call.
- Confirming one `marzban_config_update` payload authorised any other
  payload, restarting the core with unreviewed config.

This is a real gap, but a bounded one: destructive tools are not registered
at all under the default `MARZBAN_MCP_PROFILE=standard` — reaching this
required an operator to have already opted into `full` — and most MCP hosts
prompt per `tools/call` on their own side unless a human clicked "always
allow." What made it worth fixing immediately rather than filing for later
is that the server's own documentation (`packages/mcp/README.md`,
`docs/mcp-server/security.mdx`, the docs-site landing page) advertised
"confirmation on every destructive action" without that caveat — the gap
between the claim and `auto`'s actual behavior needed to close regardless of
how a given client's own layers happened to mitigate it.

## Decision

`auto`'s trust is keyed by **tool name and the exact call arguments**
(`hashCallArgs` — the same canonicalized-argument hash the confirm token
itself signs, shared between `core/confirm/token.ts` and
`core/confirm/confirm.ts` so both use one definition of "same call"), and
each grant **expires after `CONFIRM_TOKEN_TTL_SECONDS`** (5 minutes, the
same window a confirm token uses).

This was issue #74's "option A" (key by `tool.name + argsHash`) plus a TTL
that the issue's original proposal didn't include. Keying by exact arguments
alone is not sufficient on its own: `marzban_core_restart` takes no
meaningful arguments (`args` is always `{}`), so under plain A, one confirmed
restart would grant unlimited further restarts for the rest of the
connection — the same shape of bug this ADR fixes, just triggered by a
tool whose arguments never vary instead of ones that do. The TTL closes that
case without reopening the "re-confirm every call" cost A was meant to avoid.

Option B from the issue — ignore `auto` for `destructive` tools entirely,
requiring a fresh token on every call — was considered and rejected as the
default behavior: it collapses into `always`, discarding `auto`'s only
purpose (not re-asking for an honest retry of the exact same operation,
e.g. after a client timeout or reconnect). `always` already exists as an
explicit choice for operators who want that stricter posture.

Every call that proceeds on accumulated trust (rather than a freshly
verified token) is logged via the server's stderr logger. The confirmation
flow's own documentation (`security.mdx`) previously claimed this was
"written to the audit log described below" — no such audit log exists
anywhere in the repository. That claim is corrected to describe the actual
stderr logging rather than a mechanism that was never built.

## Consequences

- `auto`'s remaining difference from `always` narrows to exactly one thing:
  a genuine retry of the identical call, within 5 minutes, doesn't re-prompt.
  Everything else — a different target, a wider version of the same call, or
  the same call after the window closes — now behaves like `always`.
- The convenience `auto` previously offered — confirm once, then delete
  fifty users in a cleanup loop without fifty prompts — is gone by design.
  That behavior is what made the bug possible; there is no way to keep it
  without re-introducing trust that outlives the specific operation it was
  granted for.
- `hashCallArgs` (in `core/confirm/canonical.ts`) is now a small shared
  primitive, not private to the token codec. #76 (idempotency keys for
  destructive tools) proposes the identical `tool.name + canonicalize(args)`
  key for its own dedup store and can reuse this helper directly instead of
  redefining it.
- #78 (migrating confirmation to MRTR elicitation) inherits this semantics
  unchanged — what changes there is the transport of the confirmation
  round-trip, not what a successful confirmation is scoped to.
