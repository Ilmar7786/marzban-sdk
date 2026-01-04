import { z } from 'zod/v4'

import type {
  ResetUserDataUsage200,
  ResetUserDataUsage401,
  ResetUserDataUsage403,
  ResetUserDataUsage404,
  ResetUserDataUsage422,
  ResetUserDataUsageMutationResponse,
  ResetUserDataUsagePathParams,
} from '../../models/UserModel/ResetUserDataUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const resetUserDataUsagePathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<ResetUserDataUsagePathParams>

/**
 * @description Successful Response
 */
export const resetUserDataUsage200Schema = z.lazy(
  () => userResponseSchema
) as unknown as z.ZodType<ResetUserDataUsage200>

/**
 * @description Unauthorized
 */
export const resetUserDataUsage401Schema = z.lazy(
  () => unauthorizedSchema
) as unknown as z.ZodType<ResetUserDataUsage401>

/**
 * @description Forbidden
 */
export const resetUserDataUsage403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ResetUserDataUsage403>

/**
 * @description Not found
 */
export const resetUserDataUsage404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<ResetUserDataUsage404>

/**
 * @description Validation Error
 */
export const resetUserDataUsage422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<ResetUserDataUsage422>

export const resetUserDataUsageMutationResponseSchema = z.lazy(
  () => resetUserDataUsage200Schema
) as unknown as z.ZodType<ResetUserDataUsageMutationResponse>
