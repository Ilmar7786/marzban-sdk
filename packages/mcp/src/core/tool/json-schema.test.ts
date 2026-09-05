import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { toolOutputJsonSchema } from './json-schema'

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
