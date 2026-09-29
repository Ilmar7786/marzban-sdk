import { isPlainObject } from '@/shared/is-plain-object'

type JsonSchema = Record<string, unknown>

/** `Number.MAX_SAFE_INTEGER` — the bound zod puts on every `z.number().int()`. */
const SAFE_INTEGER = Number.MAX_SAFE_INTEGER

/** `{ type: 'null' }` and nothing else — the null branch zod emits for `.nullable()`. */
function isNullOnly(value: unknown): boolean {
  return isPlainObject(value) && value.type === 'null' && Object.keys(value).length === 1
}

function compactNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(compactNode)
  if (!isPlainObject(node)) return node

  const out: JsonSchema = {}
  for (const [key, value] of Object.entries(node)) out[key] = compactNode(value)

  if (out.minimum === -SAFE_INTEGER) delete out.minimum
  if (out.maximum === SAFE_INTEGER) delete out.maximum

  if (isPlainObject(out.properties) && Object.keys(out.properties).length === 0 && 'additionalProperties' in out) {
    delete out.properties
  }

  const anyOf = out.anyOf
  if (Array.isArray(anyOf) && anyOf.length === 2 && isNullOnly(anyOf[1])) {
    const inner = anyOf[0]
    if (
      isPlainObject(inner) &&
      Object.keys(inner).length === 1 &&
      Array.isArray(inner.anyOf) &&
      inner.anyOf.length === 2 &&
      isNullOnly(inner.anyOf[1])
    ) {
      out.anyOf = inner.anyOf
    }
  }

  return out
}

/**
 * Removes the bytes zod's JSON Schema output spends on saying nothing
 * (github.com/Ilmar7786/marzban-sdk#130). `tools/list` goes into the model's
 * context at the start of every conversation, so these are paid for by every
 * user in every session — about a fifth of the payload.
 *
 * No rule changes whether a value the server can send, or will accept, is
 * valid:
 *
 * - `minimum: -2^53+1` / `maximum: 2^53-1`, which `z.number().int()` puts on
 *   every integer. Only the exact safe-integer bounds are dropped — a real
 *   bound like `nonnegative()`'s `minimum: 0` stays. This is the one rule
 *   that widens the schema, and only by integers past 2^53: zod still
 *   rejects those on the server, in both directions, so a client never sees
 *   one in `structuredContent` and can't get one past input validation.
 * - `anyOf: [{ anyOf: [X, null] }, null]` → `anyOf: [X, null]`: a
 *   `.nullable()` stacked on an already-nullable SDK schema. Collapsed only
 *   when the inner node holds nothing but its `anyOf`, so no `description` or
 *   other keyword is lost.
 * - The root `$schema`: MCP's default dialect for tool schemas is
 *   draft 2020-12, which is exactly what it declared.
 * - `properties: {}` next to `additionalProperties` (zod's record types): an
 *   empty `properties` constrains nothing.
 *
 * Returns a new schema; the input is not modified.
 */
export function compactJsonSchema(schema: JsonSchema): JsonSchema {
  const compacted = compactNode(schema) as JsonSchema
  delete compacted.$schema
  return compacted
}
