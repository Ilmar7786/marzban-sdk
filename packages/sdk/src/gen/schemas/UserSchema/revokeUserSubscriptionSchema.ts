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
}) as unknown as z.ZodType<RevokeUserSubscriptionPathParams>

/**
 * @description Successful Response
 */
export const revokeUserSubscription200Schema = z.lazy(
  () => userResponseSchema
) as unknown as z.ZodType<RevokeUserSubscription200>

/**
 * @description Unauthorized
 */
export const revokeUserSubscription401Schema = z.lazy(
  () => unauthorizedSchema
) as unknown as z.ZodType<RevokeUserSubscription401>

/**
 * @description Forbidden
 */
export const revokeUserSubscription403Schema = z.lazy(
  () => forbiddenSchema
) as unknown as z.ZodType<RevokeUserSubscription403>

/**
 * @description Not found
 */
export const revokeUserSubscription404Schema = z.lazy(
  () => notFoundSchema
) as unknown as z.ZodType<RevokeUserSubscription404>

/**
 * @description Validation Error
 */
export const revokeUserSubscription422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<RevokeUserSubscription422>

export const revokeUserSubscriptionMutationResponseSchema = z.lazy(
  () => revokeUserSubscription200Schema
) as unknown as z.ZodType<RevokeUserSubscriptionMutationResponse>
