import type { McpServer } from '@modelcontextprotocol/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { definePrompt } from './define-prompt'
import { registerPrompts } from './register-prompts'

type RegisteredEntry = {
  config: { title?: string; description?: string; argsSchema?: unknown }
  callback: (args: unknown) => unknown
}

function createFakeServer() {
  const registered = new Map<string, RegisteredEntry>()
  const server = {
    registerPrompt: (name: string, config: RegisteredEntry['config'], callback: RegisteredEntry['callback']) => {
      registered.set(name, { config, callback })
    },
  }
  return { server: server as unknown as McpServer, registered }
}

describe('registerPrompts', () => {
  it('registers every prompt with its title/description/argsSchema', () => {
    const { server, registered } = createFakeServer()
    const argsSchema = z.object({ foo: z.string().optional() })
    const prompt = definePrompt({
      name: 'test_prompt',
      title: 'Test prompt',
      description: 'A prompt used only in tests.',
      argsSchema,
      handler: () => ({ messages: [] }),
    })

    registerPrompts(server, [prompt])

    const entry = registered.get('test_prompt')!
    expect(entry.config).toEqual({ title: 'Test prompt', description: 'A prompt used only in tests.', argsSchema })
  })

  it("forwards the callback's args to the prompt's handler and returns its result", () => {
    const { server, registered } = createFakeServer()
    const prompt = definePrompt({
      name: 'test_prompt',
      title: 'Test prompt',
      description: 'A prompt used only in tests.',
      argsSchema: z.object({ foo: z.string().optional() }),
      handler: args => ({ messages: [{ role: 'user', content: { type: 'text', text: `foo=${args.foo}` } }] }),
    })

    registerPrompts(server, [prompt])

    const result = registered.get('test_prompt')!.callback({ foo: 'bar' })
    expect(result).toEqual({ messages: [{ role: 'user', content: { type: 'text', text: 'foo=bar' } }] })
  })
})
