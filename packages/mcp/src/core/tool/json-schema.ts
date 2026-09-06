import type { z } from 'zod'

/**
 * The JSON Schema a client actually receives for a tool's `outputSchema`,
 * built the same way `@modelcontextprotocol/server` builds it when
 * registering a tool (`~standard.jsonSchema.output({ target: 'draft-2020-12' })`,
 * zod's Standard Schema JSON conversion — see `zod/v4/core/standard-schema.d.ts`).
 * Exists so tests can assert against what the wire protocol actually carries,
 * not just what `.safeParse()` accepts — see `output-schema-regression.test.ts`
 * and github.com/Ilmar7786/marzban-sdk#112.
 */
export function toolOutputJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' })
}
