import { z } from 'zod/v4'

import type { UserStatus } from '../models/UserStatus.ts'

export const userStatusSchema = z.enum([
  'active',
  'disabled',
  'limited',
  'expired',
  'on_hold',
]) as unknown as z.ZodType<UserStatus>
