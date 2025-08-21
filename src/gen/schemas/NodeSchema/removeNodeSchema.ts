import type { ToZod } from '@kubb/plugin-zod/utils/v4'
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
}) as unknown as ToZod<RemoveNodePathParams>

/**
 * @description Successful Response
 */
export const removeNode200Schema = z.any() as unknown as ToZod<RemoveNode200>

/**
 * @description Unauthorized
 */
export const removeNode401Schema = unauthorizedSchema as unknown as ToZod<RemoveNode401>

/**
 * @description Forbidden
 */
export const removeNode403Schema = forbiddenSchema as unknown as ToZod<RemoveNode403>

/**
 * @description Validation Error
 */
export const removeNode422Schema = HTTPValidationErrorSchema as unknown as ToZod<RemoveNode422>

export const removeNodeMutationResponseSchema = removeNode200Schema as unknown as ToZod<RemoveNodeMutationResponse>
