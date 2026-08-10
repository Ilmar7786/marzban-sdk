import { z } from 'zod/v4'

import type { UserDataLimitResetStrategy } from '../models/UserDataLimitResetStrategy.ts'

export const userDataLimitResetStrategySchema = z.enum([
  'no_reset',
  'day',
  'week',
  'month',
  'year',
]) as unknown as z.ZodType<UserDataLimitResetStrategy>
