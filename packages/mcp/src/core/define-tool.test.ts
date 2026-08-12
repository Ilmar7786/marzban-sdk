import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import type { View } from '@/format/views/types'

import { defineTool } from './define-tool'

const view: View<{ ok: boolean }> = {
  compact: data => ({ ok: data.ok }),
}

function validDefinition() {
  return {
    name: 'marzban_widgets_get',
    title: 'Get widget',
    description: 'Returns a widget.',
    inputSchema: z.object({ id: z.string() }),
    outputSchema: z.object({ ok: z.boolean() }),
    scope: 'read' as const,
    view,
    handler: async () => ({ ok: true }),
  }
}

describe('defineTool', () => {
  it('returns the definition unchanged when the name carries the marzban_ namespace', () => {
    const definition = validDefinition()
    expect(defineTool(definition)).toBe(definition)
  })

  it('throws when the name is missing the marzban_ namespace', () => {
    const definition = { ...validDefinition(), name: 'widgets_get' }
    expect(() => defineTool(definition)).toThrow('must start with "marzban_"')
  })
})
