import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
export const resetUsersDataUsage200Schema = z.any() as unknown as ToZod<ResetUsersDataUsage200>

/**
 * @description Unauthorized
 */
export const resetUsersDataUsage401Schema = unauthorizedSchema as unknown as ToZod<ResetUsersDataUsage401>

/**
 * @description Forbidden
 */
export const resetUsersDataUsage403Schema = forbiddenSchema as unknown as ToZod<ResetUsersDataUsage403>

/**
 * @description Not found
 */
export const resetUsersDataUsage404Schema = notFoundSchema as unknown as ToZod<ResetUsersDataUsage404>

export const resetUsersDataUsageMutationResponseSchema =
  resetUsersDataUsage200Schema as unknown as ToZod<ResetUsersDataUsageMutationResponse>
