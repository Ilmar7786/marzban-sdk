import { defineTool } from '@/core/define-tool'

import { nodesListInputSchema, nodesListOutputSchema } from './nodes.schemas'
import { nodesListView } from './nodes.views'

export const nodesListTool = defineTool({
  name: 'marzban_nodes_list',
  title: 'List nodes',
  description:
    'Lists all connected nodes with their status and Xray version, plus bandwidth usage (uplink/downlink) over the given period. `start`/`end` (ISO datetimes) narrow the usage window; omit both for all-time.',
  inputSchema: nodesListInputSchema,
  outputSchema: nodesListOutputSchema,
  scope: 'read',
  view: nodesListView,
  handler: async (args, ctx) => {
    const [nodes, usage] = await Promise.all([
      ctx.sdk.node.getNodes(),
      ctx.sdk.node.getUsage({ start: args.start, end: args.end }),
    ])
    return { nodes, usage: usage.usages }
  },
})
