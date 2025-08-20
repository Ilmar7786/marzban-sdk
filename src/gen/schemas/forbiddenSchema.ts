import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { Forbidden } from '../models/Forbidden.ts'

export const forbiddenSchema = z.object({
  detail: z.string().default('You are not allowed to ...'),
}) as unknown as ToZod<Forbidden>

export type ForbiddenSchema = Forbidden
