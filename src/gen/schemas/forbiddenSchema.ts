import { z } from 'zod/v4'

import type { Forbidden } from '../models/Forbidden.ts'

export const forbiddenSchema = z.object({
  detail: z.optional(z.string().default('You are not allowed to ...')),
}) as unknown as z.ZodType<Forbidden>
