import { McpServer } from '@modelcontextprotocol/server'

import type { ToolContext } from './core/context'
import { alwaysProceed, registerTools } from './core/registry'
import { allTools } from './modules'

export interface McpServerInfo {
  name: string
  version: string
}

export function createMarzbanMcpServer(info: McpServerInfo, ctx: ToolContext): McpServer {
  const server = new McpServer(info, { capabilities: { tools: {} } })
  // `confirm` stays alwaysProceed until core/confirm (token + MRTR) lands —
  // safe today because the `full` profile (the only one exposing
  // `destructive`-scope tools) has none registered yet.
  registerTools({ server, tools: allTools, ctx, confirm: alwaysProceed })
  return server
}
