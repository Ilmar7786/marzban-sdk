import { z } from 'zod/v4'

import type {
  UserSubscriptionInfo200,
  UserSubscriptionInfo422,
  UserSubscriptionInfoPathParams,
  UserSubscriptionInfoQueryResponse,
} from '../../models/SubscriptionModel/UserSubscriptionInfo.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { subscriptionUserResponseSchema } from '../subscriptionUserResponseSchema.ts'

export const userSubscriptionInfoPathParamsSchema = z.object({
  token: z.string(),
}) as unknown as z.ZodType<UserSubscriptionInfoPathParams>

/**
 * @description Successful Response
 */
export const userSubscriptionInfo200Schema = z.lazy(
  () => subscriptionUserResponseSchema
) as unknown as z.ZodType<UserSubscriptionInfo200>

/**
 * @description Validation Error
 */
export const userSubscriptionInfo422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<UserSubscriptionInfo422>

export const userSubscriptionInfoQueryResponseSchema = z.lazy(
  () => userSubscriptionInfo200Schema
) as unknown as z.ZodType<UserSubscriptionInfoQueryResponse>
