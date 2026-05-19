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
}) as unknown as z.ZodType<RemoveUserPathParams>

/**
 * @description Successful Response
 */
export const removeUser200Schema = z.any() as unknown as z.ZodType<RemoveUser200>

/**
 * @description Unauthorized
 */
export const removeUser401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<RemoveUser401>

/**
 * @description Forbidden
 */
export const removeUser403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<RemoveUser403>

/**
 * @description Not found
 */
export const removeUser404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<RemoveUser404>

/**
 * @description Validation Error
 */
export const removeUser422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<RemoveUser422>

export const removeUserMutationResponseSchema = z.lazy(
  () => removeUser200Schema
) as unknown as z.ZodType<RemoveUserMutationResponse>
