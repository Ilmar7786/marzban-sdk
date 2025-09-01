import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetExpiredUsers200,
  GetExpiredUsers401,
  GetExpiredUsers422,
  GetExpiredUsersQueryParams,
  GetExpiredUsersQueryResponse,
} from '../../models/UserModel/GetExpiredUsers.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const getExpiredUsersQueryParamsSchema = z
  .object({
    expired_after: z.union([z.iso.datetime({ local: true }), z.null()]).optional(),
    expired_before: z.union([z.iso.datetime({ local: true }), z.null()]).optional(),
  })
  .optional() as unknown as ToZod<GetExpiredUsersQueryParams>

/**
 * @description Successful Response
 */
export const getExpiredUsers200Schema = z.array(z.string()) as unknown as ToZod<GetExpiredUsers200>

/**
 * @description Unauthorized
 */
export const getExpiredUsers401Schema = unauthorizedSchema as unknown as ToZod<GetExpiredUsers401>

/**
 * @description Validation Error
 */
export const getExpiredUsers422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetExpiredUsers422>

export const getExpiredUsersQueryResponseSchema =
  getExpiredUsers200Schema as unknown as ToZod<GetExpiredUsersQueryResponse>
