import { z } from 'zod/v4'

import type { ValidationError } from '../models/ValidationError.ts'

export const validationErrorSchema = z.object({
  loc: z.array(z.union([z.int(), z.string()])),
  msg: z.string(),
  type: z.string(),
}) as unknown as z.ZodType<ValidationError>
