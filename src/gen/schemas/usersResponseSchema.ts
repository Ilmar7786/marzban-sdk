import { z } from 'zod/v4'

import type { UsersResponse } from '../models/UsersResponse.ts'
import { userResponseSchema } from './userResponseSchema.ts'

export const usersResponseSchema = z.object({
  get users() {
    return z.array(userResponseSchema)
  },
  total: z.int(),
}) as unknown as z.ZodType<UsersResponse>
