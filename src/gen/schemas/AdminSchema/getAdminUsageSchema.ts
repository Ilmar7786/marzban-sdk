import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<GetAdminUsagePathParams>

/**
 * @description Successful Response
 */
export const getAdminUsage200Schema = z.int() as unknown as ToZod<GetAdminUsage200>

/**
 * @description Unauthorized
 */
export const getAdminUsage401Schema = unauthorizedSchema as unknown as ToZod<GetAdminUsage401>

/**
 * @description Forbidden
 */
export const getAdminUsage403Schema = forbiddenSchema as unknown as ToZod<GetAdminUsage403>

/**
 * @description Validation Error
 */
export const getAdminUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetAdminUsage422>

export const getAdminUsageQueryResponseSchema = getAdminUsage200Schema as unknown as ToZod<GetAdminUsageQueryResponse>
