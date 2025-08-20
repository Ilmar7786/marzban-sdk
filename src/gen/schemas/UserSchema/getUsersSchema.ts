import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
    offset: z.coerce.number().int().optional(),
    limit: z.coerce.number().int().optional(),
    username: z.array(z.string()).optional(),
    search: z.union([z.string(), z.null()]).optional(),
    admin: z.union([z.array(z.string()), z.null()]).optional(),
    get status() {
      return userStatusSchema.optional()
    },
    sort: z.string().optional(),
  })
  .optional() as unknown as ToZod<GetUsersQueryParams>

export type GetUsersQueryParamsSchema = GetUsersQueryParams

/**
 * @description Successful Response
 */
export const getUsers200Schema = usersResponseSchema as unknown as ToZod<GetUsers200>

export type GetUsers200Schema = GetUsers200

/**
 * @description Bad request
 */
export const getUsers400Schema = HTTPExceptionSchema as unknown as ToZod<GetUsers400>

export type GetUsers400Schema = GetUsers400

/**
 * @description Unauthorized
 */
export const getUsers401Schema = unauthorizedSchema as unknown as ToZod<GetUsers401>

export type GetUsers401Schema = GetUsers401

/**
 * @description Forbidden
 */
export const getUsers403Schema = forbiddenSchema as unknown as ToZod<GetUsers403>

export type GetUsers403Schema = GetUsers403

/**
 * @description Not found
 */
export const getUsers404Schema = notFoundSchema as unknown as ToZod<GetUsers404>

export type GetUsers404Schema = GetUsers404

/**
 * @description Validation Error
 */
export const getUsers422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetUsers422>

export type GetUsers422Schema = GetUsers422

export const getUsersQueryResponseSchema = getUsers200Schema as unknown as ToZod<GetUsersQueryResponse>

export type GetUsersQueryResponseSchema = GetUsersQueryResponse
