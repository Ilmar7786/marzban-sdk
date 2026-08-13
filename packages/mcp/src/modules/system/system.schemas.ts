import { coreStatsSchema, proxyInboundSchema, systemStatsSchema } from 'marzban-sdk'
import { z } from 'zod'

export const systemStatsInputSchema = z.object({})

export const systemStatsOutputSchema = z.object({
  system: systemStatsSchema,
  core: coreStatsSchema,
})

export const systemInboundsInputSchema = z.object({})

export const systemInboundsOutputSchema = z.record(z.string(), z.array(proxyInboundSchema))
