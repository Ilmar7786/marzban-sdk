import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  RemoveUser200,
  RemoveUser401,
  RemoveUser403,
  RemoveUser404,
  RemoveUser422,
  RemoveUserMutationResponse,
  RemoveUserPathParams,
} from '../../models/UserModel/RemoveUser.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const removeUserPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as ToZod<RemoveUserPathParams>

/**
 * @description Successful Response
 */
export const removeUser200Schema = z.any() as unknown as ToZod<RemoveUser200>

/**
 * @description Unauthorized
 */
export const removeUser401Schema = unauthorizedSchema as unknown as ToZod<RemoveUser401>

/**
 * @description Forbidden
 */
export const removeUser403Schema = forbiddenSchema as unknown as ToZod<RemoveUser403>

/**
 * @description Not found
 */
export const removeUser404Schema = notFoundSchema as unknown as ToZod<RemoveUser404>

/**
 * @description Validation Error
 */
export const removeUser422Schema = HTTPValidationErrorSchema as unknown as ToZod<RemoveUser422>

export const removeUserMutationResponseSchema = removeUser200Schema as unknown as ToZod<RemoveUserMutationResponse>
