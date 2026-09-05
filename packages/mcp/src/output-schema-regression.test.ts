import { describe, expect, it } from 'vitest'

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

describe('output schema regression: no tool outputSchema claims a JSON Schema format', () => {
  it.each(allTools.map(tool => [tool.name, tool] as const))('%s', (_name, tool) => {
    const jsonSchema = toolOutputJsonSchema(tool.outputSchema)

    expect(findFormatPaths(jsonSchema, tool.name)).toEqual([])
  })
})
