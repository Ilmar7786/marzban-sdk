import { defineTool } from '@/core/define-tool'

import {
  systemInboundsInputSchema,
  systemInboundsOutputSchema,
  systemStatsInputSchema,
  systemStatsOutputSchema,
} from './system.schemas'
import { systemInboundsView, systemStatsView } from './system.views'

export const systemStatsTool = defineTool({
  name: 'marzban_system_stats',
  title: 'Get system stats',
  description:
    'Reports panel-wide stats: CPU/memory usage, user counts by status, and bandwidth totals/speeds, plus the Xray core version and whether it is currently running.',
  inputSchema: systemStatsInputSchema,
  outputSchema: systemStatsOutputSchema,
  scope: 'read',
  view: systemStatsView,
  handler: async (_args, ctx) => {
    const [system, core] = await Promise.all([ctx.sdk.system.getSystemStats(), ctx.sdk.core.getCoreStats()])
    return { system, core }
  },
})

export const systemInboundsTool = defineTool({
  name: 'marzban_system_inbounds',
  title: 'List inbounds',
  description:
    'Lists configured inbound proxies grouped by protocol, with tag, network, TLS mode, and port for each. For the raw Xray inbound JSON (routing, stream settings, etc.) use marzban_config_get with section: "inbounds" instead.',
  inputSchema: systemInboundsInputSchema,
  outputSchema: systemInboundsOutputSchema,
  scope: 'read',
  view: systemInboundsView,
  handler: async (_args, ctx) => ctx.sdk.system.getInbounds(),
})
