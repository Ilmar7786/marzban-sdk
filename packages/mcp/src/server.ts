import { McpServer } from '@modelcontextprotocol/server'

export interface McpServerInfo {
  name: string
  version: string
}

export function createMarzbanMcpServer(info: McpServerInfo): McpServer {
  return new McpServer(info, { capabilities: { tools: {} } })
}
