import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetUsersUsage200,
  GetUsersUsage401,
  GetUsersUsage422,
  GetUsersUsageQueryParams,
  GetUsersUsageQueryResponse,
} from '../../models/UserModel/GetUsersUsage.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { usersUsagesResponseSchema } from '../usersUsagesResponseSchema.ts'

export const getUsersUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
  admin: z.union([z.array(z.string()), z.null()]).optional(),
}) as unknown as ToZod<GetUsersUsageQueryParams>

export type GetUsersUsageQueryParamsSchema = GetUsersUsageQueryParams

/**
 * @description Successful Response
 */
export const getUsersUsage200Schema = usersUsagesResponseSchema as unknown as ToZod<GetUsersUsage200>

export type GetUsersUsage200Schema = GetUsersUsage200

/**
 * @description Unauthorized
 */
export const getUsersUsage401Schema = unauthorizedSchema as unknown as ToZod<GetUsersUsage401>

export type GetUsersUsage401Schema = GetUsersUsage401

/**
 * @description Validation Error
 */
export const getUsersUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetUsersUsage422>

export type GetUsersUsage422Schema = GetUsersUsage422

export const getUsersUsageQueryResponseSchema = getUsersUsage200Schema as unknown as ToZod<GetUsersUsageQueryResponse>

export type GetUsersUsageQueryResponseSchema = GetUsersUsageQueryResponse
