import { z } from 'zod/v4'

import type {
  GetUser200,
  GetUser401,
  GetUser403,
  GetUser404,
  GetUser422,
  GetUserPathParams,
  GetUserQueryResponse,
} from '../../models/UserModel/GetUser.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { userResponseSchema } from '../userResponseSchema.ts'

export const getUserPathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<GetUserPathParams>

/**
 * @description Successful Response
 */
export const getUser200Schema = z.lazy(() => userResponseSchema) as unknown as z.ZodType<GetUser200>

/**
 * @description Unauthorized
 */
export const getUser401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetUser401>

/**
 * @description Forbidden
 */
export const getUser403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetUser403>

/**
 * @description Not found
 */
export const getUser404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<GetUser404>

/**
 * @description Validation Error
 */
export const getUser422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetUser422>

export const getUserQueryResponseSchema = z.lazy(() => getUser200Schema) as unknown as z.ZodType<GetUserQueryResponse>
