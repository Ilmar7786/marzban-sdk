import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { Unauthorized } from '../models/Unauthorized.ts'

export const unauthorizedSchema = z.object({
  detail: z.string().default('Not authenticated'),
}) as unknown as ToZod<Unauthorized>
