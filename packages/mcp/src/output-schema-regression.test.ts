import { describe, expect, it } from 'vitest'

import { EXECUTION_META_KEY, registeredOutputSchema } from './core/tool/execution-meta'
import { toolOutputJsonSchema } from './core/tool/json-schema'
import { allTools } from './modules'

// A tool's outputSchema becomes the JSON Schema a client validates
// structuredContent against. `format` is the one JSON Schema keyword whose
// enforcement level is entirely up to the client: a strict validator checks
// it, a lenient one ignores it — and Marzban's own API doesn't back several
// of the formats zod is happy to claim (e.g. `z.iso.datetime({ local: true })`
// still emits `format: "date-time"`, which RFC 3339 says requires a UTC
// offset Marzban doesn't send — github.com/Ilmar7786/marzban-sdk#112).
//
// Rather than re-litigate this one field, no tool's outputSchema may emit
// `format` at all: it's a claim about the wire format that this codebase has
// no way to verify holds for every value Marzban can return, on any field,
// now or after a future tool is added. A schema fixed by removing `format`
// still validates every real response — it just stops promising something
// nobody checked. A deliberate, verified exception is fine; add it in its
// own commit with a comment explaining what makes that field's format claim
// actually safe, rather than folding it into an unrelated change.
function findFormatPaths(node: unknown, path: string): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => findFormatPaths(item, `${path}[${index}]`))
  }
  if (node === null || typeof node !== 'object') return []

  const found: string[] = []
  for (const [key, value] of Object.entries(node)) {
    if (key === 'format') found.push(`${path}.format`)
    found.push(...findFormatPaths(value, `${path}.${key}`))
  }
  return found
}

// `registeredOutputSchema`, not `tool.outputSchema`: for a destructive tool
// the registry registers the author's shape plus its execution-provenance
// field, and the invariant is about the schema a client actually receives —
// checking the declared one would stop covering whatever the registry adds.
// It also runs both of that derivation's guards once per real tool.
describe('output schema regression: no tool outputSchema claims a JSON Schema format', () => {
  it.each(allTools.map(tool => [tool.name, tool] as const))('%s', (_name, tool) => {
    const jsonSchema = toolOutputJsonSchema(registeredOutputSchema(tool))

    expect(findFormatPaths(jsonSchema, tool.name)).toEqual([])
  })
})

// Provenance is what stops a replayed destructive call from being reported as
// a fresh one (github.com/Ilmar7786/marzban-sdk#137). Asserting it here, over
// every real tool, is what makes it impossible for a destructive tool added
// later to ship without it — the registry derives the field, but only this
// test proves the derivation covers the set it should.
describe('every destructive tool advertises execution provenance, and no other tool does', () => {
  it.each(allTools.map(tool => [tool.name, tool] as const))('%s', (_name, tool) => {
    const required = toolOutputJsonSchema(registeredOutputSchema(tool)).required

    expect(Array.isArray(required) && required.includes(EXECUTION_META_KEY)).toBe(tool.scope === 'destructive')
  })
})
