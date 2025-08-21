import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<ResetAdminUsagePathParams>

/**
 * @description Successful Response
 */
export const resetAdminUsage200Schema = adminSchema as unknown as ToZod<ResetAdminUsage200>

/**
 * @description Unauthorized
 */
export const resetAdminUsage401Schema = unauthorizedSchema as unknown as ToZod<ResetAdminUsage401>

/**
 * @description Forbidden
 */
export const resetAdminUsage403Schema = forbiddenSchema as unknown as ToZod<ResetAdminUsage403>

/**
 * @description Validation Error
 */
export const resetAdminUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<ResetAdminUsage422>

export const resetAdminUsageMutationResponseSchema =
  resetAdminUsage200Schema as unknown as ToZod<ResetAdminUsageMutationResponse>
