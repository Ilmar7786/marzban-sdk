import { z } from 'zod/v4'

import type {
  DisableAllActiveUsers200,
  DisableAllActiveUsers401,
  DisableAllActiveUsers403,
  DisableAllActiveUsers404,
  DisableAllActiveUsers422,
  DisableAllActiveUsersMutationResponse,
  DisableAllActiveUsersPathParams,
} from '../../models/AdminModel/DisableAllActiveUsers.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const disableAllActiveUsersPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<DisableAllActiveUsersPathParams>

/**
 * @description Successful Response
 */
export const disableAllActiveUsers200Schema = z.any() as unknown as z.ZodType<DisableAllActiveUsers200>

/**
 * @description Unauthorized
 */
export const disableAllActiveUsers401Schema = z.lazy(
  () => unauthorizedSchema
) as unknown as z.ZodType<DisableAllActiveUsers401>

/**
 * @description Forbidden
 */
export const disableAllActiveUsers403Schema = z.lazy(
  () => forbiddenSchema
) as unknown as z.ZodType<DisableAllActiveUsers403>

/**
 * @description Not found
 */
export const disableAllActiveUsers404Schema = z.lazy(
  () => notFoundSchema
) as unknown as z.ZodType<DisableAllActiveUsers404>

/**
 * @description Validation Error
 */
export const disableAllActiveUsers422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<DisableAllActiveUsers422>

export const disableAllActiveUsersMutationResponseSchema = z.lazy(
  () => disableAllActiveUsers200Schema
) as unknown as z.ZodType<DisableAllActiveUsersMutationResponse>
