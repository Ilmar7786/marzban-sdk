import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetUserUsage200,
  GetUserUsage401,
  GetUserUsage403,
  GetUserUsage404,
  GetUserUsage422,
  GetUserUsagePathParams,
  GetUserUsageQueryParams,
  GetUserUsageQueryResponse,
} from '../../models/UserModel/GetUserUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userUsagesResponseSchema } from '../userUsagesResponseSchema.ts'

export const getUserUsagePathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<GetUserUsagePathParams>

export const getUserUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
}) as unknown as ToZod<GetUserUsageQueryParams>

/**
 * @description Successful Response
 */
export const getUserUsage200Schema = userUsagesResponseSchema as unknown as ToZod<GetUserUsage200>

/**
 * @description Unauthorized
 */
export const getUserUsage401Schema = unauthorizedSchema as unknown as ToZod<GetUserUsage401>

/**
 * @description Forbidden
 */
export const getUserUsage403Schema = forbiddenSchema as unknown as ToZod<GetUserUsage403>

/**
 * @description Not found
 */
export const getUserUsage404Schema = notFoundSchema as unknown as ToZod<GetUserUsage404>

/**
 * @description Validation Error
 */
export const getUserUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetUserUsage422>

export const getUserUsageQueryResponseSchema = getUserUsage200Schema as unknown as ToZod<GetUserUsageQueryResponse>
