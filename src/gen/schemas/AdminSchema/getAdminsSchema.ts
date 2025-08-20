import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetAdmins200,
  GetAdmins401,
  GetAdmins403,
  GetAdmins422,
  GetAdminsQueryParams,
  GetAdminsQueryResponse,
} from '../../models/AdminModel/GetAdmins.ts'
import { adminSchema } from '../adminSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const getAdminsQueryParamsSchema = z
  .object({
    offset: z.union([z.coerce.number().int(), z.null()]).optional(),
    limit: z.union([z.coerce.number().int(), z.null()]).optional(),
    username: z.union([z.string(), z.null()]).optional(),
  })
  .optional() as unknown as ToZod<GetAdminsQueryParams>

export type GetAdminsQueryParamsSchema = GetAdminsQueryParams

/**
 * @description Successful Response
 */
export const getAdmins200Schema = z.array(adminSchema) as unknown as ToZod<GetAdmins200>

export type GetAdmins200Schema = GetAdmins200

/**
 * @description Unauthorized
 */
export const getAdmins401Schema = unauthorizedSchema as unknown as ToZod<GetAdmins401>

export type GetAdmins401Schema = GetAdmins401

/**
 * @description Forbidden
 */
export const getAdmins403Schema = forbiddenSchema as unknown as ToZod<GetAdmins403>

export type GetAdmins403Schema = GetAdmins403

/**
 * @description Validation Error
 */
export const getAdmins422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetAdmins422>

export type GetAdmins422Schema = GetAdmins422

export const getAdminsQueryResponseSchema = getAdmins200Schema as unknown as ToZod<GetAdminsQueryResponse>

export type GetAdminsQueryResponseSchema = GetAdminsQueryResponse
