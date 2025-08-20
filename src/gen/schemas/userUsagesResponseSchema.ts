import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { UserUsagesResponse } from '../models/UserUsagesResponse.ts'
import { userUsageResponseSchema } from './userUsageResponseSchema.ts'

export const userUsagesResponseSchema = z.object({
  username: z.string(),
  get usages() {
    return z.array(userUsageResponseSchema)
  },
}) as unknown as ToZod<UserUsagesResponse>

export type UserUsagesResponseSchema = UserUsagesResponse
