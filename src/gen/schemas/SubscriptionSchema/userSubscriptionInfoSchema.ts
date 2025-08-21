import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<UserSubscriptionInfoPathParams>

/**
 * @description Successful Response
 */
export const userSubscriptionInfo200Schema = subscriptionUserResponseSchema as unknown as ToZod<UserSubscriptionInfo200>

/**
 * @description Validation Error
 */
export const userSubscriptionInfo422Schema = HTTPValidationErrorSchema as unknown as ToZod<UserSubscriptionInfo422>

export const userSubscriptionInfoQueryResponseSchema =
  userSubscriptionInfo200Schema as unknown as ToZod<UserSubscriptionInfoQueryResponse>
