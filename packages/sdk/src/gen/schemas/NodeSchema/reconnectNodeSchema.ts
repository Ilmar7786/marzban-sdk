import { z } from 'zod/v4'

import type {
  ReconnectNode200,
  ReconnectNode401,
  ReconnectNode403,
  ReconnectNode422,
  ReconnectNodeMutationResponse,
  ReconnectNodePathParams,
} from '../../models/NodeModel/ReconnectNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const reconnectNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as z.ZodType<ReconnectNodePathParams>

/**
 * @description Successful Response
 */
export const reconnectNode200Schema = z.any() as unknown as z.ZodType<ReconnectNode200>

/**
 * @description Unauthorized
 */
export const reconnectNode401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ReconnectNode401>

/**
 * @description Forbidden
 */
export const reconnectNode403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ReconnectNode403>

/**
 * @description Validation Error
 */
export const reconnectNode422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<ReconnectNode422>

export const reconnectNodeMutationResponseSchema = z.lazy(
  () => reconnectNode200Schema
) as unknown as z.ZodType<ReconnectNodeMutationResponse>
