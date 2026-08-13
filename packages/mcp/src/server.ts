import { McpServer } from '@modelcontextprotocol/server'

import { createConfirmFn } from './core/confirm'
import type { ToolContext } from './core/context'
import { registerTools } from './core/registry'
import { allTools } from './modules'

export interface McpServerInfo {
  name: string
  version: string
}

export function createMarzbanMcpServer(info: McpServerInfo, ctx: ToolContext): McpServer {
  const server = new McpServer(info, { capabilities: { tools: {} } })
  // A fresh confirm strategy per server instance — its signing key and
  // trustedTools set are meant to live and die with the server (plan §6.1).
  registerTools({ server, tools: allTools, ctx, confirm: createConfirmFn() })
  return server
}
