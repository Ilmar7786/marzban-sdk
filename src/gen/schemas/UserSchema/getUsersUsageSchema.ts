import { z } from 'zod/v4'

import type {
  GetUsersUsage200,
  GetUsersUsage401,
  GetUsersUsage422,
  GetUsersUsageQueryParams,
  GetUsersUsageQueryResponse,
} from '../../models/UserModel/GetUsersUsage.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { usersUsagesResponseSchema } from '../usersUsagesResponseSchema.ts'

export const getUsersUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
  admin: z.optional(z.union([z.array(z.string()), z.null()])),
}) as unknown as z.ZodType<GetUsersUsageQueryParams>

/**
 * @description Successful Response
 */
export const getUsersUsage200Schema = z.lazy(() => usersUsagesResponseSchema) as unknown as z.ZodType<GetUsersUsage200>

/**
 * @description Unauthorized
 */
export const getUsersUsage401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetUsersUsage401>

/**
 * @description Validation Error
 */
export const getUsersUsage422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetUsersUsage422>

export const getUsersUsageQueryResponseSchema = z.lazy(
  () => getUsersUsage200Schema
) as unknown as z.ZodType<GetUsersUsageQueryResponse>
