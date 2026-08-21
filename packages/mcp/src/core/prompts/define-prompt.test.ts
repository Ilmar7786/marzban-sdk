import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { definePrompt } from './define-prompt'

describe('definePrompt', () => {
  it('returns the definition unchanged', () => {
    const definition = {
      name: 'test_prompt',
      title: 'Test prompt',
      description: 'A prompt used only in tests.',
      argsSchema: z.object({ foo: z.string().optional() }),
      handler: () => ({ messages: [] }),
    }
    expect(definePrompt(definition)).toBe(definition)
  })
})
