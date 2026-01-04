import { z } from 'zod/v4'

import type {
  ResetUsersDataUsage200,
  ResetUsersDataUsage401,
  ResetUsersDataUsage403,
  ResetUsersDataUsage404,
  ResetUsersDataUsageMutationResponse,
} from '../../models/UserModel/ResetUsersDataUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const resetUsersDataUsage200Schema = z.any() as unknown as z.ZodType<ResetUsersDataUsage200>

/**
 * @description Unauthorized
 */
export const resetUsersDataUsage401Schema = z.lazy(
  () => unauthorizedSchema
) as unknown as z.ZodType<ResetUsersDataUsage401>

/**
 * @description Forbidden
 */
export const resetUsersDataUsage403Schema = z.lazy(
  () => forbiddenSchema
) as unknown as z.ZodType<ResetUsersDataUsage403>

/**
 * @description Not found
 */
export const resetUsersDataUsage404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<ResetUsersDataUsage404>

export const resetUsersDataUsageMutationResponseSchema = z.lazy(
  () => resetUsersDataUsage200Schema
) as unknown as z.ZodType<ResetUsersDataUsageMutationResponse>
