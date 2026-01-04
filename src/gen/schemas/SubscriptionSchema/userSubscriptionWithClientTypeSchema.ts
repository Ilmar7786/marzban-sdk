import { z } from 'zod/v4'

import type {
  UserSubscriptionWithClientType200,
  UserSubscriptionWithClientType422,
  UserSubscriptionWithClientTypeHeaderParams,
  UserSubscriptionWithClientTypePathParams,
  UserSubscriptionWithClientTypeQueryResponse,
} from '../../models/SubscriptionModel/UserSubscriptionWithClientType.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'

export const userSubscriptionWithClientTypePathParamsSchema = z.object({
  client_type: z.string().regex(/sing-box|clash-meta|clash|outline|v2ray|v2ray-json/),
  token: z.string(),
}) as unknown as z.ZodType<UserSubscriptionWithClientTypePathParams>

export const userSubscriptionWithClientTypeHeaderParamsSchema = z.object({
  'user-agent': z.string().default(''),
}) as unknown as z.ZodType<UserSubscriptionWithClientTypeHeaderParams>

/**
 * @description Successful Response
 */
export const userSubscriptionWithClientType200Schema =
  z.any() as unknown as z.ZodType<UserSubscriptionWithClientType200>

/**
 * @description Validation Error
 */
export const userSubscriptionWithClientType422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<UserSubscriptionWithClientType422>

export const userSubscriptionWithClientTypeQueryResponseSchema = z.lazy(
  () => userSubscriptionWithClientType200Schema
) as unknown as z.ZodType<UserSubscriptionWithClientTypeQueryResponse>
