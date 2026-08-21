import { z } from 'zod/v4'

import type {
  RemoveNode200,
  RemoveNode401,
  RemoveNode403,
  RemoveNode422,
  RemoveNodeMutationResponse,
  RemoveNodePathParams,
} from '../../models/NodeModel/RemoveNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const removeNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as z.ZodType<RemoveNodePathParams>

/**
 * @description Successful Response
 */
export const removeNode200Schema = z.any() as unknown as z.ZodType<RemoveNode200>

/**
 * @description Unauthorized
 */
export const removeNode401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<RemoveNode401>

/**
 * @description Forbidden
 */
export const removeNode403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<RemoveNode403>

/**
 * @description Validation Error
 */
export const removeNode422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<RemoveNode422>

export const removeNodeMutationResponseSchema = z.lazy(
  () => removeNode200Schema
) as unknown as z.ZodType<RemoveNodeMutationResponse>
