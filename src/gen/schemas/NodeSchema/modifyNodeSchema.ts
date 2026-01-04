import { z } from 'zod/v4'

import type {
  ModifyNode200,
  ModifyNode401,
  ModifyNode403,
  ModifyNode422,
  ModifyNodeMutationRequest,
  ModifyNodeMutationResponse,
  ModifyNodePathParams,
} from '../../models/NodeModel/ModifyNode.ts'
import { forbiddenSchema } from '../forbiddenSchema.ts'
import { HTTPValidationErrorSchema } from '../HTTPValidationErrorSchema.ts'
import { nodeModifySchema } from '../nodeModifySchema.ts'
import { nodeResponseSchema } from '../nodeResponseSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

export const modifyNodePathParamsSchema = z.object({
  node_id: z.coerce.number().int(),
}) as unknown as z.ZodType<ModifyNodePathParams>

/**
 * @description Successful Response
 */
export const modifyNode200Schema = z.lazy(() => nodeResponseSchema) as unknown as z.ZodType<ModifyNode200>

/**
 * @description Unauthorized
 */
export const modifyNode401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<ModifyNode401>

/**
 * @description Forbidden
 */
export const modifyNode403Schema = z.lazy(() => forbiddenSchema) as unknown as z.ZodType<ModifyNode403>

/**
 * @description Validation Error
 */
export const modifyNode422Schema = z.lazy(() => HTTPValidationErrorSchema) as unknown as z.ZodType<ModifyNode422>

export const modifyNodeMutationRequestSchema = z.lazy(
  () => nodeModifySchema
) as unknown as z.ZodType<ModifyNodeMutationRequest>

export const modifyNodeMutationResponseSchema = z.lazy(
  () => modifyNode200Schema
) as unknown as z.ZodType<ModifyNodeMutationResponse>
