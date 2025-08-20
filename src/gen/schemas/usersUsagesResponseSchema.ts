import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { UsersUsagesResponse } from '../models/UsersUsagesResponse.ts'
import { userUsageResponseSchema } from './userUsageResponseSchema.ts'

export const usersUsagesResponseSchema = z.object({
  get usages() {
    return z.array(userUsageResponseSchema)
  },
}) as unknown as ToZod<UsersUsagesResponse>

export type UsersUsagesResponseSchema = UsersUsagesResponse
