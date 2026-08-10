import { z } from 'zod/v4'

import type { HTTPException } from '../models/HTTPException.ts'

export const HTTPExceptionSchema = z.object({
  detail: z.string(),
}) as unknown as z.ZodType<HTTPException>
