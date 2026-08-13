import { z } from 'zod'

import { definePrompt } from '@/core/prompts'

export const trafficReportPrompt = definePrompt({
  name: 'traffic_report',
  title: 'Traffic report',
  description: 'Summarizes bandwidth usage across the panel, nodes, and top users for a given period.',
  argsSchema: z.object({
    start: z.string().optional().describe('ISO datetime lower bound. Omit for no lower bound.'),
    end: z.string().optional().describe('ISO datetime upper bound. Omit for no upper bound.'),
  }),
  handler: ({ start, end }) => {
    const period =
      start || end ? `for ${start ?? '(no lower bound)'} through ${end ?? '(no upper bound)'}` : '(all-time)'
    const usageArgs =
      start || end ? ` (pass the same start/end: ${start ?? ''}${start && end ? ' / ' : ''}${end ?? ''})` : ''
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Produce a traffic report ${period}.

Steps:
1. Call marzban_system_stats for panel-wide totals (incoming/outgoing bandwidth and current speed) and user counts.
2. Call marzban_nodes_list${usageArgs} for per-node uplink/downlink over the period.
3. Call marzban_users_list, then marzban_users_usage for the heaviest-looking users (by used_traffic or usage_percent), to break their traffic down by node.
4. Summarize: total bandwidth for the period, the top 5 users by usage, and any node carrying disproportionate load relative to the others.`,
          },
        },
      ],
    }
  },
})
