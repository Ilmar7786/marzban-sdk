import { z } from 'zod/v4'

import type { Unauthorized } from '../models/Unauthorized.ts'

export const unauthorizedSchema = z.object({
  detail: z.optional(z.string().default('Not authenticated')),
}) as unknown as z.ZodType<Unauthorized>
