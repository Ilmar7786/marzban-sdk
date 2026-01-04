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
export const restartCore200Schema = z.any() as unknown as z.ZodType<RestartCore200>

/**
 * @description Unauthorized
 */
export const restartCore401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<RestartCore401>

/**
 * @description Forbidden
 */
export const restartCore403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<RestartCore403>

export const restartCoreMutationResponseSchema = z.lazy(
  () => restartCore200Schema
) as unknown as z.ZodType<RestartCoreMutationResponse>
