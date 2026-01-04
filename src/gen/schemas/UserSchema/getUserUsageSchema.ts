import { z } from 'zod/v4'

import type {
  GetUserUsage200,
  GetUserUsage401,
  GetUserUsage403,
  GetUserUsage404,
  GetUserUsage422,
  GetUserUsagePathParams,
  GetUserUsageQueryParams,
  GetUserUsageQueryResponse,
} from '../../models/UserModel/GetUserUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userUsagesResponseSchema } from '../userUsagesResponseSchema.ts'

export const getUserUsagePathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<GetUserUsagePathParams>

export const getUserUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
}) as unknown as z.ZodType<GetUserUsageQueryParams>

/**
 * @description Successful Response
 */
export const getUserUsage200Schema = z.lazy(() => userUsagesResponseSchema) as unknown as z.ZodType<GetUserUsage200>

/**
 * @description Unauthorized
 */
export const getUserUsage401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetUserUsage401>

/**
 * @description Forbidden
 */
export const getUserUsage403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetUserUsage403>

/**
 * @description Not found
 */
export const getUserUsage404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<GetUserUsage404>

/**
 * @description Validation Error
 */
export const getUserUsage422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetUserUsage422>

export const getUserUsageQueryResponseSchema = z.lazy(
  () => getUserUsage200Schema
) as unknown as z.ZodType<GetUserUsageQueryResponse>
