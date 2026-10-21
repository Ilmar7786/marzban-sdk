import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { compactJsonSchema } from './compact-json-schema'

const SAFE = Number.MAX_SAFE_INTEGER

function raw(schema: z.ZodType): Record<string, unknown> {
  return schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' })
}

/** Whether a strict draft 2020-12 client accepts each value under `schema`. */
function verdicts(schema: Record<string, unknown>, values: unknown[]): boolean[] {
  const validate = new Ajv2020({ strict: false }).compile(schema)
  return values.map(value => validate(value))
}

describe('compactJsonSchema', () => {
  it('drops the root $schema', () => {
    expect(compactJsonSchema({ $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'string' })).toEqual({
      type: 'string',
    })
  })

  it('drops the safe-integer bounds z.number().int() emits, and keeps real ones', () => {
    const schema = z.object({ any: z.number().int(), count: z.number().int().nonnegative() })

    expect(compactJsonSchema(raw(schema)).properties).toEqual({
      any: { type: 'integer' },
      count: { type: 'integer', minimum: 0 },
    })
  })

  it('collapses a nullable wrapped around an already-nullable schema', () => {
    const schema = z.object({ n: z.number().nullable().nullable() })

    expect(compactJsonSchema(raw(schema)).properties).toEqual({
      n: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    })
  })

  it('does not collapse an inner nullable that carries its own keywords', () => {
    const inner = { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'kept' }

    expect(compactJsonSchema({ anyOf: [inner, { type: 'null' }] })).toEqual({ anyOf: [inner, { type: 'null' }] })
  })

  it('leaves an anyOf alone when it is not a doubled nullable', () => {
    const schema = { anyOf: [{ anyOf: [{ type: 'number' }, { type: 'string' }] }, { type: 'null' }] }

    expect(compactJsonSchema(schema)).toEqual(schema)
  })

  it('drops an empty properties next to additionalProperties (record types), and keeps a non-empty one', () => {
    expect(compactJsonSchema(raw(z.record(z.string(), z.number())))).toEqual({
      type: 'object',
      propertyNames: { type: 'string' },
      additionalProperties: { type: 'number' },
    })
    expect(compactJsonSchema({ properties: { a: { type: 'string' } }, additionalProperties: false })).toEqual({
      properties: { a: { type: 'string' } },
      additionalProperties: false,
    })
  })

  it('does not modify its input', () => {
    const schema = { $schema: 'x', type: 'integer', minimum: -SAFE, maximum: SAFE }
    const before = structuredClone(schema)

    compactJsonSchema(schema)

    expect(schema).toEqual(before)
  })

  it('accepts and rejects exactly what the raw schema does, for every value the server can produce', () => {
    const schema = z.object({
      id: z.number().int(),
      size: z.number().int().nonnegative(),
      note: z.string().nullable().nullable().optional(),
      tags: z.record(z.string(), z.string()),
    })
    const probes = [
      { id: 1, size: 0, tags: {} },
      { id: -SAFE, size: SAFE, note: null, tags: { a: 'b' } },
      { id: 1, size: 0, note: 'x', tags: {} },
      { id: 1.5, size: 0, tags: {} },
      { id: 1, size: -1, tags: {} },
      { id: 1, size: 0, note: 5, tags: {} },
      { id: 1, size: 0, tags: { a: 1 } },
      { id: 1, size: 0, tags: {}, extra: true },
      { size: 0, tags: {} },
      null,
    ]

    expect(verdicts(compactJsonSchema(raw(schema)), probes)).toEqual(verdicts(raw(schema), probes))
  })
})
