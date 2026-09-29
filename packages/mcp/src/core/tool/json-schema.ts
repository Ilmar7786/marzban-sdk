import type { StandardSchemaWithJSON } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import { compactJsonSchema } from './compact-json-schema'

type JsonSchema = Record<string, unknown>

/**
 * The JSON Schema a client actually receives for a tool's `inputSchema` or
 * `outputSchema`: zod's Standard Schema conversion
 * (`~standard.jsonSchema[io]({ target: 'draft-2020-12' })`, the same call
 * `@modelcontextprotocol/server` makes — see `zod/v4/core/standard-schema.d.ts`),
 * then `compactJsonSchema`. `withWireJsonSchema` is what makes this the wire
 * shape; this function exists so tests can assert against it directly.
 */
export function toolJsonSchema(schema: z.ZodType, io: 'input' | 'output'): JsonSchema {
  return compactJsonSchema(schema['~standard'].jsonSchema[io]({ target: 'draft-2020-12' }))
}

/**
 * `toolJsonSchema(schema, 'output')` — what a client validates
 * `structuredContent` against. Exists so tests can assert against what the
 * wire protocol actually carries, not just what `.safeParse()` accepts — see
 * `output-schema-regression.test.ts` and github.com/Ilmar7786/marzban-sdk#112.
 */
export function toolOutputJsonSchema(schema: z.ZodType): JsonSchema {
  return toolJsonSchema(schema, 'output')
}

/**
 * The zod schema as `registerTool` should see it: validation is still zod's
 * own `~standard.validate` — transforms (`"10GB"` → bytes), refinements and
 * error messages all intact — but the JSON Schema the SDK advertises in
 * `tools/list` is the compacted one.
 *
 * Deliberately not the SDK's `fromJsonSchema`: that swaps validation over to
 * a JSON Schema validator, and the handler would receive raw, untransformed
 * arguments.
 *
 * Each direction is converted on first use and cached, not up front: an
 * input schema with a `.transform()` has no output-side JSON Schema at all
 * (zod throws), and the SDK only ever asks an input schema for `input`.
 */
export function withWireJsonSchema(schema: z.ZodType): StandardSchemaWithJSON {
  let input: JsonSchema | undefined
  let output: JsonSchema | undefined
  return {
    '~standard': {
      ...schema['~standard'],
      jsonSchema: {
        input: () => (input ??= toolJsonSchema(schema, 'input')),
        output: () => (output ??= toolJsonSchema(schema, 'output')),
      },
    },
  }
}
