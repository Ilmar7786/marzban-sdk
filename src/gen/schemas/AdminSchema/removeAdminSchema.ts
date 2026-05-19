import { z } from 'zod/v4'

import type {
  RemoveAdmin200,
  RemoveAdmin401,
  RemoveAdmin403,
  RemoveAdmin422,
  RemoveAdminMutationResponse,
  RemoveAdminPathParams,
} from '../../models/AdminModel/RemoveAdmin.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const removeAdminPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<RemoveAdminPathParams>

/**
 * @description Successful Response
 */
export const removeAdmin200Schema = z.any() as unknown as z.ZodType<RemoveAdmin200>

/**
 * @description Unauthorized
 */
export const removeAdmin401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<RemoveAdmin401>

/**
 * @description Forbidden
 */
export const removeAdmin403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<RemoveAdmin403>

/**
 * @description Validation Error
 */
export const removeAdmin422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<RemoveAdmin422>

export const removeAdminMutationResponseSchema = z.lazy(
  () => removeAdmin200Schema
) as unknown as z.ZodType<RemoveAdminMutationResponse>
