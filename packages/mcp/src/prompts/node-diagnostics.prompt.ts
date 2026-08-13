import { z } from 'zod'

import { definePrompt } from '@/core/prompts'

export const nodeDiagnosticsPrompt = definePrompt({
  name: 'node_diagnostics',
  title: 'Diagnose a node',
  description: 'Investigates why a node might be unhealthy: connection status, Xray version, and recent bandwidth.',
  argsSchema: z.object({
    nodeName: z.string().optional().describe('Focus on one node by name. Omit to check every node.'),
  }),
  handler: ({ nodeName }) => {
    const target = nodeName ? `the node "${nodeName}"` : 'all nodes'
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Diagnose ${target}.

Steps:
1. Call marzban_nodes_list to see status, Xray version, and any error message per node${nodeName ? ` (focus on "${nodeName}")` : ''}.
2. Call marzban_system_stats for panel-wide context — in particular whether the core itself is running.
3. Flag any node whose status is not "connected", quoting its message field verbatim rather than paraphrasing.
4. For a disconnected or errored node, compare its Xray version against the others — a stale or missing version often points to a failed node update rather than a network problem.
5. Summarize findings per node. Do not attempt to reconnect or restart anything without the user's explicit go-ahead — a fix would mean marzban_core_restart, which is destructive and restarts every node's connections, not just this one.`,
          },
        },
      ],
    }
  },
})
