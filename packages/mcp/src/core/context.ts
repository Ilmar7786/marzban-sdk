import type { MarzbanSDK } from 'marzban-sdk'

import type { McpConfig } from '@/config'

import type { McpLogger } from './logger'

/** Everything a tool handler needs beyond its own validated arguments. */
export interface ToolContext {
  sdk: MarzbanSDK
  logger: McpLogger
  config: McpConfig
}
