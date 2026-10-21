# ADR-0021: Execution provenance travels in `structuredContent`, not in `content`

Status: Accepted
Date: 2026-09-06

## Context

A `CallToolResult` has two channels to the model, and they do not have the
same delivery guarantee. `content` is free-form: the MCP spec says a client
that understands `structuredContent` SHOULD prefer it and can ignore
`content` entirely. `structuredContent` is bound to the tool's advertised
`outputSchema`, validated by the server SDK, and always delivered.

ADR-0019 put the "this already ran" replay notice in the first channel and
the recorded data it qualifies in the second, on the stated assumption that
"the model still reads `content` either way"; ADR-0020 added the rerun hint —
a fresh confirm token — to the same block. Manual testing of #129 against a
real panel through Claude Desktop and Claude Code showed the assumption does
not hold: for a successful result carrying `structuredContent`, those clients
pass only `structuredContent` to the model
(github.com/Ilmar7786/marzban-sdk#137).

So the qualifier could be dropped while the thing it qualified arrived
intact. A destructive call replayed exactly as designed — the panel was not
touched twice — and the model saw `{"username": "...", "deleted": true}` with
no indication it was a recording. It reported a replay as a fresh deletion,
which is the one failure mode a safety feature must not have.

The two other destructive outcomes were never affected: a declined
confirmation and an `unknown` outcome are `isError` results with no
`structuredContent`, so `content` is the only thing a client can read.

## Decision

Execution provenance is part of a destructive tool's result, not a remark
alongside it.

- **A reserved `_execution` key inside `structuredContent`**, carrying
  `status: 'executed' | 'replayed'` and, on a replay, the same `notice`
  string the text channel gets. The leading underscore keeps it clear of the
  panel's own field names — `marzban_users_revoke_subscription` returns an
  entire `UserResponse` — and the derivation refuses a schema that already
  declares the key.
- **Derived in `core/tool/registry.ts`, not authored per tool**, the same way
  `readOnlyHint`/`destructiveHint` are derived from `scope`. A destructive
  tool is registered with `registeredOutputSchema(tool)`: the author's own
  shape plus the field. An invariant that every destructive tool must hold
  cannot be left to each author to remember, and a per-tool copy would drift.
- **Required, not optional.** The server SDK validates every non-error
  `structuredContent` against the advertised schema, so a code path that
  forgets to tag a destructive result fails loudly instead of shipping an
  unmarked replay. `status: 'executed'` is therefore a positive assertion of
  freshness rather than the absence of a notice — a model that infers
  freshness from a missing field infers it from a dropped one just as readily.
- **A dry run is `executed`.** `skipConfirm` reaches neither gate, but the
  call did run just now; the field describes how the result was produced, not
  whether anything was mutated.
- **`content` keeps the notice as a fallback**, for clients that do not read
  structured output. Same string, no second source of truth.
- **The `isError` paths are left alone.** They carry no `structuredContent`,
  so their text already reaches every client.

Rejected: `_meta` on the result. It is the spec's place for protocol
metadata, but a client is no more obliged to show it to the model than
`content` — which is the whole problem.

Rejected: answering a replay with `isError: true` so the text is unavoidable.
The dedup store exists so that a client which never saw the first response
gets that response; withholding it to make a notice visible trades one
failure for another.

## Consequences

- Every destructive tool's advertised `outputSchema` changes: consumers see
  one additional required property. Existing fields keep their names and
  places, so a client reading `deleted` is unaffected. This is a wire-visible
  change to six tools.
- `_execution` is reserved. A tool that needs a field by that name has to be
  renamed, and `registeredOutputSchema` says so at startup rather than at the
  first replay.
- `tools/list` for the `full` profile grows by roughly 2.5 KB — the schema
  ships once per session per destructive tool. The field's description is
  written tight for that reason, and `tools-list-budget.test.ts` holds the
  ceiling.
- Provenance is added to the data before rendering, so `content` is unchanged
  for a fresh call: the views project named fields and ignore the new key.
- The class of bug — a guarantee assumed of a channel that does not offer it —
  is now testable. `src/testing/in-memory-client.ts` gives the suite a
  vantage point outside the server, and both the unit and integration suites
  assert safety-relevant text through a projection that models a
  structuredContent-preferring client rather than reading `content` directly.
  See docs/testing.md, "Testing a guarantee, not an implementation".
