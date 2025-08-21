import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type {
  GetUsage200,
  GetUsage401,
  GetUsage403,
  GetUsage422,
  GetUsageQueryParams,
  GetUsageQueryResponse,
} from '../../models/NodeModel/GetUsage.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodesUsageResponseSchema } from '../nodesUsageResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const getUsageQueryParamsSchema = z.object({
  start: z.string().default(''),
  end: z.string().default(''),
}) as unknown as ToZod<GetUsageQueryParams>

/**
 * @description Successful Response
 */
export const getUsage200Schema = nodesUsageResponseSchema as unknown as ToZod<GetUsage200>

/**
 * @description Unauthorized
 */
export const getUsage401Schema = unauthorizedSchema as unknown as ToZod<GetUsage401>

/**
 * @description Forbidden
 */
export const getUsage403Schema = forbiddenSchema as unknown as ToZod<GetUsage403>

/**
 * @description Validation Error
 */
export const getUsage422Schema = HTTPValidationErrorSchema as unknown as ToZod<GetUsage422>

export const getUsageQueryResponseSchema = getUsage200Schema as unknown as ToZod<GetUsageQueryResponse>
