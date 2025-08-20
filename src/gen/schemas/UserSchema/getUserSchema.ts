import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<GetUserPathParams>

export type GetUserPathParamsSchema = GetUserPathParams

/**
 * @description Successful Response
 */
export const getUser200Schema = userResponseSchema as unknown as ToZod<GetUser200>

export type GetUser200Schema = GetUser200

/**
 * @description Unauthorized
 */
export const getUser401Schema = unauthorizedSchema as unknown as ToZod<GetUser401>

export type GetUser401Schema = GetUser401

/**
 * @description Forbidden
 */
export const getUser403Schema = forbiddenSchema as unknown as ToZod<GetUser403>

export type GetUser403Schema = GetUser403

/**
 * @description Not found
 */
export const getUser404Schema = notFoundSchema as unknown as ToZod<GetUser404>

export type GetUser404Schema = GetUser404

/**
 * @description Validation Error
 */
export const getUser422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetUser422>

export type GetUser422Schema = GetUser422

export const getUserQueryResponseSchema = getUser200Schema as unknown as ToZod<GetUserQueryResponse>

export type GetUserQueryResponseSchema = GetUserQueryResponse
