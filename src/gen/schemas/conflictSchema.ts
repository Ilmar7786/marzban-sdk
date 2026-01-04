import { z } from 'zod/v4'

import type { Conflict } from '../models/Conflict.ts'

export const conflictSchema = z.object({
  detail: z.optional(z.string().default('Entity already exists')),
}) as unknown as z.ZodType<Conflict>
