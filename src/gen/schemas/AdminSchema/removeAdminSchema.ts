import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  RemoveAdmin200,
  RemoveAdmin401,
  RemoveAdmin403,
  RemoveAdmin422,
  RemoveAdminMutationResponse,
  RemoveAdminPathParams,
} from '../../models/AdminModel/RemoveAdmin.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const removeAdminPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<RemoveAdminPathParams>

/**
 * @description Successful Response
 */
export const removeAdmin200Schema = z.any() as unknown as ToZod<RemoveAdmin200>

/**
 * @description Unauthorized
 */
export const removeAdmin401Schema = unauthorizedSchema as unknown as ToZod<RemoveAdmin401>

/**
 * @description Forbidden
 */
export const removeAdmin403Schema = forbiddenSchema as unknown as ToZod<RemoveAdmin403>

/**
 * @description Validation Error
 */
export const removeAdmin422Schema = HTTPValidationErrorSchema as unknown as ToZod<RemoveAdmin422>

export const removeAdminMutationResponseSchema = removeAdmin200Schema as unknown as ToZod<RemoveAdminMutationResponse>
