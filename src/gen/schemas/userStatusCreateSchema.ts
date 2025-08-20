import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { UserStatusCreate } from '../models/UserStatusCreate.ts'

export const userStatusCreateSchema = z.enum(['active', 'on_hold']) as unknown as ToZod<UserStatusCreate>

export type UserStatusCreateSchema = UserStatusCreate
