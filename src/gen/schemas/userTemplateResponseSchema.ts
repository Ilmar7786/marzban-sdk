import { z } from 'zod/v4'

import type { UserTemplateResponse } from '../models/UserTemplateResponse.ts'

export const userTemplateResponseSchema = z.object({
  name: z.union([z.string(), z.null()]).nullish(),
  data_limit: z.optional(z.union([z.int(), z.null()]).describe('data_limit can be 0 or greater')),
  expire_duration: z.optional(z.union([z.int(), z.null()]).describe('expire_duration can be 0 or greater in seconds')),
  username_prefix: z.optional(z.union([z.string(), z.null()])),
  username_suffix: z.optional(z.union([z.string(), z.null()])),
  inbounds: z.optional(z.object({}).catchall(z.array(z.string())).default({})),
  id: z.int(),
}) as unknown as z.ZodType<UserTemplateResponse>
