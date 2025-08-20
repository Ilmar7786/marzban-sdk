import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { Conflict } from '../models/Conflict.ts'

export const conflictSchema = z.object({
  detail: z.string().default('Entity already exists'),
}) as unknown as ToZod<Conflict>

export type ConflictSchema = Conflict
