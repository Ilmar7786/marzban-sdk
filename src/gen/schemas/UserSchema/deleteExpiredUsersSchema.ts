import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
    expired_after: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
    expired_before: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
  })
  .optional() as unknown as ToZod<DeleteExpiredUsersQueryParams>

/**
 * @description Successful Response
 */
export const deleteExpiredUsers200Schema = z.array(z.string()) as unknown as ToZod<DeleteExpiredUsers200>

/**
 * @description Unauthorized
 */
export const deleteExpiredUsers401Schema = unauthorizedSchema as unknown as ToZod<DeleteExpiredUsers401>

/**
 * @description Validation Error
 */
export const deleteExpiredUsers422Schema = HTTPValidationErrorSchema as unknown as ToZod<DeleteExpiredUsers422>

export const deleteExpiredUsersMutationResponseSchema =
  deleteExpiredUsers200Schema as unknown as ToZod<DeleteExpiredUsersMutationResponse>
