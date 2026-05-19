import { z } from 'zod/v4'

import type {
  GetNode200,
  GetNode401,
  GetNode403,
  GetNode422,
  GetNodePathParams,
  GetNodeQueryResponse,
} from '../../models/NodeModel/GetNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const getNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as z.ZodType<GetNodePathParams>

/**
 * @description Successful Response
 */
export const getNode200Schema = z.lazy(() => nodeResponseSchema) as unknown as z.ZodType<GetNode200>

/**
 * @description Unauthorized
 */
export const getNode401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetNode401>

/**
 * @description Forbidden
 */
export const getNode403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<GetNode403>

/**
 * @description Validation Error
 */
export const getNode422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<GetNode422>

export const getNodeQueryResponseSchema = z.lazy(() => getNode200Schema) as unknown as z.ZodType<GetNodeQueryResponse>
