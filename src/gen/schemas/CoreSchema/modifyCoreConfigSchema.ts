import { z } from 'zod/v4'

import type {
  ModifyCoreConfig200,
  ModifyCoreConfig401,
  ModifyCoreConfig403,
  ModifyCoreConfig422,
  ModifyCoreConfigMutationRequest,
  ModifyCoreConfigMutationResponse,
} from '../../models/CoreModel/ModifyCoreConfig.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const modifyCoreConfig200Schema = z.object({}) as unknown as z.ZodType<ModifyCoreConfig200>

/**
 * @description Unauthorized
 */
export const modifyCoreConfig401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ModifyCoreConfig401>

/**
 * @description Forbidden
 */
export const modifyCoreConfig403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ModifyCoreConfig403>

/**
 * @description Validation Error
 */
export const modifyCoreConfig422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<ModifyCoreConfig422>

export const modifyCoreConfigMutationRequestSchema = z.object(
  {}
) as unknown as z.ZodType<ModifyCoreConfigMutationRequest>

export const modifyCoreConfigMutationResponseSchema = z.lazy(
  () => modifyCoreConfig200Schema
) as unknown as z.ZodType<ModifyCoreConfigMutationResponse>
