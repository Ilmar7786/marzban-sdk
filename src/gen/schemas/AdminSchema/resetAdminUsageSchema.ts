import { z } from 'zod/v4'

import type {
  ResetAdminUsage200,
  ResetAdminUsage401,
  ResetAdminUsage403,
  ResetAdminUsage422,
  ResetAdminUsageMutationResponse,
  ResetAdminUsagePathParams,
} from '../../models/AdminModel/ResetAdminUsage.ts'
import { adminSchema } from '../adminSchema.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const resetAdminUsagePathParamsSchema = z.object({
  username: z.string(),
}) as unknown as z.ZodType<ResetAdminUsagePathParams>

/**
 * @description Successful Response
 */
export const resetAdminUsage200Schema = z.lazy(() => adminSchema) as unknown as z.ZodType<ResetAdminUsage200>

/**
 * @description Unauthorized
 */
export const resetAdminUsage401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ResetAdminUsage401>

/**
 * @description Forbidden
 */
export const resetAdminUsage403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ResetAdminUsage403>

/**
 * @description Validation Error
 */
export const resetAdminUsage422Schema = z.lazy(
  () => HTTPValidationErrorSchema
) as unknown as z.ZodType<ResetAdminUsage422>

export const resetAdminUsageMutationResponseSchema = z.lazy(
  () => resetAdminUsage200Schema
) as unknown as z.ZodType<ResetAdminUsageMutationResponse>
