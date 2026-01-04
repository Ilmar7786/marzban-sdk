import { z } from 'zod/v4'

import type { UserStatusCreate } from '../models/UserStatusCreate.ts'

export const userStatusCreateSchema = z.enum(['active', 'on_hold']) as unknown as z.ZodType<UserStatusCreate>
