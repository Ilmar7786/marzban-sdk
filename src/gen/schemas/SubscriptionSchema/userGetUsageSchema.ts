import { z } from 'zod/v4'

import type {
  UserGetUsage200,
  UserGetUsage422,
  UserGetUsagePathParams,
  UserGetUsageQueryParams,
  UserGetUsageQueryResponse,
} from '../../models/SubscriptionModel/UserGetUsage.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'

export const userGetUsagePathParamsSchema = z.object({
  token: z.string(),
}) as unknown as z.ZodType<UserGetUsagePathParams>

export const userGetUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
}) as unknown as z.ZodType<UserGetUsageQueryParams>

/**
 * @description Successful Response
 */
export const userGetUsage200Schema = z.any() as unknown as z.ZodType<UserGetUsage200>

/**
 * @description Validation Error
 */
export const userGetUsage422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<UserGetUsage422>

export const userGetUsageQueryResponseSchema = z.lazy(
  () => userGetUsage200Schema
) as unknown as z.ZodType<UserGetUsageQueryResponse>
