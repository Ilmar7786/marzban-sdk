import { z } from 'zod/v4'

import type {
  DeleteExpiredUsers200,
  DeleteExpiredUsers401,
  DeleteExpiredUsers422,
  DeleteExpiredUsersMutationResponse,
  DeleteExpiredUsersQueryParams,
} from '../../models/UserModel/DeleteExpiredUsers.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const deleteExpiredUsersQueryParamsSchema = z
  .object({
    expired_after: z.optional(z.union([z.iso.datetime({ local: true }), z.null()])),
    expired_before: z.optional(z.union([z.iso.datetime({ local: true }), z.null()])),
  })
  .optional() as unknown as z.ZodType<DeleteExpiredUsersQueryParams>

/**
 * @description Successful Response
 */
export const deleteExpiredUsers200Schema = z.array(z.string()) as unknown as z.ZodType<DeleteExpiredUsers200>

/**
 * @description Unauthorized
 */
export const deleteExpiredUsers401Schema = z.lazy(
  () => unauthorizedSchema
) as unknown as z.ZodType<DeleteExpiredUsers401>

/**
 * @description Validation Error
 */
export const deleteExpiredUsers422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<DeleteExpiredUsers422>

export const deleteExpiredUsersMutationResponseSchema = z.lazy(
  () => deleteExpiredUsers200Schema
) as unknown as z.ZodType<DeleteExpiredUsersMutationResponse>
