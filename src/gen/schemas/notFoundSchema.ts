import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NotFound } from '../models/NotFound.ts'

export const notFoundSchema = z.object({
  detail: z.string().default('Entity {} not found'),
}) as unknown as ToZod<NotFound>

export type NotFoundSchema = NotFound
