import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  ResetUserDataUsage200,
  ResetUserDataUsage401,
  ResetUserDataUsage403,
  ResetUserDataUsage404,
  ResetUserDataUsage422,
  ResetUserDataUsageMutationResponse,
  ResetUserDataUsagePathParams,
} from '../../models/UserModel/ResetUserDataUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const resetUserDataUsagePathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<ResetUserDataUsagePathParams>

/**
 * @description Successful Response
 */
export const resetUserDataUsage200Schema = userResponseSchema as unknown as ToZod<ResetUserDataUsage200>

/**
 * @description Unauthorized
 */
export const resetUserDataUsage401Schema = unauthorizedSchema as unknown as ToZod<ResetUserDataUsage401>

/**
 * @description Forbidden
 */
export const resetUserDataUsage403Schema = forbiddenSchema as unknown as ToZod<ResetUserDataUsage403>

/**
 * @description Not found
 */
export const resetUserDataUsage404Schema = notFoundSchema as unknown as ToZod<ResetUserDataUsage404>

/**
 * @description Validation Error
 */
export const resetUserDataUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<ResetUserDataUsage422>

export const resetUserDataUsageMutationResponseSchema =
  resetUserDataUsage200Schema as unknown as ToZod<ResetUserDataUsageMutationResponse>
