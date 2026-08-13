import { nodeResponseSchema, nodeUsageResponseSchema } from 'marzban-sdk'
import { z } from 'zod'

export const nodesListInputSchema = z.object({
  start: z.string().optional().describe('ISO datetime. Omit for no lower bound.'),
  end: z.string().optional().describe('ISO datetime. Omit for no upper bound.'),
})

export const nodesListOutputSchema = z.object({
  nodes: z.array(nodeResponseSchema),
  usage: z.array(nodeUsageResponseSchema),
})
