import type { McpServer } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import type { PromptDefinition } from './define-prompt'

/** Registers every prompt in `prompts` on `server`. No filtering — prompts carry no risk of their own, only the tools they point at do. */
export function registerPrompts(server: McpServer, prompts: readonly PromptDefinition<z.ZodType>[]): void {
  for (const prompt of prompts) {
    server.registerPrompt(
      prompt.name,
      { title: prompt.title, description: prompt.description, argsSchema: prompt.argsSchema },
      args => prompt.handler(args)
    )
  }
}
