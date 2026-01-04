import { z } from 'zod/v4'

import type { SystemStats } from '../models/SystemStats.ts'

export const systemStatsSchema = z.object({
  version: z.string(),
  mem_total: z.int(),
  mem_used: z.int(),
  cpu_cores: z.int(),
  cpu_usage: z.number(),
  total_user: z.int(),
  online_users: z.int(),
  users_active: z.int(),
  users_on_hold: z.int(),
  users_disabled: z.int(),
  users_expired: z.int(),
  users_limited: z.int(),
  incoming_bandwidth: z.int(),
  outgoing_bandwidth: z.int(),
  incoming_bandwidth_speed: z.int(),
  outgoing_bandwidth_speed: z.int(),
}) as unknown as z.ZodType<SystemStats>
