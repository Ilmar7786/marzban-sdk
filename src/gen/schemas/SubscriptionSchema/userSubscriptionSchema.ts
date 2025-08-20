import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<UserSubscriptionPathParams>

export type UserSubscriptionPathParamsSchema = UserSubscriptionPathParams

export const userSubscriptionHeaderParamsSchema = z.object({
  'user-agent': z.string().default(''),
}) as unknown as ToZod<UserSubscriptionHeaderParams>

export type UserSubscriptionHeaderParamsSchema = UserSubscriptionHeaderParams

/**
 * @description Successful Response
 */
export const userSubscription200Schema = z.any() as unknown as ToZod<UserSubscription200>

export type UserSubscription200Schema = UserSubscription200

/**
 * @description Validation Error
 */
export const userSubscription422Schema = HTTPValidationErrorSchema as unknown as ToZod<UserSubscription422>

export type UserSubscription422Schema = UserSubscription422

export const userSubscriptionQueryResponseSchema =
  userSubscription200Schema as unknown as ToZod<UserSubscriptionQueryResponse>

export type UserSubscriptionQueryResponseSchema = UserSubscriptionQueryResponse
