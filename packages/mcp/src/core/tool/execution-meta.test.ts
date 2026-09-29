import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import type { View } from '@/format/views/types'

import { defineTool } from './define-tool'
import { EXECUTION_META_KEY, registeredOutputSchema, withExecutionMeta } from './execution-meta'
import { toolOutputJsonSchema } from './json-schema'

const echoView: View<{ echoed: string }> = { compact: data => ({ echoed: data.echoed }) }

function makeTool(overrides: Partial<Parameters<typeof defineTool<z.ZodType, z.ZodType>>[0]> = {}) {
  return defineTool({
    name: 'marzban_test_tool',
    title: 'Test tool',
    description: 'A tool used only in tests.',
    inputSchema: z.object({ value: z.string() }),
    outputSchema: z.object({ echoed: z.string() }),
    scope: 'read',
    view: echoView,
    handler: async args => ({ echoed: (args as { value: string }).value }),
    ...overrides,
  })
}

describe('registeredOutputSchema', () => {
  it('leaves a non-destructive schema exactly as its author declared it', () => {
    const tool = makeTool({ scope: 'write' })
    expect(registeredOutputSchema(tool)).toBe(tool.outputSchema)
  })

  it('requires the provenance field on a destructive schema', () => {
    const schema = toolOutputJsonSchema(registeredOutputSchema(makeTool({ scope: 'destructive' })))

    // Required, not optional: the MCP server validates every non-error
    // structuredContent against this schema, so a code path that forgets to
    // tag a destructive result fails instead of shipping an unmarked replay.
    expect(schema.required).toContain(EXECUTION_META_KEY)
    expect(schema.properties).toHaveProperty(EXECUTION_META_KEY)
  })

  it('refuses a destructive tool whose outputSchema is not an object', () => {
    // There would be nowhere to put the field, and no way to declare it —
    // better to fail at startup than to silently skip provenance for one tool.
    expect(() => registeredOutputSchema(makeTool({ scope: 'destructive', outputSchema: z.string() }))).toThrow(
      /must be an object schema/
    )
  })

  it('refuses a destructive tool that already declares the reserved key', () => {
    const outputSchema = z.object({ echoed: z.string(), [EXECUTION_META_KEY]: z.string() })
    expect(() => registeredOutputSchema(makeTool({ scope: 'destructive', outputSchema }))).toThrow(/is reserved/)
  })
})

describe('withExecutionMeta', () => {
  it('leads with the provenance so a large payload cannot bury it', () => {
    // marzban_config_update returns the entire previous Xray config in
    // `backup`; a notice trailing tens of kilobytes of JSON is a notice
    // nobody reads.
    const tagged = withExecutionMeta({ backup: 'x'.repeat(100) }, { status: 'replayed', notice: 'already ran' })

    expect(Object.keys(tagged as object)[0]).toBe(EXECUTION_META_KEY)
    expect(tagged).toEqual({
      [EXECUTION_META_KEY]: { status: 'replayed', notice: 'already ran' },
      backup: 'x'.repeat(100),
    })
  })

  it('passes the recorded data through untouched', () => {
    const data = { username: 'alice', deleted: true }
    expect(withExecutionMeta(data, { status: 'executed' })).toMatchObject(data)
  })
})
