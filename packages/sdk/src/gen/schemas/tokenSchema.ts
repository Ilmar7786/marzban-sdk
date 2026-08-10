import { z } from 'zod/v4'

import type { Token } from '../models/Token.ts'

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.optional(z.string().default('bearer')),
}) as unknown as z.ZodType<Token>
