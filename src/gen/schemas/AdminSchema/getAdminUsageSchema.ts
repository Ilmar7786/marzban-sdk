import { z } from 'zod/v4'

import type {
  GetAdminUsage200,
  GetAdminUsage401,
  GetAdminUsage403,
  GetAdminUsage422,
  GetAdminUsagePathParams,
  GetAdminUsageQueryResponse,
} from '../../models/AdminModel/GetAdminUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const getAdminUsagePathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<GetAdminUsagePathParams>

/**
 * @description Successful Response
 */
export const getAdminUsage200Schema = z.int() as unknown as z.ZodType<GetAdminUsage200>

/**
 * @description Unauthorized
 */
export const getAdminUsage401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetAdminUsage401>

/**
 * @description Forbidden
 */
export const getAdminUsage403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetAdminUsage403>

/**
 * @description Validation Error
 */
export const getAdminUsage422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetAdminUsage422>

export const getAdminUsageQueryResponseSchema = z.lazy(
  () => getAdminUsage200Schema
) as unknown as z.ZodType<GetAdminUsageQueryResponse>
