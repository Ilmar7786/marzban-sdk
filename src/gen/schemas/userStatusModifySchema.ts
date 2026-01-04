import { z } from 'zod/v4'

import type { UserStatusModify } from '../models/UserStatusModify.ts'

export const userStatusModifySchema = z.enum([
  'active',
  'disabled',
  'on_hold',
]) as unknown as z.ZodType<UserStatusModify>
