import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  RestartCore200,
  RestartCore401,
  RestartCore403,
  RestartCoreMutationResponse,
} from '../../models/CoreModel/RestartCore.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const restartCore200Schema = z.any() as unknown as ToZod<RestartCore200>

/**
 * @description Unauthorized
 */
export const restartCore401Schema = unauthorizedSchema as unknown as ToZod<RestartCore401>

/**
 * @description Forbidden
 */
export const restartCore403Schema = forbiddenSchema as unknown as ToZod<RestartCore403>

export const restartCoreMutationResponseSchema = restartCore200Schema as unknown as ToZod<RestartCoreMutationResponse>
