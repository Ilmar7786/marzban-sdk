# ADR-0018: MCP `outputSchema`s never emit a JSON Schema `format` keyword

Status: Accepted
Date: 2026-09-05

## Context

Marzban returns datetime fields without a UTC offset —
`created_at: "2026-09-02T14:00:57.764445"`, no `Z`, no `+00:00`.
`packages/sdk/kubb.config.ts` deliberately generates these as
`z.iso.datetime({ local: true })` (`dateType: 'stringLocal'`) so the SDK can
parse that shape — the right choice on the SDK side, where the schema's job
is to accept what the wire actually sends.

`packages/mcp` reused those same SDK response schemas — `userResponseSchema`,
`subscriptionUserResponseSchema` — wholesale as MCP `outputSchema`s, for
every tool returning a user (`users_get/create/list/update/activate/
deactivate/hold/extend/revoke_subscription`, `subscription_info`). This is
exactly what `packages/mcp/ARCHITECTURE.md`'s "add a tool" instructions told
authors to do: "reuse SDK-exported schemas where possible."

The problem: `z.iso.datetime({ local: true })` converts to JSON Schema as
`{ type: "string", format: "date-time", pattern: "...(?:Z|)$" }`. The
`pattern` already accepts a missing offset — but `format: "date-time"` is an
RFC 3339 claim that an offset is present, and a format-aware validator keys
off `format`, not `pattern`. A strict MCP client (confirmed with Claude
Desktop) validates `structuredContent` against the tool's advertised
`outputSchema` and rejects Marzban's real response, even though the
underlying operation succeeded (github.com/Ilmar7786/marzban-sdk#112).
Reproduced live: `marzban_users_create` created the user; the client showed
`created_at must match format "date-time"` instead of the result.

Neither of the two test layers that should have caught this actually could:

- Every MCP fixture used `created_at: '2026-01-01T00:00:00Z'` — a shape
  Marzban never sends — so `.safeParse()` never saw the real value.
- `.safeParse()` wouldn't have caught it even with the real value: zod parses
  an offset-less string identically whether `local: true` is set or not.
  Nothing in the unit suite ever inspected the _emitted JSON Schema_, which
  is where `format` actually lives — the bug is entirely at the boundary
  between "zod accepts this" and "a JSON-Schema-`format` validator accepts
  this," a boundary this codebase had never tested.

## Decision

No tool's `outputSchema` may emit a JSON Schema `format` keyword, for any
field, full stop — not just the four datetime fields this issue found.

- `shared/schemas.ts` exports `mcpUserResponseSchema` /
  `mcpSubscriptionUserResponseSchema`: the SDK response schema with
  `created_at`/`sub_updated_at`/`online_at`/`on_hold_timeout` overridden to
  plain `z.string()` via `.extend()`. Every other field — including ones
  added to the SDK schema later — is inherited unchanged; only those four are
  hand-listed.
- `output-schema-regression.test.ts` iterates every tool in `allTools` and
  asserts the JSON Schema `@modelcontextprotocol/server` would actually
  derive from its `outputSchema` (via the new `toolOutputJsonSchema` helper,
  `schema['~standard'].jsonSchema.output(...)` — the same path the server
  itself uses) contains no `format` key anywhere, at any depth. This is
  deliberately broader than the four fields found: it closes the door on
  `format: "email"`/`"uri"`/`"ipv4"`/etc. leaking the same way through a
  different SDK schema or a tool not yet written, not just this one symptom.
- A real ajv instance (`ajv` + `ajv-formats`, new devDependencies in
  `packages/mcp`) with format assertions on validates a real tool result
  against its derived JSON Schema in `smoke.integration.test.ts` — the one
  check that actually reproduces what a strict client does, since
  `.safeParse()` structurally cannot.
- `ARCHITECTURE.md`'s "add a tool" step 1 is corrected: reusing an SDK schema
  for an `outputSchema` is fine for structure, never for a field's format
  claim — point to the `mcp*ResponseSchema` exports for response types.

Rejected: overriding only the four known fields with no blanket test. It
would have closed exactly this bug and left the class of bug open — the SDK
generates several other schemas with the same `local: true` shape
(`userCreateSchema`, `userModifySchema`, the expired-users list schemas)
that happen not to be reused as `outputSchema`s today, and nothing would stop
a future tool from reusing one the same wholesale way.

Also rejected: a generic recursive transform that auto-detects and rewrites
any datetime-shaped leaf in an arbitrary zod schema. It would sync automatically
with future SDK schema changes, but zod v4 has no stable "walk this schema's
def" API to build that on — the regression test plus the hand-listed
`.extend()` override gets the same practical safety (nothing ships with a
stray `format`) without depending on zod internals that could shift under a
minor version bump.

## Consequences

- `mcpUserResponseSchema`/`mcpSubscriptionUserResponseSchema` are now the
  required entry point for any MCP output schema that represents a Marzban
  user — a new tool reusing `userResponseSchema` from `marzban-sdk` directly
  reintroduces the bug the regression test exists to catch, and the test
  will fail on that tool's own name.
- A genuinely new datetime (or other format-bearing) field added to
  `userResponseSchema`/`subscriptionUserResponseSchema` upstream is **not**
  automatically wire-honest — it needs adding to the `.extend()` override by
  hand. `output-schema-regression.test.ts` is what turns that omission into a
  failing test instead of a silent recurrence, the moment such a field is
  exposed through any tool's `outputSchema`.
- Any future, deliberate use of `format` in an `outputSchema` (a field this
  codebase can actually verify the wire format backs up) needs its own commit
  adding a narrow, documented exception to the regression test — never folded
  into an unrelated change.
