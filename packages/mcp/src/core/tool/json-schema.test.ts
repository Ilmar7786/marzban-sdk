import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { allTools } from '@/modules'

import { registeredOutputSchema } from './execution-meta'
import { toolJsonSchema, toolOutputJsonSchema, withWireJsonSchema } from './json-schema'

const SAFE = Number.MAX_SAFE_INTEGER

/** Everything `compactJsonSchema` exists to remove, found anywhere in a schema. */
function findRemovable(node: unknown, path = '$'): string[] {
  if (Array.isArray(node)) return node.flatMap((item, i) => findRemovable(item, `${path}[${i}]`))
  if (node === null || typeof node !== 'object') return []
  const obj = node as Record<string, unknown>
  const found: string[] = []
  if (path === '$' && '$schema' in obj) found.push(`${path}.$schema`)
  if (obj.minimum === -SAFE) found.push(`${path}.minimum`)
  if (obj.maximum === SAFE) found.push(`${path}.maximum`)
  for (const [key, value] of Object.entries(obj)) found.push(...findRemovable(value, `${path}.${key}`))
  return found
}

describe('toolOutputJsonSchema', () => {
  it('converts a zod schema to the draft-2020-12 JSON Schema a client would see', () => {
    const schema = z.object({ ok: z.boolean() })

    expect(toolOutputJsonSchema(schema)).toMatchObject({
      type: 'object',
      properties: { ok: { type: 'boolean' } },
    })
  })

  it('surfaces format: "date-time" for a schema that carries it — the exact shape #112 was about', () => {
    const schema = z.object({ at: z.iso.datetime({ local: true }) })

    expect(toolOutputJsonSchema(schema).properties).toMatchObject({ at: { format: 'date-time' } })
  })
})

describe('every registered tool schema', () => {
  it.each(allTools.map(tool => [tool.name, tool] as const))('%s: nothing removable is left', (_name, tool) => {
    expect(findRemovable(toolJsonSchema(tool.inputSchema, 'input'))).toEqual([])
    expect(findRemovable(toolJsonSchema(registeredOutputSchema(tool), 'output'))).toEqual([])
  })
})

describe('withWireJsonSchema', () => {
  const schema = z.object({ size: z.string().transform(value => value.length), count: z.number().int() })

  it('advertises the compacted JSON Schema', () => {
    const json = withWireJsonSchema(schema)['~standard'].jsonSchema.input({ target: 'draft-2020-12' })

    expect(json).toEqual(toolJsonSchema(schema, 'input'))
    expect(findRemovable(json)).toEqual([])
  })

  it("still validates with zod — transforms run, and zod's issues come back", async () => {
    const wire = withWireJsonSchema(schema)['~standard']

    expect(await wire.validate({ size: 'abc', count: 1 })).toEqual({ value: { size: 3, count: 1 } })
    expect(await wire.validate({ size: 'abc', count: 1.5 })).toMatchObject({ issues: [{ path: ['count'] }] })
  })

  it('converts each direction lazily — an input schema with a transform has no output JSON Schema', () => {
    const wire = withWireJsonSchema(schema)['~standard'].jsonSchema

    expect(() => wire.input({ target: 'draft-2020-12' })).not.toThrow()
    expect(() => wire.output({ target: 'draft-2020-12' })).toThrow()
  })

  it('converts once and reuses the result', () => {
    const wire = withWireJsonSchema(z.object({ ok: z.boolean() }))['~standard'].jsonSchema

    expect(wire.output({ target: 'draft-2020-12' })).toBe(wire.output({ target: 'draft-2020-12' }))
  })
})
