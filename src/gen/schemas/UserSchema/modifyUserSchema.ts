import { z } from 'zod/v4'

import type {
  ModifyUser200,
  ModifyUser400,
  ModifyUser401,
  ModifyUser403,
  ModifyUser404,
  ModifyUser422,
  ModifyUserMutationRequest,
  ModifyUserMutationResponse,
  ModifyUserPathParams,
} from '../../models/UserModel/ModifyUser.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPExceptionSchema } from '../HTTPExceptionSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userModifySchema } from '../userModifySchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const modifyUserPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<ModifyUserPathParams>

/**
 * @description Successful Response
 */
export const modifyUser200Schema = z.lazy(() => userResponseSchema) as unknown as z.ZodType<ModifyUser200>

/**
 * @description Bad request
 */
export const modifyUser400Schema = z.lazy(() => HTTPExceptionSchema) as unknown as z.ZodType<ModifyUser400>

/**
 * @description Unauthorized
 */
export const modifyUser401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ModifyUser401>

/**
 * @description Forbidden
 */
export const modifyUser403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ModifyUser403>

/**
 * @description Not found
 */
export const modifyUser404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<ModifyUser404>

/**
 * @description Validation Error
 */
export const modifyUser422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<ModifyUser422>

export const modifyUserMutationRequestSchema = z.lazy(
  () => userModifySchema
) as unknown as z.ZodType<ModifyUserMutationRequest>

export const modifyUserMutationResponseSchema = z.lazy(
  () => modifyUser200Schema
) as unknown as z.ZodType<ModifyUserMutationResponse>
