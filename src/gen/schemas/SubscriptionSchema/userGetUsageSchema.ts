import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<UserGetUsagePathParams>

export const userGetUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
}) as unknown as ToZod<UserGetUsageQueryParams>

/**
 * @description Successful Response
 */
export const userGetUsage200Schema = z.any() as unknown as ToZod<UserGetUsage200>

/**
 * @description Validation Error
 */
export const userGetUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<UserGetUsage422>

export const userGetUsageQueryResponseSchema = userGetUsage200Schema as unknown as ToZod<UserGetUsageQueryResponse>
