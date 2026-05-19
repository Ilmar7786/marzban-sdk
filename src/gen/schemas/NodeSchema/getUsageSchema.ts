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
}) as unknown as z.ZodType<GetUsageQueryParams>

/**
 * @description Successful Response
 */
export const getUsage200Schema = z.lazy(() => nodesUsageResponseSchema) as unknown as z.ZodType<GetUsage200>

/**
 * @description Unauthorized
 */
export const getUsage401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetUsage401>

/**
 * @description Forbidden
 */
export const getUsage403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetUsage403>

/**
 * @description Validation Error
 */
export const getUsage422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetUsage422>

export const getUsageQueryResponseSchema = z.lazy(
  () => getUsage200Schema
) as unknown as z.ZodType<GetUsageQueryResponse>
