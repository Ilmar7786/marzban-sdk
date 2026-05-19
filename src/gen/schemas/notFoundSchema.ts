import { z } from 'zod/v4'

import type { NotFound } from '../models/NotFound.ts'

export const notFoundSchema = z.object({
  detail: z.optional(z.string().default('Entity {} not found')),
}) as unknown as z.ZodType<NotFound>
