import { z } from 'zod/v4'

import type {
  GetUsers200,
  GetUsers400,
  GetUsers401,
  GetUsers403,
  GetUsers404,
  GetUsers422,
  GetUsersQueryParams,
  GetUsersQueryResponse,
} from '../../models/UserModel/GetUsers.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPExceptionSchema } from '../HTTPExceptionSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { notFoundSchema } from '../notFoundSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'
import { usersResponseSchema } from '../usersResponseSchema.ts'
import { userStatusSchema } from '../userStatusSchema.ts'

export const getUsersQueryParamsSchema = z
  .object({
    offset: z.optional(z.coerce.number().int()),
    limit: z.optional(z.coerce.number().int()),
    username: z.optional(z.array(z.string())),
    search: z.optional(z.union([z.string(), z.null()])),
    admin: z.optional(z.union([z.array(z.string()), z.null()])),
    get status() {
      return userStatusSchema.optional()
    },
    sort: z.optional(z.string()),
  })
  .optional() as unknown as z.ZodType<GetUsersQueryParams>

/**
 * @description Successful Response
 */
export const getUsers200Schema = z.lazy(() => usersResponseSchema) as unknown as z.ZodType<GetUsers200>

/**
 * @description Bad request
 */
export const getUsers400Schema = z.lazy(() => HTTPExceptionSchema) as unknown as z.ZodType<GetUsers400>

/**
 * @description Unauthorized
 */
export const getUsers401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetUsers401>

/**
 * @description Forbidden
 */
export const getUsers403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetUsers403>

/**
 * @description Not found
 */
export const getUsers404Schema = z.lazy(() => notFoundSchema) as unknown as z.ZodType<GetUsers404>

/**
 * @description Validation Error
 */
export const getUsers422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetUsers422>

export const getUsersQueryResponseSchema = z.lazy(
  () => getUsers200Schema
) as unknown as z.ZodType<GetUsersQueryResponse>
