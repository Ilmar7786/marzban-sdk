import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { Token } from '../models/Token.ts'

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default('bearer'),
}) as unknown as ToZod<Token>

export type TokenSchema = Token
