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
    offset: z.optional(z.union([z.coerce.number().int(), z.null()])),
    limit: z.optional(z.union([z.coerce.number().int(), z.null()])),
    username: z.optional(z.union([z.string(), z.null()])),
  })
  .optional() as unknown as z.ZodType<GetAdminsQueryParams>

/**
 * @description Successful Response
 */
export const getAdmins200Schema = z.array(z.lazy(() => adminSchema)) as unknown as z.ZodType<GetAdmins200>

/**
 * @description Unauthorized
 */
export const getAdmins401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetAdmins401>

/**
 * @description Forbidden
 */
export const getAdmins403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetAdmins403>

/**
 * @description Validation Error
 */
export const getAdmins422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetAdmins422>

export const getAdminsQueryResponseSchema = z.lazy(
  () => getAdmins200Schema
) as unknown as z.ZodType<GetAdminsQueryResponse>
