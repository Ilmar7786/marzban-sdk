import { z } from 'zod'

import type { ToolDefinition } from './define-tool'

/**
 * Reserved key carrying execution provenance inside a destructive tool's
 * `structuredContent`.
 *
 * The leading underscore keeps it out of the panel's own namespace: every
 * other key in these results is a Marzban field (`username`, `used_traffic`,
 * `backup` — and `marzban_users_revoke_subscription` returns an entire
 * `UserResponse`), so a future field named `execution` must not silently
 * shadow, or be shadowed by, this one. `registeredOutputSchema` refuses to
 * derive a schema that already declares the key, which turns that collision
 * into a startup failure rather than a replay nobody notices.
 */
export const EXECUTION_META_KEY = '_execution'

/**
 * Why safety-relevant text lives here rather than only in `content`
 * (github.com/Ilmar7786/marzban-sdk#137):
 *
 * A `CallToolResult` has two channels to the model, with different delivery
 * guarantees. `content` is free-form, and the spec says a client that
 * understands `structuredContent` SHOULD prefer it and can ignore `content` —
 * Claude Desktop and Claude Code do exactly that for a successful result.
 * `structuredContent` is schema-bound and always delivered. ADR-0019 put the
 * replay notice in the first channel and the data it qualifies in the second,
 * so the qualifier could be dropped while the data it was qualifying arrived
 * intact: the model saw `{"username": "...", "deleted": true}` and reported a
 * recording as a fresh deletion.
 *
 * So provenance is part of the result, not a remark alongside it. It rides
 * the same channel as the data, is declared in the tool's advertised
 * `outputSchema`, and is required rather than optional — the MCP server
 * validates every non-error `structuredContent` against that schema, so a
 * future code path that forgets to tag a destructive result fails loudly
 * instead of shipping an unmarked replay.
 *
 * The description is written tight on purpose: it ships in `tools/list` for
 * every destructive tool, and that payload is budgeted
 * (`tools-list-budget.test.ts`).
 */
export const executionMetaSchema = z
  .object({
    status: z.enum(['executed', 'replayed']),
    notice: z.string().optional(),
  })
  .describe(
    'How this result was produced. "executed": the call ran just now. "replayed": an identical call already ran and this is its recorded result — nothing was sent to the panel; relay `notice` to the user before acting.'
  )

export type ExecutionMeta = z.infer<typeof executionMetaSchema>

/**
 * The `outputSchema` a destructive tool is actually registered with: the
 * author's own shape plus `EXECUTION_META_KEY`. Derived here for the same
 * reason `readOnlyHint`/`destructiveHint` are derived from `scope` (see the
 * contract note in define-tool.ts) — an invariant every destructive tool has
 * to hold cannot be left to each tool author to remember, and a per-tool copy
 * would drift.
 *
 * Declaring the field is not optional politeness. zod emits
 * `additionalProperties: false` for an output-side object schema, so a field
 * smuggled into `structuredContent` without appearing here is one a strict
 * client rejects the whole result over — the failure mode of
 * github.com/Ilmar7786/marzban-sdk#112.
 */
export function registeredOutputSchema(tool: ToolDefinition<z.ZodType, z.ZodType>): z.ZodType {
  if (tool.scope !== 'destructive') return tool.outputSchema

  // The runtime check is the real one: kubb types its generated schemas as
  // opaque `z.ZodType<X>` while they are `ZodObject`s at runtime, so the cast
  // below only makes `.shape`/`.extend()` reachable — the same pattern
  // `shared/schemas.ts` uses on `userResponseSchema`.
  if (!(tool.outputSchema instanceof z.ZodObject)) {
    throw new Error(
      `Tool "${tool.name}" is destructive, so its outputSchema must be an object schema — the registry extends it with "${EXECUTION_META_KEY}".`
    )
  }
  const object = tool.outputSchema as unknown as z.ZodObject<z.ZodRawShape>
  if (EXECUTION_META_KEY in object.shape) {
    throw new Error(
      `Tool "${tool.name}" declares "${EXECUTION_META_KEY}" in its outputSchema, but that key is reserved for execution provenance.`
    )
  }

  return object.extend({ [EXECUTION_META_KEY]: executionMetaSchema })
}

/**
 * Tags a destructive handler's plain data with how it was produced. First key
 * rather than last, deliberately: `marzban_config_update` returns the entire
 * previous Xray config in `backup`, and a notice that appears after tens of
 * kilobytes of JSON is a notice nobody reads.
 */
export function withExecutionMeta(data: unknown, meta: ExecutionMeta): unknown {
  return { [EXECUTION_META_KEY]: meta, ...(data as object) }
}
