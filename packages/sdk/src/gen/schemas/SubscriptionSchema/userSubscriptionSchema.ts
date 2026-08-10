import { z } from 'zod/v4'

import type {
  UserSubscription200,
  UserSubscription422,
  UserSubscriptionHeaderParams,
  UserSubscriptionPathParams,
  UserSubscriptionQueryResponse,
} from '../../models/SubscriptionModel/UserSubscription.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'

export const userSubscriptionPathParamsSchema = z.object({
  token: z.string(),
}) as unknown as z.ZodType<UserSubscriptionPathParams>

export const userSubscriptionHeaderParamsSchema = z.object({
  'user-agent': z.string().default(''),
}) as unknown as z.ZodType<UserSubscriptionHeaderParams>

/**
 * @description Successful Response
 */
export const userSubscription200Schema = z.any() as unknown as z.ZodType<UserSubscription200>

/**
 * @description Validation Error
 */
export const userSubscription422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<UserSubscription422>

export const userSubscriptionQueryResponseSchema = z.lazy(
  () => userSubscription200Schema
) as unknown as z.ZodType<UserSubscriptionQueryResponse>
