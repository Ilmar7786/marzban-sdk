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
    expired_after: z.optional(z.union([z.iso.datetime({ local: true }), z.null()])),
    expired_before: z.optional(z.union([z.iso.datetime({ local: true }), z.null()])),
  })
  .optional() as unknown as z.ZodType<GetExpiredUsersQueryParams>

/**
 * @description Successful Response
 */
export const getExpiredUsers200Schema = z.array(z.string()) as unknown as z.ZodType<GetExpiredUsers200>

/**
 * @description Unauthorized
 */
export const getExpiredUsers401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetExpiredUsers401>

/**
 * @description Validation Error
 */
export const getExpiredUsers422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<GetExpiredUsers422>

export const getExpiredUsersQueryResponseSchema = z.lazy(
  () => getExpiredUsers200Schema
) as unknown as z.ZodType<GetExpiredUsersQueryResponse>
