import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  RevokeUserSubscription200,
  RevokeUserSubscription401,
  RevokeUserSubscription403,
  RevokeUserSubscription404,
  RevokeUserSubscription422,
  RevokeUserSubscriptionMutationResponse,
  RevokeUserSubscriptionPathParams,
} from '../../models/UserModel/RevokeUserSubscription.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const revokeUserSubscriptionPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<RevokeUserSubscriptionPathParams>

export type RevokeUserSubscriptionPathParamsSchema = RevokeUserSubscriptionPathParams

/**
 * @description Successful Response
 */
export const revokeUserSubscription200Schema = userResponseSchema as unknown as ToZod<RevokeUserSubscription200>

export type RevokeUserSubscription200Schema = RevokeUserSubscription200

/**
 * @description Unauthorized
 */
export const revokeUserSubscription401Schema = unauthorizedSchema as unknown as ToZod<RevokeUserSubscription401>

export type RevokeUserSubscription401Schema = RevokeUserSubscription401

/**
 * @description Forbidden
 */
export const revokeUserSubscription403Schema = forbiddenSchema as unknown as ToZod<RevokeUserSubscription403>

export type RevokeUserSubscription403Schema = RevokeUserSubscription403

/**
 * @description Not found
 */
export const revokeUserSubscription404Schema = notFoundSchema as unknown as ToZod<RevokeUserSubscription404>

export type RevokeUserSubscription404Schema = RevokeUserSubscription404

/**
 * @description Validation Error
 */
export const revokeUserSubscription422Schema = HTTPValidationErrorSchema as unknown as ToZod<RevokeUserSubscription422>

export type RevokeUserSubscription422Schema = RevokeUserSubscription422

export const revokeUserSubscriptionMutationResponseSchema =
  revokeUserSubscription200Schema as unknown as ToZod<RevokeUserSubscriptionMutationResponse>

export type RevokeUserSubscriptionMutationResponseSchema = RevokeUserSubscriptionMutationResponse
